import { Router, type Request, type Response } from 'express'
import type { SaveScoreRequest } from '../../shared/types.js'
import scoreService from '../services/ScoreService.js'

const router = Router()

router.get('/high', (req: Request, res: Response): void => {
  const result = scoreService.getHighScoresResponse()

  res.status(200).json({
    success: true,
    data: result,
  })
})

router.post('/save', (req: Request, res: Response): void => {
  const body = req.body as SaveScoreRequest

  if (typeof body.levelId !== 'number' || body.levelId < 1) {
    res.status(400).json({ success: false, error: '无效的关卡ID' })
    return
  }

  if (typeof body.score !== 'number' || body.score < 0) {
    res.status(400).json({ success: false, error: '无效的分数' })
    return
  }

  if (typeof body.stars !== 'number' || body.stars < 0 || body.stars > 3) {
    res.status(400).json({ success: false, error: '无效的星级' })
    return
  }

  if (typeof body.gameId !== 'string' || !body.gameId.startsWith('game_')) {
    res.status(400).json({ success: false, error: '无效的游戏ID' })
    return
  }

  const result = scoreService.saveScore(body)

  res.status(200).json({
    success: true,
    data: result,
  })
})

export default router
