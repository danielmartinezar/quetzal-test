// src/movies/movies.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateMovieDto,
  MovieResponseDto,
  UpdateMovieDto,
} from './dto/movie-dto';
import { MoviesService } from './movies.service';
import { MovieSearchDto, PaginatedResponseDto } from 'src/common/common-dto';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new movie' })
  @ApiResponse({
    status: 201,
    description: 'Movie created successfully',
    type: MovieResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or movie already exists',
  })
  async create(
    @Body() createMovieDto: CreateMovieDto,
  ): Promise<MovieResponseDto> {
    return this.moviesService.create(createMovieDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all movies with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'title', required: false, type: String, example: 'Avatar' })
  @ApiQuery({ name: 'genre', required: false, type: String, example: 'Action' })
  @ApiQuery({
    name: 'release_date_from',
    required: false,
    type: String,
    example: '2020-01-01',
  })
  @ApiQuery({
    name: 'release_date_to',
    required: false,
    type: String,
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Movies retrieved successfully',
    type: PaginatedResponseDto<MovieResponseDto>,
  })
  async findAll(
    @Query() searchDto: MovieSearchDto,
  ): Promise<PaginatedResponseDto<MovieResponseDto>> {
    return this.moviesService.findAll(searchDto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active movies with upcoming showtimes' })
  @ApiResponse({
    status: 200,
    description: 'Active movies retrieved successfully',
    type: [MovieResponseDto],
  })
  async findActiveMovies(): Promise<MovieResponseDto[]> {
    return this.moviesService.findActiveMovies();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get movie by ID' })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({
    status: 200,
    description: 'Movie retrieved successfully',
    type: MovieResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Movie not found',
  })
  async findOne(@Param('id') id: string): Promise<MovieResponseDto> {
    return this.moviesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update movie by ID' })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({
    status: 200,
    description: 'Movie updated successfully',
    type: MovieResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Movie not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ): Promise<MovieResponseDto> {
    return this.moviesService.update(id, updateMovieDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete movie by ID' })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({
    status: 204,
    description: 'Movie deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete movie with upcoming showtimes',
  })
  @ApiResponse({
    status: 404,
    description: 'Movie not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.moviesService.remove(id);
  }
}
