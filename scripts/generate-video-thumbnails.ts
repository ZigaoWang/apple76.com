// For direct compilation without tsconfig
// @ts-ignore
import * as dotenv from 'dotenv';
// @ts-ignore
import * as path from 'path';
// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as sqlite3 from 'sqlite3';
// @ts-ignore
import { open } from 'sqlite';
// @ts-ignore
import * as OSS from 'ali-oss';
// @ts-ignore
import { execSync } from 'child_process';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configure OSS client
const ossClient = new OSS.default({
  region: process.env.OSS_REGION || '',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.OSS_BUCKET || '',
  secure: true,
  timeout: 120000, // 2 minutes
});

async function main() {
  console.log('Video thumbnail generation script starting...');
  console.log('Current working directory:', process.cwd());
  
  // Open database connection
  const dbPath = path.join(process.cwd(), 'apple76.db');
  console.log('Database path:', dbPath);
  
  if (!fs.existsSync(dbPath)) {
    console.error(`Database file not found at ${dbPath}`);
    return;
  }
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Create temp directory if it doesn't exist
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  try {
    // Query for video files without thumbnails
    const videoItems = await db.all(`
      SELECT id, title, oss_key, thumbnail_key 
      FROM items 
      WHERE (
        oss_key LIKE '%.mp4' OR
        oss_key LIKE '%.mov' OR
        oss_key LIKE '%.webm'
      ) AND (
        thumbnail_key IS NULL OR 
        thumbnail_key = ''
      )
      LIMIT 10
    `);

    console.log(`Found ${videoItems.length} video items without thumbnails`);

    if (videoItems.length === 0) {
      console.log('No videos to process');
      return;
    }

    for (const item of videoItems) {
      try {
        console.log(`Processing: ${item.title} (ID: ${item.id})`);
        
        // Download the video file to temp directory
        const videoFileName = path.basename(item.oss_key);
        const localVideoPath = path.join(tempDir, videoFileName);
        
        console.log(`Downloading ${item.oss_key}...`);
        const result = await ossClient.get(item.oss_key);
        fs.writeFileSync(localVideoPath, result.content);
        
        // Generate a thumbnail image using ffmpeg at the 3-second mark
        const thumbnailFileName = videoFileName.replace(/\.[^/.]+$/, '') + '_thumbnail.jpg';
        const localThumbnailPath = path.join(tempDir, thumbnailFileName);
        
        console.log(`Generating thumbnail for ${videoFileName}...`);
        try {
          execSync(`ffmpeg -y -i "${localVideoPath}" -ss 00:00:03 -vframes 1 -q:v 2 "${localThumbnailPath}"`, {
            stdio: 'inherit'
          });
        } catch (error: unknown) {
          const ffmpegError = error as Error;
          console.error(`FFmpeg error: ${ffmpegError.message}`);
          console.log('Trying alternative approach...');
          execSync(`ffmpeg -y -i "${localVideoPath}" -ss 00:00:01 -vframes 1 -q:v 2 "${localThumbnailPath}"`, {
            stdio: 'inherit'
          });
        }

        // Upload the thumbnail to OSS
        const thumbnailKey = `thumbnails/videos/${item.id}_${thumbnailFileName}`;
        console.log(`Uploading thumbnail to ${thumbnailKey}...`);
        
        await ossClient.put(thumbnailKey, localThumbnailPath);
        
        // Update the database with the thumbnail key
        await db.run(
          'UPDATE items SET thumbnail_key = ? WHERE id = ?',
          thumbnailKey,
          item.id
        );
        
        console.log(`Successfully processed item ${item.id}`);
        
        // Clean up local files
        fs.unlinkSync(localVideoPath);
        fs.unlinkSync(localThumbnailPath);
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
      }
    }

    console.log('Video thumbnail generation completed');
  } catch (error) {
    console.error('Error in thumbnail generation process:', error);
  } finally {
    // Close database connection
    await db.close();
    
    // Clean up temp directory
    if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
      fs.rmdirSync(tempDir);
    }
  }
}

main()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 