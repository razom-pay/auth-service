import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class TelegramRepository {
	constructor(private readonly prismaService: PrismaService) {}

	findByTelegramId(telegramId: string) {
		return this.prismaService.account.findUnique({
			where: {
				telegramId
			}
		})
	}
}
