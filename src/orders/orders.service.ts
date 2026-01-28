import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class OrdersService {
	constructor(private prisma: PrismaService) {}

	async create(data: {
		customerName: string
		customerEmail: string
		customerPhone: string
		items: Array<{ productId: number; quantity: number; price: number }>
	}) {
		const totalAmount = data.items.reduce(
			(sum, item) => sum + item.price * item.quantity,
			0,
		)
		const orderNumber = `ORD-${Date.now()}`

		return this.prisma.order.create({
			data: {
				orderNumber,
				customerName: data.customerName,
				customerEmail: data.customerEmail,
				customerPhone: data.customerPhone,
				totalAmount,
				items: {
					create: data.items,
				},
			},
			include: { items: { include: { product: true } } },
		})
	}

	async findAll() {
		return this.prisma.order.findMany({
			include: { items: { include: { product: true } } },
			orderBy: { createdAt: 'desc' },
		})
	}

	async findOne(id: number) {
		return this.prisma.order.findUnique({
			where: { id },
			include: { items: { include: { product: true } } },
		})
	}

	async updateStatus(id: number, status: string) {
		return this.prisma.order.update({
			where: { id },
			data: { status: status as any },
		})
	}
}
