// @vitest-environment jsdom

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KeyboardHelpModal from './KeyboardHelpModal.vue'

describe('KeyboardHelpModal', () => {
  it('renders nothing when open=false', () => {
    const wrapper = mount(KeyboardHelpModal, { props: { open: false } })
    expect(wrapper.find('.kbd-help-modal').exists()).toBe(false)
  })

  it('renders modal when open=true', () => {
    const wrapper = mount(KeyboardHelpModal, { props: { open: true } })
    expect(wrapper.find('.kbd-help-modal').exists()).toBe(true)
  })

  it('renders the bindings table with at least 8 rows', () => {
    const wrapper = mount(KeyboardHelpModal, { props: { open: true } })
    const rows = wrapper.findAll('.kbd-help-table tbody tr')
    expect(rows.length).toBeGreaterThanOrEqual(8)
  })

  it('mentions Space, F1, Escape, ? in the bindings table', () => {
    const wrapper = mount(KeyboardHelpModal, { props: { open: true } })
    const text = wrapper.text()
    expect(text).toContain('Space')
    expect(text).toContain('F1')
    expect(text).toContain('Escape')
    expect(text).toContain('?')
  })

  it('emits close when the X button is clicked', async () => {
    const wrapper = mount(KeyboardHelpModal, { props: { open: true } })
    await wrapper.find('.kbd-help-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close when the overlay is clicked', async () => {
    const wrapper = mount(KeyboardHelpModal, { props: { open: true } })
    await wrapper.find('.kbd-help-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does not emit close when the modal body is clicked (stopPropagation)', async () => {
    const wrapper = mount(KeyboardHelpModal, { props: { open: true } })
    await wrapper.find('.kbd-help-modal').trigger('click')
    expect(wrapper.emitted('close')).toBeFalsy()
  })
})
