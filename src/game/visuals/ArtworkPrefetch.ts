import tangtangUrl from '../../assets/blessing-tangtang.png';
import xiangxiangUrl from '../../assets/blessing-xiangxiang.png';
import encouragementUrl from '../../assets/result-encouragement-xiaoyin.png';
import victoryUrl from '../../assets/result-victory-xiaoyin.png';

const requested = new Map<string, Promise<void>>();
const downloaded = new Set<string>();

function downloadInBackground(url: string): void {
  if (downloaded.has(url) || requested.has(url)) return;
  const task = fetch(url, { cache: 'force-cache', priority: 'low' })
    .then(async (response) => {
      if (!response.ok) return;
      // 读完响应后浏览器才能完整缓存图片；此处不占用 Phaser 的场景加载器。
      await response.blob();
      downloaded.add(url);
    })
    .catch(() => {
      // 展示插画的场景仍会按原流程加载，下一关也可重试后台请求。
    })
    .finally(() => requested.delete(url));
  requested.set(url, task);
}

export function prefetchArtworkForLevel(levelId: number): void {
  downloadInBackground(tangtangUrl);
  downloadInBackground(xiangxiangUrl);
  downloadInBackground(encouragementUrl);
  if (levelId === 5) downloadInBackground(victoryUrl);
}
