import { Module } from '@nestjs/common'

import { UserRepository } from '@/shared/repositories/user.repository'

import { OtpService } from '../otp/otp.service'
import { TokenService } from '../token/token.service'

import { AuthController } from './auth.controller'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'

@Module({
	controllers: [AuthController],
	providers: [
		AuthService,
		AuthRepository,
		UserRepository,
		OtpService,
		TokenService
	]
})
export class AuthModule {}
