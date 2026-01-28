const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')

async function checkXMLImages(filePath) {
	console.log(`\n📄 Проверка файла: ${path.basename(filePath)}`)

	const xmlContent = fs.readFileSync(filePath, 'utf-8')
	const parser = new xml2js.Parser()
	const result = await parser.parseStringPromise(xmlContent)

	const shop = result.yml_catalog.shop[0]
	const offers = shop.offers[0].offer || []

	let totalOffers = 0
	let offersWithImages = 0
	let totalImages = 0

	for (const offer of offers) {
		totalOffers++
		const pictures = offer.picture || []

		if (pictures.length > 0) {
			offersWithImages++
			totalImages += pictures.length
		}
	}

	console.log(`📦 Всего товаров: ${totalOffers}`)
	console.log(`🖼️  Товаров с изображениями: ${offersWithImages}`)
	console.log(`📸 Всего изображений: ${totalImages}`)
	console.log(
		`📊 Процент с изображениями: ${((offersWithImages / totalOffers) * 100).toFixed(1)}%`,
	)

	return { totalOffers, offersWithImages, totalImages }
}

async function main() {
	const rootDir = path.join(__dirname, '..', '..')

	const files = [
		'Комплектующие_для_сдвижных_складных_дверей,_клипсы_для_плинтуса.xml',
		'Погонаж_телескопический_Погонаж_обычный_Прочий_погонаж_Погонаж_для.xml',
		'Турин_501_1_Турин_501_2_Турин_502_11_Турин_502_21_Турин_502U_11.xml',
	]

	console.log('🔍 Проверка изображений в XML файлах\n')

	let grandTotal = { totalOffers: 0, offersWithImages: 0, totalImages: 0 }

	for (const file of files) {
		const filePath = path.join(rootDir, file)

		if (!fs.existsSync(filePath)) {
			console.log(`⚠️  Файл не найден: ${file}`)
			continue
		}

		const stats = await checkXMLImages(filePath)
		grandTotal.totalOffers += stats.totalOffers
		grandTotal.offersWithImages += stats.offersWithImages
		grandTotal.totalImages += stats.totalImages
	}

	console.log('\n' + '='.repeat(50))
	console.log('📊 ИТОГО ПО ВСЕМ ФАЙЛАМ:')
	console.log(`📦 Всего товаров: ${grandTotal.totalOffers}`)
	console.log(`🖼️  Товаров с изображениями: ${grandTotal.offersWithImages}`)
	console.log(`📸 Всего изображений: ${grandTotal.totalImages}`)
	console.log(
		`📊 Процент с изображениями: ${((grandTotal.offersWithImages / grandTotal.totalOffers) * 100).toFixed(1)}%`,
	)
}

main().catch(console.error)
