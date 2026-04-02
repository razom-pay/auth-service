import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { Account } from '@prisma/generated/client'
import { RpcStatus } from '@razom-pay/common'
import type {
	RefreshRequest,
	SendOtpRequest,
	VerifyOtpRequest
} from '@razom-pay/contracts/gen/auth'

import { UserRepository } from '@/shared/repositories/user.repository'

import { OtpService } from '../otp/otp.service'
import { TokenService } from '../token/token.service'

import { AuthRepository } from './auth.repository'

@Injectable()
export class AuthService {
	constructor(
		private readonly authRepository: AuthRepository,
		private readonly userRepository: UserRepository,
		private readonly otpService: OtpService,
		private readonly tokenService: TokenService
	) {}

	async sendOtp(data: SendOtpRequest) {
		const { identifier, type } = data

		let account: Account | null

		if (type === 'phone')
			account = await this.userRepository.findByPhone(identifier)
		else account = await this.userRepository.findByEmail(identifier)

		if (!account) {
			account = await this.authRepository.create({
				email: type === 'email' ? identifier : undefined,
				phone: type === 'phone' ? identifier : undefined
			})
		}

		const code = await this.otpService.send(
			identifier,
			type as 'email' | 'phone'
		)

		console.debug('CODE', code)

		return { ok: true }
	}

	async verifyOtp(data: VerifyOtpRequest) {
		const { identifier, code, type } = data

		await this.otpService.verify(
			identifier,
			code,
			type as 'email' | 'phone'
		)
		let account: Account | null

		if (type === 'phone')
			account = await this.userRepository.findByPhone(identifier)
		else account = await this.userRepository.findByEmail(identifier)

		if (!account)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Account not found'
			})

		if (type === 'phone' && !account.isPhoneVerified)
			await this.userRepository.update(account.id, {
				isPhoneVerified: true
			})

		if (type === 'email' && !account.isEmailVerified)
			await this.userRepository.update(account.id, {
				isEmailVerified: true
			})

		return this.tokenService.generate(account.id)
	}

	refresh(data: RefreshRequest) {
		const { refreshToken } = data

		const result = this.tokenService.verify(refreshToken)

		if (!result.valid)
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: result.reason
			})

		return this.tokenService.generate(result.userId!)
	}
}
