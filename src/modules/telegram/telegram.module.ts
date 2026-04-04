import { Module } from '@nestjs/common'

import { UserRepository } from '@/shared/repositories'

import { TokenService } from '../token/token.service'

import { TelegramController } from './telegram.controller'
import { TelegramRepository } from './telegram.repository'
import { TelegramService } from './telegram.service'

@Module({
	controllers: [TelegramController],
	providers: [
		TelegramService,
		TelegramRepository,
		UserRepository,
		TokenService
	]
})
export class TelegramModule {}
