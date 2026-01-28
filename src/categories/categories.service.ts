import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CategoriesService {
	constructor(private prisma: PrismaService) {}

	async findAll() {
		return this.prisma.category.findMany({
			include: { children: true, _count: { select: { products: true } } },
			orderBy: { name: 'asc' },
		})
	}

	async findOne(id: number) {
		return this.prisma.category.findUnique({
			where: { id },
			include: { children: true, products: { include: { images: true } } },
		})
	}

	async create(data: { name: string; slug: string; parentId?: number }) {
		return this.prisma.category.create({ data })
	}

	async update(
		id: number,
		data: { name?: string; slug?: string; parentId?: number },
	) {
		return this.prisma.category.update({ where: { id }, data })
	}

	async remove(id: number) {
		return this.prisma.category.delete({ where: { id } })
	}
}
