import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Showtime } from '../../showtimes/entities/showtime.entity';

export enum TicketStatus {
  RESERVED = 'reserved',
  PURCHASED = 'purchased',
  CANCELLED = 'cancelled',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customer_name: string;

  @Column()
  customer_email: string;

  @Column()
  seat_number: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.PURCHASED,
  })
  status: TicketStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Showtime, (showtime) => showtime.tickets)
  @JoinColumn({ name: 'showtime_id' })
  showtime: Showtime;
}
