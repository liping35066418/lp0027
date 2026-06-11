import type {
  InitGameRequest,
  InitGameResponse,
  CalculateTrajectoryRequest,
  CalculateTrajectoryResponse,
  ShootBubbleRequest,
  ShootBubbleResponse,
  PauseGameRequest,
  PauseGameResponse,
  ResumeGameRequest,
  ResumeGameResponse,
  RestartGameRequest,
  GetGameStateResponse,
  UseItemRequest,
  UseItemResponse,
  GetLevelsResponse,
  GetHighScoresResponse,
  SaveScoreRequest,
  SaveScoreResponse,
} from '../../shared/types';

const BASE_URL = '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errBody = (await response.json()) as ApiResponse<unknown>;
      if (errBody.error) {
        errorMessage = errBody.error;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  const result = (await response.json()) as ApiResponse<T>;
  if (!result.success) {
    throw new Error(result.error || 'Request failed');
  }

  return result.data;
}

export const api = {
  async initGame(levelId: number): Promise<InitGameResponse> {
    const body: InitGameRequest = { levelId };
    return request<InitGameResponse>('/game/init', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async calculateTrajectory(
    gameId: string,
    angle: number,
    power: number
  ): Promise<CalculateTrajectoryResponse> {
    const body: CalculateTrajectoryRequest = { gameId, angle, power };
    return request<CalculateTrajectoryResponse>('/game/aim', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async shootBubble(
    gameId: string,
    angle: number,
    power: number
  ): Promise<ShootBubbleResponse> {
    const body: ShootBubbleRequest = { gameId, angle, power };
    return request<ShootBubbleResponse>('/game/shoot', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async pauseGame(gameId: string): Promise<PauseGameResponse> {
    const body: PauseGameRequest = { gameId };
    return request<PauseGameResponse>('/game/pause', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async resumeGame(gameId: string): Promise<ResumeGameResponse> {
    const body: ResumeGameRequest = { gameId };
    return request<ResumeGameResponse>('/game/resume', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async restartGame(gameId: string): Promise<InitGameResponse> {
    const body: RestartGameRequest = { gameId };
    return request<InitGameResponse>('/game/restart', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getGameState(gameId: string): Promise<GetGameStateResponse> {
    return request<GetGameStateResponse>(`/game/${encodeURIComponent(gameId)}`);
  },

  async useItem(
    gameId: string,
    itemType: UseItemRequest['itemType'],
    targetBubbleId?: string,
    targetColor?: UseItemRequest['targetColor']
  ): Promise<UseItemResponse> {
    const body: UseItemRequest = { gameId, itemType, targetBubbleId, targetColor };
    return request<UseItemResponse>('/game/item/use', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getGameItems(gameId: string) {
    return request(`/game/${encodeURIComponent(gameId)}/items`);
  },

  async getLevels(): Promise<GetLevelsResponse> {
    return request<GetLevelsResponse>('/levels');
  },

  async getLevelById(id: number) {
    return request(`/levels/${id}`);
  },

  async getHighScores(): Promise<GetHighScoresResponse> {
    return request<GetHighScoresResponse>('/scores/high');
  },

  async saveScore(
    levelId: number,
    score: number,
    stars: number,
    gameId: string
  ): Promise<SaveScoreResponse> {
    const body: SaveScoreRequest = { levelId, score, stars, gameId };
    return request<SaveScoreResponse>('/scores/save', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
