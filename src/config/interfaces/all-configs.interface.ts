import type { DatabaseConfig } from './database.interface'
import type { GrpcConfig } from './grpc.interfaces'
import type { PassportConfig } from './passport.interface'
import type { RedisConfig } from './redis.interface'
import type { TelegramConfig } from './telegram.interface'

export interface AllConfigs {
	database: DatabaseConfig
	grpc: GrpcConfig
	passport: PassportConfig
	redis: RedisConfig
	telegram: TelegramConfig
}
