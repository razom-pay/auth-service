import { Module } from '@nestjs/common'

import { UserRepository } from '@/shared/repositories/user.repository'

import { OtpService } from '../otp/otp.service'
import { TokenService } from '../token/token.service'
import { UsersModule } from '../users/users.module'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
	imports: [UsersModule],
	controllers: [AuthController],
	providers: [AuthService, UserRepository, OtpService, TokenService]
})
export class AuthModule {}
