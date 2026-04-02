import { Injectable } from '@nestjs/common'
import { AccountCreateInput } from '@prisma/generated/models'

import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class AuthRepository {
	constructor(private readonly prismaService: PrismaService) {}

	create(data: AccountCreateInput) {
		return this.prismaService.account.create({
			data
		})
	}
}
