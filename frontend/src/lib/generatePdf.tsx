import { pdf, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { MlResult, StartupProfile, formatCurrency, scoreColor } from '@/types'
import { saveAs } from 'file-saver'

// We polyfill saveAs inline to avoid adding file-saver dep
const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const BRAND_BLUE  = '#85C7F2'
const DARK_BLUE   = '#1A7DB5'
const TEXT_GRAY   = '#4C4C4C'
const LIGHT_GRAY  = '#F7F8F9'
const BORDER      = '#E5E7EB'
const SUCCESS     = '#10B981'
const WARNING     = '#F59E0B'
const DANGER      = '#EF4444'
const TERTIARY    = '#94A89A'

const getScoreColor = (score: number) => score >= 7 ? SUCCESS : score >= 5 ? WARNING : DANGER

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  header: {
    backgroundColor: DARK_BLUE,
    padding: '28 40 24 40',
  },
  headerTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },
  body: {
    padding: '28 40',
  },
  scoreCard: {
    borderRadius: 10,
    padding: '20 24',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreNumber: {
    fontSize: 52,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },
  scoreSub: {
    fontSize: 10,
    color: TEXT_GRAY,
    marginTop: 3,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: DARK_BLUE,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: `1 solid ${BORDER}`,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  infoCard: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 6,
    padding: '10 12',
  },
  infoLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_GRAY,
  },
  probRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  probLabel: {
    width: 100,
    fontSize: 10,
    color: TEXT_GRAY,
  },
  probBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: BORDER,
    borderRadius: 4,
    marginRight: 10,
  },
  probValue: {
    width: 36,
    fontSize: 10,
    color: TEXT_GRAY,
    textAlign: 'right',
  },
  recCard: {
    backgroundColor: '#EBF6FD',
    borderRadius: 6,
    padding: '10 12',
    marginBottom: 8,
    borderLeft: `3 solid ${BRAND_BLUE}`,
  },
  recTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: DARK_BLUE,
    marginBottom: 5,
  },
  recRow: {
    flexDirection: 'row',
    gap: 20,
  },
  recMetric: {
    fontSize: 9,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  recValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_GRAY,
  },
  percentileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  percentileLabel: {
    width: 110,
    fontSize: 10,
    color: TEXT_GRAY,
  },
  percentileBarBg: {
    flex: 1,
    height: 7,
    backgroundColor: BORDER,
    borderRadius: 3,
    marginRight: 8,
  },
  percentileValue: {
    width: 50,
    fontSize: 10,
    color: TEXT_GRAY,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1 solid ${BORDER}`,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
  },
  watermark: {
    fontSize: 8,
    color: TERTIARY,
    fontFamily: 'Helvetica-Bold',
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileItem: {
    width: '47%',
    backgroundColor: LIGHT_GRAY,
    borderRadius: 6,
    padding: '8 10',
  },
})

interface PdfProps {
  result: MlResult
  profile: StartupProfile
}

const MlReportDocument = ({ result, profile }: PdfProps) => {
  const scoreCol = getScoreColor(result.score)
  const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document title="VentureSpan ML Report">
      {/* PAGE 1 — Score + Profile + Probabilities */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>VentureSpan — Startup Success Report</Text>
          <Text style={styles.headerSub}>Generated {now} · Powered by CatBoost ML</Text>
        </View>

        <View style={styles.body}>
          {/* Score card */}
          <View style={[styles.scoreCard, { backgroundColor: scoreCol + '18' }]}>
            <View>
              <Text style={[styles.scoreNumber, { color: scoreCol }]}>{result.score}<Text style={{ fontSize: 24, color: '#9CA3AF' }}>/10</Text></Text>
              <Text style={[styles.scoreLabel, { color: scoreCol }]}>{result.predicted_label}</Text>
              <Text style={styles.scoreSub}>{Math.round(result.confidence * 100)}% model confidence</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 4 }}>Startup</Text>
              <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: TEXT_GRAY }}>{profile.name || 'Unnamed'}</Text>
              <Text style={{ fontSize: 10, color: TEXT_GRAY }}>{profile.industry} · {profile.stage?.replace('-', ' ')}</Text>
              <Text style={{ fontSize: 10, color: TEXT_GRAY }}>{profile.location}</Text>
            </View>
          </View>

          {/* Profile details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Startup profile</Text>
            <View style={styles.profileGrid}>
              {[
                { label: 'Total funding',    value: formatCurrency(profile.funding_total_usd) },
                { label: 'Funding rounds',   value: String(profile.funding_rounds) },
                { label: 'Milestones',       value: String(profile.milestones) },
                { label: 'Relationships',    value: String(profile.relationships) },
                { label: 'Company age',      value: `${profile.company_age} years` },
                { label: 'Team size',        value: String(profile.team_size) },
                { label: 'Country',          value: profile.country_code },
                { label: 'Industry',         value: profile.industry },
              ].map(({ label, value }) => (
                <View key={label} style={styles.profileItem}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Outcome probabilities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outcome probabilities</Text>
            {Object.entries(result.probabilities).map(([label, value]) => {
              const col = label === 'Positive exit' ? SUCCESS : label === 'Sustainability' ? WARNING : DANGER
              return (
                <View key={label} style={styles.probRow}>
                  <Text style={styles.probLabel}>{label}</Text>
                  <View style={styles.probBarBg}>
                    <View style={{ width: `${value * 100}%`, height: 8, backgroundColor: col, borderRadius: 4 }} />
                  </View>
                  <Text style={styles.probValue}>{Math.round(value * 100)}%</Text>
                </View>
              )
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>VentureSpan · Confidential · For informational purposes only</Text>
          <Text style={styles.watermark}>VENTURESPAN</Text>
          <Text style={styles.footerText}>Page 1 of 2</Text>
        </View>
      </Page>

      {/* PAGE 2 — Percentiles + Recommendations */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Benchmarking & Recommendations</Text>
          <Text style={styles.headerSub}>Compared against 3,500+ startups in training dataset</Text>
        </View>

        <View style={styles.body}>
          {/* Percentiles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance percentiles</Text>
            {[
              { label: 'Funding',       pct: result.percentiles.funding_total_usd, current: formatCurrency(profile.funding_total_usd) },
              { label: 'Company age',   pct: result.percentiles.company_age,       current: `${profile.company_age}y` },
              { label: 'Milestones',    pct: result.percentiles.milestones,        current: `${profile.milestones}` },
              { label: 'Relationships', pct: result.percentiles.relationships,     current: `${profile.relationships}` },
            ].map(({ label, pct, current }) => {
              const col = pct >= 75 ? SUCCESS : pct >= 50 ? BRAND_BLUE : pct >= 25 ? WARNING : DANGER
              return (
                <View key={label} style={styles.percentileRow}>
                  <Text style={styles.percentileLabel}>{label} ({current})</Text>
                  <View style={styles.percentileBarBg}>
                    <View style={{ width: `${pct}%`, height: 7, backgroundColor: col, borderRadius: 3 }} />
                  </View>
                  <Text style={styles.percentileValue}>{pct}th pctile</Text>
                </View>
              )
            })}
          </View>

          {/* Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actionable recommendations</Text>
            {result.recommendations.length === 0 ? (
              <View style={[styles.recCard, { backgroundColor: '#D1FAE5', borderLeft: `3 solid ${SUCCESS}` }]}>
                <Text style={[styles.recTitle, { color: SUCCESS }]}>Well optimised</Text>
                <Text style={{ fontSize: 10, color: TEXT_GRAY }}>No simple improvements found. Focus on execution and market timing.</Text>
              </View>
            ) : (
              result.recommendations.map(rec => (
                <View key={rec.feature} style={styles.recCard}>
                  <Text style={styles.recTitle}>{rec.label}</Text>
                  <View style={styles.recRow}>
                    <View>
                      <Text style={styles.recMetric}>Current</Text>
                      <Text style={styles.recValue}>
                        {rec.feature === 'funding_total_usd' ? formatCurrency(rec.current) : rec.current}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.recMetric}>Target</Text>
                      <Text style={[styles.recValue, { color: SUCCESS }]}>
                        {rec.feature === 'funding_total_usd' ? formatCurrency(rec.target) : rec.target}
                      </Text>
                    </View>
                    {rec.change_pct && (
                      <View>
                        <Text style={styles.recMetric}>Increase</Text>
                        <Text style={[styles.recValue, { color: WARNING }]}>+{rec.change_pct}%</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Disclaimer */}
          <View style={{ backgroundColor: LIGHT_GRAY, borderRadius: 6, padding: '10 12', marginTop: 8 }}>
            <Text style={{ fontSize: 9, color: '#9CA3AF', lineHeight: 1.5 }}>
              This report is generated by a machine learning model trained on historical startup data.
              Predictions are probabilistic and should not be used as the sole basis for investment decisions.
              Past patterns do not guarantee future outcomes.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>VentureSpan · Confidential · For informational purposes only</Text>
          <Text style={styles.watermark}>VENTURESPAN</Text>
          <Text style={styles.footerText}>Page 2 of 2</Text>
        </View>
      </Page>
    </Document>
  )
}

export const generateMlPdf = async (result: MlResult, profile: StartupProfile) => {
  const blob = await pdf(<MlReportDocument result={result} profile={profile} />).toBlob()
  const filename = `venturespan-report-${profile.name?.toLowerCase().replace(/\s+/g, '-') || 'startup'}-${new Date().toISOString().slice(0, 10)}.pdf`
  saveBlob(blob, filename)
}
