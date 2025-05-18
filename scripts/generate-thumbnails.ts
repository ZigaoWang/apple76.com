import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { openDb } from '../src/lib/db';
import client from '../src/lib/oss';
import sharp from 'sharp';
import path from 'path';

async function generateThumbnail(buffer: Buffer, fileType: string): Promise<Buffer> {
  if (fileType === 'application/pdf') {
    // For PDFs, we'll use a default PDF thumbnail image
    // You might want to use pdf-preview or similar to generate actual PDF thumbnails
    return Buffer.from(''); // Placeholder for now
  }

  // For images, create a thumbnail
  return sharp(buffer)
    .resize(400, 300, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

async function main() {
  console.log('Starting thumbnail generation...');
  
  const db = await openDb();
  
  // Get all items without thumbnails
  const items = await db.all('SELECT * FROM items WHERE thumbnail_key IS NULL');
  console.log(`Found ${items.length} items without thumbnails`);

  for (const item of items) {
    try {
      console.log(`Processing item ${item.id}: ${item.title}`);
      
      // Get the original file from OSS
      const result = await client.get(item.oss_key);
      const buffer = await result.content;
      const contentType = (result.res.headers as Record<string, string>)['content-type'] || 'application/octet-stream';

      // Generate thumbnail
      const thumbnailBuffer = await generateThumbnail(buffer, contentType);
      
      if (thumbnailBuffer.length === 0) {
        console.log(`Skipping item ${item.id} - no thumbnail generated`);
        continue;
      }

      // Create thumbnail key
      const thumbnail_key = `${path.dirname(item.oss_key)}/thumbnails/${path.basename(item.oss_key)}`;

      // Upload thumbnail to OSS
      await client.put(thumbnail_key, thumbnailBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': thumbnailBuffer.length.toString(),
        },
      });

      // Update database
      await db.run('UPDATE items SET thumbnail_key = ? WHERE id = ?', thumbnail_key, item.id);
      
      console.log(`Successfully generated thumbnail for item ${item.id}`);
    } catch (error) {
      console.error(`Error processing item ${item.id}:`, error);
    }
  }

  console.log('Thumbnail generation complete!');
  await db.close();
}

main().catch(console.error); 