import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import authRoutes from './routes/auth'
import profileRoutes from './routes/profiles'
import browseRoutes from './routes/browse'
import connectionRoutes from './routes/connections'
import mlRoutes from './routes/ml'
import verificationRoutes from './routes/verification'
import adminRoutes from './routes/admin'
import { errorHandler } from './middleware/errorHandler'

import path from 'path'

const app = express()

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
)
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  '/uploads',
  express.static(
    process.env.UPLOAD_DIR ||
    path.join(__dirname, '../uploads')
  )
)

app.use('/api/auth', authRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/browse', browseRoutes)
app.use('/api/connections', connectionRoutes)
app.use('/api/ml', mlRoutes)
app.use('/api/verification', verificationRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use(errorHandler)

export default app
