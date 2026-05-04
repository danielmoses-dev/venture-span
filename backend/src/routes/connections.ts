import { Router } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import * as connectionService from '../services/connectionService'

const router = Router()

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { toUserId, message } = req.body
    if (!toUserId) return res.status(400).json({ message: 'toUserId is required' })
    const conn = await connectionService.sendConnectionRequest(
      req.user!.userId,
      toUserId,
      req.user!.role,
      message
    )
    res.status(201).json(conn)
  } catch (err) { next(err) }
})

router.patch('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { action } = req.body
    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'action must be accepted or rejected' })
    }
    const conn = await connectionService.respondToConnection(
      req.params.id,
      req.user!.userId,
      action
    )
    res.json(conn)
  } catch (err) { next(err) }
})

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const conns = await connectionService.getMyConnections(req.user!.userId, req.user!.role)
    res.json(conns)
  } catch (err) { next(err) }
})

export default router
