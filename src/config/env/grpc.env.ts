import { registerAs } from '@nestjs/config'

import { validateEnv } from '@/shared/utils'

import type { GrpcConfig } from '../interfaces/grpc.interface'
import { GrpcValidator } from '../validators'

export const grpcEnv = registerAs<GrpcConfig>('grpc', () => {
	validateEnv(process.env, GrpcValidator)

	return {
		host: process.env.GRPC_HOST!,
		port: parseInt(process.env.GRPC_PORT!),
		clients: {
			users: process.env.USERS_GRPC_URL!
		}
	}
})
