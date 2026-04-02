import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class AccountRepository {
	constructor(private readonly prismaService: PrismaService) {}

	findById(accountId: string) {
		return this.prismaService.account.findUnique({
			where: { id: accountId }
		})
	}

	findPendingChange(accountId: string, type: 'email' | 'phone') {
		return this.prismaService.pendingContactChange.findUnique({
			where: {
				accountId_type: {
					accountId,
					type
				}
			}
		})
	}

	upsertPendingChange(data: {
		accountId: string
		type: 'email' | 'phone'
		value: string
		codeHash: string
		expiresAt: Date
	}) {
		return this.prismaService.pendingContactChange.upsert({
			where: {
				accountId_type: {
					accountId: data.accountId,
					type: data.type
				}
			},
			create: data,
			update: data
		})
	}

	deletePendingChange(accountId: string, type: 'email' | 'phone') {
		return this.prismaService.pendingContactChange.delete({
			where: {
				accountId_type: {
					accountId,
					type
				}
			}
		})
	}
}
