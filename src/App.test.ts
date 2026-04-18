/**
 * Characterization tests for App.vue before GridView extraction.
 *
 * Purpose: freeze the current rendering behavior so that the upcoming
 * refactor (extracting GridView, introducing GRID_PRESETS) can be verified
 * against a known-good baseline. These tests are intentionally coarse —
 * they assert DOM structure and class presence, not visual pixels.
 *
 * Default startup: createGameState(10, 8, 1.0) → 10 wide × 8 tall grid.
 */
// @vitest-environment jsdom

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'

describe('App.vue (characterization before GridView extraction)', () => {
  it('mounts without errors', () => {
    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
  })

  describe('grid DOM structure (current default 10x8)', () => {
    it('renders a .grid container', () => {
      const wrapper = mount(App)
      expect(wrapper.find('.grid').exists()).toBe(true)
    })

    it('renders 8 rows (height)', () => {
      const wrapper = mount(App)
      const rows = wrapper.findAll('.grid .row')
      expect(rows.length).toBe(8)
    })

    it('renders 10 cells per row (width)', () => {
      const wrapper = mount(App)
      const rows = wrapper.findAll('.grid .row')
      rows.forEach((row) => {
        expect(row.findAll('.cell').length).toBe(10)
      })
    })

    it('renders 80 total cells', () => {
      const wrapper = mount(App)
      expect(wrapper.findAll('.grid .cell').length).toBe(80)
    })
  })

  describe('border walls', () => {
    it('top row cells are walls', () => {
      const wrapper = mount(App)
      const rows = wrapper.findAll('.grid .row')
      const topRowCells = rows[0].findAll('.cell')
      // every top row cell is either wall or the entrance (empty)
      const nonEntrance = topRowCells.filter((_cell, idx) => idx !== Math.floor(10 / 2))
      nonEntrance.forEach((cell) => {
        expect(cell.classes()).toContain('cell-wall')
      })
    })

    it('bottom row cells are walls', () => {
      const wrapper = mount(App)
      const rows = wrapper.findAll('.grid .row')
      const bottomRowCells = rows[rows.length - 1].findAll('.cell')
      bottomRowCells.forEach((cell) => {
        expect(cell.classes()).toContain('cell-wall')
      })
    })

    it('left and right column cells are walls', () => {
      const wrapper = mount(App)
      const rows = wrapper.findAll('.grid .row')
      rows.forEach((row) => {
        const cells = row.findAll('.cell')
        expect(cells[0].classes()).toContain('cell-wall')
        expect(cells[cells.length - 1].classes()).toContain('cell-wall')
      })
    })
  })

  describe('entrance cell', () => {
    it('top row middle cell is an entrance cell', () => {
      const wrapper = mount(App)
      const rows = wrapper.findAll('.grid .row')
      const topRowCells = rows[0].findAll('.cell')
      const entranceCell = topRowCells[Math.floor(10 / 2)]
      expect(entranceCell.classes()).toContain('entrance-cell')
    })
  })

  describe('legends', () => {
    it('renders two .legend elements', () => {
      const wrapper = mount(App)
      const legends = wrapper.findAll('.legend')
      expect(legends.length).toBe(2)
    })

    it('renders a nutrient legend', () => {
      const wrapper = mount(App)
      expect(wrapper.find('.legend.nutrient-legend').exists()).toBe(true)
    })
  })

  describe('controls', () => {
    it('renders Tick, Start, Reset buttons', () => {
      const wrapper = mount(App)
      const buttons = wrapper.findAll('button').map((b) => b.text())
      expect(buttons).toContain('Tick')
      expect(buttons).toContain('Start')
      expect(buttons).toContain('Reset')
    })
  })

  describe('grid size presets', () => {
    it('renders a .presets container with preset buttons', () => {
      const wrapper = mount(App)
      const presetsContainer = wrapper.find('.presets')
      expect(presetsContainer.exists()).toBe(true)
      const presetButtons = presetsContainer.findAll('.preset-btn')
      expect(presetButtons.length).toBeGreaterThanOrEqual(2)
    })

    it('small preset button is active by default', () => {
      const wrapper = mount(App)
      const presetButtons = wrapper.findAll('.preset-btn')
      const smallBtn = presetButtons.find((b) => b.text().includes('10') && b.text().includes('8'))
      expect(smallBtn?.classes()).toContain('active')
    })

    it('default grid is 10x8 (small preset)', () => {
      const wrapper = mount(App)
      const rows = wrapper.findAll('.grid .row')
      expect(rows.length).toBe(8)
      rows.forEach((row) => {
        expect(row.findAll('.cell').length).toBe(10)
      })
    })

    it('clicking large preset switches to 30x40', async () => {
      const wrapper = mount(App)
      const presetButtons = wrapper.findAll('.preset-btn')
      const largeBtn = presetButtons.find((b) => b.text().includes('30') && b.text().includes('40'))
      expect(largeBtn).toBeDefined()
      await largeBtn!.trigger('click')
      const rows = wrapper.findAll('.grid .row')
      expect(rows.length).toBe(40)
      rows.forEach((row) => {
        expect(row.findAll('.cell').length).toBe(30)
      })
    })

    it('clicking large preset marks it as active and small as inactive', async () => {
      const wrapper = mount(App)
      const presetButtons = wrapper.findAll('.preset-btn')
      const smallBtn = presetButtons.find((b) => b.text().includes('10') && b.text().includes('8'))
      const largeBtn = presetButtons.find((b) => b.text().includes('30') && b.text().includes('40'))
      await largeBtn!.trigger('click')
      expect(largeBtn!.classes()).toContain('active')
      expect(smallBtn!.classes()).not.toContain('active')
    })

    it('switching back to small preset restores 10x8', async () => {
      const wrapper = mount(App)
      const presetButtons = wrapper.findAll('.preset-btn')
      const smallBtn = presetButtons.find((b) => b.text().includes('10') && b.text().includes('8'))
      const largeBtn = presetButtons.find((b) => b.text().includes('30') && b.text().includes('40'))
      await largeBtn!.trigger('click')
      await smallBtn!.trigger('click')
      const rows = wrapper.findAll('.grid .row')
      expect(rows.length).toBe(8)
      rows.forEach((row) => {
        expect(row.findAll('.cell').length).toBe(10)
      })
    })
  })
})
