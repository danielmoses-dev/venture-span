import { Router } from 'express'
import { z } from 'zod'
import * as authService from '../services/authService'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

const signupSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role:     z.enum(['startup', 'investor']),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, role } = signupSchema.parse(req.body)
    const result = await authService.signup(email, password, role)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const result = await authService.login(email, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { query } = await import('../config/db')
    const result = await query(
      'SELECT id, email, role, verified, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    )
    res.json(result.rows[0])
  } catch (err) {
    next(err)
  }
})

export default router
