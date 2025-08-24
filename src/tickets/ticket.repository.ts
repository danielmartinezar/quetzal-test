// src/tickets/repositories/tickets.repository.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Showtime } from 'src/showtimes/entities/showtime.entity';

export interface TicketsRepositoryInterface {
  create(ticketData: Partial<Ticket>): Promise<Ticket>;
  findAll(): Promise<Ticket[]>;
  findById(id: string): Promise<Ticket | null>;
  update(id: string, ticketData: Partial<Ticket>): Promise<Ticket>;
  delete(id: string): Promise<void>;
  findByShowtimeId(showtimeId: string): Promise<Ticket[]>;
  findByShowtimeAndSeat(
    showtimeId: string,
    seatNumber: string,
  ): Promise<Ticket | null>;
  findActiveTicketsByShowtime(showtimeId: string): Promise<Ticket[]>;
  findByCustomerEmail(email: string): Promise<Ticket[]>;
  findWithShowtimeDetails(id: string): Promise<Ticket | null>;
  countTicketsByShowtime(showtimeId: string): Promise<number>;
  getOccupiedSeats(showtimeId: string): Promise<string[]>;
  findByStatus(status: TicketStatus): Promise<Ticket[]>;
  // 🔥 NEW: Transaction methods for business logic
  purchaseTicketWithTransaction(
    showtimeId: string,
    ticketData: Partial<Ticket>,
  ): Promise<{ ticket: Ticket; showtime: Showtime }>;
  cancelTicketWithTransaction(ticketId: string): Promise<Ticket>;
}

@Injectable()
export class TicketsRepository implements TicketsRepositoryInterface {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly dataSource: DataSource,
  ) {}

  async create(ticketData: Partial<Ticket>): Promise<Ticket> {
    const ticket = this.ticketRepository.create(ticketData);
    return this.ticketRepository.save(ticket);
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      relations: ['showtime', 'showtime.movie', 'showtime.theater'],
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.ticketRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, ticketData: Partial<Ticket>): Promise<Ticket> {
    await this.ticketRepository.update(id, ticketData);
    const ticket = await this.findById(id);
    if (!ticket) {
      throw new Error(`Ticket with id ${id} not found`);
    }
    return ticket;
  }

  async delete(id: string): Promise<void> {
    await this.ticketRepository.delete(id);
  }

  async findByShowtimeId(showtimeId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: {
        showtime: { id: showtimeId },
      },
      relations: ['showtime', 'showtime.movie', 'showtime.theater'],
      order: { created_at: 'DESC' },
    });
  }

  async findByShowtimeAndSeat(
    showtimeId: string,
    seatNumber: string,
  ): Promise<Ticket | null> {
    return this.ticketRepository.findOne({
      where: {
        showtime: { id: showtimeId },
        seat_number: seatNumber,
        status: TicketStatus.PURCHASED,
      },
    });
  }

  async findActiveTicketsByShowtime(showtimeId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: {
        showtime: { id: showtimeId },
        status: TicketStatus.PURCHASED,
      },
      order: { seat_number: 'ASC' },
    });
  }

  async findByCustomerEmail(email: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { customer_email: email },
      relations: ['showtime', 'showtime.movie', 'showtime.theater'],
      order: { created_at: 'DESC' },
    });
  }

  async findWithShowtimeDetails(id: string): Promise<Ticket | null> {
    return this.ticketRepository.findOne({
      where: { id },
      relations: ['showtime', 'showtime.movie', 'showtime.theater'],
    });
  }

  async countTicketsByShowtime(showtimeId: string): Promise<number> {
    return this.ticketRepository.count({
      where: {
        showtime: { id: showtimeId },
        status: TicketStatus.PURCHASED,
      },
    });
  }

  async getOccupiedSeats(showtimeId: string): Promise<string[]> {
    const tickets = await this.ticketRepository.find({
      where: {
        showtime: { id: showtimeId },
        status: TicketStatus.PURCHASED,
      },
      select: ['seat_number'],
      order: { seat_number: 'ASC' },
    });

    return tickets.map((ticket) => ticket.seat_number);
  }

  async findByStatus(status: TicketStatus): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { status },
      relations: ['showtime', 'showtime.movie', 'showtime.theater'],
      order: { created_at: 'DESC' },
    });
  }

  // 🔥 TRANSACTION METHOD: Purchase ticket with anti-overselling protection
  async purchaseTicketWithTransaction(
    showtimeId: string,
    ticketData: Partial<Ticket>,
  ): Promise<{ ticket: Ticket; showtime: Showtime }> {
    return this.dataSource.transaction(async (manager) => {
      // 🔒 First, lock the showtime record WITHOUT relations to avoid outer join issues
      const lockedShowtime = await manager.findOne(Showtime, {
        where: { id: showtimeId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedShowtime) {
        throw new Error(`Showtime with ID ${showtimeId} not found`);
      }

      // 📋 Now fetch the complete showtime data with relations (no lock needed)
      const showtime = await manager.findOne(Showtime, {
        where: { id: showtimeId },
        relations: ['theater', 'movie'],
      });

      if (!showtime) {
        throw new Error(`Showtime with ID ${showtimeId} not found`);
      }

      // Check capacity
      if (showtime.sold_tickets >= showtime.theater.capacity) {
        throw new BadRequestException(
          'Showtime is sold out - no available seats',
        );
      }

      // Check if seat is already taken
      const existingTicket = await manager.findOne(Ticket, {
        where: {
          showtime: { id: showtimeId },
          seat_number: ticketData.seat_number,
          status: TicketStatus.PURCHASED,
        },
      });

      if (existingTicket) {
        throw new BadRequestException(
          `Seat ${ticketData.seat_number} is already occupied`,
        );
      }

      // Create ticket
      const ticket = manager.create(Ticket, {
        ...ticketData,
        showtime: { id: showtimeId },
        status: TicketStatus.PURCHASED,
        price: showtime.price,
      });

      const savedTicket = await manager.save(ticket);

      // Increment sold tickets counter atomically
      await manager.increment(Showtime, { id: showtimeId }, 'sold_tickets', 1);

      // Load complete ticket with relations
      const completeTicket = await manager.findOne(Ticket, {
        where: { id: savedTicket.id },
        relations: ['showtime', 'showtime.movie', 'showtime.theater'],
      });

      return { ticket: completeTicket!, showtime };
    });
  }

  //TRANSACTION METHOD: Cancel ticket with decrement counter
  async cancelTicketWithTransaction(ticketId: string): Promise<Ticket> {
    return this.dataSource.transaction(async (manager) => {
      const ticket = await manager.findOne(Ticket, {
        where: { id: ticketId },
        relations: ['showtime'],
      });

      if (!ticket) {
        throw new Error(`Ticket with ID ${ticketId} not found`);
      }

      if (ticket.status !== TicketStatus.PURCHASED) {
        throw new Error('Only purchased tickets can be cancelled');
      }

      // Update ticket status to cancelled
      await manager.update(
        Ticket,
        { id: ticketId },
        { status: TicketStatus.CANCELLED },
      );

      // Decrement sold tickets counter atomically
      await manager.decrement(
        Showtime,
        { id: ticket.showtime.id },
        'sold_tickets',
        1,
      );

      // Return updated ticket
      return manager.findOne(Ticket, {
        where: { id: ticketId },
        relations: ['showtime', 'showtime.movie', 'showtime.theater'],
      }) as Promise<Ticket>;
    });
  }
}
