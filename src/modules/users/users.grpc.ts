import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import type {
	CreateUserRequest,
	UsersServiceClient
} from '@razom-pay/contracts/gen/users'

@Injectable()
export class UsersClientGrpc implements OnModuleInit {
	private usersService!: UsersServiceClient

	constructor(@Inject('USERS_PACKAGE') private readonly client: ClientGrpc) {}

	onModuleInit() {
		this.usersService =
			this.client.getService<UsersServiceClient>('UsersService')
	}

	create(request: CreateUserRequest) {
		return this.usersService.createUser(request)
	}
}
