import { Router } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import * as browseService from '../services/browseService'

const router = Router()

router.get('/startups', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await browseService.browseStartups({
      industry:     req.query.industry as string,
      stage:        req.query.stage as string,
      country_code: req.query.country as string,
      search:       req.query.search as string,
      page:         parseInt(req.query.page as string) || 1,
      limit:        parseInt(req.query.limit as string) || 12,
    }, req.user!.userId)
    res.json(result)
  } catch (err) { next(err) }
})

router.get('/investors', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await browseService.browseInvestors({
      industry:    req.query.industry as string,
      country_code: req.query.country as string,
      min_ticket:  parseInt(req.query.min_ticket as string) || undefined,
      max_ticket:  parseInt(req.query.max_ticket as string) || undefined,
      search:      req.query.search as string,
      page:        parseInt(req.query.page as string) || 1,
      limit:       parseInt(req.query.limit as string) || 12,
    }, req.user!.userId)
    res.json(result)
  } catch (err) { next(err) }
})

export default router
