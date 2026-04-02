import { IsString, IsUrl } from 'class-validator'

export class TelegramValidator {
	@IsString()
	TELEGRAM_BOT_ID: string

	@IsString()
	TELEGRAM_BOT_TOKEN: string

	@IsString()
	TELEGRAM_BOT_USERNAME: string

	@IsUrl()
	TELEGRAM_REDIRECT_ORIGIN: string
}
