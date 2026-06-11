import type {
  Bubble,
  BubbleColor,
  BubbleType,
  LevelConfig,
  ChainElimination,
  Point,
} from '../../shared/types.js'
import {
  BUBBLE_RADIUS,
  BUBBLE_DIAMETER,
  BUBBLE_VERTICAL_SPACING,
  MIN_ELIMINATION_COUNT,
} from '../../shared/types.js'

let bubbleIdCounter = 0

function generateBubbleId(): string {
  bubbleIdCounter++
  return `bubble_${Date.now()}_${bubbleIdCounter}`
}

class BubbleService {
  createBubble(
    row: number,
    col: number,
    color: BubbleColor,
    type: BubbleType = 'normal',
    lockHits: number = 0,
  ): Bubble {
    const position = this.getBubblePosition(row, col)
    return {
      id: generateBubbleId(),
      row,
      col,
      x: position.x,
      y: position.y,
      color,
      type,
      isEliminated: false,
      isFalling: false,
      lockHits,
    }
  }

  getBubblePosition(row: number, col: number): Point {
    const offset = row % 2 === 1 ? BUBBLE_RADIUS : 0
    return {
      x: col * BUBBLE_DIAMETER + BUBBLE_RADIUS + offset,
      y: row * BUBBLE_VERTICAL_SPACING + BUBBLE_RADIUS,
    }
  }

  buildBubblesFromLayout(levelConfig: LevelConfig): (Bubble | null)[][] {
    const { bubbleLayout, rows, cols, specialBubbles } = levelConfig
    const bubbles: (Bubble | null)[][] = []

    for (let row = 0; row < rows; row++) {
      bubbles[row] = []
      for (let col = 0; col < cols; col++) {
        const layoutColor = bubbleLayout[row]?.[col]
        if (layoutColor) {
          let type: BubbleType = 'normal'
          let lockHits = 0

          if (row < 2 && specialBubbles?.obstacle && Math.random() < 0.1) {
            type = 'obstacle'
          } else if (row < 3 && specialBubbles?.locked && Math.random() < 0.08) {
            type = 'locked'
            lockHits = 2
          } else if (row < 2 && specialBubbles?.bomb && Math.random() < 0.05) {
            type = 'bomb'
          }

          bubbles[row][col] = this.createBubble(
            row,
            col,
            layoutColor as BubbleColor,
            type,
            lockHits,
          )
        } else {
          bubbles[row][col] = null
        }
      }
    }

    return bubbles
  }

  getNeighbors(row: number, col: number): { row: number; col: number }[] {
    const isOddRow = row % 2 === 1
    if (isOddRow) {
      return [
        { row: row - 1, col: col },
        { row: row - 1, col: col + 1 },
        { row: row, col: col - 1 },
        { row: row, col: col + 1 },
        { row: row + 1, col: col },
        { row: row + 1, col: col + 1 },
      ]
    } else {
      return [
        { row: row - 1, col: col - 1 },
        { row: row - 1, col: col },
        { row: row, col: col - 1 },
        { row: row, col: col + 1 },
        { row: row + 1, col: col - 1 },
        { row: row + 1, col: col },
      ]
    }
  }

  findConnectedSameColor(
    bubbles: (Bubble | null)[][],
    startRow: number,
    startCol: number,
  ): Bubble[] {
    const startBubble = bubbles[startRow]?.[startCol]
    if (!startBubble || startBubble.type === 'obstacle') return []

    const targetColor = startBubble.color
    const visited = new Set<string>()
    const connected: Bubble[] = []
    const queue: { row: number; col: number }[] = [{ row: startRow, col: startCol }]

    while (queue.length > 0) {
      const { row, col } = queue.shift()!
      const key = `${row},${col}`
      if (visited.has(key)) continue
      visited.add(key)

      const bubble = bubbles[row]?.[col]
      if (!bubble) continue
      if (bubble.type === 'obstacle') continue
      if (bubble.color !== targetColor && bubble.type !== 'colorful') continue
      if (bubble.type === 'locked' && (bubble.lockHits || 0) > 0) continue

      connected.push(bubble)

      const neighbors = this.getNeighbors(row, col)
      for (const neighbor of neighbors) {
        const nKey = `${neighbor.row},${neighbor.col}`
        if (!visited.has(nKey)) {
          queue.push(neighbor)
        }
      }
    }

    return connected
  }

  findFloatingBubbles(bubbles: (Bubble | null)[][]): Bubble[] {
    const visited = new Set<string>()
    const floating: Bubble[] = []
    const rows = bubbles.length
    const cols = bubbles[0]?.length || 0

    const queue: { row: number; col: number }[] = []
    for (let col = 0; col < cols; col++) {
      if (bubbles[0]?.[col]) {
        queue.push({ row: 0, col })
      }
    }

    while (queue.length > 0) {
      const { row, col } = queue.shift()!
      const key = `${row},${col}`
      if (visited.has(key)) continue
      visited.add(key)

      const bubble = bubbles[row]?.[col]
      if (!bubble) continue

      const neighbors = this.getNeighbors(row, col)
      for (const neighbor of neighbors) {
        if (neighbor.row >= 0 && neighbor.row < rows && neighbor.col >= 0 && neighbor.col < cols) {
          const nKey = `${neighbor.row},${neighbor.col}`
          if (!visited.has(nKey) && bubbles[neighbor.row]?.[neighbor.col]) {
            queue.push(neighbor)
          }
        }
      }
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const bubble = bubbles[row]?.[col]
        if (bubble && !visited.has(`${row},${col}`) && bubble.type !== 'obstacle') {
          floating.push(bubble)
        }
      }
    }

    return floating
  }

  eliminateBubbles(
    bubbles: (Bubble | null)[][],
    startRow: number,
    startCol: number,
  ): { eliminated: Bubble[]; falling: Bubble[]; chainReactions: ChainElimination[] } {
    const eliminated: Bubble[] = []
    const falling: Bubble[] = []
    const chainReactions: ChainElimination[] = []

    const connected = this.findConnectedSameColor(bubbles, startRow, startCol)
    if (connected.length >= MIN_ELIMINATION_COUNT) {
      let chainLevel = 1
      let currentEliminated = [...connected]

      while (currentEliminated.length > 0) {
        const score = currentEliminated.length * 10 * chainLevel
        chainReactions.push({
          level: chainLevel,
          bubbles: [...currentEliminated],
          score,
        })

        for (const bubble of currentEliminated) {
          bubble.isEliminated = true
          bubbles[bubble.row][bubble.col] = null
          eliminated.push(bubble)
        }

        const floating = this.findFloatingBubbles(bubbles)
        for (const b of floating) {
          b.isFalling = true
          bubbles[b.row][b.col] = null
          falling.push(b)
          eliminated.push(b)
        }

        chainLevel++
        currentEliminated = []
      }
    }

    return { eliminated, falling, chainReactions }
  }

  placeBubble(
    bubbles: (Bubble | null)[][],
    targetRow: number,
    targetCol: number,
    bubble: Bubble,
  ): { row: number; col: number } {
    const rows = bubbles.length
    const cols = bubbles[0]?.length || 0

    let finalRow = targetRow
    let finalCol = targetCol

    if (finalRow < 0) finalRow = 0
    if (finalRow >= rows) finalRow = rows - 1
    if (finalCol < 0) finalCol = 0
    if (finalCol >= cols) finalCol = cols - 1

    if (bubbles[finalRow]?.[finalCol] !== null) {
      const neighbors = this.getNeighbors(finalRow, finalCol)
      for (const neighbor of neighbors) {
        if (
          neighbor.row >= 0 &&
          neighbor.row < rows &&
          neighbor.col >= 0 &&
          neighbor.col < cols &&
          bubbles[neighbor.row]?.[neighbor.col] === null
        ) {
          finalRow = neighbor.row
          finalCol = neighbor.col
          break
        }
      }
    }

    const position = this.getBubblePosition(finalRow, finalCol)
    bubble.row = finalRow
    bubble.col = finalCol
    bubble.x = position.x
    bubble.y = position.y

    if (bubbles[finalRow]) {
      bubbles[finalRow][finalCol] = bubble
    }

    return { row: finalRow, col: finalCol }
  }

  getRandomColor(availableColors: BubbleColor[], bubbles: (Bubble | null)[][]): BubbleColor {
    const existingColors = new Set<BubbleColor>()
    for (const row of bubbles) {
      for (const bubble of row) {
        if (bubble && bubble.type !== 'obstacle') {
          existingColors.add(bubble.color)
        }
      }
    }

    const usableColors = availableColors.filter((c) => existingColors.has(c))
    const colors = usableColors.length > 0 ? usableColors : availableColors
    return colors[Math.floor(Math.random() * colors.length)]
  }

  hitLockedBubble(bubble: Bubble): boolean {
    if (bubble.type === 'locked' && (bubble.lockHits || 0) > 0) {
      bubble.lockHits = (bubble.lockHits || 0) - 1
      if (bubble.lockHits <= 0) {
        bubble.type = 'normal'
        return true
      }
    }
    return false
  }

  getBombBlastRadius(
    bubbles: (Bubble | null)[][],
    centerRow: number,
    centerCol: number,
    radius: number = 1,
  ): Bubble[] {
    const inRange: Bubble[] = []
    const rows = bubbles.length
    const cols = bubbles[0]?.length || 0

    for (let row = Math.max(0, centerRow - radius); row <= Math.min(rows - 1, centerRow + radius); row++) {
      for (let col = Math.max(0, centerCol - radius); col <= Math.min(cols - 1, centerCol + radius); col++) {
        const bubble = bubbles[row]?.[col]
        if (bubble && bubble.type !== 'obstacle') {
          inRange.push(bubble)
        }
      }
    }

    return inRange
  }
}

export default new BubbleService()
