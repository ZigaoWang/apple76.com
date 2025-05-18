import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/oss';
import { openDb } from '@/lib/db';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'apple76admin';

async function generateThumbnail(file: File): Promise<{ buffer: Buffer; contentType: string }> {
  const buffer = await file.arrayBuffer();
  const contentType = file.type;

  if (contentType.startsWith('image/')) {
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
    const oss_key = `${collection}/${timestamp}-${originalName}`;
    const thumbnail_key = `${collection}/thumbnails/${timestamp}-${originalName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Generate thumbnail
      const { buffer: thumbnailBuffer } = await generateThumbnail(file);

      // Upload original file to OSS
      await client.put(oss_key, buffer, {
        headers: {
          'Content-Type': file.type,
          'Content-Length': buffer.length.toString(),
        },
      });

      // Upload thumbnail to OSS
      if (thumbnailBuffer.length > 0) {
        await client.put(thumbnail_key, thumbnailBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': thumbnailBuffer.length.toString(),
          },
        });
      }

      // Verify the uploads were successful
      try {
        await client.head(oss_key);
        if (thumbnailBuffer.length > 0) {
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
        source, author, buffer.length, notes, isYearUnknown ? 1 : 0, thumbnail_key
      );

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