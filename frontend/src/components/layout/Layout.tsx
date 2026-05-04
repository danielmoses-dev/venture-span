import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Building2, Zap,
  GitBranch, ShieldCheck, LogOut, Menu, X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCursorGlow } from '@/hooks/useCursorGlow'
import { pageTransition, fadeIn } from '@/lib/motionConfig'

const startupNav = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/browse/investors', icon: Users,           label: 'Investors'  },
  { to: '/profile/startup',  icon: Building2,       label: 'Profile'    },
  { to: '/insights',         icon: Zap,             label: 'ML Score'   },
  { to: '/connections',      icon: GitBranch,       label: 'Network'    },
  { to: '/verification',     icon: ShieldCheck,     label: 'Verify'     },
]
const investorNav = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/browse/startups',  icon: Building2,       label: 'Startups'   },
  { to: '/profile/investor', icon: Users,           label: 'Profile'    },
  { to: '/connections',      icon: GitBranch,       label: 'Network'    },
  { to: '/verification',     icon: ShieldCheck,     label: 'Verify'     },
]

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const nav = user?.role === 'startup' ? startupNav : investorNav

  return (
    <div className="flex flex-col h-full py-5 px-3">
      {/* Logo */}
      <div className="px-2 mb-8">
        <div className="flex items-center gap-2.5">
          {/* VS logomark */}
          <div className="relative w-8 h-8 shrink-0">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-400 to-violet-500 opacity-90" />
            <div className="absolute inset-0 rounded-lg flex items-center justify-center">
              <span className="font-display font-bold text-xs text-surface-base tracking-tight">VS</span>
            </div>
            {/* Glow behind logo */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-400 to-violet-500 blur-md opacity-30 -z-10 scale-110" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm text-gradient-brand leading-none">VentureSpan</p>
            <p className="text-2xs text-ink-tertiary mt-0.5 leading-none">Capital Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNav}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={15} className={isActive ? 'text-brand-400' : 'text-ink-tertiary'} strokeWidth={isActive ? 2 : 1.75} />
                <span>{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto w-1 h-1 rounded-full bg-brand-400"
                    style={{ boxShadow: '0 0 6px rgba(133,199,242,0.6)' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-surface-border space-y-1">
        <div className="px-2 mb-3">
          <p className="text-xs font-medium text-ink-secondary truncate">{user?.email}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success"
              style={{ boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
            <p className="text-2xs text-ink-tertiary capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="nav-item w-full text-left hover:text-danger hover:border-danger/10 hover:bg-danger/5"
        >
          <LogOut size={14} className="text-ink-tertiary" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useCursorGlow()

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  return (
    <div className="min-h-screen flex" style={{ background: '#080d14' }}>

      {/* Desktop sidebar — fixed glass */}
      <aside
        className="hidden md:flex flex-col w-56 glass fixed top-0 left-0 h-screen z-20 shrink-0"
        style={{ borderRight: '1px solid rgba(30,45,71,0.6)' }}
      >
        <SidebarContent />
      </aside>
      {/* Spacer */}
      <div className="hidden md:block w-56 shrink-0" />

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 glass h-14 flex items-center justify-between px-4"
        style={{ borderBottom: '1px solid rgba(30,45,71,0.6)' }}>
        <p className="font-display font-semibold text-sm text-gradient-brand">VentureSpan</p>
        <button onClick={() => setMobileOpen(v => !v)} className="btn btn-ghost p-2 -mr-1">
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-20 bg-surface-base/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
              className="md:hidden fixed top-0 left-0 h-screen w-56 z-30 glass"
              style={{ borderRight: '1px solid rgba(30,45,71,0.6)' }}
            >
              <div className="pt-14">
                <SidebarContent onNav={() => setMobileOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 min-h-screen pt-14 md:pt-0 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
