import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 100 * 1024 * 1024
    }
  }))
  async uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
    @Body('target') target: string,
  ) {
    return await this.appService.uploadFile(file, target);
  }

  @Get()
  async getFiles() {
    return this.appService.listFiles();
  }
}
