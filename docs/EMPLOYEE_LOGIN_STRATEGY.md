// Employee Authentication Strategy for ApexSolar

## 🎯 Phase 1: Employee Login Setup (Next Priority)

### Database Schema Updates
```sql
-- Add employee login fields to existing Employee table
ALTER TABLE Employee ADD COLUMN password TEXT;
ALTER TABLE Employee ADD COLUMN isActive BOOLEAN DEFAULT true;
ALTER TABLE Employee ADD COLUMN lastLogin TIMESTAMP;
ALTER TABLE Employee ADD COLUMN loginAttempts INTEGER DEFAULT 0;
ALTER TABLE Employee ADD COLUMN resetToken TEXT;
ALTER TABLE Employee ADD COLUMN resetTokenExpiry TIMESTAMP;
```

### Authentication Flow
1. **Employee Registration**: Admin creates employee with email
2. **Password Setup**: Employee sets password via email link
3. **Login Portal**: Separate employee login page
4. **Profile Access**: Limited to own data only

### API Routes to Add
- `/api/employee/auth/login` - Employee login
- `/api/employee/auth/setup-password` - First-time password setup
- `/api/employee/auth/reset-password` - Password reset
- `/api/employee/profile` - Own profile management
- `/api/employee/documents` - Own documents
- `/api/employee/attendance` - Own attendance history
- `/api/employee/payments` - Own payment history

### Security Considerations
- Separate JWT tokens for employees
- Role-based access (EMPLOYEE role)
- Data isolation (employees see only their data)
- Password strength requirements
- Account lockout after failed attempts

## 🔮 Phase 2: Employee Self-Service Features

### Profile Management
- Update personal information
- Change password
- Upload profile photo
- Emergency contact updates

### Document Access
- View personal documents
- Download certificates
- Upload personal documents (if allowed)

### Attendance & Payments
- View attendance history
- Download attendance reports
- View payment history
- Request advances (if workflow enabled)

### Mobile-Friendly Design
- Responsive layout for mobile access
- PWA capabilities for app-like experience
- Offline data viewing

## 📊 Implementation Priority

| Feature | Priority | Effort | User Value |
|---------|----------|--------|------------|
| Employee Login | High | Medium | High |
| Profile View | High | Low | High |
| Password Reset | High | Medium | Medium |
| Attendance History | Medium | Low | High |
| Payment History | Medium | Low | High |
| Document Downloads | Medium | Low | Medium |
| Profile Updates | Low | Medium | Medium |
| Mobile PWA | Low | High | Medium |

## 🎯 Current Recommendation

Focus on **Employee Login** infrastructure before adding complexity like apiClient.ts.

The current direct API approach works well for Admin/Accountant use cases.
