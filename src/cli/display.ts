import type {
  Cell,
  GameEvent,
  GameState,
  Monster,
  MonsterType,
} from '../core/types'
import { getTotalNutrients } from '../core/nutrient'

// ANSI color codes
const COLOR_GREEN = '\x1b[32m'
const COLOR_BLUE = '\x1b[34m'
const COLOR_RED = '\x1b[31m'
const COLOR_RESET = '\x1b[0m'

const MONSTER_COLOR: Record<MonsterType, string> = {
  nijirigoke: COLOR_GREEN,
  gajigajimushi: COLOR_BLUE,
  lizardman: COLOR_RED,
}

// Priority for overlap coloring: lizardman > gajigajimushi > nijirigoke
const TYPE_PRIORITY: Record<MonsterType, number> = {
  nijirigoke: 0,
  gajigajimushi: 1,
  lizardman: 2,
}

function getMonsterSymbol(monster: Monster): string {
  switch (monster.type) {
    case 'nijirigoke':
      switch (monster.phase) {
        case 'mobile':
          return 'Nj'
        case 'bud':
          return 'Nb'
        case 'flower':
          return 'Nf'
        case 'withered':
          return 'Nw'
        default:
          return 'N?'
      }
    case 'gajigajimushi':
      switch (monster.phase) {
        case 'larva':
          return 'Gj'
        case 'pupa':
          return 'Gp'
        case 'adult':
          return 'Ga'
        default:
          return 'G?'
      }
    case 'lizardman':
      switch (monster.phase) {
        case 'normal':
        case 'nesting':
          return 'Lz'
        case 'laying':
          return 'Ll'
        case 'egg':
          return 'Eg'
        default:
          return 'L?'
      }
    default:
      return '??'
  }
}

/**
 * Render the game grid as an ASCII string.
 * Each cell is 2 half-width characters.
 */
export function renderGrid(grid: Cell[][], monsters: Monster[]): string {
  // Build a map of position -> monsters at that position
  const monsterMap = new Map<string, Monster[]>()
  for (const m of monsters) {
    const key = `${m.position.x},${m.position.y}`
    const list = monsterMap.get(key)
    if (list) {
      list.push(m)
    } else {
      monsterMap.set(key, [m])
    }
  }

  const lines: string[] = []

  for (let y = 0; y < grid.length; y++) {
    let line = ''
    for (let x = 0; x < grid[y].length; x++) {
      const key = `${x},${y}`
      const monstersAtCell = monsterMap.get(key)

      if (monstersAtCell && monstersAtCell.length > 0) {
        if (monstersAtCell.length === 1) {
          const m = monstersAtCell[0]
          const color = MONSTER_COLOR[m.type]
          const symbol = getMonsterSymbol(m)
          line += `${color}${symbol}${COLOR_RESET}`
        } else {
          // Multiple monsters: show count with highest priority color
          const highestPriority = monstersAtCell.reduce((best, m) =>
            TYPE_PRIORITY[m.type] > TYPE_PRIORITY[best.type] ? m : best
          )
          const color = MONSTER_COLOR[highestPriority.type]
          const count = monstersAtCell.length
          line += `${color}${count} ${COLOR_RESET}`
        }
      } else {
        const cell = grid[y][x]
        switch (cell.type) {
          case 'wall':
            line += '##'
            break
          case 'soil':
            line += '..'
            break
          case 'empty':
            line += '  '
            break
        }
      }
    }
    lines.push(line)
  }

  return lines.join('\n')
}

/**
 * Render a table of monsters.
 * Columns: ID, TYPE, PHASE, POS, LIFE, NUTRIENT, NEST
 */
export function renderMonsterList(monsters: Monster[], filterType?: MonsterType): string {
  const filtered = filterType ? monsters.filter((m) => m.type === filterType) : monsters

  if (filtered.length === 0) {
    return 'No monsters.'
  }

  const header = 'ID         TYPE            PHASE     POS       LIFE       NUTRIENT  NEST'
  const separator = '-'.repeat(header.length)
  const lines: string[] = [header, separator]

  for (const m of filtered) {
    const id = m.id.padEnd(10)
    const type = m.type.padEnd(15)
    const phase = (m.phase as string).padEnd(9)
    const pos = `(${m.position.x},${m.position.y})`.padEnd(9)
    const life = `${m.life}/${m.maxLife}`.padEnd(10)
    const nutrient = String(m.carryingNutrient).padEnd(9)
    const nest = m.nestPosition ? `(${m.nestPosition.x},${m.nestPosition.y})` : '-'

    lines.push(`${id} ${type} ${phase} ${pos} ${life} ${nutrient} ${nest}`)
  }

  return lines.join('\n')
}

/**
 * Render full details for a single monster.
 */
export function renderMonsterDetail(monster: Monster): string {
  const lines: string[] = [
    `=== Monster Detail ===`,
    `ID:              ${monster.id}`,
    `Type:            ${monster.type}`,
    `Phase:           ${monster.phase}`,
    `Phase Ticks:     ${monster.phaseTickCounter}`,
    `Position:        (${monster.position.x}, ${monster.position.y})`,
    `Direction:       ${monster.direction}`,
    `Pattern:         ${monster.pattern}`,
    `Life:            ${monster.life} / ${monster.maxLife}`,
    `Attack:          ${monster.attack}`,
    `Nutrient:        ${monster.carryingNutrient}`,
    `Predation:       ${monster.predationTargets.length > 0 ? monster.predationTargets.join(', ') : 'none'}`,
    `Nest Position:   ${monster.nestPosition ? `(${monster.nestPosition.x}, ${monster.nestPosition.y})` : '-'}`,
    `Nest Orientation:${monster.nestOrientation ? ` ${monster.nestOrientation}` : ' -'}`,
  ]

  return lines.join('\n')
}

// Event types considered important for display
const IMPORTANT_EVENT_TYPES = new Set([
  'PHASE_TRANSITION',
  'MONSTER_DIED',
  'EGG_LAID',
  'EGG_HATCHED',
  'MONSTER_REPRODUCED',
  'MONSTER_SPAWNED',
  'MOYOMOYO_ATTACK',
])

/**
 * Format game events to display strings.
 * Only shows important events.
 */
export function renderEvents(events: GameEvent[]): string[] {
  const lines: string[] = []

  for (const event of events) {
    if (!IMPORTANT_EVENT_TYPES.has(event.type)) {
      continue
    }

    switch (event.type) {
      case 'PHASE_TRANSITION':
        lines.push(
          `>> PHASE: ${event.monsterId} ${event.oldPhase} -> ${event.newPhase}`
        )
        break
      case 'MONSTER_DIED':
        lines.push(`>> DIED: ${event.monster.id} (${event.cause})`)
        break
      case 'EGG_LAID':
        lines.push(
          `>> EGG LAID: parent=${event.parentId} pos(${event.position.x},${event.position.y})`
        )
        break
      case 'EGG_HATCHED':
        lines.push(
          `>> EGG HATCHED: ${event.offspringId} pos(${event.position.x},${event.position.y})`
        )
        break
      case 'MONSTER_REPRODUCED':
        lines.push(
          `>> REPRODUCED: parent=${event.parentId} -> ${event.offspringIds.length} offspring`
        )
        break
      case 'MONSTER_SPAWNED':
        lines.push(`>> SPAWNED: ${event.monster.id} ${event.monster.type}`)
        break
      case 'MOYOMOYO_ATTACK':
        lines.push(`>> MOYOMOYO: ${event.attackerId} hit ${event.targetId} (dmg=${event.damage})`)
        break
    }
  }

  return lines
}

/**
 * One-line status summary.
 */
export function renderStatus(state: GameState): string {
  const nutrients = getTotalNutrients(state)
  const monsterCount = state.monsters.length
  return `T:${state.gameTime} | Nutrients:${nutrients} | DigPower:${state.digPower} | Monsters:${monsterCount}`
}
