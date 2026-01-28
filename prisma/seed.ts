import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
	// Создание админа
	const hashedPassword = await bcrypt.hash('admin123', 10)

	await prisma.user.upsert({
		where: { email: 'admin@example.com' },
		update: {},
		create: {
			email: 'admin@example.com',
			password: hashedPassword,
			role: 'ADMIN',
		},
	})

	console.log('Seed completed: admin@example.com / admin123')
}

main()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
