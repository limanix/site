<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import InlineText from '@/components/ui/InlineText.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { usePanZoom } from '@/composables/usePanZoom'
import { useReducedMotion } from '@/composables/useReducedMotion'
import type { CatalogKind, CatalogModule, Tone } from '@/contents'
import {
  packCloud,
  simulate,
  type MapBounds,
  type MapLayout,
  type MapLink,
  type MapPoint,
  type MapSimulation,
  type MapSize,
} from '@/utils/catalog-map'

const props = withDefaults(
  defineProps<{
    modules: CatalogModule[]
    links: MapLink[]
    kinds: Record<CatalogKind, { label: string; tone: Tone }>
    full?: boolean
    matches?: ReadonlySet<string> | null
  }>(),
  { full: false, matches: null },
)
const chosen = defineModel<string | null>('chosen', { default: null })

const HEIGHT = 440
const PAD = 32
const GAP = 14
const HEAT = 0.35
const ORDER: CatalogKind[] = ['shell', 'toolchains', 'modules']

const wide = useMediaQuery('(min-width: 48rem)')
const reduced = useReducedMotion()
const viewport = ref<HTMLElement | null>(null)
const places = shallowRef<Record<string, MapPoint> | null>(null)
const bounds = shallowRef<MapBounds>({ left: 0, top: 0, right: 0, bottom: 0 })
const height = ref(0)
const hovered = ref<string | null>(null)

const map = usePanZoom(viewport, {
  bounds: () => bounds.value,
  wheel: props.full,
  touch: props.full,
  instant: () => reduced.value,
})
const dragging = map.dragging

const degree = computed(() => {
  const count = new Map<string, number>()
  props.links.flat().forEach((id) => count.set(id, (count.get(id) ?? 0) + 1))
  return count
})
const focus = computed(() => hovered.value ?? chosen.value)
const touching = computed(() =>
  props.links.filter((link) => focus.value !== null && link.includes(focus.value)),
)
const near = computed(() => new Set(touching.value.flat().filter((id) => id !== focus.value)))
const cloud = computed(() => !props.full && !wide.value)
const shown = computed(() => (cloud.value ? touching.value : props.links))
const span = computed(() => bounds.value.bottom - bounds.value.top + PAD * 2)
const tall = computed(() => span.value > HEIGHT)
const frame = computed(() =>
  props.full || !places.value ? undefined : { height: `${Math.min(span.value, HEIGHT)}px` },
)
const world = computed(() =>
  places.value
    ? {
        width: `${bounds.value.right}px`,
        height: `${bounds.value.bottom}px`,
        transform: `translate(${Math.round(map.x.value)}px, ${Math.round(map.y.value)}px) scale(${map.k.value})`,
      }
    : undefined,
)
const fades = computed(() => {
  const placed = !props.full && places.value !== null
  return {
    top: placed && map.y.value + bounds.value.top * map.k.value < -1,
    bottom: placed && map.y.value + bounds.value.bottom * map.k.value > height.value + 1,
  }
})

const hub = (id: string) => (degree.value.get(id) ?? 0) >= 5
const spot = (id: string) => places.value?.[id] ?? { x: 0, y: 0 }
const busiest = () => [...degree.value.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

let sim: MapSimulation | null = null
let measured = -1
let observer: ResizeObserver | undefined
let scheduled = 0
let motion = 0
let heat = 0
let drag: { id: string; pointer: number; from: MapPoint; active: boolean } | null = null
let dragged = false

const sizes = (): MapSize[] =>
  [...(viewport.value?.querySelectorAll<HTMLElement>('[data-module]') ?? [])].map((chip) => ({
    id: chip.dataset.module ?? '',
    w: chip.offsetWidth,
    h: chip.offsetHeight,
  }))

const show = (layout: MapLayout) => {
  places.value = layout.places
  bounds.value = layout.bounds
}

async function place() {
  const element = viewport.value
  if (!element) return
  measured = element.clientWidth
  const rank = (id: string) => degree.value.get(id) ?? 0
  if (cloud.value) {
    sim = null
    show(
      packCloud(
        [...sizes()].sort((a, b) => rank(b.id) - rank(a.id)),
        measured,
        8,
      ),
    )
  } else {
    const groups = Object.fromEntries(
      props.modules.map((module) => [
        module.id,
        `${module.kind ? ORDER.indexOf(module.kind) : ORDER.length}:${module.module ?? module.id}`,
      ]),
    )
    sim = simulate(sizes(), groups, props.links, measured, GAP)
    show(sim.layout())
  }
  await nextTick()
  height.value = element.clientHeight
  const target = chosen.value ? places.value?.[chosen.value] : undefined
  if (props.full) {
    if (target) map.center(target, 1, true)
    else map.fit(true)
    return
  }
  const middle = tall.value ? places.value?.[busiest()] : undefined
  if (middle) map.center(middle, 1, true)
  else map.refresh()
}

const schedule = () => {
  cancelAnimationFrame(scheduled)
  scheduled = requestAnimationFrame(() => void place())
}

function run() {
  if (motion) return
  const step = () => {
    if (!sim) {
      motion = 0
      return
    }
    sim.tick(heat)
    show(sim.layout())
    heat = drag?.active ? HEAT : heat * 0.92
    motion = heat > 0.01 ? requestAnimationFrame(step) : 0
  }
  motion = requestAnimationFrame(step)
}

function pull(event: PointerEvent) {
  if (!drag || !sim) return
  if (!drag.active) {
    if (Math.hypot(event.clientX - drag.from.x, event.clientY - drag.from.y) < 4) return
    drag.active = true
    dragged = true
    hovered.value = null
    viewport.value?.setPointerCapture(event.pointerId)
  }
  sim.pin(drag.id, map.toWorld({ x: event.clientX, y: event.clientY }))
  heat = HEAT
  run()
}

function down(event: PointerEvent) {
  dragged = false
  const chip = (event.target as Element).closest<HTMLElement>('[data-module]')
  const primary = event.pointerType === 'touch' || event.button === 0
  if (props.full && chip && sim && !reduced.value && primary) {
    const from = { x: event.clientX, y: event.clientY }
    drag = { id: chip.dataset.module ?? '', pointer: event.pointerId, from, active: false }
    return
  }
  map.down(event)
}

function move(event: PointerEvent) {
  if (drag?.pointer === event.pointerId) pull(event)
  else map.move(event)
}

function up(event: PointerEvent) {
  if (drag?.pointer !== event.pointerId) {
    map.up(event)
    return
  }
  sim?.release()
  drag = null
}

function swallow(event: MouseEvent) {
  if (!dragged) {
    map.click(event)
    return
  }
  dragged = false
  event.preventDefault()
  event.stopImmediatePropagation()
}

function clear(event: MouseEvent) {
  if (!(event.target as Element).closest('[data-module]')) chosen.value = null
}

function enter(event: PointerEvent, id: string) {
  if (event.pointerType !== 'mouse' || dragging.value || drag?.active) return
  if (props.full) hovered.value = id
  else chosen.value = id
}

function exit(event: PointerEvent) {
  if (props.full && event.pointerType === 'mouse' && !drag?.active) hovered.value = null
}

function leave(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  hovered.value = null
  if (!props.full && !dragging.value) chosen.value = null
}

function select(id: string) {
  chosen.value = id
  const point = places.value?.[id]
  if (point && (props.full || tall.value) && !map.visible(point)) map.center(point)
}

function blur(event: FocusEvent) {
  if (!props.full && !viewport.value?.contains(event.relatedTarget as Node | null)) {
    chosen.value = null
  }
}

onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    if (!entry) return
    height.value = entry.contentRect.height
    if (Math.round(entry.contentRect.width) !== measured) schedule()
  })
  if (viewport.value) observer.observe(viewport.value)
  document.fonts.ready.then(schedule)
})

watch(wide, schedule)

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(scheduled)
  cancelAnimationFrame(motion)
})

defineExpose({
  fit: () => map.fit(),
  zoomBy: (factor: number) => map.zoomBy(factor),
  panBy: (dx: number, dy: number) => map.panBy(dx, dy),
  reveal(id: string) {
    chosen.value = id
    const point = places.value?.[id]
    if (point) map.center(point, Math.max(map.k.value, 1))
  },
})
</script>

<template>
  <div
    ref="viewport"
    class="c-catalog-map"
    :class="{
      'c-catalog-map--full': full,
      'c-catalog-map--placed': places,
      'c-catalog-map--focused': focus,
      'c-catalog-map--searching': matches,
      'c-catalog-map--movable': full || (tall && !cloud),
      'c-catalog-map--dragging': dragging,
      'c-catalog-map--fade-top': fades.top,
      'c-catalog-map--fade-bottom': fades.bottom,
    }"
    :style="frame"
    @pointerdown="down"
    @pointermove="move"
    @pointerup="up"
    @pointercancel="up"
    @pointerleave="leave"
    @click.capture="swallow"
    @click="clear"
    @wheel="map.wheel"
    @focusout="blur"
  >
    <div class="c-catalog-map__world" :style="world">
      <svg v-if="places" class="c-catalog-map__links" aria-hidden="true">
        <line
          v-for="link in shown"
          :key="link.join(' ')"
          class="c-catalog-map__link"
          :class="{ 'c-catalog-map__link--on': focus !== null && link.includes(focus) }"
          :x1="spot(link[0]).x"
          :y1="spot(link[0]).y"
          :x2="spot(link[1]).x"
          :y2="spot(link[1]).y"
        />
      </svg>
      <ul class="c-catalog-map__nodes">
        <li
          v-for="module in modules"
          :key="module.id"
          class="c-catalog-map__node"
          :style="
            places ? { left: `${spot(module.id).x}px`, top: `${spot(module.id).y}px` } : undefined
          "
        >
          <button
            type="button"
            class="c-catalog-map__module"
            :class="{
              'c-catalog-map__module--hub': hub(module.id),
              'c-catalog-map__module--chosen': focus === module.id,
              'c-catalog-map__module--near': near.has(module.id),
              'c-catalog-map__module--match': matches?.has(module.id),
            }"
            :data-module="module.id"
            :aria-pressed="chosen === module.id"
            @pointerenter="enter($event, module.id)"
            @pointerleave="exit"
            @focus="select(module.id)"
            @click="select(module.id)"
          >
            <span
              v-if="module.kind"
              class="c-catalog-map__kind"
              :class="`u-tone-${kinds[module.kind].tone}`"
              aria-hidden="true"
            />
            <InlineText :text="module.name" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
