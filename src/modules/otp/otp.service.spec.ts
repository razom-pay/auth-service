import { Test, TestingModule } from '@nestjs/testing'
import { OtpService } from './otp.service'
import { PinoLogger } from 'nestjs-pino/PinoLogger'
import { RedisService } from '@/infra/redis/redis.service'
import { RpcException } from '@nestjs/microservices'
import { createHash } from 'node:crypto'

describe('OtpService', () => {
	let service: OtpService
	let redisService: jest.Mocked<RedisService>

	beforeEach(async () => {
		const mockRedisService = {
			set: jest.fn(),
			get: jest.fn(),
			del: jest.fn()
		}

		const mockPinoLogger = {
			setContext: jest.fn(),
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn()
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				OtpService,
				{ provide: RedisService, useValue: mockRedisService },
				{ provide: PinoLogger, useValue: mockPinoLogger }
			]
		}).compile()

		service = module.get<OtpService>(OtpService)
		redisService = module.get(RedisService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('send', () => {
		it('should generate code, store in redis and return code', async () => {
			const identifier = 'test@example.com'
			const type = 'email'

			const result = await service.send(identifier, type)

			expect(result.code).toHaveLength(6)
			expect(result.hash).toBeDefined()
			expect(redisService.set).toHaveBeenCalledWith(
				`otp:${type}:${identifier}`,
				result.hash,
				'EX',
				300
			)
		})
	})

	describe('verify', () => {
		it('should verify correct code and delete from redis', async () => {
			const identifier = '+123456789'
			const type = 'phone'
			const code = '123456'
			const hash = createHash('sha256').update(code).digest('hex')

			redisService.get.mockResolvedValue(hash)

			await expect(service.verify(identifier, code, type)).resolves.toBeUndefined()

			expect(redisService.get).toHaveBeenCalledWith(`otp:${type}:${identifier}`)
			expect(redisService.del).toHaveBeenCalledWith(`otp:${type}:${identifier}`)
		})

		it('should throw NOT_FOUND if code is missing in redis', async () => {
			redisService.get.mockResolvedValue(null)

			await expect(
				service.verify('test@test.com', '123456', 'email')
			).rejects.toThrow(RpcException)
		})

		it('should throw NOT_FOUND if code does not match', async () => {
			const hash = createHash('sha256').update('111111').digest('hex')
			redisService.get.mockResolvedValue(hash)

			await expect(
				service.verify('test@test.com', '123456', 'email')
			).rejects.toThrow(RpcException)
		})
	})
})
