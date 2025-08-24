import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewMigration1755967440871 implements MigrationInterface {
  name = 'NewMigration1755967440871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "movies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "duration" integer NOT NULL, "genre" character varying NOT NULL, "release_date" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "theaters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "capacity" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_71b4d67f34a311f6855945fc21c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "showtimes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP NOT NULL, "price" numeric(10,2) NOT NULL, "sold_tickets" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "movie_id" uuid, "theater_id" uuid, CONSTRAINT "PK_2d979092e692ec1a7b505893ee2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_status_enum" AS ENUM('reserved', 'purchased', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customer_name" character varying NOT NULL, "customer_email" character varying NOT NULL, "seat_number" character varying NOT NULL, "status" "public"."tickets_status_enum" NOT NULL DEFAULT 'purchased', "price" numeric(10,2) NOT NULL, "showtime_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "showtimes" ADD CONSTRAINT "FK_cbe689b0c116fbc866d8ea21759" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "showtimes" ADD CONSTRAINT "FK_442e7b97bf05cb6e1a3fd3746d4" FOREIGN KEY ("theater_id") REFERENCES "theaters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_cc00614628df6890e74ac420486" FOREIGN KEY ("showtime_id") REFERENCES "showtimes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_cc00614628df6890e74ac420486"`,
    );
    await queryRunner.query(
      `ALTER TABLE "showtimes" DROP CONSTRAINT "FK_442e7b97bf05cb6e1a3fd3746d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "showtimes" DROP CONSTRAINT "FK_cbe689b0c116fbc866d8ea21759"`,
    );
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_status_enum"`);
    await queryRunner.query(`DROP TABLE "showtimes"`);
    await queryRunner.query(`DROP TABLE "theaters"`);
    await queryRunner.query(`DROP TABLE "movies"`);
  }
}
