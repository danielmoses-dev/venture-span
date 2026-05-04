export type UserRole = 'startup' | 'investor'

export interface User {
  id: string
  email: string
  role: UserRole
  verified: boolean
  created_at: string
}

export interface StartupProfile {
  id: string
  user_id: string
  name: string
  industry: string
  stage: string
  location: string
  country_code: string
  team_size: number
  funding_total_usd: number
  funding_rounds: number
  milestones: number
  relationships: number
  company_age: number
  description: string
  pitch_deck_url: string | null
  website: string | null
  ml_score: number | null
  ml_result: MlResult | null
  ml_score_visible: boolean
  ml_updated_at: string | null
  created_at: string
  updated_at: string
}

export interface InvestorProfile {
  id: string
  user_id: string
  name: string
  firm_name: string
  investor_type: string
  investment_stages: string[]
  ticket_min_usd: number
  ticket_max_usd: number
  preferred_industries: string[]
  location: string
  country_code: string
  bio: string
  website: string | null
  linkedin_url: string | null
  portfolio: PortfolioItem[]
  created_at: string
  updated_at: string
}

export interface PortfolioItem {
  company: string
  url?: string
  stage?: string
}

export interface Connection {
  id: string
  startup_id: string
  investor_id: string
  status: 'pending' | 'accepted' | 'rejected'
  message: string | null
  created_at: string
  updated_at: string
}

export interface MlResult {
  score: number
  predicted_class: number
  predicted_label: string
  confidence: number
  probabilities: {
    'Positive exit': number
    'Sustainability': number
    'Failure risk': number
  }
  percentiles: {
    funding_total_usd: number
    company_age: number
    milestones: number
    relationships: number
  }
  recommendations: MlRecommendation[]
}

export interface MlRecommendation {
  feature: string
  current: number
  target: number
}

export interface JwtPayload {
  userId: string
  role: UserRole
}

export interface ApiError {
  message: string
  code?: string
}
