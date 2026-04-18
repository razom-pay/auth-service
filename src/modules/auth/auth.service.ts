import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { Account } from '@prisma/generated/client'
import { RpcStatus } from '@razom-pay/common'
import type {
	RefreshRequest,
	SendOtpRequest,
	VerifyOtpRequest
} from '@razom-pay/contracts/gen/auth'
import { PinoLogger } from 'nestjs-pino/PinoLogger'

import { MessagingService } from '@/infra/messaging/messaging.service'
import { UserRepository } from '@/shared/repositories/user.repository'

import { OtpService } from '../otp/otp.service'
import { TokenService } from '../token/token.service'
import { UsersClientGrpc } from '../users/users.grpc'

@Injectable()
export class AuthService {
	constructor(
		private readonly logger: PinoLogger,
		private readonly userRepository: UserRepository,
		private readonly otpService: OtpService,
		private readonly tokenService: TokenService,
		private readonly messagingService: MessagingService,
		private readonly usersClient: UsersClientGrpc
	) {
		this.logger.setContext(AuthService.name)
	}

	async sendOtp(data: SendOtpRequest) {
		const { identifier, type } = data

		this.logger.info(
			`OTP request received: identifier=${identifier}, type=${type}`
		)

		let account: Account | null

		if (type === 'phone')
			account = await this.userRepository.findByPhone(identifier)
		else account = await this.userRepository.findByEmail(identifier)

		if (!account) {
			this.logger.info(
				`No account found for identifier=${identifier}, creating new account`
			)

			account = await this.userRepository.create({
				email: type === 'email' ? identifier : undefined,
				phone: type === 'phone' ? identifier : undefined
			})
		}

		const { code } = await this.otpService.send(
			identifier,
			type as 'email' | 'phone'
		)

		this.messagingService.otpRequested({
			identifier,
			type,
			code
		})

		this.logger.info(`OTP sent successfully: to ${identifier}`)

		return { ok: true }
	}

	async verifyOtp(data: VerifyOtpRequest) {
		const { identifier, code, type } = data

		this.logger.info(
			`OTP verification attempt: identifier=${identifier}, code=${code}`
		)

		await this.otpService.verify(
			identifier,
			code,
			type as 'email' | 'phone'
		)
		let account: Account | null

		if (type === 'phone')
			account = await this.userRepository.findByPhone(identifier)
		else account = await this.userRepository.findByEmail(identifier)

		if (!account) {
			this.logger.warn(
				`OTP verified but no account found for identifier=${identifier}`
			)

			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Account not found'
			})
		}

		if (type === 'phone' && !account.isPhoneVerified)
			await this.userRepository.update(account.id, {
				isPhoneVerified: true
			})

		if (type === 'email' && !account.isEmailVerified)
			await this.userRepository.update(account.id, {
				isEmailVerified: true
			})

		this.logger.info(
			`OTP verified successfully for identifier=${identifier}`
		)

		this.usersClient
			.create({
				id: account.id
			})
			.subscribe()

		return this.tokenService.generate(account.id)
	}

	refresh(data: RefreshRequest) {
		const { refreshToken } = data

		this.logger.debug('Refresh token requested')

		const result = this.tokenService.verify(refreshToken)

		if (!result.valid) {
			this.logger.warn(`Invalid refresh token: reason=${result.reason}`)

			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: result.reason
			})
		}

		this.logger.info(
			`Refresh token verified successfully for userId=${result.userId}`
		)

		return this.tokenService.generate(result.userId!)
	}
}
