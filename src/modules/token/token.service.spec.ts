import { Test, TestingModule } from '@nestjs/testing'
import { TokenService } from './token.service'
import { ConfigService } from '@nestjs/config'
import { PassportService } from '@razom-pay/passport'

describe('TokenService', () => {
	let service: TokenService
	let configService: jest.Mocked<ConfigService>
	let passportService: jest.Mocked<PassportService>

	beforeEach(async () => {
		const mockConfigService = {
			get: jest.fn()
		}

		const mockPassportService = {
			generateToken: jest.fn(),
			verifyToken: jest.fn()
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TokenService,
				{ provide: ConfigService, useValue: mockConfigService },
				{ provide: PassportService, useValue: mockPassportService }
			]
		}).compile()

		configService = module.get(ConfigService)
		passportService = module.get(PassportService)

		configService.get.mockImplementation((key: string) => {
			if (key === 'passport.accessTokenTTL') return 900 // 15 mins
			if (key === 'passport.refreshTokenTTL') return 2592000 // 30 days
			return null
		})

		// Reset internal properties that are populated in constructor
		service = new TokenService(configService as any, passportService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('generate', () => {
		it('should generate access and refresh tokens', () => {
			passportService.generateToken.mockReturnValueOnce('access_token')
			passportService.generateToken.mockReturnValueOnce('refresh_token')

			const result = service.generate('user-123')

			expect(passportService.generateToken).toHaveBeenNthCalledWith(
				1,
				'user-123',
				900
			)
			expect(passportService.generateToken).toHaveBeenNthCalledWith(
				2,
				'user-123',
				2592000
			)
			expect(result).toEqual({
				accessToken: 'access_token',
				refreshToken: 'refresh_token'
			})
		})
	})

	describe('verify', () => {
		it('should verify token using passportService', () => {
			const expectedResult = { valid: true, userId: 'user-123' }
			passportService.verifyToken.mockReturnValue(expectedResult as any)

			const result = service.verify('some-token')

			expect(passportService.verifyToken).toHaveBeenCalledWith('some-token')
			expect(result).toEqual(expectedResult)
		})
	})
})
