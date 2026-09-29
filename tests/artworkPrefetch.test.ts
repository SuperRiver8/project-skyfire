import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefetchArtworkForLevel } from '../src/game/visuals/ArtworkPrefetch';

afterEach(() => vi.unstubAllGlobals());

describe('artwork prefetch', () => {
  it('starts after gameplay and requests the victory image only in level five', () => {
    const fetchMock = vi.fn(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        expect(String(url)).toBeTruthy();
        expect(init?.priority).toBe('low');
        return { ok: true, blob: async () => new Blob() };
      },
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(fetchMock).not.toHaveBeenCalled();

    prefetchArtworkForLevel(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      fetchMock.mock.calls.every(
        ([url]) => !String(url).includes('result-victory'),
      ),
    ).toBe(true);

    prefetchArtworkForLevel(4);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    prefetchArtworkForLevel(5);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[3][0])).toContain('result-victory');
  });
});
