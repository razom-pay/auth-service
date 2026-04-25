import { Test, TestingModule } from '@nestjs/testing'
import { AccountService } from './account.service'
import { MessagingService } from '@/infra/messaging/messaging.service'
import { AccountRepository } from './account.repository'
import { UserRepository } from '@/shared/repositories'
import { OtpService } from '../otp/otp.service'
import { RpcException } from '@nestjs/microservices'

describe('AccountService', () => {
	let service: AccountService
	let messagingService: jest.Mocked<MessagingService>
	let accountRepository: jest.Mocked<AccountRepository>
	let userRepository: jest.Mocked<UserRepository>
	let otpService: jest.Mocked<OtpService>

	beforeEach(async () => {
		const mockMessagingService = {
			emailChange: jest.fn(),
			phoneChange: jest.fn()
		}

		const mockAccountRepository = {
			findById: jest.fn(),
			upsertPendingChange: jest.fn(),
			findPendingChange: jest.fn(),
			deletePendingChange: jest.fn()
		}

		const mockUserRepository = {
			findByEmail: jest.fn(),
			findByPhone: jest.fn(),
			update: jest.fn()
		}

		const mockOtpService = {
			send: jest.fn(),
			verify: jest.fn()
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AccountService,
				{ provide: MessagingService, useValue: mockMessagingService },
				{ provide: AccountRepository, useValue: mockAccountRepository },
				{ provide: UserRepository, useValue: mockUserRepository },
				{ provide: OtpService, useValue: mockOtpService }
			]
		}).compile()

		service = module.get<AccountService>(AccountService)
		messagingService = module.get(MessagingService)
		accountRepository = module.get(AccountRepository)
		userRepository = module.get(UserRepository)
		otpService = module.get(OtpService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('getAccount', () => {
		it('should throw NOT_FOUND if account missing', async () => {
			accountRepository.findById.mockResolvedValue(null)
			await expect(service.getAccount({ id: '1' })).rejects.toThrow(RpcException)
		})

		it('should return mapped account', async () => {
			accountRepository.findById.mockResolvedValue({
				id: '1',
				phone: '123',
				isPhoneVerified: true,
				isEmailVerified: false,
				role: 'USER'
			} as any)

			const result = await service.getAccount({ id: '1' })

			expect(result).toEqual({
				id: '1',
				phone: '123',
				email: undefined,
				isPhoneVerified: true,
				isEmailVerified: false,
				role: 'USER'
			})
		})
	})

	describe('initEmailChange', () => {
		it('should throw ALREADY_EXISTS if email is taken', async () => {
			userRepository.findByEmail.mockResolvedValue({ id: '2' } as any)
			await expect(
				service.initEmailChange({ email: 'taken@example.com', userId: '1' })
			).rejects.toThrow(RpcException)
		})

		it('should send otp, send message, and upsert pending change', async () => {
			userRepository.findByEmail.mockResolvedValue(null)
			otpService.send.mockResolvedValue({ code: '123456', hash: 'hash' })

			const result = await service.initEmailChange({
				email: 'new@example.com',
				userId: '1'
			})

			expect(otpService.send).toHaveBeenCalledWith('new@example.com', 'email')
			expect(messagingService.emailChange).toHaveBeenCalledWith({
				email: 'new@example.com',
				code: '123456'
			})
			expect(accountRepository.upsertPendingChange).toHaveBeenCalledWith(
				expect.objectContaining({
					accountId: '1',
					type: 'email',
					value: 'new@example.com',
					codeHash: 'hash'
				})
			)
			expect(result).toEqual({ ok: true })
		})
	})

	describe('confirmEmailChange', () => {
		it('should throw NOT_FOUND if no pending change', async () => {
			accountRepository.findPendingChange.mockResolvedValue(null)
			await expect(
				service.confirmEmailChange({ email: 'test@example.com', code: '123', userId: '1' })
			).rejects.toThrow(RpcException)
		})

		it('should update user and delete pending change', async () => {
			accountRepository.findPendingChange.mockResolvedValue({
				value: 'test@example.com',
				expiresAt: new Date(Date.now() + 10000)
			} as any)

			const result = await service.confirmEmailChange({
				email: 'test@example.com',
				code: '123',
				userId: '1'
			})

			expect(otpService.verify).toHaveBeenCalledWith('test@example.com', '123', 'email')
			expect(userRepository.update).toHaveBeenCalledWith('1', {
				email: 'test@example.com',
				isEmailVerified: true
			})
			expect(accountRepository.deletePendingChange).toHaveBeenCalledWith('1', 'email')
			expect(result).toEqual({ ok: true })
		})
	})

	describe('initPhoneChange', () => {
		it('should send otp, send message, and upsert pending change', async () => {
			userRepository.findByPhone.mockResolvedValue(null)
			otpService.send.mockResolvedValue({ code: '123456', hash: 'hash' })

			const result = await service.initPhoneChange({
				phone: '+123',
				userId: '1'
			})

			expect(otpService.send).toHaveBeenCalledWith('+123', 'phone')
			expect(messagingService.phoneChange).toHaveBeenCalledWith({
				phone: '+123',
				code: '123456'
			})
			expect(accountRepository.upsertPendingChange).toHaveBeenCalledWith(
				expect.objectContaining({
					accountId: '1',
					type: 'phone',
					value: '+123',
					codeHash: 'hash'
				})
			)
			expect(result).toEqual({ ok: true })
		})
	})

	describe('confirmPhoneChange', () => {
		it('should update user and delete pending change', async () => {
			accountRepository.findPendingChange.mockResolvedValue({
				value: '+123',
				expiresAt: new Date(Date.now() + 10000)
			} as any)

			const result = await service.confirmPhoneChange({
				phone: '+123',
				code: '123',
				userId: '1'
			})

			expect(otpService.verify).toHaveBeenCalledWith('+123', '123', 'phone')
			expect(userRepository.update).toHaveBeenCalledWith('1', {
				phone: '+123',
				isPhoneVerified: true
			})
			expect(accountRepository.deletePendingChange).toHaveBeenCalledWith('1', 'phone')
			expect(result).toEqual({ ok: true })
		})
	})
})
