<script setup lang="ts">
import CatalogSection from '@/components/sections/CatalogSection.vue'
import ClosingSection from '@/components/sections/ClosingSection.vue'
import FaqSection from '@/components/sections/FaqSection.vue'
import FeaturesSection from '@/components/sections/FeaturesSection.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import StepsSection from '@/components/sections/StepsSection.vue'
import { catalogModules, siteContent } from '@/contents'

const { home, links } = siteContent
</script>

<template>
  <HeroSection :content="home.hero" :demo="home.demo" :links="links" />
  <FeaturesSection :content="home.features" />
  <CatalogSection :content="home.catalog" :modules="catalogModules" :links="links" />
  <StepsSection :content="home.steps" :links="links" />
  <FaqSection :content="home.faq" />
  <ClosingSection :content="home.closing" :links="links" />
</template>
