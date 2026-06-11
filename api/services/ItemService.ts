import type { Bubble, Item, ItemType, BubbleColor, ChainElimination } from '../../shared/types.js';
import bubbleService from './BubbleService.js';

export interface ItemUseFullResult {
  eliminatedBubbles: Bubble[];
  fallingBubbles: Bubble[];
  scoreGained: number;
  chainReactions: ChainElimination[];
  remainingItems: Item[];
}

class ItemService {
  cloneItems(items: Item[]): Item[] {
    return items.map(item => ({
      ...item,
      effect: { ...item.effect }
    }));
  }

  validateItemRequest(
    availableItems: Item[],
    itemType: ItemType,
  ): { valid: boolean; item?: Item } {
    const item = availableItems.find(i => i.type === itemType);
    if (!item) return { valid: false };
    if (item.count <= 0) return { valid: false };
    return { valid: true, item };
  }

  useItem(
    availableItems: Item[],
    itemType: ItemType,
    bubbles: (Bubble | null)[][],
    targetBubbleId?: string,
    targetColor?: BubbleColor,
  ): ItemUseFullResult {
    const items = this.cloneItems(availableItems);
    const itemIndex = items.findIndex(i => i.type === itemType);
    if (itemIndex === -1) {
      return {
        eliminatedBubbles: [],
        fallingBubbles: [],
        scoreGained: 0,
        chainReactions: [],
        remainingItems: items,
      };
    }

    const item = items[itemIndex];
    let eliminatedBubbles: Bubble[] = [];
    let fallingBubbles: Bubble[] = [];
    let scoreGained = 0;
    let chainReactions: ChainElimination[] = [];

    switch (itemType) {
      case 'bomb':
        const bombResult = this.useBombItem(bubbles, targetBubbleId, item.effect.range || 1);
        eliminatedBubbles = bombResult.eliminatedBubbles;
        fallingBubbles = bombResult.fallingBubbles;
        scoreGained = eliminatedBubbles.length * 15 + fallingBubbles.length * 20;
        break;
      case 'range':
        const rangeResult = this.useRangeItem(bubbles, targetColor);
        eliminatedBubbles = rangeResult.eliminatedBubbles;
        fallingBubbles = rangeResult.fallingBubbles;
        scoreGained = eliminatedBubbles.length * 10 + fallingBubbles.length * 20;
        break;
      case 'color_change':
        const colorResult = this.useColorChangeItem(bubbles, targetBubbleId, targetColor);
        eliminatedBubbles = colorResult.eliminatedBubbles;
        fallingBubbles = colorResult.fallingBubbles;
        scoreGained = eliminatedBubbles.length * 10 + fallingBubbles.length * 20;
        break;
    }

    items[itemIndex] = { ...item, count: item.count - 1 };
    const remainingItems = items.filter(i => i.count > 0);

    return {
      eliminatedBubbles,
      fallingBubbles,
      scoreGained,
      chainReactions,
      remainingItems,
    };
  }

  private useBombItem(
    bubbles: (Bubble | null)[][],
    targetBubbleId: string | undefined,
    range: number = 1,
  ): { eliminatedBubbles: Bubble[]; fallingBubbles: Bubble[] } {
    const eliminatedBubbles: Bubble[] = [];
    const targetBubble = this.findBubbleById(bubbles, targetBubbleId);
    let centerRow = 0;
    let centerCol = 0;

    if (targetBubble) {
      centerRow = targetBubble.row;
      centerCol = targetBubble.col;
    } else {
      for (let r = bubbles.length - 1; r >= 0; r--) {
        for (let c = 0; c < (bubbles[r]?.length || 0); c++) {
          if (bubbles[r]?.[c]) {
            centerRow = r;
            centerCol = c;
            break;
          }
        }
      }
    }

    const inRange = bubbleService.getBombBlastRadius(bubbles, centerRow, centerCol, range);

    for (const b of inRange) {
      if (b.type !== 'obstacle' && !b.isEliminated) {
        b.isEliminated = true;
        if (bubbles[b.row]?.[b.col]) {
          bubbles[b.row][b.col] = null;
        }
        eliminatedBubbles.push(b);
      }
    }

    const falling = bubbleService.findFloatingBubbles(bubbles);
    for (const fb of falling) {
      fb.isFalling = true;
      if (bubbles[fb.row]?.[fb.col]) {
        bubbles[fb.row][fb.col] = null;
      }
      eliminatedBubbles.push(fb);
    }

    return { eliminatedBubbles, fallingBubbles: falling };
  }

  private useRangeItem(
    bubbles: (Bubble | null)[][],
    targetColor: BubbleColor | undefined,
  ): { eliminatedBubbles: Bubble[]; fallingBubbles: Bubble[] } {
    const eliminatedBubbles: Bubble[] = [];

    const color = targetColor || this.findMostCommonColor(bubbles);

    for (let row = 0; row < bubbles.length; row++) {
      for (let col = 0; col < (bubbles[row]?.length || 0); col++) {
        const bubble = bubbles[row]?.[col];
        if (!bubble || bubble.isEliminated) continue;
        if (bubble.type === 'obstacle' || bubble.type === 'locked') continue;

        if (bubble.color === color || bubble.type === 'colorful') {
          bubble.isEliminated = true;
          if (bubbles[row]?.[col]) {
            bubbles[row][col] = null;
          }
          eliminatedBubbles.push(bubble);
        }
      }
    }

    const falling = bubbleService.findFloatingBubbles(bubbles);
    for (const fb of falling) {
      fb.isFalling = true;
      if (bubbles[fb.row]?.[fb.col]) {
        bubbles[fb.row][fb.col] = null;
      }
      eliminatedBubbles.push(fb);
    }

    return { eliminatedBubbles, fallingBubbles: falling };
  }

  private useColorChangeItem(
    bubbles: (Bubble | null)[][],
    targetBubbleId: string | undefined,
    targetColor: BubbleColor | undefined,
  ): { eliminatedBubbles: Bubble[]; fallingBubbles: Bubble[] } {
    const targetBubble = this.findBubbleById(bubbles, targetBubbleId);
    if (!targetBubble || !targetColor) {
      return { eliminatedBubbles: [], fallingBubbles: [] };
    }

    if (targetBubble.type === 'obstacle' || targetBubble.type === 'locked') {
      return { eliminatedBubbles: [], fallingBubbles: [] };
    }

    targetBubble.color = targetColor;
    if (targetBubble.type !== 'bomb') {
      targetBubble.type = 'normal';
    }

    const elimination = bubbleService.eliminateBubbles(
      bubbles,
      targetBubble.row,
      targetBubble.col,
    );

    return {
      eliminatedBubbles: elimination.eliminated,
      fallingBubbles: elimination.falling,
    };
  }

  private findBubbleById(
    bubbles: (Bubble | null)[][],
    bubbleId: string | undefined,
  ): Bubble | null {
    if (!bubbleId) return null;
    for (let row = 0; row < bubbles.length; row++) {
      for (let col = 0; col < (bubbles[row]?.length || 0); col++) {
        const bubble = bubbles[row]?.[col];
        if (bubble && bubble.id === bubbleId) {
          return bubble;
        }
      }
    }
    return null;
  }

  private findMostCommonColor(bubbles: (Bubble | null)[][]): BubbleColor {
    const colorCounts: Record<string, number> = {};
    for (const row of bubbles) {
      for (const bubble of row) {
        if (bubble && bubble.type !== 'obstacle') {
          colorCounts[bubble.color] = (colorCounts[bubble.color] || 0) + 1;
        }
      }
    }
    let maxColor: BubbleColor = 'red';
    let maxCount = 0;
    for (const [color, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxColor = color as BubbleColor;
        maxCount = count;
      }
    }
    return maxColor;
  }
}

export default new ItemService();
