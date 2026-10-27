<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import ActionLink from '@/components/ui/ActionLink.vue'
import CodeBlock from '@/components/ui/CodeBlock.vue'
import InlineText from '@/components/ui/InlineText.vue'
import type { DownloadContent, LinksContent } from '@/contents'

const props = defineProps<{ content: DownloadContent; links: LinksContent }>()

const asset = ref(props.content.binaries[0]?.asset ?? '')
const copied = ref(false)
let timer = 0

const lines = computed(() =>
  props.content.install.lines.map((line) => line.replace('{asset}', asset.value)),
)

async function copy() {
  const commands = lines.value.map((line) => line.replace(/^\$ /, '').replace(/\s+#.*$/, ''))
  await navigator.clipboard.writeText(commands.join('\n'))
  copied.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => (copied.value = false), 2000)
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <section class="download o-container" aria-labelledby="download-title">
    <h1 id="download-title"><InlineText :text="content.title" /></h1>
    <p class="download__lead">{{ content.lead }}</p>
    <a class="download__notes" :href="links.latest">{{ content.notes }}</a>
    <div class="download__binaries">
      <ActionLink
        v-for="binary in content.binaries"
        :key="binary.asset"
        class="download__binary"
        :href="links.binaries + binary.asset"
        size="lg"
        @click="asset = binary.asset"
      >
        <span class="download__label">
          <span>{{ content.action }}</span>
          <span class="download__platform">{{ binary.label }}</span>
        </span>
      </ActionLink>
    </div>
    <div class="download__install">
      <div class="download__terminal">
        <CodeBlock :lines="lines" :label="content.install.window" />
        <button type="button" class="download__copy" aria-live="polite" @click="copy">
          {{ copied ? content.install.copied : content.install.copy }}
        </button>
      </div>
      <div class="download__approval">
        <svg class="download__shield" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <p>
          <strong>{{ content.install.approval.title }}</strong>
          {{ content.install.approval.text }}
          <span class="download__path">{{ content.install.approval.path }}</span>
        </p>
      </div>
    </div>
    <ActionLink class="download__guide" :href="links.guide" variant="text" size="lg">{{
      content.guide
    }}</ActionLink>
  </section>
</template>
