import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  RiverPlatform,
  RunSubmission,
} from '../src/game/platform/RiverPlatform';
import type {
  MyLeaderboard,
  RankPeriod,
  RiverSDK,
  RiverUser,
} from '../src/game/platform/RiverSDK';
import { RunScore, type RunRecord } from '../src/game/combat/RunScore';
import { createRunId } from '../src/game/utils/RunId';

const player: RiverUser = { id: 'player-1', nickname: '玩家', avatarUrl: null };
const gameId = 'skyfire';
const runId = 'b5976b7c-e266-461a-99ee-75fbbcad3df7';

function leaderboard(
  period: RankPeriod,
  score: number | null = null,
  user: RiverUser = player,
): MyLeaderboard {
  return {
    gameId,
    userId: user.id,
    period,
    settings: {
      enabled: true,
      scoreLabel: '得分',
      scoreUnit: '分',
      direction: 'DESC',
    },
    weekStart: '2026-10-04T16:00:00Z',
    weekEnd: '2026-10-11T16:00:00Z',
    myEntry:
      score === null
        ? null
        : {
            userId: user.id,
            nickname: user.nickname,
            avatarUrl: user.avatarUrl,
            rank: 1,
            score,
            achievedAt: '2026-10-05T00:00:00Z',
          },
  };
}

function harness(user: RiverUser | null = player, embedded = true) {
  let currentUser = user;
  let authChange: ((user: RiverUser | null) => void) | undefined;
  const sdk = {
    init: vi.fn(async () => ({
      gameId,
      authMode: 'SDK_V1',
      user: currentUser,
    })),
    getUser: vi.fn<RiverSDK['getUser']>(async () => currentUser),
    getMyLeaderboard: vi.fn<RiverSDK['getMyLeaderboard']>(async (period) =>
      leaderboard(period ?? 'WEEK', null, currentUser ?? player),
    ),
    ready: vi.fn(async () => null),
    submitScore: vi.fn<RiverSDK['submitScore']>().mockResolvedValue(null),
    onAuthChange: vi.fn((listener: (user: RiverUser | null) => void) => {
      authChange = listener;
      return () => {};
    }),
  } satisfies RiverSDK;
  return {
    platform: new RiverPlatform(sdk, embedded),
    sdk,
    changeUser(next: RiverUser | null) {
      currentUser = next;
      authChange?.(next);
    },
  };
}

function record(): RunRecord {
  const score = new RunScore(1);
  score.awardEnemy(100, 1);
  return {
    ...score.snapshot(),
    score: score.total,
    victory: false,
    levelReached: 1,
    elapsedTimeMs: 1000,
    kills: 1,
    damageDealt: 20,
    damageTaken: 100,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('River platform framework integration', () => {
  it('keeps standalone or failed handshakes playable and sends READY once', async () => {
    const local = harness(null, false);
    local.platform.ready();
    await local.platform.initialize();
    expect(local.sdk.init).not.toHaveBeenCalled();
    expect(local.sdk.ready).not.toHaveBeenCalled();
    const failed = harness();
    failed.sdk.init.mockRejectedValueOnce(new Error('握手超时'));
    await failed.platform.initialize();
    expect(failed.platform.connected).toBe(false);
    const { platform, sdk } = harness();
    await platform.initialize();
    expect(sdk.ready).not.toHaveBeenCalled();
    platform.ready();
    platform.ready();
    await Promise.resolve();
    expect(sdk.ready).toHaveBeenCalledTimes(1);
  });

  it('submits a guest result after toolbar login only while its result page is open', async () => {
    vi.useFakeTimers();
    const { platform, sdk, changeUser } = harness(null);
    const submission = new RunSubmission(platform, record(), runId);
    submission.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(sdk.submitScore).not.toHaveBeenCalled();
    expect(sdk.getMyLeaderboard).not.toHaveBeenCalled();
    changeUser(player);
    await vi.advanceTimersByTimeAsync(0);
    expect(submission.submitted).toBe(true);
    expect(sdk.getMyLeaderboard.mock.calls).toEqual([['WEEK'], ['ALL']]);
    expect(sdk.submitScore).toHaveBeenCalledWith(100, { runId });
    submission.dispose();
    changeUser(null);
    const abandoned = new RunSubmission(platform, record(), runId);
    abandoned.start();
    await vi.advanceTimersByTimeAsync(0);
    abandoned.dispose();
    changeUser(player);
    await vi.advanceTimersByTimeAsync(0);
    expect(sdk.submitScore).toHaveBeenCalledTimes(1);
  });

  it.each([
    { week: 50, all: 80, shouldSubmit: true },
    { week: 50, all: 200, shouldSubmit: true },
    { week: 200, all: 50, shouldSubmit: true },
    { week: 100, all: 100, shouldSubmit: false },
    { week: 150, all: 200, shouldSubmit: false },
    { week: 100, all: 200, shouldSubmit: false },
    { week: 200, all: 100, shouldSubmit: false },
    { week: null, all: 200, shouldSubmit: true },
    { week: 200, all: null, shouldSubmit: true },
    { week: null, all: null, shouldSubmit: true },
  ])(
    'compares personal scores: WEEK=$week ALL=$all',
    async ({ week, all, shouldSubmit }) => {
      const { platform, sdk, changeUser } = harness();
      sdk.getMyLeaderboard.mockImplementation(async (period) =>
        leaderboard(period ?? 'WEEK', period === 'WEEK' ? week : all),
      );
      const submission = new RunSubmission(platform, record(), runId);
      submission.start();
      await submission.submit();
      expect(submission.submitted).toBe(shouldSubmit);
      expect(sdk.submitScore).toHaveBeenCalledTimes(shouldSubmit ? 1 : 0);
      changeUser(player);
      await submission.submit();
      expect(sdk.getMyLeaderboard.mock.calls).toEqual([['WEEK'], ['ALL']]);
      expect(sdk.submitScore).toHaveBeenCalledTimes(shouldSubmit ? 1 : 0);
      submission.dispose();
    },
  );

  it('requeries after a leaderboard failure and bounds failed query retries', async () => {
    vi.useFakeTimers();
    const { platform, sdk } = harness();
    sdk.getMyLeaderboard.mockRejectedValueOnce(new Error('排行榜查询失败'));
    const submission = new RunSubmission(platform, record(), runId);
    submission.start();
    await vi.advanceTimersByTimeAsync(999);
    expect(sdk.getMyLeaderboard).toHaveBeenCalledTimes(2);
    expect(sdk.submitScore).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(sdk.getMyLeaderboard.mock.calls).toEqual([
      ['WEEK'],
      ['ALL'],
      ['WEEK'],
      ['ALL'],
    ]);
    expect(submission.submitted).toBe(true);
    expect(sdk.submitScore).toHaveBeenCalledExactlyOnceWith(100, { runId });
    submission.dispose();

    const failed = harness();
    failed.sdk.getMyLeaderboard.mockRejectedValue(new Error('排行榜查询失败'));
    const abandoned = new RunSubmission(failed.platform, record(), runId);
    abandoned.start();
    await vi.advanceTimersByTimeAsync(10000);
    expect(failed.sdk.getMyLeaderboard).toHaveBeenCalledTimes(6);
    expect(failed.sdk.submitScore).not.toHaveBeenCalled();
    abandoned.dispose();
  });

  it('validates both personal boards even when the first is unranked', async () => {
    const board = leaderboard('ALL');
    for (const invalid of [
      null,
      { ...board, gameId: 'other-game' },
      { ...board, userId: 'other-user' },
      { ...board, period: 'WEEK' },
      { ...board, settings: { ...board.settings, enabled: false } },
      { ...board, settings: { ...board.settings, direction: 'ASC' } },
      leaderboard('ALL', 50, { ...player, id: 'other-user' }),
      leaderboard('ALL', -1),
      leaderboard('ALL', 0.5),
      leaderboard('ALL', 1_000_000_000_001),
    ]) {
      const { platform, sdk } = harness();
      sdk.getMyLeaderboard.mockImplementation(async (period) =>
        period === 'ALL'
          ? (invalid as MyLeaderboard)
          : leaderboard(period ?? 'WEEK'),
      );
      const submission = new RunSubmission(platform, record(), runId);
      submission.start();
      await submission.submit();
      expect(submission.submitted).toBe(false);
      expect(sdk.submitScore).not.toHaveBeenCalled();
      submission.dispose();
    }
  });

  it('confirms a timed-out submission with the original UUID even after equal scores appear', async () => {
    vi.useFakeTimers();
    const { platform, sdk } = harness();
    let savedScore = 0;
    sdk.getMyLeaderboard.mockImplementation(async (period) =>
      leaderboard(period ?? 'WEEK', savedScore),
    );
    sdk.submitScore.mockImplementationOnce(async (score) => {
      savedScore = score;
      throw new Error('响应超时，但平台已保存');
    });
    const submission = new RunSubmission(platform, record(), runId);
    submission.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(submission.submitted).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    expect(submission.submitted).toBe(true);
    expect(sdk.getMyLeaderboard.mock.calls).toEqual([['WEEK'], ['ALL']]);
    expect(sdk.submitScore.mock.calls).toEqual([
      [100, { runId }],
      [100, { runId }],
    ]);
    submission.dispose();
  });

  it.each(['exit', 'account', 'restore'] as const)(
    'invalidates a pending leaderboard query on %s',
    async (change) => {
      vi.useFakeTimers();
      const { platform, sdk, changeUser } = harness();
      let finish!: (board: MyLeaderboard) => void;
      sdk.getMyLeaderboard.mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      const submission = new RunSubmission(platform, record(), runId);
      submission.start();
      const pending = submission.submit();
      await vi.advanceTimersByTimeAsync(0);
      if (change === 'exit') submission.dispose();
      else {
        changeUser({ ...player, id: 'player-2' });
        if (change === 'restore') changeUser(player);
      }
      finish(leaderboard('WEEK'));
      await pending;
      expect(sdk.submitScore).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(10000);
      expect(sdk.getMyLeaderboard).toHaveBeenCalledTimes(
        change === 'restore' ? 4 : 2,
      );
      expect(sdk.submitScore).toHaveBeenCalledTimes(
        change === 'restore' ? 1 : 0,
      );
      submission.dispose();
    },
  );

  it('coalesces requests and retries at 1s and 3s with the same ID and score', async () => {
    vi.useFakeTimers();
    const { platform, sdk, changeUser } = harness();
    sdk.submitScore.mockRejectedValueOnce(new Error('网络中断'));
    sdk.submitScore.mockRejectedValueOnce(new Error('网络中断'));
    const submission = new RunSubmission(platform, record(), runId);
    submission.start();
    const first = submission.submit();
    expect(submission.submit()).toBe(first);
    await vi.advanceTimersByTimeAsync(999);
    expect(sdk.submitScore).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(sdk.submitScore).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2999);
    expect(sdk.submitScore).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(submission.submitted).toBe(true);
    expect(sdk.submitScore.mock.calls).toEqual([
      [100, { runId }],
      [100, { runId }],
      [100, { runId }],
    ]);
    changeUser(player);
    await vi.advanceTimersByTimeAsync(10000);
    expect(sdk.submitScore).toHaveBeenCalledTimes(3);
    submission.dispose();
  });

  it('bounds failed retries and never hands a bound result to another account', async () => {
    vi.useFakeTimers();
    const { platform, sdk, changeUser } = harness();
    sdk.submitScore.mockRejectedValue(new Error('网络中断'));
    const submission = new RunSubmission(platform, record(), runId);
    submission.start();
    await vi.advanceTimersByTimeAsync(0);
    changeUser({ ...player, id: 'player-2' });
    await vi.advanceTimersByTimeAsync(10000);
    expect(sdk.submitScore).toHaveBeenCalledTimes(1);
    changeUser(player);
    await vi.advanceTimersByTimeAsync(10000);
    changeUser(player);
    await vi.advanceTimersByTimeAsync(10000);
    expect(sdk.submitScore).toHaveBeenCalledTimes(3);
    submission.dispose();
  });

  it('counts identity failures in the retry budget and cancels queued retries on exit', async () => {
    vi.useFakeTimers();
    const { platform, sdk } = harness();
    sdk.getUser.mockRejectedValue(new Error('身份请求失败'));
    const submission = new RunSubmission(platform, record(), runId);
    submission.start();
    await vi.advanceTimersByTimeAsync(10000);
    expect(sdk.getUser).toHaveBeenCalledTimes(3);
    expect(sdk.submitScore).not.toHaveBeenCalled();
    submission.dispose();
    sdk.getUser.mockResolvedValue(player);
    sdk.submitScore.mockRejectedValue(new Error('网络中断'));
    const abandoned = new RunSubmission(platform, record(), runId);
    abandoned.start();
    await vi.advanceTimersByTimeAsync(0);
    abandoned.dispose();
    await vi.advanceTimersByTimeAsync(10000);
    expect(sdk.submitScore).toHaveBeenCalledTimes(1);
  });

  it('ignores a stale identity response after platform logout', async () => {
    const { platform, sdk, changeUser } = harness();
    await platform.initialize();
    let finish!: (user: RiverUser | null) => void;
    sdk.getUser.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const request = platform.getUser();
    await Promise.resolve();
    changeUser(null);
    finish(player);
    expect(await request).toBeNull();
    expect(platform.user).toBeNull();
  });

  it('excludes practice, debug, old-rule, and invalid scores', async () => {
    const { platform, sdk } = harness();
    for (const change of [
      { ranked: false },
      { startLevel: 2 },
      { rulesVersion: 1 },
      { score: -1 },
      { score: 0.5 },
    ]) {
      const submission = new RunSubmission(
        platform,
        { ...record(), ...change },
        runId,
      );
      submission.start();
      await submission.submit();
      submission.dispose();
    }
    expect(sdk.getUser).not.toHaveBeenCalled();
    expect(sdk.getMyLeaderboard).not.toHaveBeenCalled();
    expect(sdk.submitScore).not.toHaveBeenCalled();
  });

  it('generates UUIDs for standalone HTTP previews without randomUUID', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });
    const first = createRunId();
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(createRunId()).not.toBe(first);
  });
});
