#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import { openDb } from '../src/lib/db.js';
import sharp from 'sharp';
import OSS from 'ali-oss';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('Checking environment variables...');

// Check required environment variables
const requiredEnvVars = [
  'OSS_REGION',
  'OSS_ACCESS_KEY_ID',
  'OSS_ACCESS_KEY_SECRET',
  'OSS_BUCKET'
];

let missingVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please ensure these variables are set in your .env.local file');
  process.exit(1);
}

// Configure OSS client
const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
  secure: true
});

async function generatePDFThumbnail(localFilePath: string): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    // Use dynamic import for pdf-to-img
    const { pdf } = await import('pdf-to-img');
    
    // Read the file
    const buffer = fs.readFileSync(localFilePath);
    
    // Use pdf-to-img to generate thumbnail for PDFs
    // We'll get the first page as a PNG buffer
    const document = await pdf(buffer, { scale: 1.0 }); // scale 1.0 for a reasonable size
    const firstPageImage = await document.getPage(1);

    // Convert the PNG buffer to JPEG and resize/optimize if needed
    const thumbnail = await sharp(firstPageImage)
      .resize(800, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality: 90,
        mozjpeg: true
      })
      .toBuffer();

    return { buffer: thumbnail, contentType: 'image/jpeg' };
  } catch (pdfError) {
    console.error(`Error generating PDF thumbnail:`, pdfError);
    // Fallback to a simple placeholder
    return generatePlaceholder('PDF');
  }
}

async function generateVideoThumbnail(localFilePath: string): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    // Create a temp directory for the thumbnail
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Temporary path for the extracted thumbnail
    const thumbnailPath = path.join(tempDir, `thumb_${Date.now()}.jpg`);
    
    try {
      // Try to extract a frame at 3 seconds
      console.log(`Extracting frame at 3 seconds from ${localFilePath}...`);
      execSync(`ffmpeg -y -i "${localFilePath}" -ss 00:00:03 -vframes 1 -q:v 2 -vf "scale=640:-1" "${thumbnailPath}"`, {
        stdio: 'inherit'
      });
    } catch (_error) {
      console.error(`FFmpeg error at 3 seconds, trying alternative timestamp...`);
      try {
        // Try at 1 second
        execSync(`ffmpeg -y -i "${localFilePath}" -ss 00:00:01 -vframes 1 -q:v 2 -vf "scale=640:-1" "${thumbnailPath}"`, {
          stdio: 'inherit'
        });
      } catch (_secondError) {
        // Try the first frame
        execSync(`ffmpeg -y -i "${localFilePath}" -vframes 1 -q:v 2 -vf "scale=640:-1" "${thumbnailPath}"`, {
          stdio: 'inherit'
        });
      }
    }
    
    // Read the generated thumbnail
    const thumbnailBuffer = fs.readFileSync(thumbnailPath);
    
    // Clean up the temporary file
    fs.unlinkSync(thumbnailPath);
    
    return { buffer: thumbnailBuffer, contentType: 'image/jpeg' };
  } catch (error) {
    console.error(`Error generating video thumbnail:`, error);
    return generatePlaceholder('VIDEO');
  }
}

async function generatePlaceholder(type = 'FILE'): Promise<{ buffer: Buffer; contentType: string }> {
  const placeholderText = type === 'PDF' ? 'PDF' : type === 'VIDEO' ? 'VIDEO' : 'FILE';
  
  const placeholder = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 4,
      background: { r: 240, g: 240, b: 240, alpha: 1 }
    }
  })
  .composite([{
    input: {
      text: {
        text: placeholderText,
        font: 'sans',
        rgba: true
      }
    },
    gravity: 'center'
  }])
  .jpeg({ quality: 90 })
  .toBuffer();

  return { buffer: placeholder, contentType: 'image/jpeg' };
}

async function downloadFile(ossKey: string): Promise<string> {
  // Create temporary directory if it doesn't exist
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Create a local path for the file
  const localFilePath = path.join(tempDir, path.basename(ossKey));

  // Download the file from OSS
  const result = await ossClient.get(ossKey);
  fs.writeFileSync(localFilePath, result.content);

  return localFilePath;
}

async function main() {
  console.log('Thumbnail generation script starting...');
  
  // Initialize the database connection
  const db = await openDb();
  
  // First, fix any items where the thumbnail is set to the original file (especially for PDFs)
  console.log('Fixing incorrect thumbnail references...');
  await db.run(`
    UPDATE items 
    SET thumbnail_key = NULL 
    WHERE thumbnail_key = oss_key
  `);
  
  // Get all items without thumbnails - fix column selection to remove content_type
  const items = await db.all(`
    SELECT id, title, oss_key 
    FROM items 
    WHERE thumbnail_key IS NULL
  `);
  
  console.log(`Found ${items.length} items without thumbnails to process`);
  
  // Create temporary directory for downloads
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Process each item
  for (const item of items) {
    try {
      console.log(`Processing item ${item.id}: ${item.title}...`);
      
      // Determine file type
      const ossKey = item.oss_key;
      const isPDF = ossKey.toLowerCase().endsWith('.pdf');
      const isVideo = ossKey.toLowerCase().endsWith('.mp4') || 
                     ossKey.toLowerCase().endsWith('.mov') || 
                     ossKey.toLowerCase().endsWith('.webm');
      
      // Skip if not a PDF or video (they should have regular image thumbnails already)
      if (!isPDF && !isVideo) {
        console.log(`Skipping item ${item.id}, not a PDF or video`);
        continue;
      }
      
      // Download the file from OSS to local temp directory
      console.log(`Downloading ${ossKey}...`);
      const localFilePath = await downloadFile(ossKey);
      
      // Generate thumbnail based on file type
      let thumbnailResult;
      if (isPDF) {
        console.log(`Generating PDF thumbnail for ${item.id}...`);
        thumbnailResult = await generatePDFThumbnail(localFilePath);
      } else if (isVideo) {
        console.log(`Generating video thumbnail for ${item.id}...`);
        thumbnailResult = await generateVideoThumbnail(localFilePath);
      } else {
        // Should never reach here because of the skip above
        console.log(`Unknown file type for ${item.id}, skipping...`);
        fs.unlinkSync(localFilePath); // Clean up
        continue;
      }
      
      // Create a filename for the thumbnail
      const fileExt = path.extname(ossKey);
      const fileName = path.basename(ossKey, fileExt);
      const thumbnailFileName = `${fileName}_thumb.jpg`;
      
      // Upload the thumbnail to OSS
      const thumbnailKey = isPDF 
        ? `thumbnails/pdfs/${item.id}_${thumbnailFileName}`
        : `thumbnails/videos/${item.id}_${thumbnailFileName}`;
      
      console.log(`Uploading thumbnail to ${thumbnailKey}...`);
      
      // Create a temporary file for the thumbnail
      const tempThumbnailPath = path.join(tempDir, thumbnailFileName);
      fs.writeFileSync(tempThumbnailPath, thumbnailResult.buffer);
      
      // Upload to OSS
      await ossClient.put(thumbnailKey, tempThumbnailPath);
      
      // Update the database with the thumbnail key
      await db.run(
        'UPDATE items SET thumbnail_key = ? WHERE id = ?',
        thumbnailKey,
        item.id
      );
      
      console.log(`✅ Successfully processed item ${item.id}`);
      
      // Clean up local files
      fs.unlinkSync(localFilePath);
      fs.unlinkSync(tempThumbnailPath);
      
    } catch (error) {
      console.error(`Error processing item ${item.id}:`, error);
    }
  }
  
  console.log('Thumbnail generation completed!');
  
  // Close the database connection
  await db.close();
}

main().catch(error => {
  console.error('Error in thumbnail generation script:', error);
  process.exit(1);
}); 