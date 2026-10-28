<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ variant?: 'overview' | 'editors' | 'storage' | 'dotfiles' }>()

const diagrams = {
  overview: {
    rows: [
      {
        mac: '<code>limanix.toml</code>',
        link: 'describes',
        vm: 'NixOS with your shell, toolchains, services and packages',
      },
      { mac: 'Project folder', link: 'shared', vm: '<code>/workspace</code>', both: true },
      {
        mac: 'VM home in <code>~/.limanix</code>',
        link: 'shared',
        vm: '<code>/home/dev</code>',
        both: true,
      },
      {
        mac: 'Terminal and editors',
        link: 'SSH',
        vm: 'Shell, language servers and <a href="/inside/lmx"><code>lmx</code></a>',
      },
    ],
    caption:
      'Your tools run in the VM, and your files and editor stay on the Mac. Lima, built into <code>limanix</code>, runs the VM on Apple Virtualization.',
  },
  editors: {
    rows: [
      {
        mac: 'Editor window and settings',
        link: 'SSH',
        vm: 'Editor server, extensions and language servers',
      },
      { mac: 'Terminal panel', link: 'SSH', vm: 'Shell, toolchains and builds' },
      { mac: 'Project folder', link: 'shared', vm: '<code>/workspace</code>', both: true },
    ],
    caption: 'The editor connects to the VM as the SSH host <code>NAME.limanix</code>.',
  },
  storage: {
    rows: [
      { mac: 'Project folder', link: 'shared', vm: '<code>/workspace</code>', both: true },
      {
        mac: 'Managed home in <code>~/.limanix</code>',
        link: 'shared',
        vm: 'Your home, <code>user.home</code>',
        both: true,
      },
      {
        mac: 'Dotfiles folder, such as <code>~/dotfiles</code>',
        link: 'shared',
        vm: '<code>/mnt/dotfiles</code>, linked into your home',
        both: true,
      },
      {
        mac: 'Guest disk in <code>~/.lima</code>',
        link: 'holds',
        vm: 'NixOS, the Nix store and data in <code>/var</code>',
      },
    ],
    caption:
      'Shared folders are the same files on both sides. The guest disk is seen only in the VM, and <code>limanix delete</code> removes it.',
  },
  dotfiles: {
    rows: [
      {
        mac: 'Dotfiles folder, such as <code>~/dotfiles</code>',
        link: 'shared',
        vm: '<code>/mnt/dotfiles</code>',
        both: true,
      },
      {
        mac: '<code>.zshrc</code> in the folder',
        link: 'linked',
        vm: '<code>~/.zshrc</code>',
        both: true,
      },
      {
        mac: '<code>.config/nvim</code> in the folder',
        link: 'linked',
        vm: '<code>~/.config/nvim</code>',
        both: true,
      },
    ],
    caption:
      'Every VM sees the same folder at <code>/mnt/dotfiles</code>, and each new shell links its entries into your home.',
  },
}

const diagram = computed(() => diagrams[props.variant ?? 'overview'])
</script>

<template>
  <figure class="overview">
    <div class="overview__grid" :style="{ '--rows': diagram.rows.length }">
      <div class="overview__panel overview__panel--mac" aria-hidden="true" />
      <div class="overview__panel overview__panel--vm" aria-hidden="true" />
      <p class="overview__title overview__side--mac">Your Mac</p>
      <p class="overview__title overview__side--vm">Linux VM</p>
      <template v-for="(row, index) in diagram.rows" :key="row.link + index">
        <p
          class="overview__item overview__side--mac"
          :style="{ gridRow: index + 2 }"
          v-html="row.mac"
        />
        <p
          class="overview__link"
          :class="{ 'overview__link--both': row.both }"
          :style="{ gridRow: index + 2 }"
        >
          {{ row.link }}
          <span class="overview__arrow" aria-hidden="true" />
        </p>
        <p
          class="overview__item overview__side--vm"
          :style="{ gridRow: index + 2 }"
          v-html="row.vm"
        />
      </template>
    </div>
    <figcaption class="overview__caption" v-html="diagram.caption" />
  </figure>
</template>

<style scoped>
.overview {
  margin: 24px 0;
}

.overview__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  grid-template-rows: auto repeat(var(--rows), auto) 8px;
  column-gap: 12px;
}

.overview__panel {
  grid-row: 1 / -1;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.overview__panel--mac,
.overview__side--mac {
  grid-column: 1;
}

.overview__panel--vm,
.overview__side--vm {
  grid-column: 3;
}

.overview__title,
.overview__item,
.overview__link {
  margin: 0;
  line-height: 1.5;
}

.overview__title {
  grid-row: 1;
  padding: 14px 18px 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.overview__item {
  align-self: center;
  padding: 10px 18px;
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.overview__item :deep(code) {
  white-space: nowrap;
}

.overview__link {
  position: relative;
  grid-column: 2;
  align-self: center;
  min-width: 96px;
  padding: 0 10px 10px 0;
  font-size: 12px;
  text-align: center;
  color: var(--vp-c-text-2);
}

.overview__arrow {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 8px;
}

.overview__arrow::before {
  content: '';
  position: absolute;
  top: 3px;
  right: 6px;
  left: 0;
  border-top: 1.5px solid var(--vp-c-brand-1);
}

.overview__arrow::after,
.overview__link--both::before {
  content: '';
  position: absolute;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}

.overview__arrow::after {
  top: 0;
  right: 0;
  border-left: 7px solid var(--vp-c-brand-1);
}

.overview__link--both::before {
  bottom: 0;
  left: 0;
  border-right: 7px solid var(--vp-c-brand-1);
}

.overview__link--both .overview__arrow::before {
  left: 6px;
}

.overview__caption {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
  color: var(--vp-c-text-2);
}

@media (max-width: 560px) {
  .overview__grid {
    grid-template-columns: minmax(0, 1fr) 64px minmax(0, 1fr);
    column-gap: 6px;
  }

  .overview__title,
  .overview__item {
    padding-inline: 12px;
  }

  .overview__item {
    font-size: 13px;
  }

  .overview__link {
    min-width: 0;
    padding-right: 6px;
    font-size: 11px;
  }
}
</style>
