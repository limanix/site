<script setup lang="ts">
import { ref } from 'vue'
import InlineText from '@/components/ui/InlineText.vue'
import PageSection from '@/components/ui/PageSection.vue'
import type { HowItWorksContent } from '@/contents'

const props = defineProps<{ content: HowItWorksContent }>()

const chosen = ref(0)
const track = ref<HTMLElement | null>(null)

const cards = () => Array.from(track.value?.children ?? []) as HTMLElement[]

const follow = () => {
  const [first, second] = cards()
  if (!track.value || !first || !second) return
  const index = Math.round(track.value.scrollLeft / (second.offsetLeft - first.offsetLeft))
  chosen.value = Math.min(Math.max(index, 0), props.content.commands.length - 1)
}

const show = (index: number) => {
  const [first] = cards()
  const card = cards()[index]
  if (!track.value || !first || !card) return
  track.value.scrollTo({ left: card.offsetLeft - first.offsetLeft })
}
</script>

<template>
  <PageSection :id="content.id" :title="content.title" :lead="content.lead">
    <div class="flow">
      <div class="flow__switch" role="group" :aria-label="content.commandsLabel">
        <span class="flow__prefix" aria-hidden="true">{{ content.prefix }}</span>
        <button
          v-for="(command, index) in content.commands"
          :key="command.name"
          type="button"
          class="flow__option"
          :aria-pressed="chosen === index"
          @click="chosen = index"
        >
          {{ command.name }}
        </button>
      </div>
      <p class="flow__lanes" aria-hidden="true">
        <span class="flow__lane">{{ content.places.mac.name }}</span>
        <span class="flow__lane flow__lane--vm">{{ content.places.vm.name }}</span>
      </p>
      <ul ref="track" class="flow__commands" @scroll.passive="follow">
        <li
          v-for="(command, index) in content.commands"
          :key="command.name"
          class="flow__command"
          :class="{ 'flow__command--chosen': chosen === index }"
        >
          <p class="flow__chip">{{ content.prefix }} {{ command.name }}</p>
          <h3 class="flow__title">{{ command.title }}</h3>
          <ol class="flow__steps">
            <li
              v-for="(step, number) in command.steps"
              :key="number"
              class="flow__step"
              :class="`flow__step--${step.where}`"
              :style="{ '--step': number }"
            >
              <span class="flow__number" aria-hidden="true">{{ number + 1 }}</span>
              <span class="flow__badge">{{ content.places[step.where].short }}</span>
              <span class="flow__copy">
                <span class="flow__name"><InlineText :text="step.name" /></span>
                <span class="flow__text"><InlineText :text="step.text" /></span>
              </span>
            </li>
          </ol>
          <p class="flow__outcome"><InlineText :text="command.outcome" /></p>
        </li>
      </ul>
      <div class="flow__dots">
        <button
          v-for="(command, index) in content.commands"
          :key="command.name"
          type="button"
          class="flow__dot"
          :aria-label="`${content.prefix} ${command.name}`"
          :aria-current="chosen === index"
          @click="show(index)"
        />
      </div>
    </div>
  </PageSection>
</template>
