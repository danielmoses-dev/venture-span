import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, useMotionValue, useAnimationFrame } from 'framer-motion'
import { useRef, useEffect, useCallback, useState } from 'react'
import { ArrowRight, Zap, Users, ShieldCheck, TrendingUp, ChevronDown, Sparkles } from 'lucide-react'
import { fadeUp, staggerContainer, scaleUp } from '@/lib/motionConfig'

// ─── Particle Network Canvas ────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    let w = (canvas.width = canvas.offsetWidth)
    let h = (canvas.height = canvas.offsetHeight)
    const N = 55, DIST = 130
    type P = { x:number; y:number; vx:number; vy:number; r:number }
    const pts: P[] = Array.from({length:N}, () => ({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-.5)*.25, vy: (Math.random()-.5)*.25,
      r: Math.random()*1.2+.4,
    }))
    const tick = () => {
      ctx.clearRect(0,0,w,h)
      for (let i=0;i<N;i++) {
        for (let j=i+1;j<N;j++) {
          const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y
          const d=Math.hypot(dx,dy)
          if (d<DIST) {
            ctx.beginPath()
            ctx.strokeStyle=`rgba(133,199,242,${(1-d/DIST)*.12})`
            ctx.lineWidth=.6
            ctx.moveTo(pts[i].x,pts[i].y)
            ctx.lineTo(pts[j].x,pts[j].y)
            ctx.stroke()
          }
        }
      }
      pts.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle='rgba(133,199,242,0.45)'
        ctx.fill()
        p.x+=p.vx; p.y+=p.vy
        if (p.x<0||p.x>w) p.vx*=-1
        if (p.y<0||p.y>h) p.vy*=-1
      })
      raf=requestAnimationFrame(tick)
    }
    tick()
    const onResize = () => { w=canvas.width=canvas.offsetWidth; h=canvas.height=canvas.offsetHeight }
    window.addEventListener('resize',onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',onResize) }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />
}

// ─── Magnetic Button ─────────────────────────────────────────────────────────
function MagneticButton({ children, className, to }: { children: React.ReactNode; className: string; to: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 300, damping: 25 })
  const sy = useSpring(y, { stiffness: 300, damping: 25 })

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current; if (!el) return
    const rect = el.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width/2) * .35)
    y.set((e.clientY - rect.top  - rect.height/2) * .35)
  }, [x,y])

  const onLeave = useCallback(() => { x.set(0); y.set(0) }, [x,y])

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="inline-block">
      <motion.div style={{ x: sx, y: sy }}>
        <Link to={to} className={className}>{children}</Link>
      </motion.div>
    </div>
  )
}

// ─── Physics Feature Card ────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, gradient, delay }: {
  icon: React.ElementType; title: string; desc: string; gradient: string; delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top)  / rect.height
    const rx = (py - .5) * -12
    const ry = (px - .5) *  12
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(12px)`
    el.style.boxShadow = `${-ry*.8}px ${rx*.8}px 40px rgba(0,0,0,.5), 0 0 40px rgba(133,199,242,.08)`
    // Move inner glow with cursor
    const glow = el.querySelector('.card-spotlight') as HTMLElement
    if (glow) { glow.style.left=`${px*100}%`; glow.style.top=`${py*100}%` }
  }, [])
  const onLeave = useCallback(() => {
    const el = ref.current; if (!el) return
    el.style.transform='perspective(800px) rotateX(0) rotateY(0) translateZ(0)'
    el.style.boxShadow=''
    el.style.transition='transform .6s cubic-bezier(.22,1,.36,1), box-shadow .6s ease'
    setTimeout(() => { if (el) el.style.transition='' }, 600)
  }, [])

  return (
    <motion.div
      variants={fadeUp}
      transition={{ delay }}
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="card relative overflow-hidden cursor-default p-6 group"
      style={{ willChange:'transform', transition:'transform .12s ease, box-shadow .12s ease' }}
    >
      {/* Spotlight glow follows cursor */}
      <div className="card-spotlight absolute w-48 h-48 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background:'radial-gradient(circle, rgba(133,199,242,.07) 0%, transparent 70%)', left:'50%', top:'50%' }} />

      <div className={`relative w-11 h-11 rounded-xl mb-5 flex items-center justify-center bg-gradient-to-br ${gradient}`}>
        <Icon size={20} className="text-surface-base relative z-10" strokeWidth={2} />
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} blur-xl opacity-40 scale-150`} />
      </div>
      <h3 className="font-display font-semibold text-base text-ink-primary mb-2">{title}</h3>
      <p className="text-sm text-ink-secondary leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ─── Floating orb ────────────────────────────────────────────────────────────
function Orb({ size, color, x, y, delay }: { size:number; color:string; x:string; y:string; delay:number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width:size, height:size, background:color, left:x, top:y, filter:`blur(${size*.7}px)` }}
      animate={{ y:[0,-20,0], opacity:[.4,.7,.4] }}
      transition={{ duration:6+delay, repeat:Infinity, ease:'easeInOut', delay }}
    />
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  /**const { scrollYProgress } = useScroll({ target: heroRef })
  const heroY   = useTransform(scrollYProgress, [0,.6], [0,-80])
  const heroOp  = useTransform(scrollYProgress, [0,.5], [1, 0])**/
  const { scrollY } = useScroll()

  const heroY  = useTransform(scrollY, [0, 400], [0, -80])
  const heroOp = useTransform(scrollY, [0, 300], [1, 0])

  const smoothY  = useSpring(heroY, { stiffness: 80, damping: 20 })
  const smoothOp = useSpring(heroOp, { stiffness: 80, damping: 20 })

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background:'#060a10' }}>

      {/* ─ Navbar ─ */}
      <motion.nav
        initial={{ y:-16, opacity:0 }}
        animate={{ y:0,   opacity:1 }}
        transition={{ duration:.5, ease:[.22,1,.36,1] }}
        className="fixed top-0 inset-x-0 z-50 glass h-14 flex items-center justify-between px-6"
        style={{ borderBottom:'1px solid rgba(30,45,71,.7)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-400 to-violet-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display font-bold text-xs text-surface-base">VS</span>
            </div>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-400 to-violet-500 blur-md opacity-40 scale-125" />
          </div>
          <span className="font-display font-semibold text-sm" style={{ background:'linear-gradient(135deg,#85C7F2,#4aaee8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>VentureSpan</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn btn-ghost text-sm px-3 py-1.5">Sign in</Link>
          <Link to="/signup" className="btn btn-primary text-sm px-4 py-1.5 gap-1.5">
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </motion.nav>

      {/* ─ Hero ─ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: smoothOp, y: smoothY }}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-14 overflow-hidden"
      >
        <ParticleCanvas />

        {/* Ambient orbs */}
        <Orb size={400} color="rgba(133,199,242,.06)" x="10%" y="20%" delay={0} />
        <Orb size={350} color="rgba(139,92,246,.05)"  x="65%" y="10%" delay={2} />
        <Orb size={300} color="rgba(74,174,232,.04)"  x="50%" y="60%" delay={4} />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto"
        >
          {/* Eyebrow badge */}
          <motion.div variants={fadeUp} className="flex justify-center mb-6">
            <motion.div
              whileHover={{ scale:1.04 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium"
              style={{ background:'rgba(139,92,246,.08)', borderColor:'rgba(139,92,246,.2)', color:'#a78bfa' }}
            >
              <Sparkles size={11} />
              ML-powered startup intelligence for India
              <motion.span
                animate={{ opacity:[.4,1,.4] }}
                transition={{ duration:2, repeat:Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block"
              />
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-[3.5rem] md:text-[5rem] font-display font-bold leading-[1.04] tracking-[-0.04em] mb-6"
          >
            <span style={{ color:'#e8edf5' }}>Where capital</span>
            <br />
            <span className="text-shimmer">meets intelligence</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ color:'#8896ae' }}
          >
            VentureSpan connects verified startups and investors through context-aware ML scoring — 
            built for India's ecosystem, not Silicon Valley benchmarks.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex gap-4 justify-center flex-wrap">
            <MagneticButton to="/signup?role=startup" className="btn btn-primary gap-2 px-8 py-3 text-base">
              I'm a startup <ArrowRight size={16} />
            </MagneticButton>
            <MagneticButton to="/signup?role=investor" className="btn btn-secondary gap-2 px-8 py-3 text-base">
              I'm an investor
            </MagneticButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeUp}
            className="mt-16 pt-8 grid grid-cols-3 gap-8 max-w-md mx-auto"
            style={{ borderTop:'1px solid rgba(30,45,71,.8)' }}
          >
            {[['3,500+','Startups analysed'],['41','Industries'],['64','Countries']].map(([v,l]) => (
              <div key={l} className="text-center">
                <p className="font-display font-bold text-3xl tracking-tight" style={{ background:'linear-gradient(135deg,#85C7F2,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{v}</p>
                <p className="text-xs mt-1" style={{ color:'#4e5f7a' }}>{l}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <p className="text-2xs tracking-widest uppercase" style={{ color:'#2d3d55' }}>Scroll</p>
          <motion.div animate={{ y:[0,5,0] }} transition={{ repeat:Infinity, duration:1.6 }}>
            <ChevronDown size={14} style={{ color:'#2d3d55' }} />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ─ Features ─ */}
      <section className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once:true, margin:'-80px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <p className="badge badge-brand mb-4 mx-auto">Platform</p>
              <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-4">
                <span style={{ color:'#e8edf5' }}>Everything you need</span><br />
                <span className="text-gradient">to raise or invest</span>
              </h2>
              <p className="text-base max-w-lg mx-auto" style={{ color:'#8896ae' }}>
                A complete intelligence layer built for the modern Indian startup ecosystem.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FeatureCard icon={Zap}         title="ML Success Score"    delay={0}    gradient="from-brand-400 to-brand-600"  desc="CatBoost model calibrated with regional benchmarks. Indian startups scored fairly against local realities, not Silicon Valley data." />
              <FeatureCard icon={Users}       title="Smart Matching"      delay={0.06} gradient="from-violet-400 to-violet-600" desc="Browse verified investors filtered by ticket size, sector, and stage. Real introductions, not cold outreach." />
              <FeatureCard icon={ShieldCheck} title="Trust Verification"  delay={0.12} gradient="from-success to-emerald-600"  desc="SEBI credentials for investors. DPIIT recognition for startups. Every profile is manually reviewed." />
              <FeatureCard icon={TrendingUp}  title="Actionable Insights" delay={0.18} gradient="from-warning to-amber-500"    desc="Percentile benchmarks, AI recommendations, and downloadable PDF reports with your exact improvement targets." />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─ Glow divider ─ */}
      <div className="divider-glow mx-12" />

      {/* ─ How it works ─ */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once:true, margin:'-80px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-4">
                Built for <span className="text-gradient">India's ecosystem</span>
              </h2>
              <p className="text-base max-w-2xl mx-auto leading-relaxed" style={{ color:'#8896ae' }}>
                Our model was trained on global Crunchbase data — but calibrated with India-specific benchmarks. 
                A startup with ₹80L funding isn't failing. It's just early.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                { n:'01', t:'Build your profile', d:'Complete your startup or investor profile with funding history, milestones, industry focus, and verification documents.' },
                { n:'02', t:'Get your score',     d:'Our hybrid ML engine runs a CatBoost model then applies regional calibration so Indian startups aren\'t penalised for local funding levels.' },
                { n:'03', t:'Make connections',   d:'Browse curated matches, send requests, and build the relationships that lead to real term sheets and funded rounds.' },
              ].map(({ n,t,d }) => (
                <motion.div key={n} variants={fadeUp} className="card card-hover p-6 relative overflow-hidden">
                  <div className="font-mono text-6xl font-bold absolute -top-2 -right-2 select-none pointer-events-none" style={{ color:'rgba(30,45,71,.5)', letterSpacing:'-0.06em' }}>{n}</div>
                  <div className="relative z-10">
                    <h3 className="font-display font-semibold text-lg mb-2" style={{ color:'#e8edf5' }}>{t}</h3>
                    <p className="text-sm leading-relaxed" style={{ color:'#8896ae' }}>{d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─ CTA ─ */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full" style={{ background:'radial-gradient(ellipse, rgba(133,199,242,.05) 0%, transparent 70%)' }} />
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once:true }}
          variants={staggerContainer}
          className="relative z-10 max-w-xl mx-auto text-center"
        >
          <motion.h2 variants={fadeUp} className="font-display font-bold text-5xl tracking-tight mb-4">
            <span style={{ color:'#e8edf5' }}>Ready to find your</span><br />
            <span className="text-gradient">perfect match?</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mb-8" style={{ color:'#8896ae' }}>
            Join VentureSpan and access the most intelligent startup-investor matching platform built for India.
          </motion.p>
          <motion.div variants={fadeUp}>
            <MagneticButton to="/signup" className="btn btn-primary gap-2 px-10 py-3.5 text-base">
              Create free account <ArrowRight size={16} />
            </MagneticButton>
          </motion.div>
        </motion.div>
      </section>

      {/* ─ Footer ─ */}
      <footer className="py-8 text-center" style={{ borderTop:'1px solid rgba(30,45,71,.5)' }}>
        <p className="text-xs" style={{ color:'#2d3d55' }}>© {new Date().getFullYear()} VentureSpan · Built for India's startup ecosystem</p>
      </footer>
    </div>
  )
}
