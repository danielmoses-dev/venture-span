import { query } from '../config/db'
import { AppError } from '../middleware/errorHandler'

export const sendConnectionRequest = async (
  fromUserId: string,
  toUserId: string,
  fromRole: 'startup' | 'investor',
  message?: string
) => {
  const startupId  = fromRole === 'startup'  ? fromUserId : toUserId
  const investorId = fromRole === 'investor' ? fromUserId : toUserId

  const existing = await query(
    'SELECT id, status FROM connections WHERE startup_id = $1 AND investor_id = $2',
    [startupId, investorId]
  )
  if (existing.rows[0]) {
    throw new AppError(409, `Connection already exists with status: ${existing.rows[0].status}`)
  }

  const result = await query(
    `INSERT INTO connections (startup_id, investor_id, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [startupId, investorId, message || null]
  )
  return result.rows[0]
}

export const respondToConnection = async (
  connectionId: string,
  userId: string,
  action: 'accepted' | 'rejected'
) => {
  const conn = await query('SELECT * FROM connections WHERE id = $1', [connectionId])
  if (!conn.rows[0]) throw new AppError(404, 'Connection not found')

  const c = conn.rows[0]
  if (c.investor_id !== userId && c.startup_id !== userId) {
    throw new AppError(403, 'Not your connection')
  }
  if (c.status !== 'pending') throw new AppError(400, 'Connection already resolved')

  const result = await query(
    'UPDATE connections SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [action, connectionId]
  )
  return result.rows[0]
}

export const getMyConnections = async (userId: string, role: 'startup' | 'investor') => {
  const col = role === 'startup' ? 'startup_id' : 'investor_id'
  const otherCol = role === 'startup' ? 'investor_id' : 'startup_id'
  const profileTable = role === 'startup' ? 'investor_profiles' : 'startup_profiles'
  //const profileCol   = role === 'startup' ? 'investor_id' : 'startup_id'

  const result = await query(
    `SELECT c.*, p.name as other_name, p.id as other_profile_id
     FROM connections c
     JOIN ${profileTable} p ON p.user_id = c.${otherCol}
     WHERE c.${col} = $1
     ORDER BY c.updated_at DESC`,
    [userId]
  )
  return result.rows
}
