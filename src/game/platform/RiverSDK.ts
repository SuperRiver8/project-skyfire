export interface RiverUser {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}

/** 这里只声明游戏实际使用的接口，登录和榜单入口由平台框架提供。 */
export interface RiverSDK {
  init(options?: { platformOrigin?: string }): Promise<{
    authMode: string;
    user: RiverUser | null;
  }>;
  getUser(): Promise<RiverUser | null>;
  ready(): Promise<unknown>;
  submitScore(score: number, options: { runId: string }): Promise<unknown>;
  onAuthChange(listener: (user: RiverUser | null) => void): () => void;
}

declare global {
  interface Window {
    RiverSDK: RiverSDK;
  }
}
