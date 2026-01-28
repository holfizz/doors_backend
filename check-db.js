const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
	console.log('=== Проверка базы данных ===\n')

	// Проверка категорий
	const categoriesCount = await prisma.category.count()
	console.log(`📁 Категорий в базе: ${categoriesCount}`)

	// Проверка товаров
	const productsCount = await prisma.product.count()
	console.log(`📦 Товаров в базе: ${productsCount}`)

	// Проверка изображений
	const imagesCount = await prisma.productImage.count()
	console.log(`🖼️  Изображений в базе: ${imagesCount}`)

	// Получить первый товар с изображениями
	const firstProduct = await prisma.product.findFirst({
		include: {
			images: true,
			category: true,
		},
	})

	if (firstProduct) {
		console.log('\n=== Первый товар ===')
		console.log('ID:', firstProduct.id)
		console.log('Название:', firstProduct.name)
		console.log('Артикул:', firstProduct.vendorCode)
		console.log('Категория:', firstProduct.category.name)
		console.log('Цена:', firstProduct.retailPrice.toString())
		console.log('Изображений:', firstProduct.images.length)
		if (firstProduct.images.length > 0) {
			console.log('Первое изображение URL:', firstProduct.images[0].url)
		}
	}

	// Проверить товары с изображениями
	const productsWithImages = await prisma.product.count({
		where: {
			images: {
				some: {},
			},
		},
	})
	console.log(`\n✅ Товаров с изображениями: ${productsWithImages}`)
	console.log(
		`❌ Товаров без изображений: ${productsCount - productsWithImages}`,
	)

	await prisma.$disconnect()
}

checkDatabase().catch(console.error)
