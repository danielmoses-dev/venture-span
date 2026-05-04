import axios from 'axios'
import { query } from '../config/db'
import { StartupProfile, MlResult } from '../types'

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

export const runMlPrediction = async (profile: StartupProfile): Promise<MlResult | null> => {
  try {
    const payload = {
      category:          profile.industry,
      country:           profile.country_code,
      funding_total_usd: profile.funding_total_usd,
      funding_rounds:    profile.funding_rounds,
      milestones:        profile.milestones,
      relationships:     profile.relationships,
      company_age:       profile.company_age,
      // Additional fields for context-aware calibration
      team_size:         profile.team_size  || 1,
      stage:             profile.stage      || 'seed',
    }

    const { data } = await axios.post<MlResult>(`${ML_URL}/predict`, payload, {
      timeout: 15000,
    })

    // Store the calibrated score (data.score) as ml_score in DB
    // This is the single score shown to investors and the startup
    await query(
      `UPDATE startup_profiles
       SET ml_score = $1, ml_result = $2, ml_updated_at = NOW(), updated_at = NOW()
       WHERE user_id = $3`,
      [data.score, JSON.stringify(data), profile.user_id]
    )

    return data
  } catch (err) {
    console.error('ML prediction failed:', err instanceof Error ? err.message : err)
    return null
  }
}
