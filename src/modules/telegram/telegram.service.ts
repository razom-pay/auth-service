import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@razom-pay/common'
import type { TelegramVerifyRequest } from '@razom-pay/contracts/gen/auth'
import { createHash, createHmac, randomBytes } from 'node:crypto'

import { AllConfigs } from '@/config'
import { RedisService } from '@/infra/redis/redis.service'

import { TokenService } from '../token/token.service'

import { TelegramRepository } from './telegram.repository'

// TODO: create correrct proto message for telegram query and get rid of Record<string, string>
export interface TelegramAuthQuery {
	auth_date: string
	first_name?: string
	hash: string
	id: string
	photo_url?: string
	username?: string
}

@Injectable()
export class TelegramService {
	private readonly BOT_ID: string
	private readonly BOT_TOKEN: string
	private readonly BOT_USERNAME: string
	private readonly REDIRECT_ORIGIN: string

	constructor(
		private readonly redisService: RedisService,
		private readonly configService: ConfigService<AllConfigs>,
		private readonly telegramRepository: TelegramRepository,
		private readonly tokenService: TokenService
	) {
		this.BOT_ID = this.configService.get('telegram.botId', { infer: true })!
		this.BOT_TOKEN = this.configService.get('telegram.botToken', {
			infer: true
		})!
		this.BOT_USERNAME = this.configService.get('telegram.botUsername', {
			infer: true
		})!
		this.REDIRECT_ORIGIN = this.configService.get(
			'telegram.redirectOrigin',
			{ infer: true }
		)!
	}

	getTelegramAuthUrl() {
		const url = new URL(`https://oauth.telegram.org/auth`)
		url.searchParams.append('bot_id', this.BOT_ID)
		url.searchParams.append('origin', this.REDIRECT_ORIGIN)
		url.searchParams.append('request_access', 'write')
		url.searchParams.append('return_to', this.REDIRECT_ORIGIN)
		return { url: url.href }
	}

	async verify(data: TelegramVerifyRequest) {
		const isValid = this.checkTelegramAuth(data.query)

		if (!isValid) {
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				message: 'Invalid Telegram signature'
			})
		}

		const telegramId = data.query.id

		const exists =
			await this.telegramRepository.findByTelegramId(telegramId)

		if (exists && exists.phone) return this.tokenService.generate(exists.id)

		const sessionId = randomBytes(16).toString('hex')

		await this.redisService.set(
			`telegram_session:${sessionId}`,
			JSON.stringify({ telegramId, username: data.query.username }),
			'EX',
			300
		)

		return {
			url: `https://t.me/${this.BOT_USERNAME}?start=${sessionId}`
		}
	}

	checkTelegramAuth(query: Record<string, string>) {
		const hash = query.hash

		if (!hash) return false

		if (query.auth_date) {
			const now = Math.floor(Date.now() / 1000)
			const authDate = Number(query.auth_date)
			if (isNaN(authDate) || now - authDate > 300) {
				return false
			}
		}

		const dataCheckArr = Object.keys(query)
			.filter(key => key !== 'hash')
			.sort()
			.map(key => `${key}=${query[key]}`)

		const datcheckString = dataCheckArr.join('\n')

		const secretKey = createHash('sha256')
			.update(`${this.BOT_ID}:${this.BOT_TOKEN}`)
			.digest()

		const hmac = createHmac('sha256', secretKey)
			.update(datcheckString)
			.digest('hex')

		const isValid = hmac === hash

		return isValid
	}
}
