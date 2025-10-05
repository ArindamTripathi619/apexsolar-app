import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { uploadToGCS, getPublicUrl, deleteFile as deleteFileFromGCS } from '@/app/lib/gcs'

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads'
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB

export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png'],
  document: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
}

export interface UploadResult {
  success: boolean
  fileName?: string
  fileUrl?: string
  error?: string
}

export async function uploadFile(
  file: File,
  subfolder: string = '',
  allowedTypes: string[] = ALLOWED_FILE_TYPES.document
): Promise<UploadResult> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
      }
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
      }
    }

    // For Cloud Run deployment, use Google Cloud Storage
    if (process.env.NODE_ENV === 'production') {
      try {
        console.log(`Production upload: file=${file.name}, size=${file.size}, type=${file.type}`)
        
        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        console.log(`Buffer created: ${buffer.length} bytes`)
        
        // Generate unique filename
        const fileExtension = path.extname(file.name)
        const fileName = `${subfolder}/${uuidv4()}${fileExtension}`
        console.log(`Generated filename: ${fileName}`)
        
        // Upload to Google Cloud Storage
        console.log('Starting GCS upload...')
        const uploadResult = await uploadToGCS(buffer, fileName, file.type)
        console.log('GCS upload result:', uploadResult)
        
        // Generate public URL for access
        console.log('Generating public URL...')
        const publicUrl = getPublicUrl(fileName)
        console.log('Public URL generated')
        
        return {
          success: true,
          fileName,
          fileUrl: publicUrl
        }
      } catch (error) {
        console.error('Production upload error:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to upload file'
        }
      }
    } else {
      // Local development - keep existing logic
      // Create upload directory if it doesn't exist
      const uploadPath = path.join(process.cwd(), UPLOAD_DIR, subfolder)
      if (!existsSync(uploadPath)) {
        await mkdir(uploadPath, { recursive: true })
      }

      // Generate unique filename
      const fileExtension = path.extname(file.name)
      const fileName = `${uuidv4()}${fileExtension}`
      const filePath = path.join(uploadPath, fileName)

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      const fileUrl = `/${UPLOAD_DIR}/${subfolder}${subfolder ? '/' : ''}${fileName}`

      return {
        success: true,
        fileName,
        fileUrl
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: 'Failed to upload file'
    }
  }
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

export function validateFileSize(file: File, maxSize: number = MAX_FILE_SIZE): boolean {
  return file.size <= maxSize
}

export async function deleteFile(fileName: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Delete from Google Cloud Storage
      await deleteFileFromGCS(fileName)
    } else {
      // Delete from local storage
      const filePath = path.join(process.cwd(), UPLOAD_DIR, fileName)
      if (existsSync(filePath)) {
        await unlink(filePath)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Delete file error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file'
    }
  }
}
