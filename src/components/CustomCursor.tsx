import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    document.documentElement.classList.add('has-cursor')
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0
    let hover = false, down = false
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      hover = !!(e.target as HTMLElement).closest('a,button,[role=button],input')
    }
    const md = () => (down = true)
    const mu = () => (down = false)
    const loop = () => {
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      dot.current!.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) scale(${down ? 0.6 : hover ? 0 : 1})`
      ring.current!.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%) scale(${down ? 0.8 : hover ? 1.7 : 1})`
      ring.current!.dataset.hover = hover ? '1' : '0'
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    addEventListener('pointermove', move)
    addEventListener('pointerdown', md)
    addEventListener('pointerup', mu)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-cursor')
      removeEventListener('pointermove', move)
      removeEventListener('pointerdown', md)
      removeEventListener('pointerup', mu)
    }
  }, [])

  return (
    <>
      <div ref={ring} className="cursor-ring" />
      <div ref={dot} className="cursor-dot" />
    </>
  )
}
