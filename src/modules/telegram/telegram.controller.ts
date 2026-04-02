import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import type { TelegramVerifyRequest } from '@razom-pay/contracts/gen/auth'

import { TelegramService } from './telegram.service'

@Controller()
export class TelegramController {
	constructor(private readonly telegramService: TelegramService) {}

	@GrpcMethod('AuthService', 'TelegramInit')
	getAuthUrl() {
		return this.telegramService.getTelegramAuthUrl()
	}

	@GrpcMethod('AuthService', 'TelegramVerify')
	verify(data: TelegramVerifyRequest) {
		return this.telegramService.verify(data)
	}
}
