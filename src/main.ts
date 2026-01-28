import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger: ['log', 'error', 'warn', 'debug', 'verbose'],
	})

	app.enableCors({
		origin: process.env.FRONTEND_URL || 'http://localhost:3000',
		credentials: true,
	})

	app.useGlobalPipes(new ValidationPipe({ transform: true }))

	// Логирование всех входящих запросов
	app.use((req, res, next) => {
		console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
		next()
	})

	const port = process.env.PORT || 3001
	await app.listen(port)
	console.log(`Backend running on http://localhost:${port}`)
	console.log(
		`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`,
	)
}
bootstrap()
