// src/theaters/theaters.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateTheaterDto, UpdateTheaterDto } from './dto/theater-dto';
import { Theater } from './entities/theater.entity';
import { TheatersRepository } from './theater.repository';
import { PaginatedResponseDto } from 'src/common/common-dto';

interface TheaterSearchDto {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

@Injectable()
export class TheatersService {
  constructor(private readonly theatersRepository: TheatersRepository) {}

  async create(createTheaterDto: CreateTheaterDto): Promise<Theater> {
    const { name, capacity } = createTheaterDto;

    // Validate that theater with same name doesn't exist
    const existingTheater = await this.theatersRepository.findByName(name);

    if (existingTheater) {
      throw new ConflictException(`Theater with name "${name}" already exists`);
    }

    // Validate capacity
    this.validateCapacity(capacity);

    const theaterData = {
      ...createTheaterDto,
      name: name.trim(),
      is_active: createTheaterDto.is_active ?? true,
    };

    return this.theatersRepository.create(theaterData);
  }

  async findAll(
    searchDto: TheaterSearchDto,
  ): Promise<PaginatedResponseDto<Theater>> {
    const { page = 1, limit = 10 } = searchDto;

    const { theaters, total } =
      await this.theatersRepository.searchTheaters(searchDto);

    const totalPages = Math.ceil(total / limit);

    return {
      data: theaters,
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    };
  }

  async findOne(id: string): Promise<Theater> {
    const theater = await this.theatersRepository.findWithShowtimes(id);

    if (!theater) {
      throw new NotFoundException(`Theater with ID ${id} not found`);
    }

    return theater;
  }

  async update(
    id: string,
    updateTheaterDto: UpdateTheaterDto,
  ): Promise<Theater> {
    const existingTheater = await this.theatersRepository.findById(id);

    if (!existingTheater) {
      throw new NotFoundException(`Theater with ID ${id} not found`);
    }

    // If updating name, validate duplicates
    if (updateTheaterDto.name) {
      const duplicateTheater = await this.theatersRepository.findByName(
        updateTheaterDto.name,
      );

      if (duplicateTheater && duplicateTheater.id !== id) {
        throw new ConflictException(
          `Another theater with name "${updateTheaterDto.name}" already exists`,
        );
      }
    }

    // Validate capacity if provided
    if (updateTheaterDto.capacity) {
      this.validateCapacity(updateTheaterDto.capacity);

      // If reducing capacity, validate against existing showtimes
      if (updateTheaterDto.capacity < existingTheater.capacity) {
        await this.validateCapacityReduction(id, updateTheaterDto.capacity);
      }
    }

    const updateData = {
      ...updateTheaterDto,
      ...(updateTheaterDto.name && { name: updateTheaterDto.name.trim() }),
    };

    return this.theatersRepository.update(id, updateData);
  }

  async remove(id: string): Promise<void> {
    const theater = await this.theatersRepository.findWithShowtimes(id);

    if (!theater) {
      throw new NotFoundException(`Theater with ID ${id} not found`);
    }

    // Check if theater has upcoming showtimes
    const hasUpcomingShowtimes = theater.showtimes?.some(
      (showtime) => new Date(showtime.start_time) > new Date(),
    );

    if (hasUpcomingShowtimes) {
      throw new ConflictException(
        'Cannot delete theater with upcoming showtimes',
      );
    }

    await this.theatersRepository.delete(id);
  }

  async deactivate(id: string): Promise<Theater> {
    const theater = await this.theatersRepository.findById(id);

    if (!theater) {
      throw new NotFoundException(`Theater with ID ${id} not found`);
    }

    return this.theatersRepository.update(id, { is_active: false });
  }

  async activate(id: string): Promise<Theater> {
    const theater = await this.theatersRepository.findById(id);

    if (!theater) {
      throw new NotFoundException(`Theater with ID ${id} not found`);
    }

    return this.theatersRepository.update(id, { is_active: true });
  }

  private validateCapacity(capacity: number): void {
    if (capacity < 1 || capacity > 1000) {
      throw new BadRequestException(
        'Theater capacity must be between 1 and 1000 seats',
      );
    }
  }

  private async validateCapacityReduction(
    theaterId: string,
    newCapacity: number,
  ): Promise<void> {
    const theaterWithShowtimes =
      await this.theatersRepository.findWithShowtimes(theaterId);

    const hasShowtimesExceedingCapacity = theaterWithShowtimes?.showtimes?.some(
      (showtime) => showtime.sold_tickets > newCapacity,
    );

    if (hasShowtimesExceedingCapacity) {
      throw new ConflictException(
        'Cannot reduce capacity below the number of sold tickets for existing showtimes',
      );
    }
  }
}
