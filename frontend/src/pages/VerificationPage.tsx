import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Upload, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { staggerContainer, fadeUp } from '@/lib/motionConfig'
import api from '@/lib/api'

const STATUS:Record<string,{icon:any;color:string;bg:string;border:string;label:string}> = {
  not_submitted: {icon:AlertCircle, color:'#4e5f7a', bg:'rgba(255,255,255,.02)', border:'rgba(30,45,71,.8)',  label:'Not submitted'},
  pending:       {icon:Clock,       color:'#f59e0b', bg:'rgba(245,158,11,.07)', border:'rgba(245,158,11,.2)', label:'Under review'},
  approved:      {icon:CheckCircle, color:'#22c55e', bg:'rgba(34,197,94,.07)',  border:'rgba(34,197,94,.2)',  label:'Verified'},
  rejected:      {icon:XCircle,     color:'#ef4444', bg:'rgba(239,68,68,.07)',  border:'rgba(239,68,68,.2)',  label:'Rejected'},
}
const STARTUP_DOCS  = ['Certificate of Incorporation (MCA / ROC)','DPIIT Startup India recognition letter','GST registration certificate','Partnership deed or LLP agreement']
const INVESTOR_DOCS = ['SEBI registered investment advisor certificate','SEBI registered portfolio manager certificate','AIF (Alternative Investment Fund) registration','Company registration / firm incorporation certificate']

export default function VerificationPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const ref = useRef<HTMLInputElement>(null)
  const isStartup = user?.role === 'startup'

  const { data: status } = useQuery({ queryKey:['verification-status'], queryFn:()=>api.get('/verification/status').then(r=>r.data) })
  const uploadM = useMutation({
    mutationFn:(file:File)=>{ const fd=new FormData(); fd.append('document',file); return api.post('/verification',fd,{headers:{'Content-Type':'multipart/form-data'}}) },
    onSuccess:()=>void qc.invalidateQueries({queryKey:['verification-status']}),
  })

  const key = (status?.status||'not_submitted') as keyof typeof STATUS
  const cfg = STATUS[key]
  const Icon = cfg.icon
  const isApproved=key==='approved', canUpload=key==='rejected'||key==='not_submitted'
  const docs = isStartup ? STARTUP_DOCS : INVESTOR_DOCS

  return (
    <div className="p-5 md:p-7 max-w-2xl mx-auto">
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-4">

        <motion.div variants={fadeUp}>
          <h1 className="font-display font-bold text-2xl tracking-tight flex items-center gap-2" style={{color:'#e8edf5'}}>
            <ShieldCheck size={22} style={{color:'#85C7F2'}}/> Verification
          </h1>
          <p className="text-sm mt-1" style={{color:'#4e5f7a'}}>
            Verified accounts appear in search and build trust with {isStartup?'investors':'startups'}
          </p>
        </motion.div>

        {/* Status */}
        <motion.div variants={fadeUp} className="card p-5" style={{background:cfg.bg,border:`1px solid ${cfg.border}`}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${cfg.color}12`,border:`1px solid ${cfg.color}25`}}>
              <Icon size={20} style={{color:cfg.color}}/>
            </div>
            <div>
              <p className="font-display font-semibold" style={{color:cfg.color}}>{cfg.label}</p>
              {status?.admin_note && <p className="text-sm mt-0.5" style={{color:'#8896ae'}}>{status.admin_note}</p>}
              {status?.created_at && <p className="text-xs mt-0.5" style={{color:'#4e5f7a'}}>Submitted {new Date(status.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>}
            </div>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div variants={fadeUp} className="card p-5">
          <h2 className="font-display font-semibold text-sm mb-4" style={{color:'#e8edf5'}}>What verification unlocks</h2>
          <ul className="space-y-3">
            {['Verified badge on your profile','Appears in browse and search results','Higher trust signals for connections',
              isStartup?'ML score visible to investors':'Confirms SEBI registration — required for public solicitation',
            ].map(item=>(
              <li key={item} className="flex items-start gap-2.5 text-sm" style={{color:'#8896ae'}}>
                <CheckCircle size={14} className="mt-0.5 shrink-0" style={{color:isApproved?'#22c55e':'#85C7F2'}}/>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Accepted docs */}
        <motion.div variants={fadeUp} className="card p-5">
          <h2 className="font-display font-semibold text-sm mb-3" style={{color:'#e8edf5'}}>
            {isStartup?'Accepted startup documents':'Accepted investor credentials'}
          </h2>
          <ul className="space-y-2 mb-4">
            {docs.map(doc=>(
              <li key={doc} className="flex items-center gap-2.5 text-sm" style={{color:'#8896ae'}}>
                <motion.span animate={{opacity:[.4,1,.4]}} transition={{duration:2,repeat:Infinity,delay:Math.random()}}
                  className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:'#85C7F2'}}/>
                {doc}
              </li>
            ))}
          </ul>
          {!isStartup && (
            <div className="rounded-xl p-3 flex items-start gap-2.5" style={{background:'rgba(133,199,242,.05)',border:'1px solid rgba(133,199,242,.12)'}}>
              <ExternalLink size={13} style={{color:'#85C7F2',marginTop:1,flexShrink:0}}/>
              <p className="text-xs" style={{color:'#8896ae'}}>
                Verify registration at{' '}
                <a href="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-brand-200 underline" style={{color:'#85C7F2'}}>sebi.gov.in</a>.
                Upload your certificate as proof.
              </p>
            </div>
          )}
        </motion.div>

        {/* Upload */}
        {!isApproved && (
          <motion.div variants={fadeUp} className="card p-5">
            <h2 className="font-display font-semibold text-sm mb-2" style={{color:'#e8edf5'}}>Upload document</h2>
            <p className="text-sm mb-4" style={{color:'#4e5f7a'}}>{isStartup?'Must clearly show your company name and registration number.':'Must show your name, registration number, and validity dates.'}</p>
            {canUpload && (
              <>
                <motion.button whileHover={{scale:1.01}} whileTap={{scale:.99}}
                  onClick={()=>ref.current?.click()} disabled={uploadM.isPending}
                  className="w-full rounded-xl p-8 text-center transition-all border-2 border-dashed"
                  style={{borderColor:'rgba(30,45,71,.8)',cursor:'pointer'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(133,199,242,.3)';(e.currentTarget as HTMLButtonElement).style.background='rgba(133,199,242,.03)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(30,45,71,.8)';(e.currentTarget as HTMLButtonElement).style.background=''}}>
                  <Upload size={22} className="mx-auto mb-2" style={{color:'#85C7F2'}}/>
                  <p className="text-sm font-medium" style={{color:'#e8edf5'}}>{uploadM.isPending?'Uploading…':'Click to upload document'}</p>
                  <p className="text-xs mt-1" style={{color:'#4e5f7a'}}>PDF, JPG, or PNG · Max 10MB</p>
                </motion.button>
                <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e=>e.target.files?.[0]&&uploadM.mutate(e.target.files[0])}/>
              </>
            )}
            {key==='pending' && <div className="rounded-xl px-4 py-3 text-sm" style={{background:'rgba(245,158,11,.07)',border:'1px solid rgba(245,158,11,.2)',color:'#f59e0b'}}>Your document is under review. Usually 1–2 business days.</div>}
            {uploadM.isSuccess && <p className="text-sm mt-3" style={{color:'#22c55e'}}>Document submitted! We'll review it shortly.</p>}
            {uploadM.isError   && <p className="text-sm mt-3" style={{color:'#ef4444'}}>Upload failed. Please try again.</p>}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
