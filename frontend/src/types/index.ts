export type UserRole = 'startup' | 'investor'

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
  verified?: boolean
  connected?: boolean
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
  verified?: boolean
  connected?: boolean
}

export interface PortfolioItem {
  company: string
  url?: string
  stage?: string
}

export interface MlResult {
  score: number            // calibrated VentureSpan score — shown to users
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
  region: string           // India | USA | Other — used for context label in UI
}

export interface MlRecommendation {
  feature: string
  label: string
  current: number
  target: number
  change_pct?: number
}

export interface Connection {
  id: string
  startup_id: string
  investor_id: string
  status: 'pending' | 'accepted' | 'rejected'
  message: string | null
  other_name: string
  other_profile_id: string
  created_at: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export const INDUSTRIES = [
  'Advertising','Analytics','Automotive','Biotech','Cleantech','Consulting',
  'Design','Ecommerce','Education','Enterprise','Fashion','Finance',
  'Games Video','Hardware','Health','Hospitality','Legal','Local',
  'Manufacturing','Medical','Messaging','Mobile','Music','Nanotech',
  'Network Hosting','News','Nonprofit','Other','Pets','Photo Video',
  'Public Relations','Real Estate','Search','Security','Semiconductor',
  'Social','Software','Sports','Transportation','Travel','Web',
]

export const STAGES = [
  { value: 'idea',     label: 'Idea' },
  { value: 'pre-seed', label: 'Pre-seed' },
  { value: 'seed',     label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
  { value: 'growth',   label: 'Growth' },
]

export const INVESTOR_TYPES = [
  { value: 'individual',    label: 'Individual' },
  { value: 'angel',         label: 'Angel' },
  { value: 'vc',            label: 'VC Firm' },
  { value: 'family_office', label: 'Family Office' },
  { value: 'corporate',     label: 'Corporate VC' },
]

export const scoreColor = (score: number | null) => {
  if (score === null) return 'text-text-muted'
  if (score >= 7) return 'text-success'
  if (score >= 5) return 'text-warning'
  return 'text-danger'
}

export const scoreBg = (score: number | null) => {
  if (score === null) return 'border border-surface-border'
  if (score >= 7) return 'border border-success/40'
  if (score >= 5) return 'border border-warning/40'
  return 'border border-danger/40'
}

export const scorePill = (score: number | null) => {
  if (score === null) return 'bg-surface-page text-text-muted'
  if (score >= 7) return 'bg-success text-white'
  if (score >= 5) return 'bg-warning text-white'
  return 'bg-danger text-white'
}

export const formatCurrency = (val: number) => {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`
  if (val >= 1_000_000)     return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000)         return `$${(val / 1_000).toFixed(0)}K`
  return `$${val}`
}
