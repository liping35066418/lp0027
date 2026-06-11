import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';

interface GameLoopOptions {
  onFrame?: () => void;
  enabled?: boolean;
}

export function useGameLoop({ onFrame, enabled = true }: GameLoopOptions = {}) {
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gameState = useGameStore((s) => s.gameState);
  const updateParticles = useGameStore((s) => s.updateParticles);
  const updateFallingBubbles = useGameStore((s) => s.updateFallingBubbles);
  const flyingBubble = useGameStore((s) => s.flyingBubble);
  const setFlyingBubble = useGameStore((s) => s.setFlyingBubble);
  const levelConfig = useGameStore((s) => s.levelConfig);
  const decrementTime = useGameStore((s) => s.decrementTime);

  useEffect(() => {
    if (!enabled) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      if (gameState === 'PLAYING') {
        if (flyingBubble) {
          const newX = flyingBubble.x + flyingBubble.vx;
          const newY = flyingBubble.y + flyingBubble.vy;

          if (newY < -50) {
            setFlyingBubble(null);
          } else {
            setFlyingBubble({
              ...flyingBubble,
              x: newX,
              y: newY,
            });
          }
        }

        updateParticles();
        updateFallingBubbles();

        if (onFrame) {
          onFrame();
        }
      }

      lastTimeRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, gameState, flyingBubble, updateParticles, updateFallingBubbles, setFlyingBubble, onFrame]);

  useEffect(() => {
    if (gameState === 'PLAYING' && levelConfig?.type === 'timed' && levelConfig.timeLimit) {
      timerRef.current = setInterval(() => {
        decrementTime();
      }, 1000);
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, levelConfig, decrementTime]);

  return {
    isRunning: gameState === 'PLAYING',
  };
}
