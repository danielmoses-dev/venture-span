import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { AppError } from './errorHandler'

const uploadDir = process.env.UPLOAD_DIR || './uploads'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new AppError(400, 'Only PDF and image files are allowed'))
  }
}

const maxMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10')

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxMB * 1024 * 1024 },
})
