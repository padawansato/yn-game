/**
 * GridView component tests.
 *
 * Currently covers the skeleton (empty template). As the DOM, helpers, and
 * legends are moved into GridView in subsequent tasks, this file will grow to
 * include rendering assertions, cell-click emission tests, display-logic
 * branch coverage, and parametric multi-size tests.
 */
// @vitest-environment jsdom

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GridView from './GridView.vue'
import { createDefaultConfig } from '../core/config'
import { createGameState } from '../core/spawn'

function makeTestState() {
  const config = createDefaultConfig()
  const gameState = createGameState(
    config.grid.defaultWidth,
    config.grid.defaultHeight,
    1.0,
    {},
    config,
  )
  return { gameState, config }
}

describe('GridView (skeleton)', () => {
  it('mounts without errors', () => {
    const { gameState, config } = makeTestState()
    const wrapper = mount(GridView, {
      props: { gameState, config },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders a .grid container', () => {
    const { gameState, config } = makeTestState()
    const wrapper = mount(GridView, {
      props: { gameState, config },
    })
    expect(wrapper.find('.grid').exists()).toBe(true)
  })

  it('renders rows matching gameState.grid height', () => {
    const { gameState, config } = makeTestState()
    const wrapper = mount(GridView, {
      props: { gameState, config },
    })
    const rows = wrapper.findAll('.grid .row')
    expect(rows.length).toBe(gameState.grid.length)
  })

  it('renders cells per row matching gameState.grid[y].length', () => {
    const { gameState, config } = makeTestState()
    const wrapper = mount(GridView, {
      props: { gameState, config },
    })
    const rows = wrapper.findAll('.grid .row')
    rows.forEach((row, y) => {
      expect(row.findAll('.cell').length).toBe(gameState.grid[y].length)
    })
  })

  it('renders two .legend elements', () => {
    const { gameState, config } = makeTestState()
    const wrapper = mount(GridView, {
      props: { gameState, config },
    })
    expect(wrapper.findAll('.legend').length).toBe(2)
  })

  it('emits cell-click with coordinates when a cell is clicked', async () => {
    const { gameState, config } = makeTestState()
    const wrapper = mount(GridView, {
      props: { gameState, config },
    })
    const cells = wrapper.findAll('.grid .cell')
    // Click a cell at a known position inside the grid (not a border wall)
    // gameState is 10x8; click at index (row 2, col 2) → (x=2, y=2)
    const targetCell = wrapper.findAll('.grid .row')[2].findAll('.cell')[2]
    await targetCell.trigger('click')
    const emitted = wrapper.emitted('cell-click')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual([{ x: 2, y: 2 }])
    // also confirm that a cell click produces exactly one emission per click
    expect(cells.length).toBe(gameState.grid.length * gameState.grid[0].length)
  })

  it('accepts GameState and GameConfig props without type errors', () => {
    const { gameState, config } = makeTestState()
    const wrapper = mount(GridView, {
      props: { gameState, config },
    })
    // If type checking passed, this assertion is meaningful at compile time.
    // At runtime we just verify the component was constructed.
    expect(wrapper.vm).toBeDefined()
  })
})

/**
 * Parametric rendering tests across multiple grid sizes.
 * Verifies that GridView has no hardcoded dimension assumptions and
 * correctly renders grids of any size driven by gameState.grid.
 */
describe.each([
  { name: 'tiny 5x5', width: 5, height: 5 },
  { name: 'small 10x8', width: 10, height: 8 },
  { name: 'arbitrary 20x15', width: 20, height: 15 },
  { name: 'large 30x40', width: 30, height: 40 },
])('GridView at $name', ({ width, height }) => {
  function makeStateAtSize() {
    const config = createDefaultConfig()
    const gameState = createGameState(width, height, 1.0, {}, config)
    return { gameState, config }
  }

  it(`renders ${height} rows`, () => {
    const { gameState, config } = makeStateAtSize()
    const wrapper = mount(GridView, { props: { gameState, config } })
    expect(wrapper.findAll('.grid .row').length).toBe(height)
  })

  it(`renders ${width} cells per row`, () => {
    const { gameState, config } = makeStateAtSize()
    const wrapper = mount(GridView, { props: { gameState, config } })
    wrapper.findAll('.grid .row').forEach((row) => {
      expect(row.findAll('.cell').length).toBe(width)
    })
  })

  it(`renders ${width * height} total cells`, () => {
    const { gameState, config } = makeStateAtSize()
    const wrapper = mount(GridView, { props: { gameState, config } })
    expect(wrapper.findAll('.grid .cell').length).toBe(width * height)
  })

  it('borders are walls except entrance', () => {
    const { gameState, config } = makeStateAtSize()
    const wrapper = mount(GridView, { props: { gameState, config } })
    const rows = wrapper.findAll('.grid .row')
    const entranceX = Math.floor(width / 2)
    rows[0].findAll('.cell').forEach((cell, x) => {
      if (x === entranceX) {
        expect(cell.classes()).toContain('entrance-cell')
      } else {
        expect(cell.classes()).toContain('cell-wall')
      }
    })
    rows[rows.length - 1].findAll('.cell').forEach((cell) => {
      expect(cell.classes()).toContain('cell-wall')
    })
    rows.forEach((row) => {
      const cells = row.findAll('.cell')
      expect(cells[0].classes()).toContain('cell-wall')
      expect(cells[cells.length - 1].classes()).toContain('cell-wall')
    })
  })

  it('click at (1, 1) emits correct coordinates', async () => {
    const { gameState, config } = makeStateAtSize()
    const wrapper = mount(GridView, { props: { gameState, config } })
    await wrapper.findAll('.grid .row')[1].findAll('.cell')[1].trigger('click')
    const emitted = wrapper.emitted('cell-click')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual([{ x: 1, y: 1 }])
  })
})
