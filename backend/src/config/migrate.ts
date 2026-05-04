import { query } from './db'
import dotenv from 'dotenv'
dotenv.config()

const migrate = async () => {
  console.log('Running migrations...')

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL CHECK (role IN ('startup', 'investor')),
      verified   BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS startup_profiles (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id           UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name              TEXT NOT NULL DEFAULT '',
      industry          TEXT NOT NULL DEFAULT 'Other',
      stage             TEXT NOT NULL DEFAULT 'idea'
                        CHECK (stage IN ('idea','pre-seed','seed','series-a','series-b','growth')),
      location          TEXT NOT NULL DEFAULT '',
      country_code      TEXT NOT NULL DEFAULT 'Other',
      team_size         INTEGER DEFAULT 1,
      funding_total_usd BIGINT DEFAULT 0,
      funding_rounds    INTEGER DEFAULT 0,
      milestones        INTEGER DEFAULT 0,
      relationships     INTEGER DEFAULT 0,
      company_age       INTEGER DEFAULT 0,
      description       TEXT DEFAULT '',
      pitch_deck_url    TEXT,
      logo_url          TEXT,
      banner_url        TEXT,
      website           TEXT,
      ml_score          NUMERIC(4,2),
      ml_result         JSONB,
      ml_score_visible  BOOLEAN DEFAULT TRUE,
      ml_updated_at     TIMESTAMPTZ,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS investor_profiles (
      id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id              UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name                 TEXT NOT NULL DEFAULT '',
      firm_name            TEXT DEFAULT '',
      investor_type        TEXT DEFAULT 'individual'
                           CHECK (investor_type IN ('individual','angel','vc','family_office','corporate')),
      investment_stages    TEXT[] DEFAULT '{}',
      ticket_min_usd       BIGINT DEFAULT 0,
      ticket_max_usd       BIGINT DEFAULT 0,
      preferred_industries TEXT[] DEFAULT '{}',
      location             TEXT DEFAULT '',
      country_code         TEXT DEFAULT 'Other',
      bio                  TEXT DEFAULT '',
      website              TEXT,
      linkedin_url         TEXT,
      photo_url            TEXT,
      banner_url           TEXT,
      portfolio            JSONB DEFAULT '[]',
      created_at           TIMESTAMPTZ DEFAULT NOW(),
      updated_at           TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS connections (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      startup_id  UUID REFERENCES users(id) ON DELETE CASCADE,
      investor_id UUID REFERENCES users(id) ON DELETE CASCADE,
      status      TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','rejected')),
      message     TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(startup_id, investor_id)
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS verification_requests (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
      document_url TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
      admin_note   TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  await query(`CREATE INDEX IF NOT EXISTS idx_startup_industry   ON startup_profiles(industry);`)
  await query(`CREATE INDEX IF NOT EXISTS idx_startup_stage      ON startup_profiles(stage);`)
  await query(`CREATE INDEX IF NOT EXISTS idx_startup_country    ON startup_profiles(country_code);`)
  await query(`CREATE INDEX IF NOT EXISTS idx_connections_startup  ON connections(startup_id);`)
  await query(`CREATE INDEX IF NOT EXISTS idx_connections_investor ON connections(investor_id);`)

  // Safe column additions for existing databases
  await query(`ALTER TABLE startup_profiles  ADD COLUMN IF NOT EXISTS logo_url   TEXT;`)
  await query(`ALTER TABLE startup_profiles  ADD COLUMN IF NOT EXISTS banner_url TEXT;`)
  await query(`ALTER TABLE investor_profiles ADD COLUMN IF NOT EXISTS photo_url  TEXT;`)
  await query(`ALTER TABLE investor_profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;`)

  console.log('Migrations complete.')
  process.exit(0)
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1) })
