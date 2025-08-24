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
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  PurchaseTicketDto,
  TicketResponseDto,
  UpdateTicketDto,
} from './dto/ticket.dto';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({
    summary: 'Purchase a ticket',
    description:
      'Creates a new ticket purchase with anti-overselling validation',
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket purchased successfully',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - seat occupied, showtime sold out, or past showtime',
  })
  @ApiResponse({
    status: 404,
    description: 'Showtime not found',
  })
  async create(
    @Body() createTicketDto: CreateTicketDto,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.create(createTicketDto);
    return {
      ...ticket,
      showtime_id: ticket.showtime?.id || createTicketDto.showtime_id,
    } as TicketResponseDto;
  }

  @Post('purchase/:showtimeId')
  @ApiOperation({
    summary: 'Purchase ticket for specific showtime',
    description:
      'Main ticket purchasing endpoint with full business logic validation',
  })
  @ApiParam({ name: 'showtimeId', description: 'Showtime UUID' })
  @ApiResponse({
    status: 201,
    description: 'Ticket purchased successfully',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - capacity exceeded, seat occupied, or past showtime',
  })
  @ApiResponse({
    status: 404,
    description: 'Showtime not found',
  })
  async purchaseTicket(
    @Param('showtimeId') showtimeId: string,
    @Body() purchaseTicketDto: PurchaseTicketDto,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.purchaseTicket(
      showtimeId,
      purchaseTicketDto,
    );
    return {
      ...ticket,
      showtime_id: ticket.showtime?.id || showtimeId,
    } as TicketResponseDto;
  }

  @Get()
  @ApiOperation({ summary: 'Get all tickets' })
  @ApiResponse({
    status: 200,
    description: 'Tickets retrieved successfully',
    type: [TicketResponseDto],
  })
  async findAll(): Promise<TicketResponseDto[]> {
    const tickets = await this.ticketsService.findAll();
    return tickets.map((ticket) => ({
      ...ticket,
      showtime_id: ticket.showtime?.id,
    })) as TicketResponseDto[];
  }

  @Get('by-customer')
  @ApiOperation({ summary: 'Get tickets by customer email' })
  @ApiQuery({
    name: 'email',
    required: true,
    type: String,
    example: 'customer@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer tickets retrieved successfully',
    type: [TicketResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email format',
  })
  async findByCustomer(
    @Query('email') email: string,
  ): Promise<TicketResponseDto[]> {
    const tickets = await this.ticketsService.findByCustomerEmail(email);
    return tickets.map((ticket) => ({
      ...ticket,
      showtime_id: ticket.showtime?.id,
    })) as TicketResponseDto[];
  }

  @Get('by-showtime/:showtimeId')
  @ApiOperation({ summary: 'Get all tickets for a showtime' })
  @ApiParam({ name: 'showtimeId', description: 'Showtime UUID' })
  @ApiResponse({
    status: 200,
    description: 'Showtime tickets retrieved successfully',
    type: [TicketResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Showtime not found',
  })
  async findByShowtime(
    @Param('showtimeId') showtimeId: string,
  ): Promise<TicketResponseDto[]> {
    const tickets = await this.ticketsService.findByShowtime(showtimeId);
    return tickets.map((ticket) => ({
      ...ticket,
      showtime_id: ticket.showtime?.id || showtimeId,
    })) as TicketResponseDto[];
  }

  @Get('occupied-seats/:showtimeId')
  @ApiOperation({
    summary: 'Get occupied seats for a showtime',
    description:
      'Returns list of occupied seat numbers to help prevent double booking',
  })
  @ApiParam({ name: 'showtimeId', description: 'Showtime UUID' })
  @ApiResponse({
    status: 200,
    description: 'Occupied seats retrieved successfully',
    type: [String],
    examples: {
      example1: {
        value: ['A-1', 'A-2', 'B-15', 'C-7'],
        summary: '',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Showtime not found',
  })
  async getOccupiedSeats(
    @Param('showtimeId') showtimeId: string,
  ): Promise<string[]> {
    return this.ticketsService.getOccupiedSeats(showtimeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket retrieved successfully',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async findOne(@Param('id') id: string): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.findOne(id);
    return {
      ...ticket,
      showtime_id: ticket.showtime?.id,
    } as TicketResponseDto;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket updated successfully',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot update past showtime or seat occupied',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.update(id, updateTicketDto);
    return {
      ...ticket,
      showtime_id: ticket.showtime?.id,
    } as TicketResponseDto;
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel ticket',
    description: 'Cancels a ticket and decrements the sold tickets counter',
  })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket cancelled successfully',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Cannot cancel ticket for past showtime or already cancelled ticket',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async cancelTicket(@Param('id') id: string): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.cancelTicket(id);
    return {
      ...ticket,
      showtime_id: ticket.showtime?.id,
    } as TicketResponseDto;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({
    status: 204,
    description: 'Ticket deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.ticketsService.remove(id);
  }
}
