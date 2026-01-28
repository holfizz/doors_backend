import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as xml2js from 'xml2js'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ImportService {
	constructor(private prisma: PrismaService) {}

	async importFromXml(filePath: string) {
		const xmlData = fs.readFileSync(filePath, 'utf-8')
		const parser = new xml2js.Parser()
		const result = await parser.parseStringPromise(xmlData)

		const categories = result.yml_catalog.shop[0].categories[0].category
		const offers = result.yml_catalog.shop[0].offers[0].offer

		// Импорт категорий
		for (const cat of categories) {
			const categoryData = {
				name: cat._,
				slug: this.slugify(cat._),
				parentId: cat.$.parentId ? parseInt(cat.$.parentId) : null,
			}

			await this.prisma.category.upsert({
				where: { slug: categoryData.slug },
				update: categoryData,
				create: { ...categoryData, id: parseInt(cat.$.id) },
			})
		}

		// Импорт товаров
		let imported = 0
		for (const offer of offers) {
			try {
				const productData = {
					name: offer.name[0],
					slug: this.slugify(offer.name[0]),
					vendorCode: offer.vendorCode[0],
					categoryId: parseInt(offer.categoryId[0]),
					basePrice: parseFloat(offer.price[0]),
					retailPrice: parseFloat(offer.roznPrice[0]),
					available: offer.$.available === 'true',
				}

				const product = await this.prisma.product.upsert({
					where: { vendorCode: productData.vendorCode },
					update: productData,
					create: productData,
				})

				// Добавление изображений
				if (offer.picture && offer.picture[0]) {
					await this.prisma.productImage.upsert({
						where: { id: product.id },
						update: { url: offer.picture[0] },
						create: { productId: product.id, url: offer.picture[0], order: 0 },
					})
				}

				imported++
			} catch (error) {
				console.error(
					`Ошибка импорта товара ${offer.vendorCode}:`,
					error.message,
				)
			}
		}

		return { imported, total: offers.length }
	}

	private slugify(text: string): string {
		return text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim()
	}
}
