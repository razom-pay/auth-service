import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import {
	databaseEnv,
	grpcEnv,
	passportEnv,
	redisEnv,
	rmqEnv,
	telegramEnv
} from './config'
import { MessagingModule } from './infra/messaging/messaging.module'
import { PrismaModule } from './infra/prisma/prisma.module'
import { RedisModule } from './infra/redis/redis.module'
import { AccountModule } from './modules/account/account.module'
import { AuthModule } from './modules/auth/auth.module'
import { OtpModule } from './modules/otp/otp.module'
import { TelegramModule } from './modules/telegram/telegram.module'
import { TokenModule } from './modules/token/token.module'
import { UsersModule } from './modules/users/users.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [
				databaseEnv,
				grpcEnv,
				passportEnv,
				redisEnv,
				rmqEnv,
				telegramEnv
			]
		}),
		PrismaModule,
		RedisModule,
		AuthModule,
		RedisModule,
		MessagingModule,
		OtpModule,
		AccountModule,
		TelegramModule,
		TokenModule,
		UsersModule
	]
})
export class AppModule {}
