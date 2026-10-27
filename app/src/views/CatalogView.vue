<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CatalogExplorer from '@/components/catalog/CatalogExplorer.vue'
import { catalogModules, siteContent } from '@/contents'
import { mapLinks } from '@/utils/catalog-map'

const route = useRoute()
const router = useRouter()
const links = mapLinks(catalogModules)
const chosen = ref<string | null>(null)

const known = (id: unknown) =>
  typeof id === 'string' && catalogModules.some((module) => module.id === id) ? id : null

onMounted(() => {
  chosen.value = known(route.query.module)
})

watch(chosen, (id) => {
  if (id !== known(route.query.module)) router.replace({ query: id ? { module: id } : {} })
})
</script>

<template>
  <CatalogExplorer
    v-model:chosen="chosen"
    :content="siteContent.home.catalog"
    :modules="catalogModules"
    :links="links"
  />
</template>
