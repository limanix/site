import site from './site.json'

export type Tone = 'amber' | 'sky' | 'green' | 'pink' | 'purple' | 'rose'
export type FeatureIcon = 'terminal' | 'braces' | 'layers' | 'folder' | 'sliders' | 'pulse'
export type FlowPlace = 'mac' | 'vm'

type Site = typeof site
type Home = Site['home']

export type Feature = Omit<Home['features']['items'][number], 'icon' | 'tone'> & {
  icon: FeatureIcon
  tone: Tone
}

type Command = Home['howItWorks']['commands'][number]
export type FlowCommand = Omit<Command, 'steps'> & {
  steps: (Omit<Command['steps'][number], 'where'> & { where: FlowPlace })[]
}

export type HomeContent = Omit<Home, 'features' | 'howItWorks'> & {
  features: Omit<Home['features'], 'items'> & { items: Feature[] }
  howItWorks: Omit<Home['howItWorks'], 'commands'> & { commands: FlowCommand[] }
}
export type SiteContent = Omit<Site, 'home'> & { home: HomeContent }

export type LinksContent = SiteContent['links']
export type HeroContent = HomeContent['hero']
export type DemoContent = HomeContent['demo']
export type WelcomeContent = DemoContent['welcome']
export type FeaturesContent = HomeContent['features']
export type HowItWorksContent = HomeContent['howItWorks']
export type CatalogContent = HomeContent['catalog']
export type FaqContent = HomeContent['faq']
export type ClosingContent = HomeContent['closing']
export type DownloadContent = SiteContent['downloadPage']

export const siteContent = site as SiteContent
