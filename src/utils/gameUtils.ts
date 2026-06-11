import type { Point, BubbleColor } from '../../shared/types';
import { BUBBLE_RADIUS, BUBBLE_DIAMETER, BUBBLE_VERTICAL_SPACING } from '../../shared/types';

export interface GridCoord {
  row: number;
  col: number;
}

export function hexToGrid(x: number, y: number, radius: number = BUBBLE_RADIUS): GridCoord {
  const row = Math.round((y - radius) / BUBBLE_VERTICAL_SPACING);
  const rowOffset = row % 2 === 1 ? radius : 0;
  const col = Math.round((x - radius - rowOffset) / BUBBLE_DIAMETER);
  return { row, col };
}

export function gridToHex(
  row: number,
  col: number,
  radius: number = BUBBLE_RADIUS,
  offsetX: number = 0,
  offsetY: number = 0
): Point {
  const x = offsetX + radius + col * BUBBLE_DIAMETER + (row % 2 === 1 ? radius : 0);
  const y = offsetY + radius + row * BUBBLE_VERTICAL_SPACING;
  return { x, y };
}

export function getNeighbors(row: number, col: number): GridCoord[] {
  const isOddRow = row % 2 === 1;
  if (isOddRow) {
    return [
      { row: row - 1, col: col },
      { row: row - 1, col: col + 1 },
      { row, col: col - 1 },
      { row, col: col + 1 },
      { row: row + 1, col: col },
      { row: row + 1, col: col + 1 },
    ];
  }
  return [
    { row: row - 1, col: col - 1 },
    { row: row - 1, col: col },
    { row, col: col - 1 },
    { row, col: col + 1 },
    { row: row + 1, col: col - 1 },
    { row: row + 1, col: col },
  ];
}

export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function clampAngle(angle: number): number {
  return Math.max(10, Math.min(170, angle));
}

export function angleToRad(angle: number): number {
  return (angle * Math.PI) / 180;
}

export function radToAngle(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function calculateAimAngle(
  shooterX: number,
  shooterY: number,
  targetX: number,
  targetY: number
): number {
  const dx = targetX - shooterX;
  const dy = shooterY - targetY;
  let angle = radToAngle(Math.atan2(dy, dx));
  return clampAngle(angle);
}

export function calculateTrajectoryPoints(
  startX: number,
  startY: number,
  angle: number,
  power: number = 1,
  canvasWidth: number = 400,
  maxPoints: number = 50,
  radius: number = BUBBLE_RADIUS
): Point[] {
  const points: Point[] = [];
  const rad = angleToRad(angle);
  const speed = 12 * power;
  let vx = Math.cos(rad) * speed;
  let vy = -Math.sin(rad) * speed;
  let x = startX;
  let y = startY;

  points.push({ x, y });

  for (let i = 0; i < maxPoints; i++) {
    x += vx * 2;
    y += vy * 2;

    if (x - radius < 0) {
      x = radius;
      vx = Math.abs(vx);
    } else if (x + radius > canvasWidth) {
      x = canvasWidth - radius;
      vx = -Math.abs(vx);
    }

    if (y < 0) break;

    points.push({ x, y });
  }

  return points;
}

export function getRandomColor(availableColors: BubbleColor[]): BubbleColor {
  return availableColors[Math.floor(Math.random() * availableColors.length)];
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateStars(score: number, targetScore: number): number {
  const ratio = score / targetScore;
  if (ratio >= 1.5) return 3;
  if (ratio >= 1.2) return 2;
  if (ratio >= 1) return 1;
  return 0;
}
