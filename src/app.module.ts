import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { AtGuard } from './common/guard';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    {
      // bestpractice jika kita punya depedency injection yg banyak untuk Atguard.
      // disini kita tidak butuh reflector karna disini
      // depedency injection bisa jalan
      provide: APP_GUARD,
      useClass: AtGuard,
    },
  ],
})
export class AppModule {}
