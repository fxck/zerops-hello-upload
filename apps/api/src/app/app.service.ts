import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import * as path from 'path';
import { Repository } from 'typeorm';
import { FileEntity } from './file.entity';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private s3: S3;

  constructor(
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    private configService: ConfigService,
  ) {
    const s3Config: S3.ClientConfiguration = {
      endpoint: this.configService.get<string>('STORAGE_API_URL'),
      accessKeyId: this.configService.get<string>('STORAGE_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('STORAGE_SECRET_KEY'),
      s3ForcePathStyle: true,
      region: 'us-east-1'
    };

    this.s3 = new S3(s3Config);
    this.logger.log(`S3 Config: ${JSON.stringify(s3Config)}`);
    this.logger.log('AppService initialized');
  }

  async uploadFile(file: Express.Multer.File, target: string): Promise<FileEntity> {
    this.logger.log(`Uploading file: ${file.originalname} to ${target}`);
    try {
      let result;
      if (target === 'SHARED_STORAGE') {
        result = await this.uploadToSharedStorage(file);
      } else if (target === 'OBJECT_STORAGE') {
        result = await this.uploadToS3(file);
      } else {
        throw new Error('Invalid target specified');
      }
      this.logger.log(`File uploaded successfully: ${file.originalname}`);
      return result;
    } catch (error) {
      this.logger.error(`Error uploading file: ${file.originalname}`, error.stack);
      throw error;
    }
  }

  async listFiles(): Promise<FileEntity[]> {
    this.logger.log('Listing all files');
    try {
      const files = await this.fileRepository.find();
      this.logger.log(`Found ${files.length} files`);
      return files;
    } catch (error) {
      this.logger.error('Error listing files', error.stack);
      throw error;
    }
  }

  private async uploadToSharedStorage(file: Express.Multer.File): Promise<FileEntity> {
    const relativeStoragePath = `data/${file.originalname}`;
    const absoluteStoragePath = `/var/www/${relativeStoragePath}`;
    await fs.mkdir(path.dirname(absoluteStoragePath), { recursive: true });
    await fs.writeFile(absoluteStoragePath, file.buffer);
    const accessiblePath = `${this.configService.get<string>('URL')}/${relativeStoragePath}`;
    return this.saveFileMetadata(file.originalname, accessiblePath, 'SHARED_STORAGE');
  }

  async uploadToS3(file: Express.Multer.File): Promise<FileEntity> {
    try {
      const uploadResult = await this.s3.upload({
        Bucket: this.configService.get<string>('STORAGE_BUCKET_NAME'),
        Key: file.originalname,
        Body: file.buffer,
      }).promise();
      this.logger.log(`File uploaded to S3: ${file.originalname}`);
      return this.saveFileMetadata(file.originalname, uploadResult.Location, 'OBJECT_STORAGE');
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${file.originalname}`, error.stack);
      throw error;
    }
  }

  private async saveFileMetadata(filename: string, path: string, target: string): Promise<FileEntity> {
    try {
      const file = this.fileRepository.create({ filename, path, target });
      await this.fileRepository.save(file);
      this.logger.log(`File metadata saved: ${filename}`);
      return file;
    } catch (error) {
      this.logger.error(`Error saving file metadata: ${filename}`, error.stack);
      throw error;
    }
  }
}

