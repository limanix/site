<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import InlineText from '@/components/ui/InlineText.vue'
import PageSection from '@/components/ui/PageSection.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import type { CatalogContent, CatalogModule } from '@/contents'
import {
  mapLinks,
  packCloud,
  relaxGraph,
  seedPoints,
  type MapLayout,
  type MapSize,
} from '@/utils/catalog-map'

const props = defineProps<{ content: CatalogContent; modules: CatalogModule[] }>()

const wide = useMediaQuery('(min-width: 48rem)')
const map = ref<HTMLElement | null>(null)
const layout = ref<MapLayout | null>(null)
const chosen = ref<string | null>(null)

const links = computed(() => mapLinks(props.modules))
const degree = computed(() => {
  const count = new Map<string, number>()
  links.value.flat().forEach((id) => count.set(id, (count.get(id) ?? 0) + 1))
  return count
})
const touching = computed(() =>
  links.value.filter((link) => chosen.value !== null && link.includes(chosen.value)),
)
const near = computed(() => new Set(touching.value.flat().filter((id) => id !== chosen.value)))
const shown = computed(() => (wide.value ? links.value : touching.value))
const current = computed(() => props.modules.find((module) => module.id === chosen.value))

const hub = (id: string) => (degree.value.get(id) ?? 0) >= 5
const spot = (id: string) => {
  const place = layout.value?.places[id]
  return { x: (layout.value?.width ?? 0) / 2 + (place?.x ?? 0), y: place?.y ?? 0 }
}

let observer: ResizeObserver | undefined
let frame = 0
let measured = -1

function place() {
  const element = map.value
  if (!element) return
  const sizes = new Map<string, MapSize>()
  element.querySelectorAll<HTMLElement>('[data-module]').forEach((chip) => {
    const id = chip.dataset.module ?? ''
    sizes.set(id, { id, w: chip.offsetWidth, h: chip.offsetHeight })
  })
  const seeds = seedPoints(
    props.modules.map((module) => module.id),
    props.content.layout,
    links.value,
  )
  const placed = props.modules.flatMap((module) => {
    const size = sizes.get(module.id)
    const [x, y] = seeds.get(module.id) ?? [0, 0]
    return size ? [{ ...size, x, y }] : []
  })
  const rank = (id: string) => degree.value.get(id) ?? 0
  measured = element.clientWidth
  layout.value = wide.value
    ? relaxGraph(placed, links.value, measured, 14)
    : packCloud(
        [...placed].sort((a, b) => rank(b.id) - rank(a.id)),
        measured,
        8,
      )
}

const schedule = () => {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(place)
}

const hover = (event: PointerEvent, id: string) => {
  if (event.pointerType === 'mouse') chosen.value = id
}

const leave = (event: PointerEvent) => {
  if (event.pointerType === 'mouse') chosen.value = null
}

const blur = (event: FocusEvent) => {
  const stage = event.currentTarget as HTMLElement
  if (!stage.contains(event.relatedTarget as Node | null)) chosen.value = null
}

onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    if (entry && Math.round(entry.contentRect.width) !== measured) schedule()
  })
  if (map.value) observer.observe(map.value)
  document.fonts.ready.then(schedule)
})

watch(wide, schedule)

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})
</script>

<template>
  <PageSection :id="content.id" :title="content.title" :lead="content.lead">
    <div class="catalog" @pointerleave="leave" @focusout="blur">
      <div
        ref="map"
        class="catalog__map"
        :class="{ 'catalog__map--placed': layout, 'catalog__map--focused': chosen }"
        :style="layout ? { height: `${layout.height}px` } : undefined"
      >
        <svg v-if="layout" class="catalog__links" aria-hidden="true">
          <line
            v-for="link in shown"
            :key="link.join(' ')"
            class="catalog__link"
            :class="{ 'catalog__link--on': chosen !== null && link.includes(chosen) }"
            :x1="spot(link[0]).x"
            :y1="spot(link[0]).y"
            :x2="spot(link[1]).x"
            :y2="spot(link[1]).y"
          />
        </svg>
        <ul class="catalog__modules">
          <li
            v-for="module in modules"
            :key="module.id"
            class="catalog__node"
            :style="
              layout ? { left: `${spot(module.id).x}px`, top: `${spot(module.id).y}px` } : undefined
            "
          >
            <button
              type="button"
              class="catalog__module"
              :class="{
                'catalog__module--hub': hub(module.id),
                'catalog__module--chosen': chosen === module.id,
                'catalog__module--near': near.has(module.id),
              }"
              :data-module="module.id"
              :aria-pressed="chosen === module.id"
              @pointerenter="hover($event, module.id)"
              @focus="chosen = module.id"
              @click="chosen = module.id"
            >
              <InlineText :text="module.name" />
            </button>
          </li>
        </ul>
      </div>
      <p class="catalog__caption" aria-live="polite">
        <InlineText :text="current ? current.text : content.hint" />
      </p>
      <ul class="catalog__more">
        <li v-for="item in content.more" :key="item" class="catalog__extra">{{ item }}</li>
      </ul>
    </div>
  </PageSection>
</template>
