<script setup lang="ts">
const rows = [
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
]
</script>

<template>
  <figure class="overview">
    <div class="overview__grid" :style="{ '--rows': rows.length }">
      <div class="overview__panel overview__panel--mac" aria-hidden="true" />
      <div class="overview__panel overview__panel--vm" aria-hidden="true" />
      <p class="overview__title overview__side--mac">Your Mac</p>
      <p class="overview__title overview__side--vm">Linux VM</p>
      <template v-for="(row, index) in rows" :key="row.link + index">
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
    <figcaption class="overview__caption">
      Your tools run in the VM, and your files and editor stay on the Mac. Lima, built into
      <code>limanix</code>, runs the VM on Apple Virtualization.
    </figcaption>
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
