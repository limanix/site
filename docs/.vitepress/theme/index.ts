import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import LimanixFlow from './components/LimanixFlow.vue'
import LimanixOverview from './components/LimanixOverview.vue'
import PreviewGallery from './components/PreviewGallery.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LimanixFlow', LimanixFlow)
    app.component('LimanixOverview', LimanixOverview)
    app.component('PreviewGallery', PreviewGallery)
    const beacon = import.meta.env.VITE_CF_BEACON_TOKEN
    if (import.meta.env.SSR || !beacon) return
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
    script.dataset.cfBeacon = JSON.stringify({ token: beacon })
    document.body.append(script)
  },
} satisfies Theme
