import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

export default function Expandable({ render, height }: { render: (h: number) => ReactNode; height: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [h, setH] = useState(520)

  useEffect(() => {
    if (!open) return
    const size = () => setH(Math.round(Math.min(innerHeight * 0.68, 720)))
    size()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    addEventListener('resize', size)
    addEventListener('keydown', key)
    return () => {
      removeEventListener('resize', size)
      removeEventListener('keydown', key)
    }
  }, [open])

  const show = () => {
    setTitle(ref.current?.closest('.glass')?.querySelector('h3')?.textContent ?? '3D Chart')
    setOpen(true)
  }

  return (
    <div ref={ref} className="group relative">
      {!open && render(height)}
      {open && <div style={{ height }} />}
      <button onClick={show} aria-label="View in full screen" className="absolute right-1 top-1 z-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-ink/70 px-3 py-1.5 text-[11px] font-semibold text-slate-200 backdrop-blur transition hover:border-brand hover:text-white">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>VIEW
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-8">
              <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={(e) => e.stopPropagation()} className="glass relative w-full max-w-6xl overflow-hidden bg-panel/90 p-4 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-xs tracking-[0.3em] text-brand">3D VIEW</div>
                    <h3 className="font-display text-xl font-bold text-white sm:text-2xl">{title}</h3>
                  </div>
                  <button onClick={() => setOpen(false)} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-brand to-brand2 text-xl font-bold text-black transition hover:scale-110">✕</button>
                </div>
                <p className="mb-2 text-xs text-slate-400">Drag to rotate the chart · press Esc or click outside to close</p>
                <div className="overflow-hidden rounded-xl bg-ink/60">{render(h)}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
