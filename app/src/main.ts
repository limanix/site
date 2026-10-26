import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '@/styles/main.scss'

import { createWebHistory } from 'vue-router'
import { createApp } from './app'

const { app, router } = createApp(createWebHistory(import.meta.env.BASE_URL))

router.isReady().then(() => app.mount('#app'))

const beacon = import.meta.env.VITE_CF_BEACON_TOKEN
if (beacon) {
  const script = document.createElement('script')
  script.type = 'module'
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.dataset.cfBeacon = JSON.stringify({ token: beacon })
  document.body.append(script)
}
