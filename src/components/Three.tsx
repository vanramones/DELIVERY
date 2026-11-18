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
    scene.add(new THREE.AmbientLight(0xffffff, 0.8))
    const dl = new THREE.DirectionalLight(0xffffff, 2.2)
    dl.position.set(5, 8, 6)
    scene.add(dl)
    build({ scene, camera, tick: (f) => fns.push(f) })
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.zoom = Math.min(1, camera.aspect / 1.4)
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
      renderer.domElement.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

function label(text: string, color = '#cbd5e1', size = 56) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')!
  g.font = `600 ${size}px Inter, sans-serif`
  g.fillStyle = color
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 256, 64)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }))
  s.scale.set(2.4, 0.6, 1)
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

export function Bars3D({ cats, series, unit = '' }: { cats: string[]; series: Series[]; unit?: string }) {
  const ref = useScene(({ scene, camera, tick }) => {
    camera.position.set(0, 5, 11)
    camera.lookAt(0, 1.2, 0)
    const g = new THREE.Group()
    scene.add(g)
    const max = Math.max(...series.flatMap((s) => s.values))
    const gap = 2.4, bw = 0.7
    const grid = new THREE.GridHelper(cats.length * gap + 2, cats.length * 4, 0x334155, 0x1e293b)
    g.add(grid)
    const bars: THREE.Mesh[] = []
    cats.forEach((c, i) => {
      const x = (i - (cats.length - 1) / 2) * gap
      const lab = label(c, '#cbd5e1', 46)
      lab.position.set(x, -0.1, 1.6)
      g.add(lab)
      series.forEach((s, j) => {
        const h = Math.max((s.values[i] / max) * 4.5, 0.02)
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw, 1, bw), new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.25, metalness: 0.3 }))
        m.position.set(x + (j - (series.length - 1) / 2) * (bw + 0.1), 0, 0)
        m.userData = { h, delay: i * 0.12 + j * 0.06 }
        g.add(m)
        bars.push(m)
        const v = label(s.values[i].toFixed(unit === '%' ? 1 : 0) + unit, '#ffffff', 52)
        v.scale.set(1.5, 0.375, 1)
        v.position.set(m.position.x, h + 0.35, 0)
        v.userData = { h }
        g.add(v)
      })
    })
    tick((t, m) => {
      g.rotation.y = Math.sin(t * 0.3) * 0.25 + m.x * 0.5
      g.rotation.x = m.y * 0.12
      bars.forEach((b) => {
        const k = Math.min(Math.max((t - b.userData.delay) / 1.2, 0), 1)
        const e = 1 - Math.pow(1 - k, 3)
        b.scale.y = Math.max(b.userData.h * e, 0.001)
        b.position.y = b.scale.y / 2
      })
    })
  }, [cats.join(), JSON.stringify(series)])
  return <div ref={ref} className="h-full w-full [touch-action:pan-y]" />
}
