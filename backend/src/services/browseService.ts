import { query } from '../config/db'

export interface StartupFilters {
  industry?: string
  stage?: string
  country_code?: string
  search?: string
  page?: number
  limit?: number
}

export interface InvestorFilters {
  industry?: string
  country_code?: string
  min_ticket?: number
  max_ticket?: number
  search?: string
  page?: number
  limit?: number
}

export const browseStartups = async (filters: StartupFilters, viewerUserId: string) => {
  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(50, filters.limit || 12)
  const offset = (page - 1) * limit

  const conditions: string[] = ['u.verified = true', 'sp.name != \'\'']
  const params: unknown[] = []
  let p = 1

  if (filters.industry) {
    conditions.push(`sp.industry = $${p++}`)
    params.push(filters.industry)
  }
  if (filters.stage) {
    conditions.push(`sp.stage = $${p++}`)
    params.push(filters.stage)
  }
  if (filters.country_code) {
    conditions.push(`sp.country_code = $${p++}`)
    params.push(filters.country_code)
  }
  if (filters.search) {
    conditions.push(`(sp.name ILIKE $${p} OR sp.description ILIKE $${p})`)
    params.push(`%${filters.search}%`)
    p++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const rows = await query(
    `SELECT sp.id, sp.user_id, sp.name, sp.industry, sp.stage, sp.location,
            sp.country_code, sp.team_size, sp.funding_total_usd, sp.description,
            sp.website,
            CASE WHEN sp.ml_score_visible THEN sp.ml_score ELSE NULL END as ml_score,
            u.verified,
            EXISTS(
              SELECT 1 FROM connections c
              WHERE c.startup_id = sp.user_id AND c.investor_id = $${p}
            ) as connected
     FROM startup_profiles sp
     JOIN users u ON u.id = sp.user_id
     ${where}
     ORDER BY sp.updated_at DESC
     LIMIT $${p + 1} OFFSET $${p + 2}`,
    [...params, viewerUserId, limit, offset]
  )

  const countResult = await query(
    `SELECT COUNT(*) FROM startup_profiles sp
     JOIN users u ON u.id = sp.user_id ${where}`,
    params
  )

  return {
    data: rows.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
    pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
  }
}

export const browseInvestors = async (filters: InvestorFilters, viewerUserId: string) => {
  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(50, filters.limit || 12)
  const offset = (page - 1) * limit

  const conditions: string[] = ['u.verified = true', 'ip.name != \'\'']
  const params: unknown[] = []
  let p = 1

  if (filters.industry) {
    conditions.push(`$${p++} = ANY(ip.preferred_industries)`)
    params.push(filters.industry)
  }
  if (filters.country_code) {
    conditions.push(`ip.country_code = $${p++}`)
    params.push(filters.country_code)
  }
  if (filters.min_ticket) {
    conditions.push(`ip.ticket_max_usd >= $${p++}`)
    params.push(filters.min_ticket)
  }
  if (filters.max_ticket) {
    conditions.push(`ip.ticket_min_usd <= $${p++}`)
    params.push(filters.max_ticket)
  }
  if (filters.search) {
    conditions.push(`(ip.name ILIKE $${p} OR ip.firm_name ILIKE $${p} OR ip.bio ILIKE $${p})`)
    params.push(`%${filters.search}%`)
    p++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const rows = await query(
    `SELECT ip.id, ip.user_id, ip.name, ip.firm_name, ip.investor_type,
            ip.investment_stages, ip.ticket_min_usd, ip.ticket_max_usd,
            ip.preferred_industries, ip.location, ip.country_code, ip.bio,
            ip.website, ip.linkedin_url,
            u.verified,
            EXISTS(
              SELECT 1 FROM connections c
              WHERE c.investor_id = ip.user_id AND c.startup_id = $${p}
            ) as connected
     FROM investor_profiles ip
     JOIN users u ON u.id = ip.user_id
     ${where}
     ORDER BY ip.updated_at DESC
     LIMIT $${p + 1} OFFSET $${p + 2}`,
    [...params, viewerUserId, limit, offset]
  )

  const countResult = await query(
    `SELECT COUNT(*) FROM investor_profiles ip
     JOIN users u ON u.id = ip.user_id ${where}`,
    params
  )

  return {
    data: rows.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
    pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
  }
}
