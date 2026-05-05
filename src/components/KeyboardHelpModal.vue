<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const bindings = [
  { key: 'Space', desc: 'Start / Pause' },
  { key: 'T', desc: '1 tick 進める' },
  { key: 'R', desc: 'リセット' },
  { key: '1 / 2', desc: '小 / 大プリセット切替' },
  { key: 'F1〜F4', desc: 'シナリオ 1〜4 起動' },
  { key: 'D / H', desc: '勇者を呼ぶ (魔王配置モード)' },
  { key: '?', desc: 'このヘルプの開閉' },
  { key: 'Escape', desc: 'ヘルプを閉じる / 配置モード解除' },
]
</script>

<template>
  <div
    v-if="open"
    class="kbd-help-overlay"
    @click="emit('close')"
  >
    <div
      class="kbd-help-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kbd-help-title"
      @click.stop
    >
      <div class="kbd-help-header">
        <h2 id="kbd-help-title">
          キーボードショートカット
        </h2>
        <button
          class="kbd-help-close"
          aria-label="閉じる"
          @click="emit('close')"
        >
          ×
        </button>
      </div>
      <table class="kbd-help-table">
        <tbody>
          <tr
            v-for="b in bindings"
            :key="b.key"
          >
            <td class="kbd-help-key">
              <kbd>{{ b.key }}</kbd>
            </td>
            <td>{{ b.desc }}</td>
          </tr>
        </tbody>
      </table>
      <p class="kbd-help-note">
        入力中 (input / textarea) はショートカット無効
      </p>
    </div>
  </div>
</template>

<style scoped>
.kbd-help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.kbd-help-modal {
  background: #2a2a2a;
  color: #eee;
  border: 1px solid #555;
  border-radius: 8px;
  padding: 1.5rem;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.kbd-help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.kbd-help-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.kbd-help-close {
  background: transparent;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 4px;
  width: 2rem;
  height: 2rem;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kbd-help-close:hover {
  background: #444;
  color: #fff;
}

.kbd-help-table {
  width: 100%;
  border-collapse: collapse;
}

.kbd-help-table td {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid #3a3a3a;
}

.kbd-help-key {
  white-space: nowrap;
}

kbd {
  background: #1a1a1a;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 0.1rem 0.4rem;
  font-family: monospace;
  font-size: 0.85rem;
}

.kbd-help-note {
  margin: 1rem 0 0;
  font-size: 0.8rem;
  color: #888;
}
</style>
