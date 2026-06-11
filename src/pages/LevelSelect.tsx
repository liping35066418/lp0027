import { ArrowLeft, Star, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { api } from '@/services/api';
import type { LevelConfig, HighScore } from '../../shared/types';

const MOCK_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '初入太空',
    type: 'normal',
    rows: 5,
    cols: 8,
    bubbleLayout: [],
    maxShots: 30,
    targetScore: 1000,
    availableColors: ['red', 'blue', 'yellow', 'green'],
    specialBubbles: {},
  },
  {
    id: 2,
    name: '星云漫游',
    type: 'normal',
    rows: 6,
    cols: 8,
    bubbleLayout: [],
    maxShots: 35,
    targetScore: 2000,
    availableColors: ['red', 'blue', 'yellow', 'green', 'purple'],
    specialBubbles: {},
  },
  {
    id: 3,
    name: '流星追赶',
    type: 'timed',
    rows: 6,
    cols: 8,
    bubbleLayout: [],
    maxShots: 999,
    targetScore: 2500,
    timeLimit: 60,
    availableColors: ['red', 'blue', 'yellow', 'green', 'purple'],
    specialBubbles: {},
  },
  {
    id: 4,
    name: '陨石地带',
    type: 'obstacle',
    rows: 7,
    cols: 8,
    bubbleLayout: [],
    maxShots: 40,
    targetScore: 3000,
    availableColors: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
    specialBubbles: { obstacle: 5 },
  },
  {
    id: 5,
    name: '黑洞挑战',
    type: 'normal',
    rows: 8,
    cols: 8,
    bubbleLayout: [],
    maxShots: 45,
    targetScore: 4000,
    availableColors: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
    specialBubbles: { locked: 3, bomb: 2 },
  },
  {
    id: 6,
    name: '银河竞速',
    type: 'timed',
    rows: 7,
    cols: 8,
    bubbleLayout: [],
    maxShots: 999,
    targetScore: 5000,
    timeLimit: 90,
    availableColors: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
    specialBubbles: {},
  },
];

export default function LevelSelect() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const levels = useGameStore((s) => s.levels);
  const unlockedLevelIds = useGameStore((s) => s.unlockedLevelIds);
  const highScores = useGameStore((s) => s.highScores);
  const setLevels = useGameStore((s) => s.setLevels);
  const updateScores = useGameStore((s) => s.updateScores);

  useEffect(() => {
    const loadLevels = async () => {
      try {
        const response = await api.getLevels();
        setLevels(response.levels);
        updateScores(response.highScores, response.unlockedLevelIds);
      } catch {
        setLevels(MOCK_LEVELS);
        const mockScores: HighScore[] = [
          { levelId: 1, score: 1500, stars: 2, achievedAt: Date.now(), maxCombo: 0, autoItemTriggers: 0 },
          { levelId: 2, score: 800, stars: 1, achievedAt: Date.now(), maxCombo: 0, autoItemTriggers: 0 },
        ];
        updateScores(mockScores, [1, 2]);
      } finally {
        setLoading(false);
      }
    };
    loadLevels();
  }, [setLevels, updateScores]);

  const displayLevels = levels.length > 0 ? levels : MOCK_LEVELS;

  const getStarsForLevel = (levelId: number): number => {
    const score = highScores.find((s) => s.levelId === levelId);
    return score?.stars || 0;
  };

  const isUnlocked = (levelId: number): boolean => {
    return unlockedLevelIds.includes(levelId);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="glass-card w-12 h-12 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <h1 className="text-3xl font-bold text-white">选择关卡</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {displayLevels.map((level) => {
              const unlocked = isUnlocked(level.id);
              const stars = getStarsForLevel(level.id);
              const highScore = highScores.find((s) => s.levelId === level.id);

              return (
                <button
                  key={level.id}
                  onClick={() => unlocked && navigate(`/game/${level.id}`)}
                  disabled={!unlocked}
                  className={`glass-card p-5 rounded-2xl text-left transition-all relative ${
                    unlocked
                      ? 'hover:scale-105 active:scale-95 hover:bg-white/10 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-white/30">{level.id.toString().padStart(2, '0')}</span>
                    {!unlocked && <Lock className="w-5 h-5 text-white/40" />}
                  </div>

                  <div className="text-lg font-semibold text-white mb-2">{level.name}</div>

                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3].map((i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>

                  {highScore && (
                    <div className="text-sm text-white/50">
                      最高分: {highScore.score.toLocaleString()}
                    </div>
                  )}

                  <div className="mt-2 flex gap-2 flex-wrap">
                    {level.type === 'timed' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                        限时
                      </span>
                    )}
                    {level.type === 'obstacle' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
                        障碍
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
