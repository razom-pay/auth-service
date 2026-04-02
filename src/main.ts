import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { AllConfigs } from './config'
import { createGrpcServer } from './infra/grpc/grpc.server'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const configService = app.get(ConfigService<AllConfigs>)

	createGrpcServer(app, configService)

	await app.startAllMicroservices()
	await app.init()
}

bootstrap()
