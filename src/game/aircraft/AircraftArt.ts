import Phaser from 'phaser';

export type EnemyArtId =
  'scout' | 'zigzag' | 'shooter' | 'charger' | 'kamikaze' | 'tank';

const SIZE = 80;

// 所有顶点都留在纹理内部，避免机翼或机头被纹理边界裁掉。
export function ensurePlayerArt(scene: Phaser.Scene): void {
  for (const form of [1, 2, 3] as const) {
    const key = `player_form_${form}`;
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics();
    const tip = form === 1 ? 10 : form === 2 ? 5 : 2;
    const main = form === 3 ? 0xffc866 : form === 2 ? 0x70e6ef : 0x38b8e9;
    const dark = form === 3 ? 0x673c50 : 0x183b65;
    const light = form === 3 ? 0xffe3a5 : 0xd7ffff;

    g.fillStyle(0x061a2e, 0.9);
    g.fillTriangle(40, 4, 20, 70, 60, 70);
    g.fillTriangle(26, 35, tip, 65, 33, 60);
    g.fillTriangle(54, 35, 80 - tip, 65, 47, 60);
    if (form >= 2) {
      g.fillTriangle(23, 44, 3, 68, 28, 62);
      g.fillTriangle(57, 44, 77, 68, 52, 62);
    }
    g.fillStyle(dark);
    g.fillTriangle(27, 34, tip, 60, 34, 57);
    g.fillTriangle(53, 34, 80 - tip, 60, 46, 57);
    g.fillStyle(main);
    g.fillTriangle(40, 7, 26, 65, 54, 65);
    g.fillTriangle(27, 38, tip + 3, 58, 34, 56);
    g.fillTriangle(53, 38, 77 - tip, 58, 46, 56);
    if (form >= 2) {
      g.fillStyle(dark);
      g.fillTriangle(25, 45, 5, 65, 29, 59);
      g.fillTriangle(55, 45, 75, 65, 51, 59);
      g.fillStyle(main);
      g.fillTriangle(24, 47, 9, 62, 31, 57);
      g.fillTriangle(56, 47, 71, 62, 49, 57);
    }
    g.fillStyle(light);
    g.fillTriangle(40, 16, 34, 40, 46, 40);
    g.fillStyle(0x0a4769);
    g.fillTriangle(40, 24, 35, 43, 45, 43);
    g.fillStyle(0xffffff, 0.65);
    g.fillTriangle(40, 27, 38, 35, 41, 32);
    g.lineStyle(2, light, 0.9);
    g.lineBetween(40, 9, 40, 20);
    g.lineBetween(tip + 5, 57, 28, 45);
    g.lineBetween(75 - tip, 57, 52, 45);
    g.fillStyle(0x1a385a);
    g.fillRect(25, 53, 8, 17);
    g.fillRect(47, 53, 8, 17);
    g.fillStyle(form === 3 ? 0xff5e55 : 0x1c658c);
    g.fillRect(17, 55, 6, 11);
    g.fillRect(57, 55, 6, 11);
    g.fillStyle(form === 3 ? 0xff825b : 0x67eaff);
    g.fillTriangle(27, 69, 29, 78, 33, 69);
    g.fillTriangle(47, 69, 51, 78, 53, 69);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(29, 69, 2, 5);
    g.fillRect(49, 69, 2, 5);
    if (form >= 2) {
      g.fillStyle(light);
      g.fillRect(tip + 3, 52, 6, 5);
      g.fillRect(71 - tip, 52, 6, 5);
    }
    if (form === 3) {
      g.fillStyle(0xff7a57);
      g.fillTriangle(40, 5, 36, 18, 44, 18);
      g.fillRect(4, 56, 5, 9);
      g.fillRect(71, 56, 5, 9);
      g.fillStyle(0xffe3a5);
      g.fillTriangle(19, 47, 8, 60, 25, 54);
      g.fillTriangle(61, 47, 72, 60, 55, 54);
    }
    g.generateTexture(key, SIZE, SIZE);
    g.destroy();
  }
}

const enemyColors: Record<EnemyArtId, [number, number, number]> = {
  scout: [0xdf4964, 0x752943, 0xffc6b5],
  zigzag: [0xa773e8, 0x50317c, 0xe7d1ff],
  shooter: [0xe7a152, 0x765138, 0xffe0a6],
  charger: [0xf15e4f, 0x813746, 0xffc2a4],
  kamikaze: [0xe77da8, 0x713a72, 0xffd5eb],
  tank: [0x9b8bd3, 0x454875, 0xe2d9ff],
};

export function ensureEnemyArt(scene: Phaser.Scene): void {
  for (const id of Object.keys(enemyColors) as EnemyArtId[]) {
    const key = `enemy_${id}`;
    if (scene.textures.exists(key)) continue;
    const [main, dark, light] = enemyColors[id];
    const g = scene.add.graphics();
    const broad = id === 'tank' || id === 'shooter';
    const tip = broad ? 5 : id === 'zigzag' ? 3 : 10;
    const nose = id === 'charger' ? 77 : 69;
    // 敌机朝下，轮廓和识别灯随类型变化，弹幕密集时仍能辨认机型。
    g.fillStyle(0x160d26, 0.9);
    g.fillTriangle(40, nose + 3, 24, 12, 56, 12);
    g.fillTriangle(28, 44, tip, 18, 34, 27);
    g.fillTriangle(52, 44, 80 - tip, 18, 46, 27);
    g.fillStyle(dark);
    g.fillTriangle(28, 46, tip + 1, 20, 35, 31);
    g.fillTriangle(52, 46, 79 - tip, 20, 45, 31);
    g.fillStyle(main);
    g.fillTriangle(40, nose, 26, 15, 54, 15);
    g.fillTriangle(30, 44, tip + 5, 23, 35, 34);
    g.fillTriangle(50, 44, 75 - tip, 23, 45, 34);
    if (id === 'zigzag') {
      g.fillStyle(dark);
      g.fillTriangle(24, 24, 3, 8, 29, 36);
      g.fillTriangle(56, 24, 77, 8, 51, 36);
      g.fillStyle(light);
      g.fillTriangle(11, 12, 22, 26, 28, 31);
      g.fillTriangle(69, 12, 58, 26, 52, 31);
    }
    if (id === 'scout') {
      g.fillStyle(light);
      g.fillTriangle(13, 24, 24, 31, 29, 37);
      g.fillTriangle(67, 24, 56, 31, 51, 37);
    }
    g.fillStyle(light);
    g.fillTriangle(40, nose - 15, 34, 39, 46, 39);
    g.fillStyle(0x332a51);
    g.fillTriangle(40, nose - 19, 35, 43, 45, 43);
    g.lineStyle(2, light, 0.9);
    g.lineBetween(40, nose - 3, 40, nose - 14);
    g.lineBetween(tip + 8, 25, 29, 35);
    g.lineBetween(72 - tip, 25, 51, 35);
    if (id === 'shooter' || id === 'tank') {
      g.fillStyle(dark);
      g.fillRect(8, 17, 10, 25);
      g.fillRect(62, 17, 10, 25);
      g.fillStyle(light);
      g.fillRect(11, 33, 4, 12);
      g.fillRect(65, 33, 4, 12);
      g.fillStyle(id === 'tank' ? 0xff7c86 : 0xffe37c);
      g.fillCircle(13, 44, 3);
      g.fillCircle(67, 44, 3);
    }
    if (id === 'charger') {
      g.fillStyle(light);
      g.fillTriangle(40, 78, 36, 55, 44, 55);
      g.fillTriangle(14, 20, 27, 35, 31, 44);
      g.fillTriangle(66, 20, 53, 35, 49, 44);
    }
    if (id === 'kamikaze') {
      g.fillStyle(dark);
      g.fillTriangle(17, 18, 5, 10, 24, 39);
      g.fillTriangle(63, 18, 75, 10, 56, 39);
      g.fillStyle(0xffe778);
      g.fillCircle(40, 36, 7);
      g.fillStyle(dark);
      g.fillCircle(40, 36, 3);
      g.fillStyle(0xffe778);
      g.fillCircle(17, 25, 3);
      g.fillCircle(63, 25, 3);
    }
    if (id === 'tank') {
      g.fillStyle(dark);
      g.fillRect(23, 11, 34, 23);
      g.fillStyle(light);
      g.fillRect(29, 15, 22, 5);
      g.fillStyle(0x736caa);
      g.fillRect(20, 23, 5, 26);
      g.fillRect(55, 23, 5, 26);
    }
    g.generateTexture(key, SIZE, SIZE);
    g.destroy();
  }
}
