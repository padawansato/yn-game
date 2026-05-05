import { onMounted, onUnmounted } from 'vue'

export type ScenarioIndex = 1 | 2 | 3 | 4

export interface ShortcutHandlers {
  onTogglePlay?: () => void
  onTick?: () => void
  onReset?: () => void
  onPresetSmall?: () => void
  onPresetLarge?: () => void
  onScenario?: (idx: ScenarioIndex) => void
  onCallHero?: () => void
  onToggleHelp?: () => void
  onEscape?: () => void
}

function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return true
  if ((el as HTMLElement).isContentEditable) return true
  return false
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  function handler(e: KeyboardEvent) {
    if (isInputFocused()) return
    switch (e.key) {
      case ' ':
        handlers.onTogglePlay?.()
        e.preventDefault()
        break
      case 't':
      case 'T':
        handlers.onTick?.()
        break
      case 'r':
      case 'R':
        handlers.onReset?.()
        break
      case '1':
        handlers.onPresetSmall?.()
        break
      case '2':
        handlers.onPresetLarge?.()
        break
      case 'd':
      case 'D':
      case 'h':
      case 'H':
        handlers.onCallHero?.()
        break
      case '?':
        handlers.onToggleHelp?.()
        break
      case 'Escape':
        handlers.onEscape?.()
        break
      case 'F1':
        handlers.onScenario?.(1)
        e.preventDefault()
        break
      case 'F2':
        handlers.onScenario?.(2)
        e.preventDefault()
        break
      case 'F3':
        handlers.onScenario?.(3)
        e.preventDefault()
        break
      case 'F4':
        handlers.onScenario?.(4)
        e.preventDefault()
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', handler))
  onUnmounted(() => window.removeEventListener('keydown', handler))
}
