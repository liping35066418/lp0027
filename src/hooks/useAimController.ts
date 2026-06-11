import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { calculateAimAngle, calculateTrajectoryPoints, clampAngle } from '@/utils/gameUtils';
import type { Point } from '../../shared/types';

interface AimControllerOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  shooterX: number;
  shooterY: number;
  onShoot?: (angle: number, power: number) => void;
}

export function useAimController({
  canvasRef,
  shooterX,
  shooterY,
  onShoot,
}: AimControllerOptions) {
  const isAiming = useRef(false);
  const lastTrajectoryTime = useRef(0);
  const setAim = useGameStore((s) => s.setAim);
  const setAiming = useGameStore((s) => s.setAiming);
  const gameState = useGameStore((s) => s.gameState);
  const flyingBubble = useGameStore((s) => s.flyingBubble);

  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [canvasRef]
  );

  const updateAim = useCallback(
    (targetX: number, targetY: number) => {
      const now = Date.now();
      if (now - lastTrajectoryTime.current < 100) return;
      lastTrajectoryTime.current = now;

      const angle = calculateAimAngle(shooterX, shooterY, targetX, targetY);
      const clampedAngle = clampAngle(angle);
      const canvas = canvasRef.current;
      const trajectory = calculateTrajectoryPoints(
        shooterX,
        shooterY,
        clampedAngle,
        1,
        canvas?.width || 400
      );
      setAim(clampedAngle, trajectory);
    },
    [shooterX, shooterY, canvasRef, setAim]
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (gameState !== 'PLAYING' || flyingBubble) return;
      isAiming.current = true;
      setAiming(true);
      const coords = getCanvasCoords(clientX, clientY);
      updateAim(coords.x, coords.y);
    },
    [gameState, flyingBubble, setAiming, getCanvasCoords, updateAim]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isAiming.current) return;
      const coords = getCanvasCoords(clientX, clientY);
      updateAim(coords.x, coords.y);
    },
    [getCanvasCoords, updateAim]
  );

  const handleEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (!isAiming.current) return;
      isAiming.current = false;
      setAiming(false);

      if (gameState === 'PLAYING' && !flyingBubble) {
        const coords = getCanvasCoords(clientX, clientY);
        const angle = calculateAimAngle(shooterX, shooterY, coords.x, coords.y);
        const clampedAngle = clampAngle(angle);
        if (onShoot) {
          onShoot(clampedAngle, 1);
        }
      }
    },
    [gameState, flyingBubble, setAiming, getCanvasCoords, shooterX, shooterY, onShoot]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        e.preventDefault();
        handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [canvasRef, handleStart, handleMove, handleEnd]);
}
