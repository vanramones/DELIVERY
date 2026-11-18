import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
  return (
    <motion.div whileHover={{ y: -4 }} className="glass relative overflow-hidden p-5">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-25 blur-2xl" style={{ background: color }} />
      <div className="font-display text-4xl font-bold" style={{ color }}>{value}</div>
      <div className="mt-1 text-sm font-medium text-slate-200">{label}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
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

const tip = { contentStyle: { background: '#0e1424', border: '1px solid #26304d', borderRadius: 12, color: '#fff' }, itemStyle: { color: '#fff' } }

export function Donut({ data }: { data: Freq[] }) {
  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="name" innerRadius="58%" outerRadius="90%" paddingAngle={3} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip {...tip} formatter={(v) => [`${v}`, 'Respondents']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
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
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid stroke="#1e2640" horizontal={false} />
            <XAxis type="number" stroke="#64748b" />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" width={110} tick={{ fontSize: 12 }} />
            <Tooltip {...tip} cursor={{ fill: 'rgba(255,255,255,.05)' }} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <FreqTable data={data} />
    </div>
  )
}

export function Stacked({ c, height = 260 }: { c: Cross; height?: number }) {
  const data = c.rowCats.map((r, i) => ({ name: r, ...Object.fromEntries(c.colCats.map((k, j) => [k, +((c.table[i][j] / c.rowTotals[i]) * 100).toFixed(1)])) }))
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -10 }}>
          <CartesianGrid stroke="#1e2640" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} interval={0} angle={c.rowCats.length > 3 ? -25 : 0} textAnchor={c.rowCats.length > 3 ? 'end' : 'middle'} height={c.rowCats.length > 3 ? 60 : 30} />
          <YAxis stroke="#64748b" unit="%" domain={[0, 100]} />
          <Tooltip {...tip} formatter={(v) => `${v}%`} cursor={{ fill: 'rgba(255,255,255,.05)' }} />
          <Legend />
          {c.colCats.map((k, j) => <Bar key={k} dataKey={k} stackId="a" fill={j === 0 ? '#34d399' : '#fb7185'} radius={j === c.colCats.length - 1 ? [6, 6, 0, 0] : 0} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
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

export function InView({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.3 })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className={className}>{on && children}</div>
}
