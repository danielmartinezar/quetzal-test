// src/movies/dto/create-movie.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateMovieDto {
  @ApiProperty({
    example: 'Avatar: The Way of Water',
    description: 'Título de la película',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Una épica aventura submarina en el mundo de Pandora',
    description: 'Descripción de la película',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 192,
    description: 'Duración en minutos',
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    example: 'Ciencia Ficción',
    description: 'Género de la película',
  })
  @IsString()
  @IsNotEmpty()
  genre: string;

  @ApiProperty({
    example: '2022-12-16',
    description: 'Fecha de estreno (YYYY-MM-DD)',
  })
  @IsDateString()
  release_date: string;
}

export class UpdateMovieDto extends PartialType(CreateMovieDto) {}

export class MovieResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Avatar: The Way of Water' })
  title: string;

  @ApiProperty({ example: 'Una épica aventura submarina...' })
  description: string;

  @ApiProperty({ example: 192 })
  duration: number;

  @ApiProperty({ example: 'Ciencia Ficción' })
  genre: string;

  @ApiProperty({ example: '2022-12-16T00:00:00.000Z' })
  release_date: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updated_at: Date;
}
