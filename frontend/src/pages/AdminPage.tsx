import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, ShieldCheck, ExternalLink } from 'lucide-react'
import { uploadUrl } from '@/lib/uploadUrl'
import { staggerContainer, fadeUp } from '@/lib/motionConfig'

const SECRET = (import.meta as any).env?.VITE_ADMIN_SECRET || ''
const adminHeaders = { 'x-admin-secret': SECRET }

const adminApi = {
  verifications: () =>
    api.get('/admin/verifications', { headers: adminHeaders }).then(r => r.data),
  users: () =>
    api.get('/admin/users', { headers: adminHeaders }).then(r => r.data),
  respond: (id: string, action: string, note: string) =>
    api.patch(`/admin/verifications/${id}`, { action, note }, { headers: adminHeaders }).then(r => r.data),
  verify: (email: string, verified: boolean) =>
    api.post('/admin/verify-user', { email, verified }, { headers: adminHeaders }).then(r => r.data),
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,.08)'  },
  approved: { color: '#22c55e', bg: 'rgba(34,197,94,.08)'   },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,.08)'   },
}

export default function AdminPage() {
  const qc = useQueryClient()
  const [tab,      setTab]      = useState<'verifications' | 'users'>('verifications')
  const [notes,    setNotes]    = useState<Record<string, string>>({})
  const [email,    setEmail]    = useState('')

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: verifs = [], isError } = useQuery({
    queryKey: ['admin-verifs'],
    queryFn:  adminApi.verifications,
    retry:    false,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn:  adminApi.users,
    retry:    false,
    enabled:  tab === 'users',
  })

  // ── Mutations ──────────────────────────────────────────────────────────────
  const respondM = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      adminApi.respond(id, action, notes[id] || ''),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-verifs'] }),
  })

  const verifyM = useMutation({
    mutationFn: ({ e, v }: { e: string; v: boolean }) => adminApi.verify(e, v),
    onSuccess:  () => {
      void qc.invalidateQueries({ queryKey: ['admin-users'] })
      setEmail('')
    },
  })

  const pending = (verifs as any[]).filter(v => v.status === 'pending').length

  // ── Access denied ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <p className="font-display font-semibold" style={{ color: '#ef4444' }}>Access denied</p>
        <p className="text-sm mt-1" style={{ color: '#4e5f7a' }}>
          Check your <code>VITE_ADMIN_SECRET</code> environment variable.
        </p>
      </div>
    )
  }

  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto">
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-5">

        {/* Header */}
        <motion.div variants={fadeUp}>
          <h1 className="font-display font-bold text-2xl tracking-tight flex items-center gap-2"
            style={{ color: '#e8edf5' }}>
            <ShieldCheck size={22} style={{ color: '#85C7F2' }} />
            Admin panel
          </h1>
          <p className="text-sm mt-1" style={{ color: '#4e5f7a' }}>
            VentureSpan internal — do not share this URL
          </p>
        </motion.div>

        {/* Quick verify */}
        <motion.div variants={fadeUp} className="card p-5">
          <h2 className="font-display font-semibold text-sm mb-3" style={{ color: '#e8edf5' }}>
            Quick verify by email
          </h2>
          <div className="flex gap-3 flex-wrap">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input flex-1 min-w-48"
              placeholder="user@example.com"
            />
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
              onClick={() => verifyM.mutate({ e: email, v: true })}
              disabled={!email || verifyM.isPending}
              className="btn btn-primary text-sm gap-1.5 whitespace-nowrap"
            >
              <CheckCircle size={13} /> Verify
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
              onClick={() => verifyM.mutate({ e: email, v: false })}
              disabled={!email || verifyM.isPending}
              className="btn btn-danger text-sm gap-1.5 whitespace-nowrap"
            >
              <XCircle size={13} /> Unverify
            </motion.button>
          </div>
          {verifyM.isSuccess && <p className="text-xs mt-2" style={{ color: '#22c55e' }}>Done!</p>}
          {verifyM.isError   && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>User not found</p>}
        </motion.div>

        {/* Tabs */}
        <motion.div variants={fadeUp}
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(30,45,71,.8)' }}>
          {([
            { k: 'verifications' as const, l: 'Verification requests', count: pending },
            { k: 'users'         as const, l: 'All users',  count: 0 },
          ]).map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
              style={tab === t.k
                ? { background: 'rgba(133,199,242,.08)', border: '1px solid rgba(133,199,242,.2)', color: '#85C7F2' }
                : { color: '#4e5f7a' }
              }
            >
              {t.l}
              {'count' in t && t.count > 0 && (
                <span className="text-2xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: '#f59e0b', color: '#060a10' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* ── Verifications tab ── */}
        {tab === 'verifications' && (
          <div className="space-y-3">
            {(verifs as any[]).length === 0 && (
              <div className="card p-16 text-center">
                <Clock size={36} className="mx-auto mb-3" style={{ color: 'rgba(133,199,242,.2)' }} />
                <p style={{ color: '#4e5f7a' }}>No verification requests yet</p>
              </div>
            )}

            {(verifs as any[]).map((v: any) => {
              const ss = STATUS_STYLE[v.status] || STATUS_STYLE.pending
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-5"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Left — info */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-medium" style={{ color: '#e8edf5' }}>
                          {v.profile_name || v.email}
                        </p>
                        <span
                          className="badge text-2xs"
                          style={{ background: ss.bg, border: `1px solid ${ss.color}20`, color: ss.color }}
                        >
                          {v.status}
                        </span>
                        <span className="badge badge-neutral text-2xs capitalize">{v.role}</span>
                      </div>
                      <p className="text-sm" style={{ color: '#4e5f7a' }}>{v.email}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#2d3d55' }}>
                        {new Date(v.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                      {v.document_url && (
                        <a
                          href={uploadUrl(v.document_url) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs mt-1.5 font-medium transition-colors"
                          style={{ color: '#85C7F2' }}
                        >
                          <ExternalLink size={10} /> View document
                        </a>
                      )}
                    </div>

                    {/* Right — actions (pending only) */}
                    {v.status === 'pending' && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <input
                          value={notes[v.id] || ''}
                          onChange={e => setNotes(m => ({ ...m, [v.id]: e.target.value }))}
                          className="input text-xs w-52"
                          placeholder="Optional note…"
                        />
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
                            onClick={() => respondM.mutate({ id: v.id, action: 'approved' })}
                            disabled={respondM.isPending}
                            className="btn text-xs gap-1 flex-1 font-semibold"
                            style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)', color: '#22c55e' }}
                          >
                            <CheckCircle size={11} /> Approve
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
                            onClick={() => respondM.mutate({ id: v.id, action: 'rejected' })}
                            disabled={respondM.isPending}
                            className="btn text-xs gap-1 flex-1"
                            style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#ef4444' }}
                          >
                            <XCircle size={11} /> Reject
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {v.status !== 'pending' && v.admin_note && (
                      <p className="text-xs italic" style={{ color: '#4e5f7a' }}>"{v.admin_note}"</p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* ── Users tab ── */}
        {tab === 'users' && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead style={{ background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(30,45,71,.8)' }}>
                <tr>
                  {['Name / email', 'Role', 'Status', 'Joined'].map(col => (
                    <th key={col}
                      className="text-left px-4 py-3 text-2xs font-medium uppercase tracking-wider"
                      style={{ color: '#4e5f7a' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(users as any[]).map((u: any, i: number) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={i > 0 ? { borderTop: '1px solid rgba(30,45,71,.5)' } : {}}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: '#e8edf5' }}>{u.name || '—'}</p>
                      <p className="text-xs" style={{ color: '#4e5f7a' }}>{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-2xs capitalize ${u.role === 'startup' ? 'badge-brand' : 'badge-violet'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.verified
                        ? <span className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
                            <CheckCircle size={11} /> Verified
                          </span>
                        : <span className="text-xs" style={{ color: '#2d3d55' }}>Not verified</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#4e5f7a' }}>
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </motion.div>
    </div>
  )
}
