import { ShowtimeSearchDto } from 'src/common/common-dto';
import { Showtime } from './entities/showtime.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface ShowtimesRepositoryInterface {
  create(showtimeData: Partial<Showtime>): Promise<Showtime>;
  findAll(): Promise<Showtime[]>;
  findById(id: string): Promise<Showtime | null>;
  update(id: string, showtimeData: Partial<Showtime>): Promise<Showtime>;
  delete(id: string): Promise<void>;
  findWithRelations(id: string): Promise<Showtime | null>;
  findConflictingShowtime(
    theaterId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<Showtime | null>;
  searchShowtimes(
    searchDto: ShowtimeSearchDto,
  ): Promise<{ showtimes: Showtime[]; total: number }>;
  findUpcomingShowtimes(): Promise<Showtime[]>;
  findByMovieId(movieId: string): Promise<Showtime[]>;
  findByTheaterId(theaterId: string): Promise<Showtime[]>;
  incrementSoldTickets(id: string): Promise<void>;
  decrementSoldTickets(id: string): Promise<void>;
}

@Injectable()
export class ShowtimesRepository implements ShowtimesRepositoryInterface {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimeRepository: Repository<Showtime>,
  ) {}

  async create(showtimeData: Partial<Showtime>): Promise<Showtime> {
    const showtime = this.showtimeRepository.create(showtimeData);
    return this.showtimeRepository.save(showtime);
  }

  async findAll(): Promise<Showtime[]> {
    return this.showtimeRepository.find({
      relations: ['movie', 'theater'],
      order: { start_time: 'ASC' },
    });
  }

  async findById(id: string): Promise<Showtime | null> {
    return this.showtimeRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, showtimeData: Partial<Showtime>): Promise<Showtime> {
    await this.showtimeRepository.update(id, showtimeData);
    const updatedShowtime = await this.findById(id);
    if (!updatedShowtime) {
      throw new Error(`Showtime with id ${id} not found`);
    }
    return updatedShowtime;
  }

  async delete(id: string): Promise<void> {
    await this.showtimeRepository.delete(id);
  }

  async findWithRelations(id: string): Promise<Showtime | null> {
    return this.showtimeRepository.findOne({
      where: { id },
      relations: ['movie', 'theater', 'tickets'],
    });
  }

  async findConflictingShowtime(
    theaterId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<Showtime | null> {
    const queryBuilder = this.showtimeRepository
      .createQueryBuilder('showtime')
      .innerJoin('showtime.theater', 'theater')
      .where('theater.id = :theaterId', { theaterId })
      .andWhere(
        '(showtime.start_time < :endTime AND showtime.end_time > :startTime)',
        {
          startTime,
          endTime,
        },
      );

    if (excludeId) {
      queryBuilder.andWhere('showtime.id != :excludeId', { excludeId });
    }

    return queryBuilder.getOne();
  }

  async searchShowtimes(
    searchDto: ShowtimeSearchDto,
  ): Promise<{ showtimes: Showtime[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      movie_id,
      theater_id,
      date_from,
      date_to,
    } = searchDto;

    const queryBuilder = this.showtimeRepository
      .createQueryBuilder('showtime')
      .leftJoinAndSelect('showtime.movie', 'movie')
      .leftJoinAndSelect('showtime.theater', 'theater');

    // Apply filters
    if (movie_id) {
      queryBuilder.andWhere('movie.id = :movieId', { movieId: movie_id });
    }

    if (theater_id) {
      queryBuilder.andWhere('theater.id = :theaterId', {
        theaterId: theater_id,
      });
    }

    if (date_from) {
      queryBuilder.andWhere('showtime.start_time >= :dateFrom', {
        dateFrom: new Date(date_from),
      });
    }

    if (date_to) {
      const dateTo = new Date(date_to);
      dateTo.setHours(23, 59, 59, 999); // End of day
      queryBuilder.andWhere('showtime.start_time <= :dateTo', { dateTo });
    }

    // Order by start time
    queryBuilder.orderBy('showtime.start_time', 'ASC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [showtimes, total] = await queryBuilder.getManyAndCount();

    return { showtimes, total };
  }

  async findUpcomingShowtimes(): Promise<Showtime[]> {
    const now = new Date();
    return this.showtimeRepository
      .createQueryBuilder('showtime')
      .leftJoinAndSelect('showtime.movie', 'movie')
      .leftJoinAndSelect('showtime.theater', 'theater')
      .where('showtime.start_time > :now', { now })
      .orderBy('showtime.start_time', 'ASC')
      .take(20)
      .getMany();
  }

  async findByMovieId(movieId: string): Promise<Showtime[]> {
    return this.showtimeRepository
      .createQueryBuilder('showtime')
      .leftJoinAndSelect('showtime.theater', 'theater')
      .leftJoinAndSelect('showtime.movie', 'movie')
      .where('movie.id = :movieId', { movieId })
      .orderBy('showtime.start_time', 'ASC')
      .getMany();
  }

  async findByTheaterId(theaterId: string): Promise<Showtime[]> {
    return this.showtimeRepository
      .createQueryBuilder('showtime')
      .leftJoinAndSelect('showtime.movie', 'movie')
      .leftJoinAndSelect('showtime.theater', 'theater')
      .where('theater.id = :theaterId', { theaterId })
      .orderBy('showtime.start_time', 'ASC')
      .getMany();
  }

  async incrementSoldTickets(id: string): Promise<void> {
    await this.showtimeRepository.increment({ id }, 'sold_tickets', 1);
  }

  async decrementSoldTickets(id: string): Promise<void> {
    await this.showtimeRepository.decrement({ id }, 'sold_tickets', 1);
  }
}
