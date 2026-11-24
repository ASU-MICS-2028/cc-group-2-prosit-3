<script setup lang="ts">
import type { Role } from '../../types'
import RoleSwitcher from '../RoleSwitcher.vue'

/* Shows a phone app inside a phone outline on a laptop; full screen on a real phone. */
defineProps<{ role: Role; caption: string }>()
</script>

<template>
  <div class="stage">
    <div class="demo-bar">
      <RoleSwitcher :role="role" />
      <span class="tag">Simulated data</span>
    </div>
    <p class="label caption">{{ caption }}</p>
    <div class="phone">
      <div class="screen">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s3);
  padding: var(--s4);
}
.demo-bar {
  display: flex;
  align-items: center;
  gap: var(--s3);
  flex-wrap: wrap;
  justify-content: center;
  background: var(--surface);
  border-radius: var(--r-pill);
  padding: 6px 6px 6px 16px;
}
.tag {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: var(--r-pill);
  border: 1px dashed var(--ink-muted);
}
.caption {
  text-align: center;
  max-width: 420px;
}
.phone {
  width: 390px;
  height: min(820px, calc(100vh - 140px));
  min-height: 640px;
  border: 10px solid var(--ink);
  border-radius: 48px;
  background: var(--canvas);
  overflow: hidden;
}
.screen {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-size: 16px;
}

@media (max-width: 500px) {
  .stage {
    padding: 0;
    gap: 0;
  }
  .demo-bar {
    border-radius: 0;
    width: 100%;
  }
  .caption {
    display: none;
  }
  .phone {
    width: 100%;
    height: calc(100vh - 52px);
    min-height: 0;
    border: 0;
    border-radius: 0;
  }
}
</style>
