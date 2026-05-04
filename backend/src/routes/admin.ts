import { Router } from 'express'
import { query } from '../config/db'

const router = Router()

const checkSecret = (req: any, res: any, next: any) => {
  const secret = process.env.ADMIN_SECRET || 'vs-admin-secret-change-this'
  if (req.headers['x-admin-secret'] !== secret && req.query.secret !== secret) {
    return res.status(404).json({ message: 'Not found' })
  }
  next()
}

router.get('/verifications', checkSecret, async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT vr.*, u.email, u.role, u.verified,
        CASE WHEN u.role = 'startup' THEN sp.name ELSE ip.name END as profile_name,
        CASE WHEN u.role = 'startup' THEN sp.industry ELSE ip.firm_name END as profile_detail
      FROM verification_requests vr
      JOIN users u ON u.id = vr.user_id
      LEFT JOIN startup_profiles sp ON sp.user_id = vr.user_id
      LEFT JOIN investor_profiles ip ON ip.user_id = vr.user_id
      ORDER BY CASE vr.status WHEN 'pending' THEN 0 ELSE 1 END, vr.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) { next(err) }
})

router.patch('/verifications/:id', checkSecret, async (req, res, next) => {
  try {
    const { action, note } = req.body
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'action must be approved or rejected' })
    }
    const vr = await query('SELECT * FROM verification_requests WHERE id = $1', [req.params.id])
    if (!vr.rows[0]) return res.status(404).json({ message: 'Not found' })
    await query(
      'UPDATE verification_requests SET status = $1, admin_note = $2, updated_at = NOW() WHERE id = $3',
      [action, note || null, req.params.id]
    )
    if (action === 'approved') {
      await query('UPDATE users SET verified = true WHERE id = $1', [vr.rows[0].user_id])
    } else {
      await query('UPDATE users SET verified = false WHERE id = $1', [vr.rows[0].user_id])
    }
    res.json({ success: true, action })
  } catch (err) { next(err) }
})

router.post('/verify-user', checkSecret, async (req, res, next) => {
  try {
    const { email, verified } = req.body
    const result = await query(
      'UPDATE users SET verified = $1 WHERE email = $2 RETURNING id, email, role, verified',
      [verified !== false, email]
    )
    if (!result.rows[0]) return res.status(404).json({ message: 'User not found' })
    res.json(result.rows[0])
  } catch (err) { next(err) }
})

router.get('/users', checkSecret, async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT u.id, u.email, u.role, u.verified, u.created_at,
        CASE WHEN u.role = 'startup' THEN sp.name ELSE ip.name END as name
      FROM users u
      LEFT JOIN startup_profiles sp ON sp.user_id = u.id
      LEFT JOIN investor_profiles ip ON ip.user_id = u.id
      ORDER BY u.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) { next(err) }
})

export default router
