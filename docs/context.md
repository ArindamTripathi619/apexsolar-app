# ApexSolar App - Project Context

## Project Overview
ApexSolar App is a comprehensive Next.js 15 full-stack application designed for managing solar energy business operations. The application serves as a complete business management system for Apex Solar company.

## Architecture
- **Framework**: Next.js 15 with React 19
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Cloud-based with Docker support
- **Authentication**: Custom session-based authentication
- **File Storage**: Cloud storage for document uploads

## Core Features

### User Management
- Role-based access control (ADMIN, ACCOUNTANT)
- Secure authentication with session management
- User profiles and permissions

### Employee Management
- Employee registration with unique slugs
- Profile photo uploads
- Document management (Aadhar, PAN, Bank details, etc.)
- Attendance tracking by month/year
- Payment management (salary advances, payments, clearances)

### Client Management
- Client/company registration with GST/PAN details
- Complete address management
- Contact person information
- Payment tracking for clients
- Invoice management

### Invoice System
- PDF invoice upload and management
- Client-invoice association
- Invoice filtering by client name, date range
- Invoice viewing, downloading, and deletion
- Bulk operations support
- **Professional invoice generation with jsPDF integration**
- **Real-time invoice creation with automatic PDF generation**
- **GST-compliant invoices with tax calculations**
- **Company branding and letterhead integration**

### Invoice Generation System (NEW)
- Complete invoice generation workflow
- Auto-generated invoice numbers (AS/25-26/XXX format)
- Financial year calculations (April-March cycle)
- Customer selection and automatic client creation
- Dynamic line items with real-time calculations
- GST calculations (CGST/SGST) with configurable percentages
- Indian number formatting and amount in words
- Professional PDF generation with company letterhead
- Work order reference integration
- Company settings for bank details and branding
- Automatic PDF storage and client synchronization

### Financial Tracking
- Employee payment tracking with types (ADVANCE, SALARY, CLEARING)
- Client payment management
- Due amount calculations
- Payment history and reports

### Document Management
- PF/ESI challan uploads
- Employee document storage
- Invoice PDF storage
- Organized file management system

### Attendance Management
- Monthly attendance tracking
- Employee-wise attendance records
- Attendance history

## Database Schema (Prisma)

### Core Models
- **User**: Admin and accountant users
- **Employee**: Worker profiles and information
- **Client**: Customer/company information
- **Invoice**: PDF invoices with client association (extended with generation fields)
- **InvoiceLineItem**: Individual line items for generated invoices
- **Payment**: Employee payments (advances, salaries, clearances)
- **ClientPayment**: Payments received from clients
- **Attendance**: Monthly attendance records
- **EmployeeDocument**: Employee document storage
- **PfEsiChallan**: PF/ESI challan documents
- **CompanySettings**: Bank details, GST number, and company branding

### Key Relationships
- Employee → Payments (one-to-many)
- Employee → Attendance (one-to-many)
- Employee → Documents (one-to-many)
- Client → Invoices (one-to-many)
- Client → ClientPayments (one-to-many)
- Payment clearing relationships (self-referencing)

## Recent Enhancements

### Indian Localization (Completed)
- **Date Format**: DD/MM/YYYY format throughout the application
- **Currency**: ₹ (Indian Rupee) symbol in all financial displays
- **Custom Components**: IndianDateInput for proper date input handling
- **Utilities**: indianLocalization.ts for consistent formatting

### UI Improvements
- Modern, responsive design using Tailwind CSS
- Mobile-responsive layouts
- Professional dashboard interfaces
- Consistent component styling

## Current State
- ✅ Fully functional employee management system
- ✅ Complete client and invoice management
- ✅ Indian localization implementation
- ✅ Secure authentication and role management
- ✅ File upload and storage system
- ✅ Attendance and payment tracking
- ✅ Dashboard with statistics and overview
- ✅ **Professional invoice generation system integrated**
- ✅ **GST-compliant PDF invoice creation**
- ✅ **Automated client and financial data synchronization**
- ✅ **Company branding and settings management**

### Invoice Generator Integration (COMPLETED)
- ✅ **Complete Integration**: Successfully integrated standalone invoice generator into main app
- ✅ **Database Schema**: Extended with InvoiceLineItem and CompanySettings models
- ✅ **API Endpoints**: Created comprehensive invoice generation and company settings APIs
- ✅ **PDF Generation**: Professional jsPDF-based invoice creation with company branding
- ✅ **User Interface**: Complete invoice generation form with real-time calculations
- ✅ **Data Synchronization**: Automatic client creation and invoice data sync
- ✅ **Navigation Integration**: Added to admin dashboard with dedicated pages
- ✅ **File Management**: Automated PDF storage and serving system
- ✅ **Indian Compliance**: GST-compliant invoices with proper formatting
- ✅ **Production Ready**: Full workflow from invoice generation to PDF storage

## Technical Implementation
- TypeScript for type safety
- Server-side rendering with Next.js
- API routes for backend functionality
- Prisma for database operations
- Cloud storage integration
- Docker containerization support
- Comprehensive error handling
- Input validation and sanitization

## User Roles
- **ADMIN**: Full access to all features
- **ACCOUNTANT**: Limited access to financial operations

The application is production-ready and handles all core business operations for Apex Solar company.
