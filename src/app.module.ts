import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'

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
import { ObservabilityModule } from './observability/observability.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: [
				`.env.${process.env.NODE_ENV}.local`,
				`.env.${process.env.NODE_ENV}`,
				'.env'
			],
			load: [
				databaseEnv,
				grpcEnv,
				passportEnv,
				redisEnv,
				rmqEnv,
				telegramEnv
			]
		}),
		LoggerModule.forRoot({
			pinoHttp: {
				level: process.env.LOG_LEVEL,
				transport: {
					target: 'pino/file',
					options: {
						destination: '/var/log/services/auth/auth.log',
						mkdir: true
					}
				},
				messageKey: 'msg',
				customProps: () => ({
					service: 'auth-service'
				})
			}
		}),
		PrismaModule,
		RedisModule,
		AuthModule,
		RedisModule,
		MessagingModule,
		ObservabilityModule,
		OtpModule,
		AccountModule,
		TelegramModule,
		TokenModule,
		UsersModule
	]
})
export class AppModule {}
