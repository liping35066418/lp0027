import { Play, Grid3X3, Trophy, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FLOATING_BUBBLES = [
  { color: '#FF6B6B', delay: 0, size: 40, x: '10%' },
  { color: '#4ECDC4', delay: 1, size: 60, x: '25%' },
  { color: '#FFE66D', delay: 0.5, size: 35, x: '45%' },
  { color: '#95E774', delay: 1.5, size: 50, x: '65%' },
  { color: '#C44DFF', delay: 0.8, size: 45, x: '80%' },
  { color: '#FF9F43', delay: 2, size: 38, x: '90%' },
];

export default function Home() {
  const navigate = useNavigate();
  const [soundOn, setSoundOn] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const stars = document.querySelectorAll('.floating-bubble');
    stars.forEach((star) => {
      const s = star as HTMLElement;
      s.style.animationDelay = s.dataset.delay || '0s';
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {FLOATING_BUBBLES.map((bubble, i) => (
        <div
          key={i}
          className="floating-bubble absolute rounded-full opacity-40"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: bubble.x,
            bottom: '-100px',
            background: `radial-gradient(circle at 30% 30%, ${bubble.color}, ${bubble.color}88)`,
            boxShadow: `0 0 30px ${bubble.color}66`,
            animation: `floatUp ${8 + i}s ease-in-out infinite`,
            animationDelay: `${bubble.delay}s`,
          }}
        />
      ))}

      <div className="relative z-10 text-center mb-12">
        <div className="relative">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-wider">
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
              BUBBLE
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-yellow-400 to-pink-400 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]" style={{ animationDelay: '0.5s' }}>
              SHOOTER
            </span>
          </h1>
          <p className="text-white/60 text-lg mt-4">经典泡泡龙 · 太空霓虹版</p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => navigate('/levels')}
          className="glass-button w-full py-4 px-8 rounded-2xl text-xl font-bold text-white flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all group"
        >
          <Play className="w-6 h-6 group-hover:animate-pulse" fill="currentColor" />
          开始游戏
        </button>

        <button
          onClick={() => navigate('/levels')}
          className="glass-button-secondary w-full py-4 px-8 rounded-2xl text-lg font-semibold text-white flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
        >
          <Grid3X3 className="w-5 h-5" />
          关卡选择
        </button>

        <button
          onClick={() => {}}
          className="glass-button-secondary w-full py-4 px-8 rounded-2xl text-lg font-semibold text-white flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
        >
          <Trophy className="w-5 h-5 text-yellow-400" />
          最高分
        </button>
      </div>

      <div className="absolute top-6 right-6 flex gap-2 z-10">
        <button
          onClick={() => setSoundOn(!soundOn)}
          className="glass-card w-12 h-12 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
        >
          {soundOn ? <Volume2 className="w-5 h-5 text-white/70" /> : <VolumeX className="w-5 h-5 text-white/40" />}
        </button>
        <button
          onClick={() => setShowHelp(true)}
          className="glass-card w-12 h-12 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
        >
          <HelpCircle className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={() => setShowHelp(false)}>
          <div className="glass-card p-8 rounded-3xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4 text-center">游戏说明</h2>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">•</span>
                <span>点击并拖动屏幕瞄准，松开发射泡泡</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-400 font-bold">•</span>
                <span>使3个或以上同色泡泡相连即可消除</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold">•</span>
                <span>连续消除触发连击，获得更高分数</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 font-bold">•</span>
                <span>使用道具可以更快通关</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">•</span>
                <span>达到目标分数即可获得星星评价</span>
              </li>
            </ul>
            <button
              onClick={() => setShowHelp(false)}
              className="glass-button w-full py-3 mt-6 rounded-xl font-semibold text-white"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
