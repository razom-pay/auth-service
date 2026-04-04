import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import type {
	TelegramCompleteRequest,
	TelegramConsumeRequest,
	TelegramVerifyRequest
} from '@razom-pay/contracts/gen/auth'

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

	@GrpcMethod('AuthService', 'TelegramComplete')
	complete(data: TelegramCompleteRequest) {
		return this.telegramService.complete(data)
	}

	@GrpcMethod('AuthService', 'TelegramConsume')
	consumeSession(data: TelegramConsumeRequest) {
		return this.telegramService.consumeSession(data)
	}
}
