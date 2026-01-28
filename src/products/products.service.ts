import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ProductsService {
	constructor(private prisma: PrismaService) {}

	async findAll(params?: {
		categoryId?: number
		search?: string
		skip?: number
		take?: number
		sortBy?: string
		sortOrder?: 'asc' | 'desc'
	}) {
		const where: Prisma.ProductWhereInput = {
			available: true,
			images: {
				some: {}, // Только товары с изображениями
			},
			...(params?.categoryId && { categoryId: params.categoryId }),
			...(params?.search && {
				OR: [
					{ name: { contains: params.search, mode: 'insensitive' } },
					{ vendorCode: { contains: params.search, mode: 'insensitive' } },
				],
			}),
		}

		// Определяем сортировку
		let orderBy: any = { createdAt: 'desc' } // По умолчанию

		if (params?.sortBy) {
			switch (params.sortBy) {
				case 'price':
					orderBy = { retailPrice: params.sortOrder || 'asc' }
					break
				case 'name':
					orderBy = { name: params.sortOrder || 'asc' }
					break
				case 'popular':
					// Можно добавить поле popularity в будущем
					orderBy = { createdAt: 'desc' }
					break
				default:
					orderBy = { createdAt: 'desc' }
			}
		}

		const [products, total] = await Promise.all([
			this.prisma.product.findMany({
				where,
				include: { category: true, images: true, variants: true },
				skip: params?.skip || 0,
				take: params?.take || 100,
				orderBy,
			}),
			this.prisma.product.count({ where }),
		])

		// Логирование для отладки
		console.log(
			`[ProductsService] Found ${products.length} products out of ${total} total`,
		)
		if (products.length > 0) {
			console.log(`[ProductsService] First product images:`, products[0].images)
			if (products[0].images.length > 0) {
				console.log(
					`[ProductsService] First image URL:`,
					products[0].images[0].url,
				)
			}
		}

		return { products, total }
	}

	async findOne(id: number) {
		return this.prisma.product.findUnique({
			where: { id },
			include: { category: true, images: true, variants: true },
		})
	}

	async findBySlug(slug: string) {
		return this.prisma.product.findUnique({
			where: { slug },
			include: { category: true, images: true, variants: true },
		})
	}

	async create(data: Prisma.ProductCreateInput) {
		return this.prisma.product.create({
			data,
			include: { images: true, variants: true },
		})
	}

	async update(id: number, data: Prisma.ProductUpdateInput) {
		return this.prisma.product.update({ where: { id }, data })
	}

	async remove(id: number) {
		return this.prisma.product.delete({ where: { id } })
	}
}
