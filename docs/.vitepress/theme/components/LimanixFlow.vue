<script setup lang="ts">
type Step = { side: 'mac' | 'vm'; title: string; text: string } | { divider: string }

const steps: Step[] = [
  {
    side: 'mac',
    title: 'Check',
    text: 'Reads and validates <code>limanix.toml</code>, then checks macOS, the binary, <code>ssh</code> and, for another architecture, QEMU.',
  },
  {
    side: 'mac',
    title: 'Prepare',
    text: 'Locks the VM and writes the inputs of a new generation. <code>create</code> also makes the managed home.',
  },
  {
    side: 'mac',
    title: 'Configure',
    text: '<code>create</code> makes the VM in Lima. <code>update</code> stops a running VM and applies the new CPU, memory, disk and mounts.',
  },
  {
    side: 'mac',
    title: 'Start',
    text: 'Starts the VM with the inputs at <code>/mnt/limanix</code>, read-only.',
  },
  {
    side: 'vm',
    title: 'Hand over',
    text: 'Builds the <code>lmx</code> that the generation pins and runs its <code>lmxd</code> for the build.',
  },
  {
    side: 'vm',
    title: 'Build',
    text: 'Installs your <code>[env]</code>, makes room in the Nix store and builds the next system. The output streams to the Mac.',
  },
  { divider: 'Until here, a failure leaves the VM on its current system' },
  { side: 'mac', title: 'Restart', text: 'Restarts the VM into the new system.' },
  {
    side: 'vm',
    title: 'Check and clean up',
    text: 'Checks the services, the shared folders and your account, then removes the older system.',
  },
  {
    side: 'mac',
    title: 'Ready',
    text: 'Waits until <code>lmxd</code> reports the system healthy, saves the VM as <code>ready</code> and removes old inputs.',
  },
]

let number = 0
let previous: 'mac' | 'vm' | undefined
const rows = steps.map((step) => {
  if ('divider' in step) return step
  const handoff = previous !== undefined && previous !== step.side
  previous = step.side
  return { ...step, number: ++number, handoff }
})
</script>

<template>
  <figure class="flow">
    <div class="flow__grid" :style="{ '--rows': rows.length }">
      <div class="flow__lane flow__side--mac" aria-hidden="true" />
      <div class="flow__lane flow__side--vm" aria-hidden="true" />
      <p class="flow__title flow__side--mac">Your Mac</p>
      <p class="flow__title flow__side--vm">Linux VM</p>
      <template v-for="(row, index) in rows" :key="index">
        <p v-if="'divider' in row" class="flow__divider" :style="{ gridRow: index + 2 }">
          {{ row.divider }}
        </p>
        <template v-else>
          <span
            v-if="row.handoff"
            class="flow__handoff"
            :class="`flow__handoff--${row.side}`"
            :style="{ gridRow: index + 2 }"
            aria-hidden="true"
          />
          <div
            class="flow__step"
            :class="`flow__side--${row.side}`"
            :style="{ gridRow: index + 2 }"
          >
            <span class="flow__number">{{ row.number }}</span>
            <p class="flow__head">
              <strong>{{ row.title }}</strong>
              <span class="flow__where">{{ row.side === 'mac' ? 'Mac' : 'VM' }}</span>
            </p>
            <p class="flow__text" v-html="row.text" />
          </div>
        </template>
      </template>
    </div>
  </figure>
</template>

<style scoped>
.flow {
  margin: 24px 0;
}

.flow__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px minmax(0, 1fr);
  grid-template-rows: auto repeat(var(--rows), auto) 10px;
}

.flow__lane {
  grid-row: 1 / -1;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.flow__side--mac {
  grid-column: 1;
}

.flow__side--vm {
  grid-column: 3;
}

.flow__title {
  grid-row: 1;
  margin: 0;
  padding: 14px 18px 4px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.flow__step {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 10px;
  margin: 5px 10px;
  padding: 10px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
}

.flow__number {
  grid-row: 1 / span 2;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.flow__head,
.flow__text {
  margin: 0;
  line-height: 1.5;
}

.flow__head {
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.flow__where {
  display: none;
  margin-left: 6px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.flow__text {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.flow__text :deep(code) {
  white-space: nowrap;
}

.flow__handoff {
  position: relative;
  grid-column: 2;
  align-self: center;
  height: 8px;
}

.flow__handoff::before {
  content: '';
  position: absolute;
  top: 3px;
  right: 2px;
  left: 2px;
  border-top: 1.5px solid var(--vp-c-brand-1);
}

.flow__handoff::after {
  content: '';
  position: absolute;
  top: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}

.flow__handoff--vm::after {
  right: 0;
  border-left: 7px solid var(--vp-c-brand-1);
}

.flow__handoff--mac::after {
  left: 0;
  border-right: 7px solid var(--vp-c-brand-1);
}

.flow__divider {
  grid-column: 1 / -1;
  margin: 8px 10px;
  padding-top: 6px;
  border-top: 1.5px dashed var(--vp-c-warning-1);
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  color: var(--vp-c-warning-1);
}

@media (max-width: 640px) {
  .flow__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .flow__lane,
  .flow__title,
  .flow__handoff {
    display: none;
  }

  .flow__side--mac,
  .flow__side--vm,
  .flow__divider {
    grid-column: 1;
  }

  .flow__step {
    margin-inline: 0;
  }

  .flow__divider {
    margin-inline: 0;
  }

  .flow__where {
    display: inline;
  }
}
</style>
