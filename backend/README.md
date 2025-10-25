# Beyond Speech Backend API

A comprehensive backend API for the Beyond Speech platform, built with Express.js, TypeScript, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Support for families, providers (SLP, OT, PT), and schools
- **Appointment System**: Scheduling, management, and tracking of therapy sessions
- **Messaging System**: Secure communication between users
- **Payment Processing**: Stripe integration for secure payments
- **Document Management**: File upload and management system
- **Email Notifications**: Automated email notifications for various events
- **Admin Dashboard**: Comprehensive admin panel for platform management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Payments**: Stripe
- **Email**: Nodemailer
- **File Upload**: Multer
- **Validation**: Joi

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or pnpm

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Configure your `.env` file with the following variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/beyond_speech_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="noreply@beyondspeech.com"

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Admin
ADMIN_EMAIL="admin@beyondspeech.com"
ADMIN_PASSWORD="admin123"
```

5. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# (Optional) Seed the database
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token

### User Management

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `PATCH /api/users/:id/status` - Update user status (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Provider Management

- `GET /api/providers` - Get all providers
- `GET /api/providers/:id` - Get provider by ID
- `POST /api/providers` - Create provider profile
- `PUT /api/providers/:id` - Update provider profile
- `GET /api/providers/me/profile` - Get my provider profile
- `PATCH /api/providers/:id/verify` - Verify provider (Admin only)

### Appointment Management

- `GET /api/appointments` - Get appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `PATCH /api/appointments/:id/cancel` - Cancel appointment
- `GET /api/appointments/upcoming/list` - Get upcoming appointments

### Messaging System

- `GET /api/messages/conversation/:userId` - Get conversation messages
- `GET /api/messages/conversations` - Get all conversations
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark message as read
- `DELETE /api/messages/:id` - Delete message

### Payment Processing

- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments/:id/refund` - Refund payment (Admin only)

### Document Management

- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get user documents
- `GET /api/documents/:id` - Get document by ID
- `GET /api/documents/:id/download` - Download document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Admin Panel

- `GET /api/admin/dashboard` - Get dashboard overview
- `GET /api/admin/users` - Get all users
- `GET /api/admin/providers` - Get all providers
- `GET /api/admin/appointments` - Get all appointments
- `GET /api/admin/payments` - Get all payments
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings/:key` - Update system setting

## Database Schema

The database includes the following main entities:

- **Users**: Core user information and authentication
- **Provider Profiles**: Professional information for therapists
- **Family Profiles**: Client information for families
- **School Profiles**: Organization information for schools
- **Appointments**: Therapy session scheduling and management
- **Messages**: Communication between users
- **Payments**: Payment processing and history
- **Documents**: File storage and management
- **Reviews**: Provider ratings and feedback
- **Notifications**: System notifications

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi
- SQL injection protection with Prisma

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### Project Structure

```
src/
├── config/          # Database and app configuration
├── middleware/      # Express middleware
├── routes/          # API route handlers
├── services/        # Business logic services
├── types/           # TypeScript type definitions
└── index.ts         # Application entry point
```

## Deployment

### Environment Variables

Make sure to set the following environment variables in production:

- `NODE_ENV=production`
- `DATABASE_URL` - Production database connection string
- `JWT_SECRET` - Strong secret key for JWT signing
- `STRIPE_SECRET_KEY` - Production Stripe secret key
- `EMAIL_*` - Production email configuration

### Database Migration

Before deploying, run database migrations:

```bash
npm run db:migrate
```

### Production Build

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.



