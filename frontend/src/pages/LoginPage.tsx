import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { fadeUp, staggerContainer } from '@/lib/motionConfig'
import { ArrowRight, Zap } from 'lucide-react'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type F = z.infer<typeof schema>

export default function LoginPage() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (d: F) => api.post('/auth/login', d).then(r => r.data),
    onSuccess: ({ user, token }) => { setAuth(user, token); navigate('/dashboard') },
  })

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background:'#060a10' }}>
      {/* Ambient */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background:'radial-gradient(circle, rgba(133,199,242,.05) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full pointer-events-none" style={{ background:'radial-gradient(circle, rgba(139,92,246,.04) 0%, transparent 70%)' }} />

      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="w-full max-w-sm relative z-10">
        {/* Logo */}
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
          <h1 className="font-display font-bold text-2xl tracking-tight mb-1" style={{ color:'#e8edf5' }}>Welcome back</h1>
          <p className="text-sm" style={{ color:'#4e5f7a' }}>Sign in to your account</p>
        </motion.div>

        {/* Card */}
        <motion.div variants={fadeUp} className="card p-7 relative overflow-hidden">
          {/* Top glow line */}
          <div className="absolute top-0 inset-x-0 h-px" style={{ background:'linear-gradient(90deg, transparent, rgba(133,199,242,.25), rgba(139,92,246,.15), transparent)' }} />

          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@company.com" autoComplete="email" />
              {errors.email && <p className="text-xs mt-1.5" style={{ color:'#ef4444' }}>{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input {...register('password')} type="password" className={`input ${errors.password ? 'input-error' : ''}`} placeholder="••••••••" autoComplete="current-password" />
              {errors.password && <p className="text-xs mt-1.5" style={{ color:'#ef4444' }}>{errors.password.message}</p>}
            </div>

            {mutation.isError && (
              <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                className="rounded-lg px-3 py-2.5 text-sm" style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.18)', color:'#ef4444' }}>
                {(mutation.error as any)?.response?.data?.message || 'Invalid credentials'}
              </motion.div>
            )}

            <motion.button type="submit" className="btn btn-primary w-full py-2.5" disabled={mutation.isPending}
              whileHover={{ scale:1.01 }} whileTap={{ scale:.98 }}>
              {mutation.isPending
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-surface-base/30 border-t-surface-base rounded-full animate-spin" /> Signing in…</span>
                : <span className="flex items-center gap-2">Sign in <ArrowRight size={15} /></span>
              }
            </motion.button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color:'#4e5f7a' }}>
            No account?{' '}
            <Link to="/signup" className="font-medium transition-colors hover:text-brand-200" style={{ color:'#85C7F2' }}>Sign up free</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
