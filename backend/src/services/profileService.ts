import { query } from '../config/db'
import { AppError } from '../middleware/errorHandler'
import { runMlPrediction } from './mlService'

export const getStartupProfile = async (userId: string) => {
  const result = await query(
    'SELECT * FROM startup_profiles WHERE user_id = $1',
    [userId]
  )
  if (!result.rows[0]) throw new AppError(404, 'Startup profile not found')
  return result.rows[0]
}

export const updateStartupProfile = async (userId: string, data: Record<string, unknown>) => {
  const allowed = [
    'name', 'industry', 'stage', 'location', 'country_code', 'team_size',
    'funding_total_usd', 'funding_rounds', 'milestones', 'relationships',
    'company_age', 'description', 'website', 'ml_score_visible',
  ]

  const fields = Object.keys(data).filter(k => allowed.includes(k))
  if (fields.length === 0) throw new AppError(400, 'No valid fields to update')

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ')
  const values = fields.map(f => data[f])

  const result = await query(
    `UPDATE startup_profiles SET ${setClauses}, updated_at = NOW()
     WHERE user_id = $${fields.length + 1}
     RETURNING *`,
    [...values, userId]
  )

  const profile = result.rows[0]

  // Trigger ML if key fields changed
  const mlTriggerFields = [
    'industry', 'country_code', 'funding_total_usd', 'funding_rounds',
    'milestones', 'relationships', 'company_age',
  ]
  const shouldRunMl = fields.some(f => mlTriggerFields.includes(f))
  if (shouldRunMl && profile.name) {
    runMlPrediction(profile) // fire and forget
  }

  return profile
}

export const updatePitchDeck = async (userId: string, fileUrl: string) => {
  const result = await query(
    'UPDATE startup_profiles SET pitch_deck_url = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
    [fileUrl, userId]
  )
  return result.rows[0]
}

export const getInvestorProfile = async (userId: string) => {
  const result = await query(
    'SELECT * FROM investor_profiles WHERE user_id = $1',
    [userId]
  )
  if (!result.rows[0]) throw new AppError(404, 'Investor profile not found')
  return result.rows[0]
}

export const updateInvestorProfile = async (userId: string, data: Record<string, unknown>) => {
  const allowed = [
    'name', 'firm_name', 'investor_type', 'investment_stages', 'ticket_min_usd',
    'ticket_max_usd', 'preferred_industries', 'location', 'country_code',
    'bio', 'website', 'linkedin_url', 'portfolio',
  ]

  const fields = Object.keys(data).filter(k => allowed.includes(k))
  if (fields.length === 0) throw new AppError(400, 'No valid fields to update')

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ')
  const values = fields.map(f => data[f])

  const result = await query(
    `UPDATE investor_profiles SET ${setClauses}, updated_at = NOW()
     WHERE user_id = $${fields.length + 1}
     RETURNING *`,
    [...values, userId]
  )
  return result.rows[0]
}
