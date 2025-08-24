import { MovieSearchDto } from 'src/common/common-dto';
import { Movie } from './entities/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

export interface MoviesRepositoryInterface {
  create(movieData: Partial<Movie>): Promise<Movie>;
  findAll(): Promise<Movie[]>;
  findById(id: string): Promise<Movie | null>;
  update(id: string, movieData: Partial<Movie>): Promise<Movie>;
  delete(id: string): Promise<void>;
  findByTitleAndReleaseDate(
    title: string,
    releaseDate: Date,
  ): Promise<Movie | null>;
  findWithShowtimes(id: string): Promise<Movie | null>;
  searchMovies(
    searchDto: MovieSearchDto,
  ): Promise<{ movies: Movie[]; total: number }>;
  findActiveMovies(): Promise<Movie[]>;
}

@Injectable()
export class MoviesRepository implements MoviesRepositoryInterface {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async create(movieData: Partial<Movie>): Promise<Movie> {
    const movie = this.movieRepository.create(movieData);
    return this.movieRepository.save(movie);
  }

  async findAll(): Promise<Movie[]> {
    return this.movieRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Movie | null> {
    return this.movieRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, movieData: Partial<Movie>): Promise<Movie> {
    await this.movieRepository.update(id, movieData);
    const updatedMovie = await this.findById(id);
    if (!updatedMovie) {
      throw new Error(`Movie with id ${id} not found`);
    }
    return updatedMovie;
  }

  async delete(id: string): Promise<void> {
    await this.movieRepository.delete(id);
  }

  async findByTitleAndReleaseDate(
    title: string,
    releaseDate: Date,
  ): Promise<Movie | null> {
    return this.movieRepository.findOne({
      where: {
        title: title.trim(),
        release_date: releaseDate,
      },
    });
  }

  async findWithShowtimes(id: string): Promise<Movie | null> {
    return this.movieRepository.findOne({
      where: { id },
      relations: ['showtimes', 'showtimes.theater'],
    });
  }

  async searchMovies(
    searchDto: MovieSearchDto,
  ): Promise<{ movies: Movie[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      title,
      genre,
      release_date_from,
      release_date_to,
    } = searchDto;

    const queryBuilder = this.movieRepository.createQueryBuilder('movie');

    // Apply filters
    if (title) {
      queryBuilder.andWhere('LOWER(movie.title) LIKE LOWER(:title)', {
        title: `%${title}%`,
      });
    }

    if (genre) {
      queryBuilder.andWhere('LOWER(movie.genre) LIKE LOWER(:genre)', {
        genre: `%${genre}%`,
      });
    }

    if (release_date_from) {
      queryBuilder.andWhere('movie.release_date >= :dateFrom', {
        dateFrom: new Date(release_date_from),
      });
    }

    if (release_date_to) {
      queryBuilder.andWhere('movie.release_date <= :dateTo', {
        dateTo: new Date(release_date_to),
      });
    }

    // Order by creation date descending
    queryBuilder.orderBy('movie.created_at', 'DESC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [movies, total] = await queryBuilder.getManyAndCount();

    return { movies, total };
  }

  async findActiveMovies(): Promise<Movie[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.showtimes', 'showtime')
      .where('showtime.start_time >= :today', { today })
      .orderBy('movie.title', 'ASC')
      .getMany();
  }
}
