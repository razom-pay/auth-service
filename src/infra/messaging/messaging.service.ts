import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import type {
	EmailChangeEvent,
	OtpRequestedEvent,
	PhoneChangeEvent
} from '@razom-pay/contracts'

@Injectable()
export class MessagingService {
	constructor(
		@Inject('NOTIFICATIONS_CLIENT') private readonly client: ClientProxy
	) {}

	otpRequested(data: OtpRequestedEvent) {
		return this.client.emit('auth.otp.requested', data)
	}

	phoneChange(data: PhoneChangeEvent) {
		return this.client.emit('account.phone.change', data)
	}

	emailChange(data: EmailChangeEvent) {
		return this.client.emit('account.email.change', data)
	}
}
