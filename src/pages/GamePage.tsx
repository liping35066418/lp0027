import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, RotateCcw, Home, Star, ArrowLeft, Trophy, X } from 'lucide-react';
import GameCanvas from '@/components/GameCanvas';
import BubbleHUD from '@/components/BubbleHUD';
import ItemBar from '@/components/ItemBar';
import { useGameStore } from '@/store/gameStore';
import { api } from '@/services/api';
import { generateId, generateMockGameId, calculateStars, angleToRad, gridToHex } from '@/utils/gameUtils';
import { BUBBLE_COLORS, BUBBLE_RADIUS } from '../../shared/types';
import type { Bubble, Item, BubbleColor } from '../../shared/types';

export default function GamePage() {
  const { levelId = '1' } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showPause, setShowPause] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const gameId = useGameStore((s) => s.gameId);
  const gameState = useGameStore((s) => s.gameState);
  const score = useGameStore((s) => s.score);
  const targetScore = useGameStore((s) => s.targetScore);
  const currentBubble = useGameStore((s) => s.currentBubble);
  const nextBubble = useGameStore((s) => s.nextBubble);
  const levelConfig = useGameStore((s) => s.levelConfig);
  const initGame = useGameStore((s) => s.initGame);
  const updateGameState = useGameStore((s) => s.updateGameState);
  const updateBubbles = useGameStore((s) => s.updateBubbles);
  const updateCurrentBubble = useGameStore((s) => s.updateCurrentBubble);
  const updateNextBubble = useGameStore((s) => s.updateNextBubble);
  const updateScore = useGameStore((s) => s.updateScore);
  const updateCombo = useGameStore((s) => s.updateCombo);
  const updateShotsLeft = useGameStore((s) => s.updateShotsLeft);
  const updateTimeLeft = useGameStore((s) => s.updateTimeLeft);
  const updateAvailableItems = useGameStore((s) => s.updateAvailableItems);
  const setFlyingBubble = useGameStore((s) => s.setFlyingBubble);
  const setEliminatedBubbles = useGameStore((s) => s.setEliminatedBubbles);
  const setFallingBubbles = useGameStore((s) => s.setFallingBubbles);
  const useItem = useGameStore((s) => s.useItem);
  const pause = useGameStore((s) => s.pause);
  const resume = useGameStore((s) => s.resume);
  const restart = useGameStore((s) => s.restart);

  const generateMockBubbles = useCallback((rows: number, cols: number, colors: BubbleColor[]): (Bubble | null)[][] => {
    const bubbles: (Bubble | null)[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: (Bubble | null)[] = [];
      for (let c = 0; c < cols; c++) {
        if (r < Math.floor(rows * 0.6) && Math.random() > 0.2) {
          const pos = gridToHex(r, c, BUBBLE_RADIUS, 0, 20);
          row.push({
            id: generateId(),
            row: r,
            col: c,
            x: pos.x,
            y: pos.y,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: 'normal',
          });
        } else {
          row.push(null);
        }
      }
      bubbles.push(row);
    }
    return bubbles;
  }, []);

  const createBubble = useCallback((colors: BubbleColor[]): Bubble => {
    const color = colors[Math.floor(Math.random() * colors.length)];
    return {
      id: generateId(),
      row: -1,
      col: -1,
      x: 0,
      y: 0,
      color,
      type: 'normal',
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const levelIdNum = parseInt(levelId, 10);
        const response = await api.initGame(levelIdNum);
        initGame({
          gameId: response.gameId,
          levelId: response.levelId,
          levelConfig: response.levelConfig,
          gameState: 'PLAYING',
          bubbles: response.bubbles,
          currentBubble: response.currentBubble,
          nextBubble: response.nextBubble,
          score: response.score,
          shotsLeft: response.shotsLeft,
          timeLeft: response.timeLeft,
          targetScore: response.targetScore,
          comboMultiplier: response.comboMultiplier,
          comboCount: response.comboCount,
          availableItems: response.availableItems,
        });
      } catch {
        const levelIdNum = parseInt(levelId, 10);
        const availableColors = BUBBLE_COLORS.slice(0, Math.min(4 + Math.floor(levelIdNum / 2), 6));
        const rows = 5 + Math.floor(levelIdNum / 2);
        const target = 1000 + levelIdNum * 500;
        const mockConfig = {
          id: levelIdNum,
          name: `关卡 ${levelIdNum}`,
          type: (levelIdNum % 3 === 0 ? 'timed' : 'normal') as 'timed' | 'normal' | 'obstacle',
          rows,
          cols: 8,
          bubbleLayout: [] as (string | null)[][],
          maxShots: 30 + levelIdNum * 2,
          targetScore: target,
          timeLimit: levelIdNum % 3 === 0 ? 60 + levelIdNum * 5 : undefined,
          specialBubbles: {},
          availableColors,
          items: levelIdNum >= 4 ? [
            { id: 'bomb-1', type: 'bomb' as const, name: '炸弹', count: 2, effect: { range: 1 } },
          ] : undefined,
        };
        initGame({
          gameId: generateMockGameId(),
          levelId: levelIdNum,
          levelConfig: mockConfig,
          gameState: 'PLAYING',
          bubbles: generateMockBubbles(rows, 8, availableColors),
          currentBubble: createBubble(availableColors),
          nextBubble: createBubble(availableColors),
          score: 0,
          shotsLeft: mockConfig.maxShots,
          timeLeft: mockConfig.timeLimit,
          targetScore: target,
          comboMultiplier: 1,
          comboCount: 0,
          availableItems: mockConfig.items || [],
        });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [levelId, initGame, generateMockBubbles, createBubble]);

  useEffect(() => {
    if (gameState === 'WIN' || gameState === 'LOSE') {
      setShowResult(true);
    }
  }, [gameState]);

  const handleShoot = useCallback(
    async (angle: number, power: number) => {
      if (!currentBubble || !levelConfig) return;

      const rad = angleToRad(angle);
      const speed = 14 * power;
      setFlyingBubble({
        id: currentBubble.id,
        x: 200,
        y: 520,
        vx: Math.cos(rad) * speed,
        vy: -Math.sin(rad) * speed,
        color: currentBubble.color,
        type: currentBubble.type,
      });

      setTimeout(async () => {
        try {
          const response = await api.shootBubble(gameId, angle, power);
          setFlyingBubble(null);
          setEliminatedBubbles(response.eliminatedBubbles);
          if (response.fallingBubbles) {
            setFallingBubbles(response.fallingBubbles);
          }
          updateBubbles(response.bubbles);
          updateCurrentBubble(response.currentBubble);
          updateNextBubble(response.nextBubble);
          updateScore(response.totalScore);
          updateCombo(response.comboMultiplier, response.comboCount);
          updateShotsLeft(response.shotsLeft);
          if (response.timeLeft !== undefined) {
            updateTimeLeft(response.timeLeft);
          }
          updateGameState(response.gameState);

          setTimeout(() => {
            setEliminatedBubbles([]);
            setFallingBubbles([]);
          }, 600);
        } catch {
          setFlyingBubble(null);
          const colors = levelConfig.availableColors;
          updateCurrentBubble(nextBubble || createBubble(colors));
          updateNextBubble(createBubble(colors));
          updateShotsLeft(Math.max(0, useGameStore.getState().shotsLeft - 1));
        }
      }, 500);
    },
    [currentBubble, nextBubble, levelConfig, gameId, setFlyingBubble, setEliminatedBubbles, setFallingBubbles, updateBubbles, updateCurrentBubble, updateNextBubble, updateScore, updateCombo, updateShotsLeft, updateTimeLeft, updateGameState, createBubble]
  );

  const handlePause = useCallback(async () => {
    pause();
    try {
      await api.pauseGame(gameId);
    } catch {
      // ignore
    }
    setShowPause(true);
  }, [pause, gameId]);

  const handleResume = useCallback(async () => {
    try {
      const response = await api.resumeGame(gameId);
      resume({
        bubbles: response.bubbles,
        currentBubble: response.currentBubble,
        nextBubble: response.nextBubble,
        score: response.score,
        shotsLeft: response.shotsLeft,
        timeLeft: response.timeLeft,
        comboMultiplier: response.comboMultiplier,
        availableItems: response.availableItems,
      });
    } catch {
      updateGameState('PLAYING');
    }
    setShowPause(false);
  }, [gameId, resume, updateGameState]);

  const handleRestart = useCallback(async () => {
    setShowPause(false);
    setShowResult(false);
    restart();
    try {
      const response = await api.restartGame(gameId);
      initGame({
        gameId: response.gameId,
        levelId: response.levelId,
        levelConfig: response.levelConfig,
        gameState: 'PLAYING',
        bubbles: response.bubbles,
        currentBubble: response.currentBubble,
        nextBubble: response.nextBubble,
        score: response.score,
        shotsLeft: response.shotsLeft,
        timeLeft: response.timeLeft,
        targetScore: response.targetScore,
        comboMultiplier: response.comboMultiplier,
        comboCount: 0,
        availableItems: response.availableItems,
      });
    } catch {
      const levelIdNum = parseInt(levelId, 10);
      const availableColors = BUBBLE_COLORS.slice(0, Math.min(4 + Math.floor(levelIdNum / 2), 6));
      const rows = 5 + Math.floor(levelIdNum / 2);
      const target = 1000 + levelIdNum * 500;
      const mockConfig = {
        id: levelIdNum,
        name: `关卡 ${levelIdNum}`,
        type: (levelIdNum % 3 === 0 ? 'timed' : 'normal') as 'timed' | 'normal' | 'obstacle',
        rows,
        cols: 8,
        bubbleLayout: [] as (string | null)[][],
        maxShots: 30 + levelIdNum * 2,
        targetScore: target,
        timeLimit: levelIdNum % 3 === 0 ? 60 + levelIdNum * 5 : undefined,
        specialBubbles: {},
        availableColors,
      };
      initGame({
        gameId: generateMockGameId(),
        levelId: levelIdNum,
        levelConfig: mockConfig,
        gameState: 'PLAYING',
        bubbles: generateMockBubbles(rows, 8, availableColors),
        currentBubble: createBubble(availableColors),
        nextBubble: createBubble(availableColors),
        score: 0,
        shotsLeft: mockConfig.maxShots,
        timeLeft: mockConfig.timeLimit,
        targetScore: target,
        comboMultiplier: 1,
        comboCount: 0,
        availableItems: [],
      });
    }
  }, [gameId, levelId, restart, initGame, generateMockBubbles, createBubble]);

  const handleUseItem = useCallback(
    async (item: Item) => {
      try {
        const response = await api.useItem(gameId, item.type);
        useItem(item);
        updateScore(response.totalScore);
        updateAvailableItems(response.remainingItems);
        if (response.eliminatedBubbles.length > 0) {
          setEliminatedBubbles(response.eliminatedBubbles);
          if (response.fallingBubbles) {
            setFallingBubbles(response.fallingBubbles);
          }
          setTimeout(() => {
            setEliminatedBubbles([]);
            setFallingBubbles([]);
          }, 600);
        }
        updateGameState(response.gameState);
      } catch {
        useItem(item);
      }
    },
    [gameId, useItem, updateScore, updateAvailableItems, setEliminatedBubbles, setFallingBubbles, updateGameState]
  );

  const earnedStars = calculateStars(score, targetScore);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/levels')}
            className="glass-card w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <h2 className="text-xl font-bold text-white">{levelConfig?.name || `关卡 ${levelId}`}</h2>
          <div className="w-10" />
        </div>

        <BubbleHUD onPause={handlePause} />

        <div className="flex justify-center">
          <GameCanvas onShoot={handleShoot} />
        </div>

        <ItemBar onUseItem={handleUseItem} />
      </div>

      {showPause && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="glass-card p-8 rounded-3xl max-w-sm w-full text-center">
            <h2 className="text-3xl font-bold text-white mb-8">游戏暂停</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleResume}
                className="glass-button w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                继续游戏
              </button>
              <button
                onClick={handleRestart}
                className="glass-button-secondary w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                重新开始
              </button>
              <button
                onClick={() => navigate('/levels')}
                className="glass-button-secondary w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <Home className="w-5 h-5" />
                返回关卡
              </button>
            </div>
          </div>
        </div>
      )}

      {showResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="glass-card p-8 rounded-3xl max-w-sm w-full text-center">
            {gameState === 'WIN' ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text mb-2">
                  胜利!
                </h2>
                <div className="flex justify-center gap-2 my-6">
                  {[1, 2, 3].map((i) => (
                    <Star
                      key={i}
                      className={`w-10 h-10 transition-all ${
                        i <= earnedStars
                          ? 'text-yellow-400 fill-yellow-400 animate-pulse'
                          : 'text-white/20'
                      }`}
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">😢</div>
                <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text mb-6">
                  失败
                </h2>
              </>
            )}

            <div className="glass-card p-4 rounded-xl mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white/60">最终得分</span>
              </div>
              <div className="text-4xl font-bold text-white tabular-nums">
                {score.toLocaleString()}
              </div>
              <div className="text-sm text-white/40 mt-1">
                目标: {targetScore.toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRestart}
                className="glass-button w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                再玩一次
              </button>
              <button
                onClick={() => navigate('/levels')}
                className="glass-button-secondary w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <Home className="w-5 h-5" />
                返回关卡
              </button>
            </div>

            <button
              onClick={() => setShowResult(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
