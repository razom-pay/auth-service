import {
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

import type { AllConfigs } from '@/config'

@Injectable()
export class RedisService
	extends Redis
	implements OnModuleInit, OnModuleDestroy
{
	private readonly logger = new Logger(RedisService.name)

	constructor(private readonly configService: ConfigService<AllConfigs>) {
		super({
			username: configService.get('redis.user', { infer: true }),
			password: configService.get('redis.password', { infer: true }),
			host: configService.get('redis.host', { infer: true }),
			port: configService.get('redis.port', { infer: true }),
			maxRetriesPerRequest: 5,
			enableOfflineQueue: true
		})
	}

	onModuleInit() {
		const start = Date.now()

		this.logger.log('Initializing Redis connection...')

		this.on('connect', () => {
			this.logger.log('Redis connecting...')
		})

		this.on('ready', () => {
			const ms = Date.now() - start
			this.logger.log(`Redis connection established in ${ms}ms`)
		})

		this.on('error', error => {
			this.logger.error('Redis error', error.message)
		})

		this.on('close', () => {
			this.logger.warn('Redis connection closed')
		})

		this.on('reconnecting', () => {
			this.logger.warn('Redis reconnecting...')
		})
	}

	public async onModuleDestroy() {
		this.logger.log('Closing Redis connection...')
		try {
			await this.quit()
			this.logger.log('Redis connection closed')
		} catch (error) {
			this.logger.error('Error closing Redis connection', error)
		}
	}
}
