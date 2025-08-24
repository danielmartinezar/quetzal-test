// src/tickets/tickets.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateTicketDto,
  PurchaseTicketDto,
  UpdateTicketDto,
} from './dto/ticket.dto';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { TicketsRepository } from './ticket.repository';
import { ShowtimesRepository } from 'src/showtimes/showtime.repository';

@Injectable()
export class TicketsService {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly showtimesRepository: ShowtimesRepository,
  ) {}

  /**
   * 🎫 CORE BUSINESS LOGIC: Purchase ticket with anti-overselling protection
   */
  async purchaseTicket(
    showtimeId: string,
    purchaseTicketDto: PurchaseTicketDto,
  ): Promise<Ticket> {
    const { customer_name, customer_email, seat_number } = purchaseTicketDto;

    // BUSINESS VALIDATION: Check showtime exists
    const showtime =
      await this.showtimesRepository.findWithRelations(showtimeId);
    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${showtimeId} not found`);
    }

    // BUSINESS RULE: Cannot sell tickets for past showtimes
    if (new Date(showtime.start_time) <= new Date()) {
      throw new BadRequestException(
        'Cannot purchase tickets for past or ongoing showtimes',
      );
    }

    // BUSINESS VALIDATION: Validate customer email format
    if (!this.isValidEmail(customer_email)) {
      throw new BadRequestException('Invalid email format');
    }

    // BUSINESS VALIDATION: Validate seat format (optional business rule)
    if (!this.isValidSeatNumber(seat_number)) {
      throw new BadRequestException(
        'Invalid seat number format. Use format like: A-1, B-15, etc.',
      );
    }

    // Prepare clean ticket data
    const ticketData = {
      customer_name: customer_name.trim(),
      customer_email: customer_email.toLowerCase().trim(),
      seat_number: seat_number.trim().toUpperCase(),
    };

    // Repository handles all DB logic including transactions
    const { ticket } =
      await this.ticketsRepository.purchaseTicketWithTransaction(
        showtimeId,
        ticketData,
      );

    return ticket;
  }

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    // Use the main purchase logic for consistency
    return this.purchaseTicket(createTicketDto.showtime_id, {
      customer_name: createTicketDto.customer_name,
      customer_email: createTicketDto.customer_email,
      seat_number: createTicketDto.seat_number,
    });
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketsRepository.findAll();
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findWithShowtimeDetails(id);

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async findByCustomerEmail(email: string): Promise<Ticket[]> {
    // ⚠️ BUSINESS VALIDATION: Validate email format
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    return this.ticketsRepository.findByCustomerEmail(
      email.toLowerCase().trim(),
    );
  }

  async findByShowtime(showtimeId: string): Promise<Ticket[]> {
    // ⚠️ BUSINESS VALIDATION: Check showtime exists
    const showtime = await this.showtimesRepository.findById(showtimeId);
    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${showtimeId} not found`);
    }

    return this.ticketsRepository.findByShowtimeId(showtimeId);
  }

  async getOccupiedSeats(showtimeId: string): Promise<string[]> {
    // ⚠️ BUSINESS VALIDATION: Check showtime exists
    const showtime = await this.showtimesRepository.findById(showtimeId);
    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${showtimeId} not found`);
    }

    return this.ticketsRepository.getOccupiedSeats(showtimeId);
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const existingTicket = await this.ticketsRepository.findById(id);
    if (!existingTicket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    // Get ticket with showtime details for business validations
    const ticketWithShowtime =
      await this.ticketsRepository.findWithShowtimeDetails(id);
    if (!ticketWithShowtime) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    // ⚠️ BUSINESS RULE: Cannot update ticket for past showtimes
    if (new Date(ticketWithShowtime.showtime.start_time) <= new Date()) {
      throw new BadRequestException(
        'Cannot update ticket for past or ongoing showtimes',
      );
    }

    // ⚠️ BUSINESS VALIDATION: If changing seat, validate new seat is available
    if (
      updateTicketDto.seat_number &&
      updateTicketDto.seat_number !== existingTicket.seat_number
    ) {
      const seatTaken = await this.ticketsRepository.findByShowtimeAndSeat(
        ticketWithShowtime.showtime.id,
        updateTicketDto.seat_number,
      );

      if (seatTaken) {
        throw new BadRequestException(
          `Seat ${updateTicketDto.seat_number} is already occupied`,
        );
      }

      // Validate seat format
      if (!this.isValidSeatNumber(updateTicketDto.seat_number)) {
        throw new BadRequestException(
          'Invalid seat number format. Use format like: A-1, B-15, etc.',
        );
      }
    }

    // ⚠️ BUSINESS VALIDATION: If changing email, validate format
    if (updateTicketDto.customer_email) {
      if (!this.isValidEmail(updateTicketDto.customer_email)) {
        throw new BadRequestException('Invalid email format');
      }
      updateTicketDto.customer_email = updateTicketDto.customer_email
        .toLowerCase()
        .trim();
    }

    // Clean up data
    if (updateTicketDto.customer_name) {
      updateTicketDto.customer_name = updateTicketDto.customer_name.trim();
    }

    if (updateTicketDto.seat_number) {
      updateTicketDto.seat_number = updateTicketDto.seat_number
        .trim()
        .toUpperCase();
    }

    return this.ticketsRepository.update(id, updateTicketDto);
  }

  async cancelTicket(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findWithShowtimeDetails(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    // ⚠️ BUSINESS RULE: Cannot cancel ticket for past or ongoing showtimes
    if (new Date(ticket.showtime.start_time) <= new Date()) {
      throw new BadRequestException(
        'Cannot cancel ticket for past or ongoing showtimes',
      );
    }

    // ⚠️ BUSINESS RULE: Only purchased tickets can be cancelled
    if (ticket.status !== TicketStatus.PURCHASED) {
      throw new BadRequestException('Only purchased tickets can be cancelled');
    }

    try {
      // Repository handles all DB logic including transactions
      return await this.ticketsRepository.cancelTicketWithTransaction(id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to cancel ticket',
      );
    }
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.ticketsRepository.findWithShowtimeDetails(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    // ⚠️ BUSINESS LOGIC: Use cancel logic to maintain data integrity
    if (ticket.status === TicketStatus.PURCHASED) {
      await this.cancelTicket(id);
    }

    // Only physically delete cancelled tickets
    await this.ticketsRepository.delete(id);
  }

  // ⚠️ BUSINESS VALIDATION HELPERS
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidSeatNumber(seatNumber: string): boolean {
    // Business rule: Seat format should be like A-1, B-15, AA-123, etc.
    const seatRegex = /^[A-Z]{1,2}-\d{1,3}$/;
    return seatRegex.test(seatNumber.toUpperCase());
  }
}
