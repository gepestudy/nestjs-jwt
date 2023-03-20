import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  app.useGlobalPipes(new ValidationPipe());
  // bestpractice jika kita tidak punya depedency injection yg banyak untuk Atguard.
  // untuk validasi useguar global bisa dari sini atau dari
  // sini atau dari app.module
  // contoh create useguard disini adalah
  // wajib menggunakan reflector karna disini depedency injection tidak jalan
  // reflector digunakan untuk mengetahui ada metadata atau tidak di dalam handler / class
  // const reflector = new Reflector();
  // app.useGlobalGuards(new AtGuard(reflector));
  await app.listen(8080);
}
bootstrap();
