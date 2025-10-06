# ApexSolar Employee Management System - Project Context

## Project Overview
ApexSolar is a comprehensive employee management platform built with modern web technologies, designed to handle employee data, document management, attendance tracking, payment management, and role-based access control.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Google Cloud SQL for production)
- **Authentication**: JWT with Bearer token support
- **File Storage**: Google Cloud Storage (production) / Local file system (development)
- **Deployment**: Google Cloud Run
- **CI/CD**: GitHub Actions

## Architecture & Key Components

### Authentication System
- JWT-based authentication with cookie and Bearer token support
- Role-based access control (ADMIN, ACCOUNTANT, EMPLOYEE)
- Middleware for protected routes (`adminOnly`, `adminOrAccountant`)
- Default users: admin@apexsolar.net / accountant@apexsolar.net

### Database Schema (Prisma)
- **User**: Authentication and role management
- **Employee**: Employee profile and data
- **EmployeeDocument**: Employee-specific documents (Aadhar, medical certificates, etc.)
- **Document**: General company documents with categories and visibility controls
- **Attendance**: Employee attendance tracking
- **Payment**: Employee payment and dues tracking
- **Invoice**: Client invoice management
- **PfEsiChallan**: PF/ESI challan uploads
- **Client**: Client information management
- **ClientPayment**: Client payment tracking

### File Upload System
- **Development**: Local file system (`uploads/` directory)
- **Production**: Google Cloud Storage with public URLs
- **File Types**: PDF, Word, Excel, images (max 10MB)
- **Security**: MIME type validation, size limits, organized folder structure

### API Routes Structure
- `/api/auth/*` - Authentication endpoints
- `/api/employees/*` - Employee CRUD operations
- `/api/documents/*` - Document management (general documents)
- `/api/documents/upload` - Employee document uploads
- `/api/attendance/*` - Attendance management
- `/api/payments/*` - Payment tracking
- `/api/invoices/*` - Invoice management
- `/api/challans/*` - PF/ESI challan management
- `/api/files/*` - File serving

### Dashboard Features
- **Admin Dashboard**: Full access to all features
- **Accountant Dashboard**: Limited access (attendance, challans, documents)
- **Employee Profiles**: Public access via unique slugs with masked sensitive data

### File Organization
```
uploads/
├── employees/{employeeId}/ - Employee-specific documents
├── documents/ - General company documents
├── invoices/ - Invoice PDFs
└── challans/ - PF/ESI challan PDFs
```

### Security Features
- BCrypt password hashing
- JWT token expiration
- Role-based access control
- File type validation
- CORS and security headers
- Protected file serving

### Testing Infrastructure
- Comprehensive test suites (28 tests, 100% pass rate)
- Authentication tests
- API endpoint tests
- File upload tests
- Security validation
- Performance testing

### Production Deployment
- **Live URL**: https://apexsolar-302444603160.asia-south1.run.app
- **Database**: Google Cloud SQL PostgreSQL
- **File Storage**: Google Cloud Storage
- **Environment**: Google Cloud Run with service account authentication
- **CI/CD**: Automated deployment on `main` branch push

### Key Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_CLOUD_PROJECT_ID` - GCP project ID
- `GCS_BUCKET_NAME` - Cloud Storage bucket name
- Production credentials managed through service accounts

## Current Status
The application is fully functional in production with 100% test coverage and operational monitoring.
