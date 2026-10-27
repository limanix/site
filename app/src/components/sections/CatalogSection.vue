<script setup lang="ts">
import { computed, ref } from 'vue'
import CatalogMap from '@/components/catalog/CatalogMap.vue'
import MapIcon from '@/components/catalog/MapIcon.vue'
import ActionLink from '@/components/ui/ActionLink.vue'
import InlineText from '@/components/ui/InlineText.vue'
import PageSection from '@/components/ui/PageSection.vue'
import type { CatalogContent, CatalogModule, LinksContent } from '@/contents'
import { mapLinks } from '@/utils/catalog-map'

const props = defineProps<{
  content: CatalogContent
  modules: CatalogModule[]
  links: LinksContent
}>()

const chosen = ref<string | null>(null)
const edges = computed(() => mapLinks(props.modules))
const current = computed(() => props.modules.find((module) => module.id === chosen.value))
</script>

<template>
  <PageSection :id="content.id" :title="content.title" :lead="content.lead">
    <div class="catalog">
      <div class="catalog__bar">
        <ul class="catalog__legend">
          <li v-for="(kind, key) in content.kinds" :key="key" class="catalog__kind">
            <span class="catalog__dot" :class="`u-tone-${kind.tone}`" aria-hidden="true" />
            {{ kind.label }}
          </li>
        </ul>
        <a class="catalog__expand" :href="links.catalog">
          <MapIcon name="expand" />
          {{ content.expand }}
        </a>
      </div>
      <CatalogMap
        v-model:chosen="chosen"
        :modules="modules"
        :links="edges"
        :kinds="content.kinds"
      />
      <p class="catalog__caption" aria-live="polite">
        <InlineText :text="current ? current.text : content.hint" />
      </p>
      <ul class="catalog__more">
        <li v-for="item in content.more" :key="item.label">
          <a class="catalog__extra" :href="item.href">{{ item.label }}</a>
        </li>
      </ul>
      <div class="catalog__docs">
        <ActionLink :href="`${links.docs}/modules/`" variant="text">{{
          content.browse
        }}</ActionLink>
      </div>
    </div>
  </PageSection>
</template>
