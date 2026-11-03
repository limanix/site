<script setup lang="ts">
import { computed, ref } from 'vue'
import catalogPrompts from '../../../.catalog/prompts.json'
import catalogThemes from '../../../.catalog/themes.json'

type Preview = {
  name: string
  title: string
  description?: string
  shells?: string[]
  homepage?: string
  dark?: boolean
  palette?: Record<string, string>
}

const props = defineProps<{ kind: 'themes' | 'prompts' }>()
const items = (props.kind === 'themes' ? catalogThemes : catalogPrompts) as Preview[]
const roles = [
  'background',
  'background_dark',
  'background_darker',
  'surface',
  'selection',
  'border',
  'muted',
  'subtle',
  'foreground',
  'accent',
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'blue',
  'purple',
  'pink',
]
const shells: Record<string, string> = { bash: 'Bash', zsh: 'Zsh' }
const selected = ref(items[0]?.name ?? '')
const item = computed(() => items.find((entry) => entry.name === selected.value))
</script>

<template>
  <div v-if="items.length" class="previews">
    <div
      class="previews__tabs"
      role="tablist"
      :aria-label="kind === 'themes' ? 'Themes' : 'Prompts'"
    >
      <button
        v-for="entry in items"
        :key="entry.name"
        type="button"
        role="tab"
        class="previews__tab"
        :class="{ 'previews__tab--active': entry.name === selected }"
        :aria-selected="entry.name === selected"
        @click="selected = entry.name"
      >
        <span
          v-if="entry.palette"
          class="previews__dot"
          :style="{ background: entry.palette.accent }"
        />
        {{ entry.title }}
      </button>
    </div>
    <div v-if="item" class="previews__panel" role="tabpanel">
      <img
        class="previews__preview"
        :src="`/${kind}/${item.name}.svg`"
        :alt="
          kind === 'themes'
            ? `tmux, Neovim, eza and delta in the ${item.title} theme`
            : `The ${item.title} prompt in a Git repository`
        "
        loading="lazy"
      />
      <p v-if="kind === 'themes'" class="previews__meta">
        <code>name = "{{ item.name }}"</code>
        <span>{{ item.dark ? 'Dark' : 'Light' }}</span>
        <a :href="item.homepage" target="_blank" rel="noreferrer">{{ item.title }} palette</a>
      </p>
      <p v-else class="previews__meta">
        <code>prompt = "{{ item.name }}"</code>
        <span>{{ item.shells?.map((shell) => shells[shell]).join(' and ') }}</span>
      </p>
      <p v-if="item.description">{{ item.description }}</p>
      <ul v-if="item.palette" class="previews__palette">
        <li v-for="role in roles" :key="role" class="previews__color">
          <span class="previews__swatch" :style="{ background: item.palette[role] }" />
          <span class="previews__role">{{ role }}</span>
          <code class="previews__hex">{{ item.palette[role] }}</code>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.previews {
  margin: 24px 0;
}

.previews__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.previews__tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  transition:
    border-color 0.2s,
    color 0.2s;
}

.previews__tab:hover,
.previews__tab--active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.previews__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.previews__panel {
  margin-top: 16px;
}

.previews__preview {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 10px;
  box-shadow: var(--vp-shadow-2);
}

.previews__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin: 16px 0;
  font-size: 14px;
}

.previews__palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  padding: 0;
  list-style: none;
}

.previews__color {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
}

.previews__swatch {
  flex: none;
  width: 22px;
  height: 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}

.previews__role {
  flex: 1;
  color: var(--vp-c-text-2);
}

.previews__hex {
  font-size: 12px;
}
</style>
