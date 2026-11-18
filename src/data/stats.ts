import raw from './dataset.csv?raw'

export interface Row {
  age: number
  gender: string
  marital: string
  occupation: string
  income: string
  customerType: string
  output: string
  feedback: string
}

export const rows: Row[] = raw
  .split(/\r?\n/)
  .filter((l) => l.trim())
  .slice(1)
  .map((l) => {
    const c = l.split(',').map((s) => s.trim())
    return {
      age: +c[0],
      gender: c[1],
      marital: c[2],
      occupation: c[3] === 'Self Employeed' ? 'Self-Employed' : c[3] === 'House wife' ? 'Housewife' : c[3],
      income: c[4],
      customerType: c[5],
      output: c[6],
      feedback: c[7],
    }
  })

export const N = rows.length
export type CatKey = Exclude<keyof Row, 'age'>

export const labels: Record<keyof Row, string> = {
  age: 'Age',
  gender: 'Gender',
  marital: 'Marital Status',
  occupation: 'Occupation',
  income: 'Monthly Income',
  customerType: 'Customer Type',
  output: 'Output (Reorder Intent)',
  feedback: 'Feedback',
}

const orders: Partial<Record<CatKey, string[]>> = {
  income: ['No Income', 'Below Rs.10000', '10001 to 25000', '25001 to 50000', 'More than 50000'],
  customerType: ['New', 'Regular', 'Frequent'],
  marital: ['Single', 'Married', 'Prefer not to say'],
  output: ['Yes', 'No'],
  feedback: ['Positive', 'Negative'],
}

export interface Freq {
  name: string
  count: number
  pct: number
}

export function freq(key: CatKey): Freq[] {
  const m = new Map<string, number>()
  rows.forEach((r) => m.set(r[key], (m.get(r[key]) ?? 0) + 1))
  const o = orders[key]
  return [...m.entries()]
    .map(([name, count]) => ({ name, count, pct: (count / N) * 100 }))
    .sort((a, b) => (o ? o.indexOf(a.name) - o.indexOf(b.name) : b.count - a.count))
}

export function categories(key: CatKey) {
  return freq(key).map((f) => f.name)
}

const ages = rows.map((r) => r.age).sort((a, b) => a - b)
const mean = ages.reduce((a, b) => a + b, 0) / N
const sd = Math.sqrt(ages.reduce((a, b) => a + (b - mean) ** 2, 0) / (N - 1))
const ageCounts = new Map<number, number>()
ages.forEach((a) => ageCounts.set(a, (ageCounts.get(a) ?? 0) + 1))
const mode = [...ageCounts.entries()].sort((a, b) => b[1] - a[1])[0]

export const ageStats = {
  mean,
  sd,
  median: (ages[N / 2 - 1] + ages[N / 2]) / 2,
  min: ages[0],
  max: ages[N - 1],
  mode: mode[0],
  modeCount: mode[1],
  q1: ages[Math.floor(N * 0.25)],
  q3: ages[Math.floor(N * 0.75)],
  distribution: [...ageCounts.entries()].sort((a, b) => a[0] - b[0]).map(([age, count]) => ({ age: String(age), count })),
  groups: [
    ['18–20', 18, 20],
    ['21–23', 21, 23],
    ['24–26', 24, 26],
    ['27–29', 27, 29],
    ['30–33', 30, 33],
  ].map(([name, lo, hi]) => {
    const count = ages.filter((a) => a >= (lo as number) && a <= (hi as number)).length
    return { name: name as string, count, pct: (count / N) * 100 }
  }),
}

export interface Cross {
  rowKey: CatKey
  colKey: CatKey
  rowCats: string[]
  colCats: string[]
  table: number[][]
  rowTotals: number[]
  colTotals: number[]
  chi2: number
  df: number
  p: number
  cramersV: number
  lowExpected: number
}

function lgamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]
  let y = x
  let t = x + 5.5
  t -= (x + 0.5) * Math.log(t)
  let s = 1.000000000190015
  for (const k of c) s += k / ++y
  return -t + Math.log((2.5066282746310005 * s) / x)
}

function gammaQ(a: number, x: number): number {
  if (x <= 0) return 1
  if (x < a + 1) {
    let sum = 1 / a
    let del = sum
    let ap = a
    for (let n = 0; n < 500; n++) {
      ap++
      del *= x / ap
      sum += del
      if (Math.abs(del) < Math.abs(sum) * 1e-14) break
    }
    return 1 - sum * Math.exp(-x + a * Math.log(x) - lgamma(a))
  }
  let b = x + 1 - a
  let c = 1e300
  let d = 1 / b
  let h = d
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < 1e-300) d = 1e-300
    c = b + an / c
    if (Math.abs(c) < 1e-300) c = 1e-300
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-14) break
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h
}

export function cross(rowKey: CatKey, colKey: CatKey): Cross {
  const rowCats = categories(rowKey)
  const colCats = categories(colKey)
  const table = rowCats.map(() => colCats.map(() => 0))
  rows.forEach((r) => table[rowCats.indexOf(r[rowKey])][colCats.indexOf(r[colKey])]++)
  const rowTotals = table.map((r) => r.reduce((a, b) => a + b, 0))
  const colTotals = colCats.map((_, j) => table.reduce((a, r) => a + r[j], 0))
  let chi2 = 0
  let lowExpected = 0
  table.forEach((r, i) =>
    r.forEach((o, j) => {
      const e = (rowTotals[i] * colTotals[j]) / N
      if (e < 5) lowExpected++
      chi2 += (o - e) ** 2 / e
    }),
  )
  const df = (rowCats.length - 1) * (colCats.length - 1)
  const p = gammaQ(df / 2, chi2 / 2)
  const cramersV = Math.sqrt(chi2 / (N * Math.min(rowCats.length - 1, colCats.length - 1)))
  return { rowKey, colKey, rowCats, colCats, table, rowTotals, colTotals, chi2, df, p, cramersV, lowExpected }
}

export const fmtP = (p: number) => (p < 0.001 ? '< .001' : p.toFixed(3))
export const strength = (v: number) => (v < 0.1 ? 'negligible' : v < 0.2 ? 'weak' : v < 0.4 ? 'moderate' : 'strong')

export const predictors: CatKey[] = ['gender', 'marital', 'occupation', 'income', 'customerType']
export const tests = (target: 'output' | 'feedback') =>
  [...predictors, ...(target === 'output' ? (['feedback'] as CatKey[]) : (['output'] as CatKey[]))].map((k) => cross(k, target))

export const yesRate = (key: CatKey, target: 'output' | 'feedback') => {
  const pos = target === 'output' ? 'Yes' : 'Positive'
  return categories(key).map((name) => {
    const g = rows.filter((r) => r[key] === name)
    const hit = g.filter((r) => r[target] === pos).length
    return { name, n: g.length, hit, rate: (hit / g.length) * 100 }
  })
}

export const avgAgeBy = (key: CatKey) =>
  categories(key).map((name) => {
    const g = rows.filter((r) => r[key] === name)
    return { name, mean: g.reduce((a, r) => a + r.age, 0) / g.length }
  })
