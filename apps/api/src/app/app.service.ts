import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import { Repository } from 'typeorm';
import { FileEntity } from './file.entity';

@Injectable()
export class AppService {
  private s3: S3;

  constructor(
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    private configService: ConfigService,
  ) {
    const s3Config = {
      endpoint: this.configService.get<string>('STORAGE_API_URL'),
      accessKeyId: this.configService.get<string>('STORAGE_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('STORAGE_SECRET_KEY'),
      s3ForcePathStyle: true,
    };

    this.s3 = new S3(s3Config);
  }

  async uploadFile(
    file: Express.Multer.File,
    target: string,
  ): Promise<FileEntity> {
    switch (target) {
      case 'SHARED_STORAGE':
        return this.uploadToSharedStorage(file);
      case 'OBJECT_STORAGE':
        return this.uploadToS3(file);
      default:
        throw new Error('Invalid target specified');
    }
  }

  async listFiles(): Promise<FileEntity[]> {
    return await this.fileRepository.find();
  }

  private async uploadToSharedStorage(
    file: Express.Multer.File,
  ): Promise<FileEntity> {
    const sharedStoragePath = `/path/to/shared/storage/${file.originalname}`;

    const fileEntity = await this.saveFileMetadata(
      file.originalname,
      sharedStoragePath,
      'SHARED_STORAGE',
    );
    return fileEntity;
  }

  async uploadToS3(file: Express.Multer.File): Promise<FileEntity> {
    const uploadResult = await this.s3
      .upload({
        Bucket: this.configService.get<string>('STORAGE_BUCKET_NAME'),
        Key: file.originalname,
        Body: file.buffer,
      })
      .promise();

    const fileEntity = await this.saveFileMetadata(
      file.originalname,
      uploadResult.Location,
      'OBJECT_STORAGE',
    );
    return fileEntity;
  }

  private async saveFileMetadata(
    filename: string,
    path: string,
    target: string,
  ): Promise<FileEntity> {
    const file = this.fileRepository.create({
      filename,
      path,
      target,
    });

    await this.fileRepository.save(file);

    return file;
  }
}
