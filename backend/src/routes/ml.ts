import { Router } from 'express'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'
import { runMlPrediction } from '../services/mlService'
import { getStartupProfile } from '../services/profileService'
import { query } from '../config/db'

const router = Router()

// Manually trigger ML prediction (startup only)
router.post('/predict', authenticate, requireRole('startup'), async (req: AuthRequest, res, next) => {
  try {
    const profile = await getStartupProfile(req.user!.userId)
    const result = await runMlPrediction(profile)
    if (!result) return res.status(503).json({ message: 'ML service unavailable' })
    res.json(result)
  } catch (err) { next(err) }
})

// Get stored ML result for own profile
router.get('/result', authenticate, requireRole('startup'), async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      'SELECT ml_score, ml_result, ml_updated_at, ml_score_visible FROM startup_profiles WHERE user_id = $1',
      [req.user!.userId]
    )
    res.json(result.rows[0] || null)
  } catch (err) { next(err) }
})

// Toggle visibility of ML score to investors
router.patch('/visibility', authenticate, requireRole('startup'), async (req: AuthRequest, res, next) => {
  try {
    const { visible } = req.body
    await query(
      'UPDATE startup_profiles SET ml_score_visible = $1, updated_at = NOW() WHERE user_id = $2',
      [Boolean(visible), req.user!.userId]
    )
    res.json({ ml_score_visible: Boolean(visible) })
  } catch (err) { next(err) }
})

export default router
