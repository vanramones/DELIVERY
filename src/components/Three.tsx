import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function useScene(build: (s: { scene: THREE.Scene; camera: THREE.PerspectiveCamera; tick: (fn: (t: number, m: { x: number; y: number }) => void) => void }) => void, deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current!
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    const fns: ((t: number, m: { x: number; y: number }) => void)[] = []
    const mouse = { x: 0, y: 0 }
    scene.add(new THREE.AmbientLight(0xffffff, 1.3))
    const dl = new THREE.DirectionalLight(0xffffff, 2.6)
    dl.position.set(5, 8, 6)
    scene.add(dl)
    build({ scene, camera, tick: (f) => fns.push(f) })
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el
      renderer.setSize(w, h)
      camera.aspect = w / h
      const fw = camera.userData.fitW as number | undefined
      camera.zoom = fw ? Math.min(1.1, (camera.aspect * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.length()) / fw) : Math.min(1, camera.aspect / 1.4)
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2
      mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2
    }
    el.addEventListener('pointermove', move)
    let raf = 0, t0 = -1
    const loop = (ms: number) => {
      if (t0 < 0) t0 = ms
      fns.forEach((f) => f((ms - t0) / 1000, mouse))
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('pointermove', move)
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        ;[mat].flat().forEach((x) => x?.dispose())
      })
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

function label(text: string, color = '#cbd5e1', h = 0.4, maxW = 99) {
  const c = document.createElement('canvas')
  const g = c.getContext('2d')!
  const f = '700 64px Inter, sans-serif'
  g.font = f
  const w = Math.ceil(g.measureText(text).width) + 24
  c.width = w
  c.height = 96
  g.font = f
  g.fillStyle = color
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.shadowColor = 'rgba(0,0,0,.8)'
  g.shadowBlur = 8
  g.fillText(text, w / 2, 50)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }))
  let sw = (h * w) / 96, sh = h * 1.0
  if (sw > maxW) { sh *= maxW / sw; sw = maxW }
  s.scale.set(sw, sh * (96 / 96), 1)
  s.renderOrder = 10
  return s
}

export function HeroScene({ data }: { data: { value: number; color: string }[] }) {
  const ref = useScene(({ scene, camera, tick }) => {
    camera.position.set(0, 4.5, 7.5)
    camera.lookAt(0, 0, 0)
    const group = new THREE.Group()
    scene.add(group)
    const total = data.reduce((a, b) => a + b.value, 0)
    let start = 0
    data.forEach((d, i) => {
      const len = (d.value / total) * Math.PI * 2
      const geo = new THREE.CylinderGeometry(2.2, 2.2, 0.7 + i * 0.5, 64, 1, false, start, len)
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: d.color, roughness: 0.3, metalness: 0.2 }))
      mesh.position.y = (0.7 + i * 0.5) / 2
      group.add(mesh)
      start += len
    })
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.4, 48), new THREE.MeshStandardMaterial({ color: '#070a14' }))
    hole.position.y = 0.8
    group.add(hole)
    const orbs: THREE.Mesh[] = []
    for (let i = 0; i < 70; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.09, 12, 12), new THREE.MeshStandardMaterial({ color: i % 3 ? '#ffb347' : '#38bdf8', emissive: i % 3 ? '#ff7a1a' : '#0ea5e9', emissiveIntensity: 0.8 }))
      const a = Math.random() * 6.28, r = 3 + Math.random() * 3
      m.position.set(Math.cos(a) * r, (Math.random() - 0.3) * 4, Math.sin(a) * r)
      m.userData = { a, r, y: m.position.y, s: 0.1 + Math.random() * 0.3 }
      scene.add(m)
      orbs.push(m)
    }
    tick((t, m) => {
      group.rotation.y = t * 0.25 + m.x * 0.6
      group.rotation.x = m.y * 0.25
      orbs.forEach((o) => {
        const u = o.userData
        const a = u.a + t * u.s
        o.position.set(Math.cos(a) * u.r, u.y + Math.sin(t + u.a) * 0.3, Math.sin(a) * u.r)
      })
    })
  })
  return <div ref={ref} className="h-full w-full [touch-action:pan-y]" />
}

export interface Series { name: string; color: string; values: number[] }

export function Bars3D({ cats, series, unit = '', stacked = false, colors, height = 360 }: { cats: string[]; series: Series[]; unit?: string; stacked?: boolean; colors?: string[]; height?: number }) {
  const ref = useScene(({ scene, camera, tick }) => {
    const n = cats.length
    const gap = Math.min(2.4, 20 / n)
    const W = n * gap
    camera.position.set(0, 4.6, Math.max(12, W * 0.5 + 3))
    camera.lookAt(0, 1.7, 0)
    camera.userData.fitW = W + 2.4
    const g = new THREE.Group()
    scene.add(g)
    const maxV = stacked ? 100 : Math.max(...series.flatMap((s) => s.values))
    const H = 4.5
    const cluster = gap * 0.72
    const bw = stacked ? cluster : cluster / series.length
    const floor = new THREE.Mesh(new THREE.BoxGeometry(W + 1.5, 0.12, 3.2), new THREE.MeshStandardMaterial({ color: '#111a30', roughness: 0.6 }))
    floor.position.y = -0.07
    g.add(floor)
    g.add(new THREE.GridHelper(W + 1.5, n * 2, 0x2b3a5e, 0x1a2540))
    const items: { m: THREE.Object3D; y0: number; h: number; delay: number; kind: 'bar' | 'label' }[] = []
    cats.forEach((c, i) => {
      const x = (i - (n - 1) / 2) * gap
      const lab = label(c, '#cbd5e1', 0.42, gap * 0.98)
      lab.position.set(x, -0.35, 1.75)
      g.add(lab)
      let acc = 0
      series.forEach((s, j) => {
        const v = s.values[i]
        const h = Math.max((v / maxV) * H, 0.03)
        const y0 = stacked ? acc : 0
        const col = colors && series.length === 1 ? colors[i % colors.length] : s.color
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw * (stacked ? 1 : 0.9), 1, bw * (stacked ? 1 : 0.9)), new THREE.MeshStandardMaterial({ color: col, roughness: 0.25, metalness: 0.35 }))
        m.position.x = stacked ? x : x + (j - (series.length - 1) / 2) * bw
        items.push({ m, y0, h, delay: i * 0.1 + j * 0.05, kind: 'bar' })
        g.add(m)
        const showLabel = !stacked || v >= 7
        if (showLabel) {
          const txt = (unit === '%' ? v.toFixed(1) : String(Math.round(v * 10) / 10)) + unit
          const l = label(txt, '#ffffff', stacked ? 0.42 : 0.4, Math.max(bw * 1.4, 0.7))
          l.position.x = m.position.x
          l.position.z = stacked ? 0 : bw * 0.5
          items.push({ m: l, y0: stacked ? y0 + h / 2 - 0.02 : y0 + h + 0.3, h: 0, delay: i * 0.1 + j * 0.05, kind: 'label' })
          g.add(l)
        }
        acc += h
      })
    })
    tick((t, m) => {
      g.rotation.y = Math.sin(t * 0.35) * 0.22 + m.x * 0.5
      g.rotation.x = m.y * 0.1
      items.forEach((it) => {
        const k = Math.min(Math.max((t - it.delay) / 1.1, 0), 1)
        const e = 1 - Math.pow(1 - k, 3)
        if (it.kind === 'bar') {
          it.m.scale.y = Math.max(it.h * e, 0.001)
          it.m.position.y = it.y0 * e + (it.h * e) / 2
        } else {
          it.m.position.y = it.y0 * e
          ;(it.m as THREE.Sprite).material.opacity = e
        }
      })
    })
  }, [cats.join(), JSON.stringify(series), stacked, colors?.join()])
  return (
    <div>
      <div ref={ref} className="w-full [touch-action:pan-y]" style={{ height }} />
      {series.length > 1 && (
        <div className="mt-1 flex flex-wrap justify-center gap-4 text-xs text-slate-300">
          {series.map((s) => <span key={s.name}><i className="mr-1.5 inline-block h-3 w-3 rounded-sm align-middle" style={{ background: s.color }} />{s.name}</span>)}
        </div>
      )}
    </div>
  )
}

export function Pie3D({ data, colors, center, height = 280 }: { data: { name: string; value: number; pct: number }[]; colors: string[]; center?: string; height?: number }) {
  const ref = useScene(({ scene, camera, tick }) => {
    camera.position.set(0, 5.4, 5.2)
    camera.lookAt(0, 0, 0)
    camera.userData.fitW = 8.6
    const g = new THREE.Group()
    scene.add(g)
    const total = data.reduce((a, b) => a + b.value, 0)
    const R = 2.3, r = 1.15
    let a0 = Math.PI / 2
    const slices: { mesh: THREE.Mesh; mid: number; lab?: THREE.Sprite }[] = []
    data.forEach((d, i) => {
      const len = (d.value / total) * Math.PI * 2
      const a1 = a0 - len
      const gapA = Math.min(0.03, len / 4)
      const s = new THREE.Shape()
      s.absarc(0, 0, R, a1 + gapA, a0 - gapA, false)
      s.absarc(0, 0, r, a0 - gapA, a1 + gapA, true)
      s.closePath()
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.75, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 40 })
      geo.rotateX(-Math.PI / 2)
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.28, metalness: 0.3 }))
      g.add(mesh)
      const mid = (a0 + a1) / 2
      const lab = label(d.pct.toFixed(1) + '%', '#ffffff', 0.55, 2)
      lab.position.set(Math.cos(mid) * (R + 0.75), 0.9, -Math.sin(mid) * (R + 0.75))
      g.add(lab)
      slices.push({ mesh, mid })
      a0 = a1
    })
    if (center) {
      const c = label(center, '#ffb347', 0.7, 1.9)
      c.position.set(0, 0.95, 0)
      g.add(c)
    }
    tick((t, m) => {
      g.rotation.y = t * 0.3 + m.x * 0.6
      g.rotation.x = m.y * 0.15
      const e = 1 - Math.pow(1 - Math.min(t / 1.1, 1), 3)
      slices.forEach((s, i) => {
        const k = Math.min(Math.max((t - i * 0.12) / 0.9, 0), 1)
        const ee = 1 - Math.pow(1 - k, 3)
        s.mesh.scale.set(1, Math.max(ee, 0.01), 1)
      })
      g.scale.setScalar(0.6 + 0.4 * e)
    })
  }, [JSON.stringify(data), colors.join(), center])
  return <div ref={ref} className="w-full [touch-action:pan-y]" style={{ height }} />
}
