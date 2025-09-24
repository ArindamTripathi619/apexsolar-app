import { UserRole, DocumentType, PaymentType, ChallanType } from '@prisma/client'

export interface User {
  id: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  lastLoginIp?: string
}

export interface Employee {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  dateOfJoining?: Date
  uniqueSlug: string
  profilePhotoUrl?: string
  createdAt: Date
  updatedAt: Date
  documents?: EmployeeDocument[]
  payments?: Payment[]
  attendance?: Attendance[]
}

export interface EmployeeDocument {
  id: string
  employeeId: string
  type: DocumentType
  fileName: string
  fileUrl: string
  uploadedAt: Date
}

export interface Payment {
  id: string
  employeeId: string
  type: PaymentType
  amount: number
  description?: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

export interface Attendance {
  id: string
  employeeId: string
  month: number
  year: number
  daysWorked: number
  createdAt: Date
  updatedAt: Date
}

export interface Invoice {
  id: string
  clientName: string
  amount: number
  date: Date
  fileName: string
  fileUrl: string
  uploadedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface PfEsiChallan {
  id: string
  month: number
  year: number
  type: ChallanType
  fileName: string
  fileUrl: string
  uploadedBy: string
  uploadedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface LoginForm {
  email: string
  password: string
}

export interface EmployeeForm {
  name: string
  phone?: string
  email?: string
  address?: string
  dateOfJoining?: string
}

export interface PaymentForm {
  employeeId: string
  type: PaymentType
  amount: number
  description?: string
  date: string
}

export interface AttendanceForm {
  employeeId: string
  month: number
  year: number
  daysWorked: number
}

export interface InvoiceForm {
  clientName: string
  amount: number
  date: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
