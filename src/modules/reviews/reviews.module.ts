import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { PrismaModule } from '../../config/prisma.module';

@Module({ imports: [PrismaModule], controllers: [ReviewsController] })
export class ReviewsModule {}
