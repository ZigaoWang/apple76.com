"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const ali_oss_1 = __importDefault(require("ali-oss"));
const child_process_1 = require("child_process");
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
// Configure OSS client
const ossClient = new ali_oss_1.default({
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
    const dbPath = path_1.default.join(process.cwd(), 'apple76.db');
    console.log('Database path:', dbPath);
    if (!fs_1.default.existsSync(dbPath)) {
        console.error(`Database file not found at ${dbPath}`);
        return;
    }
    const db = await (0, sqlite_1.open)({
        filename: dbPath,
        driver: sqlite3_1.default.Database,
    });
    // Create temp directory if it doesn't exist
    const tempDir = path_1.default.join(process.cwd(), 'temp');
    if (!fs_1.default.existsSync(tempDir)) {
        fs_1.default.mkdirSync(tempDir);
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
                const videoFileName = path_1.default.basename(item.oss_key);
                const localVideoPath = path_1.default.join(tempDir, videoFileName);
                console.log(`Downloading ${item.oss_key}...`);
                const result = await ossClient.get(item.oss_key);
                fs_1.default.writeFileSync(localVideoPath, result.content);
                // Generate a thumbnail image using ffmpeg at the 3-second mark
                const thumbnailFileName = videoFileName.replace(/\.[^/.]+$/, '') + '_thumbnail.jpg';
                const localThumbnailPath = path_1.default.join(tempDir, thumbnailFileName);
                console.log(`Generating thumbnail for ${videoFileName}...`);
                try {
                    (0, child_process_1.execSync)(`ffmpeg -y -i "${localVideoPath}" -ss 00:00:03 -vframes 1 -q:v 2 "${localThumbnailPath}"`, {
                        stdio: 'inherit'
                    });
                }
                catch (error) {
                    const ffmpegError = error;
                    console.error(`FFmpeg error: ${ffmpegError.message}`);
                    console.log('Trying alternative approach...');
                    (0, child_process_1.execSync)(`ffmpeg -y -i "${localVideoPath}" -ss 00:00:01 -vframes 1 -q:v 2 "${localThumbnailPath}"`, {
                        stdio: 'inherit'
                    });
                }
                // Upload the thumbnail to OSS
                const thumbnailKey = `thumbnails/videos/${item.id}_${thumbnailFileName}`;
                console.log(`Uploading thumbnail to ${thumbnailKey}...`);
                await ossClient.put(thumbnailKey, localThumbnailPath);
                // Update the database with the thumbnail key
                await db.run('UPDATE items SET thumbnail_key = ? WHERE id = ?', thumbnailKey, item.id);
                console.log(`Successfully processed item ${item.id}`);
                // Clean up local files
                fs_1.default.unlinkSync(localVideoPath);
                fs_1.default.unlinkSync(localThumbnailPath);
            }
            catch (error) {
                console.error(`Error processing item ${item.id}:`, error);
            }
        }
        console.log('Video thumbnail generation completed');
    }
    catch (error) {
        console.error('Error in thumbnail generation process:', error);
    }
    finally {
        // Close database connection
        await db.close();
        // Clean up temp directory
        if (fs_1.default.existsSync(tempDir) && fs_1.default.readdirSync(tempDir).length === 0) {
            fs_1.default.rmdirSync(tempDir);
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
