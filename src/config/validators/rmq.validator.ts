import { Matches } from 'class-validator'

export class RmqValidator {
	@Matches(/^amqp:\/\/[^:]+:[^@]+@[^:]+:\d+$/, {
		message: 'RMQ_URL must be in the format amqp://user:pass@host:port'
	})
	RMQ_URL!: string
}
