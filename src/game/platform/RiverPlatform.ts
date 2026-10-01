import { SCORE_RULES_VERSION, type RunRecord } from '../combat/RunScore';
import type { RiverSDK, RiverUser } from './RiverSDK';

export class RiverPlatform {
  user: RiverUser | null = null;
  connected = false;
  private initialization?: Promise<void>;
  private readySent = false;
  private authRevision = 0;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly sdk: RiverSDK,
    private readonly embedded: boolean,
    private readonly platformOrigin?: string,
  ) {}

  initialize(): Promise<void> {
    this.initialization ??= this.connect();
    return this.initialization;
  }

  private async connect(): Promise<void> {
    if (!this.embedded) return;
    try {
      const config = await this.sdk.init(
        this.platformOrigin
          ? { platformOrigin: this.platformOrigin }
          : undefined,
      );
      if (config.authMode !== 'SDK_V1') return;
      this.user = config.user;
      this.sdk.onAuthChange((user) => this.updateUser(user));
      this.connected = true;
      this.notify();
    } catch {
      // 平台不可用时继续本地游玩，不占用画面或弹出登录窗口。
    }
  }

  ready(): void {
    if (this.readySent) return;
    this.readySent = true;
    void this.initialize().then(async () => {
      if (this.connected) await this.sdk.ready().catch(() => {});
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private updateUser(user: RiverUser | null): void {
    this.authRevision += 1;
    this.user = user;
    this.notify();
  }

  async getUser(): Promise<RiverUser | null> {
    await this.initialize();
    if (!this.connected) return null;
    const revision = this.authRevision;
    const user = await this.sdk.getUser();
    // 登录/退出事件优先，旧 GET_USER 响应不能覆盖刚变化的身份。
    if (revision !== this.authRevision) return this.user;
    if (user?.id !== this.user?.id) this.updateUser(user);
    return user;
  }

  async submitScore(
    score: number,
    runId: string,
    userId: string,
  ): Promise<void> {
    if (!this.connected || this.user?.id !== userId)
      throw new Error('平台登录状态已改变。');
    await this.sdk.submitScore(score, { runId });
  }
}

/** 每个结算页拥有一个提交任务；离开页面后不再补交或重试。 */
export class RunSubmission {
  submitted = false;
  private active = true;
  private started = false;
  private ownerId?: string;
  private attempts = 0;
  private pending?: Promise<void>;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private unsubscribe?: () => void;
  private readonly score: number;
  private readonly eligible: boolean;

  constructor(
    private readonly platform: RiverPlatform,
    record: RunRecord,
    private readonly runId: string,
  ) {
    this.score = record.score;
    this.eligible =
      record.ranked &&
      record.startLevel === 1 &&
      record.rulesVersion === SCORE_RULES_VERSION &&
      Number.isSafeInteger(record.score) &&
      record.score >= 0 &&
      record.score <= 1_000_000_000_000;
  }

  start(): void {
    if (this.started || !this.active || !this.eligible) return;
    this.started = true;
    this.unsubscribe = this.platform.subscribe(() => {
      const user = this.platform.user;
      if (!user || (this.ownerId && user.id !== this.ownerId)) {
        this.cancelRetry();
      } else if (!this.retryTimer && !this.pending) {
        void this.submit();
      }
    });
    void this.submit();
  }

  submit(): Promise<void> {
    if (!this.active || !this.eligible || this.submitted || this.attempts >= 3)
      return Promise.resolve();
    this.pending ??= this.send().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }

  private async send(): Promise<void> {
    const previousAttempts = this.attempts;
    try {
      const user = await this.platform.getUser();
      if (!this.active || !user || (this.ownerId && user.id !== this.ownerId))
        return;
      // 第一次尝试后固定成绩所属账号，账号切换不能把同局成绩交给别人。
      this.ownerId ??= user.id;
      this.attempts += 1;
      await this.platform.submitScore(this.score, this.runId, this.ownerId);
      this.submitted = true;
    } catch {
      // GET_USER 失败也消耗一次尝试，避免重试期间无限请求身份。
      if (this.attempts === previousAttempts) this.attempts += 1;
      this.ownerId ??= this.platform.user?.id;
      if (
        this.active &&
        this.platform.connected &&
        this.platform.user?.id === this.ownerId &&
        this.attempts < 3
      ) {
        if (!this.ownerId) return;
        this.retryTimer = setTimeout(
          () => {
            this.retryTimer = undefined;
            void this.submit();
          },
          this.attempts === 1 ? 1_000 : 3_000,
        );
      }
    }
  }

  private cancelRetry(): void {
    if (this.retryTimer !== undefined) clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
  }

  dispose(): void {
    this.active = false;
    this.cancelRetry();
    this.unsubscribe?.();
  }
}
