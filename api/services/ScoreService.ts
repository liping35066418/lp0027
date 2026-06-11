import type { HighScore, SaveScoreRequest, SaveScoreResponse, GetHighScoresResponse } from '../../shared/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const SCORES_FILE = path.join(DATA_DIR, 'highscores.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadScores(): HighScore[] {
  ensureDataDir();
  try {
    if (fs.existsSync(SCORES_FILE)) {
      const data = fs.readFileSync(SCORES_FILE, 'utf-8');
      return JSON.parse(data) as HighScore[];
    }
  } catch {
    console.warn('Failed to load scores, starting fresh');
  }
  return [];
}

function saveScores(scores: HighScore[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save scores:', err);
  }
}

const BASE_SCORE_PER_BUBBLE = 10;
const FALLING_BUBBLE_MULTIPLIER = 2;

class ScoreService {
  private highScores: HighScore[] = loadScores();

  calculateEliminationScore(
    bubbleCount: number,
    comboLevel: number,
    comboMultiplier: number,
  ): number {
    const baseScore = bubbleCount * BASE_SCORE_PER_BUBBLE;
    const comboBonus = Math.max(1, comboLevel) * Math.max(1, comboMultiplier);
    const countBonus = bubbleCount > 3 ? Math.pow(1.5, bubbleCount - 3) : 1;
    return Math.floor(baseScore * comboBonus * countBonus);
  }

  calculateChainBonus(chainLevel: number): number {
    if (chainLevel <= 0) return 0;
    return Math.floor(50 * Math.pow(2, chainLevel - 1));
  }

  calculateFallingScore(fallingCount: number): number {
    if (fallingCount <= 0) return 0;
    return fallingCount * BASE_SCORE_PER_BUBBLE * FALLING_BUBBLE_MULTIPLIER;
  }

  calculateStars(score: number, targetScore: number): number {
    if (targetScore <= 0) return 0;
    const ratio = score / targetScore;
    if (ratio >= 1.5) {
      return 3;
    } else if (ratio >= 1.2) {
      return 2;
    } else if (ratio >= 1.0) {
      return 1;
    }
    return 0;
  }

  calculateComboMultiplier(comboCount: number): number {
    if (comboCount <= 1) return 1;
    return 1 + (comboCount - 1) * 0.5;
  }

  saveScore(request: SaveScoreRequest): SaveScoreResponse {
    const { levelId, score, stars } = request;

    const existingIndex = this.highScores.findIndex(s => s.levelId === levelId);
    let isNewHighScore = false;

    if (existingIndex >= 0) {
      const existing = this.highScores[existingIndex];
      if (score > existing.score) {
        this.highScores[existingIndex] = {
          levelId,
          score,
          stars: Math.max(existing.stars, stars),
          achievedAt: Date.now(),
        };
        isNewHighScore = true;
      } else if (stars > existing.stars) {
        this.highScores[existingIndex] = {
          ...existing,
          stars,
          achievedAt: Date.now(),
        };
      }
    } else {
      this.highScores.push({
        levelId,
        score,
        stars,
        achievedAt: Date.now(),
      });
      isNewHighScore = true;
    }

    saveScores(this.highScores);

    return {
      success: true,
      isNewHighScore,
      highScores: [...this.highScores],
    };
  }

  getHighScores(): HighScore[] {
    return [...this.highScores];
  }

  getHighScoresResponse(): GetHighScoresResponse {
    const totalScore = this.highScores.reduce((sum, s) => sum + s.score, 0);
    return {
      highScores: [...this.highScores],
      totalScore,
    };
  }

  getScoreForLevel(levelId: number): HighScore | undefined {
    return this.highScores.find(s => s.levelId === levelId);
  }
}

export default new ScoreService();
