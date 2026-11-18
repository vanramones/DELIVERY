import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Bars3D, Pie3D } from './Three'
import { type Cross, type Freq, fmtP, labels, strength } from '../data/stats'

export const COLORS = ['#ff7a1a', '#38bdf8', '#34d399', '#a78bfa', '#fb7185', '#fbbf24']

export function Section({ id, chapter, title, sub, children, onScroll }: { id: string; chapter: string; title: string; sub: string; children: ReactNode; onScroll?: React.UIEventHandler<HTMLElement> }) {
  return (
    <section id={id} onScroll={onScroll} className="mx-auto h-dvh max-w-7xl overflow-y-auto pb-16 pl-4 pr-14 pt-20 sm:pl-5 md:pr-24 md:pb-20">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
        <div className="font-display text-sm tracking-[0.3em] text-brand">{chapter}</div>
        <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl md:text-5xl">{title}</h2>
        <p className="mt-3 max-w-3xl text-slate-400">{sub}</p>
      </motion.div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

export function Card({ title, note, children, className = '' }: { title?: string; note?: string; children: ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} className={`glass min-w-0 p-4 sm:p-6 ${className}`}>
      {title && <h3 className="font-display mb-1 text-lg font-bold text-white">{title}</h3>}
      {note && <p className="mb-4 text-sm text-slate-400">{note}</p>}
      {children}
    </motion.div>
  )
}

export function Stat({ value, label, color = '#ff7a1a', sub }: { value: string; label: string; color?: string; sub?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    ref.current!.style.transform = `perspective(700px) rotateY(${x * 22}deg) rotateX(${-y * 22}deg) translateZ(14px)`
  }
  const leave = () => (ref.current!.style.transform = 'perspective(700px) rotateY(0) rotateX(0) translateZ(0)')
  return (
    <motion.div initial={{ opacity: 0, rotateX: -60, y: 30 }} whileInView={{ opacity: 1, rotateX: 0, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 80 }} style={{ perspective: 800 }}>
      <div ref={ref} onPointerMove={move} onPointerLeave={leave} className="glass relative overflow-hidden p-5 transition-transform duration-200 ease-out" style={{ transformStyle: 'preserve-3d', boxShadow: `0 18px 40px -22px ${color}` }}>
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-25 blur-2xl" style={{ background: color }} />
        <div className="font-display text-4xl font-bold" style={{ color, transform: 'translateZ(30px)', textShadow: `0 6px 18px ${color}66` }}>{value}</div>
        <div className="mt-1 text-sm font-medium text-slate-200" style={{ transform: 'translateZ(16px)' }}>{label}</div>
        {sub && <div className="text-xs text-slate-500" style={{ transform: 'translateZ(8px)' }}>{sub}</div>}
      </div>
    </motion.div>
  )
}

export function Insight({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border-l-4 border-brand bg-brand/10 p-4 text-sm leading-relaxed text-slate-200">
      <b className="text-brand2">Reading the data: </b>{children}
    </div>
  )
}

export function Donut({ data, center }: { data: Freq[]; center?: string }) {
  return (
    <div>
      <InView className="h-[280px]">
        <Pie3D data={data.map((d) => ({ name: d.name, value: d.count, pct: d.pct }))} colors={COLORS} center={center ?? String(data.reduce((a, b) => a + b.count, 0))} />
      </InView>
      <FreqTable data={data} />
    </div>
  )
}

export function FreqTable({ data }: { data: Freq[] }) {
  const total = data.reduce((a, b) => a + b.count, 0)
  return (
    <table className="mt-3 w-full text-sm">
      <thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="py-1">Category</th><th className="text-right">f</th><th className="text-right">%</th></tr></thead>
      <tbody>
        {data.map((d, i) => (
          <tr key={d.name} className="border-t border-white/5">
            <td className="py-1.5"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{d.name}</td>
            <td className="text-right tabular-nums">{d.count}</td>
            <td className="text-right tabular-nums text-brand2">{d.pct.toFixed(1)}%</td>
          </tr>
        ))}
        <tr className="border-t border-white/20 font-semibold"><td className="py-1.5">Total</td><td className="text-right">{total}</td><td className="text-right">100.0%</td></tr>
      </tbody>
    </table>
  )
}

export function HBars({ data }: { data: Freq[] }) {
  return (
    <div>
      <InView className="h-[340px]">
        <Bars3D cats={data.map((d) => d.name)} series={[{ name: 'Respondents', color: COLORS[0], values: data.map((d) => d.count) }]} colors={COLORS} height={340} />
      </InView>
      <FreqTable data={data} />
    </div>
  )
}

export function Stacked({ c, height = 340 }: { c: Cross; height?: number }) {
  const series = c.colCats.map((k, j) => ({ name: k, color: j === 0 ? '#34d399' : '#fb7185', values: c.rowCats.map((_, i) => +((c.table[i][j] / c.rowTotals[i]) * 100).toFixed(1)) }))
  return (
    <InView className="mb-2" style={{ height: height + 28 }}>
      <Bars3D cats={c.rowCats} series={series} unit="%" stacked height={height} />
    </InView>
  )
}

export function CrossTable({ c }: { c: Cross }) {
  const sig = c.p < 0.05
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-slate-500">
              <th className="py-2 text-left">{labels[c.rowKey]}</th>
              {c.colCats.map((k) => <th key={k} className="text-right">{k}</th>)}
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {c.rowCats.map((r, i) => (
              <tr key={r} className="border-t border-white/5">
                <td className="py-1.5">{r}</td>
                {c.table[i].map((v, j) => <td key={j} className="text-right tabular-nums">{v} <span className="text-xs text-slate-500">({((v / c.rowTotals[i]) * 100).toFixed(1)}%)</span></td>)}
                <td className="text-right font-semibold tabular-nums">{c.rowTotals[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-white/10 px-3 py-1">χ²({c.df}) = {c.chi2.toFixed(2)}</span>
        <span className="rounded-full bg-white/10 px-3 py-1">p {c.p < 0.001 ? '' : '= '}{fmtP(c.p)}</span>
        <span className="rounded-full bg-white/10 px-3 py-1">Cramér's V = {c.cramersV.toFixed(3)} ({strength(c.cramersV)})</span>
        <span className={`rounded-full px-3 py-1 font-semibold ${sig ? 'bg-mint/20 text-mint' : 'bg-rose/20 text-rose'}`}>{sig ? 'Significant (p < .05)' : 'Not significant'}</span>
        {c.lowExpected > 0 && <span className="rounded-full bg-amber-400/15 px-3 py-1 text-amber-300">{c.lowExpected} cell(s) with expected count &lt; 5</span>}
      </div>
    </div>
  )
}

export function InView({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.15 })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className={className} style={style}>{on && children}</div>
}
