<script setup lang="ts">
type Icon = 'expand' | 'close' | 'plus' | 'minus' | 'fit' | 'search'

defineProps<{ name: Icon }>()

const paths: Record<Icon, string[]> = {
  expand: ['M14 4h6v6', 'm20 4-7 7', 'M10 20H4v-6', 'm4 20 7-7'],
  close: ['m6 6 12 12', 'M18 6 6 18'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  fit: ['M4 9V4h5', 'M15 4h5v5', 'M20 15v5h-5', 'M9 20H4v-5'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'm20 20-4.2-4.2'],
}
</script>

<template>
  <svg class="c-map-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path v-for="path in paths[name]" :key="path" :d="path" />
  </svg>
</template>
