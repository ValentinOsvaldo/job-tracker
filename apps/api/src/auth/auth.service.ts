import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';
import { PublicUser } from '../users/types/public-user.type';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { AuthTokensResponseDto } from './dto/auth-response.dto';

export type AuthTokens = AuthTokensResponseDto;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<User | null> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthTokens & { user: PublicUser }> {
    const user = await this.validateUser(loginDto);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      user: this.usersService.toPublicUser(user),
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.refreshTokensRepository.findOne({
      where: { token_hash: tokenHash },
      relations: { user: true },
    });

    if (!storedToken || storedToken.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokensRepository.delete(storedToken.id);

    return this.issueTokens(storedToken.user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokensRepository.delete({ token_hash: tokenHash });
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.usersService.toPublicUser(user);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomUUID();
    const refreshTokenExpiresDays = Number(
      this.configService.get('REFRESH_TOKEN_EXPIRES_DAYS') ?? 7,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTokenExpiresDays);

    await this.refreshTokensRepository.save({
      user_id: user.id,
      token_hash: this.hashToken(refreshToken),
      expires_at: expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
