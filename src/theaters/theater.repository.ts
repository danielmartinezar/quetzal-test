// src/theaters/interfaces/theaters-repository.interface.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { Theater } from './entities/theater.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

interface TheaterSearchDto {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

export interface TheatersRepositoryInterface {
  create(theaterData: Partial<Theater>): Promise<Theater>;
  findAll(): Promise<Theater[]>;
  findById(id: string): Promise<Theater | null>;
  update(id: string, theaterData: Partial<Theater>): Promise<Theater>;
  delete(id: string): Promise<void>;
  findByName(name: string): Promise<Theater | null>;
  findActiveTheaters(): Promise<Theater[]>;
  findWithShowtimes(id: string): Promise<Theater | null>;
  findAvailableTheaters(
    startTime: Date,
    endTime: Date,
    excludeShowtimeId?: string,
  ): Promise<Theater[]>;
  searchTheaters(
    searchDto: TheaterSearchDto,
  ): Promise<{ theaters: Theater[]; total: number }>;
}

interface TheaterSearchDto {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

@Injectable()
export class TheatersRepository implements TheatersRepositoryInterface {
  constructor(
    @InjectRepository(Theater)
    private readonly theaterRepository: Repository<Theater>,
  ) {}

  async create(theaterData: Partial<Theater>): Promise<Theater> {
    const theater = this.theaterRepository.create(theaterData);
    return this.theaterRepository.save(theater);
  }

  async findAll(): Promise<Theater[]> {
    return this.theaterRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Theater | null> {
    return this.theaterRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, theaterData: Partial<Theater>): Promise<Theater> {
    await this.theaterRepository.update(id, theaterData);
    const updatedTheater = await this.findById(id);
    if (!updatedTheater) {
      throw new NotFoundException(`Theater with id ${id} not found`);
    }
    return updatedTheater;
  }

  async delete(id: string): Promise<void> {
    await this.theaterRepository.delete(id);
  }

  async findByName(name: string): Promise<Theater | null> {
    return this.theaterRepository.findOne({
      where: { name: name.trim() },
    });
  }

  async findActiveTheaters(): Promise<Theater[]> {
    return this.theaterRepository.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
  }

  async findWithShowtimes(id: string): Promise<Theater | null> {
    return this.theaterRepository.findOne({
      where: { id },
      relations: ['showtimes', 'showtimes.movie'],
    });
  }

  async findAvailableTheaters(
    startTime: Date,
    endTime: Date,
    excludeShowtimeId?: string,
  ): Promise<Theater[]> {
    const queryBuilder = this.theaterRepository
      .createQueryBuilder('theater')
      .leftJoinAndSelect('theater.showtimes', 'showtime')
      .where('theater.is_active = :isActive', { isActive: true });

    // Exclude theaters that have conflicting showtimes
    const subQuery = this.theaterRepository.manager
      .createQueryBuilder()
      .select('DISTINCT s.theater_id')
      .from('showtimes', 's')
      .where('(s.start_time < :endTime AND s.end_time > :startTime)', {
        startTime,
        endTime,
      });

    if (excludeShowtimeId) {
      subQuery.andWhere('s.id != :excludeShowtimeId', { excludeShowtimeId });
    }

    queryBuilder
      .andWhere(`theater.id NOT IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters());

    return queryBuilder.orderBy('theater.name', 'ASC').getMany();
  }

  async searchTheaters(
    searchDto: TheaterSearchDto,
  ): Promise<{ theaters: Theater[]; total: number }> {
    const { page = 1, limit = 10, search, is_active } = searchDto;

    const queryBuilder = this.theaterRepository.createQueryBuilder('theater');

    // Apply filters
    if (search) {
      queryBuilder.andWhere('LOWER(theater.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (is_active !== undefined) {
      queryBuilder.andWhere('theater.is_active = :isActive', {
        isActive: is_active,
      });
    }

    // Order by name
    queryBuilder.orderBy('theater.name', 'ASC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [theaters, total] = await queryBuilder.getManyAndCount();

    return { theaters, total };
  }
}
