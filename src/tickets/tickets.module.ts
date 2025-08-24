import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketsRepository } from './ticket.repository';
import { Ticket } from './entities/ticket.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Showtime } from 'src/showtimes/entities/showtime.entity';
import { ShowtimesRepository } from 'src/showtimes/showtime.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    TypeOrmModule.forFeature([Showtime]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository, ShowtimesRepository],
})
export class TicketsModule {}
