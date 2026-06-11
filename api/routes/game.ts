import { Router, type Request, type Response } from 'express'
import gameController from '../controllers/GameController.js'

const router = Router()

router.post('/init', (req: Request, res: Response): void => {
  gameController.initGame(req, res)
})

router.post('/aim', (req: Request, res: Response): void => {
  gameController.calculateTrajectory(req, res)
})

router.post('/shoot', (req: Request, res: Response): void => {
  gameController.shootBubble(req, res)
})

router.post('/pause', (req: Request, res: Response): void => {
  gameController.pauseGame(req, res)
})

router.post('/resume', (req: Request, res: Response): void => {
  gameController.resumeGame(req, res)
})

router.post('/restart', (req: Request, res: Response): void => {
  gameController.restartGame(req, res)
})

router.get('/:gameId', (req: Request, res: Response): void => {
  gameController.getGameState(req, res)
})

router.post('/item/use', (req: Request, res: Response): void => {
  gameController.useItem(req, res)
})

router.get('/:gameId/items', (req: Request, res: Response): void => {
  gameController.getGameItems(req, res)
})

export default router
