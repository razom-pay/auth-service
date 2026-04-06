import { registerAs } from '@nestjs/config'

import { validateEnv } from '@/shared/utils'

import type { PassportConfig } from '../interfaces/passport.interface'
import { PassportValidator } from '../validators'

export const passportEnv = registerAs<PassportConfig>('passport', () => {
	validateEnv(process.env, PassportValidator)

	return {
		secretKey: process.env.PASSPORT_SECRET_KEY!,
		accessTokenTTL: parseInt(process.env.PASSPORT_ACCESS_TOKEN_TTL!),
		refreshTokenTTL: parseInt(process.env.PASSPORT_REFRESH_TOKEN_TTL!)
	}
})
