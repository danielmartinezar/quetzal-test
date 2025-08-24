import { Module } from '@nestjs/common';
import { ShowtimesService } from './showtimes.service';
import { ShowtimesController } from './showtimes.controller';
import { ShowtimesRepository } from './showtime.repository';
import { Showtime } from './entities/showtime.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from 'src/movies/entities/movie.entity';
import { Theater } from 'src/theaters/entities/theater.entity';
import { MoviesRepository } from 'src/movies/movie.repository';
import { TheatersRepository } from 'src/theaters/theater.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Showtime]),
    TypeOrmModule.forFeature([Movie]),
    TypeOrmModule.forFeature([Theater]),
  ],
  controllers: [ShowtimesController],
  providers: [
    ShowtimesService,
    ShowtimesRepository,
    MoviesRepository,
    TheatersRepository,
  ],
})
export class ShowtimesModule {}
