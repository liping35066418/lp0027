import type { Bubble, Point } from '../../shared/types';
import { COLOR_HEX, COLOR_GLOW, BUBBLE_RADIUS } from '../../shared/types';

interface Particle {
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export function drawBubble(
  ctx: CanvasRenderingContext2D,
  bubble: { x: number; y: number; color: Bubble['color']; type: Bubble['type'] },
  radius: number = BUBBLE_RADIUS
): void {
  const { x, y, color, type } = bubble;
  const baseColor = COLOR_HEX[color] || '#FFFFFF';
  const glowColor = COLOR_GLOW[color] || 'rgba(255,255,255,0.6)';

  ctx.save();

  if (type === 'obstacle') {
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, '#6B7280');
    gradient.addColorStop(1, '#374151');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'locked') {
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(1, shadeColor(baseColor, -30));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1F2937';
    ctx.fillRect(x - radius * 0.4, y - radius * 0.2, radius * 0.8, radius * 0.5);
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.1, radius * 0.3, Math.PI, 0);
    ctx.stroke();
  } else if (type === 'bomb') {
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF6B6B';
    ctx.font = `bold ${radius}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', x, y);
  } else if (type === 'colorful') {
    const rainbow = ['#FF6B6B', '#FFE66D', '#95E774', '#4ECDC4', '#C44DFF'];
    rainbow.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, radius - i * 3, (i * Math.PI * 2) / 5, ((i + 1) * Math.PI * 2) / 5);
      ctx.lineTo(x, y);
      ctx.fill();
    });
  } else {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;

    const gradient = ctx.createRadialGradient(
      x - radius * 0.3,
      y - radius * 0.3,
      0,
      x,
      y,
      radius
    );
    gradient.addColorStop(0, lightenColor(baseColor, 40));
    gradient.addColorStop(0.5, baseColor);
    gradient.addColorStop(1, shadeColor(baseColor, -20));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(
      x - radius * 0.35,
      y - radius * 0.4,
      radius * 0.25,
      radius * 0.15,
      -Math.PI / 6,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.2, y - radius * 0.15, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string = 'rgba(255, 255, 255, 0.6)'
): void {
  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  if (points.length > 0) {
    const last = points[points.length - 1];
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawShooter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  currentBubble: Bubble | null,
  nextBubble: Bubble | null
): void {
  const rad = (angle * Math.PI) / 180;

  ctx.save();

  const baseGradient = ctx.createRadialGradient(x, y, 0, x, y, 50);
  baseGradient.addColorStop(0, 'rgba(78, 205, 196, 0.3)');
  baseGradient.addColorStop(1, 'rgba(78, 205, 196, 0)');
  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  ctx.arc(x, y, 50, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 38, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(15, 12, 41, 0.8)';
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-rad);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(0, -8, 45, 16);
  ctx.fillStyle = '#4ECDC4';
  ctx.fillRect(30, -6, 20, 12);

  ctx.restore();

  if (currentBubble) {
    drawBubble(ctx, { x, y, color: currentBubble.color, type: currentBubble.type }, 26);
  }

  if (nextBubble) {
    const nextX = x + 70;
    const nextY = y + 10;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(nextX, nextY, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(nextX, nextY, 22, 0, Math.PI * 2);
    ctx.stroke();

    drawBubble(ctx, { x: nextX, y: nextY, color: nextBubble.color, type: nextBubble.type }, 18);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', nextX, nextY + 38);
  }

  ctx.restore();
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void {
  ctx.save();

  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gradientBg: boolean = true
): void {
  if (gradientBg) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0F0C29');
    gradient.addColorStop(0.5, '#302B63');
    gradient.addColorStop(1, '#24243E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
      const sx = (i * 137.5) % width;
      const sy = (i * 73.3) % height;
      const size = ((i * 17) % 3) + 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.clearRect(0, 0, width, height);
  }
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)
  );
}

function lightenColor(color: string, percent: number): string {
  return shadeColor(color, percent);
}

export function createExplosionParticles(
  x: number,
  y: number,
  color: string,
  count: number = 12
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x,
      y,
      color,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      size: 3 + Math.random() * 4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
    } as Particle & { vx: number; vy: number });
  }
  return particles;
}
