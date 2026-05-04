import { useEffect } from 'react'

/**
 * Tracks cursor → updates CSS vars → global body::before glow follows mouse
 * Throttled to 60fps via requestAnimationFrame for performance
 */
export function useCursorGlow() {
  useEffect(() => {
    let rafId: number
    let lastX = 0, lastY = 0

    const onMove = (e: MouseEvent) => {
      lastX = e.clientX; lastY = e.clientY
    }

    const tick = () => {
      document.documentElement.style.setProperty('--cursor-x', `${lastX}px`)
      document.documentElement.style.setProperty('--cursor-y', `${lastY}px`)
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    rafId = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])
}
