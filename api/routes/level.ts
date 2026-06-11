import { Router, type Request, type Response } from 'express'
import levelService from '../services/LevelService.js'
import scoreService from '../services/ScoreService.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const levels = levelService.getAllLevels()
  const highScores = scoreService.getHighScores()
  const unlockedLevelIds = levelService.getUnlockedLevels(highScores)

  res.status(200).json({
    success: true,
    data: {
      levels,
      unlockedLevelIds,
      highScores,
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id, 10)

  if (isNaN(id) || id < 1) {
    res.status(400).json({ success: false, error: '无效的关卡ID' })
    return
  }

  const level = levelService.getLevelById(id)

  if (!level) {
    res.status(404).json({ success: false, error: '关卡不存在' })
    return
  }

  res.status(200).json({
    success: true,
    data: level,
  })
})

export default router
