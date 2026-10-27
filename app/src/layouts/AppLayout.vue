<script setup lang="ts">
import { useRoute } from 'vue-router'
import SiteFooter from '@/components/chrome/SiteFooter.vue'
import SiteHeader from '@/components/chrome/SiteHeader.vue'

const route = useRoute()
</script>

<template>
  <div class="o-app-layout" :class="{ 'o-app-layout--fill': route.meta.fill }">
    <SiteHeader />
    <main class="o-app-layout__main">
      <RouterView />
    </main>
    <SiteFooter v-if="!route.meta.fill" />
  </div>
</template>
