import { IsNumber, IsString } from 'class-validator'

export class PassportValidator {
	@IsString()
	PASSPORT_SECRET_KEY: string

	@IsNumber()
	PASSPORT_ACCESS_TOKEN_TTL: number

	@IsNumber()
	PASSPORT_REFRESH_TOKEN_TTL: number
}
