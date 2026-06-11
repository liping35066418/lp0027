import type {
  GameData,
  GameState,
  Bubble,
  BubbleColor,
  BubbleType,
  ChainElimination,
  Item,
  ItemType,
  InitGameResponse,
  ShootBubbleResponse,
  UseItemResponse,
  ResumeGameResponse,
  PauseGameResponse,
  GetGameStateResponse,
  AutoItemTriggeredResult,
} from '../../shared/types.js'
import levelService from './LevelService.js'
import bubbleService from './BubbleService.js'
import trajectoryService from './TrajectoryService.js'
import itemService from './ItemService.js'
import scoreService from './ScoreService.js'
import {
  COMBO_TIMEOUT,
  MAX_ENERGY,
  calculateEnergyGained,
  pickAutoItemType,
} from '../../shared/types.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../../data')
const SAVES_DIR = path.join(DATA_DIR, 'saves')

function ensureSaveDir(): void {
  if (!fs.existsSync(SAVES_DIR)) {
    fs.mkdirSync(SAVES_DIR, { recursive: true })
  }
}

function getSavePath(gameId: string): string {
  return path.join(SAVES_DIR, `${gameId}.json`)
}

function migrateGameData(data: any): GameData {
  return {
    ...data,
    energy: data.energy ?? 0,
    maxCombo: data.maxCombo ?? 0,
    autoItemTriggeredCount: data.autoItemTriggeredCount ?? 0,
  }
}

function saveGameData(gameData: GameData): void {
  try {
    ensureSaveDir()
    fs.writeFileSync(getSavePath(gameData.gameId), JSON.stringify(gameData, null, 2), 'utf-8')
  } catch (err) {
    console.warn('Failed to save game data:', err)
  }
}

function loadGameData(gameId: string): GameData | null {
  try {
    const savePath = getSavePath(gameId)
    if (fs.existsSync(savePath)) {
      const data = fs.readFileSync(savePath, 'utf-8')
      return migrateGameData(JSON.parse(data))
    }
  } catch (err) {
    console.warn('Failed to load game data:', err)
  }
  return null
}

function deleteGameData(gameId: string): void {
  try {
    const savePath = getSavePath(gameId)
    if (fs.existsSync(savePath)) {
      fs.unlinkSync(savePath)
    }
  } catch (err) {
    console.warn('Failed to delete game data:', err)
  }
}

let gameIdCounter = 0

function generateGameId(): string {
  gameIdCounter++
  return `game_${Date.now()}_${gameIdCounter}`
}

interface ShootResult {
  landedPosition: { row: number; col: number }
  newBubble: Bubble
  eliminatedBubbles: Bubble[]
  chainReaction: ChainElimination[]
  comboMultiplier: number
  comboCount: number
  scoreGained: number
  fallingBubbles: Bubble[]
  currentBubble: Bubble
  nextBubble: Bubble
  bubbles: (Bubble | null)[][]
  energyGained: number
  autoItemTriggered?: AutoItemTriggeredResult
}

class GameService {
  private games: Map<string, GameData> = new Map()

  constructor() {
    this.loadAllSaves()
  }

  private loadAllSaves(): void {
    try {
      ensureSaveDir()
      const files = fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.json'))
      for (const file of files) {
        const gameId = file.replace('.json', '')
        const data = loadGameData(gameId)
        if (data && (data.gameState === 'PLAYING' || data.gameState === 'PAUSED')) {
          this.games.set(gameId, data)
        }
      }
    } catch {
      // ignore
    }
  }

  createGame(levelId: number): InitGameResponse | null {
    const levelConfig = levelService.getLevelById(levelId)
    if (!levelConfig) {
      return null
    }

    const gameId = generateGameId()
    const bubbles = bubbleService.buildBubblesFromLayout(levelConfig)
    const availableColors = levelService.getAvailableColors(levelId)
    const items = itemService.cloneItems(levelService.getItems(levelId))

    const currentBubble = this.createRandomBubble(availableColors, bubbles, levelConfig.rows)
    const nextBubble = this.createRandomBubble(availableColors, bubbles, levelConfig.rows)

    const gameData: GameData = {
      gameId,
      levelId,
      levelConfig,
      gameState: 'READY',
      bubbles,
      currentBubble,
      nextBubble,
      score: 0,
      shotsLeft: levelConfig.maxShots,
      timeLeft: levelConfig.timeLimit,
      targetScore: levelConfig.targetScore,
      comboMultiplier: 1,
      comboCount: 0,
      availableItems: items,
      lastUpdated: Date.now(),
      version: 1,
      energy: 0,
      maxCombo: 0,
      autoItemTriggeredCount: 0,
    }

    this.games.set(gameId, gameData)
    saveGameData(gameData)

    return {
      gameId,
      levelId,
      bubbles,
      currentBubble,
      nextBubble,
      score: 0,
      shotsLeft: levelConfig.maxShots,
      timeLeft: levelConfig.timeLimit,
      targetScore: levelConfig.targetScore,
      gameState: 'READY',
      availableItems: items,
      levelConfig,
      comboMultiplier: 1,
      comboCount: 0,
      energy: 0,
      maxCombo: 0,
      autoItemTriggeredCount: 0,
    }
  }

  private createRandomBubble(
    availableColors: BubbleColor[],
    bubbles: (Bubble | null)[][],
    rows: number,
  ): Bubble {
    const color = bubbleService.getRandomColor(availableColors, bubbles)
    const position = bubbleService.getBubblePosition(rows, 0)
    return {
      id: `current_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      row: rows,
      col: 0,
      x: position.x,
      y: position.y,
      color,
      type: 'normal' as BubbleType,
    }
  }

  getGame(gameId: string): GameData | undefined {
    let game = this.games.get(gameId)
    if (!game) {
      const loaded = loadGameData(gameId)
      if (loaded) {
        game = loaded
        this.games.set(gameId, game)
      }
    }
    return game
  }

  shoot(
    gameId: string,
    angle: number,
    power: number,
  ): ShootBubbleResponse | null {
    const gameData = this.getGame(gameId)
    if (!gameData) {
      return null
    }

    if (gameData.gameState !== 'PLAYING' && gameData.gameState !== 'READY') {
      return null
    }

    const result = this.executeShoot(gameData, angle, power)

    gameData.shotsLeft = Math.max(0, gameData.shotsLeft - 1)
    gameData.score += result.scoreGained
    gameData.comboMultiplier = result.comboMultiplier
    gameData.comboCount = result.comboCount
    gameData.currentBubble = result.currentBubble
    gameData.nextBubble = result.nextBubble
    gameData.bubbles = result.bubbles
    gameData.energy = Math.min(MAX_ENERGY, gameData.energy + result.energyGained)
    if (result.comboCount > gameData.maxCombo) {
      gameData.maxCombo = result.comboCount
    }

    let autoItemTriggered = result.autoItemTriggered

    if (!autoItemTriggered && gameData.energy >= MAX_ENERGY) {
      autoItemTriggered = this.triggerAutoItem(gameData)
      gameData.autoItemTriggeredCount += 1
      gameData.energy = 0
    }

    gameData.lastUpdated = Date.now()
    gameData.version += 1

    const win = this.checkWinCondition(gameData)
    const lose = this.checkLoseCondition(gameData)

    let message: string | undefined
    if (win) {
      gameData.gameState = 'WIN'
      message = '恭喜通关！'
      const stars = scoreService.calculateStars(gameData.score, gameData.targetScore)
      scoreService.saveScore({
        levelId: gameData.levelId,
        score: gameData.score,
        stars,
        gameId,
        maxCombo: gameData.maxCombo,
        autoItemTriggers: gameData.autoItemTriggeredCount,
      })
      deleteGameData(gameId)
    } else if (lose) {
      gameData.gameState = 'LOSE'
      message = '游戏结束！'
      scoreService.saveScore({
        levelId: gameData.levelId,
        score: gameData.score,
        stars: 0,
        gameId,
        maxCombo: gameData.maxCombo,
        autoItemTriggers: gameData.autoItemTriggeredCount,
      })
      deleteGameData(gameId)
    } else {
      gameData.gameState = 'PLAYING'
      saveGameData(gameData)
    }

    return {
      gameId,
      newBubble: result.newBubble,
      landedPosition: result.landedPosition,
      eliminatedBubbles: result.eliminatedBubbles,
      chainReaction: result.chainReaction,
      comboMultiplier: result.comboMultiplier,
      comboCount: result.comboCount,
      scoreGained: result.scoreGained,
      totalScore: gameData.score,
      shotsLeft: gameData.shotsLeft,
      timeLeft: gameData.timeLeft,
      fallingBubbles: result.fallingBubbles,
      gameState: gameData.gameState,
      message,
      currentBubble: gameData.currentBubble,
      nextBubble: gameData.nextBubble,
      bubbles: gameData.bubbles,
      energy: gameData.energy,
      energyGained: result.energyGained,
      maxCombo: gameData.maxCombo,
      autoItemTriggeredCount: gameData.autoItemTriggeredCount,
      autoItemTriggered,
    }
  }

  private triggerAutoItem(gameData: GameData): AutoItemTriggeredResult {
    const itemType: ItemType = pickAutoItemType()
    const availableColors = gameData.levelConfig.availableColors
    const targetColor = this.findMostCommonColor(gameData.bubbles, availableColors)

    let eliminatedBubbles: Bubble[] = []
    let fallingBubbles: Bubble[] = []
    let scoreGained = 0

    switch (itemType) {
      case 'bomb': {
        const target = this.findLowestBubble(gameData.bubbles)
        if (target) {
          const inRange = bubbleService.getBombBlastRadius(
            gameData.bubbles,
            target.row,
            target.col,
            1,
          )
          for (const b of inRange) {
            if (b.type !== 'obstacle' && !b.isEliminated) {
              b.isEliminated = true
              if (gameData.bubbles[b.row]?.[b.col]) {
                gameData.bubbles[b.row][b.col] = null
              }
              eliminatedBubbles.push(b)
            }
          }
        }
        fallingBubbles = bubbleService.findFloatingBubbles(gameData.bubbles)
        for (const fb of fallingBubbles) {
          fb.isFalling = true
          if (gameData.bubbles[fb.row]?.[fb.col]) {
            gameData.bubbles[fb.row][fb.col] = null
          }
          eliminatedBubbles.push(fb)
        }
        scoreGained = eliminatedBubbles.length * 15
        break
      }
      case 'range': {
        for (let row = 0; row < gameData.bubbles.length; row++) {
          for (let col = 0; col < (gameData.bubbles[row]?.length || 0); col++) {
            const bubble = gameData.bubbles[row]?.[col]
            if (!bubble || bubble.isEliminated) continue
            if (bubble.type === 'obstacle' || bubble.type === 'locked') continue
            if (bubble.color === targetColor || bubble.type === 'colorful') {
              bubble.isEliminated = true
              if (gameData.bubbles[row]?.[col]) {
                gameData.bubbles[row][col] = null
              }
              eliminatedBubbles.push(bubble)
            }
          }
        }
        fallingBubbles = bubbleService.findFloatingBubbles(gameData.bubbles)
        for (const fb of fallingBubbles) {
          fb.isFalling = true
          if (gameData.bubbles[fb.row]?.[fb.col]) {
            gameData.bubbles[fb.row][fb.col] = null
          }
          eliminatedBubbles.push(fb)
        }
        scoreGained = eliminatedBubbles.length * 10
        break
      }
      case 'color_change': {
        const target = this.findLowestBubble(gameData.bubbles)
        if (target && targetColor && target.type !== 'obstacle' && target.type !== 'locked') {
          target.color = targetColor
          if (target.type !== 'bomb') {
            target.type = 'normal'
          }
          const elimination = bubbleService.eliminateBubbles(
            gameData.bubbles,
            target.row,
            target.col,
          )
          eliminatedBubbles = elimination.eliminated
          fallingBubbles = elimination.falling
          scoreGained = eliminatedBubbles.length * 10 + fallingBubbles.length * 20
        }
        break
      }
    }

    gameData.score += scoreGained

    return {
      itemType,
      eliminatedBubbles,
      fallingBubbles,
      scoreGained,
    }
  }

  private findLowestBubble(bubbles: (Bubble | null)[][]): Bubble | null {
    for (let row = bubbles.length - 1; row >= 0; row--) {
      for (let col = 0; col < (bubbles[row]?.length || 0); col++) {
        const b = bubbles[row]?.[col]
        if (b && !b.isEliminated && b.type !== 'obstacle') {
          return b
        }
      }
    }
    return null
  }

  private findMostCommonColor(
    bubbles: (Bubble | null)[][],
    availableColors: BubbleColor[],
  ): BubbleColor {
    const counts: Record<string, number> = {}
    for (const row of bubbles) {
      for (const b of row) {
        if (b && b.type !== 'obstacle' && !b.isEliminated) {
          counts[b.color] = (counts[b.color] || 0) + 1
        }
      }
    }
    let best: BubbleColor = availableColors[0] || 'red'
    let bestCount = -1
    for (const color of availableColors) {
      const c = counts[color] || 0
      if (c > bestCount) {
        bestCount = c
        best = color
      }
    }
    return best
  }

  private executeShoot(
    gameData: GameData,
    angle: number,
    power: number,
  ): ShootResult {
    const trajectory = trajectoryService.calculateTrajectory(
      angle,
      power,
      gameData.bubbles,
    )

    const landingPosition = trajectory.landingPosition || {
      row: 0, col: 0 }

    const newBubble: Bubble = { ...gameData.currentBubble }
    const landedPos = bubbleService.placeBubble(
      gameData.bubbles,
      landingPosition.row,
      landingPosition.col,
      newBubble,
    )

    let eliminatedBubbles: Bubble[] = []
    let chainReaction: ChainElimination[] = []
    let fallingBubbles: Bubble[] = []
    let scoreGained = 0

    if (newBubble.type === 'locked' && (newBubble.lockHits || 0) > 0) {
      bubbleService.hitLockedBubble(newBubble)
    } else if (newBubble.type === 'bomb') {
      const blast = bubbleService.getBombBlastRadius(
        gameData.bubbles,
        landedPos.row,
        landedPos.col,
        1,
      )
      for (const b of blast) {
        if (b.type !== 'obstacle') {
          b.isEliminated = true
          gameData.bubbles[b.row][b.col] = null
          eliminatedBubbles.push(b)
        }
      }
      fallingBubbles = bubbleService.findFloatingBubbles(gameData.bubbles)
      for (const fb of fallingBubbles) {
        fb.isFalling = true
        gameData.bubbles[fb.row][fb.col] = null
        eliminatedBubbles.push(fb)
      }
      scoreGained = eliminatedBubbles.length * 15
    } else {
      const elimination = bubbleService.eliminateBubbles(
        gameData.bubbles,
        landedPos.row,
        landedPos.col,
      )
      eliminatedBubbles = elimination.eliminated
      chainReaction = elimination.chainReactions
      fallingBubbles = elimination.falling
      scoreGained = chainReaction.reduce((sum, c) => sum + c.score, 0)
    }

    const now = Date.now()
    let comboMultiplier = 1
    let comboCount = 0

    if (chainReaction.length > 0 || fallingBubbles.length > 0 || eliminatedBubbles.length > 0) {
      if (now - gameData.lastUpdated < COMBO_TIMEOUT) {
        comboCount = gameData.comboCount + 1
        comboMultiplier = Math.min(1 + comboCount * 0.5, 5)
      } else {
        comboCount = 1
        comboMultiplier = 1
      }
      scoreGained = Math.floor(scoreGained * comboMultiplier)
    }

    const totalEliminated = eliminatedBubbles.length
    const energyGained = calculateEnergyGained(totalEliminated, comboCount)

    const availableColors = gameData.levelConfig.availableColors
    const currentBubble = gameData.nextBubble
    const nextBubble = this.createRandomBubble(
      availableColors,
      gameData.bubbles,
      gameData.levelConfig.rows,
    )

    const newBubbles = gameData.bubbles.map(row => [...row])

    return {
      landedPosition: landedPos,
      newBubble,
      eliminatedBubbles,
      chainReaction,
      comboMultiplier,
      comboCount,
      scoreGained,
      fallingBubbles,
      currentBubble,
      nextBubble,
      bubbles: newBubbles,
      energyGained,
    }
  }

  useItem(
    gameId: string,
    itemType: ItemType,
    targetBubbleId?: string,
    targetColor?: BubbleColor,
  ): UseItemResponse | null {
    const gameData = this.getGame(gameId)
    if (!gameData) {
      return null
    }

    if (gameData.gameState !== 'PLAYING' && gameData.gameState !== 'READY') {
      return null
    }

    const validation = itemService.validateItemRequest(
      gameData.availableItems,
      itemType,
    )
    if (!validation.valid) {
      return null
    }

    const result = itemService.useItem(
      gameData.availableItems,
      itemType,
      gameData.bubbles,
      targetBubbleId,
      targetColor,
    )

    gameData.availableItems = result.remainingItems
    gameData.score += result.scoreGained
    gameData.lastUpdated = Date.now()
    gameData.version += 1

    const win = this.checkWinCondition(gameData)
    const lose = this.checkLoseCondition(gameData)

    if (win) {
      gameData.gameState = 'WIN'
      const stars = scoreService.calculateStars(
        gameData.score,
        gameData.targetScore,
      )
      scoreService.saveScore({
        levelId: gameData.levelId,
        score: gameData.score,
        stars,
        gameId,
        maxCombo: gameData.maxCombo,
        autoItemTriggers: gameData.autoItemTriggeredCount,
      })
      deleteGameData(gameId)
    } else if (lose) {
      gameData.gameState = 'LOSE'
      scoreService.saveScore({
        levelId: gameData.levelId,
        score: gameData.score,
        stars: 0,
        gameId,
        maxCombo: gameData.maxCombo,
        autoItemTriggers: gameData.autoItemTriggeredCount,
      })
      deleteGameData(gameId)
    } else {
      saveGameData(gameData)
    }

    return {
      gameId,
      itemType,
      eliminatedBubbles: result.eliminatedBubbles,
      scoreGained: result.scoreGained,
      totalScore: gameData.score,
      remainingItems: gameData.availableItems,
      gameState: gameData.gameState,
      fallingBubbles: result.fallingBubbles,
      comboMultiplier: gameData.comboMultiplier,
      energy: gameData.energy,
      maxCombo: gameData.maxCombo,
      autoItemTriggeredCount: gameData.autoItemTriggeredCount,
    }
  }

  pauseGame(gameId: string): PauseGameResponse | null {
    const gameData = this.getGame(gameId)
    if (!gameData) {
      return null
    }

    if (gameData.gameState !== 'PLAYING' && gameData.gameState !== 'READY') {
      return null
    }

    gameData.gameState = 'PAUSED'
    gameData.lastUpdated = Date.now()
    gameData.version += 1
    saveGameData(gameData)

    return {
      gameId,
      gameState: 'PAUSED',
      savedAt: Date.now(),
    }
  }

  resumeGame(gameId: string): ResumeGameResponse | null {
    const gameData = this.getGame(gameId)
    if (!gameData) {
      return null
    }

    if (gameData.gameState !== 'PAUSED') {
      return null
    }

    gameData.gameState = 'PLAYING'
    gameData.lastUpdated = Date.now()
    gameData.version += 1
    saveGameData(gameData)

    return {
      gameId,
      gameState: 'PLAYING',
      bubbles: gameData.bubbles,
      currentBubble: gameData.currentBubble,
      nextBubble: gameData.nextBubble,
      score: gameData.score,
      shotsLeft: gameData.shotsLeft,
      timeLeft: gameData.timeLeft,
      comboMultiplier: gameData.comboMultiplier,
      comboCount: gameData.comboCount,
      availableItems: gameData.availableItems,
      energy: gameData.energy,
      maxCombo: gameData.maxCombo,
      autoItemTriggeredCount: gameData.autoItemTriggeredCount,
    }
  }

  restartGame(gameId: string): InitGameResponse | null {
    const gameData = this.getGame(gameId)
    if (!gameData) {
      return null
    }

    deleteGameData(gameId)
    this.games.delete(gameId)

    return this.createGame(gameData.levelId)
  }

  getGameState(gameId: string): GetGameStateResponse | null {
    const gameData = this.getGame(gameId)
    if (!gameData) {
      return null
    }

    return {
      gameId,
      levelId: gameData.levelId,
      gameState: gameData.gameState,
      bubbles: gameData.bubbles,
      currentBubble: gameData.currentBubble,
      nextBubble: gameData.nextBubble,
      score: gameData.score,
      shotsLeft: gameData.shotsLeft,
      timeLeft: gameData.timeLeft,
      targetScore: gameData.targetScore,
      comboMultiplier: gameData.comboMultiplier,
      comboCount: gameData.comboCount,
      availableItems: gameData.availableItems,
      lastUpdated: gameData.lastUpdated,
      levelConfig: gameData.levelConfig,
      energy: gameData.energy,
      maxCombo: gameData.maxCombo,
      autoItemTriggeredCount: gameData.autoItemTriggeredCount,
    }
  }

  checkWinCondition(gameData: GameData): boolean {
    const { bubbles, score, targetScore } = gameData

    let remainingBubbles = 0
    for (const row of bubbles) {
      for (const bubble of row) {
        if (bubble && bubble.type !== 'obstacle') {
          remainingBubbles++
        }
      }
    }

    return remainingBubbles === 0 || score >= targetScore
  }

  checkLoseCondition(gameData: GameData): boolean {
    const { shotsLeft, timeLeft, gameState } = gameData

    if (gameState === 'WIN') {
      return false
    }

    if (shotsLeft <= 0) {
      return true
    }

    if (timeLeft !== undefined && timeLeft <= 0) {
      return true
    }

    const lastRow = gameData.bubbles.length - 1
    for (const bubble of gameData.bubbles[lastRow] || []) {
      if (bubble) {
        return true
      }
    }

    return false
  }

  getAvailableItems(gameId: string): Item[] | null {
    const gameData = this.getGame(gameId)
    if (!gameData) {
      return null
    }
    return gameData.availableItems
  }

  updateTimeLeft(gameId: string): void {
    const gameData = this.getGame(gameId)
    if (!gameData || !gameData.timeLeft) {
      return
    }
    gameData.timeLeft = Math.max(0, gameData.timeLeft - 1)
    gameData.lastUpdated = Date.now()
    gameData.version += 1

    if (gameData.timeLeft <= 0 && this.checkLoseCondition(gameData)) {
      gameData.gameState = 'LOSE'
      scoreService.saveScore({
        levelId: gameData.levelId,
        score: gameData.score,
        stars: 0,
        gameId,
        maxCombo: gameData.maxCombo,
        autoItemTriggers: gameData.autoItemTriggeredCount,
      })
      deleteGameData(gameId)
    } else {
      saveGameData(gameData)
    }
  }

  validateGameVersion(gameId: string, version: number): boolean {
    const gameData = this.getGame(gameId)
    if (!gameData) {
      return false
    }
    return gameData.version === version
  }
}

export default new GameService()
