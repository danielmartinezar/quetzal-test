// src/database/seeds/seed.ts
import { DataSource } from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity';
import { Theater } from '../../theaters/entities/theater.entity';
import { Showtime } from '../../showtimes/entities/showtime.entity';
import { Ticket } from '../../tickets/entities/ticket.entity'; // ✅ Agregar entidad Ticket
import { addHours, addDays, addMinutes } from 'date-fns';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// TypeORM DataSource configuration
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'cinema_db',
  entities: [Movie, Theater, Showtime, Ticket], // ✅ Incluir todas las entidades
  synchronize: false,
  logging: false,
});

class DatabaseSeeder {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async run(): Promise<void> {
    try {
      console.log('🌱 Starting database seeding...');

      // Clear existing data
      await this.clearData();
      console.log('🧹 Cleared existing data');

      // Seed data
      const theaters = await this.seedTheaters();
      console.log(`🏛️  Created ${theaters.length} theaters`);

      const movies = await this.seedMovies();
      console.log(`🎬 Created ${movies.length} movies`);

      const showtimes = await this.seedShowtimes(movies, theaters);
      console.log(`🎭 Created ${showtimes.length} showtimes`);

      console.log('✅ Database seeding completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`   • Theaters: ${theaters.length}`);
      console.log(`   • Movies: ${movies.length}`);
      console.log(`   • Showtimes: ${showtimes.length}`);
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  private async clearData(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // Delete in correct order (respecting foreign key constraints)
      await queryRunner.query('DELETE FROM tickets');
      await queryRunner.query('DELETE FROM showtimes');
      await queryRunner.query('DELETE FROM movies');
      await queryRunner.query('DELETE FROM theaters');
    } finally {
      await queryRunner.release();
    }
  }

  private async seedTheaters(): Promise<Theater[]> {
    const theaterRepository = this.dataSource.getRepository(Theater);

    const theaterData = [
      {
        name: 'IMAX Theater',
        capacity: 300,
        is_active: true,
      },
      {
        name: 'VIP Premium Hall',
        capacity: 50,
        is_active: true,
      },
      {
        name: 'Standard Theater 1',
        capacity: 150,
        is_active: true,
      },
      {
        name: 'Standard Theater 2',
        capacity: 120,
        is_active: true,
      },
      {
        name: '4DX Experience',
        capacity: 80,
        is_active: true,
      },
      {
        name: 'Family Theater',
        capacity: 200,
        is_active: true,
      },
      {
        name: 'Dolby Atmos Hall',
        capacity: 180,
        is_active: true,
      },
      {
        name: 'Classic Cinema',
        capacity: 100,
        is_active: false, // One inactive theater
      },
    ];

    const theaters = theaterRepository.create(theaterData);
    return theaterRepository.save(theaters);
  }

  private async seedMovies(): Promise<Movie[]> {
    const movieRepository = this.dataSource.getRepository(Movie);

    const movieData = [
      {
        title: 'Avatar: The Way of Water',
        description:
          'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Navi race to protect their home.',
        duration: 192,
        genre: 'Science Fiction',
        release_date: new Date('2022-12-16'),
      },
      {
        title: 'Top Gun: Maverick',
        description:
          'After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUNs elite graduates on a mission that demands the ultimate sacrifice from those chosen to fly it.',
        duration: 131,
        genre: 'Action',
        release_date: new Date('2022-05-27'),
      },
      {
        title: 'Spider-Man: No Way Home',
        description:
          'Peter Parker seeks help from Doctor Strange to make the world forget that he is Spider-Man. However, the spell goes wrong and brings enemies from other dimensions.',
        duration: 148,
        genre: 'Action',
        release_date: new Date('2021-12-17'),
      },
      {
        title: 'The Batman',
        description:
          "When the Riddler, a sadistic serial killer, begins murdering key political figures in Gotham, Batman is forced to investigate the citys hidden corruption and question his family's involvement.",
        duration: 176,
        genre: 'Action',
        release_date: new Date('2022-03-04'),
      },
      {
        title: 'Dune',
        description:
          'Paul Atreides arrives on Arrakis after his father accepts the stewardship of the dangerous planet. However, chaos ensues after a betrayal as forces clash to control melange, a precious resource.',
        duration: 155,
        genre: 'Science Fiction',
        release_date: new Date('2021-10-22'),
      },
      {
        title: 'No Time to Die',
        description:
          'James Bond has left active service. His peace is short-lived when Felix Leiter, an old friend from the CIA, turns up asking for help, leading Bond onto the trail of a mysterious villain armed with dangerous new technology.',
        duration: 163,
        genre: 'Action',
        release_date: new Date('2021-10-08'),
      },
      {
        title: 'Encanto',
        description:
          'The Madrigal family live hidden in the mountains of Colombia, in a magical house, in a vibrant town, in a wondrous, charmed place called an Encanto.',
        duration: 102,
        genre: 'Animation',
        release_date: new Date('2021-11-24'),
      },
      {
        title: 'The Matrix Resurrections',
        description:
          'Return to a world of two realities: one, everyday life; the other, what lies behind it. To find out if his reality is a construct, to truly know himself, Mr. Anderson will have to choose to follow the white rabbit once more.',
        duration: 148,
        genre: 'Science Fiction',
        release_date: new Date('2021-12-22'),
      },
      {
        title: 'Eternals',
        description:
          'The Eternals, a race of immortal beings with superhuman powers who have secretly lived on Earth for thousands of years, reunite to battle the evil Deviants.',
        duration: 156,
        genre: 'Action',
        release_date: new Date('2021-11-05'),
      },
      {
        title: 'Fast X',
        description:
          "Over many missions and against impossible odds, Dom Toretto and his family have outsmarted and outdriven every foe in their path. Now, they must confront the most lethal opponent they've ever faced.",
        duration: 141,
        genre: 'Action',
        release_date: new Date('2023-05-19'),
      },
    ];

    const movies = movieRepository.create(movieData);
    return movieRepository.save(movies);
  }

  private async seedShowtimes(
    movies: Movie[],
    theaters: Theater[],
  ): Promise<Showtime[]> {
    const showtimeRepository = this.dataSource.getRepository(Showtime);
    const showtimes: any[] = []; // ✅ Usar any[] para evitar problemas de tipado

    // Only use active theaters
    const activeTheaters = theaters.filter((theater) => theater.is_active);

    // Generate showtimes for the next 7 days
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0); // Start of today

    for (let day = 0; day < 7; day++) {
      const currentDate = addDays(baseDate, day);

      // Generate showtimes for each theater
      for (const theater of activeTheaters) {
        const dailyShowtimes = this.generateDailyShowtimes(
          movies,
          theater,
          currentDate,
        );
        showtimes.push(...dailyShowtimes);
      }
    }

    const showtimeEntities = showtimeRepository.create(showtimes);
    return showtimeRepository.save(showtimeEntities);
  }

  private generateDailyShowtimes(
    movies: Movie[],
    theater: Theater,
    date: Date,
  ): any[] {
    // ✅ Usar any[] para evitar problemas de tipado
    const showtimes: any[] = [];

    // Time slots for different theater types
    const timeSlots = this.getTimeSlotsForTheater(theater.name);

    // Select random movies for this theater/day (2-4 movies per theater per day)
    const selectedMovies = this.selectRandomMovies(
      movies,
      Math.floor(Math.random() * 3) + 2,
    );

    let currentSlotIndex = 0;

    for (const movie of selectedMovies) {
      // Each movie gets 1-3 showtimes per day
      const showtimeCount = Math.floor(Math.random() * 3) + 1;

      for (
        let i = 0;
        i < showtimeCount && currentSlotIndex < timeSlots.length;
        i++
      ) {
        const startTime = addHours(date, timeSlots[currentSlotIndex]);
        const endTime = addMinutes(startTime, movie.duration);

        // Calculate price based on theater type and time
        const price = this.calculatePrice(theater, startTime);

        // ✅ Solo usar IDs para las relaciones, no objetos completos
        showtimes.push({
          start_time: startTime,
          end_time: endTime,
          price,
          sold_tickets: Math.floor(Math.random() * (theater.capacity * 0.3)), // 0-30% sold
          movie: { id: movie.id }, // ✅ Solo ID
          theater: { id: theater.id }, // ✅ Solo ID
        });

        currentSlotIndex++;
      }
    }

    return showtimes;
  }

  private getTimeSlotsForTheater(theaterName: string): number[] {
    if (theaterName.includes('VIP') || theaterName.includes('Premium')) {
      return [14, 17, 20]; // 2PM, 5PM, 8PM
    }

    if (theaterName.includes('IMAX') || theaterName.includes('4DX')) {
      return [12, 15, 18, 21]; // 12PM, 3PM, 6PM, 9PM
    }

    if (theaterName.includes('Family')) {
      return [10, 13, 16, 19]; // 10AM, 1PM, 4PM, 7PM
    }

    // Standard theaters
    return [11, 14, 17, 20, 22]; // 11AM, 2PM, 5PM, 8PM, 10PM
  }

  private selectRandomMovies(movies: Movie[], count: number): Movie[] {
    const shuffled = [...movies].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private calculatePrice(theater: Theater, startTime: Date): number {
    let basePrice = 12.0; // Base price

    // Theater type multiplier
    if (theater.name.includes('IMAX')) {
      basePrice *= 1.8;
    } else if (
      theater.name.includes('VIP') ||
      theater.name.includes('Premium')
    ) {
      basePrice *= 2.5;
    } else if (theater.name.includes('4DX')) {
      basePrice *= 2.0;
    } else if (theater.name.includes('Dolby Atmos')) {
      basePrice *= 1.4;
    }

    // Time-based pricing
    const hour = startTime.getHours();
    if (hour >= 18 && hour <= 22) {
      // Evening shows (6PM-10PM)
      basePrice *= 1.2;
    } else if (hour < 12) {
      // Matinee shows (before noon)
      basePrice *= 0.8;
    }

    // Weekend pricing (if it's Friday, Saturday, or Sunday)
    const day = startTime.getDay();
    if (day === 0 || day === 5 || day === 6) {
      basePrice *= 1.15;
    }

    return Math.round(basePrice * 100) / 100; // Round to 2 decimal places
  }
}

// Main execution
async function main() {
  try {
    await AppDataSource.initialize();
    console.log('📦 Database connection established');

    const seeder = new DatabaseSeeder(AppDataSource);
    await seeder.run();
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seeder
void main();
