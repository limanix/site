<script setup lang="ts">
import { computed, ref } from 'vue'
import catalogThemes from '../../../.catalog/themes.json'

type Theme = {
  name: string
  title: string
  homepage: string
  dark: boolean
  palette: Record<string, string>
}

const themes = catalogThemes as Theme[]
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
const selected = ref(themes[0]?.name ?? '')
const theme = computed(() => themes.find((item) => item.name === selected.value))
</script>

<template>
  <div v-if="themes.length" class="themes">
    <div class="themes__tabs" role="tablist" aria-label="Themes">
      <button
        v-for="item in themes"
        :key="item.name"
        type="button"
        role="tab"
        class="themes__tab"
        :class="{ 'themes__tab--active': item.name === selected }"
        :aria-selected="item.name === selected"
        @click="selected = item.name"
      >
        <span class="themes__dot" :style="{ background: item.palette.accent }" />
        {{ item.title }}
      </button>
    </div>
    <div v-if="theme" class="themes__panel" role="tabpanel">
      <img
        class="themes__preview"
        :src="`/themes/${theme.name}.svg`"
        :alt="`tmux, Neovim, eza and delta in the ${theme.title} theme`"
        loading="lazy"
      />
      <p class="themes__meta">
        <code>name = "{{ theme.name }}"</code>
        <span>{{ theme.dark ? 'Dark' : 'Light' }}</span>
        <a :href="theme.homepage" target="_blank" rel="noreferrer">{{ theme.title }} palette</a>
      </p>
      <ul class="themes__palette">
        <li v-for="role in roles" :key="role" class="themes__color">
          <span class="themes__swatch" :style="{ background: theme.palette[role] }" />
          <span class="themes__role">{{ role }}</span>
          <code class="themes__hex">{{ theme.palette[role] }}</code>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.themes {
  margin: 24px 0;
}

.themes__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.themes__tab {
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

.themes__tab:hover,
.themes__tab--active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.themes__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.themes__panel {
  margin-top: 16px;
}

.themes__preview {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 10px;
  box-shadow: var(--vp-shadow-2);
}

.themes__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin: 16px 0;
  font-size: 14px;
}

.themes__palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  padding: 0;
  list-style: none;
}

.themes__color {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
}

.themes__swatch {
  flex: none;
  width: 22px;
  height: 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}

.themes__role {
  flex: 1;
  color: var(--vp-c-text-2);
}

.themes__hex {
  font-size: 12px;
}
</style>
