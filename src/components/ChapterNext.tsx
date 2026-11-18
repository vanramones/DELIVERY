import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ids = ['hero', 'ch3', 'ch4', 'ch5']
export const CHAPTERS = ['Home', 'Chapter III', 'Chapter IV', 'Chapter V']

export default function ChapterNext({ cur }: { cur: number }) {
  const [loading, setLoading] = useState(false)
  const [target, setTarget] = useState(0)
  const last = cur === ids.length - 1
  const goTo = (target: number) => {
    if (loading || target === cur) return
    setTarget(target)
    setLoading(true)
    setTimeout(() => {
      document.getElementById(ids[target])!.scrollIntoView()
      setLoading(false)
    }, 3000)
  }
  const go = () => !last && goTo(cur + 1)
  useEffect(() => {
    const h = (e: Event) => goTo((e as CustomEvent<number>).detail)
    window.addEventListener('ofd-go', h)
    return () => window.removeEventListener('ofd-go', h)
  })

  return (
    <>
      <AnimatePresence>
        {!last && (
          <motion.button
            onClick={go}
            exit={{ opacity: 0, x: 30 }}
            whileHover={{ scale: loading ? 1 : 1.15 }}
            whileTap={{ scale: 0.9 }}
            animate={{ x: [0, 8, 0] }}
            transition={{ x: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } }}
            aria-label={`Go to ${CHAPTERS[cur + 1]}`}
            className={`arrow-pulse fixed right-2 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center md:right-5 md:h-14 md:w-14 justify-center rounded-full bg-gradient-to-b from-brand to-brand2 text-black shadow-[0_0_28px_6px_rgba(255,122,26,.55)] ring-2 ring-white/30 ${loading ? 'opacity-40' : ''}`}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l6 6-6 6" /><path d="M13 6l6 6-6 6" /></svg>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,122,26,.25),transparent_55%)]" />
            <h2 className="font-display relative px-4 text-center text-2xl font-bold tracking-wide sm:text-3xl md:text-5xl"><span className="grad-text">Online Food Delivery</span></h2>
            <p className="relative mt-3 text-sm tracking-widest text-slate-400">LOADING {CHAPTERS[target].toUpperCase()}…</p>
            <div className="relative mt-8 h-1.5 w-56 sm:w-64 overflow-hidden rounded-full bg-white/10">
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3, ease: 'linear' }} className="h-full bg-gradient-to-r from-brand to-brand2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
