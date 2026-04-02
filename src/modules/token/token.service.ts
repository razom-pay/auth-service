import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportService, TokenPayload } from '@razom-pay/passport'

import type { AllConfigs } from '@/config'

@Injectable()
export class TokenService {
	private readonly ACCESS_TOKEN_TTL: number
	private readonly REFRESH_TOKEN_TTL: number

	constructor(
		private readonly configService: ConfigService<AllConfigs>,
		private readonly passportService: PassportService
	) {
		this.ACCESS_TOKEN_TTL = this.configService.get(
			'passport.accessTokenTTL',
			{
				infer: true
			}
		)!
		this.REFRESH_TOKEN_TTL = this.configService.get(
			'passport.refreshTokenTTL',
			{
				infer: true
			}
		)!
	}

	generate(userId: string) {
		const payload: TokenPayload = { sub: userId }

		const accessToken = this.passportService.generateToken(
			String(payload.sub),
			this.ACCESS_TOKEN_TTL
		)
		const refreshToken = this.passportService.generateToken(
			String(payload.sub),
			this.REFRESH_TOKEN_TTL
		)

		return { accessToken, refreshToken }
	}

	verify(token: string) {
		return this.passportService.verifyToken(token)
	}
}
