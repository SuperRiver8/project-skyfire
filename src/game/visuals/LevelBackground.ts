import Phaser from 'phaser';
import type { BackgroundId } from '../../config/levels/types';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';

interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  phase: number;
}

const palettes: Record<BackgroundId, [number, number]> = {
  starfield: [0x030719, 0x111d42],
  neon_city: [0x071329, 0x17283e],
  red_alert: [0x270916, 0x61242a],
  storm_fortress: [0x0a1625, 0x304454],
  imperial_sky: [0x28305d, 0x8a6380],
};

const random = (seed: number): number => {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
};

export class LevelBackground {
  private readonly base: Phaser.GameObjects.Graphics;
  private readonly motion: Phaser.GameObjects.Graphics;
  private readonly cachedBase: Phaser.GameObjects.Image;
  private drawMs = 1000 / 30;
  private readonly particles: Particle[];
  private elapsed = 0;
  private nextShootingStar = 3;
  private shootingStarX = 0;
  private shootingStarY = 0;
  private shootingStarAt = -1;

  constructor(
    scene: Phaser.Scene,
    private readonly id: BackgroundId,
  ) {
    this.base = scene.add.graphics().setDepth(-1000);
    this.motion = scene.add.graphics().setDepth(-999);
    this.particles = Array.from(
      { length: id === 'starfield' ? 90 : 48 },
      (_, i) => ({
        x: random(i * 4 + 11) * GAME_WIDTH,
        y: random(i * 4 + 12) * GAME_HEIGHT,
        speed: 18 + random(i * 4 + 13) * 56,
        size: 0.8 + random(i * 4 + 14) * 1.6,
        phase: random(i * 4 + 15) * Math.PI * 2,
      }),
    );
    const key = `background_static_${id}`;
    if (!scene.textures.exists(key)) {
      this.drawStatic();
      this.base.generateTexture(key, GAME_WIDTH, GAME_HEIGHT);
    }
    this.base.setVisible(false);
    this.cachedBase = scene.add.image(0, 0, key).setOrigin(0).setDepth(-1000);
    this.update(0);
  }

  update(deltaMs: number): void {
    const dt = Math.min(deltaMs, 50) / 1000;
    this.elapsed += dt;
    const upward = this.id === 'red_alert' || this.id === 'imperial_sky';
    for (const particle of this.particles) {
      particle.y += particle.speed * dt * (upward ? -1 : 1);
      if (particle.y > GAME_HEIGHT + 15) particle.y = -15;
      if (particle.y < -15) particle.y = GAME_HEIGHT + 15;
    }

    this.drawMs += deltaMs;
    if (this.drawMs < 1000 / 30) return;
    this.drawMs %= 1000 / 30;
    const g = this.motion;
    g.clear();
    switch (this.id) {
      case 'starfield':
        this.drawStarfield(g);
        break;
      case 'neon_city':
        this.drawNeonCity(g);
        break;
      case 'red_alert':
        this.drawRedAlert(g);
        break;
      case 'storm_fortress':
        this.drawStormFortress(g);
        break;
      case 'imperial_sky':
        this.drawImperialSky(g);
        break;
    }
  }

  destroy(): void {
    this.base.destroy();
    this.cachedBase.destroy();
    this.motion.destroy();
  }

  private drawStatic(): void {
    const g = this.base;
    const [top, bottom] = palettes[this.id];
    const topColor = Phaser.Display.Color.ValueToColor(top);
    const bottomColor = Phaser.Display.Color.ValueToColor(bottom);
    for (let y = 0; y < GAME_HEIGHT; y += 12) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        topColor,
        bottomColor,
        GAME_HEIGHT,
        y,
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
      g.fillRect(0, y, GAME_WIDTH, 12);
    }

    switch (this.id) {
      case 'starfield':
        g.fillStyle(0x673d9a, 0.09);
        g.fillEllipse(115, 245, 420, 230);
        g.fillStyle(0x2789bc, 0.08);
        g.fillEllipse(430, 595, 360, 270);
        g.fillStyle(0xaad9f6, 0.12);
        g.fillCircle(442, 155, 60);
        g.fillStyle(0x16264b);
        g.fillCircle(442, 155, 54);
        break;
      case 'neon_city':
        // 两侧楼群给中间的战斗区域留出清晰空间。
        for (let i = 0; i < 14; i += 1) {
          const left = i % 2 === 0;
          const x = left ? 0 : GAME_WIDTH - 52 - (i % 3) * 18;
          const y = i * 78 - 80;
          const width = 52 + (i % 3) * 18;
          g.fillStyle(i % 3 === 0 ? 0x102337 : 0x0b1b2e, 0.9);
          g.fillRect(x, y, width, 112);
          g.lineStyle(2, i % 2 === 0 ? 0x2fd4e9 : 0xc449cf, 0.32);
          g.lineBetween(left ? width : x, y, left ? width : x, y + 112);
          for (let row = 0; row < 4; row += 1) {
            g.fillStyle(row % 2 === 0 ? 0x4dd8e8 : 0xe170d4, 0.16);
            g.fillRect(x + 12, y + 14 + row * 23, 17, 4);
          }
        }
        g.lineStyle(1, 0x50d9f0, 0.14);
        g.lineBetween(122, 0, 122, GAME_HEIGHT);
        g.lineBetween(418, 0, 418, GAME_HEIGHT);
        break;
      case 'red_alert':
        g.fillStyle(0xff7753, 0.08);
        g.fillCircle(420, 220, 170);
        g.fillStyle(0xf27850, 0.2);
        g.fillCircle(420, 220, 72);
        g.fillStyle(0x35131e, 0.75);
        g.fillTriangle(0, 750, 0, 960, 250, 960);
        g.fillTriangle(540, 690, 540, 960, 245, 960);
        g.lineStyle(2, 0xff6559, 0.18);
        for (let y = 90; y < GAME_HEIGHT; y += 130)
          g.lineBetween(0, y, GAME_WIDTH, y + 65);
        break;
      case 'storm_fortress':
        g.fillStyle(0x182b39, 0.65);
        g.fillRect(0, 0, 75, GAME_HEIGHT);
        g.fillRect(GAME_WIDTH - 75, 0, 75, GAME_HEIGHT);
        g.lineStyle(4, 0x7898a7, 0.19);
        for (let y = 0; y < GAME_HEIGHT; y += 150) {
          g.lineBetween(8, y, 75, y + 75);
          g.lineBetween(GAME_WIDTH - 8, y, GAME_WIDTH - 75, y + 75);
          g.lineBetween(0, y, 75, y);
          g.lineBetween(GAME_WIDTH - 75, y, GAME_WIDTH, y);
        }
        g.fillStyle(0x9ab9c7, 0.07);
        g.fillEllipse(275, 290, 390, 210);
        break;
      case 'imperial_sky':
        g.fillStyle(0xffdca0, 0.07);
        g.fillCircle(270, 250, 210);
        g.lineStyle(4, 0xffe5ad, 0.16);
        g.strokeCircle(270, 250, 135);
        g.lineStyle(2, 0xffe5ad, 0.12);
        g.strokeCircle(270, 250, 165);
        for (const x of [28, 490]) {
          g.fillStyle(0xffe7bc, 0.07);
          g.fillRect(x, 0, 22, GAME_HEIGHT);
        }
        break;
    }
  }

  private drawStarfield(g: Phaser.GameObjects.Graphics): void {
    for (const particle of this.particles) {
      const twinkle =
        0.4 + 0.35 * Math.sin(this.elapsed * 2.6 + particle.phase);
      g.fillStyle(0xc7eaff, twinkle);
      g.fillCircle(particle.x, particle.y, particle.size);
    }
    if (this.elapsed >= this.nextShootingStar) {
      this.shootingStarAt = this.elapsed;
      this.shootingStarX = 65 + random(this.elapsed * 7) * 350;
      this.shootingStarY = 60 + random(this.elapsed * 11) * 350;
      this.nextShootingStar = this.elapsed + 4 + random(this.elapsed * 13) * 3;
    }
    const age = this.elapsed - this.shootingStarAt;
    if (age >= 0 && age < 0.7) {
      const x = this.shootingStarX + age * 350;
      const y = this.shootingStarY + age * 260;
      g.lineStyle(5, 0x66bfff, (1 - age / 0.7) * 0.2);
      g.lineBetween(x - 105, y - 78, x, y);
      g.lineStyle(2, 0xe6faff, 1 - age / 0.7);
      g.lineBetween(x - 66, y - 49, x, y);
      g.fillStyle(0xffffff, 1 - age / 0.7);
      g.fillCircle(x, y, 2.5);
    }
  }

  private drawNeonCity(g: Phaser.GameObjects.Graphics): void {
    for (const particle of this.particles) {
      g.lineStyle(1, 0x73c9e7, 0.13 + particle.size * 0.08);
      g.lineBetween(particle.x, particle.y, particle.x - 7, particle.y - 22);
    }
    const offset = (this.elapsed * 90) % 150;
    for (let y = offset - 150; y < GAME_HEIGHT; y += 150) {
      g.fillStyle(0x45d9ed, 0.08);
      g.fillRect(145, y, 250, 3);
      g.fillStyle(0xe568d7, 0.13);
      g.fillRect(129, y + 50, 3, 28);
      g.fillRect(408, y + 50, 3, 28);
    }
  }

  private drawRedAlert(g: Phaser.GameObjects.Graphics): void {
    for (let i = 0; i < 6; i += 1) {
      const y = ((i * 190 + this.elapsed * 18) % (GAME_HEIGHT + 180)) - 90;
      const x = 110 + Math.sin(this.elapsed * 0.3 + i) * 65;
      g.fillStyle(0xff7658, 0.035);
      g.fillEllipse(x, y, 420, 100);
    }
    for (const particle of this.particles) {
      g.fillStyle(
        0xffb16e,
        0.2 + 0.2 * Math.sin(this.elapsed * 3 + particle.phase),
      );
      g.fillCircle(particle.x, particle.y, particle.size);
    }
    const pulse = 0.07 + 0.07 * Math.sin(this.elapsed * 2.5) ** 2;
    g.fillStyle(0xff3f50, pulse);
    g.fillRect(0, 0, GAME_WIDTH, 35);
    g.fillRect(0, GAME_HEIGHT - 35, GAME_WIDTH, 35);
  }

  private drawStormFortress(g: Phaser.GameObjects.Graphics): void {
    for (const particle of this.particles) {
      g.lineStyle(1, 0xafd8e5, 0.13 + particle.size * 0.06);
      g.lineBetween(particle.x, particle.y, particle.x - 10, particle.y - 30);
    }
    const sweep = Math.sin(this.elapsed * 0.7);
    g.lineStyle(22, 0xb9e4ef, 0.035);
    g.lineBetween(40, 0, 270 + sweep * 175, GAME_HEIGHT);
    g.lineBetween(500, 0, 270 - sweep * 175, GAME_HEIGHT);
    if (this.elapsed % 6.5 < 0.16) {
      g.fillStyle(0xc9eaff, 0.07);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.lineStyle(3, 0xe0f7ff, 0.48);
      g.lineBetween(370, 0, 320, 100);
      g.lineBetween(320, 100, 355, 185);
      g.lineBetween(355, 185, 280, 305);
    }
  }

  private drawImperialSky(g: Phaser.GameObjects.Graphics): void {
    for (let i = 0; i < 7; i += 1) {
      const y =
        ((i * 165 - this.elapsed * 15 + GAME_HEIGHT * 10) %
          (GAME_HEIGHT + 190)) -
        95;
      const x = 250 + Math.sin(this.elapsed * 0.18 + i * 1.7) * 130;
      g.fillStyle(0xffeac2, 0.055);
      g.fillEllipse(x, y, 340, 85);
    }
    const glow = 0.07 + 0.03 * Math.sin(this.elapsed * 1.2);
    g.lineStyle(18, 0xffe3a0, glow);
    for (let i = -2; i <= 2; i += 1)
      g.lineBetween(270, 120, 270 + i * 150, GAME_HEIGHT);
    for (const particle of this.particles) {
      g.fillStyle(
        0xffe9ac,
        0.25 + 0.18 * Math.sin(this.elapsed * 2 + particle.phase),
      );
      g.fillCircle(particle.x, particle.y, particle.size + 0.5);
    }
  }
}
