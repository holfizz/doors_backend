import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Get()
	async findAll(
		@Query('categoryId') categoryId?: string,
		@Query('search') search?: string,
		@Query('page') page?: string,
		@Query('take') take?: string,
		@Query('sortBy') sortBy?: string,
		@Query('sortOrder') sortOrder?: 'asc' | 'desc',
	) {
		console.log('[ProductsController] GET /products called')
		console.log('[ProductsController] Query params:', {
			categoryId,
			search,
			page,
			take,
			sortBy,
			sortOrder,
		})

		const pageNum = parseInt(page) || 1
		const takeNum = parseInt(take) || 100

		const result = await this.productsService.findAll({
			categoryId: categoryId ? parseInt(categoryId) : undefined,
			search,
			skip: (pageNum - 1) * takeNum,
			take: takeNum,
			sortBy,
			sortOrder,
		})

		console.log('[ProductsController] Returning:', {
			productsCount: result.products.length,
			total: result.total,
			hasImages: result.products[0]?.images?.length > 0,
			firstImageUrl: result.products[0]?.images?.[0]?.url,
		})

		return result
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.productsService.findOne(+id)
	}

	@Get('slug/:slug')
	findBySlug(@Param('slug') slug: string) {
		return this.productsService.findBySlug(slug)
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	create(@Body() createProductDto: any) {
		return this.productsService.create(createProductDto)
	}

	@Put(':id')
	@UseGuards(JwtAuthGuard)
	update(@Param('id') id: string, @Body() updateProductDto: any) {
		return this.productsService.update(+id, updateProductDto)
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	remove(@Param('id') id: string) {
		return this.productsService.remove(+id)
	}
}
