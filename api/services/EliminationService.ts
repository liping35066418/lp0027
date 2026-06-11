import type { Bubble, ChainElimination, BubbleColor } from '../../shared/types.js';
import { MIN_ELIMINATION_COUNT } from '../../shared/types.js';

export interface EliminationResult {
  eliminatedBubbles: Bubble[];
  chainReaction: ChainElimination[];
  fallingBubbles: Bubble[];
}

export class EliminationService {
  static findConnectedBubbles(
    bubbles: (Bubble | null)[][],
    startRow: number,
    startCol: number,
    color: BubbleColor
  ): Bubble[] {
    const connected: Bubble[] = [];
    const visited = new Set<string>();
    const queue: { row: number; col: number }[] = [{ row: startRow, col: startCol }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const bubble = bubbles[current.row]?.[current.col];
      if (!bubble || bubble.isEliminated) continue;
      if (bubble.type === 'obstacle' || bubble.type === 'locked') continue;
      if (bubble.color !== color && bubble.type !== 'colorful') continue;

      connected.push(bubble);

      const neighbors = this.getNeighborPositions(current.row, current.col);
      for (const neighbor of neighbors) {
        if (neighbor.row < 0 || neighbor.row >= bubbles.length) continue;
        if (neighbor.col < 0 || neighbor.col >= (bubbles[neighbor.row]?.length || 0)) continue;
        const neighborKey = `${neighbor.row},${neighbor.col}`;
        if (!visited.has(neighborKey)) {
          queue.push(neighbor);
        }
      }
    }

    return connected;
  }

  static checkAndEliminate(
    bubbles: (Bubble | null)[][],
    row: number,
    col: number,
    newBubble: Bubble
  ): Bubble[] {
    const connected = this.findConnectedBubbles(bubbles, row, col, newBubble.color);

    if (connected.length >= MIN_ELIMINATION_COUNT) {
      connected.forEach((b) => {
        b.isEliminated = true;
        if (bubbles[b.row]?.[b.col]) {
          bubbles[b.row][b.col] = null;
        }
      });
      return connected;
    }

    return [];
  }

  static findFallingBubbles(bubbles: (Bubble | null)[][]): Bubble[] {
    const visited = new Set<string>();
    const queue: { row: number; col: number }[] = [];

    if (bubbles.length === 0) return [];

    for (let col = 0; col < (bubbles[0]?.length || 0); col++) {
      if (bubbles[0]?.[col] && !bubbles[0][col]!.isEliminated) {
        queue.push({ row: 0, col });
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const neighbors = this.getNeighborPositions(current.row, current.col);
      for (const neighbor of neighbors) {
        if (neighbor.row < 0 || neighbor.row >= bubbles.length) continue;
        if (neighbor.col < 0 || neighbor.col >= (bubbles[neighbor.row]?.length || 0)) continue;

        const bubble = bubbles[neighbor.row]?.[neighbor.col];
        if (!bubble || bubble.isEliminated) continue;

        const neighborKey = `${neighbor.row},${neighbor.col}`;
        if (!visited.has(neighborKey)) {
          queue.push(neighbor);
        }
      }
    }

    const falling: Bubble[] = [];
    for (let row = 0; row < bubbles.length; row++) {
      for (let col = 0; col < (bubbles[row]?.length || 0); col++) {
        const bubble = bubbles[row]?.[col];
        if (!bubble || bubble.isEliminated) continue;
        if (bubble.type === 'obstacle') continue;

        const key = `${row},${col}`;
        if (!visited.has(key)) {
          bubble.isFalling = true;
          falling.push(bubble);
          bubbles[row][col] = null;
        }
      }
    }

    return falling;
  }

  static processChainReaction(
    bubbles: (Bubble | null)[][],
    eliminatedBubbles: Bubble[]
  ): ChainElimination[] {
    const chainReaction: ChainElimination[] = [];
    let currentEliminated = [...eliminatedBubbles];
    let chainLevel = 1;

    while (currentEliminated.length > 0) {
      const bombTriggered: Bubble[] = [];

      for (const bubble of currentEliminated) {
        if (bubble.type === 'bomb') {
          const nearbyBubbles = this.getBubblesInRange(bubbles, bubble.row, bubble.col, 2);
          for (const nearby of nearbyBubbles) {
            if (!nearby.isEliminated && nearby.type !== 'obstacle') {
              nearby.isEliminated = true;
              if (bubbles[nearby.row]?.[nearby.col]) {
                bubbles[nearby.row][nearby.col] = null;
              }
              bombTriggered.push(nearby);
            }
          }
        }
      }

      if (bombTriggered.length > 0) {
        chainReaction.push({
          level: chainLevel,
          bubbles: bombTriggered,
          score: 0,
        });
        chainLevel++;
        currentEliminated = bombTriggered;
      } else {
        break;
      }
    }

    return chainReaction;
  }

  private static getNeighborPositions(row: number, col: number): { row: number; col: number }[] {
    const isEvenRow = row % 2 === 0;
    const neighbors: { row: number; col: number }[] = [];

    neighbors.push({ row: row - 1, col: isEvenRow ? col - 1 : col });
    neighbors.push({ row: row - 1, col: isEvenRow ? col : col + 1 });
    neighbors.push({ row, col: col - 1 });
    neighbors.push({ row, col: col + 1 });
    neighbors.push({ row: row + 1, col: isEvenRow ? col - 1 : col });
    neighbors.push({ row: row + 1, col: isEvenRow ? col : col + 1 });

    return neighbors;
  }

  private static getBubblesInRange(
    bubbles: (Bubble | null)[][],
    centerRow: number,
    centerCol: number,
    range: number
  ): Bubble[] {
    const result: Bubble[] = [];

    for (let row = Math.max(0, centerRow - range); row <= Math.min(bubbles.length - 1, centerRow + range); row++) {
      for (let col = 0; col < (bubbles[row]?.length || 0); col++) {
        const bubble = bubbles[row]?.[col];
        if (!bubble || bubble.isEliminated) continue;

        const distance = this.getGridDistance(centerRow, centerCol, row, col);
        if (distance <= range) {
          result.push(bubble);
        }
      }
    }

    return result;
  }

  private static getGridDistance(
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): number {
    const x1 = c1 + (r1 & 1 ? 0.5 : 0);
    const y1 = r1 * Math.sqrt(3) / 2;
    const x2 = c2 + (r2 & 1 ? 0.5 : 0);
    const y2 = r2 * Math.sqrt(3) / 2;

    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
