import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@razom-pay/common'
import type {
	ConfirmEmailChangeRequest,
	ConfirmPhoneChangeRequest,
	GetAccountRequest,
	InitEmailChangeRequest,
	InitPhoneChangeRequest
} from '@razom-pay/contracts/gen/account'

import { MessagingService } from '@/infra/messaging/messaging.service'
import { UserRepository } from '@/shared/repositories'

import { OtpService } from '../otp/otp.service'

import { AccountRepository } from './account.repository'

@Injectable()
export class AccountService {
	constructor(
		private readonly messagingService: MessagingService,
		private readonly accountRepository: AccountRepository,
		private readonly userRepository: UserRepository,
		private readonly otpService: OtpService
	) {}
	async getAccount(data: GetAccountRequest) {
		const { id } = data

		const account = await this.accountRepository.findById(id)

		if (!account) {
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: `Account not found`
			})
		}

		return {
			id: account.id,
			phone: account.phone ?? undefined,
			email: account.email ?? undefined,
			isPhoneVerified: account.isPhoneVerified,
			isEmailVerified: account.isEmailVerified,
			role: account.role
		}
	}

	async initEmailChange(data: InitEmailChangeRequest) {
		const { email, userId } = data

		const existing = await this.userRepository.findByEmail(email)

		if (existing) {
			throw new RpcException({
				code: RpcStatus.ALREADY_EXISTS,
				details: `Email is already in use`
			})
		}

		const { code, hash } = await this.otpService.send(email, 'email')

		this.messagingService.emailChange({
			email,
			code
		})

		await this.accountRepository.upsertPendingChange({
			accountId: userId,
			type: 'email',
			value: email,
			codeHash: hash,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
		})

		return { ok: true }
	}

	async confirmEmailChange(data: ConfirmEmailChangeRequest) {
		const { email, code, userId } = data
		const pending = await this.accountRepository.findPendingChange(
			userId,
			'email'
		)

		if (!pending)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'No pending email change found'
			})

		if (pending.value !== email)
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Email mismatch'
			})

		if (pending.expiresAt < new Date())
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Code expired'
			})

		this.otpService.verify(pending.value, code, 'email')

		await this.userRepository.update(userId, {
			email,
			isEmailVerified: true
		})

		await this.accountRepository.deletePendingChange(userId, 'email')

		return {
			ok: true
		}
	}

	async initPhoneChange(data: InitPhoneChangeRequest) {
		const { phone, userId } = data

		const existing = await this.userRepository.findByPhone(phone)

		if (existing) {
			throw new RpcException({
				code: RpcStatus.ALREADY_EXISTS,
				details: `Phone is already in use`
			})
		}

		const { code, hash } = await this.otpService.send(phone, 'phone')

		this.messagingService.phoneChange({
			phone,
			code
		})

		await this.accountRepository.upsertPendingChange({
			accountId: userId,
			type: 'phone',
			value: phone,
			codeHash: hash,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
		})

		return { ok: true }
	}

	async confirmPhoneChange(data: ConfirmPhoneChangeRequest) {
		const { phone, code, userId } = data
		const pending = await this.accountRepository.findPendingChange(
			userId,
			'phone'
		)

		if (!pending)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'No pending phone change found'
			})

		if (pending.value !== phone)
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Phone mismatch'
			})

		if (pending.expiresAt < new Date())
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Code expired'
			})

		this.otpService.verify(pending.value, code, 'phone')

		await this.userRepository.update(userId, {
			phone,
			isPhoneVerified: true
		})

		await this.accountRepository.deletePendingChange(userId, 'phone')

		return {
			ok: true
		}
	}
}
