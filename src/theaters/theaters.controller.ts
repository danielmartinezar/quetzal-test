// src/theaters/theaters.controller.ts
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
import { TheatersService } from './theaters.service';
import {
  CreateTheaterDto,
  TheaterResponseDto,
  UpdateTheaterDto,
} from './dto/theater-dto';
import { PaginatedResponseDto } from 'src/common/common-dto';

@ApiTags('theaters')
@Controller('theaters')
export class TheatersController {
  constructor(private readonly theatersService: TheatersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new theater' })
  @ApiResponse({
    status: 201,
    description: 'Theater created successfully',
    type: TheaterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - validation failed or theater name already exists',
  })
  async create(
    @Body() createTheaterDto: CreateTheaterDto,
  ): Promise<TheaterResponseDto> {
    return this.theatersService.create(createTheaterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all theaters with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by theater name',
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'Theaters retrieved successfully',
    type: PaginatedResponseDto<TheaterResponseDto>,
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('is_active') is_active?: boolean,
  ): Promise<PaginatedResponseDto<TheaterResponseDto>> {
    const paginationDto = {
      page: page || 1,
      limit: limit || 10,
      search,
      is_active,
    };
    return this.theatersService.findAll(paginationDto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active theaters only with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by theater name',
  })
  @ApiResponse({
    status: 200,
    description: 'Active theaters retrieved successfully',
    type: PaginatedResponseDto<TheaterResponseDto>,
  })
  async findActiveTheaters(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ): Promise<PaginatedResponseDto<TheaterResponseDto>> {
    const paginationDto = {
      page: page || 1,
      limit: limit || 10,
      search,
      is_active: true,
    };
    return this.theatersService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get theater by ID' })
  @ApiParam({ name: 'id', description: 'Theater UUID' })
  @ApiResponse({
    status: 200,
    description: 'Theater retrieved successfully',
    type: TheaterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Theater not found',
  })
  async findOne(@Param('id') id: string): Promise<TheaterResponseDto> {
    return this.theatersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update theater by ID' })
  @ApiParam({ name: 'id', description: 'Theater UUID' })
  @ApiResponse({
    status: 200,
    description: 'Theater updated successfully',
    type: TheaterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Theater not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTheaterDto: UpdateTheaterDto,
  ): Promise<TheaterResponseDto> {
    return this.theatersService.update(id, updateTheaterDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate theater' })
  @ApiParam({ name: 'id', description: 'Theater UUID' })
  @ApiResponse({
    status: 200,
    description: 'Theater deactivated successfully',
    type: TheaterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Theater not found',
  })
  async deactivate(@Param('id') id: string): Promise<TheaterResponseDto> {
    return this.theatersService.deactivate(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate theater' })
  @ApiParam({ name: 'id', description: 'Theater UUID' })
  @ApiResponse({
    status: 200,
    description: 'Theater activated successfully',
    type: TheaterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Theater not found',
  })
  async activate(@Param('id') id: string): Promise<TheaterResponseDto> {
    return this.theatersService.activate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete theater by ID' })
  @ApiParam({ name: 'id', description: 'Theater UUID' })
  @ApiResponse({
    status: 204,
    description: 'Theater deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete theater with upcoming showtimes',
  })
  @ApiResponse({
    status: 404,
    description: 'Theater not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.theatersService.remove(id);
  }
}
