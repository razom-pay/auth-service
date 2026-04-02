import { Injectable } from '@nestjs/common'
import type { AccountUpdateInput } from '@prisma/generated/internal/prismaNamespaceBrowser'

import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class UserRepository {
	constructor(private readonly prismaService: PrismaService) {}

	findByPhone(phone: string) {
		return this.prismaService.account.findUnique({
			where: {
				phone
			}
		})
	}

	findByEmail(email: string) {
		return this.prismaService.account.findUnique({
			where: {
				email
			}
		})
	}

	update(id: string, data: AccountUpdateInput) {
		return this.prismaService.account.update({
			where: {
				id
			},
			data
		})
	}
}
