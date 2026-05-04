import { Router } from 'express'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'
import { upload } from '../middleware/upload'
import * as profileService from '../services/profileService'
import { query } from '../config/db'

const router = Router()

// ── Startup ──────────────────────────────────────────────────────────────────
router.get('/startup', authenticate, requireRole('startup'), async (req: AuthRequest, res, next) => {
  try { res.json(await profileService.getStartupProfile(req.user!.userId)) }
  catch (err) { next(err) }
})

router.put('/startup', authenticate, requireRole('startup'), async (req: AuthRequest, res, next) => {
  try { res.json(await profileService.updateStartupProfile(req.user!.userId, req.body)) }
  catch (err) { next(err) }
})

router.post('/startup/pitch-deck', authenticate, requireRole('startup'), upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    res.json(await profileService.updatePitchDeck(req.user!.userId, `/uploads/${req.file.filename}`))
  } catch (err) { next(err) }
})

router.post('/startup/logo', authenticate, requireRole('startup'), upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const r = await query('UPDATE startup_profiles SET logo_url = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *', [`/uploads/${req.file.filename}`, req.user!.userId])
    res.json(r.rows[0])
  } catch (err) { next(err) }
})

router.post('/startup/banner', authenticate, requireRole('startup'), upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const r = await query('UPDATE startup_profiles SET banner_url = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *', [`/uploads/${req.file.filename}`, req.user!.userId])
    res.json(r.rows[0])
  } catch (err) { next(err) }
})

// ── Investor ──────────────────────────────────────────────────────────────────
router.get('/investor', authenticate, requireRole('investor'), async (req: AuthRequest, res, next) => {
  try { res.json(await profileService.getInvestorProfile(req.user!.userId)) }
  catch (err) { next(err) }
})

router.put('/investor', authenticate, requireRole('investor'), async (req: AuthRequest, res, next) => {
  try { res.json(await profileService.updateInvestorProfile(req.user!.userId, req.body)) }
  catch (err) { next(err) }
})

router.post('/investor/photo', authenticate, requireRole('investor'), upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const r = await query('UPDATE investor_profiles SET photo_url = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *', [`/uploads/${req.file.filename}`, req.user!.userId])
    res.json(r.rows[0])
  } catch (err) { next(err) }
})

router.post('/investor/banner', authenticate, requireRole('investor'), upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const r = await query('UPDATE investor_profiles SET banner_url = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *', [`/uploads/${req.file.filename}`, req.user!.userId])
    res.json(r.rows[0])
  } catch (err) { next(err) }
})

// ── Public views ──────────────────────────────────────────────────────────────
router.get('/startup/:userId', authenticate, async (req, res, next) => {
  try { res.json(await profileService.getStartupProfile(req.params.userId)) }
  catch (err) { next(err) }
})

router.get('/investor/:userId', authenticate, async (req, res, next) => {
  try { res.json(await profileService.getInvestorProfile(req.params.userId)) }
  catch (err) { next(err) }
})

export default router
