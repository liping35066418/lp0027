export type BubbleColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'orange';

export type BubbleType = 'normal' | 'obstacle' | 'locked' | 'bomb' | 'colorful';

export type GameState = 'READY' | 'PLAYING' | 'PAUSED' | 'WIN' | 'LOSE';

export type LevelType = 'normal' | 'timed' | 'obstacle';

export type ItemType = 'bomb' | 'range' | 'color_change';

export interface Point {
  x: number;
  y: number;
}

export interface Bubble {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  color: BubbleColor;
  type: BubbleType;
  isEliminated?: boolean;
  isFalling?: boolean;
  lockHits?: number;
}

export interface ChainElimination {
  level: number;
  bubbles: Bubble[];
  score: number;
}

export interface Item {
  id: string;
  type: ItemType;
  name: string;
  count: number;
  effect: {
    range: number;
    targetColor?: BubbleColor;
  };
}

export interface LevelConfig {
  id: number;
  name: string;
  type: LevelType;
  rows: number;
  cols: number;
  bubbleLayout: (string | null)[][];
  maxShots: number;
  targetScore: number;
  timeLimit?: number;
  specialBubbles: {
    obstacle?: number;
    locked?: number;
    bomb?: number;
  };
  availableColors: BubbleColor[];
  items?: Item[];
}

export interface HighScore {
  levelId: number;
  score: number;
  stars: number;
  achievedAt: number;
}

export interface GameData {
  gameId: string;
  levelId: number;
  levelConfig: LevelConfig;
  gameState: GameState;
  bubbles: (Bubble | null)[][];
  currentBubble: Bubble;
  nextBubble: Bubble;
  score: number;
  shotsLeft: number;
  timeLeft?: number;
  targetScore: number;
  comboMultiplier: number;
  comboCount: number;
  availableItems: Item[];
  lastUpdated: number;
  version: number;
}

export interface InitGameRequest {
  levelId: number;
  playerId?: string;
}

export interface InitGameResponse {
  gameId: string;
  levelId: number;
  bubbles: (Bubble | null)[][];
  currentBubble: Bubble;
  nextBubble: Bubble;
  score: number;
  shotsLeft: number;
  timeLeft?: number;
  targetScore: number;
  gameState: GameState;
  availableItems: Item[];
  levelConfig: LevelConfig;
  comboMultiplier: number;
  comboCount: number;
}

export interface CalculateTrajectoryRequest {
  gameId: string;
  angle: number;
  power: number;
}

export interface CalculateTrajectoryResponse {
  trajectory: Point[];
  collisionPoint?: Point;
  targetBubble?: Bubble;
  willBounce: boolean;
  bounceCount: number;
  landingPosition?: { row: number; col: number };
}

export interface ShootBubbleRequest {
  gameId: string;
  angle: number;
  power: number;
}

export interface ShootBubbleResponse {
  gameId: string;
  newBubble: Bubble;
  landedPosition: { row: number; col: number };
  eliminatedBubbles: Bubble[];
  chainReaction: ChainElimination[];
  comboMultiplier: number;
  comboCount: number;
  scoreGained: number;
  totalScore: number;
  shotsLeft: number;
  timeLeft?: number;
  fallingBubbles?: Bubble[];
  gameState: GameState;
  message?: string;
  currentBubble: Bubble;
  nextBubble: Bubble;
  bubbles: (Bubble | null)[][];
}

export interface PauseGameRequest {
  gameId: string;
}

export interface PauseGameResponse {
  gameId: string;
  gameState: 'PAUSED';
  savedAt: number;
}

export interface ResumeGameRequest {
  gameId: string;
}

export interface ResumeGameResponse {
  gameId: string;
  gameState: 'PLAYING';
  bubbles: (Bubble | null)[][];
  currentBubble: Bubble;
  nextBubble: Bubble;
  score: number;
  shotsLeft: number;
  timeLeft?: number;
  comboMultiplier: number;
  availableItems: Item[];
}

export interface RestartGameRequest {
  gameId: string;
}

export interface GetGameStateResponse {
  gameId: string;
  levelId: number;
  gameState: GameState;
  bubbles: (Bubble | null)[][];
  currentBubble: Bubble;
  nextBubble: Bubble;
  score: number;
  shotsLeft: number;
  timeLeft?: number;
  targetScore: number;
  comboMultiplier: number;
  comboCount: number;
  availableItems: Item[];
  lastUpdated: number;
  levelConfig: LevelConfig;
}

export interface UseItemRequest {
  gameId: string;
  itemType: ItemType;
  targetBubbleId?: string;
  targetColor?: BubbleColor;
}

export interface UseItemResponse {
  gameId: string;
  itemType: ItemType;
  eliminatedBubbles: Bubble[];
  scoreGained: number;
  totalScore: number;
  remainingItems: Item[];
  gameState: GameState;
  fallingBubbles?: Bubble[];
  comboMultiplier: number;
}

export interface GetLevelsResponse {
  levels: LevelConfig[];
  unlockedLevelIds: number[];
  highScores: HighScore[];
}

export interface GetHighScoresResponse {
  highScores: HighScore[];
  totalScore: number;
}

export interface SaveScoreRequest {
  levelId: number;
  score: number;
  stars: number;
  gameId: string;
}

export interface SaveScoreResponse {
  success: boolean;
  isNewHighScore: boolean;
  highScores: HighScore[];
}

export const BUBBLE_COLORS: BubbleColor[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];

export const COLOR_HEX: Record<BubbleColor, string> = {
  red: '#FF6B6B',
  blue: '#4ECDC4',
  yellow: '#FFE66D',
  green: '#95E774',
  purple: '#C44DFF',
  orange: '#FF9F43',
};

export const COLOR_GLOW: Record<BubbleColor, string> = {
  red: 'rgba(255, 107, 107, 0.6)',
  blue: 'rgba(78, 205, 196, 0.6)',
  yellow: 'rgba(255, 230, 109, 0.6)',
  green: 'rgba(149, 231, 116, 0.6)',
  purple: 'rgba(196, 77, 255, 0.6)',
  orange: 'rgba(255, 159, 67, 0.6)',
};

export const BUBBLE_RADIUS = 24;
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
export const BUBBLE_VERTICAL_SPACING = BUBBLE_RADIUS * Math.sqrt(3);
export const MIN_ELIMINATION_COUNT = 3;
export const COMBO_TIMEOUT = 3000;
