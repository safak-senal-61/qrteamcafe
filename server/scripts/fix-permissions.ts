import { S3Client, ListObjectsV2Command, PutObjectAclCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from .env file in server root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const bucket = process.env.DO_SPACES_BUCKET || 'qrders-cafe-logo';
const endpoint = process.env.DO_SPACES_ENDPOINT || 'https://sfo3.digitaloceanspaces.com';
const region = 'sfo3';

console.log('Using bucket:', bucket);
console.log('Using endpoint:', endpoint);

const s3Client = new S3Client({
  endpoint: endpoint,
  region: region,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET || '',
  },
});

async function main() {
  console.log('Listing images...');
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: '',
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents) {
      console.log('No contents found');
      return;
    }

    console.log(`Found ${response.Contents.length} items.`);

    for (const item of response.Contents) {
      if (!item.Key || item.Key.endsWith('/')) continue;
      
      console.log(`Fixing permissions for ${item.Key}`);
      try {
        await s3Client.send(new PutObjectAclCommand({
          Bucket: bucket,
          Key: item.Key,
          ACL: 'public-read'
        }));
        console.log('Success');
      } catch (e) {
        console.error('Failed', e);
      }
    }
  } catch (error) {
    console.error('Error listing objects:', error);
  }
}

main();
