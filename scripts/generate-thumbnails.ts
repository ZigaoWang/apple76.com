import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('OSS_REGION:', process.env.OSS_REGION);
console.log('OSS_ACCESS_KEY_ID:', process.env.OSS_ACCESS_KEY_ID ? '[SET]' : '[NOT SET]');
console.log('OSS_ACCESS_KEY_SECRET:', process.env.OSS_ACCESS_KEY_SECRET ? '[SET]' : '[NOT SET]');
console.log('OSS_BUCKET:', process.env.OSS_BUCKET);
console.log('OSS_ENDPOINT:', process.env.OSS_ENDPOINT);

import { openDb } from '../src/lib/db';
import sharp from 'sharp';
import path from 'path';
import OSS from 'ali-oss';
import { PDFDocument } from 'pdf-lib';
import ffmpegPath from 'ffmpeg-static'; // Use a different name to avoid conflict
import { spawn } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

// Initialize OSS client
const client = new OSS({
  region: process.env.OSS_REGION!,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  bucket: process.env.OSS_BUCKET!,
  endpoint: process.env.OSS_ENDPOINT!,
  timeout: 60000, // 60 seconds timeout
  secure: true, // Use HTTPS
});

interface Item {
  id: number;
  oss_key: string;
  title: string;
  collection: string;
}

async function generateVideoThumbnail(videoPath: string, thumbnailKey: string): Promise<string | null> {
  console.log(`Attempting to generate video thumbnail for ${videoPath} at key ${thumbnailKey}`);
  return new Promise((resolve) => {
    const tempDir = '/tmp/thumbnails';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempThumbnailPath = path.join(tempDir, `${path.basename(thumbnailKey)}`); // Use basename for temp file

    console.log(`FFmpeg path: ${ffmpegPath}`);
    console.log(`Input video path: ${videoPath}`);
    console.log(`Output thumbnail temp path: ${tempThumbnailPath}`);

    const args = [
      '-i', videoPath,
      '-ss', '00:00:01', // Take frame at 1 second
      '-vframes', '1',
      '-vf', 'scale=320:-1', // Resize to 320 width, maintain aspect ratio
      '-y', // Overwrite output file if it exists
      '-loglevel', 'error', // Only show errors
      tempThumbnailPath
    ];
    console.log(`FFmpeg arguments: ${args.join(' ')}`);

    const ffmpegProcess = spawn(ffmpegPath as string, args);

    let errorOutput = '';

    ffmpegProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffmpegProcess.on('close', async (code) => {
      console.log(`FFmpeg process exited with code ${code}`);
      if (code === 0 && fs.existsSync(tempThumbnailPath)) {
        try {
          const stats = fs.statSync(tempThumbnailPath);
          if (stats.size === 0) {
            console.error('Generated thumbnail is empty');
            resolve(null);
            return;
          }

          console.log(`Generated thumbnail at ${tempThumbnailPath} with size ${stats.size}`);

          const fileStream = fs.createReadStream(tempThumbnailPath);
          console.log(`Uploading thumbnail to OSS at key: ${thumbnailKey}`);
          await client.put(thumbnailKey, fileStream, {
            headers: {
              'Content-Type': 'image/png',
              'Content-Length': stats.size.toString(),
            },
          });
          
          console.log('Thumbnail uploaded successfully. Cleaning up temp file.');
          await unlinkAsync(tempThumbnailPath);
          resolve(thumbnailKey);
        } catch (uploadErr) {
          console.error('Error uploading video thumbnail to OSS:', uploadErr);
          if (fs.existsSync(tempThumbnailPath)) {
            await unlinkAsync(tempThumbnailPath).catch(console.error);
          }
          resolve(null);
        }
      } else {
        console.error('Error generating video thumbnail:', {
          code,
          error: errorOutput.trim()
        });
        if (fs.existsSync(tempThumbnailPath)) {
            await unlinkAsync(tempThumbnailPath).catch(console.error);
        }
        resolve(null);
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error('Error spawning ffmpeg process:', err);
      resolve(null);
    });
  });
}

async function generateThumbnail(item: Item): Promise<string | null> {
  try {
    const tempDir = '/tmp/uploads';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    console.log(`Downloading ${item.oss_key} from OSS...`);
    // Download the file from OSS
    const result = await client.get(item.oss_key);
    const buffer = await result.content;
    const tempFilePath = path.join(tempDir, path.basename(item.oss_key));
    fs.writeFileSync(tempFilePath, buffer);
    console.log(`Downloaded to temporary file: ${tempFilePath}`);

    try {
      if (item.oss_key.toLowerCase().endsWith('.mp4')) {
        // Generate video thumbnail
        const thumbnailKey = `${path.dirname(item.oss_key)}/thumbnails/${path.basename(item.oss_key, '.mp4')}.png`;
        console.log('File is MP4. Calling generateVideoThumbnail...');
        const thumbnail = await generateVideoThumbnail(tempFilePath, thumbnailKey);
        return thumbnail;
      } else if (item.oss_key.toLowerCase().endsWith('.pdf')) {
        console.log('File is PDF. Generating PDF thumbnail...');
        // Generate PDF thumbnail
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();
        if (pages.length === 0) {
          throw new Error('PDF has no pages');
        }

        const thumbnailPdf = await PDFDocument.create();
        const [copiedPage] = await thumbnailPdf.copyPages(pdfDoc, [0]);
        thumbnailPdf.addPage(copiedPage);

        const pdfBuffer = await thumbnailPdf.save();
        const image = sharp(pdfBuffer, { density: 300 })
          .resize(800, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ 
            quality: 90,
            mozjpeg: true
          });

        const thumbnail = await image.toBuffer();
        const thumbnailKey = `${path.dirname(item.oss_key)}/thumbnails/${path.basename(item.oss_key, '.pdf')}.jpg`;
        console.log(`Uploading PDF thumbnail to OSS at key: ${thumbnailKey}`);
        await client.put(thumbnailKey, thumbnail, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': thumbnail.length.toString(),
          },
        });
        return thumbnailKey;
      } else if (item.oss_key.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        console.log('File is image. Generating image thumbnail...');
        // Generate image thumbnail
        const image = sharp(buffer);
        const metadata = await image.metadata();
        
        if (!metadata.width || !metadata.height) {
          throw new Error('Invalid image dimensions');
        }

        const ratio = Math.min(800 / metadata.width, 1200 / metadata.height);
        const newWidth = Math.round(metadata.width * ratio);
        const newHeight = Math.round(metadata.height * ratio);

        const thumbnail = await image
          .resize(newWidth, newHeight, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ 
            quality: 90,
            mozjpeg: true
          })
          .toBuffer();

        const thumbnailKey = `${path.dirname(item.oss_key)}/thumbnails/${path.basename(item.oss_key, path.extname(item.oss_key))}.jpg`;
        console.log(`Uploading image thumbnail to OSS at key: ${thumbnailKey}`);
        await client.put(thumbnailKey, thumbnail, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': thumbnail.length.toString(),
          },
        });
        return thumbnailKey;
      } else {
        console.log('File type not supported for thumbnail generation.');
        return null; // File type not supported
      }
    } finally {
      // Clean up temporary file
      console.log(`Cleaning up temporary file: ${tempFilePath}`);
      if (fs.existsSync(tempFilePath)) {
        await unlinkAsync(tempFilePath);
      }
    }
  } catch (error) {
    console.error(`Error generating thumbnail for ${item.oss_key}:`, error);
  }
  return null;
}

async function main() {
  const db = await openDb();
  // Select items without thumbnails or where thumbnail generation might have failed (e.g., empty thumbnail)
  const items = await db.all('SELECT * FROM items WHERE thumbnail_key IS NULL');
  console.log(`Found ${items.length} items without thumbnails`);

  for (const item of items) {
    console.log(`Processing ${item.oss_key}...`);
    const thumbnailKey = await generateThumbnail(item);
    if (thumbnailKey) {
      // Verify the thumbnail exists in OSS before updating the DB
      try {
          await client.head(thumbnailKey);
          await db.run('UPDATE items SET thumbnail_key = ? WHERE id = ?', thumbnailKey, item.id);
          console.log(`Generated and verified thumbnail for ${item.oss_key}: ${thumbnailKey}`);
      } catch (ossError) {
          console.error(`Failed to verify thumbnail in OSS for ${item.oss_key} at key ${thumbnailKey}:`, ossError);
          // Optionally, clear the thumbnail_key in DB if verification fails, so it's re-attempted
          // await db.run('UPDATE items SET thumbnail_key = NULL WHERE id = ?', item.id);
      }
    } else {
      console.log(`Failed to generate thumbnail for ${item.oss_key}`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

main().catch(console.error); 