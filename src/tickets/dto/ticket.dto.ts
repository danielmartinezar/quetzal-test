// src/tickets/dto/create-ticket.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsUUID,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { TicketStatus } from '../entities/ticket.entity';
import { ShowtimeResponseDto } from 'src/showtimes/dto/showtime-dto';

export class CreateTicketDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del cliente',
  })
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @ApiProperty({
    example: 'juan.perez@example.com',
    description: 'Email del cliente',
  })
  @IsEmail()
  customer_email: string;

  @ApiProperty({
    example: 'A-15',
    description: 'Número de asiento',
  })
  @IsString()
  @IsNotEmpty()
  seat_number: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'ID de la función',
  })
  @IsUUID()
  showtime_id: string;
}

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiProperty({
    enum: TicketStatus,
    example: TicketStatus.PURCHASED,
    required: false,
    description: 'Estado del ticket',
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}

export class TicketResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  id: string;

  @ApiProperty({ example: 'Juan Pérez' })
  customer_name: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  customer_email: string;

  @ApiProperty({ example: 'A-15' })
  seat_number: string;

  @ApiProperty({ enum: TicketStatus, example: TicketStatus.PURCHASED })
  status: TicketStatus;

  @ApiProperty({ example: 15.5 })
  price: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  showtime_id: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updated_at: Date;

  @ApiProperty({ type: ShowtimeResponseDto })
  showtime?: ShowtimeResponseDto;
}

export class PurchaseTicketDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del cliente',
  })
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @ApiProperty({
    example: 'juan.perez@example.com',
    description: 'Email del cliente',
  })
  @IsEmail()
  customer_email: string;

  @ApiProperty({
    example: 'A-15',
    description: 'Número de asiento',
  })
  @IsString()
  @IsNotEmpty()
  seat_number: string;
}

export class CancelTicketDto {
  @ApiProperty({
    example: 'Cliente cambió de planes',
    required: false,
    description: 'Razón de la cancelación',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
