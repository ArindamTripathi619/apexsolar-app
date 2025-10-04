import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  const payload = { id: user.id, email: user.email, role: user.role }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  } as any)
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & AuthUser
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    }
  } catch {
    return null
  }
}

export async function authenticateUser(email: string, password: string, ip?: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user || !(await verifyPassword(password, user.password))) {
    return null
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: new Date(),
      lastLoginIp: ip
    }
  })

  return {
    id: user.id,
    email: user.email,
    role: user.role
  }
}
