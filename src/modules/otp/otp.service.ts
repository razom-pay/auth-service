import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@razom-pay/common'
import { createHash, randomInt } from 'node:crypto'

import { RedisService } from '@/infra/redis/redis.service'

@Injectable()
export class OtpService {
	constructor(private readonly redisService: RedisService) {}

	async send(identifier: string, type: 'email' | 'phone') {
		const { code, hash } = this.generateCode()

		await this.redisService.set(
			`otp:${type}:${identifier}`,
			hash,
			'EX',
			300
		)

		return { code, hash }
	}

	async verify(identifier: string, code: string, type: 'email' | 'phone') {
		const storedHash = await this.redisService.get(
			`otp:${type}:${identifier}`
		)

		if (!storedHash)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Invalid or expired code'
			})

		const incomingHash = createHash('sha256').update(code).digest('hex')

		if (incomingHash !== storedHash)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Invalid or expired code'
			})

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

		return { code, hash }
	}
}
