import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import type {
	RefreshRequest,
	SendOtpRequest,
	VerifyOtpRequest
} from '@razom-pay/contracts/gen/auth'

import { AuthService } from './auth.service'

@Controller()
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@GrpcMethod('AuthService', 'SendOtp')
	sendOtp(data: SendOtpRequest) {
		return this.authService.sendOtp(data)
	}

	@GrpcMethod('AuthService', 'VerifyOtp')
	verifyOtp(data: VerifyOtpRequest) {
		return this.authService.verifyOtp(data)
	}

	@GrpcMethod('AuthService', 'Refresh')
	refresh(data: RefreshRequest) {
		return this.authService.refresh(data)
	}
}
