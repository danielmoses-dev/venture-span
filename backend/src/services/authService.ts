import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/db'
import { AppError } from '../middleware/errorHandler'
import { UserRole, JwtPayload } from '../types'

export const signup = async (email: string, password: string, role: UserRole) => {
  const exists = await query('SELECT id FROM users WHERE email = $1', [email])
  if (exists.rows.length > 0) throw new AppError(409, 'Email already registered')

  const hashed = await bcrypt.hash(password, 12)
  const result = await query(
    'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, verified, created_at',
    [email.toLowerCase().trim(), hashed, role]
  )
  const user = result.rows[0]

  // Create empty profile
  if (role === 'startup') {
    await query('INSERT INTO startup_profiles (user_id) VALUES ($1)', [user.id])
  } else {
    await query('INSERT INTO investor_profiles (user_id) VALUES ($1)', [user.id])
  }

  const token = signToken({ userId: user.id, role: user.role })
  return { user, token }
}

export const login = async (email: string, password: string) => {
  const result = await query(
    'SELECT id, email, password, role, verified FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  )
  const user = result.rows[0]
  if (!user) throw new AppError(401, 'Invalid email or password')

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new AppError(401, 'Invalid email or password')

  const { password: _pw, ...safeUser } = user
  const token = signToken({ userId: safeUser.id, role: safeUser.role })
  return { user: safeUser, token }
}

const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions)
