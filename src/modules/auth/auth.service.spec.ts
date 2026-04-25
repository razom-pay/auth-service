import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { PinoLogger } from 'nestjs-pino/PinoLogger'
import { UserRepository } from '@/shared/repositories/user.repository'
import { OtpService } from '../otp/otp.service'
import { TokenService } from '../token/token.service'
import { MessagingService } from '@/infra/messaging/messaging.service'
import { UsersClientGrpc } from '../users/users.grpc'
import { of } from 'rxjs'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@razom-pay/common'

describe('AuthService', () => {
	let service: AuthService
	let userRepository: jest.Mocked<UserRepository>
	let otpService: jest.Mocked<OtpService>
	let tokenService: jest.Mocked<TokenService>
	let messagingService: jest.Mocked<MessagingService>
	let usersClient: jest.Mocked<UsersClientGrpc>
	let logger: jest.Mocked<PinoLogger>

	beforeEach(async () => {
		const mockUserRepository = {
			findByPhone: jest.fn(),
			findByEmail: jest.fn(),
			create: jest.fn(),
			update: jest.fn()
		}

		const mockOtpService = {
			send: jest.fn(),
			verify: jest.fn()
		}

		const mockTokenService = {
			generate: jest.fn(),
			verify: jest.fn()
		}

		const mockMessagingService = {
			otpRequested: jest.fn()
		}

		const mockUsersClientGrpc = {
			create: jest.fn()
		}

		const mockPinoLogger = {
			setContext: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
			error: jest.fn()
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: UserRepository, useValue: mockUserRepository },
				{ provide: OtpService, useValue: mockOtpService },
				{ provide: TokenService, useValue: mockTokenService },
				{ provide: MessagingService, useValue: mockMessagingService },
				{ provide: UsersClientGrpc, useValue: mockUsersClientGrpc },
				{ provide: PinoLogger, useValue: mockPinoLogger }
			]
		}).compile()

		service = module.get<AuthService>(AuthService)
		userRepository = module.get(UserRepository)
		otpService = module.get(OtpService)
		tokenService = module.get(TokenService)
		messagingService = module.get(MessagingService)
		usersClient = module.get(UsersClientGrpc)
		logger = module.get(PinoLogger)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('sendOtp', () => {
		it('should create account if it does not exist and send OTP (email)', async () => {
			userRepository.findByEmail.mockResolvedValue(null)
			userRepository.create.mockResolvedValue({ id: '1' } as any)
			otpService.send.mockResolvedValue({ code: '123456', hash: 'abc123' })

			const result = await service.sendOtp({
				identifier: 'test@example.com',
				type: 'email'
			})

			expect(userRepository.findByEmail).toHaveBeenCalledWith(
				'test@example.com'
			)
			expect(userRepository.create).toHaveBeenCalledWith({
				email: 'test@example.com',
				phone: undefined
			})
			expect(otpService.send).toHaveBeenCalledWith(
				'test@example.com',
				'email'
			)
			expect(messagingService.otpRequested).toHaveBeenCalledWith({
				identifier: 'test@example.com',
				type: 'email',
				code: '123456'
			})
			expect(result).toEqual({ ok: true })
		})

		it('should find existing account and send OTP (phone)', async () => {
			userRepository.findByPhone.mockResolvedValue({ id: '1' } as any)
			otpService.send.mockResolvedValue({ code: '123456', hash: 'abc123' })

			const result = await service.sendOtp({
				identifier: '+123456789',
				type: 'phone'
			})

			expect(userRepository.findByPhone).toHaveBeenCalledWith('+123456789')
			expect(userRepository.create).not.toHaveBeenCalled()
			expect(otpService.send).toHaveBeenCalledWith('+123456789', 'phone')
			expect(result).toEqual({ ok: true })
		})
	})

	describe('verifyOtp', () => {
		it('should verify OTP, update emailVerified and return token', async () => {
			const mockAccount = { id: '1', isEmailVerified: false }
			otpService.verify.mockResolvedValue(undefined)
			userRepository.findByEmail.mockResolvedValue(mockAccount as any)
			usersClient.create.mockReturnValue(of({} as any))
			tokenService.generate.mockReturnValue({
				accessToken: 'acc',
				refreshToken: 'ref'
			} as any)

			const result = await service.verifyOtp({
				identifier: 'test@test.com',
				type: 'email',
				code: '123456'
			})

			expect(otpService.verify).toHaveBeenCalledWith(
				'test@test.com',
				'123456',
				'email'
			)
			expect(userRepository.update).toHaveBeenCalledWith('1', {
				isEmailVerified: true
			})
			expect(usersClient.create).toHaveBeenCalledWith({ id: '1' })
			expect(tokenService.generate).toHaveBeenCalledWith('1')
			expect(result).toEqual({ accessToken: 'acc', refreshToken: 'ref' })
		})

		it('should verify OTP, update phoneVerified and return token', async () => {
			const mockAccount = { id: '1', isPhoneVerified: false }
			otpService.verify.mockResolvedValue(undefined)
			userRepository.findByPhone.mockResolvedValue(mockAccount as any)
			usersClient.create.mockReturnValue(of({} as any))
			tokenService.generate.mockReturnValue({
				accessToken: 'acc',
				refreshToken: 'ref'
			} as any)

			const result = await service.verifyOtp({
				identifier: '+123456789',
				type: 'phone',
				code: '123456'
			})

			expect(userRepository.update).toHaveBeenCalledWith('1', {
				isPhoneVerified: true
			})
			expect(result).toEqual({ accessToken: 'acc', refreshToken: 'ref' })
		})

		it('should throw NOT_FOUND if account missing', async () => {
			otpService.verify.mockResolvedValue(undefined)
			userRepository.findByEmail.mockResolvedValue(null)

			await expect(
				service.verifyOtp({
					identifier: 'test@test.com',
					type: 'email',
					code: '123456'
				})
			).rejects.toThrow(RpcException)
		})
	})

	describe('refresh', () => {
		it('should generate new tokens if refresh token is valid', () => {
			tokenService.verify.mockReturnValue({ valid: true, userId: '1' } as any)
			tokenService.generate.mockReturnValue({
				accessToken: 'new-acc',
				refreshToken: 'new-ref'
			} as any)

			const result = service.refresh({ refreshToken: 'valid-token' })

			expect(tokenService.verify).toHaveBeenCalledWith('valid-token')
			expect(tokenService.generate).toHaveBeenCalledWith('1')
			expect(result).toEqual({
				accessToken: 'new-acc',
				refreshToken: 'new-ref'
			})
		})

		it('should throw UNAUTHENTICATED if refresh token is invalid', () => {
			tokenService.verify.mockReturnValue({
				valid: false,
				reason: 'Expired'
			} as any)

			expect(() => service.refresh({ refreshToken: 'invalid-token' })).toThrow(
				RpcException
			)
		})
	})
})
