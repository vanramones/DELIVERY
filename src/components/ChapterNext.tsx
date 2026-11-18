import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ids = ['hero', 'ch3', 'ch4', 'ch5']
const names = ['Home', 'Chapter III', 'Chapter IV', 'Chapter V']

export default function ChapterNext() {
  const [cur, setCur] = useState(0)
  const [loading, setLoading] = useState(false)
  const timer = useRef<number>(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.4
      let c = 0
      ids.forEach((id, i) => { if (document.getElementById(id)!.offsetTop <= y) c = i })
      setCur(c)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const last = cur === ids.length - 1
  const go = () => {
    if (loading) return
    const target = last ? 0 : cur + 1
    setLoading(true)
    document.body.style.overflow = 'hidden'
    timer.current = window.setTimeout(() => {
      document.getElementById(ids[target])!.scrollIntoView()
      setLoading(false)
      document.body.style.overflow = ''
    }, 4000)
  }

  return (
    <>
      <motion.button
        onClick={go}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={last ? 'Back to start' : `Next: ${names[cur + 1]}`}
        className="fixed right-5 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full bg-gradient-to-b from-brand to-brand2 px-3 py-5 text-black shadow-lg shadow-brand/40"
      >
        <span className="font-display text-[10px] font-bold uppercase tracking-widest [writing-mode:vertical-rl]">{last ? 'Start' : names[cur + 1]}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={last ? '-rotate-90' : ''}>
          <path d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,122,26,.25),transparent_55%)]" />
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }} className="relative mb-8 h-20 w-20 rounded-full border-4 border-white/10 border-t-brand" />
            <h2 className="font-display relative text-3xl font-bold tracking-wide md:text-5xl"><span className="grad-text">Online Food Delivery</span></h2>
            <p className="relative mt-3 text-sm tracking-widest text-slate-400">LOADING {names[last ? 0 : cur + 1].toUpperCase()}…</p>
            <div className="relative mt-8 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 4, ease: 'linear' }} className="h-full bg-gradient-to-r from-brand to-brand2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
