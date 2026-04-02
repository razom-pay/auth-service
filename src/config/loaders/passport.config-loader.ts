import { ConfigService } from '@nestjs/config'

import type { AllConfigs } from '../interfaces'

export function getPassportConfig(configService: ConfigService<AllConfigs>) {
	return {
		secretKey: configService.get('passport.secretKey', {
			infer: true
		})!
	}
}
