import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parseStringPromise } from 'xml2js'

const prisma = new PrismaClient()

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-zа-яё0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim()
		.substring(0, 200)
}

async function importXML(filePath: string) {
	console.log(`\n📦 Импорт файла: ${path.basename(filePath)}`)

	const xmlContent = fs.readFileSync(filePath, 'utf-8')
	const result = await parseStringPromise(xmlContent)

	const shop = result.yml_catalog.shop[0]
	const categories = shop.categories[0].category || []
	const offers = shop.offers[0].offer || []

	console.log(`📁 Категорий: ${categories.length}`)
	console.log(`📦 Товаров: ${offers.length}`)

	// Импорт категорий
	const categoryMap = new Map<string, number>()

	for (const cat of categories) {
		const categoryId = parseInt(cat.$.id)
		const parentId = cat.$.parentId ? parseInt(cat.$.parentId) : null
		const name = cat._
		const slug = slugify(name) + '-' + categoryId

		try {
			const category = await prisma.category.upsert({
				where: { id: categoryId },
				update: { name, slug, parentId },
				create: { id: categoryId, name, slug, parentId },
			})
			categoryMap.set(categoryId.toString(), category.id)
		} catch (error) {
			console.error(`Ошибка при создании категории ${name}:`, error)
		}
	}

	console.log(`✅ Категории импортированы`)

	// Импорт товаров
	let imported = 0
	let withImages = 0
	let errors = 0

	for (const offer of offers) {
		try {
			const offerId = parseInt(offer.$.id)
			const available = offer.$.available === 'true'

			if (!available) continue

			const name = offer.name?.[0] || 'Без названия'
			const vendorCode = offer.vendorCode?.[0] || `item-${offerId}`
			const price = parseFloat(offer.price?.[0] || '0')
			const roznPrice = parseFloat(offer.roznPrice?.[0] || price.toString())
			const categoryId = parseInt(offer.categoryId?.[0])
			const pictures = offer.picture || []

			const slug = slugify(name) + '-' + vendorCode

			// Создаем или обновляем товар
			const product = await prisma.product.upsert({
				where: { vendorCode },
				update: {
					name,
					slug,
					categoryId,
					basePrice: price,
					retailPrice: roznPrice,
					available: true,
				},
				create: {
					name,
					slug,
					vendorCode,
					categoryId,
					basePrice: price,
					retailPrice: roznPrice,
					available: true,
				},
			})

			// Добавляем изображения
			if (pictures.length > 0) {
				withImages++
				for (let i = 0; i < pictures.length; i++) {
					const imageUrl = pictures[i]
					try {
						await prisma.productImage.upsert({
							where: {
								productId_url: {
									productId: product.id,
									url: imageUrl,
								},
							},
							update: { order: i },
							create: {
								productId: product.id,
								url: imageUrl,
								order: i,
							},
						})
					} catch (imgError) {
						// Игнорируем ошибки дублирования изображений
					}
				}
			}

			imported++
			if (imported % 100 === 0) {
				console.log(`  Импортировано: ${imported}/${offers.length}`)
			}
		} catch (error) {
			errors++
			console.error(`Ошибка при импорте товара:`, error)
		}
	}

	console.log(`✅ Импортировано товаров: ${imported}`)
	console.log(`🖼️  Товаров с изображениями: ${withImages}`)
	console.log(`❌ Ошибок: ${errors}`)
}

async function importCSV(filePath: string) {
	console.log(`\n📦 Импорт CSV файла: ${path.basename(filePath)}`)
	console.log(`⚠️  CSV импорт пока не реализован`)
	// TODO: Добавить импорт CSV если нужно
}

async function main() {
	const rootDir = path.join(__dirname, '..', '..')

	const files = [
		'Комплектующие_для_сдвижных_складных_дверей,_клипсы_для_плинтуса.xml',
		'Погонаж_телескопический_Погонаж_обычный_Прочий_погонаж_Погонаж_для.xml',
		'Турин_501_1_Турин_501_2_Турин_502_11_Турин_502_21_Турин_502U_11.xml',
	]

	console.log('🚀 Начало импорта всех файлов\n')

	for (const file of files) {
		const filePath = path.join(rootDir, file)

		if (!fs.existsSync(filePath)) {
			console.log(`⚠️  Файл не найден: ${file}`)
			continue
		}

		if (file.endsWith('.xml')) {
			await importXML(filePath)
		} else if (file.endsWith('.csv')) {
			await importCSV(filePath)
		}
	}

	console.log('\n✅ Импорт завершен!')

	// Статистика
	const stats = {
		categories: await prisma.category.count(),
		products: await prisma.product.count(),
		images: await prisma.productImage.count(),
		productsWithImages: await prisma.product.count({
			where: { images: { some: {} } },
		}),
	}

	console.log('\n📊 Итоговая статистика:')
	console.log(`📁 Категорий: ${stats.categories}`)
	console.log(`📦 Товаров: ${stats.products}`)
	console.log(`🖼️  Изображений: ${stats.images}`)
	console.log(`✅ Товаров с изображениями: ${stats.productsWithImages}`)
	console.log(
		`❌ Товаров без изображений: ${stats.products - stats.productsWithImages}`,
	)

	await prisma.$disconnect()
}

main().catch(console.error)
