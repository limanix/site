<script setup lang="ts">
import ActionLink from '@/components/ui/ActionLink.vue'
import InlineText from '@/components/ui/InlineText.vue'
import PageSection from '@/components/ui/PageSection.vue'
import type { LinksContent, StepsContent } from '@/contents'

defineProps<{ content: StepsContent; links: LinksContent }>()
</script>

<template>
  <PageSection :id="content.id" :title="content.title" :lead="content.lead">
    <ol class="steps">
      <li v-for="(step, index) in content.items" :key="step.title" class="steps__item">
        <span class="steps__number" aria-hidden="true">{{ index + 1 }}</span>
        <h3 class="steps__title">{{ step.title }}</h3>
        <p class="steps__text"><InlineText :text="step.text" /></p>
        <code v-if="step.command" class="steps__command"
          ><span class="steps__prompt" aria-hidden="true">$ </span>{{ step.command }}</code
        >
        <ActionLink v-else class="steps__action" :href="links.download">{{
          content.action
        }}</ActionLink>
      </li>
    </ol>
    <p class="steps__note"><InlineText :text="content.note" /></p>
  </PageSection>
</template>
