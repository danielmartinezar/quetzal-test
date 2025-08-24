// src/showtimes/showtimes.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ShowtimesRepository } from './showtime.repository';
import { MoviesRepository } from 'src/movies/movie.repository';
import { TheatersRepository } from 'src/theaters/theater.repository';
import { Showtime } from './entities/showtime.entity';
import {
  CreateShowtimeDto,
  ShowtimeAvailabilityDto,
  UpdateShowtimeDto,
} from './dto/showtime-dto';
import { PaginatedResponseDto, ShowtimeSearchDto } from 'src/common/common-dto';
import { addMinutes, isBefore } from 'date-fns';

@Injectable()
export class ShowtimesService {
  constructor(
    private readonly showtimesRepository: ShowtimesRepository,
    private readonly moviesRepository: MoviesRepository,
    private readonly theatersRepository: TheatersRepository,
  ) {}

  async create(createShowtimeDto: CreateShowtimeDto): Promise<Showtime> {
    const { movie_id, theater_id, start_time, price } = createShowtimeDto;

    // ⚠️ BUSINESS RULE: Cannot create showtimes in the past
    const startDate = new Date(start_time);
    if (isBefore(startDate, new Date())) {
      throw new BadRequestException('Cannot create showtime in the past');
    }

    // Validate that movie exists
    const movie = await this.moviesRepository.findById(movie_id);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movie_id} not found`);
    }

    // Validate that theater exists and is active
    const theater = await this.theatersRepository.findById(theater_id);
    if (!theater) {
      throw new NotFoundException(`Theater with ID ${theater_id} not found`);
    }
    if (!theater.is_active) {
      throw new BadRequestException('Theater is not active');
    }

    // Calculate end time based on movie duration
    const endDate = addMinutes(startDate, movie.duration);

    // ⚠️ BUSINESS RULE: Check for scheduling conflicts
    const conflictingShowtime =
      await this.showtimesRepository.findConflictingShowtime(
        theater_id,
        startDate,
        endDate,
      );

    if (conflictingShowtime) {
      throw new ConflictException(
        'Scheduling conflict: theater already has a showtime during this period',
      );
    }

    // Validate price
    if (price < 0 || price > 1000) {
      throw new BadRequestException('Price must be between 0 and 1000');
    }

    const showtimeData = {
      start_time: startDate,
      end_time: endDate,
      price,
      sold_tickets: 0,
      movie: movie,
      theater: theater,
    };

    return this.showtimesRepository.create(showtimeData);
  }

  async findAll(
    searchDto?: ShowtimeSearchDto,
  ): Promise<PaginatedResponseDto<Showtime>> {
    const { page = 1, limit = 10 } = searchDto || {};

    const { showtimes, total } = await this.showtimesRepository.searchShowtimes(
      searchDto || {},
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: showtimes,
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    };
  }

  async findOne(id: string): Promise<Showtime> {
    const showtime = await this.showtimesRepository.findWithRelations(id);

    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${id} not found`);
    }

    return showtime;
  }

  async update(
    id: string,
    updateShowtimeDto: UpdateShowtimeDto,
  ): Promise<Showtime> {
    const existingShowtime =
      await this.showtimesRepository.findWithRelations(id);

    if (!existingShowtime) {
      throw new NotFoundException(`Showtime with ID ${id} not found`);
    }

    // ⚠️ BUSINESS RULE: Cannot update if showtime has already started
    if (new Date(existingShowtime.start_time) <= new Date()) {
      throw new BadRequestException(
        'Cannot update showtime that has already started',
      );
    }

    // If updating start time, validate it's not in the past
    if (updateShowtimeDto.start_time) {
      const newStartTime = new Date(updateShowtimeDto.start_time);
      if (isBefore(newStartTime, new Date())) {
        throw new BadRequestException('Cannot schedule showtime in the past');
      }
    }

    let updateData: Partial<Showtime> = {
      ...updateShowtimeDto,
      start_time: updateShowtimeDto.start_time
        ? new Date(updateShowtimeDto.start_time)
        : undefined,
    };

    // If changing movie or start time, recalculate end time
    if (updateShowtimeDto.movie_id || updateShowtimeDto.start_time) {
      const movieId = updateShowtimeDto.movie_id || existingShowtime.movie.id;
      const movie = await this.moviesRepository.findById(movieId);

      if (!movie) {
        throw new NotFoundException(`Movie with ID ${movieId} not found`);
      }

      const startTime = updateShowtimeDto.start_time
        ? new Date(updateShowtimeDto.start_time)
        : existingShowtime.start_time;

      const endTime = addMinutes(startTime, movie.duration);

      updateData = {
        ...updateData,
        start_time: startTime,
        end_time: endTime,
      };

      // Check for conflicts if changing theater, movie, or time
      const theaterId =
        updateShowtimeDto.theater_id || existingShowtime.theater.id;
      const conflictingShowtime =
        await this.showtimesRepository.findConflictingShowtime(
          theaterId,
          startTime,
          endTime,
          id, // Exclude current showtime
        );

      if (conflictingShowtime) {
        throw new ConflictException(
          'Scheduling conflict: theater already has a showtime during this period',
        );
      }
    }

    // If changing theater, validate it exists and is active
    if (updateShowtimeDto.theater_id) {
      const theater = await this.theatersRepository.findById(
        updateShowtimeDto.theater_id,
      );
      if (!theater) {
        throw new NotFoundException(
          `Theater with ID ${updateShowtimeDto.theater_id} not found`,
        );
      }
      if (!theater.is_active) {
        throw new BadRequestException('Theater is not active');
      }
    }

    return this.showtimesRepository.update(id, updateData);
  }

  async remove(id: string): Promise<void> {
    const showtime = await this.showtimesRepository.findWithRelations(id);

    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${id} not found`);
    }

    // ⚠️ BUSINESS RULE: Cannot delete showtime with sold tickets
    if (showtime.sold_tickets > 0) {
      throw new BadRequestException('Cannot delete showtime with sold tickets');
    }

    // Cannot delete showtime that has already started
    if (new Date(showtime.start_time) <= new Date()) {
      throw new BadRequestException(
        'Cannot delete showtime that has already started',
      );
    }

    await this.showtimesRepository.delete(id);
  }

  async getAvailability(id: string): Promise<ShowtimeAvailabilityDto> {
    const showtime = await this.showtimesRepository.findWithRelations(id);

    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${id} not found`);
    }

    const availableSeats = showtime.theater.capacity - showtime.sold_tickets;

    return {
      showtime_id: id,
      total_capacity: showtime.theater.capacity,
      sold_tickets: showtime.sold_tickets,
      available_seats: availableSeats,
      is_sold_out: availableSeats <= 0,
    };
  }

  async findUpcoming(): Promise<Showtime[]> {
    return this.showtimesRepository.findUpcomingShowtimes();
  }

  async findByMovieId(movieId: string): Promise<Showtime[]> {
    return this.showtimesRepository.findByMovieId(movieId);
  }

  async findByTheaterId(theaterId: string): Promise<Showtime[]> {
    return this.showtimesRepository.findByTheaterId(theaterId);
  }
}
