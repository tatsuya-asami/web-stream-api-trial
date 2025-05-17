import {
  Controller,
  Get,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  Req,
  RawBodyRequest,
  Header,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Readable } from 'node:stream';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/csv/small')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="smallCsv.csv"')
  async getSmallCsvDirect() {
    return this.appService.getSmallCsvDirect();
  }

  @Get('/csv/large')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="largeCsv.csv"')
  async getLargeCsvDirect() {
    return this.appService.getLargeCsvDirect();
  }

  @Get('/csv/stream')
  getLargeCsvStream(): StreamableFile {
    const { stream, size } = this.appService.getLargeCsvStream();

    return new StreamableFile(stream, {
      type: 'text/csv',
      disposition: 'attachment; filename="largeCsv.csv"',
      length: size,
    });
  }

  @Get('/csv/from/db')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="users_from_db.csv"')
  getCsvFromDb(): StreamableFile {
    const webReadableStream = this.appService.findAllUsersToCsv();

    const nodeReadableStream = Readable.fromWeb(webReadableStream);

    return new StreamableFile(nodeReadableStream);
  }

  @Post('/csv/upload/direct')
  @UseInterceptors(
    FileInterceptor('csvFile', {
      storage: undefined, // メモリストレージを使用
    }),
  )
  async uploadCsvDirect(@UploadedFile() file: Express.Multer.File) {
    return this.appService.saveCsvDirect(file);
  }

  @Post('/csv/upload/stream')
  async uploadCsvStream(@Req() req: RawBodyRequest<Request>) {
    return this.appService.saveCsvStream(req);
  }

  @Post('/csv/insert/stream')
  async insertCsvStream(@Req() req: RawBodyRequest<Request>) {
    return this.appService.insertCsvStreamToDb(req);
  }
}
