import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);
  private readonly bucket = process.env.DO_SPACES_BUCKET || 'qrders-cafe-logo';
  private readonly endpoint = process.env.DO_SPACES_ENDPOINT || 'https://sfo3.digitaloceanspaces.com';
  private readonly cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT;
  private readonly region = 'sfo3'; // Usually implied by endpoint

  constructor() {
    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || '',
      },
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      const fileContent = fs.readFileSync(file.path);
      const fileName = `${folder}/${Date.now()}-${file.filename}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: fileContent,
        ACL: 'public-read', // Make sure the file is publicly accessible
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      // Clean up local file
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        this.logger.error(`Failed to delete local file: ${file.path}`, err);
      }

      // Construct public URL
      if (this.cdnEndpoint) {
        return `${this.cdnEndpoint}/${fileName}`;
      }
      
      // Fallback to standard URL
      const endpointUrl = this.endpoint.replace('https://', '').replace('http://', '');
      return `https://${this.bucket}.${endpointUrl}/${fileName}`;
    } catch (error) {
      this.logger.error('S3 Upload Error:', error);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl) return;
      
      let key = '';

      if (this.cdnEndpoint && fileUrl.startsWith(this.cdnEndpoint)) {
        key = fileUrl.replace(`${this.cdnEndpoint}/`, '');
      } else {
        const endpointUrl = this.endpoint.replace('https://', '').replace('http://', '');
        const baseUrl = `https://${this.bucket}.${endpointUrl}/`;
        
        if (fileUrl.startsWith(baseUrl)) {
           key = fileUrl.replace(baseUrl, '');
        }
      }
      
      if (!key) {
        return; // Not an S3 file or different bucket
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error('S3 Delete Error:', error);
      throw error;
    }
  }

  async listImages(folder: string): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: folder.endsWith('/') ? folder : `${folder}/`,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        return [];
      }

      const baseUrl = this.cdnEndpoint 
        ? `${this.cdnEndpoint}/` 
        : `https://${this.bucket}.${this.endpoint.replace('https://', '').replace('http://', '')}/`;

      return response.Contents
        .filter(item => item.Key && !item.Key.endsWith('/')) // Filter out folders if any
        .map(item => `${baseUrl}${item.Key}`);
    } catch (error) {
      this.logger.error('S3 List Error:', error);
      return [];
    }
  }
}
