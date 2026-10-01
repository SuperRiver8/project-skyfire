import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  RiverPlatform,
  RunSubmission,
} from '../src/game/platform/RiverPlatform';
import type { RiverSDK, RiverUser } from '../src/game/platform/RiverSDK';
import { RunScore, type RunRecord } from '../src/game/combat/RunScore';
import { createRunId } from '../src/game/utils/RunId';

const player: RiverUser = { id: 'player-1', nickname: '玩家', avatarUrl: null };
const runId = 'b5976b7c-e266-461a-99ee-75fbbcad3df7';

function harness(user: RiverUser | null = player, embedded = true) {
  let currentUser = user;
  let authChange: ((user: RiverUser | null) => void) | undefined;
  const sdk = {
    init: vi.fn(async () => ({ authMode: 'SDK_V1', user: currentUser })),
    getUser: vi.fn<RiverSDK['getUser']>(async () => currentUser),
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
    changeUser(player);
    await vi.advanceTimersByTimeAsync(0);
    expect(submission.submitted).toBe(true);
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
