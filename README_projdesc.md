# Appointment Booking System

A comprehensive web-based appointment scheduling system designed for government agencies, featuring role-based access control, real-time availability management, and automated notifications.

## Development Framework

This project follows a **spec-driven development methodology** with comprehensive requirements analysis, formal design documentation, and property-based testing to ensure system correctness and reliability.

### Development Approach
- **Requirements-First**: All features are traced back to documented requirements
- **Property-Based Testing**: Universal correctness properties validated across all inputs
- **Incremental Development**: Bottom-up implementation from database to frontend
- **Continuous Integration**: Automated testing and validation at each development stage

## Project Architecture

The system implements a modern **three-tier architecture** with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Layer  │    │ Application     │    │   Data Layer    │
│                 │    │     Layer       │    │                 │
│ • React Frontend│◄──►│ • Express API   │◄──►│ • PostgreSQL    │
│ • shadcn/ui     │    │ • Auth Service  │    │ • Email Service │
│ • Tailwind CSS  │    │ • RBAC System   │    │ • Audit Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components
- **Authentication Service**: JWT-based session management with secure password handling
- **RBAC Controller**: Role-based access control for Admin, Staff, Manager, and Client roles
- **Calendar Service**: Real-time availability management with double-booking prevention
- **Notification Service**: Automated email notifications for all appointment activities
- **Audit Logger**: Comprehensive activity logging for compliance and troubleshooting

## Tech Stack

### Frontend
- **React 17** with TypeScript for type safety and stability
- **shadcn/ui** for modern, accessible component library
- **Tailwind CSS** for utility-first styling
- **React Router** for client-side routing
- **Axios** for API communication
- **React Hook Form** for form validation

### Backend
- **Node.js** with Express.js framework
- **TypeScript** for type safety and better development experience
- **JWT** for secure session management
- **bcrypt** for password hashing
- **Joi** for request validation
- **node-cron** for scheduled tasks

### Database & Infrastructure
- **PostgreSQL 14+** for relational data storage
- **Knex.js** for database migrations and query building
- **Winston** for structured logging
- **SendGrid** (or similar) for email delivery
- **Environment-based configuration** for different deployment stages

## Developer Requirements

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **PostgreSQL** 14+ installed and running
- **Git** for version control
- **Code Editor** with TypeScript support (VS Code recommended)

### Development Environment Setup

#### Prerequisites Installation
```bash
# Install Node.js 18+ (using nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install PostgreSQL (Windows)
# Download from: https://www.postgresql.org/download/windows/
# Or use chocolatey: choco install postgresql

# Verify installations
node --version  # Should be 18+
npm --version   # Should be 8+
psql --version  # Should be 14+
```

#### Project Setup
```bash
# 1. Clone the repository
git clone <repository-url>
cd appointment-booking-system

# 2. Set up PostgreSQL database
# Create database user and database
psql -U postgres
CREATE USER appointment_user WITH PASSWORD 'your_password';
CREATE DATABASE appointment_booking OWNER appointment_user;
GRANT ALL PRIVILEGES ON DATABASE appointment_booking TO appointment_user;
\q

# 3. Backend setup
cd backend
npm install

# Copy and configure environment variables
copy .env.example .env
# Edit .env file with your database credentials and other settings

# Run database migrations
npm run migrate

# Optional: Seed database with sample data
npm run seed

# 4. Frontend setup
cd ../frontend
npm install

# Initialize shadcn/ui components
npx shadcn-ui@latest init
# Follow prompts to configure Tailwind CSS and component library

# 5. Start development servers
# Terminal 1 - Backend (runs on port 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (runs on port 3000)
cd frontend
npm start
```

#### Quick Start Commands
```bash
# After initial setup, use these commands to start development:

# Start both servers concurrently (from root directory)
npm run dev

# Or start individually:
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only

# Run tests
npm run test:all      # All tests
npm run test:backend  # Backend tests only
npm run test:frontend # Frontend tests only

# Database operations
npm run migrate       # Run migrations
npm run migrate:rollback  # Rollback last migration
npm run seed         # Seed database
npm run db:reset     # Reset database (migrate + seed)
```

### Development Scripts
```bash
# Root directory scripts
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start backend only (port 3001)
npm run dev:frontend     # Start frontend only (port 3000)
npm run test:all         # Run all tests
npm run build:all        # Build both projects for production
npm run lint:all         # Lint all code

# Backend specific (run from /backend)
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run test             # Run unit tests
npm run test:pbt         # Run property-based tests
npm run test:integration # Run integration tests
npm run migrate          # Run database migrations
npm run migrate:rollback # Rollback last migration
npm run seed             # Seed database with sample data
npm run db:reset         # Reset database (migrate + seed)
npm run lint             # Code linting
npm run format           # Code formatting

# Frontend specific (run from /frontend)
npm start                # Start development server (port 3000)
npm run build            # Build for production
npm run test             # Run component tests
npm run test:coverage    # Run tests with coverage report
npm run lint             # Code linting
npm run format           # Code formatting
npm run storybook        # Start Storybook for component development
```

## Best Practices

### Code Quality
- **TypeScript Strict Mode**: All code must pass strict TypeScript compilation
- **ESLint Configuration**: Follow established linting rules for consistency
- **Prettier Formatting**: Automated code formatting on save
- **Git Hooks**: Pre-commit hooks for linting and testing

### Frontend Development with shadcn/ui
- **Component Library**: Use shadcn/ui components for consistent, accessible UI
- **Styling**: Tailwind CSS utility classes for custom styling
- **Component Structure**: Follow shadcn/ui patterns for component composition
- **Theming**: Use CSS variables for consistent color schemes and spacing

```bash
# Adding new shadcn/ui components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog

# Example component usage
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
```

### Testing Strategy
- **Unit Tests**: Test individual functions and components
- **Property-Based Tests**: Validate universal system properties
- **Integration Tests**: Test API endpoints and database interactions
- **End-to-End Tests**: Validate complete user workflows

### Frontend Development with shadcn/ui
- **Component Library**: Use shadcn/ui components for consistent, accessible UI
- **Styling**: Tailwind CSS utility classes for custom styling
- **Component Structure**: Follow shadcn/ui patterns for component composition
- **Theming**: Use CSS variables for consistent color schemes and spacing

```bash
# Adding new shadcn/ui components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog

# Example component usage
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
```
- **Migration-Based Schema**: All database changes through versioned migrations
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Proper indexing and query performance monitoring
- **Data Validation**: Server-side validation for all database operations

### API Design
- **RESTful Endpoints**: Consistent REST API design patterns
- **Request Validation**: Comprehensive input validation using Joi
- **Error Handling**: Standardized error responses with proper HTTP status codes
- **Rate Limiting**: Protection against abuse and DoS attacks

## Security

### Environment Configuration
Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/appointment_booking
DB_HOST=localhost
DB_PORT=5432
DB_NAME=appointment_booking
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-token-secret

# Email Service Configuration
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@youragency.gov.ph
EMAIL_FROM_NAME=Government Appointment System

# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=1800000
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900000

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_APP_NAME=Government Appointment System
REACT_APP_ENVIRONMENT=development

# Optional: Analytics and monitoring
REACT_APP_ANALYTICS_ID=your-analytics-id
```

### Security Best Practices

#### Authentication & Authorization
- **Password Requirements**: Minimum 8 characters with mixed case and numbers
- **JWT Tokens**: Short-lived access tokens with refresh token rotation
- **Session Management**: Automatic logout after inactivity
- **Role-Based Access**: Strict permission checking on all endpoints

#### API Security
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: Content Security Policy headers
- **CORS Configuration**: Restricted to allowed origins only

#### Data Protection
- **Password Hashing**: bcrypt with high salt rounds
- **Sensitive Data**: Never log passwords or tokens
- **Database Encryption**: Encrypt sensitive fields at rest
- **Audit Logging**: All user actions logged for compliance

#### Infrastructure Security
```javascript
// Example security middleware configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

app.use(rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW,
  max: process.env.RATE_LIMIT_MAX_REQUESTS
}));
```

## Repository Structure

```
appointment-booking-system/
├── README.md
├── .gitignore
├── .env.example
│
├── backend/                          # Node.js/Express API
│   ├── src/
│   │   ├── controllers/              # API route handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── appointments.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   └── services.controller.ts
│   │   ├── services/                 # Business logic layer
│   │   │   ├── auth.service.ts
│   │   │   ├── calendar.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── audit.service.ts
│   │   │   └── rbac.service.ts
│   │   ├── models/                   # Data models and types
│   │   │   ├── user.model.ts
│   │   │   ├── appointment.model.ts
│   │   │   └── service.model.ts
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── routes/                   # API route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── appointments.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   └── services.routes.ts
│   │   ├── database/                 # Database configuration
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── utils/                    # Utility functions
│   │   │   ├── logger.ts
│   │   │   ├── validators.ts
│   │   │   └── helpers.ts
│   │   └── app.ts                    # Express app configuration
│   ├── tests/                        # Backend tests
│   │   ├── unit/                     # Unit tests
│   │   ├── integration/              # Integration tests
│   │   └── property/                 # Property-based tests
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/                         # React application
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   └── table.tsx
│   │   │   ├── common/               # Shared components
│   │   │   ├── auth/                 # Authentication components
│   │   │   ├── appointments/         # Appointment-related components
│   │   │   └── admin/                # Admin interface components
│   │   ├── pages/                    # Page-level components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── BookingPage.tsx
│   │   │   └── AdminPage.tsx
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useAppointments.ts
│   │   │   └── useApi.ts
│   │   ├── services/                 # API service layer
│   │   │   ├── api.service.ts
│   │   │   ├── auth.service.ts
│   │   │   └── appointments.service.ts
│   │   ├── contexts/                 # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── types/                    # TypeScript type definitions
│   │   │   ├── auth.types.ts
│   │   │   ├── appointment.types.ts
│   │   │   └── api.types.ts
│   │   ├── utils/                    # Utility functions
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   ├── styles/                   # Global styles and themes
│   │   │   ├── globals.css
│   │   │   └── components.css
│   │   ├── lib/                      # shadcn/ui utilities
│   │   │   └── utils.ts
│   │   ├── App.tsx                   # Main App component
│   │   └── index.tsx                 # Application entry point
│   ├── tests/                        # Frontend tests
│   │   ├── components/               # Component tests
│   │   ├── pages/                    # Page tests
│   │   └── utils/                    # Utility tests
│   ├── components.json               # shadcn/ui configuration
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── database/                         # Database-related files
│   ├── migrations/                   # Database migration files
│   ├── seeds/                        # Database seed files
│   └── schema.sql                    # Complete database schema
│
├── docs/                            # Project documentation
│   ├── api/                         # API documentation
│   ├── deployment/                  # Deployment guides
│   └── user-guides/                 # User manuals
│
└── .kiro/                           # Kiro spec files
    └── specs/
        └── appointment-booking-system/
            ├── requirements.md       # System requirements
            ├── design.md            # Technical design
            └── tasks.md             # Implementation tasks
```

## Getting Started

### First Time Setup (Complete Guide)

1. **Install Prerequisites**
   ```bash
   # Install Node.js 18+ (recommended via nvm)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18 && nvm use 18
   
   # Install PostgreSQL 14+
   # Windows: Download from https://www.postgresql.org/download/windows/
   # macOS: brew install postgresql
   # Linux: sudo apt-get install postgresql postgresql-contrib
   ```

2. **Clone and Setup Project**
   ```bash
   git clone <repository-url>
   cd appointment-booking-system
   
   # Install root dependencies (for concurrent scripts)
   npm install
   ```

3. **Database Setup**
   ```bash
   # Start PostgreSQL service
   # Windows: Start via Services or pgAdmin
   # macOS/Linux: brew services start postgresql OR sudo service postgresql start
   
   # Create database and user
   psql -U postgres
   CREATE USER appointment_user WITH PASSWORD 'secure_password_123';
   CREATE DATABASE appointment_booking OWNER appointment_user;
   GRANT ALL PRIVILEGES ON DATABASE appointment_booking TO appointment_user;
   \q
   ```

4. **Backend Configuration**
   ```bash
   cd backend
   npm install
   
   # Copy and edit environment file
   copy .env.example .env  # Windows
   # cp .env.example .env  # macOS/Linux
   
   # Edit .env with your database credentials
   # Update DATABASE_URL, JWT_SECRET, EMAIL_API_KEY, etc.
   
   # Run database migrations
   npm run migrate
   
   # Optional: Add sample data
   npm run seed
   ```

5. **Frontend Configuration**
   ```bash
   cd ../frontend
   npm install
   
   # Initialize shadcn/ui (follow prompts)
   npx shadcn-ui@latest init
   # Choose: TypeScript, Tailwind CSS, src/components/ui, CSS variables
   
   # Add essential components
   npx shadcn-ui@latest add button input form table dialog card
   
   # Copy environment file
   copy .env.example .env  # Windows
   # Edit with your API URL (usually http://localhost:3001/api)
   ```

6. **Start Development**
   ```bash
   # From root directory - starts both servers
   npm run dev
   
   # Or start individually:
   # Terminal 1: npm run dev:backend
   # Terminal 2: npm run dev:frontend
   
   # Access the application:
   # Frontend: http://localhost:3000
   # Backend API: http://localhost:3001/api
   ```

### Daily Development Workflow

```bash
# Start development (from root directory)
npm run dev

# Run tests before committing
npm run test:all

# Check code quality
npm run lint:all

# Database operations (from backend directory)
cd backend
npm run migrate        # Apply new migrations
npm run seed          # Add sample data
npm run db:reset      # Reset database completely
```

### Troubleshooting Common Issues

**Database Connection Issues:**
```bash
# Check if PostgreSQL is running
# Windows: Check Services for "postgresql"
# macOS: brew services list | grep postgresql
# Linux: sudo service postgresql status

# Test database connection
psql -U appointment_user -d appointment_booking -h localhost
```

**Port Already in Use:**
```bash
# Find and kill process using port 3000 or 3001
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -ti:3000 | xargs kill
```

**shadcn/ui Component Issues:**
```bash
# Reinstall shadcn/ui components
npx shadcn-ui@latest add button --overwrite
```

## Contributing

1. Follow the established coding standards and best practices
2. Write tests for all new functionality
3. Update documentation for any API or architectural changes
4. Ensure all security requirements are met
5. Submit pull requests with clear descriptions and test coverage

## License

This project is developed for government use and follows applicable government software licensing requirements.
