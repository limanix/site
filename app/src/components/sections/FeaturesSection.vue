<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import CodeBlock from '@/components/ui/CodeBlock.vue'
import FeatureIcon from '@/components/ui/FeatureIcon.vue'
import InlineText from '@/components/ui/InlineText.vue'
import PageSection from '@/components/ui/PageSection.vue'
import type { FeaturesContent } from '@/contents'

const props = defineProps<{ content: FeaturesContent }>()

const id = useId()
const active = ref(0)
const current = computed(() => props.content.items[active.value])
</script>

<template>
  <PageSection :id="content.id" :title="content.title" :lead="content.lead">
    <div class="features" :style="{ '--rows': content.items.length }">
      <div
        v-for="(item, index) in content.items"
        :key="item.title"
        class="features__card"
        :style="{ '--row': index + 1 }"
      >
        <button
          :id="`${id}-item${index}`"
          type="button"
          class="features__item"
          :class="{ 'features__item--active': active === index }"
          :aria-expanded="active === index"
          :aria-controls="`${id}-window`"
          @click="active = index"
        >
          <FeatureIcon class="features__icon" :icon="item.icon" :tone="item.tone" />
          <span class="features__copy">
            <span class="features__title">{{ item.title }}</span>
            <span class="features__text"><InlineText :text="item.text" /></span>
          </span>
        </button>
        <CodeBlock class="features__code" :lines="item.code" :label="item.window" />
      </div>
      <div
        v-if="current"
        :id="`${id}-window`"
        class="features__stage"
        role="region"
        :aria-labelledby="`${id}-item${active}`"
      >
        <Transition name="features-swap" mode="out-in">
          <CodeBlock :key="active" :lines="current.code" :label="current.window" />
        </Transition>
      </div>
    </div>
  </PageSection>
</template>
