import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { CategoriesModule } from './categories/categories.module'
import { ImportModule } from './import/import.module'
import { OrdersModule } from './orders/orders.module'
import { PrismaModule } from './prisma/prisma.module'
import { ProductsModule } from './products/products.module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		PrismaModule,
		AuthModule,
		ProductsModule,
		CategoriesModule,
		OrdersModule,
		ImportModule,
	],
})
export class AppModule {}
