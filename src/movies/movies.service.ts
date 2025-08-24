import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MoviesRepository } from './movie.repository';
import { CreateMovieDto, UpdateMovieDto } from './dto/movie-dto';
import { Movie } from './entities/movie.entity';
import { MovieSearchDto, PaginatedResponseDto } from 'src/common/common-dto';

@Injectable()
export class MoviesService {
  constructor(private readonly moviesRepository: MoviesRepository) {}

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const { title, release_date } = createMovieDto;

    // Validate that movie with same title and release date doesn't exist
    const existingMovie = await this.moviesRepository.findByTitleAndReleaseDate(
      title,
      new Date(release_date),
    );

    if (existingMovie) {
      throw new BadRequestException(
        `Movie with title "${title}" and same release date already exists`,
      );
    }

    // Validate release date range
    this.validateReleaseDate(release_date);

    // Validate duration
    this.validateDuration(createMovieDto.duration);

    const movieData = {
      ...createMovieDto,
      title: title.trim(),
      genre: createMovieDto.genre.trim(),
      release_date: new Date(release_date),
    };

    return this.moviesRepository.create(movieData);
  }

  async findAll(
    searchDto?: MovieSearchDto,
  ): Promise<PaginatedResponseDto<Movie>> {
    const { page = 1, limit = 10 } = searchDto || {};

    const { movies, total } = await this.moviesRepository.searchMovies(
      searchDto || {},
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: movies,
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    };
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.moviesRepository.findWithShowtimes(id);

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  async update(id: string, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const existingMovie = await this.moviesRepository.findById(id);

    if (!existingMovie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    // If updating title or release date, validate duplicates
    if (updateMovieDto.title || updateMovieDto.release_date) {
      const title = updateMovieDto.title?.trim() || existingMovie.title;
      const releaseDate = updateMovieDto.release_date
        ? new Date(updateMovieDto.release_date)
        : existingMovie.release_date;

      const duplicateMovie =
        await this.moviesRepository.findByTitleAndReleaseDate(
          title,
          releaseDate,
        );

      if (duplicateMovie && duplicateMovie.id !== id) {
        throw new BadRequestException(
          `Another movie with title "${title}" and same release date already exists`,
        );
      }
    }

    // Validate release date if provided
    if (updateMovieDto.release_date) {
      this.validateReleaseDate(updateMovieDto.release_date);
    }

    // Validate duration if provided
    if (updateMovieDto.duration) {
      this.validateDuration(updateMovieDto.duration);
    }

    const updateData: Partial<Movie> = {
      ...(updateMovieDto.title && { title: updateMovieDto.title.trim() }),
      ...(updateMovieDto.genre && { genre: updateMovieDto.genre.trim() }),
      ...(updateMovieDto.description && {
        description: updateMovieDto.description,
      }),
      ...(updateMovieDto.duration && { duration: updateMovieDto.duration }),
      ...(updateMovieDto.release_date && {
        release_date: new Date(updateMovieDto.release_date),
      }),
    };

    return this.moviesRepository.update(id, updateData);
  }

  async remove(id: string): Promise<void> {
    const movie = await this.moviesRepository.findWithShowtimes(id);

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    // Check if movie has upcoming showtimes
    const hasUpcomingShowtimes = movie.showtimes?.some(
      (showtime) => new Date(showtime.start_time) > new Date(),
    );

    if (hasUpcomingShowtimes) {
      throw new BadRequestException(
        'Cannot delete movie with upcoming showtimes',
      );
    }

    await this.moviesRepository.delete(id);
  }

  async findActiveMovies(): Promise<Movie[]> {
    return this.moviesRepository.findActiveMovies();
  }

  private validateReleaseDate(releaseDate: string): void {
    const releaseYear = new Date(releaseDate).getFullYear();
    const currentYear = new Date().getFullYear();

    if (releaseYear < 1900 || releaseYear > currentYear + 5) {
      throw new BadRequestException(
        'Release date must be between 1900 and maximum 5 years in the future',
      );
    }
  }

  private validateDuration(duration: number): void {
    if (duration < 1 || duration > 600) {
      throw new BadRequestException(
        'Movie duration must be between 1 and 600 minutes',
      );
    }
  }
}
