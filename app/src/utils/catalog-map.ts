export interface MapSize {
  id: string
  w: number
  h: number
}

export interface MapSeed extends MapSize {
  x: number
  y: number
}

export interface MapLayout {
  width: number
  height: number
  places: Record<string, { x: number; y: number }>
}

export type MapLink = [string, string]

interface Node extends MapSeed {
  vx: number
  vy: number
}

const SEED_WIDTH = 976
const STEPS = 250
const REPEL = 4000
const LINK = 60
const SPRING = 0.015
const GRAVITY = { x: 0.001, y: 0.004 }
const ORPHAN_PULL = 3

const eachPair = <T>(items: T[], visit: (a: T, b: T) => void) =>
  items.forEach((a, index) => items.slice(index + 1).forEach((b) => visit(a, b)))

const overlap = (a: MapSeed, b: MapSeed, gap: number) => ({
  x: (a.w + b.w) / 2 + gap - Math.abs(b.x - a.x),
  y: (a.h + b.h) / 2 + gap - Math.abs(b.y - a.y),
})

function settle(nodes: MapSeed[], width: number): MapLayout {
  const top = Math.min(...nodes.map((node) => node.y - node.h / 2))
  const bottom = Math.max(...nodes.map((node) => node.y + node.h / 2))
  return {
    width,
    height: Math.ceil(bottom - top),
    places: Object.fromEntries(nodes.map((node) => [node.id, { x: node.x, y: node.y - top }])),
  }
}

export function mapLinks(modules: { id: string; with: string[] }[]): MapLink[] {
  const ids = new Set(modules.map((module) => module.id))
  const seen = new Set<string>()
  const links: MapLink[] = []
  for (const module of modules) {
    for (const other of module.with) {
      const key = [module.id, other].sort().join(' ')
      if (!ids.has(other) || seen.has(key)) continue
      seen.add(key)
      links.push([module.id, other])
    }
  }
  return links
}

export function seedPoints(
  ids: string[],
  fixed: Partial<Record<string, number[]>>,
  links: MapLink[],
): Map<string, [number, number]> {
  const pointOf = (id: string): [number, number][] => {
    const point = fixed[id]
    return point ? [[point[0] ?? 0, point[1] ?? 0]] : []
  }
  const points = new Map<string, [number, number]>()
  ids.forEach((id, index) => {
    const [point] = pointOf(id)
    if (point) {
      points.set(id, point)
      return
    }
    const known = links.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : [])).flatMap(pointOf)
    if (known.length) {
      const x = known.reduce((sum, [px]) => sum + px, 0) / known.length
      const y = known.reduce((sum, [, py]) => sum + py, 0) / known.length
      points.set(id, [x, y + 40])
      return
    }
    const angle = index * 2.39996
    points.set(id, [Math.cos(angle) * 440, Math.sin(angle) * 160])
  })
  return points
}

export function packCloud(sizes: MapSize[], width: number, gap: number): MapLayout {
  const nodes: MapSeed[] = []
  const fits = (node: MapSeed) =>
    Math.abs(node.x) + node.w / 2 <= width / 2 &&
    nodes.every((other) => {
      const { x, y } = overlap(node, other, gap)
      return x <= 0 || y <= 0
    })
  const place = (size: MapSize): MapSeed => {
    for (let turn = 0; turn < 600; turn += 0.03) {
      const radius = 2.2 * turn
      const node = { ...size, x: radius * Math.cos(turn) * 1.2, y: radius * Math.sin(turn) }
      if (fits(node)) return node
    }
    const bottom = Math.max(0, ...nodes.map((node) => node.y + node.h / 2))
    return { ...size, x: 0, y: bottom + gap + size.h / 2 }
  }
  sizes.forEach((size) => nodes.push(place(size)))
  return settle(nodes, width)
}

export function relaxGraph(
  seeds: MapSeed[],
  links: MapLink[],
  width: number,
  gap: number,
): MapLayout {
  const scale = width / SEED_WIDTH
  const nodes: Node[] = seeds.map((seed) => ({ ...seed, x: seed.x * scale, vx: 0, vy: 0 }))
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const springs = links.flatMap(([from, to]) => {
    const a = byId.get(from)
    const b = byId.get(to)
    return a && b ? [[a, b] as const] : []
  })
  const linked = new Set(links.flat())

  const clamp = (node: Node) => {
    const limit = Math.max(0, width / 2 - node.w / 2)
    node.x = Math.min(limit, Math.max(-limit, node.x))
  }
  const collide = () => {
    eachPair(nodes, (a, b) => {
      const push = overlap(a, b, gap)
      if (push.x <= 0 || push.y <= 0) return
      if (push.x < push.y) {
        const shift = ((b.x >= a.x ? 1 : -1) * push.x) / 2
        a.x -= shift
        b.x += shift
      } else {
        const shift = ((b.y >= a.y ? 1 : -1) * push.y) / 2
        a.y -= shift
        b.y += shift
      }
    })
    nodes.forEach(clamp)
  }

  for (let step = 0; step < STEPS; step++) {
    const alpha = 1 - step / STEPS
    eachPair(nodes, (a, b) => {
      const dx = b.x - a.x
      const dy = b.y - a.y
      const distance2 = Math.max(dx * dx + dy * dy, 400)
      const distance = Math.sqrt(distance2)
      const force = (REPEL * alpha) / distance2
      a.vx -= (dx / distance) * force
      a.vy -= (dy / distance) * force
      b.vx += (dx / distance) * force
      b.vy += (dy / distance) * force
    })
    springs.forEach(([a, b]) => {
      const dx = b.x - a.x
      const dy = b.y - a.y
      const distance = Math.hypot(dx, dy) || 0.01
      const force = (distance - (a.w + b.w) / 4 - LINK) * SPRING * alpha
      a.vx += (dx / distance) * force
      a.vy += (dy / distance) * force
      b.vx -= (dx / distance) * force
      b.vy -= (dy / distance) * force
    })
    nodes.forEach((node) => {
      const pull = linked.has(node.id) ? alpha : ORPHAN_PULL * alpha
      node.vx = (node.vx - node.x * GRAVITY.x * pull) * 0.6
      node.vy = (node.vy - node.y * GRAVITY.y * pull) * 0.6
      node.x += node.vx
      node.y += node.vy
      clamp(node)
    })
    collide()
  }
  for (let pass = 0; pass < 60; pass++) collide()
  return settle(nodes, width)
}
