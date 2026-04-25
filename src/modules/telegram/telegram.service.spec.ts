import { Test, TestingModule } from '@nestjs/testing'
import { TelegramService } from './telegram.service'
import { RedisService } from '@/infra/redis/redis.service'
import { ConfigService } from '@nestjs/config'
import { TelegramRepository } from './telegram.repository'
import { UserRepository } from '@/shared/repositories/user.repository'
import { TokenService } from '../token/token.service'
import { UsersClientGrpc } from '../users/users.grpc'
import { RpcException } from '@nestjs/microservices'
import { of } from 'rxjs'
import * as crypto from 'node:crypto'

describe('TelegramService', () => {
	let service: TelegramService
	let redisService: jest.Mocked<RedisService>
	let configService: jest.Mocked<ConfigService>
	let telegramRepository: jest.Mocked<TelegramRepository>
	let userRepository: jest.Mocked<UserRepository>
	let tokenService: jest.Mocked<TokenService>
	let usersClient: jest.Mocked<UsersClientGrpc>

	beforeEach(async () => {
		const mockRedisService = {
			set: jest.fn(),
			get: jest.fn(),
			del: jest.fn()
		}

		const mockConfigService = {
			get: jest.fn()
		}

		const mockTelegramRepository = {
			findByTelegramId: jest.fn()
		}

		const mockUserRepository = {
			findByPhone: jest.fn(),
			create: jest.fn(),
			update: jest.fn()
		}

		const mockTokenService = {
			generate: jest.fn()
		}

		const mockUsersClientGrpc = {
			create: jest.fn()
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TelegramService,
				{ provide: RedisService, useValue: mockRedisService },
				{ provide: ConfigService, useValue: mockConfigService },
				{ provide: TelegramRepository, useValue: mockTelegramRepository },
				{ provide: UserRepository, useValue: mockUserRepository },
				{ provide: TokenService, useValue: mockTokenService },
				{ provide: UsersClientGrpc, useValue: mockUsersClientGrpc }
			]
		}).compile()

		service = module.get<TelegramService>(TelegramService)
		redisService = module.get(RedisService)
		configService = module.get(ConfigService)
		telegramRepository = module.get(TelegramRepository)
		userRepository = module.get(UserRepository)
		tokenService = module.get(TokenService)
		usersClient = module.get(UsersClientGrpc)

		configService.get.mockImplementation((key: string) => {
			if (key === 'telegram.botId') return '123456'
			if (key === 'telegram.botToken') return 'token'
			if (key === 'telegram.botUsername') return 'test_bot'
			if (key === 'telegram.redirectOrigin') return 'http://localhost'
			return null
		})

		// Reset internal properties that are populated in constructor
		// by re-instantiating the service with the mock config
		service = new TelegramService(
			redisService,
			configService as any,
			telegramRepository,
			userRepository,
			tokenService,
			usersClient
		)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('getTelegramAuthUrl', () => {
		it('should return auth url', () => {
			const result = service.getTelegramAuthUrl()
			expect(result.url).toContain('bot_id=123456')
			expect(result.url).toContain('origin=http%3A%2F%2Flocalhost')
		})
	})

	describe('verify', () => {
		it('should throw UNAUTHENTICATED if checkTelegramAuth fails', async () => {
			jest.spyOn(service, 'checkTelegramAuth').mockReturnValue(false)

			await expect(
				service.verify({ query: { hash: 'invalid' } })
			).rejects.toThrow(RpcException)
		})

		it('should return token if account exists and has phone', async () => {
			jest.spyOn(service, 'checkTelegramAuth').mockReturnValue(true)
			telegramRepository.findByTelegramId.mockResolvedValue({
				id: '1',
				phone: '123'
			} as any)
			tokenService.generate.mockReturnValue({
				accessToken: 'acc',
				refreshToken: 'ref'
			} as any)

			const result = await service.verify({
				query: { id: 'tg123', hash: 'valid' }
			})

			expect(result).toEqual({ accessToken: 'acc', refreshToken: 'ref' })
		})

		it('should return url with session if account is new or no phone', async () => {
			jest.spyOn(service, 'checkTelegramAuth').mockReturnValue(true)
			telegramRepository.findByTelegramId.mockResolvedValue(null)
			redisService.set.mockResolvedValue('OK')

			const result = await service.verify({
				query: { id: 'tg123', username: 'test', hash: 'valid' }
			})

			expect(redisService.set).toHaveBeenCalled()
			expect('url' in result).toBe(true)
			expect((result as any).url).toContain('https://t.me/test_bot?start=')
		})
	})

	describe('complete', () => {
		it('should throw NOT_FOUND if session is missing', async () => {
			redisService.get.mockResolvedValue(null)

			await expect(
				service.complete({ sessionId: '123', phone: '123456' })
			).rejects.toThrow(RpcException)
		})

		it('should update user, generate tokens, and clear session', async () => {
			redisService.get.mockResolvedValue(
				JSON.stringify({ telegramId: 'tg123' })
			)
			userRepository.findByPhone.mockResolvedValue(null)
			userRepository.create.mockResolvedValue({ id: '1' } as any)
			tokenService.generate.mockReturnValue({
				accessToken: 'acc',
				refreshToken: 'ref'
			} as any)

			const result = await service.complete({
				sessionId: 'session',
				phone: '123456'
			})

			expect(userRepository.create).toHaveBeenCalledWith({ phone: '123456' })
			expect(userRepository.update).toHaveBeenCalledWith('1', {
				telegramId: 'tg123',
				isPhoneVerified: true
			})
			expect(redisService.set).toHaveBeenCalledWith(
				'telegram_tokens:session',
				expect.any(String),
				'EX',
				120
			)
			expect(redisService.del).toHaveBeenCalledWith('telegram_session:session')
			expect(result).toEqual({ sessionId: 'session' })
		})
	})

	describe('consumeSession', () => {
		it('should return tokens and delete session', async () => {
			redisService.get.mockResolvedValue(
				JSON.stringify({ accessToken: 'acc' })
			)

			const result = await service.consumeSession({ sessionId: '123' })

			expect(redisService.del).toHaveBeenCalledWith('telegram_tokens:123')
			expect(result).toEqual({ accessToken: 'acc' })
		})

		it('should throw if tokens missing', async () => {
			redisService.get.mockResolvedValue(null)

			await expect(
				service.consumeSession({ sessionId: '123' })
			).rejects.toThrow(RpcException)
		})
	})
})
