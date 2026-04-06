import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import type { OtpRequestedEvent } from '@razom-pay/contracts'

@Injectable()
export class MessagingService {
	constructor(
		@Inject('NOTIFICATIONS_CLIENT') private readonly client: ClientProxy
	) {}

	otpRequested(data: OtpRequestedEvent) {
		return this.client.emit('auth.otp.requested', data)
	}
}
