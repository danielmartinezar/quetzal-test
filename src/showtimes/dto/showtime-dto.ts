// src/showtimes/dto/create-showtime.dto.ts
import { IsUUID, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { MovieResponseDto } from 'src/movies/dto/movie-dto';
import { TheaterResponseDto } from 'src/theaters/dto/theater-dto';

export class CreateShowtimeDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID de la película',
  })
  @IsUUID()
  movie_id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID de la sala',
  })
  @IsUUID()
  theater_id: string;

  @ApiProperty({
    example: '2024-12-25T19:30:00.000Z',
    description: 'Fecha y hora de inicio de la función',
  })
  @IsDateString()
  start_time: string;

  @ApiProperty({
    example: 15.5,
    description: 'Precio del ticket',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}

export class ShowtimeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  id: string;

  @ApiProperty({ example: '2024-12-25T19:30:00.000Z' })
  start_time: Date;

  @ApiProperty({ example: '2024-12-25T22:42:00.000Z' })
  end_time: Date;

  @ApiProperty({ example: 15.5 })
  price: number;

  @ApiProperty({ example: 25 })
  sold_tickets: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updated_at: Date;

  @ApiProperty({ type: MovieResponseDto })
  movie?: MovieResponseDto;

  @ApiProperty({ type: TheaterResponseDto })
  theater?: TheaterResponseDto;
}

export class ShowtimeAvailabilityDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  showtime_id: string;

  @ApiProperty({ example: 150 })
  total_capacity: number;

  @ApiProperty({ example: 25 })
  sold_tickets: number;

  @ApiProperty({ example: 125 })
  available_seats: number;

  @ApiProperty({ example: false })
  is_sold_out: boolean;
}

export class UpdateShowtimeDto extends PartialType(CreateShowtimeDto) {}
