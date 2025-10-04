import { Storage } from '@google-cloud/storage'

let storage: Storage | null = null
let bucket: any = null

// Initialize storage only if environment variables are available
if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GCS_BUCKET_NAME) {
  try {
    // In Cloud Run, we use the service account authentication automatically
    // No need for keyFilename in production
    const storageConfig: any = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    }
    
    // Only add keyFilename if running locally with credentials file
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      storageConfig.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS
    }
    
    storage = new Storage(storageConfig)
    bucket = storage.bucket(process.env.GCS_BUCKET_NAME)
    console.log(`GCS initialized for project: ${process.env.GOOGLE_CLOUD_PROJECT_ID}, bucket: ${process.env.GCS_BUCKET_NAME}`)
  } catch (error) {
    console.warn('GCS initialization failed:', error)
  }
}

export async function uploadToGCS(file: Buffer, fileName: string, contentType: string) {
  if (!bucket) {
    throw new Error('GCS bucket not initialized')
  }
  
  try {
    console.log(`Starting upload: ${fileName}, contentType: ${contentType}, size: ${file.length}`)
    
    const blob = bucket.file(fileName)
    const stream = blob.createWriteStream({
      metadata: {
        contentType,
      },
      predefinedAcl: 'publicRead', // Make file publicly readable
    })

    return new Promise((resolve, reject) => {
      stream.on('error', (error: Error) => {
        console.error('GCS upload stream error:', error)
        reject(error)
      })
      stream.on('finish', () => {
        console.log(`Upload completed: ${fileName}`)
        resolve({
          fileName,
          url: `gs://${process.env.GCS_BUCKET_NAME}/${fileName}`
        })
      })
      stream.end(file)
    })
  } catch (error) {
    console.error('GCS upload error:', error)
    throw error
  }
}

export function getPublicUrl(fileName: string) {
  return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${fileName}`
}

export async function getSignedUrl(fileName: string, expires = 3600000) {
  if (!bucket) {
    throw new Error('GCS bucket not initialized')
  }
  
  const file = bucket.file(fileName)
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expires, // 1 hour default
  })
  return url
}

export async function deleteFile(fileName: string) {
  if (!bucket) {
    throw new Error('GCS bucket not initialized')
  }
  
  const file = bucket.file(fileName)
  await file.delete()
}

export async function fileExists(fileName: string) {
  if (!bucket) {
    throw new Error('GCS bucket not initialized')
  }
  
  const file = bucket.file(fileName)
  const [exists] = await file.exists()
  return exists
}