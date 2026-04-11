import { Module } from '@nestjs/common'

import { UserRepository } from '@/shared/repositories'

import { TokenService } from '../token/token.service'
import { UsersModule } from '../users/users.module'

import { TelegramController } from './telegram.controller'
import { TelegramRepository } from './telegram.repository'
import { TelegramService } from './telegram.service'

@Module({
	imports: [UsersModule],
	controllers: [TelegramController],
	providers: [
		TelegramService,
		TelegramRepository,
		UserRepository,
		TokenService
	]
})
export class TelegramModule {}
