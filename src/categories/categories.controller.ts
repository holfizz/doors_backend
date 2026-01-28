import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CategoriesService } from './categories.service'

@Controller('categories')
export class CategoriesController {
	constructor(private readonly categoriesService: CategoriesService) {}

	@Get()
	async findAll() {
		console.log('[CategoriesController] GET /categories called')
		const result = await this.categoriesService.findAll()
		console.log(
			'[CategoriesController] Returning:',
			result.length,
			'categories',
		)
		return result
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.categoriesService.findOne(+id)
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	create(@Body() createCategoryDto: any) {
		return this.categoriesService.create(createCategoryDto)
	}

	@Put(':id')
	@UseGuards(JwtAuthGuard)
	update(@Param('id') id: string, @Body() updateCategoryDto: any) {
		return this.categoriesService.update(+id, updateCategoryDto)
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	remove(@Param('id') id: string) {
		return this.categoriesService.remove(+id)
	}
}
