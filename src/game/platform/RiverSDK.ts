export interface RiverUser {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}

export type RankPeriod = 'WEEK' | 'ALL';

export interface MyLeaderboard {
  gameId: string;
  userId: string;
  period: RankPeriod;
  settings: {
    enabled: boolean;
    scoreLabel: string;
    scoreUnit: string;
    direction: 'ASC' | 'DESC';
  };
  weekStart: string;
  weekEnd: string;
  myEntry: {
    userId: string;
    nickname: string;
    avatarUrl: string | null;
    rank: number;
    score: number;
    achievedAt: string;
  } | null;
}

/** 这里只声明游戏实际使用的接口，登录和榜单入口由平台框架提供。 */
export interface RiverSDK {
  readonly gameId?: string;
  init(options?: { platformOrigin?: string }): Promise<{
    gameId: string;
    authMode: string;
    user: RiverUser | null;
  }>;
  getUser(): Promise<RiverUser | null>;
  getMyLeaderboard(period?: RankPeriod): Promise<MyLeaderboard>;
  ready(): Promise<unknown>;
  submitScore(score: number, options: { runId: string }): Promise<unknown>;
  onAuthChange(listener: (user: RiverUser | null) => void): () => void;
}

declare global {
  interface Window {
    RiverSDK: RiverSDK;
  }
}
