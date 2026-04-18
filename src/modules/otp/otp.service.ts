import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@razom-pay/common'
import { PinoLogger } from 'nestjs-pino/PinoLogger'
import { createHash, randomInt } from 'node:crypto'

import { RedisService } from '@/infra/redis/redis.service'

@Injectable()
export class OtpService {
	constructor(
		private readonly logger: PinoLogger,
		private readonly redisService: RedisService
	) {
		this.logger.setContext(OtpService.name)
	}

	async send(identifier: string, type: 'email' | 'phone') {
		const { code, hash } = this.generateCode()

		this.logger.debug(
			`OTP generated for ${identifier}: ${code}, hash=${hash}`
		)

		await this.redisService.set(
			`otp:${type}:${identifier}`,
			hash,
			'EX',
			300
		)

		this.logger.info('OTP stored in Redis with expiration time')

		return { code, hash }
	}

	async verify(identifier: string, code: string, type: 'email' | 'phone') {
		const storedHash = await this.redisService.get(
			`otp:${type}:${identifier}`
		)

		if (!storedHash) {
			this.logger.warn(
				`OTP verification failed for ${identifier}: Invalid or expired code`
			)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Invalid or expired code'
			})
		}

		const incomingHash = createHash('sha256').update(code).digest('hex')

		if (incomingHash !== storedHash) {
			this.logger.warn(
				`OTP verification failed for ${identifier}: Invalid or expired code`
			)

			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Invalid or expired code'
			})
		}

		await this.redisService.del(`otp:${type}:${identifier}`)
	}

	private generateNumericCode(length: number) {
		let code = ''
		for (let i = 0; i < length; i++) {
			code += randomInt(0, 10).toString()
		}
		return code
	}

	private generateCode() {
		const code = this.generateNumericCode(6)
		const hash = createHash('sha256').update(code).digest('hex')

		this.logger.debug(`Generated OTP code: ${code}, hash: ${hash}`)

		return { code, hash }
	}
}
