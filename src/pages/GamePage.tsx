import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  Home,
  Star,
  ArrowLeft,
  Trophy,
  X,
  Zap,
  Sparkles,
  Award,
  Flame,
} from 'lucide-react';
import GameCanvas from '@/components/GameCanvas';
import BubbleHUD from '@/components/BubbleHUD';
import ItemBar from '@/components/ItemBar';
import { useGameStore } from '@/store/gameStore';
import { api } from '@/services/api';
import {
  generateId,
  generateMockGameId,
  calculateStars,
  angleToRad,
  gridToHex,
} from '@/utils/gameUtils';
import {
  BUBBLE_COLORS,
  BUBBLE_RADIUS,
  type SaveScoreResponse,
  type LevelRecord,
  type Bubble,
  type Item,
  type BubbleColor,
} from '../../shared/types';

function mergeBubbles(
  base: (Bubble | null)[][],
  extraEliminated: Bubble[],
  extraFalling: Bubble[]
): (Bubble | null)[][] {
  const out = base.map((row) => [...row]);
  for (const b of extraEliminated) {
    if (out[b.row]?.[b.col]) {
      out[b.row][b.col] = null;
    }
  }
  for (const b of extraFalling) {
    if (out[b.row]?.[b.col]) {
      out[b.row][b.col] = null;
    }
  }
  return out;
}

export default function GamePage() {
  const { levelId = '1' } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showPause, setShowPause] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [saveScoreResult, setSaveScoreResult] = useState<SaveScoreResponse | null>(null);

  const gameId = useGameStore((s) => s.gameId);
  const gameState = useGameStore((s) => s.gameState);
  const score = useGameStore((s) => s.score);
  const targetScore = useGameStore((s) => s.targetScore);
  const currentBubble = useGameStore((s) => s.currentBubble);
  const nextBubble = useGameStore((s) => s.nextBubble);
  const levelConfig = useGameStore((s) => s.levelConfig);
  const maxCombo = useGameStore((s) => s.maxCombo);
  const autoItemTriggeredCount = useGameStore((s) => s.autoItemTriggeredCount);
  const highScores = useGameStore((s) => s.highScores);

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
  const updateEnergy = useGameStore((s) => s.updateEnergy);
  const updateMaxCombo = useGameStore((s) => s.updateMaxCombo);
  const updateAutoItemTriggeredCount = useGameStore((s) => s.updateAutoItemTriggeredCount);
  const clearLastAutoItem = useGameStore((s) => s.clearLastAutoItem);
  const setFlyingBubble = useGameStore((s) => s.setFlyingBubble);
  const setEliminatedBubbles = useGameStore((s) => s.setEliminatedBubbles);
  const setFallingBubbles = useGameStore((s) => s.setFallingBubbles);
  const consumeItem = useGameStore((s) => s.useItem);
  const pause = useGameStore((s) => s.pause);
  const resume = useGameStore((s) => s.resume);
  const restart = useGameStore((s) => s.restart);

  const generateMockBubbles = useCallback(
    (rows: number, cols: number, colors: BubbleColor[]): (Bubble | null)[][] => {
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
    },
    [],
  );

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
          energy: response.energy,
          maxCombo: response.maxCombo,
          autoItemTriggeredCount: response.autoItemTriggeredCount,
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
          energy: 0,
          maxCombo: 0,
          autoItemTriggeredCount: 0,
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
      (async () => {
        try {
          const stars = calculateStars(score, targetScore);
          const res = await api.saveScore(
            parseInt(levelId, 10),
            score,
            stars,
            gameId,
            maxCombo,
            autoItemTriggeredCount,
          );
          setSaveScoreResult(res);
        } catch {
          setSaveScoreResult(null);
        }
      })();
    } else {
      setSaveScoreResult(null);
    }
  }, [gameState, score, targetScore, levelId, gameId, maxCombo, autoItemTriggeredCount]);

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

          let finalEliminated = [...response.eliminatedBubbles];
          let finalFalling = response.fallingBubbles ? [...response.fallingBubbles] : [];
          let finalBubbles = response.bubbles;

          if (response.autoItemTriggered) {
            finalEliminated = [...finalEliminated, ...response.autoItemTriggered.eliminatedBubbles];
            if (response.autoItemTriggered.fallingBubbles) {
              finalFalling = [...finalFalling, ...response.autoItemTriggered.fallingBubbles];
              finalBubbles = mergeBubbles(
                finalBubbles,
                response.autoItemTriggered.eliminatedBubbles,
                response.autoItemTriggered.fallingBubbles,
              );
            }
          }

          setEliminatedBubbles(finalEliminated);
          if (finalFalling.length > 0) {
            setFallingBubbles(finalFalling);
          }
          updateBubbles(finalBubbles);
          updateCurrentBubble(response.currentBubble);
          updateNextBubble(response.nextBubble);
          updateScore(response.totalScore);
          updateCombo(response.comboMultiplier, response.comboCount);
          updateShotsLeft(response.shotsLeft);
          if (response.timeLeft !== undefined) {
            updateTimeLeft(response.timeLeft);
          }
          updateEnergy(response.energy, response.energyGained, response.autoItemTriggered ?? null);
          updateMaxCombo(response.maxCombo);
          updateAutoItemTriggeredCount(response.autoItemTriggeredCount);
          updateGameState(response.gameState);

          if (response.autoItemTriggered) {
            setTimeout(() => clearLastAutoItem(), 2200);
          }

          setTimeout(() => {
            setEliminatedBubbles([]);
            setFallingBubbles([]);
          }, 900);
        } catch {
          setFlyingBubble(null);
          const colors = levelConfig.availableColors;
          updateCurrentBubble(nextBubble || createBubble(colors));
          updateNextBubble(createBubble(colors));
          updateShotsLeft(Math.max(0, useGameStore.getState().shotsLeft - 1));
        }
      }, 500);
    },
    [
      currentBubble,
      nextBubble,
      levelConfig,
      gameId,
      setFlyingBubble,
      setEliminatedBubbles,
      setFallingBubbles,
      updateBubbles,
      updateCurrentBubble,
      updateNextBubble,
      updateScore,
      updateCombo,
      updateShotsLeft,
      updateTimeLeft,
      updateGameState,
      updateEnergy,
      updateMaxCombo,
      updateAutoItemTriggeredCount,
      clearLastAutoItem,
      createBubble,
    ],
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
        comboCount: response.comboCount,
        availableItems: response.availableItems,
        energy: response.energy,
        maxCombo: response.maxCombo,
        autoItemTriggeredCount: response.autoItemTriggeredCount,
      });
    } catch {
      updateGameState('PLAYING');
    }
    setShowPause(false);
  }, [gameId, resume, updateGameState]);

  const handleRestart = useCallback(async () => {
    setShowPause(false);
    setShowResult(false);
    setSaveScoreResult(null);
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
        energy: response.energy,
        maxCombo: response.maxCombo,
        autoItemTriggeredCount: response.autoItemTriggeredCount,
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
        energy: 0,
        maxCombo: 0,
        autoItemTriggeredCount: 0,
      });
    }
  }, [gameId, levelId, restart, initGame, generateMockBubbles, createBubble]);

  const handleUseItem = useCallback(
    async (item: Item) => {
      try {
        const response = await api.useItem(gameId, item.type);
        consumeItem(item);
        updateScore(response.totalScore);
        updateAvailableItems(response.remainingItems);
        updateEnergy(response.energy, 0, null);
        updateMaxCombo(response.maxCombo);
        updateAutoItemTriggeredCount(response.autoItemTriggeredCount);
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
        consumeItem(item);
      }
    },
    [
      gameId,
      consumeItem,
      updateScore,
      updateAvailableItems,
      setEliminatedBubbles,
      setFallingBubbles,
      updateGameState,
      updateEnergy,
      updateMaxCombo,
      updateAutoItemTriggeredCount,
    ],
  );

  const earnedStars = calculateStars(score, targetScore);

  const levelIdNum = parseInt(levelId, 10);
  const historicalHigh = highScores.find((h) => h.levelId === levelIdNum) || null;

  const prevRecord: LevelRecord | null = saveScoreResult?.previousRecord ??
    (historicalHigh
      ? {
          levelId: historicalHigh.levelId,
          score: historicalHigh.score,
          stars: historicalHigh.stars,
          maxCombo: historicalHigh.maxCombo,
          autoItemTriggers: historicalHigh.autoItemTriggers,
          achievedAt: historicalHigh.achievedAt,
        }
      : null);

  const isNewScoreRecord = saveScoreResult
    ? saveScoreResult.newRecords.score
    : prevRecord
      ? score > prevRecord.score
      : score > 0;
  const isNewComboRecord = saveScoreResult
    ? saveScoreResult.newRecords.maxCombo
    : prevRecord
      ? maxCombo > prevRecord.maxCombo
      : maxCombo > 0;
  const isNewItemRecord = saveScoreResult
    ? saveScoreResult.newRecords.autoItemTriggers
    : prevRecord
      ? autoItemTriggeredCount > prevRecord.autoItemTriggers
      : autoItemTriggeredCount > 0;

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
          <div className="glass-card p-8 rounded-3xl max-w-sm w-full text-center relative">
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

            <div className="space-y-3 mb-6">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-white/60 text-sm">最终得分</span>
                  {isNewScoreRecord && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-400/40 font-semibold">
                      <Award className="w-3 h-3" /> 新纪录
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <div className="text-3xl font-bold text-white tabular-nums">
                    {score.toLocaleString()}
                  </div>
                  {prevRecord && (
                    <div className="text-xs text-white/40 line-through">
                      {prevRecord.score.toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                  目标: {targetScore.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-3 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-white/60 text-[11px]">最高连击</span>
                  </div>
                  {isNewComboRecord && (
                    <div className="inline-flex items-center gap-1 text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full border border-orange-400/40 font-semibold mb-1">
                      <Sparkles className="w-2.5 h-2.5" /> 新纪录
                    </div>
                  )}
                  <div className="flex items-baseline justify-center gap-1">
                    <div className="text-xl font-bold text-orange-300 tabular-nums">
                      {maxCombo}
                    </div>
                    {prevRecord && prevRecord.maxCombo > 0 && (
                      <div className="text-[10px] text-white/40 line-through">
                        {prevRecord.maxCombo}
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-card p-3 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span className="text-white/60 text-[11px]">自动道具</span>
                  </div>
                  {isNewItemRecord && autoItemTriggeredCount > 0 && (
                    <div className="inline-flex items-center gap-1 text-[9px] bg-fuchsia-500/20 text-fuchsia-300 px-1.5 py-0.5 rounded-full border border-fuchsia-400/40 font-semibold mb-1">
                      <Sparkles className="w-2.5 h-2.5" /> 新纪录
                    </div>
                  )}
                  <div className="flex items-baseline justify-center gap-1">
                    <div className="text-xl font-bold text-fuchsia-300 tabular-nums">
                      {autoItemTriggeredCount}
                    </div>
                    {prevRecord && prevRecord.autoItemTriggers > 0 && (
                      <div className="text-[10px] text-white/40 line-through">
                        {prevRecord.autoItemTriggers}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {saveScoreResult?.isNewHighScore && (
                <div className="glass-card p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30">
                  <div className="flex items-center justify-center gap-2 text-yellow-300 font-bold">
                    <Sparkles className="w-4 h-4" />
                    恭喜刷新关卡最佳战绩!
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
              )}
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
