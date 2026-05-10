import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { IUser, ITokenResponse } from '@subgate/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<ITokenResponse> {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { username: dto.username, passwordHash },
    });

    return this.buildTokenResponse(user);
  }

  async login(dto: LoginDto): Promise<ITokenResponse> {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildTokenResponse(user);
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }

  private buildTokenResponse(user: {
    id: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
  }): ITokenResponse {
    const token = this.jwtService.sign({ sub: user.id, username: user.username });
    return {
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }
}
