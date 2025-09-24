## Objective
Create a secure, scalable, and responsive full-stack web application for **ApexSolar**, a business requiring a centralized system for managing employees, storing sensitive documents, tracking dues/payments, uploading invoices, maintaining attendance, and enabling two different login dashboards (Admin & Accountant). This prompt will help an AI website builder implement the entire system with maximum clarity and security in mind.

---

## 🌐 Project Domain Architecture

- **`https://apexsolar.net`** → Public homepage (Business portfolio)
- **`https://admin.apexsolar.net`** → Admin Portal for the business owner (Login protected)
- **`https://employee.apexsolar.net/{employee-id}`** → Public read-only employee profiles (client-accessible)
- **`https://attendance.apexsolar.net`** → PF/ESI accountant portal (login protected, different credentials)

---

## 🧰 Recommended Tech Stack

### Frontend:
- ReactJS (with Vite for fast dev/build)
- TailwindCSS for responsive styling
- ShadCN/UI or Radix UI for components
- React Hook Form + Zod for forms/validation

### Backend:
- Node.js + Express.js or Next.js API Routes
- PostgreSQL for relational data
- Prisma ORM for database access
- JWT for session management
- Bcrypt for secure password hashing

### File Storage:
- AWS S3 (preferred) or Local Disk with Multer
- Ensure file type/size validation (JPEG, PNG, PDF; max 5MB)

### Hosting & DevOps:
- Vercel or Render (alternatively self-hosted VM on GCP/AWS with Docker + Nginx)
- Nginx reverse proxy for subdomain routing
- SSL with Let’s Encrypt via Certbot
- CI/CD pipeline with GitHub

---

## 🔐 Security Guidelines

- Enforce HTTPS on all subdomains
- Implement strong password policies and bcrypt hashing
- JWT access & refresh tokens for session management
- Role-based access control: Admin vs Accountant
- Secure file uploads with MIME type checks
- Public pages use hashed/UUID slugs to prevent ID guessing
- Limit repeated login attempts (rate limiting)
- Audit logs for logins and document uploads (optional)

---

## 👤 Admin Dashboard (`admin.apexsolar.net`)

### Authentication:
- Login page for Admin only
- Password reset with token (via email or OTP optional)
- Show last login time and IP

### Employee Management:
- Add, edit, delete employee profiles
- Upload required documents:
  - Profile photo
  - Aadhar card (PDF/Image)
  - Medical certificate (PDF/Image)
  - PF and ESI details (PDF/Image)
- Each profile generates a public link: `employee.apexsolar.net/{id}`
- Mask sensitive data (e.g. Aadhar)

### Payments Module:
- Add due and advance entries
- Track all transactions with timestamps
- Editable records
- Monthly summaries for each employee

### Attendance Tracking:
- Enter number of working days per employee, per month
- Edit attendance for previous months
- Table format with filters by month/year

### Invoice Management:
- Upload business invoices (PDF)
- Add meta-info: date, client name, amount
- Search and filter by client/date
- View/download invoices

### PF/ESI Challan Viewer:
- View challans uploaded by accountant (monthly grouped)
- Filterable table
- Downloadable PDF files

---

## 👨‍💼 Accountant Dashboard (`attendance.apexsolar.net`)

### Authentication:
- Separate login/password credentials from Admin
- Access limited to viewing attendance and uploading PF/ESI challans

### Attendance View:
- Read-only attendance table
- Monthly views of days worked by employees
- Filters by month and year

### PF/ESI Uploads:
- Upload monthly PF and ESI challans
- List of all previous uploads
- Ability to download uploaded files

---

## 📄 Public Employee Profile (`employee.apexsolar.net/{employee-id}`)

- Read-only page accessible via unique, unguessable slug
- Displays:
  - Employee photo
  - Partially masked Aadhar number
  - Medical certificate (thumbnail/download)
  - PF/ESI details
  - Monthly attendance summary
  - Advance & due overview

---

## 🧩 Database Structure

### Tables:
- `users`: id, email, hashed_password, role (admin/accountant)
- `employees`: id, name, phone, unique_slug, address, doj, etc.
- `employee_documents`: id, employee_id, type, file_url, upload_date
- `payments`: id, employee_id, type (due/advance), amount, date
- `attendance`: id, employee_id, month, year, days_worked
- `invoices`: id, client_name, amount, invoice_file, date
- `pf_esi_challans`: id, month, year, file_url, uploaded_by

---

## 🎨 UI/UX Guidelines

- Minimalist and intuitive dashboard layout
- Mobile-first responsive design
- Use cards, tables, filters, and modals
- Include notifications for uploads/errors
- Smooth page transitions and loader spinners

---

## 📦 Deployment Plan

### (Not Now, Later)

- Set up domain with Cloudflare (optional for DNS)
- Route subdomains using Nginx reverse proxy
- SSL with Certbot + cron renewal
- PostgreSQL setup with daily backups
- CI/CD using GitHub + Vercel or Docker + SSH for production pushes
- Logging and monitoring (e.g. PM2 logs, UptimeRobot)

---

> Please use this prompt as a full implementation plan for building the ApexSolar Admin Web Application using best practices in security, modularity, and modern full-stack development.
> I have still not bought the domain but i want to develop the site first. I will soon buy the domain.

