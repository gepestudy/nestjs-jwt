import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signupLocal(dto: AuthDto): Promise<Tokens> {
    try {
      const hash = await this.hashData(dto.password);
      const newUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });
      const { access_token, refresh_token } = await this.getToken(
        newUser.id,
        newUser.email,
      );
      await this.updateRtHash(newUser.id, refresh_token);
      return { access_token, refresh_token };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code == 'P2002') {
          throw new BadRequestException('Credentials Taken!');
        }
      }

      throw new Error(error);
    }
  }

  async signinLocal(dto: AuthDto): Promise<Tokens> {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: {
          email: dto.email,
        },
      });

      const passwordMatch = await argon.verify(user.hash, dto.password);
      if (!passwordMatch) {
        throw new ForbiddenException('Credentials not match');
      }

      const { access_token, refresh_token } = await this.getToken(
        user.id,
        user.email,
      );
      await this.updateRtHash(user.id, refresh_token);
      return { refresh_token, access_token };
    } catch (error) {
      console.log({ error });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code == 'P2025') {
          throw new ForbiddenException('user not registered!');
        }
      }
      throw error;
    }
  }

  async me(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new ForbiddenException('Access Denied');
    return { ...user };
  }

  async logout(userid: number): Promise<boolean> {
    await this.prisma.user.updateMany({
      where: {
        id: userid,
        hashedRt: {
          not: null,
        },
      },
      data: {
        hashedRt: null,
      },
    });
    return true;
  }

  async refreshTokens(userId: number, rt: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user || !user.hashedRt)
      throw new UnauthorizedException('Access Denied');

    const rtMatch = await argon.verify(user.hashedRt, rt);
    if (!rtMatch) throw new UnauthorizedException('Access Denied');

    const { access_token, refresh_token } = await this.getToken(
      user.id,
      user.email,
    );
    await this.updateRtHash(user.id, refresh_token);
    return { refresh_token, access_token };
  }

  async updateRtHash(userId: number, rereshToken: string) {
    const hashRt = await argon.hash(rereshToken);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: hashRt,
      },
    });
  }

  async getToken(userId: number, email: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      await this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          expiresIn: 60 * 60,
          secret: this.config.get('AT_SECRET'),
        },
      ),
      await this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          expiresIn: 60 * 60 * 24,
          secret: this.config.get('RT_SECRET'),
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async hashData(data: string) {
    return await argon.hash(data);
  }
}
