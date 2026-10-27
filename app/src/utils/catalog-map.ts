export interface MapSize {
  id: string
  w: number
  h: number
}

export interface MapPoint {
  x: number
  y: number
}

export interface MapBounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface MapLayout {
  bounds: MapBounds
  places: Record<string, MapPoint>
}

export type MapLink = [string, string]

export interface MapSimulation {
  tick(alpha: number): void
  pin(id: string, point: MapPoint): void
  release(): void
  layout(): MapLayout
}

interface Box extends MapSize, MapPoint {}

interface Body extends Box {
  vx: number
  vy: number
  group: string
  lonely: boolean
}

const STEPS = 300
const REPEL = 7000
const LINK = 56
const SPRING = 0.02
const COHESION = 0.03
const GRAVITY = { x: 0.0002, y: 0.01 }
const LONELY_PULL = 1.2
const DAMPING = 0.6

const eachPair = <T>(items: T[], visit: (a: T, b: T) => void) =>
  items.forEach((a, index) => items.slice(index + 1).forEach((b) => visit(a, b)))

const overlap = (a: Box, b: Box, gap: number) => ({
  x: (a.w + b.w) / 2 + gap - Math.abs(b.x - a.x),
  y: (a.h + b.h) / 2 + gap - Math.abs(b.y - a.y),
})

const extent = (boxes: Box[]): MapBounds => ({
  left: Math.min(...boxes.map((box) => box.x - box.w / 2)),
  top: Math.min(...boxes.map((box) => box.y - box.h / 2)),
  right: Math.max(...boxes.map((box) => box.x + box.w / 2)),
  bottom: Math.max(...boxes.map((box) => box.y + box.h / 2)),
})

function project(boxes: Box[], origin: MapPoint): MapLayout {
  const { left, top, right, bottom } = extent(boxes)
  return {
    bounds: {
      left: left + origin.x,
      top: top + origin.y,
      right: right + origin.x,
      bottom: bottom + origin.y,
    },
    places: Object.fromEntries(
      boxes.map((box) => [box.id, { x: box.x + origin.x, y: box.y + origin.y }]),
    ),
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

export function packCloud(sizes: MapSize[], width: number, gap: number): MapLayout {
  const boxes: Box[] = []
  const fits = (box: Box) =>
    Math.abs(box.x) + box.w / 2 <= width / 2 &&
    boxes.every((other) => {
      const { x, y } = overlap(box, other, gap)
      return x <= 0 || y <= 0
    })
  const place = (size: MapSize): Box => {
    for (let turn = 0; turn < 600; turn += 0.03) {
      const radius = 2.2 * turn
      const box = { ...size, x: radius * Math.cos(turn) * 1.2, y: radius * Math.sin(turn) }
      if (fits(box)) return box
    }
    const bottom = Math.max(0, ...boxes.map((box) => box.y + box.h / 2))
    return { ...size, x: 0, y: bottom + gap + size.h / 2 }
  }
  sizes.forEach((size) => boxes.push(place(size)))
  return project(boxes, { x: width / 2, y: -extent(boxes).top })
}

function seedPoints(
  sizes: MapSize[],
  groupOf: (id: string) => string,
  rank: (id: string) => number,
  width: number,
): Map<string, [number, number]> {
  const hub = sizes.reduce<MapSize | null>(
    (best, size) => (!best || rank(size.id) > rank(best.id) ? size : best),
    null,
  )
  const ring = sizes
    .filter((size) => size !== hub)
    .sort(
      (a, b) =>
        groupOf(a.id).localeCompare(groupOf(b.id)) ||
        rank(b.id) - rank(a.id) ||
        a.id.localeCompare(b.id),
    )
  const points = new Map<string, [number, number]>()
  if (hub) points.set(hub.id, [0, 0])
  ring.forEach((size, index) => {
    const angle = (index / ring.length) * Math.PI * 2
    const reach = 1 - Math.min(rank(size.id), 6) / 10
    points.set(size.id, [Math.cos(angle) * width * 0.47 * reach, Math.sin(angle) * 120 * reach])
  })
  return points
}

export function simulate(
  sizes: MapSize[],
  groups: Record<string, string>,
  links: MapLink[],
  width: number,
  gap: number,
): MapSimulation {
  const half = width / 2
  const degree = new Map<string, number>()
  links.flat().forEach((id) => degree.set(id, (degree.get(id) ?? 0) + 1))
  const rank = (id: string) => degree.get(id) ?? 0
  const groupOf = (id: string) => groups[id] ?? id
  const members = new Map<string, number>()
  sizes.forEach(({ id }) => members.set(groupOf(id), (members.get(groupOf(id)) ?? 0) + 1))
  const seeds = seedPoints(sizes, groupOf, rank, width)
  const bodies: Body[] = sizes.map((size) => {
    const [x, y] = seeds.get(size.id) ?? [0, 0]
    const group = groupOf(size.id)
    const lonely = !rank(size.id) && (members.get(group) ?? 0) < 2
    return { ...size, x, y, vx: 0, vy: 0, group, lonely }
  })
  const byId = new Map(bodies.map((body) => [body.id, body]))
  const springs = links.flatMap(([from, to]) => {
    const a = byId.get(from)
    const b = byId.get(to)
    return a && b ? [[a, b] as const] : []
  })
  const clusters = new Map<string, Body[]>()
  bodies.forEach((body) => clusters.set(body.group, [...(clusters.get(body.group) ?? []), body]))
  const teams = [...clusters.values()].filter((team) => team.length > 1)
  let pinned: { body: Body; point: MapPoint } | null = null

  const clamp = (body: Body) => {
    const limit = Math.max(0, half - body.w / 2)
    body.x = Math.min(limit, Math.max(-limit, body.x))
  }

  const shove = (body: Body, dx: number, dy: number) => {
    if (pinned?.body === body) return
    body.x += dx
    body.y += dy
  }

  const collide = () => {
    eachPair(bodies, (a, b) => {
      const push = overlap(a, b, gap)
      if (push.x <= 0 || push.y <= 0) return
      const share = pinned && (pinned.body === a || pinned.body === b) ? 1 : 0.5
      if (push.x < push.y) {
        const shift = (b.x >= a.x ? 1 : -1) * push.x * share
        shove(a, -shift, 0)
        shove(b, shift, 0)
      } else {
        const shift = (b.y >= a.y ? 1 : -1) * push.y * share
        shove(a, 0, -shift)
        shove(b, 0, shift)
      }
    })
    bodies.forEach(clamp)
  }

  const tick = (alpha: number) => {
    eachPair(bodies, (a, b) => {
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
    teams.forEach((team) => {
      const cx = team.reduce((sum, body) => sum + body.x, 0) / team.length
      const cy = team.reduce((sum, body) => sum + body.y, 0) / team.length
      team.forEach((body) => {
        body.vx += (cx - body.x) * COHESION * alpha
        body.vy += (cy - body.y) * COHESION * alpha
      })
    })
    bodies.forEach((body) => {
      const pull = (body.lonely ? LONELY_PULL : 1) * alpha
      body.vx = (body.vx - body.x * GRAVITY.x * pull) * DAMPING
      body.vy = (body.vy - body.y * GRAVITY.y * pull) * DAMPING
      body.x += body.vx
      body.y += body.vy
      clamp(body)
    })
    if (pinned) {
      Object.assign(pinned.body, { ...pinned.point, vx: 0, vy: 0 })
    }
    collide()
  }

  for (let step = 0; step < STEPS; step++) tick(1 - step / STEPS)
  for (let pass = 0; pass < 60; pass++) collide()
  const origin = { x: half, y: -extent(bodies).top }

  return {
    tick,
    pin(id, point) {
      const body = byId.get(id)
      if (body) pinned = { body, point: { x: point.x - origin.x, y: point.y - origin.y } }
    },
    release() {
      pinned = null
    },
    layout: () => project(bodies, origin),
  }
}
