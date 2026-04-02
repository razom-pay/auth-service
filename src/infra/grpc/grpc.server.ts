import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type MicroserviceOptions, Transport } from '@nestjs/microservices'

import type { AllConfigs } from '@/config'

import { grpcLoader, grpcPackages, grpcProtoPaths } from './grpc.options'

export function createGrpcServer(
	app: INestApplication,
	configService: ConfigService<AllConfigs>
) {
	const host = configService.get('grpc.host', { infer: true })
	const port = configService.get('grpc.port', { infer: true })
	const url = `${host}:${port}`

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.GRPC,
		options: {
			package: grpcPackages,
			protoPath: grpcProtoPaths,
			url: url,
			loader: grpcLoader
		}
	})
}
