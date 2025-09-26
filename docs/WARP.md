# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository overview
- Framework: Next.js 15 (App Router) with TypeScript and TailwindCSS 4
- Server/API: Next.js route handlers under app/api
- ORM/DB: Prisma (PostgreSQL)
- Auth: Custom JWT (HTTP-only cookie: auth-token) with role-based access (ADMIN, ACCOUNTANT)
- File uploads: Local filesystem under /uploads, served via a protected API route
- Packaging/Infra: Docker multi-stage build, docker-compose for local/prod, GitHub Actions CI/CD

Core commands
- Install
  - npm ci  # clean install when package-lock.json is present
  - npm install  # typical local dev install
- Dev server
  - npm run dev  # http://localhost:3000
- Lint
  - npm run lint
- Build / run
  - npm run build
  - npm run start  # production server, requires env vars set
- Database (Prisma)
  - npm run db:generate  # generate Prisma client
  - npm run db:push      # apply schema to DB (non-destructive)
  - npm run db:migrate   # create/apply dev migrations
  - npm run db:seed      # run prisma/seed.ts
  - npm run db:studio    # open Prisma Studio
  - npm run db:reset     # reset DB (dev)
  - npm run setup        # db:push + db:seed
- Docker (local)
  - docker-compose up -d  # starts Postgres and the app (PORT 3000)

Notes on tests
- There is no test runner configured in package.json and no tests in the repo. Lint and build are used in CI for validation.

Environment configuration
- Required at runtime/build for app and CI/CD:
  - DATABASE_URL: e.g. postgresql://<user>:<pass>@<host>:5432/<db>
  - JWT_SECRET: secret for JWT signing (auth-token)
  - NEXTAUTH_SECRET, NEXTAUTH_URL: present in CI/Docker env; the code uses custom JWT-based auth, not NextAuth.
- Optional:
  - UPLOAD_DIR (default: uploads)
  - MAX_FILE_SIZE (bytes; default: 5242880)
  - JWT_EXPIRES_IN (e.g. 7d)
  - ADMIN_EMAIL, ADMIN_PASSWORD (override defaults in prisma/seed.ts)

Development workflow
1) Set env and DB
- Create a PostgreSQL DB and set DATABASE_URL.
- Initialize schema and seed users:
  - npm run setup
2) Run dev server
- npm run dev
- Admin dashboard: http://localhost:3000/admin (redirects to /admin/login)
- Accountant portal: http://localhost:3000/attendance
- Example employee page: /employee/demo (see README)
3) Lint/build before commits
- npm run lint
- npm run build

High-level architecture
- App Router structure (app/)
  - app/admin, app/attendance, app/employee: UI for roles and public profiles.
  - app/components: Reusable client components (e.g., modals) that call API routes with fetch.
  - app/lib: Cross-cutting concerns
    - auth.ts: password hashing, JWT sign/verify, authenticateUser(email, password, ip?)
    - middleware.ts: withAuth wrapper injects user into request; role guards: adminOnly, accountantOnly, adminOrAccountant
    - prisma.ts: singleton PrismaClient
    - upload.ts: local filesystem writes, validation of MIME/size, path safety
  - app/api: REST-like route handlers returning { success, data | error }
    - Auth: /api/auth/login (sets HTTP-only cookie), /api/auth/logout, /api/auth/me
    - Domain endpoints: employees, attendance, payments, invoices, documents/upload, challans, dashboard/stats, files, health
- AuthN/Z flow
  - Login: app/api/auth/login verifies creds via prisma, sets auth-token cookie with JWT. JWT payload: { id, email, role }.
  - Authorization: Two patterns exist in handlers
    1) Direct guard with adminOnly / adminOrAccountant wrappers (preferred for server-side handlers)
    2) Manual fetch to /api/auth/me and role check (used in some routes like employees/GET, attendance)
- Data model (Prisma)
  - User(id, email, password, role, lastLogin, lastLoginIp)
  - Employee(id, uniqueSlug, profilePhotoUrl, …)
  - EmployeeDocument(employeeId, type, fileName, fileUrl)
  - Payment(employeeId, type, amount, date, clearedPaymentId, relations for clearing)
  - Attendance(employeeId, month, year, daysWorked; unique by employeeId+month+year)
  - Invoice(clientName, amount, date, PDF file)
  - PfEsiChallan(month, year, type, file)
  - Enums: UserRole(ADMIN, ACCOUNTANT), DocumentType, PaymentType, ChallanType
- File uploads and serving
  - Uploads are saved to /uploads[/subfolder]; upload.ts enforces type and size limits and creates directories.
  - next.config.js rewrites /uploads/:path* to /api/files/:path* where GET validates path is within uploads and sets appropriate Content-Type.
- Configuration
  - next.config.js is authoritative (presence of next.config.ts is superseded by JS config at build time):
    - output: standalone (for Docker)
    - serverExternalPackages: ['bcryptjs']
    - rewrites /uploads → /api/files
    - prod-only console removal
    - security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, HSTS
  - eslint.config.mjs: Flat config extending next/core-web-vitals and next/typescript; warns on no-unused-vars and no-explicit-any.
  - tsconfig.json: strict TS, bundler resolution, path alias @/* to project root.

Docker and CI/CD
- Dockerfile: Multi-stage (deps → builder → runner). Generates Prisma client, builds Next (standalone), copies .next/standalone and .next/static. Creates /app/uploads with correct ownership. Healthcheck hits /api/health.
- docker-compose.yml (local): Postgres + app service, binds ./uploads to container /app/uploads.
- GitHub Actions (.github/workflows/deploy.yml):
  - test job: checkout, setup Node 18, npm ci, prisma generate, db push (ephemeral Postgres), lint, build
  - build-and-push: builds and pushes image to GHCR using docker/build-push-action
  - deploy: SSH to server, write a docker-compose.prod.yml, pull image, restart, then run npx prisma db push and prisma db seed inside the container

Conventions and patterns
- API responses: JSON with shape { success: boolean, data?: any, error?: string } and appropriate HTTP status codes.
- Validation: zod schemas at route boundaries.
- RBAC: Prefer adminOnly/adminOrAccountant wrappers for route handlers. Maintain consistency when adding new endpoints.
- Files: Use uploadFile from app/lib/upload.ts to persist and compute URL, then store file metadata in Prisma entities.

Troubleshooting
- Prisma client issues after schema changes: npm run db:generate
- Local DB not seeded: npm run db:seed (set ADMIN_EMAIL/ADMIN_PASSWORD if needed)
- Upload permissions in Docker: ensure volume maps ./uploads → /app/uploads; container runs as non-root user (nextjs)
- If both next.config.js and next.config.ts diverge, the JS file is applied by Next.js; keep changes in next.config.js
