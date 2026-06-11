import { Pause, Trophy, Target, Clock, Zap, Battery } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { formatTime } from '@/utils/gameUtils';
import { MAX_ENERGY, AUTO_ITEM_NAMES } from '../../shared/types';

interface BubbleHUDProps {
  onPause: () => void;
}

export default function BubbleHUD({ onPause }: BubbleHUDProps) {
  const score = useGameStore((s) => s.score);
  const shotsLeft = useGameStore((s) => s.shotsLeft);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const targetScore = useGameStore((s) => s.targetScore);
  const comboMultiplier = useGameStore((s) => s.comboMultiplier);
  const comboCount = useGameStore((s) => s.comboCount);
  const levelConfig = useGameStore((s) => s.levelConfig);
  const energy = useGameStore((s) => s.energy);
  const lastAutoItem = useGameStore((s) => s.lastAutoItem);

  const isTimed = levelConfig?.type === 'timed';
  const energyPct = Math.min(100, Math.max(0, (energy / MAX_ENERGY) * 100));
  const energyFull = energy >= MAX_ENERGY;

  return (
    <div className="w-full flex flex-wrap justify-between items-start gap-3 mb-4">
      <div className="flex gap-3 flex-wrap">
        <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider">Score</div>
            <div className="text-xl font-bold text-white tabular-nums">{score.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider">Target</div>
            <div className="text-xl font-bold text-white tabular-nums">{targetScore.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 min-w-[140px]">
          <Battery className={`w-5 h-5 ${energyFull ? 'text-fuchsia-400 animate-pulse' : 'text-violet-400'}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Energy</div>
              {lastAutoItem && (
                <div className="text-[10px] text-fuchsia-300 font-semibold">
                  {AUTO_ITEM_NAMES[lastAutoItem.itemType]}!
                </div>
              )}
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  energyFull
                    ? 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 animate-pulse'
                    : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                }`}
                style={{ width: `${energyPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {isTimed ? (
          <div className={`glass-card px-4 py-2 rounded-xl flex items-center gap-2 ${timeLeft <= 10 ? 'animate-pulse border-red-500/50' : ''}`}>
            <Clock className={`w-5 h-5 ${timeLeft <= 10 ? 'text-red-400' : 'text-blue-400'}`} />
            <div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Time</div>
              <div className={`text-xl font-bold tabular-nums ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        ) : (
          <div className={`glass-card px-4 py-2 rounded-xl flex items-center gap-2 ${shotsLeft <= 5 ? 'animate-pulse border-red-500/50' : ''}`}>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
              ●
            </div>
            <div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Shots</div>
              <div className={`text-xl font-bold tabular-nums ${shotsLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                {shotsLeft}
              </div>
            </div>
          </div>
        )}

        {comboCount > 0 && comboMultiplier > 1 && (
          <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 border-yellow-500/50 animate-bounce-subtle">
            <Zap className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-[10px] text-yellow-400/70 uppercase tracking-wider">Combo</div>
              <div className="text-xl font-bold text-yellow-400 tabular-nums">
                x{comboMultiplier}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onPause}
          className="glass-card px-3 py-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
        >
          <Pause className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
