import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OrdersService } from './orders.service'

@Controller('orders')
export class OrdersController {
	constructor(private ordersService: OrdersService) {}

	@Post()
	create(@Body() createOrderDto: any) {
		return this.ordersService.create(createOrderDto)
	}

	@Get()
	@UseGuards(JwtAuthGuard)
	findAll() {
		return this.ordersService.findAll()
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard)
	findOne(@Param('id') id: string) {
		return this.ordersService.findOne(+id)
	}

	@Put(':id/status')
	@UseGuards(JwtAuthGuard)
	updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
		return this.ordersService.updateStatus(+id, body.status)
	}
}
