/**
 * Pure display helpers for the grid view.
 *
 * Extracted from App.vue so that GridView.vue (and future grid-related
 * components) can share the same logic without duplication. Each function
 * takes the GameState explicitly; there is no hidden dependency on a Vue
 * component instance.
 */

import type { Cell, GameState, Monster } from '../core/types'
import type { HeroEntity } from '../core/hero/types'
import { getNestCells } from '../core'

export type EntityType = 'lizardman' | 'gajigajimushi' | 'nijirigoke'

export const ENTITY_ICONS: Record<EntityType, string> = {
  lizardman: '蜥',
  gajigajimushi: '虫',
  nijirigoke: '苔',
}

/** Lower number = higher display priority (drawn on top when multiple entities share a cell). */
export const DISPLAY_PRIORITY: Record<EntityType, number> = {
  lizardman: 0,
  gajigajimushi: 1,
  nijirigoke: 2,
}

export function getMonstersAtCell(gameState: GameState, x: number, y: number): Monster[] {
  return gameState.monsters.filter((m) => m.position.x === x && m.position.y === y)
}

export function getHeroesAtCell(gameState: GameState, x: number, y: number): HeroEntity[] {
  return gameState.heroes.filter(
    (h) => h.position.x === x && h.position.y === y && h.state !== 'dead',
  )
}

export function getTopMonster(monsters: Monster[]): Monster | null {
  if (monsters.length === 0) return null
  return monsters.reduce((top, curr) =>
    DISPLAY_PRIORITY[curr.type] < DISPLAY_PRIORITY[top.type] ? curr : top,
  )
}

export function getOverlapCount(gameState: GameState, x: number, y: number): number {
  return getMonstersAtCell(gameState, x, y).length + getHeroesAtCell(gameState, x, y).length
}

export function isDemonLordCell(gameState: GameState, x: number, y: number): boolean {
  const pos = gameState.demonLordPosition
  return pos !== null && pos.x === x && pos.y === y
}

export function isEntranceCell(gameState: GameState, x: number, y: number): boolean {
  const pos = gameState.entrancePosition
  return pos.x === x && pos.y === y
}

export function getNutrientLevel(amount: number): 'low' | 'mid' | 'high' | null {
  if (amount <= 0) return null
  if (amount >= 17) return 'high'
  if (amount >= 10) return 'mid'
  return 'low'
}

export function computeNestCellSet(gameState: GameState): Set<string> {
  const set = new Set<string>()
  for (const m of gameState.monsters) {
    if (m.type === 'lizardman' && m.nestPosition && m.nestOrientation) {
      const cells = getNestCells(m.nestPosition, m.nestOrientation)
      for (const c of cells) {
        set.add(`${c.x},${c.y}`)
      }
    }
  }
  return set
}

export function getCellDisplay(
  cell: Cell,
  gameState: GameState,
  x: number,
  y: number,
): string {
  const heroes = getHeroesAtCell(gameState, x, y)
  if (heroes.length > 0) {
    return heroes[0].state === 'returning' ? '帰' : '勇'
  }

  const monsters = getMonstersAtCell(gameState, x, y)
  const topMonster = getTopMonster(monsters)
  if (topMonster) {
    if (topMonster.type === 'nijirigoke') {
      switch (topMonster.phase) {
        case 'bud':
          return '蕾'
        case 'flower':
          return '花'
        case 'withered':
          return '枯'
        default:
          return '苔'
      }
    }
    return ENTITY_ICONS[topMonster.type]
  }

  if (isDemonLordCell(gameState, x, y)) return '魔'
  if (isEntranceCell(gameState, x, y)) return '門'

  switch (cell.type) {
    case 'wall':
      return '壁'
    case 'soil':
      return '土'
    case 'empty':
      return '　'
  }
}

export function getCellClass(
  cell: Cell,
  gameState: GameState,
  nestCellSet: Set<string>,
  x: number,
  y: number,
): string {
  const heroes = getHeroesAtCell(gameState, x, y)
  if (heroes.length > 0) {
    return `cell hero-cell${heroes[0].state === 'returning' ? ' hero-returning' : ''}`
  }

  const monsters = getMonstersAtCell(gameState, x, y)
  const topMonster = getTopMonster(monsters)
  const isNest = nestCellSet.has(`${x},${y}`)

  if (topMonster) {
    if (topMonster.type === 'nijirigoke' && topMonster.phase !== 'mobile') {
      return `cell nijirigoke-${topMonster.phase}${isNest ? ' nest-cell' : ''}`
    }
    return `cell monster-${topMonster.type}${isNest ? ' nest-cell' : ''}`
  }

  if (isDemonLordCell(gameState, x, y)) return `cell demon-lord-cell`
  if (isEntranceCell(gameState, x, y)) return `cell entrance-cell`

  if (isNest) {
    return `cell cell-${cell.type} nest-cell`
  }

  return `cell cell-${cell.type}`
}
