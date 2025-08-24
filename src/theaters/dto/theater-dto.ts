// src/theaters/dto/create-theater.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateTheaterDto {
  @ApiProperty({
    example: 'Sala VIP 1',
    description: 'Nombre de la sala',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 150,
    description: 'Capacidad máxima de asientos',
  })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({
    example: true,
    required: false,
    default: true,
    description: 'Estado activo de la sala',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateTheaterDto extends PartialType(CreateTheaterDto) {}

export class TheaterResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ example: 'Sala VIP 1' })
  name: string;

  @ApiProperty({ example: 150 })
  capacity: number;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updated_at: Date;
}
