import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import type {
	ConfirmEmailChangeRequest,
	ConfirmPhoneChangeRequest,
	GetAccountRequest,
	InitEmailChangeRequest,
	InitPhoneChangeRequest
} from '@razom-pay/contracts/gen/account'

import { AccountService } from './account.service'

@Controller()
export class AccountController {
	constructor(private readonly accountService: AccountService) {}

	@GrpcMethod('AccountService', 'GetAccount')
	async getAccount(data: GetAccountRequest) {
		return this.accountService.getAccount(data)
	}

	@GrpcMethod('AccountService', 'InitEmailChange')
	async initEmailChange(data: InitEmailChangeRequest) {
		return this.accountService.initEmailChange(data)
	}

	@GrpcMethod('AccountService', 'ConfirmEmailChange')
	async confirmEmailChange(data: ConfirmEmailChangeRequest) {
		return this.accountService.confirmEmailChange(data)
	}

	@GrpcMethod('AccountService', 'InitPhoneChange')
	async initPhoneChange(data: InitPhoneChangeRequest) {
		return this.accountService.initPhoneChange(data)
	}

	@GrpcMethod('AccountService', 'ConfirmPhoneChange')
	async confirmPhoneChange(data: ConfirmPhoneChangeRequest) {
		return this.accountService.confirmPhoneChange(data)
	}
}
