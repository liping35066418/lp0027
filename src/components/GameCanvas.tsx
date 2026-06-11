import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useAimController } from '@/hooks/useAimController';
import {
  clearCanvas,
  drawBubble,
  drawTrajectory,
  drawShooter,
  drawParticles,
  createExplosionParticles,
} from '@/utils/canvas';
import { gridToHex, angleToRad } from '@/utils/gameUtils';
import { COLOR_HEX, BUBBLE_RADIUS } from '../../shared/types';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const SHOOTER_X = CANVAS_WIDTH / 2;
const SHOOTER_Y = CANVAS_HEIGHT - 80;
const GRID_OFFSET_X = 0;
const GRID_OFFSET_Y = 20;

interface GameCanvasProps {
  onShoot?: (angle: number, power: number) => void;
}

export default function GameCanvas({ onShoot }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const bubbles = useGameStore((s) => s.bubbles);
  const currentBubble = useGameStore((s) => s.currentBubble);
  const nextBubble = useGameStore((s) => s.nextBubble);
  const trajectory = useGameStore((s) => s.trajectory);
  const aimAngle = useGameStore((s) => s.aimAngle);
  const flyingBubble = useGameStore((s) => s.flyingBubble);
  const particles = useGameStore((s) => s.particles);
  const addParticles = useGameStore((s) => s.addParticles);
  const fallingBubbles = useGameStore((s) => s.fallingBubbles);
  const eliminatedBubbles = useGameStore((s) => s.eliminatedBubbles);

  useEffect(() => {
    if (eliminatedBubbles.length > 0) {
      for (const bubble of eliminatedBubbles) {
        const pos = gridToHex(bubble.row, bubble.col, BUBBLE_RADIUS, GRID_OFFSET_X, GRID_OFFSET_Y);
        const color = COLOR_HEX[bubble.color] || '#FFFFFF';
        const newParticles = createExplosionParticles(pos.x, pos.y, color, 16);
        addParticles(newParticles as unknown as typeof particles);
      }
    }
  }, [eliminatedBubbles, addParticles]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    clearCanvas(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, true);

    for (const row of bubbles) {
      for (const bubble of row) {
        if (bubble) {
          const pos = gridToHex(bubble.row, bubble.col, BUBBLE_RADIUS, GRID_OFFSET_X, GRID_OFFSET_Y);
          drawBubble(ctx, { x: pos.x, y: pos.y, color: bubble.color, type: bubble.type });
        }
      }
    }

    for (const bubble of fallingBubbles) {
      drawBubble(ctx, { x: bubble.x, y: bubble.y, color: bubble.color, type: bubble.type });
    }

    if (trajectory.length > 0 && !flyingBubble) {
      drawTrajectory(ctx, trajectory, 'rgba(78, 205, 196, 0.8)');
    }

    if (flyingBubble) {
      drawBubble(ctx, {
        x: flyingBubble.x,
        y: flyingBubble.y,
        color: flyingBubble.color,
        type: flyingBubble.type,
      });
    }

    drawShooter(ctx, SHOOTER_X, SHOOTER_Y, aimAngle, currentBubble, nextBubble);

    if (particles.length > 0) {
      drawParticles(ctx, particles);
    }
  }, [bubbles, fallingBubbles, trajectory, flyingBubble, aimAngle, currentBubble, nextBubble, particles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      ctxRef.current = canvas.getContext('2d');
      render();
    }
  }, [render]);

  useGameLoop({ onFrame: render });

  useAimController({
    canvasRef,
    shooterX: SHOOTER_X,
    shooterY: SHOOTER_Y,
    onShoot,
  });

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block rounded-2xl border border-white/10 shadow-2xl shadow-purple-500/20"
      style={{ touchAction: 'none' }}
    />
  );
}

export { CANVAS_WIDTH, CANVAS_HEIGHT, SHOOTER_X, SHOOTER_Y, GRID_OFFSET_X, GRID_OFFSET_Y };
