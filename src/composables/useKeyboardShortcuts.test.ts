// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useKeyboardShortcuts, type ShortcutHandlers } from './useKeyboardShortcuts'

function makeWrapper(handlers: ShortcutHandlers) {
  const Comp = defineComponent({
    setup() {
      useKeyboardShortcuts(handlers)
      return () => h('div')
    },
  })
  return mount(Comp)
}

describe('useKeyboardShortcuts', () => {
  let activeInputs: HTMLElement[] = []

  beforeEach(() => {
    activeInputs = []
  })

  afterEach(() => {
    activeInputs.forEach((el) => el.remove())
  })

  function dispatch(key: string, opts: KeyboardEventInit = {}) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, ...opts }))
  }

  it('Space → onTogglePlay', () => {
    const onTogglePlay = vi.fn()
    makeWrapper({ onTogglePlay })
    dispatch(' ')
    expect(onTogglePlay).toHaveBeenCalledOnce()
  })

  it('T (lowercase) → onTick', () => {
    const onTick = vi.fn()
    makeWrapper({ onTick })
    dispatch('t')
    expect(onTick).toHaveBeenCalledOnce()
  })

  it('T (uppercase) → onTick', () => {
    const onTick = vi.fn()
    makeWrapper({ onTick })
    dispatch('T')
    expect(onTick).toHaveBeenCalledOnce()
  })

  it('R → onReset', () => {
    const onReset = vi.fn()
    makeWrapper({ onReset })
    dispatch('r')
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('1 → onPresetSmall', () => {
    const onPresetSmall = vi.fn()
    makeWrapper({ onPresetSmall })
    dispatch('1')
    expect(onPresetSmall).toHaveBeenCalledOnce()
  })

  it('2 → onPresetLarge', () => {
    const onPresetLarge = vi.fn()
    makeWrapper({ onPresetLarge })
    dispatch('2')
    expect(onPresetLarge).toHaveBeenCalledOnce()
  })

  it('F1 → onScenario(1)', () => {
    const onScenario = vi.fn()
    makeWrapper({ onScenario })
    dispatch('F1')
    expect(onScenario).toHaveBeenCalledWith(1)
  })

  it('F4 → onScenario(4)', () => {
    const onScenario = vi.fn()
    makeWrapper({ onScenario })
    dispatch('F4')
    expect(onScenario).toHaveBeenCalledWith(4)
  })

  it('D → onCallHero', () => {
    const onCallHero = vi.fn()
    makeWrapper({ onCallHero })
    dispatch('d')
    expect(onCallHero).toHaveBeenCalledOnce()
  })

  it('H → onCallHero', () => {
    const onCallHero = vi.fn()
    makeWrapper({ onCallHero })
    dispatch('h')
    expect(onCallHero).toHaveBeenCalledOnce()
  })

  it('? (Shift+/) → onToggleHelp', () => {
    const onToggleHelp = vi.fn()
    makeWrapper({ onToggleHelp })
    dispatch('?')
    expect(onToggleHelp).toHaveBeenCalledOnce()
  })

  it('Escape → onEscape', () => {
    const onEscape = vi.fn()
    makeWrapper({ onEscape })
    dispatch('Escape')
    expect(onEscape).toHaveBeenCalledOnce()
  })

  it('does not fire any handler when an INPUT element is focused', () => {
    const onReset = vi.fn()
    const onTogglePlay = vi.fn()
    makeWrapper({ onReset, onTogglePlay })
    const input = document.createElement('input')
    document.body.appendChild(input)
    activeInputs.push(input)
    input.focus()
    dispatch('r')
    dispatch(' ')
    expect(onReset).not.toHaveBeenCalled()
    expect(onTogglePlay).not.toHaveBeenCalled()
  })

  it('does not fire any handler when a TEXTAREA element is focused', () => {
    const onTick = vi.fn()
    makeWrapper({ onTick })
    const ta = document.createElement('textarea')
    document.body.appendChild(ta)
    activeInputs.push(ta)
    ta.focus()
    dispatch('t')
    expect(onTick).not.toHaveBeenCalled()
  })

  it('removes the keydown listener on unmount', () => {
    const onTogglePlay = vi.fn()
    const wrapper = makeWrapper({ onTogglePlay })
    wrapper.unmount()
    dispatch(' ')
    expect(onTogglePlay).not.toHaveBeenCalled()
  })

  it('does not throw when handlers are omitted (handlers are optional)', () => {
    expect(() => {
      makeWrapper({})
      dispatch(' ')
      dispatch('r')
      dispatch('F1')
    }).not.toThrow()
  })
})
