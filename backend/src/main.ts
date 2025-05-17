import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
  const expressApp = express();

  expressApp.set('server.timeout', 30 * 60 * 1000);
  expressApp.set('server.keepAliveTimeout', 30 * 60 * 1000);
  expressApp.set('server.headersTimeout', 31 * 60 * 1000);

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.enableCors();

  await app.init();

  const port = process.env.PORT ?? 3000;
  const server = await app.listen(port, () => {
    console.log(`Application is running on: https://localhost:${port}`);
  });

  server.setTimeout(30 * 60 * 1000);
  server.keepAliveTimeout = 30 * 60 * 1000;
  server.headersTimeout = 31 * 60 * 1000;
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
});
