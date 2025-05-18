"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.local' });
console.log('OSS_REGION:', process.env.OSS_REGION);
console.log('OSS_ACCESS_KEY_ID:', process.env.OSS_ACCESS_KEY_ID ? '[SET]' : '[NOT SET]');
console.log('OSS_ACCESS_KEY_SECRET:', process.env.OSS_ACCESS_KEY_SECRET ? '[SET]' : '[NOT SET]');
console.log('OSS_BUCKET:', process.env.OSS_BUCKET);
console.log('OSS_ENDPOINT:', process.env.OSS_ENDPOINT);
const db_js_1 = require("../src/lib/db.js");
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const ali_oss_1 = __importDefault(require("ali-oss")); // Import OSS constructor
// import { pdf } from 'pdf-to-img'; // Remove static import
async function generateThumbnail(ossKey, contentType, ossClient) {
    try {
        // Get the file from OSS
        const result = await ossClient.get(ossKey); // Use passed ossClient
        const buffer = result.content;
        // Normalize content type
        const normalizedContentType = contentType.toLowerCase().trim();
        if (normalizedContentType === 'application/pdf' || ossKey.toLowerCase().endsWith('.pdf')) {
            try {
                // Use dynamic import for pdf-to-img due to top-level await
                const { pdf } = await Promise.resolve().then(() => __importStar(require('pdf-to-img')));
                // Use pdf-to-img to generate thumbnail for PDFs
                // We'll get the first page as a PNG buffer
                const document = await pdf(buffer, { scale: 1.0 }); // scale 1.0 for a reasonable size
                const firstPageImage = await document.getPage(1);
                // Convert the PNG buffer to JPEG and resize/optimize if needed
                const thumbnail = await (0, sharp_1.default)(firstPageImage)
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
            }
            catch (pdfError) {
                console.error(`Error generating PDF thumbnail for ${ossKey}:`, pdfError);
                // Fallback to a simple placeholder if pdf-to-img fails
                return generatePlaceholder('PDF');
            }
        }
        else if (normalizedContentType.startsWith('image/') ||
            /\.(jpe?g|png|gif|webp|tiff?|bmp)$/i.test(ossKey)) {
            // Generate thumbnail for images
            const image = (0, sharp_1.default)(buffer);
            const metadata = await image.metadata();
            if (!metadata.width || !metadata.height) {
                throw new Error('Invalid image dimensions');
            }
            // Calculate dimensions while maintaining aspect ratio
            const maxWidth = 800;
            const maxHeight = 1200;
            const ratio = Math.min(maxWidth / metadata.width, maxHeight / metadata.height);
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
            return { buffer: thumbnail, contentType: 'image/jpeg' };
        }
        // For other file types, generate a placeholder
        return generatePlaceholder('FILE');
    }
    catch (error) {
        console.error(`Error processing file ${ossKey}:`, error);
        throw error; // Re-throw the error to be handled by the caller
    }
}
async function generatePlaceholder(type = 'FILE') {
    const placeholderText = type === 'PDF' ? 'PDF' : type;
    const placeholder = await (0, sharp_1.default)({
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
async function main() {
    // Initialize OSS client after dotenv
    const client = new ali_oss_1.default({
        region: process.env.OSS_REGION,
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        bucket: process.env.OSS_BUCKET,
        endpoint: process.env.OSS_ENDPOINT,
        timeout: 60000, // 60 seconds timeout
        secure: true, // Use HTTPS
    });
    const db = await (0, db_js_1.openDb)();
    // Get all items
    const items = await db.all(`
    SELECT id, oss_key, title, collection
    FROM items
  `);
    console.log(`Found ${items.length} items to process`);
    let successCount = 0;
    let failureCount = 0;
    const failedItems = [];
    for (const item of items) {
        try {
            console.log(`Processing item: ${item.title} (${item.oss_key})`);
            // Get the file's content type from OSS using the client
            const head = await client.head(item.oss_key); // Use initialized client
            const contentType = head.res.headers['content-type'] || 'application/octet-stream';
            // Generate thumbnail, passing the client
            const { buffer: thumbnailBuffer } = await generateThumbnail(item.oss_key, contentType, client);
            // Create thumbnail key
            const thumbnailKey = `${item.collection}/thumbnails/${path_1.default.basename(item.oss_key).replace(/\.[^/\\]+$/, '.jpeg')}`;
            // Upload thumbnail to OSS using the client
            await client.put(thumbnailKey, thumbnailBuffer, {
                headers: {
                    'Content-Type': 'image/jpeg',
                    'Content-Length': thumbnailBuffer.length.toString(),
                },
            });
            // Update database with thumbnail key
            await db.run('UPDATE items SET thumbnail_key = ? WHERE id = ?', thumbnailKey, item.id);
            console.log(`Successfully generated thumbnail for: ${item.title}`);
            successCount++;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to process item ${item.title}:`, errorMessage);
            failedItems.push({ title: item.title, error: errorMessage });
            failureCount++;
        }
    }
    console.log('\nThumbnail generation complete!');
    console.log(`Successfully processed: ${successCount} items`);
    console.log(`Failed to process: ${failureCount} items`);
    if (failedItems.length > 0) {
        console.log('\nFailed items:');
        failedItems.forEach(({ title, error }) => {
            console.log(`- ${title}: ${error}`);
        });
    }
    process.exit(failureCount > 0 ? 1 : 0);
}
main().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
