import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GitBranch, ShieldCheck, Zap, ArrowRight, Users, Building2, TrendingUp, Clock, CheckCircle, AlertCircle, Sparkles, Activity, BarChart3, Globe, Target } from 'lucide-react'
import { fadeUp, staggerContainer, staggerFast, springPop } from '@/lib/motionConfig'
import { useEffect, useRef, useState } from 'react'
import { uploadUrl } from '@/lib/uploadUrl'
import clsx from 'clsx'

// ── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, duration = 900 }: { to: number; duration?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.max(1, Math.ceil(to / (duration / 16)))
    const id = setInterval(() => {
      start = Math.min(start + step, to)
      setN(start)
      if (start >= to) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [to, duration])
  return <>{n}</>
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 36, C = 2 * Math.PI * r
  const pct = score / 10
  const color = score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="6" />
        <motion.circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - pct * C }}
          transition={{ duration: 1.2, ease: [.22,1,.36,1], delay: .3 }}
          style={{ filter:`drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-xl leading-none" style={{ color }}>{score}</span>
        <span className="text-2xs" style={{ color:'#4e5f7a' }}>/10</span>
      </div>
    </div>
  )
}

// ── Spark bar ─────────────────────────────────────────────────────────────────
function SparkBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="spark-track">
      <motion.div className="spark-fill" style={{ background: color }}
        initial={{ width:0 }}
        animate={{ width:`${pct}%` }}
        transition={{ duration:.9, ease:[.22,1,.36,1] }}
      />
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: React.ElementType; label: string; value: string|number; sub: string; color: string; href: string
}) {
  return (
    <motion.div variants={springPop}>
      <Link to={href} className="card card-hover block p-5 group">
        <div className="flex items-start justify-between mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background:`${color}12`, border:`1px solid ${color}25` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <ArrowRight size={13} style={{ color:'#2d3d55' }} className="group-hover:text-brand-400 transition-colors mt-0.5" />
        </div>
        <p className="stat-number text-2xl font-bold mb-0.5" style={{ color }}>{value}</p>
        <p className="text-xs font-medium" style={{ color:'#8896ae' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color:'#4e5f7a' }}>{sub}</p>
      </Link>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const isStartup = user?.role === 'startup'

  const { data: profile }  = useQuery({ queryKey:['my-profile', user?.role], queryFn: () => api.get(`/profiles/${user?.role}`).then(r => r.data) })
  const { data: conns=[] } = useQuery({ queryKey:['connections'], queryFn: () => api.get('/connections').then(r => r.data) })
  const { data: verStatus} = useQuery({ queryKey:['verification-status'], queryFn: () => api.get('/verification/status').then(r => r.data) })
  const { data: browse }   = useQuery({ queryKey:['browse-preview'], queryFn: () => api.get(isStartup ? '/browse/investors?limit=4' : '/browse/startups?limit=4').then(r => r.data), enabled:!!user })

  const pending    = conns.filter((c:any) => c.status==='pending').length
  const accepted   = conns.filter((c:any) => c.status==='accepted').length
  const isVerified = verStatus?.status === 'approved'
  const verPending = verStatus?.status === 'pending'
  const photoSrc   = uploadUrl(isStartup ? profile?.logo_url : profile?.photo_url)

  const steps = isStartup ? [
    { done:!!profile?.name,           label:'Basic info',        href:'/profile/startup'  },
    { done:!!profile?.description,    label:'Description',       href:'/profile/startup'  },
    { done:!!profile?.logo_url,       label:'Logo uploaded',     href:'/profile/startup'  },
    { done:!!profile?.pitch_deck_url, label:'Pitch deck',        href:'/profile/startup'  },
    { done:isVerified,                label:'Verified',          href:'/verification'     },
    { done:profile?.ml_score!=null,   label:'ML score run',      href:'/insights'         },
  ] : [
    { done:!!profile?.name,           label:'Basic info',        href:'/profile/investor' },
    { done:!!profile?.bio,            label:'Bio added',         href:'/profile/investor' },
    { done:!!profile?.photo_url,      label:'Photo uploaded',    href:'/profile/investor' },
    { done:!!profile?.linkedin_url,   label:'LinkedIn',          href:'/profile/investor' },
    { done:(profile?.preferred_industries||[]).length>0, label:'Industries', href:'/profile/investor' },
    { done:isVerified,                label:'Verified',          href:'/verification'     },
  ]
  const pct = Math.round(steps.filter(s=>s.done).length/steps.length*100)

  const scoreColor = (s:number|null) => !s ? '#4e5f7a' : s>=7 ? '#22c55e' : s>=5 ? '#f59e0b' : '#ef4444'

  return (
    <div className="p-5 md:p-7 max-w-6xl mx-auto space-y-5">

      {/* Welcome */}
      <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
        <motion.div variants={fadeUp} className="card card-hover p-5 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none" style={{ background:'radial-gradient(circle, rgba(133,199,242,.04) 0%, transparent 70%)' }} />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl overflow-hidden border flex items-center justify-center shrink-0" style={{ borderColor:'rgba(30,45,71,.8)', background:'rgba(12,18,32,.8)' }}>
                {photoSrc
                  ? <img src={photoSrc} className="w-full h-full object-cover" alt="" />
                  : <span className="font-display font-bold text-lg" style={{ color:'#85C7F2' }}>{(profile?.name||user?.email||'U')[0].toUpperCase()}</span>
                }
              </div>
              <div>
                <h1 className="font-display font-semibold text-lg tracking-tight" style={{ color:'#e8edf5' }}>
                  {profile?.name ? `Welcome back, ${profile.name}` : 'Welcome back'}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs capitalize" style={{ color:'#4e5f7a' }}>{user?.role}</span>
                  <span style={{ color:'#1e2d47' }}>·</span>
                  {isVerified
                    ? <span className="flex items-center gap-1 text-xs" style={{ color:'#22c55e' }}><CheckCircle size={10} /> Verified</span>
                    : verPending
                      ? <span className="flex items-center gap-1 text-xs" style={{ color:'#f59e0b' }}><Clock size={10} /> Pending review</span>
                      : <Link to="/verification" className="flex items-center gap-1 text-xs transition-colors" style={{ color:'#ef4444' }}><AlertCircle size={10} /> Not verified</Link>
                  }
                </div>
              </div>
            </div>
            <Link to={isStartup ? '/browse/investors' : '/browse/startups'} className="btn btn-primary gap-2 text-sm shrink-0">
              {isStartup ? <Users size={14} /> : <Building2 size={14} />}
              {isStartup ? 'Find investors' : 'Find startups'}
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="visible" variants={{ visible:{ transition:{ staggerChildren:.06, delayChildren:.1 } } }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={GitBranch} label="Connections" value={accepted} sub="active"
          color="#85C7F2" href="/connections" />
        <StatCard icon={Clock} label="Pending" value={pending} sub="requests"
          color={pending>0?'#f59e0b':'#4e5f7a'} href="/connections" />
        {isStartup
          ? <StatCard icon={Zap} label="ML Score" value={profile?.ml_score!=null?`${profile.ml_score}/10`:'—'} sub={profile?.ml_result?.predicted_label||'not run'}
              color={scoreColor(profile?.ml_score)} href="/insights" />
          : <StatCard icon={Target} label="Profile" value={`${pct}%`} sub="complete"
              color={pct===100?'#22c55e':'#f59e0b'} href={`/profile/investor`} />
        }
        <StatCard icon={ShieldCheck} label="Status"
          value={isVerified?'Verified':verPending?'Pending':'Unverified'}
          sub={isVerified?'full access':'action needed'}
          color={isVerified?'#22c55e':verPending?'#f59e0b':'#ef4444'} href="/verification" />
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Profile completion */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2 }}
          className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color:'#e8edf5' }}>
              <Activity size={14} style={{ color:'#85C7F2' }} /> Profile completion
            </h2>
            <span className="stat-number text-sm font-bold" style={{ color: pct===100?'#22c55e':'#f59e0b' }}>{pct}%</span>
          </div>
          <SparkBar pct={pct} color={pct===100?'#22c55e':'linear-gradient(90deg,#85C7F2,#8b5cf6)'} />
          <div className="mt-4 space-y-1.5">
            {steps.map(({ done, label, href }) => (
              <Link key={label} to={href} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-all hover:bg-white/2 group">
                <motion.div initial={false} animate={done ? { scale:[1.3,1], opacity:1 } : { scale:1, opacity:1 }}
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={done ? { background:'#22c55e', boxShadow:'0 0 8px rgba(34,197,94,.4)' } : { border:'1px solid rgba(30,45,71,.9)' }}>
                  {done && <CheckCircle size={10} style={{ color:'#060a10' }} />}
                </motion.div>
                <span className={done ? 'line-through opacity-40 text-xs' : 'text-xs'} style={{ color: done?'#4e5f7a':'#8896ae' }}>{label}</span>
                {!done && <ArrowRight size={11} style={{ color:'#2d3d55' }} className="ml-auto group-hover:text-brand-400 transition-colors" />}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ML panel */}
        {isStartup ? (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.25 }}
            className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color:'#e8edf5' }}>
                <Sparkles size={14} style={{ color:'#85C7F2' }} /> ML success score
              </h2>
              <Link to="/insights" className="text-xs flex items-center gap-1 transition-colors hover:text-brand-200" style={{ color:'#85C7F2' }}>
                Full report <ArrowRight size={11} />
              </Link>
            </div>
            {profile?.ml_result ? (
              <>
                <ScoreRing score={profile.ml_score} />
                <p className="text-center text-xs mt-2 mb-4" style={{ color:'#4e5f7a' }}>{profile.ml_result.predicted_label} · {Math.round(profile.ml_result.confidence*100)}% confidence</p>
                <div className="space-y-2.5">
                  {Object.entries(profile.ml_result.probabilities).map(([lbl, prob]) => {
                    const pct = Math.round((prob as number)*100)
                    const c = lbl==='Positive exit'?'#22c55e':lbl==='Sustainability'?'#f59e0b':'#ef4444'
                    return (
                      <div key={lbl} className="flex items-center gap-3">
                        <span className="text-2xs shrink-0 w-24" style={{ color:'#4e5f7a' }}>{lbl}</span>
                        <div className="flex-1"><SparkBar pct={pct} color={c} /></div>
                        <span className="font-mono text-xs w-7 text-right" style={{ color:'#8896ae' }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background:'rgba(133,199,242,.06)', border:'1px solid rgba(133,199,242,.12)' }}>
                  <Zap size={22} style={{ color:'#85C7F2' }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color:'#e8edf5' }}>No score yet</p>
                <p className="text-xs mb-4" style={{ color:'#4e5f7a' }}>Complete your profile then run your first prediction</p>
                <Link to="/insights" className="btn btn-secondary text-sm gap-1.5"><Zap size={12} /> Run prediction</Link>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.25 }}
            className="card p-5">
            <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4" style={{ color:'#e8edf5' }}>
              <BarChart3 size={14} style={{ color:'#85C7F2' }} /> Investment overview
            </h2>
            <div className="space-y-2.5">
              {[
                { label:'Ticket range', value: profile?.ticket_min_usd>0 ? `₹${(profile.ticket_min_usd/1e5).toFixed(0)}L – ₹${(profile.ticket_max_usd/1e5).toFixed(0)}L` : 'Not set' },
                { label:'Industries',   value: `${(profile?.preferred_industries||[]).length} selected` },
                { label:'Stages',       value: `${(profile?.investment_stages||[]).length} selected` },
                { label:'Portfolio',    value: `${(profile?.portfolio||[]).length} companies` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(30,45,71,.8)' }}>
                  <span className="text-sm" style={{ color:'#8896ae' }}>{label}</span>
                  <span className="font-mono text-sm font-medium" style={{ color:'#e8edf5' }}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Recent connections */}
      {conns.length > 0 && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3 }}
          className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color:'#e8edf5' }}>
              <GitBranch size={14} style={{ color:'#85C7F2' }} /> Recent connections
            </h2>
            <Link to="/connections" className="text-xs flex items-center gap-1 transition-colors hover:text-brand-200" style={{ color:'#85C7F2' }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {conns.slice(0,4).map((c:any, i:number) => (
              <motion.div key={c.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.05 }}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors hover:bg-white/2"
                style={{ border:'1px solid rgba(30,45,71,.6)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background:'rgba(133,199,242,.07)', border:'1px solid rgba(30,45,71,.8)' }}>
                    <span className="text-xs font-bold" style={{ color:'#85C7F2' }}>{(c.other_name||'?')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color:'#e8edf5' }}>{c.other_name}</p>
                    <p className="text-xs" style={{ color:'#4e5f7a' }}>{new Date(c.created_at).toLocaleDateString('en-IN',{ day:'numeric',month:'short' })}</p>
                  </div>
                </div>
                <span className={`badge text-2xs ${c.status==='accepted'?'badge-success':c.status==='pending'?'badge-warning':'badge-danger'}`}>{c.status}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Discover preview */}
      {browse?.data?.length > 0 && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.35 }}
          className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color:'#e8edf5' }}>
              <Globe size={14} style={{ color:'#85C7F2' }} />
              {isStartup ? 'Investors you might like' : 'Startups to explore'}
            </h2>
            <Link to={isStartup?'/browse/investors':'/browse/startups'} className="text-xs flex items-center gap-1 hover:text-brand-200 transition-colors" style={{ color:'#85C7F2' }}>
              Browse all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {browse.data.slice(0,4).map((item:any, i:number) => (
              <motion.div key={item.id} initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*.05 }}
                className="p-3 rounded-xl transition-all hover:bg-white/2 cursor-default"
                style={{ border:'1px solid rgba(30,45,71,.7)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background:'rgba(133,199,242,.06)', border:'1px solid rgba(30,45,71,.8)' }}>
                  <span className="text-xs font-bold" style={{ color:'#85C7F2' }}>{(item.name||'?')[0].toUpperCase()}</span>
                </div>
                <p className="text-sm font-medium truncate" style={{ color:'#e8edf5' }}>{item.name}</p>
                <p className="text-xs truncate" style={{ color:'#4e5f7a' }}>{isStartup?item.investor_type:item.industry}</p>
                {!isStartup && item.ml_score!=null && (
                  <p className="text-xs font-mono font-bold mt-1" style={{ color: item.ml_score>=7?'#22c55e':item.ml_score>=5?'#f59e0b':'#ef4444' }}>{item.ml_score}/10</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div initial="hidden" animate="visible" variants={{ visible:{ transition:{ staggerChildren:.06, delayChildren:.4 } } }}
        className="grid sm:grid-cols-3 gap-4">
        {[
          isStartup
            ? { to:'/insights', icon:TrendingUp, label:'Run ML prediction', sub:'Get your VentureSpan score', color:'#85C7F2' }
            : { to:'/browse/startups', icon:Building2, label:'Discover startups', sub:'Browse verified opportunities', color:'#85C7F2' },
          { to:'/connections', icon:GitBranch,
            label: pending>0 ? `${pending} pending request${pending>1?'s':''}` : 'Manage connections',
            sub: pending>0 ? 'Awaiting your response' : 'View your network',
            color: pending>0 ? '#f59e0b' : '#8896ae' },
          { to:'/verification', icon:ShieldCheck,
            label: isVerified?'Verified account':verPending?'Verification pending':'Get verified',
            sub: isVerified?'Full platform access':'Required to appear in search',
            color: isVerified?'#22c55e':verPending?'#f59e0b':'#ef4444' },
        ].map(({ to, icon:Icon, label, sub, color }) => (
          <motion.div key={to} variants={springPop}>
            <Link to={to} className="card card-hover flex items-center gap-3 p-4 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background:`${color}10`, border:`1px solid ${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color:'#e8edf5' }}>{label}</p>
                <p className="text-xs truncate" style={{ color:'#4e5f7a' }}>{sub}</p>
              </div>
              <ArrowRight size={13} style={{ color:'#2d3d55' }} className="shrink-0 group-hover:text-brand-400 transition-colors" />
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
