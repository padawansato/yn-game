export type Command =
  | { type: 'dig'; x: number; y: number }
  | { type: 'tick'; count: number }
  | { type: 'run' }
  | { type: 'stop' }
  | { type: 'status' }
  | { type: 'grid' }
  | { type: 'monsters'; filterType?: string }
  | { type: 'monster'; id: string }
  | { type: 'scenario'; name: string }
  | { type: 'scenario-list' }
  | { type: 'seed'; value: number }
  | { type: 'reset' }
  | { type: 'help' }
  | { type: 'quit' }
  | { type: 'unknown'; input: string }

export function parseCommand(input: string): Command {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { type: 'unknown', input: '' }
  }

  const parts = trimmed.split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1)

  switch (cmd) {
    case 'dig': {
      let x: number
      let y: number
      if (args.length === 1 && args[0].includes(',')) {
        const [xStr, yStr] = args[0].split(',')
        x = Number(xStr)
        y = Number(yStr)
      } else if (args.length === 2) {
        x = Number(args[0])
        y = Number(args[1])
      } else {
        return { type: 'unknown', input: trimmed }
      }
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return { type: 'unknown', input: trimmed }
      }
      return { type: 'dig', x, y }
    }

    case 'tick': {
      if (args.length === 0) {
        return { type: 'tick', count: 1 }
      }
      const count = Number(args[0])
      if (!Number.isFinite(count) || count < 1) {
        return { type: 'unknown', input: trimmed }
      }
      return { type: 'tick', count }
    }

    case 'run':
      return { type: 'run' }

    case 'stop':
      return { type: 'stop' }

    case 'status':
      return { type: 'status' }

    case 'grid':
      return { type: 'grid' }

    case 'monsters': {
      if (args.length === 0) {
        return { type: 'monsters' }
      }
      return { type: 'monsters', filterType: args[0].toLowerCase() }
    }

    case 'monster': {
      if (args.length === 0) {
        return { type: 'unknown', input: trimmed }
      }
      return { type: 'monster', id: args[0] }
    }

    case 'scenario': {
      if (args.length === 0) {
        return { type: 'unknown', input: trimmed }
      }
      if (args[0].toLowerCase() === 'list') {
        return { type: 'scenario-list' }
      }
      return { type: 'scenario', name: args[0] }
    }

    case 'seed': {
      if (args.length === 0) {
        return { type: 'unknown', input: trimmed }
      }
      const value = Number(args[0])
      if (!Number.isFinite(value)) {
        return { type: 'unknown', input: trimmed }
      }
      return { type: 'seed', value }
    }

    case 'reset':
      return { type: 'reset' }

    case 'help':
      return { type: 'help' }

    case 'quit':
    case 'exit':
      return { type: 'quit' }

    default:
      return { type: 'unknown', input: trimmed }
  }
}

export function getHelpText(): string {
  return `Available commands:
  dig <x>,<y>          Dig at coordinates (e.g. dig 5,3 or dig 5 3)
  tick [count]         Advance simulation by count ticks (default: 1)
  run                  Start continuous simulation
  stop                 Stop continuous simulation
  status               Show game status
  grid                 Display the grid
  monsters [type]      List monsters, optionally filtered by type
  monster <id>         Show details for a specific monster
  scenario list        List available scenarios
  scenario <name>      Load a scenario
  seed <value>         Set random seed
  reset                Reset the game
  help                 Show this help text
  quit / exit          Exit debug mode`
}
