import { Router } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { upload } from '../middleware/upload'
import { query } from '../config/db'

const router = Router()

// Submit verification document
router.post('/', authenticate, upload.single('document'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No document uploaded' })
    const url = `/uploads/${req.file.filename}`

    // Cancel any previous pending request
    await query(
      `UPDATE verification_requests SET status = 'rejected', admin_note = 'Superseded by new submission'
       WHERE user_id = $1 AND status = 'pending'`,
      [req.user!.userId]
    )

    const result = await query(
      'INSERT INTO verification_requests (user_id, document_url) VALUES ($1, $2) RETURNING *',
      [req.user!.userId, url]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { next(err) }
})

// Get own verification status
router.get('/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT status, admin_note, created_at FROM verification_requests
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user!.userId]
    )
    res.json(result.rows[0] || { status: 'not_submitted' })
  } catch (err) { next(err) }
})

// Admin: list pending requests (simple check — extend with admin role later)
router.get('/admin/pending', authenticate, async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT vr.*, u.email, u.role FROM verification_requests vr
       JOIN users u ON u.id = vr.user_id
       WHERE vr.status = 'pending' ORDER BY vr.created_at ASC`
    )
    res.json(result.rows)
  } catch (err) { next(err) }
})

// Admin: approve or reject
router.patch('/admin/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { action, note } = req.body
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'action must be approved or rejected' })
    }

    const vr = await query('SELECT * FROM verification_requests WHERE id = $1', [req.params.id])
    if (!vr.rows[0]) return res.status(404).json({ message: 'Request not found' })

    await query(
      'UPDATE verification_requests SET status = $1, admin_note = $2, updated_at = NOW() WHERE id = $3',
      [action, note || null, req.params.id]
    )

    if (action === 'approved') {
      await query('UPDATE users SET verified = true WHERE id = $1', [vr.rows[0].user_id])
    }

    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
