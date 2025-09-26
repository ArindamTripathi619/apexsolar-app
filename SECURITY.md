# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of ApexSolar App seriously. If you have discovered a security vulnerability, please report it to us responsibly.

### How to Report

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Send an email to **arindamtripathi.619@gmail.com** with the following information:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Any suggested fixes (if available)

### What to Expect

- **Response Time**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Updates**: We will provide regular updates on our progress towards a fix
- **Resolution**: We aim to resolve critical vulnerabilities within 7 days
- **Credit**: With your permission, we will credit you in our security advisory

### Security Measures

Our application implements the following security measures:

#### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Employee, Accountant)
- Secure session management
- Password hashing using industry-standard algorithms

#### Data Protection
- Input validation and sanitization
- SQL injection prevention through Prisma ORM
- XSS protection
- CSRF protection for state-changing operations

#### Infrastructure Security
- HTTPS enforcement in production
- Secure headers implementation
- Environment variable protection
- File upload restrictions and validation

#### Database Security
- Parameterized queries
- Connection encryption
- Regular security updates
- Access control and audit logging

### Security Best Practices for Contributors

When contributing to this project, please:

1. **Never commit sensitive data** such as:
   - API keys or tokens
   - Database credentials
   - Private keys or certificates
   - Personal information

2. **Follow secure coding practices**:
   - Validate all user inputs
   - Use parameterized queries
   - Implement proper error handling
   - Follow the principle of least privilege

3. **Keep dependencies updated**:
   - Regularly update npm packages
   - Monitor for security advisories
   - Use `npm audit` to check for vulnerabilities

4. **Code Review Requirements**:
   - All code must be reviewed before merging
   - Security-sensitive changes require additional review
   - Automated security scanning is enabled

### Security Testing

We encourage security testing of our application with the following guidelines:

- **Permitted**: Testing on your own local installation
- **Prohibited**: 
  - Testing on production systems without permission
  - Attempts to access other users' data
  - Denial of service attacks
  - Social engineering attacks

### Responsible Disclosure

We believe in responsible disclosure and will work with security researchers to:

- Verify and reproduce reported vulnerabilities
- Develop and test fixes
- Coordinate public disclosure timing
- Provide credit to researchers (if desired)

## Security Updates

Security updates will be published:

1. As GitHub Security Advisories
2. In our release notes
3. Via email to maintainers

## Contact

For security-related inquiries:
- **Email**: arindamtripathi.619@gmail.com
- **Maintainer**: ArindamTripathi619

---

Thank you for helping keep ApexSolar App and our users safe!