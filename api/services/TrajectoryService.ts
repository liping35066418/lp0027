import type {
  Bubble,
  CalculateTrajectoryResponse,
  Point,
} from '../../shared/types.js'
import {
  BUBBLE_RADIUS,
  BUBBLE_DIAMETER,
  BUBBLE_VERTICAL_SPACING,
} from '../../shared/types.js'

interface TrajectoryConfig {
  boardWidth: number
  boardHeight: number
  shooterY: number
  maxBounces: number
  stepSize: number
}

const DEFAULT_CONFIG: TrajectoryConfig = {
  boardWidth: 8 * BUBBLE_DIAMETER,
  boardHeight: 12 * BUBBLE_VERTICAL_SPACING,
  shooterY: 12 * BUBBLE_VERTICAL_SPACING - BUBBLE_RADIUS,
  maxBounces: 2,
  stepSize: 4,
}

class TrajectoryService {
  private config: TrajectoryConfig = DEFAULT_CONFIG

  calculateTrajectory(
    angle: number,
    power: number,
    bubbles: (Bubble | null)[][],
  ): CalculateTrajectoryResponse {
    const trajectory: Point[] = []
    let bounceCount = 0
    let willBounce = false
    let collisionPoint: Point | undefined
    let targetBubble: Bubble | undefined
    let landingPosition: { row: number; col: number } | undefined

    const startX = this.config.boardWidth / 2
    const startY = this.config.shooterY

    const radians = (angle * Math.PI) / 180
    const dx = Math.sin(radians) * power * this.config.stepSize
    const dy = -Math.cos(radians) * power * this.config.stepSize

    let currentX = startX
    let currentY = startY
    let currentDx = dx
    let currentDy = dy
    let steps = 0
    const maxSteps = 500

    trajectory.push({ x: currentX, y: currentY })

    while (steps < maxSteps) {
      steps++
      currentX += currentDx
      currentY += currentDy

      if (currentX - BUBBLE_RADIUS < 0) {
        currentX = BUBBLE_RADIUS
        currentDx = Math.abs(currentDx)
        bounceCount++
        willBounce = true
        if (bounceCount > this.config.maxBounces) break
      }

      if (currentX + BUBBLE_RADIUS > this.config.boardWidth) {
        currentX = this.config.boardWidth - BUBBLE_RADIUS
        currentDx = -Math.abs(currentDx)
        bounceCount++
        willBounce = true
        if (bounceCount > this.config.maxBounces) break
      }

      if (currentY - BUBBLE_RADIUS <= 0) {
        currentY = BUBBLE_RADIUS
        collisionPoint = { x: currentX, y: currentY }
        trajectory.push({ x: currentX, y: currentY })
        landingPosition = this.findLandingPosition(currentX, currentY, bubbles)
        break
      }

      const collision = this.checkBubbleCollision(currentX, currentY, bubbles)
      if (collision) {
        collisionPoint = { x: currentX, y: currentY }
        targetBubble = collision
        trajectory.push({ x: currentX, y: currentY })
        landingPosition = this.findLandingPositionNearBubble(currentX, currentY, collision, bubbles)
        break
      }

      if (steps % 2 === 0) {
        trajectory.push({ x: currentX, y: currentY })
      }
    }

    return {
      trajectory,
      collisionPoint,
      targetBubble,
      willBounce,
      bounceCount,
      landingPosition,
    }
  }

  private checkBubbleCollision(
    x: number,
    y: number,
    bubbles: (Bubble | null)[][],
  ): Bubble | null {
    for (const row of bubbles) {
      for (const bubble of row) {
        if (bubble) {
          const dx = x - bubble.x
          const dy = y - bubble.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < BUBBLE_DIAMETER - 4) {
            return bubble
          }
        }
      }
    }
    return null
  }

  private findLandingPosition(
    x: number,
    y: number,
    bubbles: (Bubble | null)[][],
  ): { row: number; col: number } {
    const rows = bubbles.length
    const cols = bubbles[0]?.length || 8

    let bestRow = 0
    let bestCol = Math.round((x - BUBBLE_RADIUS) / BUBBLE_DIAMETER)

    for (let row = 0; row < rows; row++) {
      const offset = row % 2 === 1 ? BUBBLE_RADIUS : 0
      const expectedY = row * BUBBLE_VERTICAL_SPACING + BUBBLE_RADIUS
      if (expectedY > y + BUBBLE_VERTICAL_SPACING) break

      const col = Math.round((x - BUBBLE_RADIUS - offset) / BUBBLE_DIAMETER)
      const clampedCol = Math.max(0, Math.min(cols - 1, col))

      if (!bubbles[row]?.[clampedCol]) {
        bestRow = row
        bestCol = clampedCol
      }
    }

    return { row: bestRow, col: bestCol }
  }

  private findLandingPositionNearBubble(
    x: number,
    y: number,
    targetBubble: Bubble,
    bubbles: (Bubble | null)[][],
  ): { row: number; col: number } {
    const rows = bubbles.length
    const cols = bubbles[0]?.length || 8

    const neighbors = this.getNeighbors(targetBubble.row, targetBubble.col)
    let bestPosition = { row: targetBubble.row, col: targetBubble.col }
    let minDistance = Infinity

    for (const neighbor of neighbors) {
      if (
        neighbor.row >= 0 &&
        neighbor.row < rows &&
        neighbor.col >= 0 &&
        neighbor.col < cols &&
        !bubbles[neighbor.row]?.[neighbor.col]
      ) {
        const offset = neighbor.row % 2 === 1 ? BUBBLE_RADIUS : 0
        const posX = neighbor.col * BUBBLE_DIAMETER + BUBBLE_RADIUS + offset
        const posY = neighbor.row * BUBBLE_VERTICAL_SPACING + BUBBLE_RADIUS
        const dx = x - posX
        const dy = y - posY
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < minDistance) {
          minDistance = distance
          bestPosition = { row: neighbor.row, col: neighbor.col }
        }
      }
    }

    return bestPosition
  }

  private getNeighbors(row: number, col: number): { row: number; col: number }[] {
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

  setBoardDimensions(width: number, height: number): void {
    this.config.boardWidth = width
    this.config.boardHeight = height
    this.config.shooterY = height - BUBBLE_RADIUS
  }
}

export default new TrajectoryService()
