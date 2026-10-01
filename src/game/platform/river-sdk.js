(function (global) {
  'use strict';
  const channel = 'river-game';
  let platformOrigin, configuration, initialized;
  const pending = new Map(), listeners = new Set();
  const request = (type, data) => new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('平台请求超时或登录被取消。')); }, type === 'REQUEST_LOGIN' ? 120000 : 15000);
    pending.set(requestId, { resolve, reject, timer });
    parent.postMessage({ channel, version: 1, type, requestId, data }, platformOrigin);
  });
  global.addEventListener('message', (event) => {
    if (event.source !== parent || event.origin !== platformOrigin || event.data?.channel !== channel || event.data.version !== 1) return;
    const message = event.data;
    if (message.type === 'AUTH_CHANGED') { if (configuration) configuration.user = message.user; listeners.forEach(listener => listener(message.user)); return; }
    if (message.type === 'RESULT') { const job = pending.get(message.requestId); if (!job) return; clearTimeout(job.timer); pending.delete(message.requestId); message.error ? job.reject(new Error(message.error)) : job.resolve(message.data); }
  });
  const sdk = {
    version: '1.0.0',
    init(options = {}) {
      if (initialized) return initialized;
      if (parent === global) return Promise.reject(new Error('请从平台游戏容器打开；独立模式请接入 OIDC。'));
      // 使用浏览器提供的来源建立握手，不向任意 origin 广播身份。
      const origin = options.platformOrigin || (document.referrer && new URL(document.referrer).origin);
      if (!origin || !/^https?:\/\//.test(origin)) return Promise.reject(new Error('无法确定平台来源。'));
      platformOrigin = new URL(origin).origin;
      initialized = request('INIT').then(data => { configuration = data; return data; }); return initialized;
    },
    async getUser() { await sdk.init(); return request('GET_USER'); },
    async requestLogin() { await sdk.init(); return request('REQUEST_LOGIN'); },
    async getGameToken() { await sdk.init(); const result = await request('GET_GAME_TOKEN'); return result.accessToken; },
    async submitScore(score, options = {}) {
      if (!Number.isSafeInteger(score) || score < 0 || score > 1000000000000) throw new Error('成绩必须是有效的非负整数。');
      const runId = options.runId || crypto.randomUUID();
      if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(runId)) throw new Error('本局 runId 必须是 UUID。');
      await sdk.init(); return request('SUBMIT_SCORE', { score, runId });
    },
    async showLeaderboard(period = 'WEEK') {
      if (!['WEEK', 'ALL'].includes(period)) throw new Error('请选择 WEEK 或 ALL。');
      await sdk.init(); return request('SHOW_LEADERBOARD', { period });
    },
    async ready() { await sdk.init(); return request('READY'); },
    onAuthChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    get gameId() { return configuration?.gameId; },
  };
  global.RiverSDK = Object.freeze(sdk);
})(window);
