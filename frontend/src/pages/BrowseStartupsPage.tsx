import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, MapPin, Users, Send, SlidersHorizontal, CheckCircle } from 'lucide-react'
import { INDUSTRIES, STAGES, formatCurrency } from '@/types'
import { fadeUp } from '@/lib/motionConfig'
import clsx from 'clsx'

const scoreColor=(s:number)=>s>=7?'#22c55e':s>=5?'#f59e0b':'#ef4444'

function TiltCard({ children, className }: { children: React.ReactNode; className: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX-r.left)/r.width-.5, y = (e.clientY-r.top)/r.height-.5
    el.style.transform = `perspective(700px) rotateX(${-y*8}deg) rotateY(${x*8}deg) translateZ(6px)`
  }, [])
  const onLeave = useCallback(() => {
    const el = ref.current; if (!el) return
    el.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateZ(0)'
    el.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)'
    setTimeout(() => { if (el) el.style.transition = '' }, 500)
  }, [])
  return <div ref={ref} className={className} onMouseMove={onMove} onMouseLeave={onLeave} style={{ willChange:'transform', transition:'transform .1s ease' }}>{children}</div>
}

export default function BrowseStartupsPage() {
  const qc = useQueryClient()
  const [search, setSearch]   = useState('')
  const [industry, setInd]    = useState('')
  const [stage, setStage]     = useState('')
  const [page, setPage]       = useState(1)
  const [filters, setFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey:['browse-startups', search, industry, stage, page],
    queryFn:()=>api.get('/browse/startups',{params:{search,industry,stage,page,limit:12}}).then(r=>r.data),
    placeholderData:prev=>prev,
  })
  const connectM = useMutation({
    mutationFn:({uid}:{uid:string})=>api.post('/connections',{target_user_id:uid}),
    onSuccess:()=>void qc.invalidateQueries({queryKey:['connections']}),
  })

  const startups=data?.data||[], total=data?.meta?.total||0, pages=data?.meta?.totalPages||1

  return (
    <div className="p-5 md:p-7 max-w-6xl mx-auto">

      {/* Header */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="card p-5 mb-5 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px" style={{background:'linear-gradient(90deg,transparent,rgba(133,199,242,.2),transparent)'}}/>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight" style={{color:'#e8edf5'}}>Find startups</h1>
            <p className="text-sm mt-0.5" style={{color:'#4e5f7a'}}>{total>0?`${total} verified startups`:'Discovering…'}</p>
          </div>
          <button onClick={()=>setFilters(v=>!v)}
            className={clsx('btn btn-ghost text-sm gap-1.5',filters&&'text-brand-400 border border-brand-400/20')}
            style={filters?{background:'rgba(133,199,242,.06)'}:{}}>
            <SlidersHorizontal size={14}/> Filters
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{color:'#4e5f7a'}}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search name, industry, location…" className="input pl-10"/>
        </div>
        <AnimatePresence>
          {filters && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="mt-4 grid sm:grid-cols-2 gap-3 overflow-hidden">
              <select value={industry} onChange={e=>{setInd(e.target.value);setPage(1)}} className="input"><option value="">All industries</option>{INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}</select>
              <select value={stage}    onChange={e=>{setStage(e.target.value);setPage(1)}} className="input"><option value="">All stages</option>{STAGES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-brand-400/20 border-t-brand-400 animate-spin"/></div>
      ) : startups.length===0 ? (
        <div className="card p-16 text-center"><p className="font-display font-semibold text-lg mb-1" style={{color:'#e8edf5'}}>No startups found</p><p className="text-sm" style={{color:'#4e5f7a'}}>Try adjusting your search or filters</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {startups.map((s:any, i:number) => (
            <motion.div key={s.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.04}}>
              <TiltCard className="card card-hover h-full flex flex-col">
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:'rgba(133,199,242,.07)',border:'1px solid rgba(30,45,71,.8)'}}>
                        <span className="font-display font-bold text-sm" style={{color:'#85C7F2'}}>{(s.name||'?')[0].toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-semibold truncate" style={{color:'#e8edf5'}}>{s.name}</p>
                        <p className="text-xs" style={{color:'#4e5f7a'}}>{s.industry}</p>
                      </div>
                    </div>
                    {s.ml_score!=null && (
                      <span className="font-mono font-bold text-xs shrink-0 px-2 py-1 rounded-full" style={{background:`${scoreColor(s.ml_score)}12`,border:`1px solid ${scoreColor(s.ml_score)}25`,color:scoreColor(s.ml_score)}}>
                        {s.ml_score}/10
                      </span>
                    )}
                  </div>

                  {s.description && <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{color:'#8896ae'}}>{s.description}</p>}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="badge badge-brand text-xs capitalize">{s.stage?.replace('-',' ')}</span>
                    {s.location&&<span className="flex items-center gap-1 text-xs" style={{color:'#4e5f7a'}}><MapPin size={10}/>{s.location}</span>}
                    {s.team_size>0&&<span className="flex items-center gap-1 text-xs" style={{color:'#4e5f7a'}}><Users size={10}/>{s.team_size}</span>}
                  </div>

                  {s.funding_total_usd>0 && (
                    <div className="flex items-center gap-1 text-xs mb-3" style={{color:'#8896ae'}}><Zap size={10} style={{color:'#85C7F2'}}/>{formatCurrency(s.funding_total_usd)} raised</div>
                  )}

                  {s.ml_result?.probabilities && (
                    <div className="space-y-1.5 mb-3">
                      {Object.entries(s.ml_result.probabilities).slice(0,2).map(([lbl,prob])=>{
                        const pct=Math.round((prob as number)*100)
                        const c=lbl==='Positive exit'?'#22c55e':lbl==='Sustainability'?'#f59e0b':'#ef4444'
                        return (
                          <div key={lbl} className="flex items-center gap-2">
                            <span className="text-2xs shrink-0 w-20" style={{color:'#4e5f7a'}}>{lbl}</span>
                            <div className="flex-1 h-1 rounded-full" style={{background:'rgba(255,255,255,.05)'}}>
                              <motion.div className="h-full rounded-full" style={{background:c}} initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:.8,delay:i*.03}}/>
                            </div>
                            <span className="font-mono text-2xs w-6 text-right" style={{color:'#4e5f7a'}}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-auto pt-3" style={{borderTop:'1px solid rgba(30,45,71,.6)'}}>
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:.97}}
                      onClick={()=>connectM.mutate({uid:s.user_id})} disabled={connectM.isPending}
                      className="btn btn-secondary w-full text-xs gap-1.5"><Send size={11}/> Connect</motion.button>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages>1 && (
        <div className="flex gap-2 justify-center mt-6">
          {Array.from({length:pages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setPage(p)}
              className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
              style={page===p?{background:'rgba(133,199,242,.12)',border:'1px solid rgba(133,199,242,.25)',color:'#85C7F2'}:{border:'1px solid rgba(30,45,71,.8)',color:'#4e5f7a'}}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
