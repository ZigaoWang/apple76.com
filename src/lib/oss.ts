import OSS from 'ali-oss';

const client = new OSS({
  region: process.env.OSS_REGION!,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  bucket: process.env.OSS_BUCKET!,
  endpoint: process.env.OSS_ENDPOINT!,
  timeout: 60000, // 60 seconds timeout
  secure: true, // Use HTTPS
});

export default client;

export async function listFiles(prefix: string) {
  // List all files under a prefix (folder)
  const result = await client.list({ prefix, delimiter: '/', 'max-keys': 1000 }, {});
  return result.objects || [];
} 