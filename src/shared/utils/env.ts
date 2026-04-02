import { ClassConstructor, plainToClass } from 'class-transformer'
import { validateSync } from 'class-validator'

export function validateEnv<T extends object>(
	config: Record<string, string | undefined>,
	envVariablesClass: ClassConstructor<T>
) {
	const validatedConfig = plainToClass(envVariablesClass, config, {
		enableImplicitConversion: true
	})

	const errors = validateSync(validatedConfig, {
		skipMissingProperties: false
	})

	if (errors.length > 0) {
		const errorMessages = errors
			.map(
				error =>
					`\nError in ${error.property}:\n${Object.entries(
						error.constraints!
					)
						.map(([key, value]) => `+  ${key}: ${value}`)
						.join('\n')}`
			)
			.join('\n')

		console.error(`\n${errors.toString()}\n`)
		throw new Error(errorMessages)
	}

	return validatedConfig
}
