# Development Setup Guide

This guide will help you set up the ApexSolar application for local development.

## Prerequisites

- Node.js 18+
- PostgreSQL (local or cloud instance)
- npm or yarn

## Database Setup

### Option 1: Local PostgreSQL

1. **Install PostgreSQL locally**:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # macOS (using Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create database and user**:
   ```bash
   sudo -u postgres psql
   ```
   
   In PostgreSQL shell:
   ```sql
   CREATE DATABASE apexsolar;
   CREATE USER apexsolar_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE apexsolar TO apexsolar_user;
   \q
   ```

3. **Update .env file**:
   ```
   DATABASE_URL="postgresql://apexsolar_user:your_password@localhost:5432/apexsolar"
   ```

### Option 2: Cloud Database (Recommended for Production)

Use services like:
- **Supabase** (Free tier available)
- **Railway** (PostgreSQL hosting)
- **Neon** (Serverless PostgreSQL)
- **AWS RDS**
- **Google Cloud SQL**

## Quick Setup

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd apexsolar-app
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and other settings
   ```

3. **Setup database**:
   ```bash
   npm run setup
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## Environment Variables Explained

```env
# Database connection string
DATABASE_URL="postgresql://username:password@localhost:5432/apexsolar"

# JWT secret for token signing (use a strong random string)
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# NextAuth configuration (optional, for future OAuth integration)
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# File upload configuration
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880  # 5MB in bytes

# Initial admin credentials
ADMIN_EMAIL="admin@apexsolar.net"
ADMIN_PASSWORD="admin123"

# Application environment
NODE_ENV="development"
```

## Available Development Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database (for development)
npm run db:migrate      # Create and run migrations (for production)
npm run db:seed         # Seed database with initial data
npm run db:studio       # Open Prisma Studio (database GUI)
npm run db:reset        # Reset database (destructive!)
npm run setup           # Quick setup (push + seed)

# Code quality
npm run lint            # Run ESLint
```

## Project Structure

```
apexsolar-app/
├── app/
│   ├── admin/                    # Admin dashboard pages
│   ├── attendance/               # Accountant dashboard pages
│   ├── employee/[id]/           # Public employee profiles
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication endpoints
│   │   ├── employees/           # Employee management
│   │   └── files/               # File serving
│   ├── lib/                     # Utilities and configurations
│   │   ├── auth.ts              # Authentication utilities
│   │   ├── prisma.ts            # Database connection
│   │   ├── upload.ts            # File upload utilities
│   │   └── middleware.ts        # Auth middleware
│   ├── components/              # Reusable React components
│   └── types/                   # TypeScript definitions
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seeding
├── uploads/                    # File upload directory
└── public/                     # Static assets
```

## Database Schema

The application uses the following main entities:

- **Users**: Admin and Accountant roles
- **Employees**: Employee profiles with unique slugs
- **EmployeeDocuments**: File attachments (Aadhar, certificates, etc.)
- **Payments**: Dues and advances tracking
- **Attendance**: Monthly attendance records
- **Invoices**: Business invoices
- **PfEsiChallans**: PF/ESI challan uploads

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Employees (Admin only)
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Files (Authenticated)
- `GET /api/files/[...path]` - Serve uploaded files

## Security Considerations

1. **JWT Tokens**: Stored in HTTP-only cookies for security
2. **Password Hashing**: BCrypt with salt rounds
3. **File Uploads**: MIME type validation and size limits
4. **Database**: Parameterized queries via Prisma
5. **CORS**: Configured for same-origin requests
6. **Rate Limiting**: Should be implemented for production

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npm run db:generate
```

### File Upload Issues
```bash
# Check uploads directory permissions
ls -la uploads/
chmod 755 uploads/
```

### Prisma Issues
```bash
# Reset Prisma client
npm run db:generate
```

### Port Already in Use
```bash
# Kill process on port 3000
sudo lsof -t -i tcp:3000 | xargs kill -9
```

## Production Deployment

For production deployment, consider:

1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Use managed PostgreSQL service
3. **File Storage**: Migrate to AWS S3 or similar
4. **SSL**: Configure HTTPS certificates
5. **Domain**: Set up subdomains as per architecture
6. **Monitoring**: Add logging and uptime monitoring
7. **Backup**: Implement database backup strategy
