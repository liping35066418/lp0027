import type { Request, Response } from 'express'
import type {
  InitGameRequest,
  CalculateTrajectoryRequest,
  ShootBubbleRequest,
  PauseGameRequest,
  ResumeGameRequest,
  RestartGameRequest,
  UseItemRequest,
  BubbleColor,
  ItemType,
} from '../../shared/types.js'
import gameService from '../services/GameService.js'
import levelService from '../services/LevelService.js'
import trajectoryService from '../services/TrajectoryService.js'
import { BUBBLE_COLORS } from '../../shared/types.js'

const THROTTLE_MS = 300
const lastRequestTimes: Map<string, number> = new Map()
const validItemTypes: ItemType[] = ['bomb', 'range', 'color_change']

function throttle(key: string): boolean {
  const now = Date.now()
  const lastTime = lastRequestTimes.get(key) || 0
  if (now - lastTime < THROTTLE_MS) {
    return false
  }
  lastRequestTimes.set(key, now)
  return true
}

function validateGameId(gameId: unknown): gameId is string {
  return typeof gameId === 'string' && gameId.length > 0 && gameId.startsWith('game_')
}

function validateLevelId(levelId: unknown): levelId is number {
  return typeof levelId === 'number' && levelId >= 1 && levelId <= 100
}

function validateAngle(angle: unknown): angle is number {
  return typeof angle === 'number' && angle >= 10 && angle <= 170
}

function validatePower(power: unknown): power is number {
  return typeof power === 'number' && power >= 0.5 && power <= 2
}

function validateItemType(itemType: unknown): itemType is ItemType {
  return typeof itemType === 'string' && validItemTypes.includes(itemType as ItemType)
}

function validateColor(color: unknown): color is BubbleColor {
  return typeof color === 'string' && BUBBLE_COLORS.includes(color as BubbleColor)
}

class GameController {
  async initGame(req: Request, res: Response): Promise<void> {
    const throttleKey = `init_${req.ip || 'unknown'}`
    if (!throttle(throttleKey)) {
      res.status(429).json({ success: false, error: '请求过于频繁，请稍后再试' })
      return
    }

    const body = req.body as InitGameRequest

    if (!validateLevelId(body.levelId)) {
      res.status(400).json({ success: false, error: '无效的关卡ID' })
      return
    }

    const levelConfig = levelService.getLevelById(body.levelId)
    if (!levelConfig) {
      res.status(404).json({ success: false, error: '关卡不存在' })
      return
    }

    const result = gameService.createGame(body.levelId)
    if (!result) {
      res.status(500).json({ success: false, error: '创建游戏失败' })
      return
    }

    res.status(200).json({ success: true, data: result })
  }

  async calculateTrajectory(req: Request, res: Response): Promise<void> {
    const body = req.body as CalculateTrajectoryRequest

    if (!validateGameId(body.gameId)) {
      res.status(400).json({ success: false, error: '无效的游戏ID' })
      return
    }

    if (!validateAngle(body.angle)) {
      res.status(400).json({ success: false, error: '无效的角度参数' })
      return
    }

    if (!validatePower(body.power)) {
      res.status(400).json({ success: false, error: '无效的力度参数' })
      return
    }

    const gameData = gameService.getGame(body.gameId)
    if (!gameData) {
      res.status(404).json({ success: false, error: '游戏不存在' })
      return
    }

    if (gameData.gameState !== 'PLAYING' && gameData.gameState !== 'READY') {
      res.status(400).json({ success: false, error: '游戏状态不允许此操作' })
      return
    }

    const result = trajectoryService.calculateTrajectory(
      body.angle,
      body.power,
      gameData.bubbles,
    )

    res.status(200).json({ success: true, data: result })
  }

  async shootBubble(req: Request, res: Response): Promise<void> {
    const body = req.body as ShootBubbleRequest
    const throttleKey = `shoot_${body.gameId || req.ip || 'unknown'}`

    if (!throttle(throttleKey)) {
      res.status(429).json({ success: false, error: '请求过于频繁，请稍后再试' })
      return
    }

    if (!validateGameId(body.gameId)) {
      res.status(400).json({ success: false, error: '无效的游戏ID' })
      return
    }

    if (!validateAngle(body.angle)) {
      res.status(400).json({ success: false, error: '无效的角度参数' })
      return
    }

    if (!validatePower(body.power)) {
      res.status(400).json({ success: false, error: '无效的力度参数' })
      return
    }

    const gameData = gameService.getGame(body.gameId)
    if (!gameData) {
      res.status(404).json({ success: false, error: '游戏不存在' })
      return
    }

    if (gameData.gameState !== 'PLAYING' && gameData.gameState !== 'READY') {
      res.status(400).json({ success: false, error: '游戏状态不允许此操作' })
      return
    }

    const result = gameService.shoot(body.gameId, body.angle, body.power)
    if (!result) {
      res.status(500).json({ success: false, error: '发射失败' })
      return
    }

    res.status(200).json({ success: true, data: result })
  }

  async pauseGame(req: Request, res: Response): Promise<void> {
    const body = req.body as PauseGameRequest

    if (!validateGameId(body.gameId)) {
      res.status(400).json({ success: false, error: '无效的游戏ID' })
      return
    }

    const result = gameService.pauseGame(body.gameId)
    if (!result) {
      res.status(400).json({ success: false, error: '暂停游戏失败' })
      return
    }

    res.status(200).json({ success: true, data: result })
  }

  async resumeGame(req: Request, res: Response): Promise<void> {
    const body = req.body as ResumeGameRequest

    if (!validateGameId(body.gameId)) {
      res.status(400).json({ success: false, error: '无效的游戏ID' })
      return
    }

    const result = gameService.resumeGame(body.gameId)
    if (!result) {
      res.status(400).json({ success: false, error: '恢复游戏失败' })
      return
    }

    res.status(200).json({ success: true, data: result })
  }

  async restartGame(req: Request, res: Response): Promise<void> {
    const body = req.body as RestartGameRequest
    const throttleKey = `restart_${body.gameId || req.ip || 'unknown'}`

    if (!throttle(throttleKey)) {
      res.status(429).json({ success: false, error: '请求过于频繁，请稍后再试' })
      return
    }

    if (!validateGameId(body.gameId)) {
      res.status(400).json({ success: false, error: '无效的游戏ID' })
      return
    }

    const result = gameService.restartGame(body.gameId)
    if (!result) {
      res.status(404).json({ success: false, error: '游戏不存在，无法重新开始' })
      return
    }

    res.status(200).json({ success: true, data: result })
  }

  async getGameState(req: Request, res: Response): Promise<void> {
    const { gameId } = req.params

    if (!validateGameId(gameId)) {
      res.status(400).json({ success: false, error: '无效的游戏ID' })
      return
    }

    const result = gameService.getGameState(gameId)
    if (!result) {
      res.status(404).json({ success: false, error: '游戏不存在' })
      return
    }

    res.status(200).json({ success: true, data: result })
  }

  async useItem(req: Request, res: Response): Promise<void> {
    const body = req.body as UseItemRequest
    const throttleKey = `item_${body.gameId || req.ip || 'unknown'}`

    if (!throttle(throttleKey)) {
      res.status(429).json({ success: false, error: '请求过于频繁，请稍后再试' })
      return
    }

    if (!validateGameId(body.gameId)) {
      res.status(400).json({ success: false, error: '无效的游戏ID' })
      return
    }

    if (!validateItemType(body.itemType)) {
      res.status(400).json({ success: false, error: '无效的道具类型' })
      return
    }

    if (body.targetColor && !validateColor(body.targetColor)) {
      res.status(400).json({ success: false, error: '无效的目标颜色' })
      return
    }

    const result = gameService.useItem(
      body.gameId,
      body.itemType,
      body.targetBubbleId,
      body.targetColor,
    )
    if (!result) {
      res.status(400).json({ success: false, error: '使用道具失败' })
      return
    }

    res.status(200).json({ success: true, data: result })
  }

  async getGameItems(req: Request, res: Response): Promise<void> {
    const { gameId } = req.params

    if (!validateGameId(gameId)) {
      res.status(400).json({ success: false, error: '无效的游戏ID' })
      return
    }

    const result = gameService.getAvailableItems(gameId)
    if (!result) {
      res.status(404).json({ success: false, error: '游戏不存在' })
      return
    }

    res.status(200).json({ success: true, data: result })
  }
}

export default new GameController()
