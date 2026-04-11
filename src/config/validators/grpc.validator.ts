import { IsInt, IsString } from 'class-validator'

export class GrpcValidator {
	@IsString()
	GRPC_HOST!: string

	@IsInt()
	GRPC_PORT!: number

	@IsString()
	USERS_GRPC_URL!: string
}
