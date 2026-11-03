<script setup lang="ts">
import { useData } from 'vitepress'
import { onMounted, ref, useId, watch } from 'vue'

const props = defineProps<{ code: string }>()
const { isDark } = useData()
const id = useId()
const svg = ref('')

async function render() {
  const { default: mermaid } = await import('mermaid')
  await document.fonts.ready
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark.value ? 'dark' : 'neutral',
    fontFamily: getComputedStyle(document.body).fontFamily,
  })
  svg.value = (await mermaid.render(id, props.code)).svg
}

onMounted(render)
watch(isDark, render)
</script>

<template>
  <figure class="mermaid" v-html="svg" />
</template>

<style scoped>
.mermaid {
  margin: 16px 0;
}

.mermaid :deep(p) {
  line-height: 1.5;
}
</style>
