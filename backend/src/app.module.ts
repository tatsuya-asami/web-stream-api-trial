import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';
import { FindUserStreamService } from 'src/findUserStream.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MulterModule.register({
      storage: 'memory',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, FindUserStreamService],
})
export class AppModule {}
