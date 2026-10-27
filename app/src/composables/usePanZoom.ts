import { onBeforeUnmount, ref, type Ref } from 'vue'
import type { MapBounds, MapPoint } from '@/utils/catalog-map'

interface View extends MapPoint {
  k: number
}

interface Options {
  bounds: () => MapBounds
  wheel: boolean
  touch: boolean
  instant: () => boolean
}

const MIN_SCALE = 0.3
const MAX_SCALE = 2
const MARGIN = 48
const THRESHOLD = 4

export function usePanZoom(viewport: Ref<HTMLElement | null>, options: Options) {
  const x = ref(0)
  const y = ref(0)
  const k = ref(1)
  const dragging = ref(false)
  const pointers = new Map<number, MapPoint>()
  let anchor: { view: View; pointer: MapPoint } | null = null
  let pinch: { view: View; distance: number; middle: MapPoint } | null = null
  let moved = false
  let frame = 0

  const box = () => viewport.value?.getBoundingClientRect() ?? new DOMRect()
  const scaleOf = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
  const view = (): View => ({ x: x.value, y: y.value, k: k.value })
  const local = (point: MapPoint): MapPoint => {
    const rect = box()
    return { x: point.x - rect.left, y: point.y - rect.top }
  }

  const fixAxis = (offset: number, scale: number, low: number, high: number, size: number) => {
    const content = (high - low) * scale
    if (content <= size) return (size - content) / 2 - low * scale
    return Math.min(MARGIN - low * scale, Math.max(size - MARGIN - high * scale, offset))
  }

  const fix = (target: View): View => {
    const { width, height } = box()
    const { left, top, right, bottom } = options.bounds()
    return {
      k: target.k,
      x: fixAxis(target.x, target.k, left, right, width),
      y: fixAxis(target.y, target.k, top, bottom, height),
    }
  }

  const set = (target: View) => {
    cancelAnimationFrame(frame)
    const fixed = fix(target)
    x.value = fixed.x
    y.value = fixed.y
    k.value = fixed.k
  }

  const glide = (target: View, instant = false) => {
    if (instant || options.instant()) {
      set(target)
      return
    }
    cancelAnimationFrame(frame)
    const goal = fix(target)
    const from = view()
    const began = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - began) / 360)
      const eased = 1 - (1 - progress) ** 3
      x.value = from.x + (goal.x - from.x) * eased
      y.value = from.y + (goal.y - from.y) * eased
      k.value = from.k + (goal.k - from.k) * eased
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }

  const zoomAt = (scale: number, point: MapPoint) => {
    const next = scaleOf(scale)
    return {
      k: next,
      x: point.x - ((point.x - x.value) * next) / k.value,
      y: point.y - ((point.y - y.value) * next) / k.value,
    }
  }

  const zoomBy = (factor: number) => {
    const { width, height } = box()
    glide(zoomAt(k.value * factor, { x: width / 2, y: height / 2 }))
  }

  const panBy = (dx: number, dy: number) => glide({ ...view(), x: x.value + dx, y: y.value + dy })

  const fit = (instant = false) => {
    const { width, height } = box()
    const { left, top, right, bottom } = options.bounds()
    const scale = Math.min(
      1,
      (width - MARGIN * 2) / Math.max(1, right - left),
      (height - MARGIN * 2) / Math.max(1, bottom - top),
    )
    glide({ k: scaleOf(scale), x: 0, y: 0 }, instant)
  }

  const center = (point: MapPoint, scale = k.value, instant = false) => {
    const { width, height } = box()
    const next = scaleOf(scale)
    glide({ k: next, x: width / 2 - point.x * next, y: height / 2 - point.y * next }, instant)
  }

  const visible = (point: MapPoint, margin = 40) => {
    const { width, height } = box()
    const px = point.x * k.value + x.value
    const py = point.y * k.value + y.value
    return px >= margin && px <= width - margin && py >= margin && py <= height - margin
  }

  const toWorld = (point: MapPoint): MapPoint => {
    const spot = local(point)
    return { x: (spot.x - x.value) / k.value, y: (spot.y - y.value) / k.value }
  }

  const begin = () => {
    const [first, second] = [...pointers.values()]
    anchor = first ? { view: view(), pointer: { ...first } } : null
    pinch =
      first && second
        ? {
            view: view(),
            distance: Math.hypot(second.x - first.x, second.y - first.y) || 1,
            middle: local({ x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }),
          }
        : null
  }

  function down(event: PointerEvent) {
    if (event.pointerType === 'touch' ? !options.touch : event.button !== 0) return
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    moved = false
    cancelAnimationFrame(frame)
    begin()
  }

  function move(event: PointerEvent) {
    const pointer = pointers.get(event.pointerId)
    if (!pointer) return
    pointer.x = event.clientX
    pointer.y = event.clientY
    const [first, second] = [...pointers.values()]
    if (pinch && first && second) {
      const middle = local({ x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 })
      const next = scaleOf(
        (pinch.view.k * Math.hypot(second.x - first.x, second.y - first.y)) / pinch.distance,
      )
      set({
        k: next,
        x: middle.x - ((pinch.middle.x - pinch.view.x) * next) / pinch.view.k,
        y: middle.y - ((pinch.middle.y - pinch.view.y) * next) / pinch.view.k,
      })
      moved = true
      dragging.value = true
      return
    }
    if (!anchor || !first) return
    const dx = first.x - anchor.pointer.x
    const dy = first.y - anchor.pointer.y
    if (!dragging.value && Math.hypot(dx, dy) < THRESHOLD) return
    if (!dragging.value) {
      dragging.value = true
      moved = true
      viewport.value?.setPointerCapture(event.pointerId)
    }
    set({ k: anchor.view.k, x: anchor.view.x + dx, y: anchor.view.y + dy })
  }

  function up(event: PointerEvent) {
    if (!pointers.delete(event.pointerId)) return
    if (pointers.size) {
      begin()
      return
    }
    anchor = null
    pinch = null
    dragging.value = false
  }

  function click(event: MouseEvent) {
    if (!moved) return
    moved = false
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  function wheel(event: WheelEvent) {
    if (!options.wheel) return
    event.preventDefault()
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? box().height : 1
    if (event.ctrlKey || event.metaKey) {
      const factor = Math.exp(-event.deltaY * unit * 0.01)
      set(zoomAt(k.value * factor, local({ x: event.clientX, y: event.clientY })))
      return
    }
    set({ ...view(), x: x.value - event.deltaX * unit, y: y.value - event.deltaY * unit })
  }

  onBeforeUnmount(() => cancelAnimationFrame(frame))

  return {
    x,
    y,
    k,
    dragging,
    down,
    move,
    up,
    click,
    wheel,
    fit,
    center,
    zoomBy,
    panBy,
    visible,
    toWorld,
    refresh: () => set(view()),
  }
}
