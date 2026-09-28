import Phaser from 'phaser';
import { ensureEnemyArt, ensurePlayerArt } from '../aircraft/AircraftArt';
import { GAME_HEIGHT, GAME_WIDTH } from '../viewport';

const CENTER = GAME_WIDTH / 2;

// 封面场景直接用现有飞机纹理与矢量光效绘制，尺寸始终跟随 540×960 逻辑画布。
export function createMenuCoverArt(scene: Phaser.Scene): void {
  ensurePlayerArt(scene);
  ensureEnemyArt(scene);

  const background = scene.add.graphics();
  const top = Phaser.Display.Color.ValueToColor(0x050b1c);
  const bottom = Phaser.Display.Color.ValueToColor(0x112d48);
  for (let y = 0; y < GAME_HEIGHT; y += 12) {
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      top,
      bottom,
      GAME_HEIGHT,
      y,
    );
    background.fillStyle(
      Phaser.Display.Color.GetColor(color.r, color.g, color.b),
    );
    background.fillRect(0, y, GAME_WIDTH, 12);
  }

  background.fillStyle(0x145271, 0.12);
  background.fillTriangle(0, 225, 0, 720, 280, 545);
  background.fillTriangle(GAME_WIDTH, 240, GAME_WIDTH, 710, 280, 545);
  background.lineStyle(1, 0x59d8ff, 0.1);
  for (let i = 0; i < 11; i += 1) {
    const x = i * 60 - 30;
    background.lineBetween(x, 0, x + 180, GAME_HEIGHT);
  }

  // 固定星点避免重进首页时画面闪变；少量动态星点提供呼吸感。
  for (let i = 0; i < 84; i += 1) {
    const x = (i * 137 + 47) % GAME_WIDTH;
    const y = (i * 223 + 31) % 710;
    const bright = i % 8 === 0;
    background.fillStyle(bright ? 0xb8eeff : 0x6aabd4, bright ? 0.72 : 0.3);
    background.fillCircle(x, y, bright ? 1.5 : 0.7);
  }
  for (const [x, y] of [
    [80, 144],
    [457, 210],
    [46, 426],
    [481, 533],
  ]) {
    const star = scene.add.circle(x, y, 2.3, 0xb7edff, 0.85);
    scene.tweens.add({
      targets: star,
      alpha: 0.2,
      scale: 0.55,
      duration: 1250 + x * 2,
      yoyo: true,
      repeat: -1,
    });
  }

  const arena = scene.add.graphics();
  for (const [radius, alpha] of [
    [205, 0.025],
    [172, 0.04],
    [140, 0.055],
    [105, 0.08],
  ]) {
    arena.fillStyle(0x23bfff, alpha);
    arena.fillCircle(CENTER, 491, radius);
  }
  arena.lineStyle(2, 0x4bc7ef, 0.26);
  arena.strokeCircle(CENTER, 491, 164);
  arena.lineStyle(1, 0x87e9ff, 0.21);
  arena.strokeCircle(CENTER, 491, 199);
  arena.lineStyle(2, 0x7de3ff, 0.45);
  for (let i = 0; i < 36; i += 1) {
    if (i % 3 === 0) continue;
    const angle = (i / 36) * Math.PI * 2;
    const inner = 181;
    const outer = i % 2 === 0 ? 190 : 186;
    arena.lineBetween(
      CENTER + Math.cos(angle) * inner,
      491 + Math.sin(angle) * inner,
      CENTER + Math.cos(angle) * outer,
      491 + Math.sin(angle) * outer,
    );
  }

  const fire = scene.add.graphics();
  fire.lineStyle(18, 0x0da6ff, 0.07);
  fire.lineBetween(CENTER, 512, CENTER, 341);
  fire.lineStyle(7, 0x29caff, 0.3);
  fire.lineBetween(CENTER, 512, CENTER, 341);
  fire.lineStyle(2, 0xeaffff, 0.85);
  fire.lineBetween(CENTER, 505, CENTER, 349);
  fire.lineStyle(8, 0xff9861, 0.16);
  fire.lineBetween(120, 388, 156, 439);
  fire.lineBetween(420, 388, 384, 439);

  scene.add.image(104, 377, 'enemy_zigzag').setScale(0.88).setAlpha(0.85);
  scene.add.image(436, 377, 'enemy_scout').setScale(0.88).setAlpha(0.85);
  scene.add.image(CENTER, 340, 'enemy_tank').setScale(1.02).setAlpha(0.92);

  const engine = scene.add.circle(CENTER, 621, 43, 0x19c9ff, 0.1);
  scene.tweens.add({
    targets: engine,
    alpha: 0.28,
    scale: 1.25,
    duration: 900,
    yoyo: true,
    repeat: -1,
  });
  const wingGlow = scene.add.circle(CENTER, 516, 114, 0x26a9ff, 0.07);
  scene.tweens.add({
    targets: wingGlow,
    alpha: 0.12,
    duration: 1500,
    yoyo: true,
    repeat: -1,
  });
  const hero = scene.add.image(CENTER, 527, 'player_form_2').setScale(2.75);
  scene.tweens.add({
    targets: hero,
    y: 538,
    duration: 1800,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
  });

  const horizon = scene.add.graphics();
  horizon.fillStyle(0x071b30, 0.92);
  horizon.fillTriangle(0, 666, 0, GAME_HEIGHT, CENTER, 741);
  horizon.fillTriangle(GAME_WIDTH, 666, GAME_WIDTH, GAME_HEIGHT, CENTER, 741);
  horizon.lineStyle(2, 0x37c9ef, 0.3);
  horizon.lineBetween(0, 665, CENTER, 741);
  horizon.lineBetween(GAME_WIDTH, 665, CENTER, 741);
}
