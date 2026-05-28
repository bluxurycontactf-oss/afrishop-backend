import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('customers')
export class CustomersController {
  constructor(private customers: CustomersService) {}
  @Get() findAll(@Query() query: any) { return this.customers.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.customers.findOne(id); }
}
