import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Building2, TrendingUp, ArrowRight, Check } from 'lucide-react'
import { fadeUp, staggerContainer, springPop } from '@/lib/motionConfig'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  role:     z.enum(['startup', 'investor']),
})
type F = z.infer<typeof schema>

export default function SignupPage() {
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()
  const [role, setRole] = useState<'startup'|'investor'>('startup')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'startup' },
  })

  const mutation = useMutation({
    mutationFn: (d: F) => api.post('/auth/signup', d).then(r => r.data),
    onSuccess: ({ user, token }) => { setAuth(user, token); navigate('/dashboard') },
  })

  const pick = (r: 'startup'|'investor') => { setRole(r); setValue('role', r) }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background:'#060a10' }}>
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background:'radial-gradient(circle, rgba(139,92,246,.05) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full pointer-events-none" style={{ background:'radial-gradient(circle, rgba(133,199,242,.04) 0%, transparent 70%)' }} />

      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="w-full max-w-sm relative z-10">
        <motion.div variants={fadeUp} className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-11 h-11">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400 to-violet-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-bold text-sm text-surface-base">VS</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400 to-violet-500 blur-xl opacity-50 scale-125" />
            </div>
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight mb-1" style={{ color:'#e8edf5' }}>Join VentureSpan</h1>
          <p className="text-sm" style={{ color:'#4e5f7a' }}>Connect with the right partners</p>
        </motion.div>

        <motion.div variants={fadeUp} className="card p-7 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px" style={{ background:'linear-gradient(90deg, transparent, rgba(139,92,246,.3), rgba(133,199,242,.2), transparent)' }} />

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {([
              { v:'startup'  as const, Icon: Building2,  label:'Startup',  sub:'Raise funds'    },
              { v:'investor' as const, Icon: TrendingUp, label:'Investor', sub:'Discover deals' },
            ]).map(({ v, Icon, label, sub }) => {
              const active = role === v
              return (
                <motion.button key={v} type="button" onClick={() => pick(v)}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }}
                  className="relative flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all"
                  style={{
                    background: active ? 'rgba(133,199,242,.07)' : 'rgba(255,255,255,.02)',
                    border: active ? '1px solid rgba(133,199,242,.25)' : '1px solid rgba(30,45,71,.8)',
                    boxShadow: active ? '0 0 20px rgba(133,199,242,.08)' : 'none',
                  }}>
                  {active && (
                    <motion.div layoutId="role-check" className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background:'#85C7F2' }}>
                      <Check size={10} style={{ color:'#060a10' }} />
                    </motion.div>
                  )}
                  <Icon size={18} style={{ color: active ? '#85C7F2' : '#4e5f7a' }} />
                  <div>
                    <p className="font-medium text-sm" style={{ color: active ? '#e8edf5' : '#8896ae' }}>{label}</p>
                    <p className="text-xs" style={{ color:'#4e5f7a' }}>{sub}</p>
                  </div>
                </motion.button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
            <input type="hidden" {...register('role')} />
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@company.com" />
              {errors.email && <p className="text-xs mt-1.5" style={{ color:'#ef4444' }}>{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input {...register('password')} type="password" className={`input ${errors.password ? 'input-error' : ''}`} placeholder="Min. 8 characters" />
              {errors.password && <p className="text-xs mt-1.5" style={{ color:'#ef4444' }}>{errors.password.message}</p>}
            </div>

            {mutation.isError && (
              <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                className="rounded-lg px-3 py-2.5 text-sm" style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.18)', color:'#ef4444' }}>
                {(mutation.error as any)?.response?.data?.message || 'Signup failed. Try again.'}
              </motion.div>
            )}

            <motion.button type="submit" className="btn btn-primary w-full py-2.5" disabled={mutation.isPending}
              whileHover={{ scale:1.01 }} whileTap={{ scale:.98 }}>
              {mutation.isPending
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-surface-base/30 border-t-surface-base rounded-full animate-spin" />Creating…</span>
                : <span className="flex items-center gap-2">Create account <ArrowRight size={15} /></span>
              }
            </motion.button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color:'#4e5f7a' }}>
            Have an account?{' '}
            <Link to="/login" className="font-medium transition-colors hover:text-brand-200" style={{ color:'#85C7F2' }}>Sign in</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
