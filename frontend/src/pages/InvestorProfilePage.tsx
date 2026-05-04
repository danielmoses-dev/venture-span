import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { INDUSTRIES, STAGES, INVESTOR_TYPES } from '@/types'
import { useEffect, useRef, useState } from 'react'
import { Save, Plus, Trash2, Pencil, MapPin, Globe, CheckCircle, Camera, Briefcase, ImageIcon, AlertCircle, ExternalLink, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import LocationSelect from '@/components/ui/LocationSelect'
import { uploadUrl } from '@/lib/uploadUrl'
import { fadeUp, staggerContainer } from '@/lib/motionConfig'

const fmt=(v:number)=>v>=1e7?`₹${(v/1e7).toFixed(1)}Cr`:v>=1e5?`₹${(v/1e5).toFixed(1)}L`:`₹${v}`
const TYPE_LABELS:Record<string,string>={ individual:'Individual',angel:'Angel Investor',vc:'VC Firm',family_office:'Family Office',corporate:'Corporate VC' }

const schema = z.object({
  name:                 z.string().min(1,'Name required'),
  firm_name:            z.string().min(1,'Firm required'),
  investor_type:        z.string(),
  investment_stages:    z.array(z.string()).min(1,'Select at least one'),
  ticket_min_inr:       z.coerce.number().min(0),
  ticket_max_inr:       z.coerce.number().min(0),
  preferred_industries: z.array(z.string()).min(1,'Select at least one'),
  location:             z.string().min(1,'Location required'),
  country_code:         z.string().min(1),
  bio:                  z.string().min(10,'Min 10 characters').max(1000),
  website:              z.string().url('Valid URL').or(z.literal('')),
  linkedin_url:         z.string().url('Valid URL').refine(v=>v.includes('linkedin.com'),{message:'Must be LinkedIn'}),
  portfolio: z.array(z.object({ company:z.string(), url:z.string(), stage:z.string() })),
})
type F = z.infer<typeof schema>

export default function InvestorProfilePage() {
  const qc = useQueryClient()
  const photoRef=useRef<HTMLInputElement>(null), bannerRef=useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  const { data: profile, isLoading } = useQuery({ queryKey:['my-profile','investor'], queryFn:()=>api.get('/profiles/investor').then(r=>r.data) })
  const { data: verStatus }           = useQuery({ queryKey:['verification-status'],  queryFn:()=>api.get('/verification/status').then(r=>r.data) })
  const { data: countries }           = useQuery({ queryKey:['countries'],            queryFn:()=>api.get('/ml/countries').catch(()=>({data:[]})).then(r=>r.data) })

  const { register, handleSubmit, reset, watch, setValue, control, formState:{ errors, isDirty } } = useForm<F>({
    resolver:zodResolver(schema),
    defaultValues:{ investment_stages:[], preferred_industries:[], portfolio:[], investor_type:'angel', country_code:'IND' },
  })
  const { fields, append, remove } = useFieldArray({ control, name:'portfolio' })

  useEffect(()=>{
    if(profile){ reset({...profile, ticket_min_inr:profile.ticket_min_usd||0, ticket_max_inr:profile.ticket_max_usd||0, website:profile.website||'', linkedin_url:profile.linkedin_url||'', bio:profile.bio||'', portfolio:profile.portfolio||[], country_code:profile.country_code||'IND' })
    if(!profile.name) setIsEditing(true) }
  },[profile,reset])

  const mutation = useMutation({
    mutationFn:(d:F)=>api.put('/profiles/investor',{...d,ticket_min_usd:d.ticket_min_inr,ticket_max_usd:d.ticket_max_inr}).then(r=>r.data),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['my-profile','investor']}); setSaved(true); setIsEditing(false); setTimeout(()=>setSaved(false),3000) },
  })
  const upload=(ep:string)=>(file:File)=>{ const fd=new FormData(); fd.append('file',file); return api.post(ep,fd,{headers:{'Content-Type':'multipart/form-data'}}) }
  const photoM  = useMutation({ mutationFn:upload('/profiles/investor/photo'),  onSuccess:()=>qc.invalidateQueries({queryKey:['my-profile','investor']}) })
  const bannerM = useMutation({ mutationFn:upload('/profiles/investor/banner'), onSuccess:()=>qc.invalidateQueries({queryKey:['my-profile','investor']}) })

  const tog=(key:'investment_stages'|'preferred_industries',v:string)=>{ const cur=watch(key)||[]; setValue(key,cur.includes(v)?cur.filter((x:string)=>x!==v):[...cur,v],{shouldDirty:true}) }

  const selStages=watch('investment_stages')||[], selInd=watch('preferred_industries')||[]
  const tmin=watch('ticket_min_inr'), tmax=watch('ticket_max_inr'), cc=watch('country_code')
  const Req=()=><span style={{color:'#ef4444'}} className="ml-0.5">*</span>
  const isVerified=verStatus?.status==='approved', verPending=verStatus?.status==='pending'

  if(isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-brand-400/20 border-t-brand-400 animate-spin"/></div>

  // ── CARD VIEW ───────────────────────────────────────────────────────────────
  if(!isEditing && profile?.name) {
    const bannerSrc=uploadUrl(profile.banner_url), photoSrc=uploadUrl(profile.photo_url)
    return (
      <div className="p-5 md:p-7 max-w-3xl mx-auto space-y-4">
        {saved && <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',color:'#22c55e'}}><CheckCircle size={14}/> Profile saved</motion.div>}

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="card overflow-hidden">
          {/* Banner */}
          <div className="relative h-44 group overflow-hidden">
            {bannerSrc ? <img src={bannerSrc} className="w-full h-full object-cover" alt=""/>
              : <div className="w-full h-full" style={{background:'linear-gradient(135deg,#0e0c1f 0%,#101829 40%,#0c1220 100%)'}}/>}
            <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle, rgba(139,92,246,.15) 1px, transparent 1px)',backgroundSize:'24px 24px'}}/>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300" style={{background:'rgba(6,10,16,.5)',backdropFilter:'blur(2px)'}}>
              <button onClick={()=>bannerRef.current?.click()} className="btn btn-secondary gap-2 text-xs"><ImageIcon size={13}/> Change banner</button>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={e=>e.target.files?.[0]&&bannerM.mutate(e.target.files[0])}/>
          </div>

          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-full border flex items-center justify-center overflow-hidden" style={{background:'rgba(12,18,32,.9)',borderColor:'rgba(30,45,71,.8)'}}>
                  {photoSrc ? <img src={photoSrc} className="w-full h-full object-cover" alt=""/> : <span className="font-display font-bold text-2xl" style={{color:'#a78bfa'}}>{profile.name?.[0]?.toUpperCase()}</span>}
                </div>
                <button onClick={()=>photoRef.current?.click()} className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{background:'rgba(6,10,16,.6)'}}>
                  <Camera size={14} style={{color:'#e8edf5'}}/>
                </button>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e=>e.target.files?.[0]&&photoM.mutate(e.target.files[0])}/>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                  <div><h1 className="font-display font-bold text-2xl tracking-tight" style={{color:'#e8edf5'}}>{profile.name}</h1>
                  {profile.firm_name && <p className="text-sm" style={{color:'#4e5f7a'}}>{profile.firm_name}</p>}</div>
                  {isVerified ? <span className="badge badge-success flex items-center gap-1"><CheckCircle size={10}/> Verified</span>
                    : verPending ? <span className="badge badge-warning flex items-center gap-1"><AlertCircle size={10}/> Under review</span>
                    : <Link to="/verification" className="badge badge-danger flex items-center gap-1 hover:opacity-80 transition-opacity"><AlertCircle size={10}/> Not verified</Link>}
                </div>
                <span className="badge badge-violet">{TYPE_LABELS[profile.investor_type]||profile.investor_type}</span>
              </div>
            </div>

            {profile.bio && <p className="text-sm leading-relaxed mb-5 pl-3" style={{color:'#8896ae',borderLeft:'2px solid rgba(139,92,246,.25)'}}>{profile.bio}</p>}

            <div className="flex flex-wrap gap-5 text-sm mb-5" style={{color:'#4e5f7a'}}>
              {profile.location && <span className="flex items-center gap-1.5"><MapPin size={13}/>{profile.location}</span>}
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-200 transition-colors" style={{color:'#85C7F2'}}><Globe size={13}/>{profile.website.replace(/^https?:\/\//,'')}</a>}
              {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-200 transition-colors" style={{color:'#85C7F2'}}><ExternalLink size={13}/>LinkedIn</a>}
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(30,45,71,.8)'}}>
                <p className="text-xs flex items-center gap-1 mb-1.5" style={{color:'#4e5f7a'}}><Briefcase size={11}/> Ticket size</p>
                <p className="font-mono font-bold" style={{color:'#e8edf5'}}>
                  {profile.ticket_min_usd>0||profile.ticket_max_usd>0 ? `${fmt(profile.ticket_min_usd)} – ${fmt(profile.ticket_max_usd)}` : 'Not specified'}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(30,45,71,.8)'}}>
                <p className="text-xs mb-2" style={{color:'#4e5f7a'}}>Investment stages</p>
                <div className="flex flex-wrap gap-1.5">{(profile.investment_stages||[]).map((s:string)=><span key={s} className="badge badge-brand capitalize">{s.replace('-',' ')}</span>)}</div>
              </div>
            </div>

            {(profile.preferred_industries||[]).length>0 && (
              <div className="rounded-xl p-4 mb-4" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(30,45,71,.8)'}}>
                <p className="text-xs mb-2" style={{color:'#4e5f7a'}}>Industries</p>
                <div className="flex flex-wrap gap-1.5">{profile.preferred_industries.map((i:string)=><span key={i} className="badge badge-violet">{i}</span>)}</div>
              </div>
            )}

            {(profile.portfolio||[]).length>0 && (
              <div className="rounded-xl p-4 mb-5" style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(30,45,71,.8)'}}>
                <p className="text-xs mb-3" style={{color:'#4e5f7a'}}>Portfolio</p>
                <div className="space-y-2.5">
                  {profile.portfolio.map((p:any)=>(
                    <div key={p.company} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-2xs font-bold" style={{background:'rgba(133,199,242,.08)',border:'1px solid rgba(30,45,71,.8)',color:'#85C7F2'}}>{p.company[0]}</div>
                        <span className="text-sm font-medium" style={{color:'#e8edf5'}}>{p.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.stage&&<span className="badge badge-neutral capitalize text-xs">{p.stage}</span>}
                        {p.url&&<a href={p.url} target="_blank" rel="noopener noreferrer" style={{color:'#85C7F2'}}><Globe size={12}/></a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 flex-wrap pt-4" style={{borderTop:'1px solid rgba(30,45,71,.6)'}}>
              <button onClick={()=>setIsEditing(true)} className="btn btn-primary gap-2"><Pencil size={13}/> Edit profile</button>
              {!isVerified&&!verPending && <Link to="/verification" className="btn btn-ghost gap-2 text-warning border border-warning/20 hover:bg-warning/5"><AlertCircle size={13}/> Get verified</Link>}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── EDIT FORM ───────────────────────────────────────────────────────────────
  return (
    <div className="p-5 md:p-7 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display font-bold text-2xl tracking-tight" style={{color:'#e8edf5'}}>{profile?.name?'Edit profile':'Set up your profile'}</h1>
        <p className="text-sm mt-1" style={{color:'#4e5f7a'}}>Startups discover you based on your preferences</p></div>
        {profile?.name && <button onClick={()=>setIsEditing(false)} className="btn btn-ghost text-sm"><X size={14}/> Cancel</button>}
      </div>

      {/* Photo upload */}
      <div className="card p-5 mb-4">
        <h2 className="font-display font-semibold text-sm mb-3" style={{color:'#e8edf5'}}>Profile photo <Req/></h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border flex items-center justify-center overflow-hidden shrink-0" style={{background:'rgba(12,18,32,.9)',borderColor:'rgba(30,45,71,.8)'}}>
            {uploadUrl(profile?.photo_url) ? <img src={uploadUrl(profile!.photo_url)!} className="w-full h-full object-cover" alt=""/> : <Camera size={20} style={{color:'#4e5f7a'}}/>}
          </div>
          <div>
            <button type="button" onClick={()=>photoRef.current?.click()} className="btn btn-secondary text-sm gap-2"><Camera size={13}/> {profile?.photo_url?'Change':'Upload'} photo</button>
            <p className="text-xs mt-1.5" style={{color:'#4e5f7a'}}>JPG/PNG · 400×400px recommended</p>
            {!profile?.photo_url && <p className="text-xs mt-0.5" style={{color:'#ef4444'}}>Required for investors</p>}
          </div>
        </div>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e=>e.target.files?.[0]&&photoM.mutate(e.target.files[0])}/>
        {photoM.isPending&&<p className="text-xs mt-2" style={{color:'#85C7F2'}}>Uploading…</p>}
        {photoM.isSuccess&&<p className="text-xs mt-2" style={{color:'#22c55e'}}>Uploaded!</p>}
      </div>

      <motion.form initial="hidden" animate="visible" variants={staggerContainer}
        onSubmit={handleSubmit(d=>mutation.mutate(d))} className="space-y-4">
        <motion.div variants={fadeUp} className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-sm" style={{color:'#e8edf5'}}>Basic information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">Full name <Req/></label><input {...register('name')} className="input" placeholder="Jane Smith"/>{errors.name&&<p className="text-xs mt-1.5" style={{color:'#ef4444'}}>{errors.name.message}</p>}</div>
            <div><label className="label">Firm <Req/></label><input {...register('firm_name')} className="input" placeholder="Acme Ventures"/>{errors.firm_name&&<p className="text-xs mt-1.5" style={{color:'#ef4444'}}>{errors.firm_name.message}</p>}</div>
            <div><label className="label">Type <Req/></label><select {...register('investor_type')} className="input">{INVESTOR_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="label">Country <Req/></label><select {...register('country_code')} className="input">{(countries&&countries.length>0?countries:['IND','USA','GBR','CAN','AUS','Other']).map((c:string)=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="label">Location <Req/></label><Controller control={control} name="location" render={({field})=><LocationSelect countryCode={cc} value={field.value} onChange={field.onChange} required/>}/>{errors.location&&<p className="text-xs mt-1.5" style={{color:'#ef4444'}}>{errors.location.message}</p>}</div>
            <div><label className="label">LinkedIn <Req/></label><input {...register('linkedin_url')} className="input" placeholder="https://linkedin.com/in/you"/>{errors.linkedin_url&&<p className="text-xs mt-1.5" style={{color:'#ef4444'}}>{errors.linkedin_url.message}</p>}</div>
            <div className="md:col-span-2"><label className="label">Website</label><input {...register('website')} className="input" placeholder="https://…"/></div>
          </div>
          <div><label className="label">Bio <Req/></label><textarea {...register('bio')} rows={3} className="input resize-none" placeholder="Investment thesis, background, what you look for…"/>{errors.bio&&<p className="text-xs mt-1.5" style={{color:'#ef4444'}}>{errors.bio.message}</p>}</div>
        </motion.div>

        <motion.div variants={fadeUp} className="card p-6 space-y-5">
          <h2 className="font-display font-semibold text-sm" style={{color:'#e8edf5'}}>Investment preferences</h2>
          <div>
            <label className="label mb-2">Ticket size (INR) <Req/></label>
            <div className="grid grid-cols-2 gap-3">
              <div><input {...register('ticket_min_inr')} type="number" min={0} className="input" placeholder="Min"/>{Number(tmin)>0&&<p className="text-xs mt-1" style={{color:'#4e5f7a'}}>{fmt(Number(tmin))}</p>}</div>
              <div><input {...register('ticket_max_inr')} type="number" min={0} className="input" placeholder="Max"/>{Number(tmax)>0&&<p className="text-xs mt-1" style={{color:'#4e5f7a'}}>{fmt(Number(tmax))}</p>}</div>
            </div>
          </div>
          <div>
            <label className="label mb-2">Investment stages <Req/></label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map(s=>(
                <button type="button" key={s.value} onClick={()=>tog('investment_stages',s.value)}
                  className={`badge text-xs px-3 py-1.5 cursor-pointer transition-all ${selStages.includes(s.value)?'badge-brand':'badge-neutral'}`}>{s.label}</button>
              ))}
            </div>
            {errors.investment_stages&&<p className="text-xs mt-1.5" style={{color:'#ef4444'}}>{errors.investment_stages.message}</p>}
          </div>
          <div>
            <label className="label mb-2">Preferred industries <Req/></label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {INDUSTRIES.map(ind=>(
                <button type="button" key={ind} onClick={()=>tog('preferred_industries',ind)}
                  className={`badge text-xs px-3 py-1.5 cursor-pointer transition-all ${selInd.includes(ind)?'badge-violet':'badge-neutral'}`}>{ind}</button>
              ))}
            </div>
            {errors.preferred_industries&&<p className="text-xs mt-1.5" style={{color:'#ef4444'}}>{errors.preferred_industries.message}</p>}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-sm" style={{color:'#e8edf5'}}>Portfolio <span style={{color:'#4e5f7a',fontWeight:400}}>(optional)</span></h2>
            <button type="button" onClick={()=>append({company:'',url:'',stage:''})} className="btn btn-ghost text-xs gap-1"><Plus size={13}/> Add</button>
          </div>
          {fields.length===0&&<p className="text-sm text-center py-4" style={{color:'#4e5f7a'}}>No companies added</p>}
          <div className="space-y-3">
            {fields.map((field,i)=>(
              <div key={field.id} className="grid grid-cols-3 gap-3 items-center">
                <input {...register(`portfolio.${i}.company`)} className="input" placeholder="Company"/>
                <input {...register(`portfolio.${i}.url`)} className="input" placeholder="URL"/>
                <div className="flex gap-2">
                  <select {...register(`portfolio.${i}.stage`)} className="input flex-1"><option value="">Stage</option>{STAGES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
                  <button type="button" onClick={()=>remove(i)} className="btn btn-ghost p-2 text-danger"><Trash2 size={13}/></button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {mutation.isError&&<p className="text-sm rounded-lg px-3 py-2.5" style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.18)',color:'#ef4444'}}>Save failed. Try again.</p>}
        <div className="flex gap-3 justify-end">
          {profile?.name&&<button type="button" onClick={()=>setIsEditing(false)} className="btn btn-ghost">Cancel</button>}
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending||!isDirty}>
            <Save size={14}/> {mutation.isPending?'Saving…':'Save profile'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
