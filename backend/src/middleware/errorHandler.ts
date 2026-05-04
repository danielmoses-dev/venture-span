import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err.name === 'AppError') {
    const appErr = err as AppError
    return res.status(appErr.statusCode).json({ message: appErr.message })
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({ message: 'Validation error', details: err.message })
  }

  console.error('Unhandled error:', err)
  return res.status(500).json({ message: 'Internal server error' })
}
