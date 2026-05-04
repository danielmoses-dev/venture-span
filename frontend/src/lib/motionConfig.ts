/**
 * Shared Framer Motion variants — import from @/lib/motionConfig
 * All transitions use spring physics or bezier curves matching Linear/Vercel feel
 */

const ease = [0.22, 1, 0.36, 1] as const // expo out — feels instant then lands
const easeIn = [0.4, 0, 1, 1] as const

export const fadeUp = {
  hidden:  { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.55, ease },
  },
}

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

export const fadeDown = {
  hidden:  { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
}

export const scaleUp = {
  hidden:  { opacity: 0, scale: 0.9, filter: 'blur(6px)' },
  visible: { opacity: 1, scale: 1,   filter: 'blur(0px)', transition: { duration: 0.5, ease } },
}

export const slideRight = {
  hidden:  { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease } },
}

export const stagger = (delay = 0.07) => ({
  hidden:  {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.05 } },
})

export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export const staggerFast = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04 } },
}

// Spring variants — for physics-feel elements
export const springPop = {
  hidden:  { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
}

export const springSlide = {
  hidden:  { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 350, damping: 30 },
  },
}

// Page transition
export const pageTransition = {
  initial:  { opacity: 0, y: 8 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
  exit:     { opacity: 0, y: -8, transition: { duration: 0.2, ease: easeIn } },
}
