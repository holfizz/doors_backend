import {
	Controller,
	Post,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ImportService } from './import.service'

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
	constructor(private importService: ImportService) {}

	@Post('xml')
	@UseInterceptors(FileInterceptor('file'))
	async importXml(@UploadedFile() file: Express.Multer.File) {
		return this.importService.importFromXml(file.path)
	}
}
