import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import {
	databaseEnv,
	grpcEnv,
	passportEnv,
	redisEnv,
	telegramEnv
} from './config'
import { PrismaModule } from './infra/prisma/prisma.module'
import { RedisModule } from './infra/redis/redis.module'
import { AccountModule } from './modules/account/account.module'
import { AuthModule } from './modules/auth/auth.module'
import { OtpModule } from './modules/otp/otp.module'
import { TelegramModule } from './modules/telegram/telegram.module';
import { TokenModule } from './modules/token/token.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [databaseEnv, grpcEnv, passportEnv, redisEnv, telegramEnv]
		}),
		PrismaModule,
		RedisModule,
		AuthModule,
		RedisModule,
		OtpModule,
		AccountModule,
		TelegramModule,
		TokenModule
	]
})
export class AppModule {}
