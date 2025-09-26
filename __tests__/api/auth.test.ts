import { hashPassword, verifyPassword, generateToken, verifyToken } from '@/app/lib/auth'

// Mock UserRole since we can't import it from @prisma/client in tests
const UserRole = {
  ADMIN: 'ADMIN' as const,
  ACCOUNTANT: 'ACCOUNTANT' as const,
}

type UserRole = typeof UserRole[keyof typeof UserRole]

describe('Auth Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123'
      const hashedPassword = await hashPassword(password)
      
      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(50)
    })

    it('should verify a correct password', async () => {
      const password = 'testpassword123'
      const hashedPassword = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hashedPassword = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Management', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: UserRole.ADMIN
    }

    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should verify a valid JWT token', () => {
      const token = generateToken(mockUser)
      const decodedUser = verifyToken(token)
      
      expect(decodedUser).toBeDefined()
      expect(decodedUser?.id).toBe(mockUser.id)
      expect(decodedUser?.email).toBe(mockUser.email)
      expect(decodedUser?.role).toBe(mockUser.role)
    })

    it('should reject an invalid JWT token', () => {
      const invalidToken = 'invalid.jwt.token'
      const decodedUser = verifyToken(invalidToken)
      
      expect(decodedUser).toBeNull()
    })
  })
})