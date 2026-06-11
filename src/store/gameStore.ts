import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState,
  Bubble,
  Point,
  Item,
  LevelConfig,
  HighScore,
  AutoItemTriggeredResult,
} from '../../shared/types';

interface FlyingBubble {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: Bubble['color'];
  type: Bubble['type'];
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface GameStore {
  gameId: string;
  levelId: number;
  levelConfig: LevelConfig | null;
  gameState: GameState;
  bubbles: (Bubble | null)[][];
  currentBubble: Bubble | null;
  nextBubble: Bubble | null;
  score: number;
  shotsLeft: number;
  timeLeft: number;
  targetScore: number;
  comboMultiplier: number;
  comboCount: number;
  trajectory: Point[];
  aiming: boolean;
  aimAngle: number;
  availableItems: Item[];
  highScores: HighScore[];
  levels: LevelConfig[];
  unlockedLevelIds: number[];
  flyingBubble: FlyingBubble | null;
  particles: Particle[];
  eliminatedBubbles: Bubble[];
  fallingBubbles: Bubble[];
  selectedItem: Item | null;

  energy: number;
  maxCombo: number;
  autoItemTriggeredCount: number;
  lastAutoItem: AutoItemTriggeredResult | null;

  initGame: (data: {
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
    energy?: number;
    maxCombo?: number;
    autoItemTriggeredCount?: number;
  }) => void;
  setAim: (angle: number, trajectory: Point[]) => void;
  setAiming: (aiming: boolean) => void;
  shoot: (angle: number, power: number, onComplete?: () => void) => void;
  setFlyingBubble: (bubble: FlyingBubble | null) => void;
  addParticles: (particles: Particle[]) => void;
  updateParticles: () => void;
  setEliminatedBubbles: (bubbles: Bubble[]) => void;
  setFallingBubbles: (bubbles: Bubble[]) => void;
  updateFallingBubbles: () => void;
  pause: () => void;
  resume: (data: {
    bubbles: (Bubble | null)[][];
    currentBubble: Bubble;
    nextBubble: Bubble;
    score: number;
    shotsLeft: number;
    timeLeft?: number;
    comboMultiplier: number;
    comboCount?: number;
    availableItems: Item[];
    energy?: number;
    maxCombo?: number;
    autoItemTriggeredCount?: number;
  }) => void;
  restart: () => void;
  useItem: (item: Item, targetBubbleId?: string, targetColor?: Bubble['color']) => void;
  selectItem: (item: Item | null) => void;
  loadState: (state: Partial<GameStore>) => void;
  updateScores: (highScores: HighScore[], unlockedLevelIds: number[]) => void;
  setLevels: (levels: LevelConfig[]) => void;
  updateGameState: (state: GameState) => void;
  updateScore: (score: number) => void;
  updateBubbles: (bubbles: (Bubble | null)[][]) => void;
  updateCurrentBubble: (bubble: Bubble) => void;
  updateNextBubble: (bubble: Bubble) => void;
  updateCombo: (multiplier: number, count: number) => void;
  updateShotsLeft: (shots: number) => void;
  updateTimeLeft: (time: number) => void;
  updateAvailableItems: (items: Item[]) => void;
  decrementTime: () => void;
  updateEnergy: (energy: number, gained?: number, autoTriggered?: AutoItemTriggeredResult | null) => void;
  updateMaxCombo: (maxCombo: number) => void;
  updateAutoItemTriggeredCount: (count: number) => void;
  clearLastAutoItem: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      gameId: '',
      levelId: 0,
      levelConfig: null,
      gameState: 'READY',
      bubbles: [],
      currentBubble: null,
      nextBubble: null,
      score: 0,
      shotsLeft: 0,
      timeLeft: 0,
      targetScore: 0,
      comboMultiplier: 1,
      comboCount: 0,
      trajectory: [],
      aiming: false,
      aimAngle: 90,
      availableItems: [],
      highScores: [],
      levels: [],
      unlockedLevelIds: [1],
      flyingBubble: null,
      particles: [],
      eliminatedBubbles: [],
      fallingBubbles: [],
      selectedItem: null,
      energy: 0,
      maxCombo: 0,
      autoItemTriggeredCount: 0,
      lastAutoItem: null,

      initGame: (data) => set({
        gameId: data.gameId,
        levelId: data.levelId,
        levelConfig: data.levelConfig,
        gameState: data.gameState,
        bubbles: data.bubbles,
        currentBubble: data.currentBubble,
        nextBubble: data.nextBubble,
        score: data.score,
        shotsLeft: data.shotsLeft,
        timeLeft: data.timeLeft || 0,
        targetScore: data.targetScore,
        comboMultiplier: data.comboMultiplier,
        comboCount: data.comboCount,
        availableItems: data.availableItems,
        trajectory: [],
        aiming: false,
        aimAngle: 90,
        flyingBubble: null,
        particles: [],
        eliminatedBubbles: [],
        fallingBubbles: [],
        selectedItem: null,
        energy: data.energy ?? 0,
        maxCombo: data.maxCombo ?? 0,
        autoItemTriggeredCount: data.autoItemTriggeredCount ?? 0,
        lastAutoItem: null,
      }),

      setAim: (angle, trajectory) => set({ aimAngle: angle, trajectory }),
      setAiming: (aiming) => set({ aiming }),

      shoot: (_angle, _power, onComplete) => {
        set((state) => ({
          gameState: state.gameState,
          trajectory: [],
          aiming: false,
        }));
        if (onComplete) onComplete();
      },

      setFlyingBubble: (bubble) => set({ flyingBubble: bubble }),

      addParticles: (newParticles) => set((state) => ({
        particles: [...state.particles, ...newParticles],
      })),

      updateParticles: () => set((state) => ({
        particles: state.particles
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1,
            life: p.life - 1,
          }))
          .filter((p) => p.life > 0),
      })),

      setEliminatedBubbles: (bubbles) => set({ eliminatedBubbles: bubbles }),

      setFallingBubbles: (bubbles) => set({ fallingBubbles: bubbles }),

      updateFallingBubbles: () => set((state) => ({
        fallingBubbles: state.fallingBubbles
          .map((b) => ({ ...b, y: b.y + 4 }))
          .filter((b) => b.y < 1000),
      })),

      pause: () => set({ gameState: 'PAUSED' }),

      resume: (data) => set({
        gameState: 'PLAYING',
        bubbles: data.bubbles,
        currentBubble: data.currentBubble,
        nextBubble: data.nextBubble,
        score: data.score,
        shotsLeft: data.shotsLeft,
        timeLeft: data.timeLeft || 0,
        comboMultiplier: data.comboMultiplier,
        comboCount: data.comboCount ?? 0,
        availableItems: data.availableItems,
        energy: data.energy ?? 0,
        maxCombo: data.maxCombo ?? 0,
        autoItemTriggeredCount: data.autoItemTriggeredCount ?? 0,
      }),

      restart: () => set({
        gameState: 'READY',
        score: 0,
        comboMultiplier: 1,
        comboCount: 0,
        particles: [],
        flyingBubble: null,
        eliminatedBubbles: [],
        fallingBubbles: [],
        energy: 0,
        maxCombo: 0,
        autoItemTriggeredCount: 0,
        lastAutoItem: null,
      }),

      useItem: (item, _targetBubbleId, _targetColor) => set((state) => ({
        availableItems: state.availableItems.map((i) =>
          i.id === item.id ? { ...i, count: i.count - 1 } : i
        ).filter((i) => i.count > 0),
        selectedItem: null,
      })),

      selectItem: (item) => set({ selectedItem: item }),

      loadState: (state) => set(state),

      updateScores: (highScores, unlockedLevelIds) => set({ highScores, unlockedLevelIds }),

      setLevels: (levels) => set({ levels }),

      updateGameState: (state) => set({ gameState: state }),

      updateScore: (score) => set({ score }),

      updateBubbles: (bubbles) => set({ bubbles }),

      updateCurrentBubble: (bubble) => set({ currentBubble: bubble }),

      updateNextBubble: (bubble) => set({ nextBubble: bubble }),

      updateCombo: (multiplier, count) => set({
        comboMultiplier: multiplier,
        comboCount: count,
      }),

      updateShotsLeft: (shots) => set({ shotsLeft: shots }),

      updateTimeLeft: (time) => set({ timeLeft: time }),

      updateAvailableItems: (items) => set({ availableItems: items }),

      decrementTime: () => set((state) => ({
        timeLeft: Math.max(0, state.timeLeft - 1),
      })),

      updateEnergy: (energy, _gained, autoTriggered) => set((state) => ({
        energy,
        lastAutoItem: autoTriggered === undefined ? state.lastAutoItem : (autoTriggered ?? null),
      })),

      updateMaxCombo: (maxCombo) => set({ maxCombo }),

      updateAutoItemTriggeredCount: (count) => set({ autoItemTriggeredCount: count }),

      clearLastAutoItem: () => set({ lastAutoItem: null }),
    }),
    {
      name: 'bubble-shooter-storage',
      partialize: (state) => ({
        highScores: state.highScores,
        unlockedLevelIds: state.unlockedLevelIds,
      }),
    }
  )
);
