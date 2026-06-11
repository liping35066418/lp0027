import type { LevelConfig, BubbleColor, HighScore, Item } from '../../shared/types.js'
import { BUBBLE_COLORS } from '../../shared/types.js'

const levels: LevelConfig[] = [
  {
    id: 1,
    name: '初识泡泡',
    type: 'normal',
    rows: 5,
    cols: 8,
    bubbleLayout: [
      ['red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green'],
      ['blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green', 'red'],
      ['yellow', 'green', 'red', 'blue', 'yellow', 'green', 'red', 'blue'],
      ['green', 'red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow'],
      ['red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green'],
    ],
    maxShots: 30,
    targetScore: 500,
    specialBubbles: {},
    availableColors: ['red', 'blue', 'yellow', 'green'],
    items: [
      {
        id: 'bomb-1',
        type: 'bomb',
        name: '炸弹泡泡',
        count: 2,
        effect: { range: 1 },
      },
    ],
  },
  {
    id: 2,
    name: '色彩挑战',
    type: 'normal',
    rows: 6,
    cols: 8,
    bubbleLayout: [
      ['purple', 'orange', 'red', 'blue', 'purple', 'orange', 'red', 'blue'],
      ['red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green'],
      ['blue', 'yellow', 'green', 'purple', 'blue', 'yellow', 'green', 'purple'],
      ['yellow', 'green', 'purple', 'orange', 'yellow', 'green', 'purple', 'orange'],
      ['green', 'purple', 'orange', 'red', 'green', 'purple', 'orange', 'red'],
      ['purple', 'orange', 'red', 'blue', 'purple', 'orange', 'red', 'blue'],
    ],
    maxShots: 35,
    targetScore: 800,
    specialBubbles: {
      obstacle: 2,
    },
    availableColors: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
    items: [
      {
        id: 'bomb-2',
        type: 'bomb',
        name: '炸弹泡泡',
        count: 2,
        effect: { range: 1 },
      },
      {
        id: 'color-2',
        type: 'color_change',
        name: '换色器',
        count: 1,
        effect: { range: 0 },
      },
    ],
  },
  {
    id: 3,
    name: '限时挑战',
    type: 'timed',
    rows: 7,
    cols: 8,
    bubbleLayout: [
      ['red', 'blue', 'yellow', 'green', 'purple', 'orange', 'red', 'blue'],
      ['blue', 'yellow', 'green', 'purple', 'orange', 'red', 'blue', 'yellow'],
      ['yellow', 'green', 'purple', 'orange', 'red', 'blue', 'yellow', 'green'],
      ['green', 'purple', 'orange', 'red', 'blue', 'yellow', 'green', 'purple'],
      ['purple', 'orange', 'red', 'blue', 'yellow', 'green', 'purple', 'orange'],
      ['orange', 'red', 'blue', 'yellow', 'green', 'purple', 'orange', 'red'],
      ['red', 'blue', 'yellow', 'green', 'purple', 'orange', 'red', 'blue'],
    ],
    maxShots: 50,
    targetScore: 1200,
    timeLimit: 120,
    specialBubbles: {
      locked: 3,
      bomb: 1,
    },
    availableColors: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
    items: [
      {
        id: 'bomb-3',
        type: 'bomb',
        name: '炸弹泡泡',
        count: 3,
        effect: { range: 1 },
      },
      {
        id: 'range-3',
        type: 'range',
        name: '范围消除',
        count: 1,
        effect: { range: 2 },
      },
      {
        id: 'color-3',
        type: 'color_change',
        name: '换色器',
        count: 2,
        effect: { range: 0 },
      },
    ],
  },
  {
    id: 4,
    name: '障碍重重',
    type: 'obstacle',
    rows: 8,
    cols: 8,
    bubbleLayout: [
      ['red', 'blue', null, 'yellow', 'green', null, 'purple', 'orange'],
      ['blue', null, 'yellow', 'green', null, 'purple', 'orange', 'red'],
      [null, 'yellow', 'green', null, 'purple', 'orange', 'red', 'blue'],
      ['yellow', 'green', null, 'purple', 'orange', null, 'blue', 'yellow'],
      ['green', null, 'purple', 'orange', null, 'red', 'yellow', 'green'],
      [null, 'purple', 'orange', null, 'red', 'blue', 'green', null],
      ['purple', 'orange', null, 'red', 'blue', null, null, 'purple'],
      ['orange', null, 'red', null, 'blue', 'yellow', null, 'orange'],
    ],
    maxShots: 45,
    targetScore: 1500,
    specialBubbles: {
      obstacle: 5,
      locked: 4,
      bomb: 2,
    },
    availableColors: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
    items: [
      {
        id: 'bomb-4',
        type: 'bomb',
        name: '炸弹泡泡',
        count: 4,
        effect: { range: 1 },
      },
      {
        id: 'range-4',
        type: 'range',
        name: '范围消除',
        count: 2,
        effect: { range: 2 },
      },
      {
        id: 'color-4',
        type: 'color_change',
        name: '换色器',
        count: 2,
        effect: { range: 0 },
      },
    ],
  },
  {
    id: 5,
    name: '炸弹风暴',
    type: 'normal',
    rows: 7,
    cols: 8,
    bubbleLayout: [
      ['red', 'blue', 'yellow', 'green', 'purple', 'orange', 'red', 'blue'],
      ['blue', 'yellow', 'green', 'purple', 'orange', 'red', 'blue', 'yellow'],
      ['yellow', 'green', 'purple', 'orange', 'red', 'blue', 'yellow', 'green'],
      ['green', 'purple', 'orange', 'red', 'blue', 'yellow', 'green', 'purple'],
      ['purple', 'orange', 'red', 'blue', 'yellow', 'green', 'purple', 'orange'],
      ['orange', 'red', 'blue', 'yellow', 'green', 'purple', 'orange', 'red'],
      ['red', 'blue', 'yellow', 'green', 'purple', 'orange', 'red', 'blue'],
    ],
    maxShots: 50,
    targetScore: 2000,
    specialBubbles: {
      bomb: 5,
      locked: 3,
    },
    availableColors: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
    items: [
      {
        id: 'bomb-5',
        type: 'bomb',
        name: '炸弹泡泡',
        count: 5,
        effect: { range: 2 },
      },
      {
        id: 'range-5',
        type: 'range',
        name: '范围消除',
        count: 2,
        effect: { range: 2 },
      },
    ],
  },
  {
    id: 6,
    name: '极速挑战',
    type: 'timed',
    rows: 6,
    cols: 8,
    bubbleLayout: [
      ['red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green'],
      ['blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green', 'red'],
      ['yellow', 'green', 'red', 'blue', 'yellow', 'green', 'red', 'blue'],
      ['green', 'red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow'],
      ['red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green'],
      ['blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green', 'red'],
    ],
    maxShots: 100,
    targetScore: 2500,
    timeLimit: 90,
    specialBubbles: {
      locked: 5,
    },
    availableColors: ['red', 'blue', 'yellow', 'green'],
    items: [
      {
        id: 'bomb-6',
        type: 'bomb',
        name: '炸弹泡泡',
        count: 3,
        effect: { range: 1 },
      },
      {
        id: 'color-6',
        type: 'color_change',
        name: '换色器',
        count: 3,
        effect: { range: 0 },
      },
    ],
  },
  {
    id: 7,
    name: '锁定迷阵',
    type: 'obstacle',
    rows: 9,
    cols: 8,
    bubbleLayout: [
      ['red', 'purple', 'yellow', 'green', 'red', 'purple', 'yellow', 'green'],
      ['blue', 'orange', 'green', 'red', 'blue', 'orange', 'green', 'red'],
      [null, 'yellow', 'green', 'blue', 'yellow', 'green', 'blue', null],
      ['yellow', 'green', null, 'yellow', 'green', null, 'purple', 'orange'],
      [null, 'red', 'blue', null, 'red', 'blue', 'yellow', null],
      ['orange', 'purple', 'red', 'blue', null, 'red', 'blue', 'yellow'],
      ['red', 'blue', 'yellow', 'green', 'purple', null, 'yellow', 'green'],
      ['blue', 'yellow', 'green', 'red', 'blue', 'purple', 'green', null],
      ['yellow', 'green', null, 'blue', 'yellow', 'orange', null, 'red'],
    ],
    maxShots: 55,
    targetScore: 3000,
    specialBubbles: {
      obstacle: 8,
      locked: 6,
      bomb: 3,
    },
    availableColors: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
    items: [
      {
        id: 'bomb-7',
        type: 'bomb',
        name: '炸弹泡泡',
        count: 5,
        effect: { range: 2 },
      },
      {
        id: 'range-7',
        type: 'range',
        name: '范围消除',
        count: 3,
        effect: { range: 3 },
      },
      {
        id: 'color-7',
        type: 'color_change',
        name: '换色器',
        count: 3,
        effect: { range: 0 },
      },
    ],
  },
  {
    id: 8,
    name: '终极试炼',
    type: 'timed',
    rows: 10,
    cols: 8,
    bubbleLayout: [
      ['purple', 'orange', 'red', 'blue', 'purple', 'orange', 'red', 'blue'],
      ['red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green'],
      ['blue', 'yellow', 'green', 'purple', 'blue', 'yellow', 'green', 'purple'],
      ['yellow', 'green', 'purple', 'orange', 'yellow', 'green', 'purple', 'orange'],
      ['green', 'purple', 'orange', 'red', 'green', 'purple', 'orange', 'red'],
      ['purple', 'orange', 'red', 'blue', 'purple', 'orange', 'red', 'blue'],
      ['orange', 'red', 'blue', 'yellow', 'orange', 'red', 'blue', 'yellow'],
      ['red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green'],
      ['blue', 'yellow', 'green', 'purple', 'blue', 'yellow', 'green', 'purple'],
      ['yellow', 'green', 'purple', 'orange', 'yellow', 'green', 'purple', 'orange'],
    ],
    maxShots: 120,
    targetScore: 5000,
    timeLimit: 150,
    specialBubbles: {
      obstacle: 5,
      locked: 8,
      bomb: 5,
    },
    availableColors: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
    items: [
      {
        id: 'bomb-8',
        type: 'bomb',
        name: '炸弹泡泡',
        count: 6,
        effect: { range: 2 },
      },
      {
        id: 'range-8',
        type: 'range',
        name: '范围消除',
        count: 4,
        effect: { range: 3 },
      },
      {
        id: 'color-8',
        type: 'color_change',
        name: '换色器',
        count: 4,
        effect: { range: 0 },
      },
    ],
  },
]

class LevelService {
  private levels: LevelConfig[] = levels

  getAllLevels(): LevelConfig[] {
    return this.levels
  }

  getLevelById(id: number): LevelConfig | null {
    return this.levels.find((l) => l.id === id) || null
  }

  getAvailableColors(levelId: number): BubbleColor[] {
    const level = this.getLevelById(levelId)
    return level?.availableColors || BUBBLE_COLORS
  }

  getItems(levelId: number): Item[] {
    const level = this.getLevelById(levelId)
    return level?.items || []
  }

  getUnlockedLevels(highScores: HighScore[]): number[] {
    const unlocked: number[] = [1]
    const completedLevelIds = highScores.map((s) => s.levelId)

    for (let i = 2; i <= this.levels.length; i++) {
      if (completedLevelIds.includes(i - 1)) {
        unlocked.push(i)
      }
    }

    return unlocked
  }
}

export default new LevelService()
