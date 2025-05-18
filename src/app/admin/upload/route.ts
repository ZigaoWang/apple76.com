import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/oss';
import { openDb } from '@/lib/db';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { promisify } from 'util';
import ffmpeg from 'ffmpeg-static';
import { spawn } from 'child_process';
import path from 'path';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'apple76admin';

const unlinkAsync = promisify(fs.unlink);

// Helper to generate video thumbnail
async function generateVideoThumbnail(videoPath: string, thumbnailKey: string): Promise<string | null> {
  return new Promise((resolve) => {
    // Use a temporary directory for the thumbnail output
    const tempDir = '/tmp/thumbnails';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempThumbnailPath = path.join(tempDir, `${thumbnailKey}.png`);

    // Spawn ffmpeg process with more robust options
    const ffmpegProcess = spawn(ffmpeg as string, [
      '-i', videoPath,
      '-ss', '00:00:01', // Take frame at 1 second
      '-vframes', '1',
      '-vf', 'scale=320:-1', // Resize to 320 width, maintain aspect ratio
      '-y', // Overwrite output file if it exists
      '-loglevel', 'error', // Only show errors
      tempThumbnailPath
    ]);

    let errorOutput = '';

    ffmpegProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffmpegProcess.on('close', async (code) => {
      if (code === 0 && fs.existsSync(tempThumbnailPath)) {
        try {
          // Verify the thumbnail was generated and is valid
          const stats = fs.statSync(tempThumbnailPath);
          if (stats.size === 0) {
            console.error('Generated thumbnail is empty');
            resolve(null);
            return;
          }

          // Upload the generated thumbnail to OSS
          const fileStream = fs.createReadStream(tempThumbnailPath);
          await client.put(thumbnailKey, fileStream, {
            headers: {
              'Content-Type': 'image/png',
              'Content-Length': stats.size.toString(),
            },
          });
          
          // Clean up the temporary thumbnail file
          await unlinkAsync(tempThumbnailPath);
          resolve(thumbnailKey);
        } catch (uploadErr) {
          console.error('Error uploading video thumbnail to OSS:', uploadErr);
          // Clean up on error
          if (fs.existsSync(tempThumbnailPath)) {
            await unlinkAsync(tempThumbnailPath).catch(console.error);
          }
          resolve(null);
        }
      } else {
        console.error('Error generating video thumbnail:', {
          code,
          error: errorOutput
        });
        resolve(null);
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error('Error spawning ffmpeg process:', err);
      resolve(null);
    });
  });
}

async function generateThumbnail(file: File, tempFilePath?: string): Promise<{ buffer: Buffer; contentType: string }> {
  const contentType = file.type;

  if (contentType.startsWith('image/')) {
    const buffer = await file.arrayBuffer();
    try {
      // Generate a higher quality thumbnail for images
      const image = sharp(Buffer.from(buffer));
      const metadata = await image.metadata();
      
      // Calculate dimensions while maintaining aspect ratio
      const maxWidth = 800;
      const maxHeight = 1200; // Increased height to accommodate taller images
      const { width, height } = metadata;
      
      if (!width || !height) {
        throw new Error('Invalid image dimensions');
      }

      // Calculate new dimensions while maintaining aspect ratio
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      const newWidth = Math.round(width * ratio);
      const newHeight = Math.round(height * ratio);

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

      return { buffer: thumbnail, contentType: 'image/jpeg' };
    } catch (error) {
      console.log('Initial image processing failed:', error);
      
      try {
        // If direct processing fails, try to convert to JPEG first
        console.log('Attempting to convert image to JPEG...');
        const image = sharp(Buffer.from(buffer), { failOn: 'none' })
          .toFormat('jpeg')
          .jpeg({ quality: 90 });
        
        const metadata = await image.metadata();
        const { width, height } = metadata;
        
        if (!width || !height) {
          throw new Error('Invalid image dimensions after conversion');
        }

        const ratio = Math.min(800 / width, 1200 / height);
        const newWidth = Math.round(width * ratio);
        const newHeight = Math.round(height * ratio);

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

        return { buffer: thumbnail, contentType: 'image/jpeg' };
      } catch (conversionError) {
        console.log('Image conversion failed:', conversionError);
        return generateImagePlaceholder();
      }
    }
  } else if (contentType === 'application/pdf') {
    const buffer = await file.arrayBuffer();
    try {
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = pdfDoc.getPages();
      
      if (pages.length === 0) {
        throw new Error('PDF has no pages');
      }

      // Create a new PDF with just the first page
      const thumbnailPdf = await PDFDocument.create();
      const [copiedPage] = await thumbnailPdf.copyPages(pdfDoc, [0]);
      thumbnailPdf.addPage(copiedPage);

      // Convert the PDF to PNG using sharp
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
      return { buffer: thumbnail, contentType: 'image/jpeg' };
    } catch (error) {
      console.log('PDF thumbnail generation failed:', error);
      return generatePdfPlaceholder();
    }
  } else if (contentType.startsWith('video/') && tempFilePath) {
      // Generate thumbnail for video
      const thumbnailKey = `temp/${uuidv4()}.png`; // Use a temporary key for the thumbnail file
      const generatedThumbnailKey = await generateVideoThumbnail(tempFilePath, thumbnailKey);
      if (generatedThumbnailKey) {
          // Read the generated thumbnail from the temporary location
          const thumbnailBuffer = fs.readFileSync(path.join('/tmp/thumbnails', path.basename(thumbnailKey)));
          return { buffer: thumbnailBuffer, contentType: 'image/png' };
      } else {
          console.log('Video thumbnail generation failed.');
          return generatePdfPlaceholder(); // Fallback to placeholder
      }
  }

  // For other file types, return a placeholder image
  return generatePdfPlaceholder();
}

// Helper function to generate a generic image placeholder
async function generateImagePlaceholder(): Promise<{ buffer: Buffer; contentType: string }> {
  const placeholder = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 4,
      background: { r: 240, g: 240, b: 240, alpha: 1 }
    }
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  return { buffer: placeholder, contentType: 'image/jpeg' };
}

// Helper function to generate a PDF placeholder
async function generatePdfPlaceholder(): Promise<{ buffer: Buffer; contentType: string }> {
  const placeholder = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 4,
      background: { r: 240, g: 240, b: 240, alpha: 1 }
    }
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  return { buffer: placeholder, contentType: 'image/jpeg' };
}

export async function POST(req: NextRequest) {
  try {
    // Check admin auth
    const cookie = req.cookies.get('admin_auth');
    if (cookie?.value !== ADMIN_PASSWORD) {
      if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return NextResponse.json({ success: false, error: 'auth' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin?error=auth', req.url));
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return NextResponse.json({ success: false, error: 'nofile' }, { status: 400 });
      }
      return NextResponse.redirect(new URL('/admin?error=nofile', req.url));
    }

    // Get all form fields
    const title = form.get('title')?.toString() || '';
    const yearStr = form.get('year')?.toString();
    const isYearUnknown = form.get('is_year_unknown') === 'true';
    const year = isYearUnknown ? null : parseInt(yearStr || '0', 10);
    const collection = form.get('collection')?.toString() || '';
    const original_link = form.get('original_link')?.toString() || '';
    const description = form.get('description')?.toString() || '';
    const tags = form.get('tags')?.toString() || '';
    const source = form.get('source')?.toString() || '';
    const author = form.get('author')?.toString() || '';
    const notes = form.get('notes')?.toString() || '';

    // Generate a unique filename to prevent collisions
    const timestamp = Date.now();
    const originalName = file.name;
    const fileExtension = path.extname(originalName);
    const baseName = path.basename(originalName, fileExtension);
    const uniqueId = uuidv4();

    const oss_key = `${collection}/${baseName}-${timestamp}-${uniqueId}${fileExtension}`;
    const thumbnail_key = `${collection}/thumbnails/${baseName}-${timestamp}-${uniqueId}.png`; // Ensure thumbnail is always png

    // Create a temporary file to process the upload
    const tempDir = '/tmp/uploads';
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `${timestamp}-${uniqueId}${fileExtension}`);
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));

    let thumbnailBuffer: Buffer | null = null;
    let thumbnailContentType = 'image/jpeg';

    try {
      // Generate thumbnail
      if (file.type.startsWith('video/')) {
          const generatedThumbnailKey = await generateVideoThumbnail(tempFilePath, thumbnail_key);
          if (generatedThumbnailKey) {
              // Video thumbnail generation handles S3 upload internally
              // No need to read buffer and upload again here
              thumbnailBuffer = Buffer.from('placeholder'); // Just a non-empty buffer to indicate success
          }
      } else {
          const { buffer, contentType } = await generateThumbnail(file, tempFilePath); // Pass file object for non-video
          thumbnailBuffer = buffer;
          thumbnailContentType = contentType;
      }

      // Upload original file to OSS from temp location
      const fileStream = fs.createReadStream(tempFilePath);
      await client.put(oss_key, fileStream, {
        headers: {
          'Content-Type': file.type,
          'Content-Length': fs.statSync(tempFilePath).size.toString(),
        },
      });

      // Upload thumbnail to OSS (only if not video, as video handler uploads itself)
      if (thumbnailBuffer && thumbnailBuffer.length > 0) {
        await client.put(thumbnail_key, thumbnailBuffer, {
          headers: {
            'Content-Type': thumbnailContentType,
            'Content-Length': thumbnailBuffer.length.toString(),
          },
        });
      }

      // Verify the uploads were successful
      try {
        await client.head(oss_key);
        if (thumbnailBuffer && thumbnailBuffer.length > 0) {
          await client.head(thumbnail_key);
        }
      } catch (error) {
        console.error('OSS verification error:', error);
        throw new Error('Failed to verify file upload');
      }

      // Insert metadata into DB
      const db = await openDb();
      await db.run(
        `INSERT OR IGNORE INTO items (
          title, year, collection, original_link, description, tags, oss_key,
          source, author, file_size, notes, is_year_unknown, thumbnail_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        title, year, collection, original_link, description, tags, oss_key,
        source, author, fs.statSync(tempFilePath).size, notes, isYearUnknown ? 1 : 0, thumbnail_key
      );

      // Clean up temporary file
      await unlinkAsync(tempFilePath);
      // Clean up temporary thumbnail file if it exists (for video)
      if (file.type.startsWith('video/') && fs.existsSync(path.join('/tmp/thumbnails', path.basename(thumbnail_key)))) {
          await unlinkAsync(path.join('/tmp/thumbnails', path.basename(thumbnail_key)));
      }

      if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return NextResponse.json({ success: true });
      }
      return NextResponse.redirect(new URL('/admin', req.url));
    } catch (error) {
      console.error('OSS upload error:', error);
      
      // Try to clean up if the upload failed
      try {
        await client.delete(oss_key);
        await client.delete(thumbnail_key);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      // Clean up temporary file if it exists
      if (fs.existsSync(tempFilePath)) {
          await unlinkAsync(tempFilePath);
      }
      // Clean up temporary thumbnail file if it exists (for video)
      if (file.type.startsWith('video/') && fs.existsSync(path.join('/tmp/thumbnails', path.basename(thumbnail_key)))) {
          await unlinkAsync(path.join('/tmp/thumbnails', path.basename(thumbnail_key)));
      }

      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return NextResponse.json({ 
          success: false, 
          error: 'upload_failed',
          message: errorMessage 
        }, { status: 500 });
      }
      return NextResponse.redirect(new URL(`/admin?error=upload_failed&message=${encodeURIComponent(errorMessage)}`, req.url));
    }
  } catch (error) {
    console.error('Upload error:', error);
    if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
      return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/admin?error=server_error', req.url));
  }
}

// Set body-parser to false for formidable to handle file parsing
export const config = {
  api: {
    bodyParser: false,
  },
}; 