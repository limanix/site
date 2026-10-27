<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import CatalogMap from '@/components/catalog/CatalogMap.vue'
import MapIcon from '@/components/catalog/MapIcon.vue'
import InlineText from '@/components/ui/InlineText.vue'
import { siteContent, type CatalogContent, type CatalogModule } from '@/contents'
import type { MapLink } from '@/utils/catalog-map'

const props = defineProps<{ content: CatalogContent; modules: CatalogModule[]; links: MapLink[] }>()

const LIMIT = 8
const PAGES: Record<string, string> = { claude: 'claude-code' }
const MOVES: Record<string, [number, number]> = {
  ArrowLeft: [80, 0],
  ArrowRight: [-80, 0],
  ArrowUp: [0, 80],
  ArrowDown: [0, -80],
}

const dialog = ref<HTMLDialogElement | null>(null)
const map = ref<InstanceType<typeof CatalogMap> | null>(null)
const search = ref<HTMLInputElement | null>(null)
const open = ref(false)
const chosen = ref<string | null>(null)
const query = ref('')
const titleId = `catalog-map-${useId()}`

const byId = computed(() => new Map(props.modules.map((module) => [module.id, module])))
const current = computed(() => (chosen.value ? byId.value.get(chosen.value) : undefined))
const related = computed(() => {
  const id = chosen.value
  return props.links
    .flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []))
    .flatMap((other) => byId.value.get(other) ?? [])
})
const found = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return []
  const score = (module: CatalogModule) => {
    const name = module.name.toLowerCase()
    if (name.startsWith(needle) || module.id.startsWith(needle)) return 0
    if (name.includes(needle)) return 1
    return module.text.toLowerCase().includes(needle) ? 2 : 3
  }
  return props.modules
    .map((module) => ({ module, rank: score(module) }))
    .filter(({ rank }) => rank < 3)
    .sort((a, b) => a.rank - b.rank || a.module.name.localeCompare(b.module.name))
    .map(({ module }) => module)
})
const matches = computed(() =>
  query.value.trim() ? new Set(found.value.map((module) => module.id)) : null,
)
const guide = computed(() => {
  const module = current.value?.module
  return module ? `${siteContent.links.docs}/modules/${PAGES[module] ?? module}` : null
})

function show(id: string | null) {
  chosen.value = id
  query.value = ''
  open.value = true
  dialog.value?.showModal()
  if (window.matchMedia('(pointer: fine)').matches) nextTick(() => search.value?.focus())
}

function pick(id: string) {
  query.value = ''
  map.value?.reveal(id)
}

function keys(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement) return
  const move = MOVES[event.key]
  if (move) map.value?.panBy(...move)
  else if (event.key === '+' || event.key === '=') map.value?.zoomBy(1.25)
  else if (event.key === '-') map.value?.zoomBy(0.8)
  else if (event.key === '0') map.value?.fit()
  else if (event.key === '/') search.value?.focus()
  else return
  event.preventDefault()
}

defineExpose({ show })
</script>

<template>
  <dialog
    ref="dialog"
    class="c-catalog-dialog"
    :aria-labelledby="titleId"
    @close="open = false"
    @keydown="keys"
  >
    <header class="c-catalog-dialog__bar">
      <h2 :id="titleId" class="c-catalog-dialog__title">{{ content.map }}</h2>
      <div class="c-catalog-dialog__search">
        <MapIcon class="c-catalog-dialog__lens" name="search" />
        <input
          ref="search"
          v-model="query"
          class="c-catalog-dialog__input"
          type="search"
          autocomplete="off"
          spellcheck="false"
          :placeholder="content.search"
          :aria-label="content.search"
          @keydown.enter.prevent="found[0] && pick(found[0].id)"
        />
        <ul v-if="query.trim()" class="c-catalog-dialog__results">
          <li v-for="module in found.slice(0, LIMIT)" :key="module.id">
            <button type="button" class="c-catalog-dialog__result" @click="pick(module.id)">
              <span
                v-if="module.kind"
                class="c-catalog-dialog__dot"
                :class="`u-tone-${content.kinds[module.kind].tone}`"
                aria-hidden="true"
              />
              <InlineText :text="module.name" />
            </button>
          </li>
          <li v-if="!found.length" class="c-catalog-dialog__empty">{{ content.empty }}</li>
        </ul>
      </div>
      <ul class="c-catalog-dialog__legend">
        <li v-for="(kind, key) in content.kinds" :key="key" class="c-catalog-dialog__kind">
          <span class="c-catalog-dialog__dot" :class="`u-tone-${kind.tone}`" aria-hidden="true" />
          {{ kind.label }}
        </li>
      </ul>
      <div class="c-catalog-dialog__tools">
        <button
          type="button"
          class="c-catalog-dialog__tool"
          :aria-label="content.zoomOut"
          :title="content.zoomOut"
          @click="map?.zoomBy(0.8)"
        >
          <MapIcon name="minus" />
        </button>
        <button
          type="button"
          class="c-catalog-dialog__tool"
          :aria-label="content.zoomIn"
          :title="content.zoomIn"
          @click="map?.zoomBy(1.25)"
        >
          <MapIcon name="plus" />
        </button>
        <button
          type="button"
          class="c-catalog-dialog__tool"
          :aria-label="content.fit"
          :title="content.fit"
          @click="map?.fit()"
        >
          <MapIcon name="fit" />
        </button>
        <button
          type="button"
          class="c-catalog-dialog__tool"
          :aria-label="content.close"
          :title="content.close"
          @click="dialog?.close()"
        >
          <MapIcon name="close" />
        </button>
      </div>
    </header>
    <div class="c-catalog-dialog__stage">
      <CatalogMap
        v-if="open"
        ref="map"
        v-model:chosen="chosen"
        full
        :modules="modules"
        :links="links"
        :kinds="content.kinds"
        :matches="matches"
      />
      <section class="c-catalog-dialog__panel" aria-live="polite">
        <template v-if="current">
          <p class="c-catalog-dialog__name">
            <span
              v-if="current.kind"
              class="c-catalog-dialog__dot"
              :class="`u-tone-${content.kinds[current.kind].tone}`"
              aria-hidden="true"
            />
            <InlineText :text="current.name" />
            <span v-if="current.kind" class="c-catalog-dialog__meta">
              {{ content.kinds[current.kind].label }}
            </span>
          </p>
          <p class="c-catalog-dialog__text"><InlineText :text="current.text" /></p>
          <div v-if="related.length" class="c-catalog-dialog__related">
            <span class="c-catalog-dialog__meta">{{ content.related }}</span>
            <button
              v-for="module in related"
              :key="module.id"
              type="button"
              class="c-catalog-dialog__chip"
              @click="pick(module.id)"
            >
              <InlineText :text="module.name" />
            </button>
          </div>
          <a v-if="guide" class="c-catalog-dialog__guide c-inline-link" :href="guide">
            {{ content.guide }}
          </a>
        </template>
        <p v-else class="c-catalog-dialog__text">{{ content.mapHint }}</p>
      </section>
    </div>
  </dialog>
</template>
