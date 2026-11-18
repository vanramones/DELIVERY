import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Expandable from './components/Expandable'
import CustomCursor from './components/CustomCursor'
import ChapterNext, { CHAPTERS } from './components/ChapterNext'
import { Bars3D, HeroScene } from './components/Three'
import { Card, COLORS, CrossTable, Donut, HBars, InView, Insight, Section, Stacked, Stat } from './components/ui'
import { N, ageStats, avgAgeBy, cross, fmtP, freq, labels, rows, strength, tests, yesRate, type CatKey } from './data/stats'

const pct = (n: number) => n.toFixed(1) + '%'
const top = (k: CatKey) => freq(k).reduce((a, b) => (b.count > a.count ? b : a))
const get = (k: CatKey, name: string) => freq(k).find((f) => f.name === name)!

const gender = freq('gender'), marital = freq('marital'), occ = freq('occupation'), inc = freq('income')
const ctype = freq('customerType'), out = freq('output'), fb = freq('feedback')
const outTests = tests('output'), fbTests = tests('feedback')
const ctOut = cross('customerType', 'output')
const incOut = cross('income', 'output')
const yesByType = yesRate('customerType', 'output')
const posByType = yesRate('customerType', 'feedback')
const fbOut = cross('feedback', 'output')
const noInc = get('income', 'No Income')
const students = get('occupation', 'Student')
const yes = get('output', 'Yes'), pos = get('feedback', 'Positive')

const variables: [CatKey | 'age', string, string][] = [
  ['age', 'Numeric (ratio)', 'Age in years'],
  ['gender', 'Nominal', 'Male / Female'],
  ['marital', 'Nominal', 'Single / Married / Prefer not to say'],
  ['occupation', 'Nominal', 'Student / Employee / Self-Employed / Housewife'],
  ['income', 'Ordinal', 'No Income → More than Rs. 50,000'],
  ['customerType', 'Ordinal', 'New / Regular / Frequent'],
  ['output', 'Binary', 'Will continue ordering? Yes / No'],
  ['feedback', 'Binary', 'Positive / Negative'],
]

function SigTable({ target, list }: { target: string; list: ReturnType<typeof tests> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="py-2">Variable vs {target}</th><th className="text-right">χ²</th><th className="text-right">df</th><th className="text-right">p-value</th><th className="text-right">Cramér's V</th><th className="text-right">Decision</th></tr></thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.rowKey} className="border-t border-white/5">
              <td className="py-2">{labels[c.rowKey]}</td>
              <td className="text-right tabular-nums">{c.chi2.toFixed(2)}</td>
              <td className="text-right">{c.df}</td>
              <td className="text-right tabular-nums">{fmtP(c.p)}</td>
              <td className="text-right tabular-nums">{c.cramersV.toFixed(3)} <span className="text-xs text-slate-500">({strength(c.cramersV)})</span></td>
              <td className={`text-right font-semibold ${c.p < 0.05 ? 'text-mint' : 'text-rose'}`}>{c.p < 0.05 ? 'Related' : 'Not related'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function App() {
  const [cur, setCur] = useState(0)
  const ref = useRef(0)
  const sync = (e: React.UIEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return
    const i = Math.round(e.currentTarget.scrollTop / window.innerHeight)
    if (i !== ref.current) { ref.current = i; setCur(i) }
  }

  const sigOut = outTests.filter((c) => c.p < 0.05 && c.rowKey !== 'feedback').map((c) => labels[c.rowKey])
  const sigFb = fbTests.filter((c) => c.p < 0.05 && c.rowKey !== 'output').map((c) => labels[c.rowKey])
  const bestType = [...yesByType].sort((a, b) => b.rate - a.rate)[0]
  const age2026 = ageStats.groups.filter((g) => ['21–23', '24–26'].includes(g.name)).reduce((a, g) => a + g.pct, 0)
  const yesIfPos = fbOut.table[0][0] / fbOut.rowTotals[0] * 100
  const yesIfNeg = fbOut.table[1][0] / fbOut.rowTotals[1] * 100

  return (
    <div onScroll={sync} className="relative h-dvh overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(255,122,26,.18),transparent_40%),radial-gradient(circle_at_85%_30%,rgba(56,189,248,.14),transparent_40%)]" />
      <CustomCursor />
      <div className="blob -left-24 top-10 h-96 w-96 bg-brand" />
      <div className="blob -right-24 top-1/2 h-96 w-96 bg-sky [animation-delay:-6s]" />
      <div className="bg-grid pointer-events-none fixed inset-0 -z-10" />
      <ChapterNext cur={cur} />
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/60 shadow-lg shadow-black/30 backdrop-blur-xl">
        <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-brand to-brand2 transition-all duration-700" style={{ width: (cur / 3) * 100 + "%" }} />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="font-display text-lg font-bold"><span className="grad-text">OFD</span> Statistics</div>
          <div className="flex items-center gap-2">
            {cur > 0 && <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-widest text-brand2 sm:block sm:text-xs">{CHAPTERS[cur].toUpperCase()}</div>}
            <button onClick={() => window.dispatchEvent(new CustomEvent('ofd-go', { detail: 0 }))} disabled={cur === 0} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-brand2 px-4 py-1.5 text-xs font-bold text-black transition enabled:hover:scale-105 disabled:opacity-60">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" /></svg>HOME
            </button>
          </div>
        </div>
      </nav>

      <header id="hero" className="mx-auto grid h-dvh max-w-7xl content-start items-center gap-6 overflow-y-auto pb-16 pl-4 pr-14 pt-20 sm:pl-5 md:pr-20 lg:grid-cols-2 lg:content-center lg:pb-8">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <div className="mb-4 inline-block rounded-full border border-brand/40 bg-brand/10 px-4 py-1 text-xs tracking-widest text-brand2">A RESEARCH STUDY ON QUANTITATIVE METHODS</div>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl md:text-7xl">Customer Behavior & Satisfaction in <span className="grad-text">Online Food Delivery</span></h1>
          <p className="mt-6 max-w-xl text-slate-400">A quantitative research study uncovering what drives customer satisfaction and repeat orders in online food delivery — powered by real data.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#ch3" className="rounded-full bg-gradient-to-r from-brand to-brand2 px-6 py-3 font-semibold text-black shadow-lg shadow-brand/30 transition hover:scale-105">Start with Chapter III</a>
            <a href="#ch4" className="glass rounded-full px-6 py-3 font-semibold">Jump to Results</a>
          </div>
          <div className="mt-10 text-xs text-slate-500">
            <div className="mb-1 tracking-widest text-slate-400">RESEARCHERS · BSIT 4D</div>
            Osit, Mark Aljohn · Ramones, Jovan · Billate, Kim Llyod · Castillo, Jeneul · Cabanatan, Tricia · Selencio, Roldan Jr.
            <div className="mt-2">Presented to: Maria Lina Ero, BSIT Lecturer · 2026</div>
          </div>
        </motion.div>
        <div className="h-[320px] sm:h-[420px] lg:h-[600px]">
          <HeroScene data={[{ value: yes.count, color: '#ff7a1a' }, { value: out[1].count, color: '#38bdf8' }]} />
        </div>
      </header>

      <Section id="ch3" chapter="CHAPTER III" title="Methodology" sub="A structured survey collected responses from online food delivery users, capturing demographic profile, ordering behavior and satisfaction outcomes.">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Stat value={String(N)} label="Respondents" sub="valid records, 0 missing" />
          <Stat value="8" label="Survey Variables" color="#38bdf8" sub="1 numeric · 7 categorical" />
          <Stat value={`${ageStats.min}–${ageStats.max}`} label="Age Range" color="#34d399" />
          <Stat value={ageStats.mean.toFixed(1)} label="Average Age" color="#a78bfa" sub={`SD = ${ageStats.sd.toFixed(2)}`} />
          <Stat value={String(N * 8)} label="Data Points" color="#fb7185" sub={`${N} × 8`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Variables Collected" note="Level of measurement determines the statistical tool used.">
            <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="py-1">Variable</th><th>Type</th><th>Values</th></tr></thead>
              <tbody>
                {variables.map(([k, t, v]) => (
                  <tr key={k} className="border-t border-white/5"><td className="py-1.5 font-medium text-brand2">{labels[k]}</td><td>{t}</td><td className="text-slate-400">{v}</td></tr>
                ))}
              </tbody>
            </table></div>
          </Card>
          <Card title="Statistical Treatment" note="Tools applied to answer the Statement of the Problem.">
            <ul className="space-y-3 text-sm text-slate-300">
              {[
                ['Frequency & Percentage', 'Profile of customers; distribution of customer type, feedback and output (Problems 1–2).'],
                ['Mean, Median, Mode, SD', 'Describe the numeric variable Age.'],
                ['Cross-tabulation', 'Compare feedback and output across each customer characteristic.'],
                ['Chi-Square Test of Independence', 'α = 0.05; tests whether two categorical variables are significantly related (Problem 3).'],
                ["Cramér's V", 'Effect size of association: <0.1 negligible, <0.2 weak, <0.4 moderate, ≥0.4 strong.'],
              ].map(([a, b], i) => (
                <li key={a} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand">{i + 1}</span><span><b className="text-white">{a}</b><br />{b}</span></li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">Data preparation: text values were trimmed (e.g., "Negative ") and labels standardized ("Self Employeed" → Self-Employed). No missing values were found.</p>
          </Card>
        </div>

        <Card title="Sample of the Raw Data" note={`First 28 of ${N} records — each row is one respondent, each column one survey variable.`}>
          <div className="max-h-96 overflow-auto rounded-xl border border-white/5">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="sticky top-0 bg-panel text-xs uppercase tracking-wider text-brand2">
                <tr><th className="p-2 text-left">#</th>{(Object.keys(labels) as (keyof typeof labels)[]).map((k) => <th key={k} className="p-2 text-left">{labels[k]}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(0, 28).map((r, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-2 text-slate-500">{i + 1}</td><td className="p-2">{r.age}</td><td className="p-2">{r.gender}</td><td className="p-2">{r.marital}</td><td className="p-2">{r.occupation}</td><td className="p-2">{r.income}</td><td className="p-2">{r.customerType}</td>
                    <td className={`p-2 ${r.output === 'Yes' ? 'text-mint' : 'text-rose'}`}>{r.output}</td><td className={`p-2 ${r.feedback === 'Positive' ? 'text-mint' : 'text-rose'}`}>{r.feedback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      <Section id="ch4" chapter="CHAPTER IV" title="Presentation and Analysis of Data" sub="Findings, summaries and explanation of the data. All values are computed directly from the dataset.">
        <h3 className="font-display text-2xl font-bold">4.1 Age of Respondents</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <Stat value={ageStats.mean.toFixed(2)} label="Mean" />
          <Stat value={String(ageStats.median)} label="Median" color="#38bdf8" />
          <Stat value={`${ageStats.mode}`} label="Mode" color="#34d399" sub={`${ageStats.modeCount} respondents`} />
          <Stat value={ageStats.sd.toFixed(2)} label="Std. Deviation" color="#a78bfa" />
          <Stat value={`${ageStats.min}`} label="Minimum" color="#fb7185" />
          <Stat value={`${ageStats.max}`} label="Maximum" color="#fbbf24" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Age Distribution" className="lg:col-span-2">
            <InView className="h-[360px]">
              <Expandable height={360} render={(h) => <Bars3D cats={ageStats.distribution.map((d) => d.age)} series={[{ name: 'Respondents', color: '#38bdf8', values: ageStats.distribution.map((d) => d.count) }]} colors={ageStats.distribution.map((d) => (d.age === String(ageStats.mode) ? '#ff7a1a' : '#38bdf8'))} height={h} />} />
            </InView>
          </Card>
          <Card title="Age Groups">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="py-1">Group</th><th className="text-right">f</th><th className="text-right">%</th></tr></thead>
              <tbody>{ageStats.groups.map((g) => <tr key={g.name} className="border-t border-white/5"><td className="py-2">{g.name}</td><td className="text-right">{g.count}</td><td className="text-right text-brand2">{pct(g.pct)}</td></tr>)}</tbody>
            </table>
            <div className="mt-4"><Insight>{pct(age2026)} of respondents are aged 21–26; the most common age is {ageStats.mode} (n = {ageStats.modeCount}).</Insight></div>
          </Card>
        </div>

        <h3 className="font-display pt-6 text-2xl font-bold">4.2 Respondent Profile</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card title={`Gender (n = ${N})`}><Donut data={gender} /></Card>
          <Card title="Marital Status"><Donut data={marital} /></Card>
          <Card title="Occupation"><Donut data={occ} /></Card>
        </div>
        <Insight>Respondents skew {top('gender').name.toLowerCase()} ({pct(top('gender').pct)}) and {top('marital').name.toLowerCase()} ({pct(top('marital').pct)}). {students.name}s dominate the sample ({pct(students.pct)}), followed by employees ({pct(get('occupation', 'Employee').pct)}).</Insight>

        <h3 className="font-display pt-6 text-2xl font-bold">4.3 Income Level & Customer Type</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Monthly Income"><HBars data={inc} /></Card>
          <Card title="Customer Type"><Donut data={ctype} /></Card>
        </div>
        <Insight>{pct(noInc.pct)} ({noInc.count}) report no personal income — and {pct((students.count / N) * 100)} are students. Regular customers are the largest segment ({pct(get('customerType', 'Regular').pct)}), then Frequent ({pct(get('customerType', 'Frequent').pct)}) and New ({pct(get('customerType', 'New').pct)}).</Insight>

        <h3 className="font-display pt-6 text-2xl font-bold">4.4 Reorder Intent & Overall Feedback</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Will Order Again? (Output)">
            <div className="mb-2 font-display text-5xl font-bold text-brand">{pct(yes.pct)}</div>
            <Donut data={out} />
          </Card>
          <Card title="Overall Feedback">
            <div className="mb-2 font-display text-5xl font-bold text-sky">{pct(pos.pct)}</div>
            <Donut data={fb} />
          </Card>
        </div>

        <h3 className="font-display pt-6 text-2xl font-bold">4.5 Reorder Intent by Customer Type (3D)</h3>
        <Card title="Yes-rate and Positive-feedback rate by segment" note="All charts are 3D — move your mouse over a chart to rotate it. Values are percentages within each customer type.">
          <InView className="h-[410px]">
            <Expandable height={380} render={(h) => <Bars3D cats={yesByType.map((d) => `${d.name} (n=${d.n})`)} unit="%" series={[{ name: 'Will reorder', color: '#ff7a1a', values: yesByType.map((d) => d.rate) }, { name: 'Positive feedback', color: '#38bdf8', values: posByType.map((d) => d.rate) }]} height={h} />} />
          </InView>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Output (Yes/No) by Customer Type"><CrossTable c={ctOut} /></Card>
          <Card title="Yes-rate by Segment">
            <div className="space-y-4">
              {[...yesByType].reverse().map((d, i) => (
                <div key={d.name}>
                  <div className="mb-1 flex justify-between text-sm"><span>{d.name} <span className="text-slate-500">({d.hit}/{d.n})</span></span><b className="text-brand2">{pct(d.rate)}</b></div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} whileInView={{ width: d.rate + '%' }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.15 }} className="h-full rounded-full" style={{ background: COLORS[i] }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-5"><Insight>{bestType.name} customers show the highest reorder intent ({pct(bestType.rate)}). The difference across customer types is {ctOut.p < 0.05 ? '' : 'not '}statistically significant (χ²({ctOut.df}) = {ctOut.chi2.toFixed(2)}, p = {fmtP(ctOut.p)}).</Insight></div>
          </Card>
        </div>

        <h3 className="font-display pt-6 text-2xl font-bold">4.6 Relationship Tests (Chi-Square, α = 0.05)</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Which characteristics relate to Output?" note="H₀: the variable is independent of reorder intent."><SigTable target="Output" list={outTests} /></Card>
          <Card title="Which characteristics relate to Feedback?" note="H₀: the variable is independent of feedback."><SigTable target="Feedback" list={fbTests} /></Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Output by Monthly Income"><Stacked c={incOut} /><CrossTable c={incOut} /></Card>
          <Card title="Output by Feedback"><Stacked c={fbOut} /><CrossTable c={fbOut} /></Card>
          <Card title="Output by Occupation"><Stacked c={cross('occupation', 'output')} /><CrossTable c={cross('occupation', 'output')} /></Card>
          <Card title="Feedback by Monthly Income"><Stacked c={cross('income', 'feedback')} /><CrossTable c={cross('income', 'feedback')} /></Card>
          <Card title="Output by Marital Status"><Stacked c={cross('marital', 'output')} /><CrossTable c={cross('marital', 'output')} /></Card>
          <Card title="Output by Gender"><Stacked c={cross('gender', 'output')} /><CrossTable c={cross('gender', 'output')} /></Card>
        </div>
        <Card title="Average Age by Customer Type">
          <div className="grid gap-4 sm:grid-cols-3">{avgAgeBy('customerType').map((a, i) => <Stat key={a.name} value={a.mean.toFixed(1)} label={a.name} color={COLORS[i]} sub="mean age" />)}</div>
        </Card>
        <Insight>Reorder intent is significantly related to {sigOut.join(', ')} and to Feedback; it is not significantly related to {outTests.filter((c) => c.p >= 0.05).map((c) => labels[c.rowKey]).join(', ')}. Feedback is significantly related to {sigFb.join(', ')}; not to {fbTests.filter((c) => c.p >= 0.05).map((c) => labels[c.rowKey]).join(', ')}. Caution: some cells have expected counts below 5, so the tests on small groups (e.g., "Prefer not to say", Housewife) should be read with care.</Insight>
      </Section>

      <Section id="ch5" chapter="CHAPTER V" title="Interpretation, Conclusion & Decision-Making" sub="What the statistics mean and what the business should do.">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Interpretation of Findings">
            <ol className="space-y-4 text-sm text-slate-300">
              {[
                `Users are mostly young (mean age ${ageStats.mean.toFixed(1)}, SD ${ageStats.sd.toFixed(2)}), ${top('marital').name.toLowerCase()} (${pct(top('marital').pct)}) and ${students.name.toLowerCase()}s (${pct(students.pct)}).`,
                `${pct(noInc.pct)} report no personal income, yet ${pct(get('customerType', 'Regular').pct + get('customerType', 'Frequent').pct)} are Regular or Frequent customers — usage is not limited by income.`,
                `${pct(yes.pct)} intend to reorder and ${pct(pos.pct)} gave positive feedback. ${pct(yesIfPos)} of positive respondents would reorder vs ${pct(yesIfNeg)} of negative ones (χ² = ${fbOut.chi2.toFixed(1)}, p ${fmtP(fbOut.p)}, V = ${fbOut.cramersV.toFixed(2)}, ${strength(fbOut.cramersV)} association).`,
                `${bestType.name} customers have the highest reorder intent (${pct(bestType.rate)}), but customer type itself is not a significant predictor (p = ${fmtP(ctOut.p)}).`,
                `Occupation, marital status and monthly income are significantly (moderately) associated with reorder intent and feedback; gender is not.`,
              ].map((t, i) => <li key={i} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-black">{i + 1}</span><span>{t}</span></li>)}
            </ol>
          </Card>
          <Card title="Conclusion">
            <p className="text-slate-300 leading-relaxed">Online food delivery adoption among respondents is concentrated in young, single students, and satisfaction is the strongest statistical signal of continued use. Positive feedback is closely tied to intent to reorder, while demographic factors such as occupation, marital status and income show a moderate relationship with both outcomes. Consistent positive experience is what turns first-time users into loyal, repeat customers.</p>
            <div className="mt-5"><Insight>With p &lt; .05 for Feedback–Output, we reject the null hypothesis: feedback and reorder intent are <b>not</b> independent.</Insight></div>
          </Card>
        </div>
        <h3 className="font-display pt-4 text-2xl font-bold">Decision-Making & Action Plan</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Target Students & Young Adults', `Focus promos and campus-based marketing on ages 21–26 (${pct(age2026)} of users).`],
            ['Keep Pricing Student-Friendly', `Sustain budget bundles and discounts since ${pct(noInc.pct)} report no personal income.`],
            ['Strengthen the Regular → Frequent Pipeline', `Use loyalty rewards to convert Regular customers (${pct(yesByType.find((d) => d.name === 'Regular')!.rate)} reorder) into Frequent ones.`],
            [`Address the ${pct(get('feedback', 'Negative').pct)} Negative Feedback`, `Only ${pct(yesIfNeg)} of unsatisfied users would reorder; investigate causes (delivery delay, order accuracy) to close the gap.`],
          ].map(([t, d], i) => (
            <motion.div key={t} whileHover={{ y: -4 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass flex gap-4 p-5">
              <div className="font-display text-4xl font-bold text-brand/70">0{i + 1}</div>
              <div><div className="font-display text-lg font-bold">{t}</div><p className="mt-1 text-sm text-slate-400">{d}</p></div>
            </motion.div>
          ))}
        </div>
      </Section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">OFD Research · BSIT 4D · Data: Online-food-delivery-dataset-Cleaned.csv ({N} records)</footer>
    </div>
  )
}
