import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
@ApiTags('Suivi colis')
@Controller('tracking')
export class TrackingController {
  constructor(private tracking: TrackingService) {}
  @Get(':orderId') getTracking(@Param('orderId') orderId: string) { return this.tracking.getByOrder(orderId); }
}
