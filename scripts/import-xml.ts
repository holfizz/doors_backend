import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as xml2js from 'xml2js'

const prisma = new PrismaClient()

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[а-яё]/g, char => {
			const map: any = {
				а: 'a',
				б: 'b',
				в: 'v',
				г: 'g',
				д: 'd',
				е: 'e',
				ё: 'e',
				ж: 'zh',
				з: 'z',
				и: 'i',
				й: 'y',
				к: 'k',
				л: 'l',
				м: 'm',
				н: 'n',
				о: 'o',
				п: 'p',
				р: 'r',
				с: 's',
				т: 't',
				у: 'u',
				ф: 'f',
				х: 'h',
				ц: 'ts',
				ч: 'ch',
				ш: 'sh',
				щ: 'sch',
				ъ: '',
				ы: 'y',
				ь: '',
				э: 'e',
				ю: 'yu',
				я: 'ya',
			}
			return map[char] || char
		})
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim()
}

async function importXmlFile(filePath: string) {
	console.log(`\n📦 Импорт файла: ${filePath}`)

	const xmlData = fs.readFileSync(filePath, 'utf-8')
	const parser = new xml2js.Parser()
	const result = await parser.parseStringPromise(xmlData)

	const categories = result.yml_catalog.shop[0].categories[0].category
	const offers = result.yml_catalog.shop[0].offers[0].offer

	console.log(`📁 Найдено категорий: ${categories.length}`)
	console.log(`📦 Найдено товаров: ${offers.length}`)

	// Импорт категорий
	const categoryMap = new Map()
	for (const cat of categories) {
		const categoryId = parseInt(cat.$.id)
		const categoryData = {
			name: cat._,
			slug: slugify(cat._),
			parentId: cat.$.parentId ? parseInt(cat.$.parentId) : null,
		}

		try {
			const category = await prisma.category.upsert({
				where: { id: categoryId },
				update: categoryData,
				create: { ...categoryData, id: categoryId },
			})
			categoryMap.set(categoryId, category)
			console.log(`✓ Категория: ${category.name}`)
		} catch (error: any) {
			console.error(`✗ Ошибка категории ${categoryData.name}:`, error.message)
		}
	}

	// Импорт товаров
	let imported = 0
	let errors = 0

	for (const offer of offers) {
		try {
			const categoryId = parseInt(offer.categoryId[0])

			// Проверяем существование категории
			if (!categoryMap.has(categoryId)) {
				console.warn(
					`⚠ Категория ${categoryId} не найдена для товара ${offer.vendorCode[0]}`,
				)
				continue
			}

			const productData = {
				name: offer.name[0],
				slug: slugify(offer.name[0]) + '-' + offer.vendorCode[0].toLowerCase(),
				vendorCode: offer.vendorCode[0],
				categoryId: categoryId,
				basePrice: parseFloat(offer.price[0]),
				retailPrice: parseFloat(offer.roznPrice[0]),
				available: offer.$.available === 'true',
				description: offer.description ? offer.description[0] : null,
			}

			const product = await prisma.product.upsert({
				where: { vendorCode: productData.vendorCode },
				update: productData,
				create: productData,
			})

			// Добавление изображения
			if (offer.picture && offer.picture[0]) {
				await prisma.productImage.upsert({
					where: {
						productId_url: {
							productId: product.id,
							url: offer.picture[0],
						},
					},
					update: {},
					create: {
						productId: product.id,
						url: offer.picture[0],
						alt: product.name,
						order: 0,
					},
				})
			}

			// Добавление параметров как вариантов
			if (offer.param) {
				for (const param of offer.param) {
					await prisma.productVariant.create({
						data: {
							productId: product.id,
							name: param.$.name,
							value: param._,
						},
					})
				}
			}

			imported++
			if (imported % 10 === 0) {
				console.log(`✓ Импортировано: ${imported}/${offers.length}`)
			}
		} catch (error: any) {
			errors++
			console.error(`✗ Ошибка товара ${offer.vendorCode?.[0]}:`, error.message)
		}
	}

	console.log(`\n✅ Импорт завершен!`)
	console.log(`   Успешно: ${imported}`)
	console.log(`   Ошибок: ${errors}`)
	console.log(`   Всего: ${offers.length}`)
}

async function main() {
	const xmlFiles = [
		'Комплектующие_для_сдвижных_складных_дверей,_клипсы_для_плинтуса.xml',
		'Погонаж_телескопический_Погонаж_обычный_Прочий_погонаж_Погонаж_для.xml',
		'Турин_501_1_Турин_501_2_Турин_502_11_Турин_502_21_Турин_502U_11.xml',
	]

	console.log('🚀 Начало импорта XML файлов...\n')

	for (const file of xmlFiles) {
		const filePath = path.join(process.cwd(), '..', file)
		if (fs.existsSync(filePath)) {
			await importXmlFile(filePath)
		} else {
			console.log(`⚠ Файл не найден: ${filePath}`)
		}
	}

	console.log('\n🎉 Все файлы импортированы!')
}

main()
	.catch(e => {
		console.error('❌ Критическая ошибка:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
