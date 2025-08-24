import {
  IsOptional,
  IsPositive,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsDateString,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({
    example: 1,
    required: false,
    description: 'Número de página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @ApiProperty({
    example: 10,
    required: false,
    description: 'Elementos por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Datos de la página actual' })
  data: T[];

  @ApiProperty({ example: 1, description: 'Página actual' })
  page: number;

  @ApiProperty({ example: 10, description: 'Elementos por página' })
  limit: number;

  @ApiProperty({ example: 100, description: 'Total de elementos' })
  total: number;

  @ApiProperty({ example: 10, description: 'Total de páginas' })
  totalPages: number;

  @ApiProperty({ example: true, description: 'Tiene página anterior' })
  hasPrevious: boolean;

  @ApiProperty({ example: true, description: 'Tiene página siguiente' })
  hasNext: boolean;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operación completada exitosamente' })
  message: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  timestamp: Date;
}

export class MovieSearchDto extends PaginationDto {
  @ApiProperty({
    example: 'Avatar',
    required: false,
    description: 'Buscar por título',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'Ciencia Ficción',
    required: false,
    description: 'Filtrar por género',
  })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiProperty({
    example: '2022-01-01',
    required: false,
    description: 'Películas desde esta fecha',
  })
  @IsOptional()
  @IsDateString()
  release_date_from?: string;

  @ApiProperty({
    example: '2024-12-31',
    required: false,
    description: 'Películas hasta esta fecha',
  })
  @IsOptional()
  @IsDateString()
  release_date_to?: string;
}

export class ShowtimeSearchDto extends PaginationDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
    description: 'Filtrar por película',
  })
  @IsOptional()
  @IsUUID()
  movie_id?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
    description: 'Filtrar por sala',
  })
  @IsOptional()
  @IsUUID()
  theater_id?: string;

  @ApiProperty({
    example: '2024-12-25',
    required: false,
    description: 'Funciones desde esta fecha',
  })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiProperty({
    example: '2024-12-31',
    required: false,
    description: 'Funciones hasta esta fecha',
  })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}
