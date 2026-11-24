<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Language, Review, Severity } from '../../types'
import { LANGUAGES, smsParts } from '../../data/messages'
import { setSeverity } from '../../stores/approvals'

/* Brief §8.2, middle column: the message exactly as people will receive it. */
const props = defineProps<{ r: Review; editing: boolean; locked: boolean }>()

const lang = ref<Language>('en')
const text = computed({
  get: () => props.r.messages[lang.value],
  set: (v: string) => (props.r.messages[lang.value] = v),
})
const length = computed(() => text.value.length)
const parts = computed(() => smsParts(text.value))
const preview = computed(() => text.value || props.r.messages.en)

const SEVERITIES: { id: Severity; label: string }[] = [
  { id: 'watch', label: 'Watch' },
  { id: 'danger', label: 'Act now' },
]
</script>

<template>
  <section class="col panel">
    <h2 class="title">Message</h2>

    <div class="row">
      <span class="label">Severity</span>
      <div class="segmented" role="group" aria-label="Severity">
        <button
          v-for="sv in SEVERITIES"
          :key="sv.id"
          :aria-pressed="r.severity === sv.id"
          :disabled="!editing || locked"
          :data-sev="sv.id"
          @click="setSeverity(r, sv.id)"
        >
          {{ sv.label }}
        </button>
      </div>
    </div>

    <div class="tabs" role="tablist" aria-label="Language">
      <button
        v-for="l in LANGUAGES"
        :key="l.id"
        role="tab"
        :aria-selected="lang === l.id"
        @click="lang = l.id"
      >
        {{ l.label }}
        <span v-if="l.id !== 'en' && !r.messages[l.id]" class="missing" title="No translation yet">·</span>
      </button>
    </div>

    <div class="editor" :class="{ readonly: !editing || locked }">
      <textarea
        v-model="text"
        :readonly="!editing || locked"
        rows="5"
        :placeholder="
          lang === 'en'
            ? 'Message text'
            : 'No translation yet. A native speaker should write this. If left empty, only English is sent.'
        "
        :aria-label="`Message in ${LANGUAGES.find((l) => l.id === lang)?.label}`"
      />
      <div class="counter" :data-over="length > 160">
        {{ length }} / 160 characters · {{ parts }} SMS {{ parts === 1 ? 'part' : 'parts' }}
        <template v-if="length > 160"> · longer messages cost more and may arrive split</template>
      </div>
    </div>
    <p v-if="!editing && !locked" class="label">Press <b>Edit</b> to change the text or severity.</p>

    <div>
      <p class="label">Preview on a basic phone</p>
      <div class="phone" aria-label="SMS preview">
        <div class="phone-head">
          <span>AMA-ALERT</span>
          <span>now</span>
        </div>
        <p class="phone-body">{{ preview }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.col {
  padding: var(--s5);
  display: flex;
  flex-direction: column;
  gap: var(--s4);
  min-width: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.segmented {
  background: var(--canvas);
}
.segmented button:disabled {
  cursor: default;
}
.segmented button[aria-pressed='true'][data-sev='danger'] {
  background: var(--danger);
}
.segmented button[aria-pressed='true'][data-sev='watch'] {
  background: var(--watch);
}
.tabs {
  display: flex;
  gap: var(--s4);
  border-bottom: 1px solid var(--line);
}
.tabs button {
  border: 0;
  background: none;
  padding: 0 0 8px;
  color: var(--ink-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.tabs button[aria-selected='true'] {
  color: var(--ink);
  border-bottom-color: var(--ink);
}
.missing {
  color: var(--watch);
  font-weight: 700;
}
.editor {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
textarea {
  width: 100%;
  resize: vertical;
  font: inherit;
  font-size: 15px;
  line-height: 1.5;
  padding: var(--s3);
  border-radius: var(--r-card);
  border: 1px solid var(--ink);
  background: var(--surface);
  color: var(--ink);
}
.readonly textarea {
  border-color: var(--line);
  background: var(--canvas);
}
textarea:focus-visible {
  outline: 2px solid var(--water);
  outline-offset: 1px;
}
.counter {
  font-size: 12px;
  color: var(--ink-muted);
  font-family: var(--font-mono);
}
.counter[data-over='true'] {
  color: var(--danger);
}
.phone {
  margin-top: 6px;
  max-width: 280px;
  border-radius: var(--r-card);
  background: #dfe3d3;
  border: 6px solid #2b2b2b;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.45;
  color: #1d2414;
}
.phone-head {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #a9b096;
  padding-bottom: 4px;
  margin-bottom: 6px;
  font-weight: 700;
}
.phone-body {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
