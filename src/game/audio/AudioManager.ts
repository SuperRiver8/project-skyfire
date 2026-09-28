export type SfxId =
  | 'player_shoot'
  | 'enemy_hit'
  | 'enemy_explosion'
  | 'player_hit'
  | 'upgrade'
  | 'pickup'
  | 'boss_warning'
  | 'boss_phase'
  | 'boss_explosion'
  | 'victory'
  | 'game_over'
  | 'laser'
  | 'missile'
  | 'lightning';

interface SfxPreset {
  pitch: number;
  endPitch: number;
  duration: number;
  volume: number;
  noise: number;
  wave: OscillatorType;
}

const presets: Record<SfxId, SfxPreset> = {
  player_shoot: {
    pitch: 680,
    endPitch: 300,
    duration: 0.045,
    volume: 0.055,
    noise: 0,
    wave: 'square',
  },
  enemy_hit: {
    pitch: 960,
    endPitch: 190,
    duration: 0.085,
    volume: 0.16,
    noise: 0.15,
    wave: 'sawtooth',
  },
  enemy_explosion: {
    pitch: 180,
    endPitch: 55,
    duration: 0.24,
    volume: 0.18,
    noise: 0.19,
    wave: 'sawtooth',
  },
  player_hit: {
    pitch: 260,
    endPitch: 80,
    duration: 0.25,
    volume: 0.24,
    noise: 0.18,
    wave: 'sawtooth',
  },
  upgrade: {
    pitch: 610,
    endPitch: 1080,
    duration: 0.22,
    volume: 0.16,
    noise: 0,
    wave: 'triangle',
  },
  pickup: {
    pitch: 940,
    endPitch: 1250,
    duration: 0.09,
    volume: 0.12,
    noise: 0,
    wave: 'sine',
  },
  boss_warning: {
    pitch: 180,
    endPitch: 75,
    duration: 0.42,
    volume: 0.24,
    noise: 0.1,
    wave: 'sawtooth',
  },
  boss_phase: {
    pitch: 390,
    endPitch: 130,
    duration: 0.32,
    volume: 0.21,
    noise: 0.1,
    wave: 'triangle',
  },
  boss_explosion: {
    pitch: 130,
    endPitch: 45,
    duration: 0.48,
    volume: 0.32,
    noise: 0.3,
    wave: 'sawtooth',
  },
  victory: {
    pitch: 630,
    endPitch: 990,
    duration: 0.4,
    volume: 0.2,
    noise: 0,
    wave: 'triangle',
  },
  game_over: {
    pitch: 350,
    endPitch: 70,
    duration: 0.4,
    volume: 0.2,
    noise: 0.08,
    wave: 'triangle',
  },
  laser: {
    pitch: 930,
    endPitch: 270,
    duration: 0.14,
    volume: 0.12,
    noise: 0.025,
    wave: 'sawtooth',
  },
  missile: {
    pitch: 400,
    endPitch: 120,
    duration: 0.16,
    volume: 0.12,
    noise: 0.035,
    wave: 'sawtooth',
  },
  lightning: {
    pitch: 1400,
    endPitch: 170,
    duration: 0.14,
    volume: 0.12,
    noise: 0.1,
    wave: 'square',
  },
};

export class AudioManager {
  private static context: AudioContext | undefined;
  private static noiseBuffer: AudioBuffer | undefined;
  private lastPlayed = new Map<SfxId, number>();
  sfxVolume = 0.7;
  musicVolume = 0.5;

  static unlock(): void {
    try {
      AudioManager.context ??= new AudioContext();
      if (AudioManager.context.state === 'suspended')
        void AudioManager.context.resume();
    } catch {
      // 音频不可用时仍可继续游戏。
    }
  }

  playSfx(id: SfxId): void {
    if (this.sfxVolume <= 0) return;
    const now = performance.now();
    if (
      now - (this.lastPlayed.get(id) ?? -Infinity) <
      (id === 'player_shoot' ? 90 : 50)
    )
      return;
    this.lastPlayed.set(id, now);
    try {
      AudioManager.unlock();
      const context = AudioManager.context;
      if (!context) return;
      const { pitch, endPitch, duration, volume, noise, wave } = presets[id];
      const start = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(pitch, start);
      oscillator.frequency.exponentialRampToValueAtTime(
        endPitch,
        start + duration,
      );
      gain.gain.setValueAtTime(volume * this.sfxVolume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
      if (noise > 0) this.playNoise(context, start, duration, noise);
    } catch {
      /* 浏览器阻止自动播放时，战斗逻辑仍可继续。 */
    }
  }

  private playNoise(
    context: AudioContext,
    start: number,
    duration: number,
    volume: number,
  ): void {
    if (!AudioManager.noiseBuffer) {
      const buffer = context.createBuffer(
        1,
        context.sampleRate,
        context.sampleRate,
      );
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i += 1)
        samples[i] = Math.random() * 2 - 1;
      AudioManager.noiseBuffer = buffer;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = AudioManager.noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = 750;
    gain.gain.setValueAtTime(volume * this.sfxVolume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(start);
    source.stop(start + duration);
  }
  setMusicVolume(value: number): void {
    this.musicVolume = Math.max(0, Math.min(1, value));
  }
  setSfxVolume(value: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, value));
  }
  stopMusic(): void {
    /* MVP 暂无音乐素材。 */
  }
  playMusic(id: string): void {
    void id; /* 保留接口供后续音轨接入。 */
  }
}
