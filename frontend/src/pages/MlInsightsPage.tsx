import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { MlResult, formatCurrency } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Zap, RefreshCw, Eye, EyeOff, Download, Globe } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { generateMlPdf } from '@/lib/generatePdf'
import { fadeUp, staggerContainer } from '@/lib/motionConfig'
import clsx from 'clsx'

const PROB_COLORS = { 'Positive exit':'#22c55e', 'Sustainability':'#f59e0b', 'Failure risk':'#ef4444' }
const REGION_LABEL: Record<string,string> = { India:'Indian ecosystem', USA:'US ecosystem', Other:'Global ecosystem' }
const scoreColor=(s:number|null)=>!s?'#4e5f7a':s>=7?'#22c55e':s>=5?'#f59e0b':'#ef4444'
type Tab = 'overview'|'recommendations'|'percentiles'

function SparkBar({ pct, color }: { pct:number; color:string }) {
  return (
    <div className="spark-track">
      <motion.div className="spark-fill" style={{ background:color }}
        initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:.9, ease:[.22,1,.36,1] }}/>
    </div>
  )
}

function ScoreRing({ score }: { score:number }) {
  const r=48, C=2*Math.PI*r, color=scoreColor(score)
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="7"/>
        <motion.circle cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={C}
          initial={{ strokeDashoffset:C }} animate={{ strokeDashoffset:C-(score/10)*C }}
          transition={{ duration:1.4, ease:[.22,1,.36,1], delay:.3 }}
          style={{ filter:`drop-shadow(0 0 8px ${color})` }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-4xl leading-none" style={{ color }}>{score}</span>
        <span className="text-xs mt-1" style={{ color:'#4e5f7a' }}>/10</span>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-sm" style={{ background:'#0c1220', border:'1px solid rgba(30,45,71,.9)' }}>
      <p style={{ color:'#8896ae' }}>{label}</p>
      <p className="font-mono font-bold" style={{ color:'#e8edf5' }}>{payload[0].value}%</p>
    </div>
  )
}

export default function MlInsightsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')

  const { data: mlData, isLoading } = useQuery({ queryKey:['ml-result'], queryFn:()=>api.get('/ml/result').then(r=>r.data) })
  const { data: profile }            = useQuery({ queryKey:['my-profile','startup'], queryFn:()=>api.get('/profiles/startup').then(r=>r.data) })

  const runMutation = useMutation({
    mutationFn:()=>api.post('/ml/predict').then(r=>r.data),
    onSuccess:()=>{ void qc.invalidateQueries({queryKey:['ml-result']}); void qc.invalidateQueries({queryKey:['my-profile']}) },
  })
  const visMutation = useMutation({
    mutationFn:(v:boolean)=>api.patch('/ml/visibility',{visible:v}),
    onSuccess:()=>void qc.invalidateQueries({queryKey:['my-profile','startup']}),
  })

  const result: MlResult|null = mlData?.ml_result||null
  const score   = mlData?.ml_score??null
  const visible = profile?.ml_score_visible??true
  const region  = result?.region||'Other'

  const probData = result ? Object.entries(result.probabilities).map(([name,value])=>({ name, value:Math.round((value as number)*100) })) : []
  const pctData  = result ? [
    { label:'Funding',    value:result.percentiles.funding_total_usd, cur:formatCurrency(profile?.funding_total_usd||0) },
    { label:'Age',        value:result.percentiles.company_age,       cur:`${profile?.company_age||0}y` },
    { label:'Milestones', value:result.percentiles.milestones,        cur:profile?.milestones||0 },
    { label:'Relships',   value:result.percentiles.relationships,     cur:profile?.relationships||0 },
  ] : []

  if(isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-brand-400/20 border-t-brand-400 animate-spin"/></div>

  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight flex items-center gap-2" style={{color:'#e8edf5'}}>
            <Zap size={22} style={{color:'#85C7F2'}}/> ML Insights
          </h1>
          <p className="text-sm mt-1" style={{color:'#4e5f7a'}}>VentureSpan Score — calibrated for your regional ecosystem</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {result && (
            <button onClick={()=>visMutation.mutate(!visible)} className="btn btn-ghost text-xs gap-1.5">
              {visible?<Eye size={13}/>:<EyeOff size={13}/>}
              {visible?'Visible to investors':'Hidden'}
            </button>
          )}
          <motion.button onClick={()=>runMutation.mutate()} disabled={runMutation.isPending}
            className="btn btn-primary text-sm gap-1.5"
            whileHover={{scale:1.02}} whileTap={{scale:.97}}>
            <RefreshCw size={13} className={runMutation.isPending?'animate-spin':''}/>
            {result?'Rerun':'Run prediction'}
          </motion.button>
        </div>
      </div>

      {runMutation.isError && (
        <div className="rounded-xl px-4 py-3 text-sm mb-4" style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.18)',color:'#ef4444'}}>
          ML service unavailable. Make sure the Python service is running on port 8000.
        </div>
      )}

      {!result ? (
        <motion.div initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:'rgba(133,199,242,.06)',border:'1px solid rgba(133,199,242,.12)'}}>
            <Zap size={28} style={{color:'#85C7F2',opacity:.6}}/>
          </div>
          <h2 className="font-display font-semibold text-xl mb-2" style={{color:'#e8edf5'}}>No prediction yet</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{color:'#4e5f7a'}}>Complete your startup profile with funding data, milestones, and industry details, then run your first prediction.</p>
          <button onClick={()=>runMutation.mutate()} disabled={runMutation.isPending} className="btn btn-primary mx-auto gap-1.5">
            <Zap size={15}/> Run first prediction
          </button>
        </motion.div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-5">

          {/* Score card */}
          <motion.div variants={fadeUp} className="card p-6 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none" style={{background:`radial-gradient(circle, ${scoreColor(score)}08 0%, transparent 70%)`}}/>
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1">
                {/* Region badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="badge badge-brand flex items-center gap-1"><Globe size={10}/> Calibrated for {REGION_LABEL[region]||region}</span>
                </div>
                <p className="text-2xs uppercase tracking-widest mb-2" style={{color:'#4e5f7a'}}>VentureSpan Score</p>
                <div className="flex items-end gap-3 mb-2">
                  <span className="font-mono font-bold" style={{fontSize:'5rem',lineHeight:1,color:scoreColor(score)}}>{score}</span>
                  <span className="text-2xl mb-3" style={{color:'#4e5f7a'}}>/10</span>
                </div>
                <p className="text-sm mb-4" style={{color:'#8896ae'}}>{result.predicted_label} · {Math.round(result.confidence*100)}% confidence</p>
                {/* Score bar */}
                <div className="max-w-xs">
                  <div className="flex justify-between text-2xs mb-1.5" style={{color:'#4e5f7a'}}><span>0</span><span>5</span><span>10</span></div>
                  <SparkBar pct={((score||0)/10)*100} color={scoreColor(score)||'#4e5f7a'}/>
                </div>
              </div>
              <ScoreRing score={score||0}/>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl w-fit" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(30,45,71,.8)'}}>
            {(['overview','recommendations','percentiles'] as Tab[]).map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                  tab===t?'text-brand-400 border border-brand-400/20':'text-ink-tertiary hover:text-secondary')}
                style={tab===t?{background:'rgba(133,199,242,.08)'}:{}}>
                {t}
              </button>
            ))}
          </motion.div>

          {/* Overview */}
          {tab==='overview' && (
            <motion.div key="ov" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="card p-6">
              <h3 className="font-display font-semibold text-sm mb-5" style={{color:'#e8edf5'}}>Outcome probabilities</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={probData} layout="vertical" margin={{left:8,right:32}}>
                  <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:11,fill:'#4e5f7a'}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" tick={{fontSize:12,fill:'#8896ae'}} width={110} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="value" radius={[0,6,6,0]}>
                    {probData.map(e=><Cell key={e.name} fill={PROB_COLORS[e.name as keyof typeof PROB_COLORS]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Recommendations */}
          {tab==='recommendations' && (
            <motion.div key="rec" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="card p-6 space-y-3">
              <h3 className="font-display font-semibold text-sm mb-1" style={{color:'#e8edf5'}}>Actionable improvements</h3>
              <p className="text-xs mb-4" style={{color:'#4e5f7a'}}>Minimal changes that would improve your global ML model score.</p>
              {result.recommendations.length===0 ? (
                <div className="rounded-xl p-4 text-sm" style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.15)',color:'#22c55e'}}>
                  Your profile is already well-optimised. No simple improvements found.
                </div>
              ) : result.recommendations.map(rec=>(
                <motion.div key={rec.feature} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} className="rounded-xl p-4" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(30,45,71,.8)'}}>
                  <p className="font-medium text-sm mb-3" style={{color:'#e8edf5'}}>{rec.label}</p>
                  <div className="flex gap-8 text-sm">
                    <div><p className="text-2xs mb-0.5" style={{color:'#4e5f7a'}}>Current</p>
                      <p className="font-mono font-medium" style={{color:'#8896ae'}}>{rec.feature==='funding_total_usd'?formatCurrency(rec.current):rec.current}</p></div>
                    <div><p className="text-2xs mb-0.5" style={{color:'#4e5f7a'}}>Target</p>
                      <p className="font-mono font-medium" style={{color:'#22c55e'}}>{rec.feature==='funding_total_usd'?formatCurrency(rec.target):rec.target}</p></div>
                    {rec.change_pct!=null&&<div><p className="text-2xs mb-0.5" style={{color:'#4e5f7a'}}>Increase</p><p className="font-mono font-medium" style={{color:'#f59e0b'}}>+{rec.change_pct}%</p></div>}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Percentiles */}
          {tab==='percentiles' && (
            <motion.div key="pct" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="card p-6">
              <h3 className="font-display font-semibold text-sm mb-1" style={{color:'#e8edf5'}}>How you compare</h3>
              <p className="text-xs mb-5" style={{color:'#4e5f7a'}}>Relative to 3,500+ startups in our global training dataset.</p>
              <div className="space-y-5">
                {pctData.map(({label,value,cur})=>{
                  const barColor=value>=75?'#22c55e':value>=50?'#85C7F2':value>=25?'#f59e0b':'#ef4444'
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span style={{color:'#8896ae'}}>{label}</span>
                        <span style={{color:'#e8edf5'}}>{cur} <span className="font-mono font-bold" style={{color:barColor}}>{value}th</span></span>
                      </div>
                      <SparkBar pct={value} color={barColor}/>
                    </div>
                  )
                })}
              </div>
              <div className="mt-5 pt-4" style={{borderTop:'1px solid rgba(30,45,71,.6)'}}>
                <p className="text-xs" style={{color:'#4e5f7a'}}>
                  Percentiles use global training data (skewed US). Your VentureSpan Score above is already adjusted for <strong style={{color:'#8896ae'}}>{REGION_LABEL[region]||region}</strong>.
                </p>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{color:'#2d3d55'}}>
              {mlData?.ml_updated_at && `Updated ${new Date(mlData.ml_updated_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}`}
            </p>
            <button onClick={()=>void generateMlPdf(result,profile)} className="btn btn-ghost text-xs gap-1.5">
              <Download size={13}/> Download PDF
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
