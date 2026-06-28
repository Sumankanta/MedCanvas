import { useEffect, useRef, useState } from 'react'

// Smoothly animates a numeric value from its previous value to the next.
// Returns the current displayed numeric value.
export function useCountUp(target, { duration = 700 } = {}) {
  const numericTarget = Number.isFinite(Number(target)) ? Number(target) : 0
  const [display, setDisplay] = useState(numericTarget)
  const fromRef = useRef(numericTarget)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const to = numericTarget
    if (from === to) return undefined

    const start = performance.now()
    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / Math.max(50, duration))
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = from + (to - from) * eased
      setDisplay(value)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
        setDisplay(to)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [numericTarget, duration])

  return display
}
