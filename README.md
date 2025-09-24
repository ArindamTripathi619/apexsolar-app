# ApexSolar Employee Management System

A secure, scalable, and responsive full-stack web application designed for ApexSolar. It provides a centralized system for managing employees, storing sensitive documents, tracking dues/payments, uploading invoices, maintaining attendance, and offering two different login dashboards (Admin & Accountant).

## 🌐 Domain Architecture (Future)

- **`https://apexsolar.net`** → Public homepage (Business portfolio)
- **`https://admin.apexsolar.net`** → Admin Portal
- **`https://employee.apexsolar.net/{employee-id}`** → Public employee profiles  
- **`https://attendance.apexsolar.net`** → PF/ESI accountant portal

## ✨ Features

### Admin Dashboard
- Employee management (add, edit, delete profiles)
- Document uploads (Aadhar, medical certificates, PF/ESI details)
- Payment tracking (dues and advances)
- Attendance management
- Invoice management
- PF/ESI challan viewer

### Accountant Dashboard
- Read-only attendance view
- PF/ESI challan uploads
- Monthly attendance reports

### Public Employee Profiles
- Secure access via unique slugs
- Partially masked sensitive data
- Document downloads
- Attendance summaries

## 🔧 Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with HTTP-only cookies
- **File Uploads**: Local storage (can be extended to AWS S3)
- **Security**: BCrypt password hashing, role-based access control

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd apexsolar-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database URL and other settings.

4. **Set up the database**:
   ```bash
   npm run setup
   ```
   This will push the schema to your database and seed initial users.

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - Main site: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin
   - Accountant dashboard: http://localhost:3000/attendance
   - Employee profile: http://localhost:3000/employee/demo

## 👥 Default Users

After running the seed script, you'll have:

- **Admin**: `admin@apexsolar.net` / `admin123`
- **Accountant**: `accountant@apexsolar.net` / `accountant123`

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database
npm run setup        # Quick setup (push + seed)
```

## 🔐 Security Features

- **Authentication**: JWT tokens with HTTP-only cookies
- **Password Security**: BCrypt hashing with salt rounds
- **Role-based Access**: Admin and Accountant roles
- **File Upload Security**: MIME type validation, size limits
- **Database Security**: Prepared statements via Prisma
- **Input Validation**: Zod schema validation

## 📁 Project Structure

```
apexsolar-app/
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── attendance/      # Accountant dashboard pages  
│   ├── employee/        # Public employee profiles
│   ├── api/            # API routes
│   ├── lib/            # Utilities and configurations
│   ├── components/     # Reusable React components
│   └── types/          # TypeScript type definitions
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Database seeding script
├── uploads/            # File upload directory
└── public/             # Static assets
```

## 🎯 Production Deployment Status

✅ **COMPLETED:**
1. **Core Functionality**: Login, Employee Management, Attendance Tracking
2. **Database Schema**: Complete PostgreSQL schema with migrations
3. **Authentication**: JWT-based auth with role-based access control
4. **Admin Dashboard**: Full employee management interface
5. **Accountant Portal**: Attendance viewing and PF/ESI upload interface
6. **Public Profiles**: Secure employee profile pages
7. **Docker Setup**: Production Docker configuration
8. **Security**: Input validation, file upload security, HTTPS headers

🔄 **READY FOR PRODUCTION WITH:**
- Docker Compose deployment
- PostgreSQL database
- File upload functionality
- User authentication
- Role-based dashboards

📋 **REMAINING (Optional Enhancements):**
1. **Domain Setup**: Purchase `apexsolar.net` and configure subdomains
2. **Cloud Database**: Migrate to managed PostgreSQL (RDS, Supabase, etc.)
3. **File Storage**: Integrate AWS S3 for document storage
4. **SSL/HTTPS**: Configure SSL certificates for custom domain
5. **Monitoring**: Add logging and uptime monitoring
6. **Additional Features**: Document upload UI, Payment management UI

## 🤝 Contributing

Feel free to open issues or submit pull requests for improvements and bug fixes.

## 📄 License

This project is private and proprietary to ApexSolar.
