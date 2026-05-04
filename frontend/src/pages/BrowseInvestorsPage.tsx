import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Send, SlidersHorizontal, Globe, Briefcase } from 'lucide-react'
import { INDUSTRIES, STAGES, INVESTOR_TYPES } from '@/types'
import { uploadUrl } from '@/lib/uploadUrl'
import clsx from 'clsx'

const fmt=(v:number)=>v>=1e7?`₹${(v/1e7).toFixed(1)}Cr`:v>=1e5?`₹${(v/1e5).toFixed(1)}L`:`₹${v}`

function TiltCard({ children, className }: { children: React.ReactNode; className: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5
    el.style.transform=`perspective(700px) rotateX(${-y*8}deg) rotateY(${x*8}deg) translateZ(6px)`
  },[])
  const onLeave = useCallback(()=>{
    const el=ref.current; if(!el) return
    el.style.transform='perspective(700px) rotateX(0) rotateY(0) translateZ(0)'
    el.style.transition='transform .5s cubic-bezier(.22,1,.36,1)'
    setTimeout(()=>{ if(el) el.style.transition='' },500)
  },[])
  return <div ref={ref} className={className} onMouseMove={onMove} onMouseLeave={onLeave} style={{willChange:'transform',transition:'transform .1s ease'}}>{children}</div>
}

export default function BrowseInvestorsPage() {
  const qc = useQueryClient()
  const [search,setSearch]=useState(''), [type,setType]=useState(''), [stage,setStage]=useState(''), [ind,setInd]=useState('')
  const [page,setPage]=useState(1), [filters,setFilters]=useState(false)

  const { data, isLoading } = useQuery({
    queryKey:['browse-investors',search,type,stage,ind,page],
    queryFn:()=>api.get('/browse/investors',{params:{search,investor_type:type,stage,industry:ind,page,limit:12}}).then(r=>r.data),
    placeholderData:prev=>prev,
  })
  const connectM = useMutation({
    mutationFn:({uid}:{uid:string})=>api.post('/connections',{target_user_id:uid}),
    onSuccess:()=>void qc.invalidateQueries({queryKey:['connections']}),
  })

  const investors=data?.data||[], total=data?.meta?.total||0, pages=data?.meta?.totalPages||1

  return (
    <div className="p-5 md:p-7 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="card p-5 mb-5 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px" style={{background:'linear-gradient(90deg,transparent,rgba(139,92,246,.2),transparent)'}}/>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight" style={{color:'#e8edf5'}}>Find investors</h1>
            <p className="text-sm mt-0.5" style={{color:'#4e5f7a'}}>{total>0?`${total} verified investors`:'Discovering…'}</p>
          </div>
          <button onClick={()=>setFilters(v=>!v)} className={clsx('btn btn-ghost text-sm gap-1.5',filters&&'text-brand-400')} style={filters?{background:'rgba(133,199,242,.06)',border:'1px solid rgba(133,199,242,.2)'}:{}}>
            <SlidersHorizontal size={14}/> Filters
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{color:'#4e5f7a'}}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search name, firm, industry…" className="input pl-10"/>
        </div>
        <AnimatePresence>
          {filters && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="mt-4 grid sm:grid-cols-3 gap-3 overflow-hidden">
              <select value={type}  onChange={e=>{setType(e.target.value);setPage(1)}} className="input"><option value="">All types</option>{INVESTOR_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select>
              <select value={stage} onChange={e=>{setStage(e.target.value);setPage(1)}} className="input"><option value="">All stages</option>{STAGES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
              <select value={ind}   onChange={e=>{setInd(e.target.value);setPage(1)}} className="input"><option value="">All industries</option>{INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}</select>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-brand-400/20 border-t-brand-400 animate-spin"/></div>
      ) : investors.length===0 ? (
        <div className="card p-16 text-center"><p className="font-display font-semibold text-lg mb-1" style={{color:'#e8edf5'}}>No investors found</p><p className="text-sm" style={{color:'#4e5f7a'}}>Try adjusting your filters</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {investors.map((inv:any, i:number) => {
            const photoSrc = uploadUrl(inv.photo_url)
            return (
              <motion.div key={inv.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.04}}>
                <TiltCard className="card card-hover h-full flex flex-col">
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full border flex items-center justify-center shrink-0 overflow-hidden" style={{background:'rgba(139,92,246,.08)',borderColor:'rgba(30,45,71,.8)'}}>
                        {photoSrc ? <img src={photoSrc} className="w-full h-full object-cover" alt=""/>
                          : <span className="font-display font-bold" style={{color:'#a78bfa'}}>{(inv.name||'?')[0].toUpperCase()}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-semibold truncate" style={{color:'#e8edf5'}}>{inv.name}</p>
                        {inv.firm_name&&<p className="text-xs truncate" style={{color:'#4e5f7a'}}>{inv.firm_name}</p>}
                        <span className="badge badge-violet text-2xs mt-1 inline-flex capitalize">{INVESTOR_TYPES.find(t=>t.value===inv.investor_type)?.label||inv.investor_type}</span>
                      </div>
                    </div>

                    {inv.bio&&<p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{color:'#8896ae'}}>{inv.bio}</p>}

                    {(inv.ticket_min_usd>0||inv.ticket_max_usd>0)&&(
                      <div className="flex items-center gap-1.5 text-xs mb-2" style={{color:'#8896ae'}}><Briefcase size={11} style={{color:'#85C7F2'}}/>{fmt(inv.ticket_min_usd)} – {fmt(inv.ticket_max_usd)}</div>
                    )}
                    {inv.location&&<div className="flex items-center gap-1 text-xs mb-2" style={{color:'#4e5f7a'}}><MapPin size={10}/>{inv.location}</div>}

                    {(inv.investment_stages||[]).length>0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {inv.investment_stages.slice(0,3).map((s:string)=><span key={s} className="badge badge-brand text-2xs capitalize">{s.replace('-',' ')}</span>)}
                        {inv.investment_stages.length>3&&<span className="text-2xs" style={{color:'#4e5f7a'}}>+{inv.investment_stages.length-3}</span>}
                      </div>
                    )}

                    {inv.website&&<a href={inv.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-2xs mb-3 transition-colors hover:text-brand-200" style={{color:'#85C7F2'}}><Globe size={10}/>{inv.website.replace(/^https?:\/\//,'')}</a>}

                    <div className="mt-auto pt-3" style={{borderTop:'1px solid rgba(30,45,71,.6)'}}>
                      <motion.button whileHover={{scale:1.02}} whileTap={{scale:.97}}
                        onClick={()=>connectM.mutate({uid:inv.user_id})} disabled={connectM.isPending}
                        className="btn btn-secondary w-full text-xs gap-1.5"><Send size={11}/> Connect</motion.button>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            )
          })}
        </div>
      )}

      {pages>1 && (
        <div className="flex gap-2 justify-center mt-6">
          {Array.from({length:pages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setPage(p)} className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
              style={page===p?{background:'rgba(133,199,242,.12)',border:'1px solid rgba(133,199,242,.25)',color:'#85C7F2'}:{border:'1px solid rgba(30,45,71,.8)',color:'#4e5f7a'}}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
