import Phaser from 'phaser';
import {
  canvasArt,
  fillLinear,
  fillPoly,
  glowBall,
  glowPoly,
  radialBall,
  strokeLine,
  type Ctx2D,
} from '../visuals/pseudo3d';

export type EnemyArtId =
  | 'scout'
  | 'scout_ace'
  | 'zigzag'
  | 'zigzag_manta'
  | 'shooter'
  | 'shooter_fortress'
  | 'charger'
  | 'kamikaze'
  | 'tank';

const SIZE = 80;

// ---------------------------------------------------------------------------
// 玩家飞机：朝上，机头在上。分层绘制（外发光 → 尾翼 → 翼下表面 → 机身
// → 机头 → 翼上表面 → 高光 → 座舱 → 引擎 → 灯具），渐变模拟顶光。
// ---------------------------------------------------------------------------

const playerPalettes = {
  1: { main: 0x38b8e9, dark: 0x16314f, light: 0xd9ffff, accent: 0x67eaff },
  2: { main: 0x70e6ef, dark: 0x153950, light: 0xecffff, accent: 0x9df4ff },
  3: { main: 0xffc866, dark: 0x66374e, light: 0xffe9b3, accent: 0xff7a57 },
} as const;

export function ensurePlayerArt(scene: Phaser.Scene): void {
  for (const form of [1, 2, 3] as const) {
    canvasArt(scene, `player_form_${form}`, SIZE, SIZE, (ctx) =>
      drawPlayerForm(ctx, form),
    );
  }
}

function drawPlayerForm(ctx: Ctx2D, form: 1 | 2 | 3): void {
  const { main, dark, light, accent } = playerPalettes[form];
  const wingOuter = form === 2 ? 4 : form === 3 ? 6 : 9;

  // 1. 整体外发光轮廓
  glowPoly(
    ctx,
    [
      [40, 3],
      [64, 54],
      [54, 67],
      [45, 71],
      [35, 71],
      [26, 67],
      [16, 54],
    ],
    main,
    13,
    0.4,
  );

  // 2. 尾翼（机身之后）
  for (const side of [1, -1]) {
    fillLinear(
      ctx,
      [
        [40, 58],
        [40 + side * 10, 73],
        [40 + side * 4, 69],
      ],
      [
        [0, main],
        [1, dark],
      ],
      40,
      58,
      40 + side * 10,
      73,
    );
  }

  // 3. 机翼下表面
  fillPoly(
    ctx,
    [
      [40, 31],
      [wingOuter, 62],
      [wingOuter + 21, 57],
      [40, 51],
    ],
    dark,
    0.92,
  );
  fillPoly(
    ctx,
    [
      [40, 31],
      [80 - wingOuter, 62],
      [80 - wingOuter - 21, 57],
      [40, 51],
    ],
    dark,
    0.92,
  );

  // 4. 机身主体（横向渐变营造圆柱感）
  fillLinear(
    ctx,
    [
      [40, 4],
      [29, 21],
      [25, 52],
      [33, 67],
      [47, 67],
      [55, 52],
      [51, 21],
    ],
    [
      [0, dark],
      [0.4, light],
      [1, dark],
    ],
    24,
    0,
    56,
    0,
  );

  // 5. 机头锥
  fillLinear(
    ctx,
    [
      [40, 3],
      [35, 16],
      [45, 16],
    ],
    [
      [0, light],
      [1, main],
    ],
    40,
    3,
    40,
    16,
  );

  // 6. 机翼上表面（顶光渐变）
  fillLinear(
    ctx,
    [
      [40, 32],
      [wingOuter + 5, 56],
      [wingOuter + 22, 52],
      [39, 48],
    ],
    [
      [0, main],
      [1, dark],
    ],
    40,
    32,
    40,
    56,
  );
  fillLinear(
    ctx,
    [
      [40, 32],
      [80 - wingOuter - 5, 56],
      [80 - wingOuter - 22, 52],
      [41, 48],
    ],
    [
      [0, main],
      [1, dark],
    ],
    40,
    32,
    40,
    56,
  );

  // 7. 机翼前沿高光
  strokeLine(ctx, 40, 32, wingOuter + 5, 56, light, 1.8, 0.9);
  strokeLine(ctx, 40, 32, 75 - wingOuter, 56, light, 1.8, 0.9);

  // 8. 机身中线高光
  fillPoly(ctx, [[40, 9], [37, 46], [43, 46]], 0xffffff, 0.3);

  // 9. 座舱（球面渐变 + 反光点）
  radialBall(ctx, 40, 29, 8, [
    [0, 0xeafeff],
    [0.4, 0x54c4ee],
    [0.8, 0x15547e],
    [1, 0x0a304e],
  ]);
  radialBall(ctx, 37.5, 26.5, 2.2, [
    [0, 0xffffff, 0.95],
    [1, 0xffffff, 0],
  ]);

  // 10. 引擎喷口（金属 + 内焰）
  for (const side of [1, -1]) {
    const x = 40 + side * 18;
    fillLinear(
      ctx,
      [
        [x - 5, 60],
        [x - 5, 68],
        [x + 5, 68],
        [x + 5, 60],
      ],
      [
        [0, 0x94a6be],
        [1, 0x2c3a52],
      ],
      x - 5,
      60,
      x - 5,
      68,
    );
    fillLinear(
      ctx,
      [
        [x - 3, 66],
        [x - 3, 73],
        [x + 3, 73],
        [x + 3, 66],
      ],
      [
        [0, accent],
        [1, main, 0.15],
      ],
      x,
      66,
      x,
      73,
    );
  }

  // 11. 翼尖灯
  glowBall(ctx, wingOuter + 4, 57, 2.4, [[0, 0xffb0a0], [1, 0xc0203a]], 7);
  glowBall(ctx, 76 - wingOuter, 57, 2.4, [[0, 0xa8ffdd], [1, 0x0e7d63]], 7);

  // 12. 面板线
  strokeLine(ctx, 30, 48, 21, 55, dark, 1, 0.6);
  strokeLine(ctx, 50, 48, 59, 55, dark, 1, 0.6);

  if (form >= 2) {
    // 副翼 + 翼下挂载
    fillLinear(
      ctx,
      [
        [32, 44],
        [12, 60],
        [22, 57],
        [35, 51],
      ],
      [
        [0, main],
        [1, dark],
      ],
      32,
      44,
      12,
      60,
    );
    fillLinear(
      ctx,
      [
        [48, 44],
        [68, 60],
        [58, 57],
        [45, 51],
      ],
      [
        [0, main],
        [1, dark],
      ],
      48,
      44,
      68,
      60,
    );
    strokeLine(ctx, 32, 44, 12, 60, light, 1.4, 0.75);
    strokeLine(ctx, 48, 44, 68, 60, light, 1.4, 0.75);
    fillPoly(ctx, [[17, 55], [13, 62], [21, 62]], accent, 0.95);
    fillPoly(ctx, [[63, 55], [59, 62], [67, 62]], accent, 0.95);
  }
  if (form === 3) {
    // 凤凰羽翼 + 机头金色光
    fillLinear(
      ctx,
      [
        [26, 26],
        [6, 48],
        [18, 45],
        [30, 38],
      ],
      [
        [0, 0xffd98f],
        [1, dark],
      ],
      26,
      26,
      6,
      48,
    );
    fillLinear(
      ctx,
      [
        [54, 26],
        [74, 48],
        [62, 45],
        [50, 38],
      ],
      [
        [0, 0xffd98f],
        [1, dark],
      ],
      54,
      26,
      74,
      48,
    );
    strokeLine(ctx, 40, 5, 40, 14, 0xffffff, 1.5, 0.85);
  }
}

// ---------------------------------------------------------------------------
// 敌机：朝下，机头在下。与玩家机同样的伪 3D 分层结构，各机型保留独特轮廓。
// ---------------------------------------------------------------------------

const enemyColors: Record<EnemyArtId, [number, number, number]> = {
  scout: [0xdf4964, 0x4c2034, 0xffc6b5],
  scout_ace: [0x52d6cb, 0x17424e, 0xcaffed],
  zigzag: [0xa773e8, 0x3b235c, 0xe7d1ff],
  zigzag_manta: [0x7c86ee, 0x252c5e, 0xd5e7ff],
  shooter: [0xe7a152, 0x573a28, 0xffe0a6],
  shooter_fortress: [0x8fafbd, 0x2d4057, 0xf0f7d1],
  charger: [0xf15e4f, 0x572b38, 0xffc2a4],
  kamikaze: [0xe77da8, 0x53294f, 0xffd5eb],
  tank: [0x9b8bd3, 0x332f5c, 0xe2d9ff],
};

export function ensureEnemyArt(scene: Phaser.Scene): void {
  for (const id of Object.keys(enemyColors) as EnemyArtId[]) {
    const palette = enemyColors[id];
    canvasArt(scene, `enemy_${id}`, SIZE, SIZE, (ctx) =>
      drawEnemyForm(ctx, id, palette),
    );
  }
}

function drawEnemyForm(
  ctx: Ctx2D,
  id: EnemyArtId,
  [main, dark, light]: [number, number, number],
): void {
  const family = id.startsWith('scout')
    ? 'scout'
    : id.startsWith('zigzag')
      ? 'zigzag'
      : id.startsWith('shooter')
        ? 'shooter'
        : id;

  // 1. 外发光轮廓
  glowPoly(
    ctx,
    [
      [40, 77],
      [56, 34],
      [54, 10],
      [46, 5],
      [34, 5],
      [26, 10],
      [24, 34],
    ],
    main,
    12,
    0.4,
  );

  // 2. 机翼下表面
  fillPoly(ctx, [[40, 36], [12, 20], [28, 38], [40, 47]], dark, 0.92);
  fillPoly(ctx, [[40, 36], [68, 20], [52, 38], [40, 47]], dark, 0.92);

  // 3. 机身主体（横向渐变）
  fillLinear(
    ctx,
    [
      [40, 76],
      [29, 44],
      [26, 12],
      [34, 6],
      [46, 6],
      [54, 12],
      [51, 44],
    ],
    [
      [0, dark],
      [0.42, light],
      [1, dark],
    ],
    24,
    0,
    56,
    0,
  );

  // 4. 机头锥
  fillLinear(
    ctx,
    [
      [40, 76],
      [34, 63],
      [46, 63],
    ],
    [
      [0, light],
      [1, main],
    ],
    40,
    76,
    40,
    63,
  );

  // 5. 机翼上表面（顶光渐变）
  fillLinear(
    ctx,
    [
      [40, 37],
      [17, 22],
      [29, 37],
      [39, 44],
    ],
    [
      [0, main],
      [1, dark],
    ],
    40,
    37,
    40,
    22,
  );
  fillLinear(
    ctx,
    [
      [40, 37],
      [63, 22],
      [51, 37],
      [41, 44],
    ],
    [
      [0, main],
      [1, dark],
    ],
    40,
    37,
    40,
    22,
  );

  // 6. 机翼前沿高光
  strokeLine(ctx, 40, 37, 17, 22, light, 1.6, 0.8);
  strokeLine(ctx, 40, 37, 63, 22, light, 1.6, 0.8);

  // 7. 传感器（机头附近，球面渐变 + 反光）
  radialBall(ctx, 40, 55, 7, [
    [0, 0xffffff],
    [0.35, light],
    [0.75, main],
    [1, dark],
  ]);
  radialBall(ctx, 37.8, 52.8, 2, [
    [0, 0xffffff, 0.95],
    [1, 0xffffff, 0],
  ]);

  // 8. 顶部引擎喷口 + 焰光
  for (const side of [1, -1]) {
    const x = 40 + side * 13;
    fillPoly(
      ctx,
      [
        [x - 5, 4],
        [x - 3, 9],
        [x + 3, 9],
        [x + 5, 4],
      ],
      0x221a30,
      0.9,
    );
    glowBall(ctx, x, 3.5, 2, [[0, 0xffd9a0], [1, 0xff8a4f, 0]], 6);
  }

  // 9. 各机型独特结构
  switch (family) {
    case 'scout':
      if (id === 'scout_ace') {
        // 后掠大翼
        fillLinear(
          ctx,
          [
            [34, 30],
            [6, 12],
            [24, 24],
            [36, 36],
          ],
          [
            [0, main],
            [1, dark],
          ],
          34,
          30,
          6,
          12,
        );
        fillLinear(
          ctx,
          [
            [46, 30],
            [74, 12],
            [56, 24],
            [44, 36],
          ],
          [
            [0, main],
            [1, dark],
          ],
          46,
          30,
          74,
          12,
        );
        strokeLine(ctx, 34, 30, 6, 12, light, 1.6, 0.8);
        strokeLine(ctx, 46, 30, 74, 12, light, 1.6, 0.8);
        glowBall(ctx, 40, 42, 2.2, [[0, 0xffffff], [1, light, 0]], 6);
      } else {
        glowBall(ctx, 13, 26, 2.2, [[0, 0xffc9c9], [1, 0xd52c45]], 6);
        glowBall(ctx, 67, 26, 2.2, [[0, 0xd6fff1], [1, 0x18a187]], 6);
      }
      break;
    case 'zigzag':
      if (id === 'zigzag_manta') {
        // 宽幅蝠翼
        fillLinear(
          ctx,
          [
            [34, 26],
            [4, 4],
            [20, 30],
            [36, 40],
          ],
          [
            [0, main],
            [1, dark],
          ],
          34,
          26,
          4,
          4,
        );
        fillLinear(
          ctx,
          [
            [46, 26],
            [76, 4],
            [60, 30],
            [44, 40],
          ],
          [
            [0, main],
            [1, dark],
          ],
          46,
          26,
          76,
          4,
        );
        strokeLine(ctx, 34, 26, 4, 4, light, 1.8, 0.85);
        strokeLine(ctx, 46, 26, 76, 4, light, 1.8, 0.85);
        fillPoly(ctx, [[38, 24], [38, 32], [42, 32], [42, 24]], light, 0.8);
      } else {
        // 折线翼
        fillLinear(
          ctx,
          [
            [38, 34],
            [18, 16],
            [8, 8],
            [26, 26],
            [36, 38],
          ],
          [
            [0, main],
            [1, dark],
          ],
          38,
          34,
          8,
          8,
        );
        fillLinear(
          ctx,
          [
            [42, 34],
            [62, 16],
            [72, 8],
            [54, 26],
            [44, 38],
          ],
          [
            [0, main],
            [1, dark],
          ],
          42,
          34,
          72,
          8,
        );
        strokeLine(ctx, 38, 34, 8, 8, light, 1.6, 0.8);
        strokeLine(ctx, 42, 34, 72, 8, light, 1.6, 0.8);
      }
      break;
    case 'shooter':
      if (id === 'shooter_fortress') {
        // 重型炮塔 + 顶装甲条
        fillPoly(ctx, [[6, 10], [6, 36], [26, 42], [26, 16]], dark, 1);
        fillPoly(ctx, [[74, 10], [74, 36], [54, 42], [54, 16]], dark, 1);
        fillPoly(ctx, [[28, 16], [52, 16], [50, 21], [30, 21]], light, 0.85);
        glowBall(ctx, 14, 38, 3, [[0, 0xfff2b8], [1, 0xf0a028]], 7);
        glowBall(ctx, 66, 38, 3, [[0, 0xfff2b8], [1, 0xf0a028]], 7);
      } else {
        fillPoly(ctx, [[12, 14], [12, 34], [24, 38], [24, 18]], dark, 0.95);
        fillPoly(ctx, [[68, 14], [68, 34], [56, 38], [56, 18]], dark, 0.95);
        fillPoly(ctx, [[16, 30], [16, 36], [20, 36], [20, 30]], light, 0.9);
        fillPoly(ctx, [[64, 30], [64, 36], [60, 36], [60, 30]], light, 0.9);
        glowBall(ctx, 18, 33, 2.4, [[0, 0xfff2b8], [1, 0xf0a028]], 6);
        glowBall(ctx, 62, 33, 2.4, [[0, 0xfff2b8], [1, 0xf0a028]], 6);
      }
      break;
    case 'charger':
      // 前铲 + 侧翼尖
      fillLinear(
        ctx,
        [
          [28, 58],
          [22, 74],
          [40, 72],
          [40, 62],
        ],
        [
          [0, light],
          [1, main],
        ],
        28,
        58,
        22,
        74,
      );
      fillLinear(
        ctx,
        [
          [52, 58],
          [58, 74],
          [40, 72],
          [40, 62],
        ],
        [
          [0, light],
          [1, main],
        ],
        52,
        58,
        58,
        74,
      );
      fillPoly(ctx, [[12, 20], [26, 34], [32, 42], [26, 24]], light, 0.9);
      fillPoly(ctx, [[68, 20], [54, 34], [48, 42], [54, 24]], light, 0.9);
      break;
    case 'kamikaze':
      // 中央过载核心
      glowBall(
        ctx,
        40,
        38,
        8,
        [
          [0, 0xfff3c0],
          [0.5, 0xffc94f],
          [1, 0xd93b2f, 0.8],
        ],
        10,
      );
      glowBall(ctx, 40, 38, 3.2, [[0, 0xffffff], [1, 0xffe9a0]], 8);
      glowBall(ctx, 16, 24, 2.4, [[0, 0xffe2bd], [1, 0xff7d3f]], 6);
      glowBall(ctx, 64, 24, 2.4, [[0, 0xffe2bd], [1, 0xff7d3f]], 6);
      break;
    case 'tank':
      // 重装甲 + 顶部装甲板
      fillPoly(ctx, [[22, 8], [58, 8], [54, 18], [26, 18]], dark, 1);
      fillPoly(ctx, [[28, 11], [52, 11], [50, 15], [30, 15]], light, 0.9);
      fillPoly(ctx, [[14, 14], [24, 44], [20, 44], [10, 14]], dark, 0.96);
      fillPoly(ctx, [[66, 14], [56, 44], [60, 44], [70, 14]], dark, 0.96);
      strokeLine(ctx, 16, 28, 22, 28, light, 1.5, 0.6);
      strokeLine(ctx, 64, 28, 58, 28, light, 1.5, 0.6);
      glowBall(ctx, 40, 46, 2.2, [[0, 0xffb4b4], [1, 0xc22a3a]], 5);
      break;
  }
}
