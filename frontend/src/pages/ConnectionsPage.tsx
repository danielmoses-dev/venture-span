import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Check, X, Clock, CheckCircle, XCircle, Users, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { staggerContainer, fadeUp, springPop } from '@/lib/motionConfig'
import clsx from 'clsx'

export default function ConnectionsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'all'|'pending'|'accepted'>('all')
  const isStartup = user?.role === 'startup'

  const { data: conns=[], isLoading } = useQuery({ queryKey:['connections'], queryFn:()=>api.get('/connections').then(r=>r.data) })
  const respondM = useMutation({
    mutationFn:({id,action}:{id:string;action:'accepted'|'rejected'})=>api.patch(`/connections/${id}`,{action}).then(r=>r.data),
    onSuccess:()=>void qc.invalidateQueries({queryKey:['connections']}),
  })

  const pending=conns.filter((c:any)=>c.status==='pending').length
  const accepted=conns.filter((c:any)=>c.status==='accepted').length
  const filtered=conns.filter((c:any)=>tab==='all'?true:c.status===tab)

  const statusStyle:Record<string,{color:string;bg:string}> = {
    pending:  {color:'#f59e0b', bg:'rgba(245,158,11,.08)'},
    accepted: {color:'#22c55e', bg:'rgba(34,197,94,.08)'},
    rejected: {color:'#ef4444', bg:'rgba(239,68,68,.08)'},
  }

  if(isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-brand-400/20 border-t-brand-400 animate-spin"/></div>

  return (
    <div className="p-5 md:p-7 max-w-3xl mx-auto">
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-5">

        {/* Header */}
        <motion.div variants={fadeUp} className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px" style={{background:'linear-gradient(90deg,transparent,rgba(133,199,242,.25),transparent)'}}/>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight flex items-center gap-2" style={{color:'#e8edf5'}}>
                <GitBranch size={22} style={{color:'#85C7F2'}}/> Connections
              </h1>
              <p className="text-sm mt-1" style={{color:'#4e5f7a'}}>{accepted} active · {pending} pending</p>
            </div>
            <div className="flex gap-3">
              {[{v:accepted,label:'Active',c:'#22c55e'},{v:pending,label:'Pending',c:'#f59e0b'}].map(({v,label,c})=>(
                <div key={label} className="text-center px-4 py-2 rounded-xl" style={{background:`${c}08`,border:`1px solid ${c}20`}}>
                  <p className="font-mono font-bold text-xl leading-none" style={{color:c}}>{v}</p>
                  <p className="text-2xs mt-0.5" style={{color:'#4e5f7a'}}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl w-fit" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(30,45,71,.8)'}}>
          {(['all','pending','accepted'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
              style={tab===t?{background:'rgba(133,199,242,.08)',border:'1px solid rgba(133,199,242,.2)',color:'#85C7F2'}:{color:'#4e5f7a'}}>
              {t}
              {t==='pending'&&pending>0&&<span className="ml-1.5 text-2xs font-bold px-1.5 py-0.5 rounded-full" style={{background:'#f59e0b',color:'#060a10'}}>{pending}</span>}
            </button>
          ))}
        </motion.div>

        {/* List */}
        {filtered.length===0 ? (
          <motion.div variants={fadeUp} className="card p-16 text-center">
            <Users size={40} className="mx-auto mb-4" style={{color:'rgba(133,199,242,.15)'}}/>
            <p className="font-display font-semibold text-lg mb-1" style={{color:'#e8edf5'}}>No connections yet</p>
            <p className="text-sm" style={{color:'#4e5f7a'}}>{isStartup?'Browse investors and send requests':'Startups will appear here when they connect'}</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((c:any, i:number) => {
                const ss = statusStyle[c.status]||statusStyle.pending
                return (
                  <motion.div key={c.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:.97}} transition={{delay:i*.04}}
                    className="card card-hover p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{background:'rgba(133,199,242,.06)',border:'1px solid rgba(30,45,71,.8)'}}>
                          <span className="font-display font-bold text-sm" style={{color:'#85C7F2'}}>{(c.other_name||'?')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium" style={{color:'#e8edf5'}}>{c.other_name||'Unknown'}</p>
                          <p className="text-xs" style={{color:'#4e5f7a'}}>{new Date(c.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                          {c.message&&<p className="text-xs mt-0.5 flex items-center gap-1" style={{color:'#8896ae'}}><MessageSquare size={10}/>{c.message}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge text-2xs" style={{background:ss.bg,border:`1px solid ${ss.color}20`,color:ss.color}}>
                          {c.status==='pending'&&<Clock size={9} className="mr-1"/>}
                          {c.status==='accepted'&&<CheckCircle size={9} className="mr-1"/>}
                          {c.status==='rejected'&&<XCircle size={9} className="mr-1"/>}
                          {c.status}
                        </span>
                        {!isStartup&&c.status==='pending'&&(
                          <div className="flex gap-1.5">
                            <motion.button whileHover={{scale:1.05}} whileTap={{scale:.95}}
                              onClick={()=>respondM.mutate({id:c.id,action:'accepted'})} disabled={respondM.isPending}
                              className="btn text-xs gap-1 px-3 py-1.5" style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',color:'#22c55e'}}>
                              <Check size={11}/> Accept
                            </motion.button>
                            <motion.button whileHover={{scale:1.05}} whileTap={{scale:.95}}
                              onClick={()=>respondM.mutate({id:c.id,action:'rejected'})} disabled={respondM.isPending}
                              className="btn text-xs gap-1 px-3 py-1.5" style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',color:'#ef4444'}}>
                              <X size={11}/> Decline
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  )
}
