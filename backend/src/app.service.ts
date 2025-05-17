import { Injectable } from '@nestjs/common';
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { statSync } from 'node:fs';
import { Readable } from 'node:stream';
import {
  ReadableStream,
  WritableStream,
  TransformStream,
  TextDecoderStream,
} from 'node:stream/web';
import { PrismaService } from 'src/prisma.service';
import { CsvToStringArray } from 'src/transformer/CsvToStringArray';
import { StringArrayToEntity } from 'src/transformer/StringArrayToEntity';
import { DbWriter } from 'src/transformer/DbWriter';
import {
  FindUserStreamService,
  UserWithProfile,
} from 'src/findUserStream.service';
import { UsersToCsvStringifyTransformer } from 'src/transformer/UsersToCsv';

@Injectable()
export class AppService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly findUserService: FindUserStreamService,
  ) {}

  async getSmallCsvDirect(): Promise<string> {
    const csvFilePath = resolve(process.cwd(), 'smallCsv.csv');
    return readFile(csvFilePath, 'utf-8');
  }

  async getLargeCsvDirect(): Promise<string> {
    const csvFilePath = resolve(process.cwd(), 'largeCsv.csv');
    return readFile(csvFilePath, 'utf-8');
  }

  getLargeCsvStream() {
    const csvFilePath = resolve(process.cwd(), 'largeCsv.csv');
    const fileStream = createReadStream(csvFilePath);
    const fileSize = statSync(csvFilePath).size;

    return { stream: fileStream, size: fileSize };
  }

  findAllUsersToCsv() {
    const readable: ReadableStream<UserWithProfile[]> =
      this.findUserService.findAllUsersObjectStream();
    return readable.pipeThrough(new UsersToCsvStringifyTransformer());
  }

  async saveCsvDirect(file: Express.Multer.File) {
    const timestamp = Date.now();
    const filePath = resolve(
      process.cwd(),
      '..',
      `uploaded_direct_${timestamp}.csv`,
    );
    const buffer = Buffer.from(file.buffer);
    await writeFile(filePath, buffer);

    return { success: true, savedPath: filePath };
  }

  async saveCsvStream(readableStream: Readable) {
    const timestamp = Date.now();
    const filePath = resolve(
      process.cwd(),
      '..',
      `uploaded_stream_${timestamp}.csv`,
    );

    await writeFile(filePath, '');
    const webReadableStream = Readable.toWeb(readableStream);

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        console.log('Transforming chunk:');
        controller.enqueue(chunk);
      },
    });

    const writableStream = new WritableStream({
      async write(chunk: string) {
        await appendFile(filePath, chunk);
      },
      close() {
        console.log('Stream closed, file writing complete');
      },
      abort(reason) {
        console.error('Stream aborted:', reason);
      },
    });

    await webReadableStream.pipeThrough(transformStream).pipeTo(writableStream);

    return { success: true, savedPath: filePath };
  }

  async insertCsvStreamToDb(readableStream: Readable) {
    const webReadableStream: ReadableStream<Uint8Array> =
      Readable.toWeb(readableStream);

    await webReadableStream
      .pipeThrough(new TextDecoderStream('utf-8'))
      .pipeThrough(new CsvToStringArray())
      .pipeThrough(new StringArrayToEntity())
      .pipeTo(new DbWriter(this.prismaService));

    return { success: true };
  }
}
