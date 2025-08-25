// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🌐 Enable CORS for frontend integration
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*', // Configure for production
    credentials: true,
  });

  // ✅ Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Auto-transform payloads to DTO instances
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert string to numbers, etc.
      },
    }),
  );

  // 📚 Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Cinema Booking System API')
    .setDescription(
      `
      ## 🎬 Cinema Booking System

      A comprehensive RESTful API for managing cinema operations including:
      
      - **🎭 Movies Management**: Complete CRUD operations for movie catalog
      - **🏛️ Theater Administration**: Theater configuration and capacity management  
      - **🎪 Showtime Scheduling**: Smart scheduling with conflict detection
      - **🎫 Ticket Booking**: Anti-overselling ticket purchasing system
      
      ### 🔒 Business Rules Implemented:
      - ⚠️ **Anti-Overselling Protection**: Cannot exceed theater capacity
      - ⚠️ **No Past Showtimes**: Cannot create/book for past dates
      - ⚠️ **Conflict Detection**: No overlapping showtimes in same theater
      - ⚠️ **Atomic Transactions**: Race-condition safe ticket purchases
      
      ### 🚀 Getting Started:
      1. Use the \`/movies\` endpoint to browse available movies
      2. Check \`/theaters\` for available venues
      3. View \`/showtimes\` for scheduled screenings
      4. Purchase tickets via \`/tickets/purchase/{showtimeId}\`
      
      **💡 Tip**: All list endpoints support pagination and filtering parameters.
    `,
    )
    .setVersion('1.0.0')
    .setContact(
      'Cinema Booking API',
      'https://github.com/your-repo/cinema-booking',
      'support@cinema-booking.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('movies', '🎬 Movies - Manage movie catalog and details')
    .addTag('theaters', '🏛️ Theaters - Theater management and configuration')
    .addTag('showtimes', '🎭 Showtimes - Schedule and manage movie screenings')
    .addTag('tickets', '🎫 Tickets - Ticket booking and management')
    .addServer('http://localhost:3000', 'Development Server')
    .addServer(
      'https://api.cinema-booking.com',
      'Production Server (if applicable)',
    )
    .build();

  // 📖 Create Swagger Document
  const document = SwaggerModule.createDocument(app, config);

  // 🎨 Setup Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Cinema Booking API Documentation',
    customfavIcon: '🎬',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #1976d2; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });

  // 🚀 Start Server
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // 📝 Console Logs for Development
  console.log('🎬 Cinema Booking System Started Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Application: http://localhost:${port}`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
  console.log(`🩺 Health Check: http://localhost:${port}/`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Ready to handle cinema booking requests!');
}

bootstrap().catch((error) => {
  console.error('🔥 Failed to start application:', error);
  process.exit(1);
});
