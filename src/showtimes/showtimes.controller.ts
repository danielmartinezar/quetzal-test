// src/showtimes/showtimes.controller.ts
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
  CreateShowtimeDto,
  ShowtimeAvailabilityDto,
  ShowtimeResponseDto,
  UpdateShowtimeDto,
} from './dto/showtime-dto';
import { ShowtimesService } from './showtimes.service';
import { PaginatedResponseDto, ShowtimeSearchDto } from 'src/common/common-dto';

@ApiTags('showtimes')
@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new showtime',
    description:
      'Creates a showtime associating movie + theater + time. Validates no scheduling conflicts and prevents past dates.',
  })
  @ApiResponse({
    status: 201,
    description: 'Showtime created successfully',
    type: ShowtimeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - validation failed, past date, or scheduling conflict',
  })
  @ApiResponse({
    status: 404,
    description: 'Movie or theater not found',
  })
  async create(
    @Body() createShowtimeDto: CreateShowtimeDto,
  ): Promise<ShowtimeResponseDto> {
    return this.showtimesService.create(createShowtimeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all showtimes with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'movie_id',
    required: false,
    type: String,
    description: 'Filter by movie UUID',
  })
  @ApiQuery({
    name: 'theater_id',
    required: false,
    type: String,
    description: 'Filter by theater UUID',
  })
  @ApiQuery({
    name: 'date_from',
    required: false,
    type: String,
    example: '2024-01-01',
    description: 'Filter showtimes from date',
  })
  @ApiQuery({
    name: 'date_to',
    required: false,
    type: String,
    example: '2024-12-31',
    description: 'Filter showtimes until date',
  })
  @ApiResponse({
    status: 200,
    description: 'Showtimes retrieved successfully',
    type: PaginatedResponseDto<ShowtimeResponseDto>,
  })
  async findAll(
    @Query() searchDto: ShowtimeSearchDto,
  ): Promise<PaginatedResponseDto<ShowtimeResponseDto>> {
    return this.showtimesService.findAll(searchDto);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming showtimes (next 20)' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming showtimes retrieved successfully',
    type: [ShowtimeResponseDto],
  })
  async findUpcoming(): Promise<ShowtimeResponseDto[]> {
    return this.showtimesService.findUpcoming();
  }

  @Get('by-movie/:movieId')
  @ApiOperation({ summary: 'Get showtimes by movie ID' })
  @ApiParam({ name: 'movieId', description: 'Movie UUID' })
  @ApiResponse({
    status: 200,
    description: 'Showtimes for movie retrieved successfully',
    type: [ShowtimeResponseDto],
  })
  async findByMovie(
    @Param('movieId') movieId: string,
  ): Promise<ShowtimeResponseDto[]> {
    return this.showtimesService.findByMovieId(movieId);
  }

  @Get('by-theater/:theaterId')
  @ApiOperation({ summary: 'Get showtimes by theater ID' })
  @ApiParam({ name: 'theaterId', description: 'Theater UUID' })
  @ApiResponse({
    status: 200,
    description: 'Showtimes for theater retrieved successfully',
    type: [ShowtimeResponseDto],
  })
  async findByTheater(
    @Param('theaterId') theaterId: string,
  ): Promise<ShowtimeResponseDto[]> {
    return this.showtimesService.findByTheaterId(theaterId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get showtime by ID' })
  @ApiParam({ name: 'id', description: 'Showtime UUID' })
  @ApiResponse({
    status: 200,
    description: 'Showtime retrieved successfully',
    type: ShowtimeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Showtime not found',
  })
  async findOne(@Param('id') id: string): Promise<ShowtimeResponseDto> {
    return this.showtimesService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({
    summary: 'Get showtime availability',
    description: 'Returns seat availability information to prevent overselling',
  })
  @ApiParam({ name: 'id', description: 'Showtime UUID' })
  @ApiResponse({
    status: 200,
    description: 'Showtime availability retrieved successfully',
    type: ShowtimeAvailabilityDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Showtime not found',
  })
  async getAvailability(
    @Param('id') id: string,
  ): Promise<ShowtimeAvailabilityDto> {
    return this.showtimesService.getAvailability(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update showtime by ID' })
  @ApiParam({ name: 'id', description: 'Showtime UUID' })
  @ApiResponse({
    status: 200,
    description: 'Showtime updated successfully',
    type: ShowtimeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or showtime already started',
  })
  @ApiResponse({
    status: 404,
    description: 'Showtime not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateShowtimeDto: UpdateShowtimeDto,
  ): Promise<ShowtimeResponseDto> {
    return this.showtimesService.update(id, updateShowtimeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete showtime by ID' })
  @ApiParam({ name: 'id', description: 'Showtime UUID' })
  @ApiResponse({
    status: 204,
    description: 'Showtime deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Cannot delete showtime with sold tickets or that already started',
  })
  @ApiResponse({
    status: 404,
    description: 'Showtime not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.showtimesService.remove(id);
  }
}
