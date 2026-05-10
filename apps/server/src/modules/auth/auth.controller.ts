import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, IJwtUser } from '@/common/decorators/current-user.decorator';
import { ITokenResponse, IUser } from '@subgate/types';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功，返回 JWT' })
  @ApiResponse({ status: 409, description: '用户名已存在' })
  async register(@Body() dto: RegisterDto): Promise<ITokenResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功，返回 JWT' })
  @ApiResponse({ status: 401, description: '凭据无效' })
  async login(@Body() dto: LoginDto): Promise<ITokenResponse> {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '用户信息' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getProfile(@CurrentUser() user: IJwtUser): Promise<IUser> {
    return this.authService.getProfile(user.id);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: 204, description: '密码修改成功' })
  @ApiResponse({ status: 401, description: '旧密码错误或未授权' })
  async updatePassword(
    @CurrentUser() user: IJwtUser,
    @Body() dto: UpdatePasswordDto,
  ): Promise<void> {
    return this.authService.updatePassword(user.id, dto);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '注销账号' })
  @ApiResponse({ status: 204, description: '账号已注销' })
  @ApiResponse({ status: 401, description: '未授权' })
  async deleteAccount(@CurrentUser() user: IJwtUser): Promise<void> {
    return this.authService.deleteAccount(user.id);
  }
}
