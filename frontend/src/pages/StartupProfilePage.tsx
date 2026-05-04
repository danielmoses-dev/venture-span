import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { INDUSTRIES, STAGES, formatCurrency } from '@/types'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Upload, Save, Zap, Pencil, MapPin, Users, Globe, FileText, CheckCircle, Camera, ImageIcon, AlertCircle, ArrowRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import LocationSelect from '@/components/ui/LocationSelect'
import { uploadUrl } from '@/lib/uploadUrl'
import { fadeUp, staggerContainer } from '@/lib/motionConfig'

const schema = z.object({
  name:              z.string().min(1,'Company name required'),
  industry:          z.string(),
  stage:             z.string(),
  location:          z.string().min(1,'Location required'),
  country_code:      z.string().min(1),
  team_size:         z.coerce.number().min(1),
  funding_total_usd: z.coerce.number().min(0),
  funding_rounds:    z.coerce.number().min(0),
  milestones:        z.coerce.number().min(0).max(50),
  relationships:     z.coerce.number().min(0).max(200),
  company_age:       z.coerce.number().min(0).max(120),
  description:       z.string().min(1,'Description required').max(1000),
  website:           z.string().url('Enter a valid URL').or(z.literal('')),
  ml_score_visible:  z.boolean(),
})
type F = z.infer<typeof schema>

const STAGE_MAP: Record<string,string> = { 'idea':'Idea','pre-seed':'Pre-seed','seed':'Seed','series-a':'Series A','series-b':'Series B','growth':'Growth' }
const scoreColor = (s:number|null) => !s?'#4e5f7a':s>=7?'#22c55e':s>=5?'#f59e0b':'#ef4444'
const scoreLabel = (s:number) => s>=7?'High potential':s>=5?'Moderate':'Needs work'

function SparkBar({ pct, color }: { pct:number; color:string }) {
  return (
    <div className="spark-track">
      <motion.div className="spark-fill" style={{ background:color }}
        initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:.9, ease:[.22,1,.36,1] }} />
    </div>
  )
}

function ScoreRing({ score }: { score:number }) {
  const r=32, C=2*Math.PI*r, color=scoreColor(score)
  return (
    <div className="relative w-20 h-20">
      <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="5"/>
        <motion.circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={C}
          initial={{ strokeDashoffset:C }} animate={{ strokeDashoffset:C-(score/10)*C }}
          transition={{ duration:1.2, ease:[.22,1,.36,1], delay:.2 }}
          style={{ filter:`drop-shadow(0 0 5px ${color})` }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-lg leading-none" style={{ color }}>{score}</span>
        <span className="text-2xs" style={{ color:'#4e5f7a' }}>/10</span>
      </div>
    </div>
  )
}

export default function StartupProfilePage() {
  const qc = useQueryClient()
  const fileRef=useRef<HTMLInputElement>(null), logoRef=useRef<HTMLInputElement>(null), bannerRef=useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  const { data: profile, isLoading } = useQuery({ queryKey:['my-profile','startup'], queryFn:()=>api.get('/profiles/startup').then(r=>r.data) })
  const { data: verStatus }           = useQuery({ queryKey:['verification-status'],  queryFn:()=>api.get('/verification/status').then(r=>r.data) })
  const { data: countries }           = useQuery({ queryKey:['countries'],            queryFn:()=>api.get('/ml/countries').catch(()=>({data:[]})).then(r=>r.data) })

  const { register, handleSubmit, reset, watch, control, formState:{ errors, isDirty } } = useForm<F>({
    resolver:zodResolver(schema),
    defaultValues:{ industry:'Software', stage:'seed', ml_score_visible:true, country_code:'IND' },
  })

  useEffect(()=>{ if(profile){ reset({...profile, website:profile.website||'', description:profile.description||'', country_code:profile.country_code||'IND'}); if(!profile.name) setIsEditing(true) } },[profile,reset])

  const saveMutation = useMutation({
    mutationFn:(d:F)=>api.put('/profiles/startup',d).then(r=>r.data),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['my-profile','startup']}); setSaved(true); setIsEditing(false); setTimeout(()=>setSaved(false),3000) },
  })
  const upload = (ep:string)=>(file:File)=>{ const fd=new FormData(); fd.append('file',file); return api.post(ep,fd,{headers:{'Content-Type':'multipart/form-data'}}) }
  const pitchM  = useMutation({ mutationFn:upload('/profiles/startup/pitch-deck'), onSuccess:()=>qc.invalidateQueries({queryKey:['my-profile','startup']}) })
  const logoM   = useMutation({ mutationFn:upload('/profiles/startup/logo'),       onSuccess:()=>qc.invalidateQueries({queryKey:['my-profile','startup']}) })
  const bannerM = useMutation({ mutationFn:upload('/profiles/startup/banner'),     onSuccess:()=>qc.invalidateQueries({queryKey:['my-profile','startup']}) })

  if(isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-brand-400/20 border-t-brand-400 animate-spin"/></div>

  const countryCode = watch('country_code')
  const funding     = watch('funding_total_usd')
  const Req = ()=><span style={{color:'#ef4444'}} className="ml-0.5">*</span>
  const isVerified = verStatus?.status==='approved'
  const verPending = verStatus?.status==='pending'

  // ── CARD VIEW ───────────────────────────────────────────────────────────────
  if(!isEditing && profile?.name) {
    const bannerSrc = uploadUrl(profile.banner_url)
    const logoSrc   = uploadUrl(profile.logo_url)
    return (
      <div className="p-5 md:p-7 max-w-3xl mx-auto space-y-4">
        {saved && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
            style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',color:'#22c55e'}}>
            <CheckCircle size={14}/> Profile saved
          </motion.div>
        )}

        {/* Main profile card */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="card overflow-hidden">
          {/* Banner */}
          <div className="relative h-44 group overflow-hidden">
            {bannerSrc
              ? <img src={bannerSrc} className="w-full h-full object-cover" alt=""/>
              : <div className="w-full h-full" style={{background:'linear-gradient(135deg, #0c1e35 0%, #101829 40%, #130e20 100%)'}}/>
            }
            {/* Subtle grid overlay */}
            <div className="absolute inset-0 opacity-20" style={{backgroundImage:'linear-gradient(rgba(133,199,242,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(133,199,242,.1) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
            {/* Banner hover to change */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300" style={{background:'rgba(6,10,16,.5)',backdropFilter:'blur(2px)'}}>
              <button onClick={()=>bannerRef.current?.click()} className="btn btn-secondary gap-2 text-xs">
                <ImageIcon size={13}/> Change banner
              </button>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={e=>e.target.files?.[0]&&bannerM.mutate(e.target.files[0])}/>
            {/* ML score pill on banner */}
            {profile.ml_score!=null && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-mono font-bold"
                style={{background:'rgba(6,10,16,.8)',backdropFilter:'blur(8px)',border:`1px solid ${scoreColor(profile.ml_score)}40`,color:scoreColor(profile.ml_score)}}>
                {profile.ml_score}/10
              </div>
            )}
          </div>

          <div className="px-6 pt-5 pb-6">
            {/* Logo + identity */}
            <div className="flex items-start gap-4 mb-5">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-2xl border flex items-center justify-center overflow-hidden" style={{background:'rgba(12,18,32,.9)',borderColor:'rgba(30,45,71,.8)'}}>
                  {logoSrc ? <img src={logoSrc} className="w-full h-full object-cover" alt=""/> : <span className="font-display font-bold text-2xl" style={{color:'#85C7F2'}}>{profile.name?.[0]?.toUpperCase()}</span>}
                </div>
                <button onClick={()=>logoRef.current?.click()} className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{background:'rgba(6,10,16,.6)'}}>
                  <Camera size={14} style={{color:'#e8edf5'}}/>
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e=>e.target.files?.[0]&&logoM.mutate(e.target.files[0])}/>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                  <h1 className="font-display font-bold text-2xl tracking-tight" style={{color:'#e8edf5'}}>{profile.name}</h1>
                  {isVerified
                    ? <span className="badge badge-success flex items-center gap-1"><CheckCircle size={10}/> Verified</span>
                    : verPending
                      ? <span className="badge badge-warning flex items-center gap-1"><AlertCircle size={10}/> Under review</span>
                      : <Link to="/verification" className="badge badge-danger flex items-center gap-1 hover:opacity-80 transition-opacity"><AlertCircle size={10}/> Not verified</Link>
                  }
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-brand">{profile.industry}</span>
                  <span className="badge badge-neutral">{STAGE_MAP[profile.stage]||profile.stage}</span>
                  {profile.company_age>0 && <span className="text-xs" style={{color:'#4e5f7a'}}>{profile.company_age}y old</span>}
                </div>
              </div>
            </div>

            {profile.description && (
              <p className="text-sm leading-relaxed mb-5 pl-3" style={{color:'#8896ae',borderLeft:'2px solid rgba(133,199,242,.2)'}}>{profile.description}</p>
            )}

            <div className="flex flex-wrap gap-5 text-sm mb-6" style={{color:'#4e5f7a'}}>
              {profile.location && <span className="flex items-center gap-1.5"><MapPin size={13}/>{profile.location}, {profile.country_code}</span>}
              {profile.team_size>0 && <span className="flex items-center gap-1.5"><Users size={13}/>{profile.team_size} people</span>}
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-brand-200" style={{color:'#85C7F2'}}><Globe size={13}/>{profile.website.replace(/^https?:\/\//,'')}</a>}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                {label:'Total funding', value:formatCurrency(profile.funding_total_usd||0)},
                {label:'Rounds',        value:profile.funding_rounds||0},
                {label:'Milestones',    value:profile.milestones||0},
                {label:'Relationships', value:profile.relationships||0},
              ].map(({label,value})=>(
                <div key={label} className="rounded-xl p-3 text-center" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(30,45,71,.8)'}}>
                  <p className="font-mono font-bold text-lg leading-none mb-1" style={{color:'#e8edf5'}}>{value}</p>
                  <p className="text-2xs" style={{color:'#4e5f7a'}}>{label}</p>
                </div>
              ))}
            </div>

            {/* ML score section */}
            {profile.ml_result && (
              <div className="rounded-xl p-4 mb-5" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(30,45,71,.8)'}}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={profile.ml_score}/>
                    <div>
                      <p className="text-2xs uppercase tracking-wider mb-1" style={{color:'#4e5f7a'}}>VentureSpan Score</p>
                      <p className="font-semibold text-sm" style={{color:scoreColor(profile.ml_score)}}>{scoreLabel(profile.ml_score)}</p>
                      <p className="text-xs" style={{color:'#4e5f7a'}}>{profile.ml_result.predicted_label} · {Math.round(profile.ml_result.confidence*100)}% confidence</p>
                    </div>
                  </div>
                  <Link to="/insights" className="btn btn-secondary text-xs gap-1.5 shrink-0"><Zap size={12}/> Full insights</Link>
                </div>
                <div className="mt-4 space-y-2">
                  {Object.entries(profile.ml_result.probabilities).map(([lbl,prob])=>{
                    const pct=Math.round((prob as number)*100)
                    const c=lbl==='Positive exit'?'#22c55e':lbl==='Sustainability'?'#f59e0b':'#ef4444'
                    return (
                      <div key={lbl} className="flex items-center gap-3">
                        <span className="text-2xs w-24 shrink-0" style={{color:'#4e5f7a'}}>{lbl}</span>
                        <div className="flex-1"><SparkBar pct={pct} color={c}/></div>
                        <span className="font-mono text-2xs w-7 text-right" style={{color:'#8896ae'}}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Pitch deck */}
            {profile.pitch_deck_url && (
              <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-5" style={{border:'1px solid rgba(30,45,71,.8)'}}>
                <div className="flex items-center gap-2.5">
                  <FileText size={15} style={{color:'#85C7F2'}}/>
                  <div>
                    <p className="text-sm font-medium" style={{color:'#e8edf5'}}>Pitch deck</p>
                    <p className="text-xs" style={{color:'#4e5f7a'}}>PDF uploaded</p>
                  </div>
                </div>
                <a href={uploadUrl(profile.pitch_deck_url)||'#'} target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-xs">View</a>
              </div>
            )}

            <div className="flex gap-3 flex-wrap pt-4" style={{borderTop:'1px solid rgba(30,45,71,.6)'}}>
              <button onClick={()=>setIsEditing(true)} className="btn btn-primary gap-2"><Pencil size={13}/> Edit profile</button>
              {!profile.pitch_deck_url && <button onClick={()=>fileRef.current?.click()} className="btn btn-secondary gap-2"><Upload size={13}/> Pitch deck</button>}
              {!isVerified&&!verPending && <Link to="/verification" className="btn btn-ghost gap-2 text-warning border border-warning/20 hover:bg-warning/5"><AlertCircle size={13}/> Get verified</Link>}
            </div>
          </div>
        </motion.div>
        <p className="text-2xs px-1" style={{color:'#2d3d55'}}>Banner: 1500×500px recommended · Logo: square, min 200×200px</p>
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e=>e.target.files?.[0]&&pitchM.mutate(e.target.files[0])}/>
      </div>
    )
  }

  // ── EDIT FORM ───────────────────────────────────────────────────────────────
  return (
    <div className="p-5 md:p-7 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight" style={{color:'#e8edf5'}}>{profile?.name?'Edit profile':'Set up your profile'}</h1>
          <p className="text-sm mt-1" style={{color:'#4e5f7a'}}>Details used for search, matching, and ML prediction</p>
        </div>
        {profile?.name && <button onClick={()=>setIsEditing(false)} className="btn btn-ghost text-sm"><X size={14}/> Cancel</button>}
      </div>

      <motion.form initial="hidden" animate="visible" variants={staggerContainer}
        onSubmit={handleSubmit(d=>saveMutation.mutate(d))} className="space-y-4">

        <motion.div variants={fadeUp} className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-sm" style={{color:'#e8edf5'}}>Basic information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">Company name <Req/></label><input {...register('name')} className="input" placeholder="Acme Inc."/>{errors.name&&<p className="text-xs mt-1.5" style={{color:'#ef4444'}}>{errors.name.message}</p>}</div>
            <div><label className="label">Industry</label><select {...register('industry')} className="input">{INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}</select></div>
            <div><label className="label">Stage</label><select {...register('stage')} className="input">{STAGES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            <div><label className="label">Team size</label><input {...register('team_size')} type="number" min={1} className="input"/></div>
            <div><label className="label">Country <Req/></label>
              <select {...register('country_code')} className="input">
                {(countries&&countries.length>0?countries:['IND','USA','GBR','CAN','AUS','DEU','SGP','Other']).map((c:string)=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Location <Req/></label>
              <Controller control={control} name="location" render={({field})=><LocationSelect countryCode={countryCode} value={field.value} onChange={field.onChange} required/>}/>
              {errors.location&&<p className="text-xs mt-1.5" style={{color:'#ef4444'}}>{errors.location.message}</p>}
            </div>
            <div className="md:col-span-2"><label className="label">Website</label><input {...register('website')} className="input" placeholder="https://acme.com"/>{errors.website&&<p className="text-xs mt-1.5" style={{color:'#ef4444'}}>{errors.website.message}</p>}</div>
          </div>
          <div><label className="label">Description <Req/></label><textarea {...register('description')} rows={3} className="input resize-none" placeholder="What does your startup do?"/>{errors.description&&<p className="text-xs mt-1.5" style={{color:'#ef4444'}}>{errors.description.message}</p>}</div>
        </motion.div>

        <motion.div variants={fadeUp} className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm" style={{color:'#e8edf5'}}>Funding & traction</h2>
            <span className="badge badge-violet flex items-center gap-1"><Zap size={10}/> ML inputs</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">Total funding (USD) <Req/></label><input {...register('funding_total_usd')} type="number" min={0} className="input" placeholder="0"/>{Number(funding)>0&&<p className="text-xs mt-1" style={{color:'#4e5f7a'}}>{formatCurrency(Number(funding))}</p>}</div>
            <div><label className="label">Funding rounds <Req/></label><input {...register('funding_rounds')} type="number" min={0} className="input" placeholder="0"/></div>
            <div><label className="label">Milestones <Req/> <span style={{color:'#4e5f7a'}}>(0–50)</span></label><input {...register('milestones')} type="number" min={0} max={50} className="input" placeholder="0"/></div>
            <div><label className="label">Relationships <Req/> <span style={{color:'#4e5f7a'}}>(0–200)</span></label><input {...register('relationships')} type="number" min={0} max={200} className="input" placeholder="0"/></div>
            <div><label className="label">Company age (years) <Req/></label><input {...register('company_age')} type="number" min={0} max={120} className="input" placeholder="0"/></div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="card p-6">
          <h2 className="font-display font-semibold text-sm mb-3" style={{color:'#e8edf5'}}>ML score visibility</h2>
          <label className="flex items-start gap-3 cursor-pointer">
            <input {...register('ml_score_visible')} type="checkbox" className="mt-0.5 accent-brand-400"/>
            <div><p className="text-sm font-medium" style={{color:'#e8edf5'}}>Show score to investors</p><p className="text-xs mt-0.5" style={{color:'#4e5f7a'}}>Investors browsing your profile will see your VentureSpan Score.</p></div>
          </label>
        </motion.div>

        <motion.div variants={fadeUp} className="card p-6">
          <h2 className="font-display font-semibold text-sm mb-3" style={{color:'#e8edf5'}}>Pitch deck</h2>
          {profile?.pitch_deck_url
            ? <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(30,45,71,.8)'}}>
                <p className="text-sm" style={{color:'#8896ae'}}>Pitch deck uploaded</p>
                <button type="button" onClick={()=>fileRef.current?.click()} className="btn btn-ghost text-xs">Replace</button>
              </div>
            : <button type="button" onClick={()=>fileRef.current?.click()}
                className="w-full rounded-xl p-6 text-center transition-all border-2 border-dashed border-surface-border hover:border-brand-400/30 hover:bg-brand-400/3">
                <Upload size={20} className="mx-auto mb-2" style={{color:'#4e5f7a'}}/><p className="text-sm" style={{color:'#8896ae'}}>Upload pitch deck</p><p className="text-xs mt-1" style={{color:'#4e5f7a'}}>PDF up to 10MB</p>
              </button>
          }
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e=>e.target.files?.[0]&&pitchM.mutate(e.target.files[0])}/>
        </motion.div>

        {saveMutation.isError && <p className="text-sm rounded-lg px-3 py-2.5" style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.18)',color:'#ef4444'}}>Save failed. Try again.</p>}
        <div className="flex gap-3 justify-end">
          {profile?.name && <button type="button" onClick={()=>setIsEditing(false)} className="btn btn-ghost">Cancel</button>}
          <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending||!isDirty}>
            <Save size={14}/> {saveMutation.isPending?'Saving…':'Save profile'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
