'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const OSS = require('ali-oss');
const { execSync } = require('child_process');

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

// Try .env.local first, then fall back to .env
if (fs.existsSync(envLocalPath)) {
  console.log(`Loading environment variables from: ${envLocalPath}`);
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env.local or .env file found, using existing environment variables');
}

// Check for required environment variables
const requiredEnvVars = ['OSS_REGION', 'OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET', 'OSS_BUCKET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('\n❌ Error: Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  
  console.error('\nPlease create or update your .env file with the following variables:');
  console.error(`
# Alibaba Cloud OSS credentials
OSS_REGION=your-oss-region
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET=your-bucket-name
  `);
  
  console.error('You can get these credentials from your Alibaba Cloud console.');
  process.exit(1);
}

// Configure OSS client
console.log('Initializing OSS client...');
const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
  secure: true,
  timeout: 120000, // 2 minutes
});

async function main() {
  console.log('Video thumbnail fix script starting...');
  console.log('Current working directory:', process.cwd());
  
  // Check for ffmpeg
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
  } catch (_) {
    console.error('\n❌ Error: ffmpeg is not installed or not in PATH');
    console.error('Please install ffmpeg:');
    console.error('  - macOS: brew install ffmpeg');
    console.error('  - Ubuntu/Debian: sudo apt install ffmpeg');
    console.error('  - Windows: download from https://ffmpeg.org/download.html');
    process.exit(1);
  }
  
  // Open database connection
  const dbPath = path.join(process.cwd(), 'apple76.db');
  console.log('Database path:', dbPath);
  
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database file not found at ${dbPath}`);
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
    // Query for video files with thumbnails that match their oss_key (incorrect thumbnails)
    const videoItems = await db.all(`
      SELECT id, title, oss_key, thumbnail_key 
      FROM items 
      WHERE (
        oss_key LIKE '%.mp4' OR
        oss_key LIKE '%.mov' OR
        oss_key LIKE '%.webm'
      ) AND (
        thumbnail_key = oss_key OR
        thumbnail_key LIKE '%' || oss_key || '%'
      )
      LIMIT 10
    `);

    console.log(`Found ${videoItems.length} video items with incorrect thumbnails`);

    if (videoItems.length === 0) {
      console.log('No videos to process');
      return;
    }

    for (const item of videoItems) {
      try {
        console.log(`\nProcessing: ${item.title} (ID: ${item.id})`);
        console.log(`Current thumbnail_key: ${item.thumbnail_key}`);
        
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
          console.log(`Running FFmpeg command to extract frame at 3 seconds...`);
          execSync(`ffmpeg -y -i "${localVideoPath}" -ss 00:00:03 -vframes 1 -q:v 2 -vf "scale=640:-1" "${localThumbnailPath}"`, {
            stdio: 'inherit'
          });
          
          // Verify the thumbnail was created and has content
          if (fs.existsSync(localThumbnailPath)) {
            const stats = fs.statSync(localThumbnailPath);
            console.log(`Thumbnail created: ${localThumbnailPath}, size: ${stats.size} bytes`);
            
            if (stats.size < 1000) {
              throw new Error('Thumbnail file too small, might be corrupted');
            }
          } else {
            throw new Error('Thumbnail file was not created');
          }
        } catch (_) {
          console.error(`FFmpeg error at 3 seconds, trying alternative timestamp...`);
          try {
            console.log(`Running FFmpeg command to extract frame at 1 second...`);
            execSync(`ffmpeg -y -i "${localVideoPath}" -ss 00:00:01 -vframes 1 -q:v 2 -vf "scale=640:-1" "${localThumbnailPath}"`, {
              stdio: 'inherit'
            });
            
            // Verify the thumbnail was created
            if (fs.existsSync(localThumbnailPath)) {
              const stats = fs.statSync(localThumbnailPath);
              console.log(`Thumbnail created: ${localThumbnailPath}, size: ${stats.size} bytes`);
              
              if (stats.size < 1000) {
                throw new Error('Thumbnail file too small, might be corrupted');
              }
            } else {
              throw new Error('Thumbnail file was not created');
            }
          } catch (secondError) {
            console.error(`Second FFmpeg attempt failed:`, secondError);
            // Try one more approach - just grab the first frame
            console.log(`Trying to extract the very first frame...`);
            execSync(`ffmpeg -y -i "${localVideoPath}" -vframes 1 -q:v 2 -vf "scale=640:-1" "${localThumbnailPath}"`, {
              stdio: 'inherit'
            });
          }
        }

        // Upload the thumbnail to OSS
        const thumbnailKey = `thumbnails/videos/${item.id}_${thumbnailFileName}`;
        console.log(`Uploading thumbnail to ${thumbnailKey}...`);
        
        await ossClient.put(thumbnailKey, localThumbnailPath);
        
        // Update the database with the new thumbnail key
        await db.run(
          'UPDATE items SET thumbnail_key = ? WHERE id = ?',
          thumbnailKey,
          item.id
        );
        
        console.log(`✅ Successfully processed item ${item.id}`);
        console.log(`New thumbnail_key: ${thumbnailKey}`);
        
        // Clean up local files
        fs.unlinkSync(localVideoPath);
        fs.unlinkSync(localThumbnailPath);
      } catch (error) {
        console.error(`❌ Error processing item ${item.id}:`, error);
      }
    }

    console.log('\n✅ Video thumbnail fix completed');
  } catch (error) {
    console.error('\n❌ Error in thumbnail generation process:', error);
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
    console.error('\n❌ Unhandled error:', error);
    process.exit(1);
  }); 