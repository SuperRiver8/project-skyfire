# Project Skyfire — 2D 飞机射击游戏完整开发规格

> 文档用途：直接提供给 Codex / AI Coding Agent 作为项目开发主规格。  
> 项目代号：**Project Skyfire**  
> 游戏类型：2D 纵向飞行射击 + Roguelite Build + Boss Rush  
> 目标平台：Web 优先，后续可扩展 PWA / Capacitor / 微信小游戏  
> 当前目标：**先完成可完整游玩的 5 关 MVP，再按相同框架扩展至 100 关**  
> 文档版本：v1.0  
> 日期：2026-09-28

---

# 1. 项目目标

开发一款轻量、爽快、容易持续扩展的 2D 纵向飞机射击游戏。

玩家控制一架战机自动射击，通过移动躲避敌机与弹幕，击杀敌人获得经验、能量和随机道具。随着游戏推进，飞机的武器、机翼、核心、浮游炮、僚机等不断变化，最终形成不同的战斗 Build。

完整版本规划最多 100 关。

关卡结构：

```text
1
2
3
4
5   -> Boss

6
7
8
9
10  -> Boss

...

96
97
98
99
100 -> Final Boss
```

即：

- 每 5 关一个 Boss。
- 总共最多 20 个 Boss 关。
- 每 10 关为一个章节。
- 总共 10 个章节。
- 每章节拥有独立环境、美术主题、敌人组合和机制变化。

当前阶段禁止直接制作全部 100 关。

第一阶段只开发：

```text
5 关
1 架基础战机
6 类敌人
5 类基础武器
10 类道具
1 个三阶段 Boss
完整升级系统
完整受击反馈
完整开始/暂停/结算流程
本地存档
```

MVP 必须首先验证：

> “移动 + 射击 + 升级 + 武器变化 + Boss 战”本身是否足够爽。

---

# 2. 核心设计原则

Codex 开发时必须遵循以下原则。

## 2.1 爽感优先

任何系统设计优先级：

```text
打击反馈
>
操作流畅
>
成长反馈
>
Build 乐趣
>
数值复杂度
```

禁止为了“架构高级”牺牲实际游玩体验。

---

## 2.2 配置驱动

以下内容禁止大量硬编码：

- 关卡
- 敌人
- Boss
- 武器
- 道具
- 掉落率
- Wave
- Boss Phase
- 数值平衡

应尽可能通过 TypeScript Config / JSON 配置完成。

例如禁止：

```ts
if (level === 1) {
}

if (level === 2) {
}
```

推荐：

```ts
const level = levelConfigs[levelId];
```

---

## 2.3 组合优于继承

武器、飞机、道具、敌人能力优先采用：

```text
Component
+
Config
+
Strategy
```

避免 50 层继承。

例如：

```text
Weapon
├── ProjectileBehavior
├── TargetingBehavior
├── DamageBehavior
├── VisualBehavior
└── UpgradeBehavior
```

第一版不需要正式 ECS 框架。

---

## 2.4 性能从第一天考虑

飞机射击游戏可能同时存在：

- 300+ 玩家子弹
- 300+ 敌方子弹
- 50+ 敌人
- 200+ 粒子
- 多个掉落物
- 多个浮游炮

因此：

必须使用对象池：

```text
BulletPool
EnemyPool
ParticlePool
PickupPool
DamageTextPool
ExplosionPool
```

禁止高频：

```ts
new Bullet()
destroy()
new Bullet()
destroy()
```

---

## 2.5 游戏逻辑与 Phaser 隔离

不要让所有业务代码直接依赖 Phaser Scene。

例如：

```text
DamageCalculator
UpgradeResolver
WeaponLevelResolver
DropTable
GameProgress
SaveData
```

都应该尽量保持为纯 TypeScript。

这样方便：

- 单元测试
- 调整平衡
- AI 修改代码
- 后续升级 Phaser
- 后续迁移平台

---

# 3. 技术栈

## 3.1 核心技术

```text
TypeScript
Vite 8.x
Phaser 4.2.1
HTML5 Canvas / WebGL
```

推荐 Node.js：

```text
Node.js 22 LTS+
```

包管理器：

```text
pnpm
```

可以使用 npm，但整个项目统一一种。

推荐：

```text
pnpm
```

---

## 3.2 测试与代码质量

```text
Vitest
ESLint
Prettier
TypeScript strict mode
```

要求：

```json
{
  "strict": true
}
```

---

## 3.3 第一版禁止引入

第一版不需要：

- React
- Vue
- Redux
- Zustand
- Three.js
- Matter.js
- 后端服务
- 用户系统
- 数据库
- WebSocket
- 在线排行榜
- 微服务
- ECS 框架

UI 尽量直接通过 Phaser 实现。

---

# 4. 目标分辨率

采用竖屏。

逻辑分辨率：

```text
540 × 960
```

设计比例：

```text
9:16
```

要求自适应：

- PC 浏览器
- 手机浏览器
- 平板
- 横屏浏览器保持竖屏游戏区域居中

游戏不允许因为浏览器尺寸改变导致游戏世界坐标发生不可预测变化。

推荐：

```ts
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH
}
```

---

# 5. 输入系统

统一封装：

```ts
InputController
```

所有玩家移动必须通过该层。

支持：

## Desktop

```text
WASD
Arrow Keys
Mouse
```

## Mobile

```text
Finger Drag
```

规则：

- 默认自动射击。
- 玩家无需一直按攻击键。
- 鼠标按住拖拽飞机。
- 手机触摸拖拽飞机。
- 键盘 WASD / 方向键移动。
- 移动速度需要做 Delta Time 处理。
- 禁止飞机瞬移。
- 拖动时加入轻量平滑插值。

接口建议：

```ts
interface PlayerInputState {
  moveX: number;
  moveY: number;
  pointerActive: boolean;
  pointerWorldX?: number;
  pointerWorldY?: number;
}
```

---

# 6. 游戏场景

建议场景：

```text
BootScene
PreloadScene
MainMenuScene
GameScene
PauseScene / PauseOverlay
UpgradeScene / UpgradeOverlay
ResultScene
```

推荐：

```text
BootScene
    ↓
PreloadScene
    ↓
MainMenuScene
    ↓
GameScene
    ↓
ResultScene
```

升级选择不要切换整个 GameScene。

应该暂停世界：

```ts
gameState.pauseCombat()
```

然后显示：

```text
Upgrade Overlay
```

选择完成后继续。

---

# 7. 项目目录

目标目录：

```text
src/
├── main.ts
├── game/
│   ├── GameConfig.ts
│   ├── events/
│   │   ├── GameEventBus.ts
│   │   └── GameEvents.ts
│   │
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── MainMenuScene.ts
│   │   ├── GameScene.ts
│   │   └── ResultScene.ts
│   │
│   ├── player/
│   │   ├── PlayerAircraft.ts
│   │   ├── PlayerStats.ts
│   │   ├── PlayerController.ts
│   │   ├── PlayerHealth.ts
│   │   └── AircraftVisualController.ts
│   │
│   ├── input/
│   │   └── InputController.ts
│   │
│   ├── combat/
│   │   ├── DamageSystem.ts
│   │   ├── DamageCalculator.ts
│   │   ├── CriticalSystem.ts
│   │   ├── CollisionSystem.ts
│   │   ├── HitStopController.ts
│   │   └── CombatTypes.ts
│   │
│   ├── weapons/
│   │   ├── WeaponManager.ts
│   │   ├── BaseWeapon.ts
│   │   ├── WeaponFactory.ts
│   │   ├── weapon-types/
│   │   │   ├── MachineGunWeapon.ts
│   │   │   ├── SpreadWeapon.ts
│   │   │   ├── LaserWeapon.ts
│   │   │   ├── MissileWeapon.ts
│   │   │   └── LightningWeapon.ts
│   │   └── behaviors/
│   │       ├── ProjectileBehavior.ts
│   │       ├── TargetingBehavior.ts
│   │       └── ExplosionBehavior.ts
│   │
│   ├── bullets/
│   │   ├── Bullet.ts
│   │   ├── BulletPool.ts
│   │   └── BulletTypes.ts
│   │
│   ├── enemies/
│   │   ├── Enemy.ts
│   │   ├── EnemyFactory.ts
│   │   ├── EnemyPool.ts
│   │   ├── EnemyController.ts
│   │   └── ai/
│   │       ├── StraightAI.ts
│   │       ├── ZigZagAI.ts
│   │       ├── ChargerAI.ts
│   │       ├── ShooterAI.ts
│   │       ├── KamikazeAI.ts
│   │       └── TankAI.ts
│   │
│   ├── bosses/
│   │   ├── Boss.ts
│   │   ├── BossController.ts
│   │   ├── BossPhaseController.ts
│   │   └── patterns/
│   │       ├── FanShotPattern.ts
│   │       ├── CircleShotPattern.ts
│   │       ├── MissileRainPattern.ts
│   │       ├── LaserSweepPattern.ts
│   │       └── DashPattern.ts
│   │
│   ├── items/
│   │   ├── Pickup.ts
│   │   ├── PickupPool.ts
│   │   ├── ItemManager.ts
│   │   └── ItemEffectResolver.ts
│   │
│   ├── upgrades/
│   │   ├── UpgradeManager.ts
│   │   ├── UpgradeGenerator.ts
│   │   ├── UpgradeOption.ts
│   │   └── WeaponFusionSystem.ts
│   │
│   ├── level/
│   │   ├── LevelManager.ts
│   │   ├── WaveManager.ts
│   │   ├── SpawnManager.ts
│   │   └── LevelProgress.ts
│   │
│   ├── effects/
│   │   ├── EffectManager.ts
│   │   ├── CameraEffectManager.ts
│   │   ├── ExplosionManager.ts
│   │   ├── DamageNumberManager.ts
│   │   └── ParticleManager.ts
│   │
│   ├── audio/
│   │   └── AudioManager.ts
│   │
│   ├── ui/
│   │   ├── HUD.ts
│   │   ├── HealthBar.ts
│   │   ├── ExperienceBar.ts
│   │   ├── BossHealthBar.ts
│   │   ├── UpgradePanel.ts
│   │   └── PausePanel.ts
│   │
│   ├── save/
│   │   ├── SaveManager.ts
│   │   └── SaveTypes.ts
│   │
│   └── utils/
│       ├── ObjectPool.ts
│       ├── MathUtils.ts
│       ├── Random.ts
│       └── TimeUtils.ts
│
├── config/
│   ├── weapons/
│   ├── enemies/
│   ├── bosses/
│   ├── items/
│   ├── levels/
│   └── balance/
│
├── assets/
│   ├── sprites/
│   ├── effects/
│   ├── audio/
│   ├── backgrounds/
│   └── ui/
│
└── tests/
```

不要强制每个目录初始都创建空文件。

只创建当前功能需要的代码。

---

# 8. 全局游戏状态

设计：

```ts
interface RunState {
  levelId: number;
  score: number;

  playerLevel: number;
  currentExp: number;
  expToNextLevel: number;

  coins: number;

  elapsedTimeMs: number;

  kills: number;
  damageDealt: number;
  damageTaken: number;

  selectedUpgrades: string[];
}
```

游戏永久存档：

```ts
interface SaveData {
  version: number;

  highestUnlockedLevel: number;
  totalCoins: number;

  settings: {
    musicVolume: number;
    sfxVolume: number;
    screenShake: boolean;
    damageNumbers: boolean;
  };

  stats: {
    totalKills: number;
    totalPlayTimeMs: number;
    bossesKilled: number;
  };
}
```

存储：

第一版使用：

```text
localStorage
```

如果后期数据增多再迁移 IndexedDB。

必须提供：

```ts
SaveManager.load()
SaveManager.save()
SaveManager.reset()
SaveManager.migrate()
```

---

# 9. 玩家基础属性

MVP 初始建议：

```ts
const DEFAULT_PLAYER_STATS = {
  maxHp: 100,
  hp: 100,

  moveSpeed: 300,

  attackMultiplier: 1,
  fireRateMultiplier: 1,

  critChance: 0.05,
  critDamageMultiplier: 1.5,

  pickupRadius: 80,

  damageReduction: 0,

  invulnerabilityAfterHitMs: 700,
};
```

所有数值必须放进 Balance Config。

禁止散落 magic number。

---

# 10. 玩家受伤机制

玩家与敌人或敌方子弹碰撞：

```text
hit
↓
damage
↓
短暂无敌
↓
视觉闪烁
```

MVP：

```text
受击无敌：700ms
```

受击反馈：

- 玩家 sprite 短暂白闪。
- 轻度相机震动。
- 播放受伤音效。
- HP UI 动画减少。
- 在飞机附近显示红色伤害数字。
- 不能因为同一颗子弹重叠一帧内受到多次伤害。

---

# 11. 经验系统

敌人死亡后掉落 Energy Orb。

玩家靠近后自动吸附。

基础经验曲线：

```ts
function expRequired(level: number): number {
  return Math.floor(40 * Math.pow(level, 1.35));
}
```

注意：

该公式必须封装。

后续可以调整。

升级后：

```text
Pause Combat
↓
生成 3 个随机 Upgrade
↓
玩家选择一个
↓
应用效果
↓
Resume
```

---

# 12. Upgrade 三选一系统

规则：

每次升级随机出现 3 个不同选项。

不能出现完全无效的升级。

例：

玩家没有 Laser：

```text
Laser Lv2
```

不应该直接出现。

只能出现：

```text
Unlock Laser
```

如果武器已满级：

不继续出现普通升级。

如满足融合条件，可以出现：

```text
Evolution / Fusion
```

推荐稀有度：

```ts
type Rarity =
  | 'COMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY';
```

MVP 可暂时：

```text
COMMON 70%
RARE 22%
EPIC 7%
LEGENDARY 1%
```

先实现系统，不必过度平衡。

---

# 13. 武器槽

第一版玩家可以同时拥有：

```text
Main Weapons: 最大 3
Support Weapons: 最大 2
```

例如：

```text
Machine Gun
Lightning
Missile

+
Drone
Orbital Cannon
```

MVP 暂时只做前 3 个主武器槽。

---

# 14. 五种 MVP 武器

---

## 14.1 Machine Gun

ID：

```text
machine_gun
```

定位：

```text
基础
高射速
稳定
前方攻击
```

等级：

### Lv1

```text
1 发
Damage 10
Fire Interval 180ms
```

### Lv2

```text
2 发并排
Damage 10
```

### Lv3

```text
2 发
Fire Interval -15%
```

### Lv4

```text
3 发
小角度扇形
```

### Lv5

```text
穿透 +1
Damage +20%
```

最终形态视觉：

```text
Triple Vulcan
```

---

## 14.2 Spread Gun

ID：

```text
spread_gun
```

Lv1：

```text
3 directions
```

Lv2：

```text
5 directions
```

Lv3：

```text
Damage +20%
```

Lv4：

```text
7 directions
```

Lv5：

```text
每颗弹命中后产生小型二次碎片
```

定位：

```text
清杂
覆盖面积大
单体一般
```

---

## 14.3 Laser

ID：

```text
laser
```

机制：

持续或脉冲激光均可。

MVP 推荐：

```text
脉冲激光
```

减少持续 Beam 碰撞复杂度。

Lv1：

```text
每 900ms 发射一次直线激光
```

Lv2：

```text
宽度提升
```

Lv3：

```text
Damage +30%
```

Lv4：

```text
双激光
```

Lv5：

```text
贯穿全部普通敌人
Boss 持续伤害修正
```

---

## 14.4 Missile

ID：

```text
missile
```

机制：

自动寻找最近或威胁最高目标。

Lv1：

```text
1 missile
```

Lv2：

```text
2 missiles
```

Lv3：

```text
Explosion Radius +25%
```

Lv4：

```text
3 missiles
```

Lv5：

```text
Cluster Explosion
```

目标选择：

优先：

```text
Boss
Elite
Nearest Enemy
```

需要避免所有导弹永远打同一个即将死亡的小怪。

可以简单轮询目标。

---

## 14.5 Lightning

ID：

```text
lightning
```

核心亮点武器。

Lv1：

```text
攻击 1 个目标
Chain 1
```

Lv2：

```text
Chain 3
```

Lv3：

```text
Damage +25%
```

Lv4：

```text
Chain 5
```

Lv5：

```text
Chain 8
短时间残留闪电视觉
```

链式目标不能重复。

算法：

```text
current target
↓
寻找 radius 范围内最近未命中目标
↓
继续 chain
```

---

# 15. 武器统一接口

推荐：

```ts
interface Weapon {
  readonly id: string;
  level: number;

  update(deltaMs: number): void;

  fire(): void;

  upgrade(): void;

  canUpgrade(): boolean;

  destroy(): void;
}
```

基础类：

```ts
abstract class BaseWeapon {
  protected cooldownMs = 0;

  update(deltaMs: number) {
    this.cooldownMs -= deltaMs;

    if (this.cooldownMs <= 0) {
      this.fire();
      this.resetCooldown();
    }
  }
}
```

不要让 GameScene 负责所有武器逻辑。

---

# 16. 未来武器列表

MVP 之后逐步扩展。

规划武器：

```text
Machine Gun
Spread Gun
Laser
Missile
Lightning
Plasma
Flamethrower
Ice Cannon
Railgun
Boomerang Blade
Black Hole
Mine
Drone
Orbital Cannon
Energy Sword
EMP Pulse
```

---

# 17. 武器融合

MVP 可以先只实现接口和 2 个融合武器。

完整系统以后扩展。

融合示例：

```text
Laser Lv5
+
Lightning Lv5
+
Thunder Core
=
Thunder Laser
```

效果：

```text
激光命中敌人
↓
自动向周围敌人触发 Lightning Chain
```

---

第二个：

```text
Missile Lv5
+
Fire Core
=
Phoenix Missile
```

效果：

```text
导弹命中
↓
主爆炸
↓
产生 4 个火焰碎片
```

接口：

```ts
interface FusionRecipe {
  id: string;

  requiredWeapons: Array<{
    id: string;
    minLevel: number;
  }>;

  requiredItems?: string[];

  resultWeaponId: string;
}
```

---

# 18. MVP 道具设计

至少实现以下 10 个。

---

## 18.1 Attack Core

ID：

```text
attack_core
```

效果：

```text
All Damage +15%
```

可叠加：

```text
最多 5
```

---

## 18.2 Rapid Core

```text
fire_rate_core
```

效果：

```text
Fire Rate +12%
```

最多：

```text
5
```

---

## 18.3 Critical Core

```text
critical_core
```

效果：

```text
Critical Chance +5%
```

---

## 18.4 Shield

```text
shield
```

效果：

```text
抵挡 1 次伤害
```

玩家周围显示护盾。

---

## 18.5 Heal

```text
heal
```

效果：

```text
恢复 30 HP
```

如果满血：

```text
转化为临时 Shield
```

---

## 18.6 Magnet

```text
magnet
```

效果：

```text
吸收当前屏幕内所有经验球
```

立即生效。

---

## 18.7 Berserk

```text
berserk
```

效果：

```text
10 秒
Attack +50%
Fire Rate +50%
```

需要 Buff Timer UI。

---

## 18.8 Time Freeze

```text
time_freeze
```

效果：

```text
5 秒
普通敌人速度 -85%
敌方子弹速度 -70%
Boss 速度 -30%
```

Boss 不能被完全冻结。

---

## 18.9 EMP

```text
emp
```

效果：

```text
清除屏幕所有普通敌方子弹
普通敌人受到固定大量伤害
Boss 受到较低伤害
```

---

## 18.10 Phoenix Core

```text
phoenix_core
```

效果：

```text
死亡时复活一次
恢复 50% HP
清屏
```

每局最多触发一次。

---

# 19. 掉落系统

普通敌人：

```text
Energy Orb: 必掉 / 根据经验值掉多个
Item Pickup: 小概率
```

精英敌人：

```text
高概率道具
```

Boss：

```text
必掉强化奖励
```

配置：

```ts
interface DropTableEntry {
  itemId: string;
  weight: number;
  min?: number;
  max?: number;
}
```

不要直接 Math.random() 写死在 Enemy 死亡逻辑里。

统一：

```ts
DropTable.roll(tableId)
```

---

# 20. 敌人系统

MVP 需要 6 类。

---

## 20.1 Scout

ID：

```text
scout
```

行为：

```text
直线向下
不射击
血少
数量多
```

定位：

教学敌人。

---

## 20.2 ZigZag Fighter

ID：

```text
zigzag_fighter
```

行为：

```text
向下
+
左右正弦移动
```

---

## 20.3 Shooter

ID：

```text
shooter
```

行为：

```text
进入屏幕后减速
↓
每隔固定时间朝玩家射击
↓
继续下移
```

---

## 20.4 Charger

ID：

```text
charger
```

行为：

```text
短暂瞄准
↓
显示红色预警线 / 闪烁
↓
高速冲向玩家
```

非常适合产生紧张感。

---

## 20.5 Kamikaze

ID：

```text
kamikaze
```

行为：

持续追踪玩家。

靠近：

```text
闪烁
3
2
1
BOOM
```

实际不要显示数字。

使用快速闪红预警。

爆炸产生范围伤害。

---

## 20.6 Heavy Tank

ID：

```text
heavy_tank
```

特点：

```text
高血量
低速度
周期散射子弹
```

作为小型精英敌人。

---

# 21. Enemy 数据模型

```ts
interface EnemyConfig {
  id: string;

  maxHp: number;
  speed: number;

  collisionDamage: number;

  score: number;
  exp: number;

  aiType: string;

  weaponId?: string;

  spriteKey: string;

  hitbox: {
    width: number;
    height: number;
  };

  dropTableId?: string;
}
```

---

# 22. Wave 系统

Wave 不能写在 Enemy 类。

示例：

```ts
interface WaveConfig {
  startAtMs: number;

  groups: SpawnGroupConfig[];
}
```

```ts
interface SpawnGroupConfig {
  enemyId: string;

  count: number;

  intervalMs: number;

  pattern:
    | 'LINE'
    | 'V'
    | 'LEFT_RIGHT'
    | 'RANDOM'
    | 'CIRCLE'
    | 'CUSTOM';

  startX?: number;
}
```

---

# 23. Level 数据模型

```ts
interface LevelConfig {
  id: number;

  name: string;

  chapter: number;

  backgroundId: string;

  durationMs?: number;

  waves: WaveConfig[];

  bossId?: string;

  rewards: {
    coins: number;
  };
}
```

Boss 关：

```text
普通 Wave
↓
清场
↓
Warning
↓
Boss 出场
```

---

# 24. MVP 5 关详细设计

---

# Level 1 — First Flight

目标：

让玩家理解：

```text
移动
自动射击
击杀
经验
升级
```

敌人：

```text
Scout
ZigZag Fighter
```

时长：

```text
约 75 秒
```

Wave：

```text
00s Scout ×5

10s Scout ×8

22s ZigZag ×4

35s Scout ×10

48s ZigZag ×6

60s Scout ×12

结束
```

第一次升级必须保证给玩家看到：

```text
Machine Gun Upgrade
Spread Gun
Attack Core
```

至少包含明显的火力变化。

---

# Level 2 — Crossfire

新增：

```text
Shooter
```

时长：

```text
约 90 秒
```

重点：

让玩家开始躲子弹。

Wave：

```text
Scout
+
ZigZag
+
Shooter
```

后半段第一次混编。

---

# Level 3 — Red Alert

新增：

```text
Charger
```

玩法：

加入冲锋预警。

训练玩家观察：

```text
红色闪烁
↓
快速冲刺
```

不要只是加血量。

---

# Level 4 — Last Defense

新增：

```text
Kamikaze
Heavy Tank
```

重点：

Boss 前压力关。

结构：

```text
前半：杂兵
中段：Heavy Tank
后半：Kamikaze + Shooter
最后：Heavy Tank ×2
```

完成后进入：

```text
BOSS WARNING
```

但 Boss 实际在 Level 5。

---

# Level 5 — Mechanical Eagle

Boss 关。

Boss：

```text
Mechanical Eagle
```

进入关卡：

少量敌人 25~30 秒。

随后：

```text
音乐降低
↓
清除残余普通敌人
↓
清除残余敌方子弹
↓
屏幕顶部红色警报
↓
WARNING
↓
Boss 从上方进入
↓
Boss BGM
```

---

# 25. Boss：Mechanical Eagle

Boss ID：

```text
mechanical_eagle
```

初始 HP：

```text
10000
```

最终数值放配置。

Boss 必须 3 个阶段。

---

## Phase 1

HP：

```text
100% ~ 70%
```

攻击：

### Fan Shot

前方向玩家方向发射 5 发扇形子弹。

### Missile

周期发射 2 枚跟踪导弹。

### Horizontal Move

顶部左右移动。

攻击节奏不能同时全部释放。

---

## Phase 2

HP：

```text
70% ~ 35%
```

进入阶段时：

```text
Boss 停止 500ms
↓
机翼展开
↓
闪光
↓
震屏
↓
Phase Change
```

增加：

### Laser Sweep

Boss 从左向右扫激光。

必须提前：

```text
0.8 秒
```

显示预警。

玩家一定要有机会躲。

增加：

```text
Circle Shot
```

但弹速较慢。

---

## Phase 3

HP：

```text
35% ~ 0%
```

Boss 进入狂暴。

视觉：

```text
红光
引擎强化
背景轻微暗化
```

攻击：

```text
Fan Shot faster
Missile faster
Laser Sweep
Dash
```

Dash 前必须有明显预警。

禁止不可躲攻击。

---

# 26. Boss 状态机

推荐：

```text
ENTER
↓
PHASE_1
↓
PHASE_TRANSITION
↓
PHASE_2
↓
PHASE_TRANSITION
↓
PHASE_3
↓
DYING
↓
DEAD
```

接口：

```ts
type BossState =
  | 'ENTER'
  | 'PHASE_1'
  | 'PHASE_TRANSITION'
  | 'PHASE_2'
  | 'PHASE_3'
  | 'DYING'
  | 'DEAD';
```

状态转换禁止依赖散落的 bool。

---

# 27. Boss 死亡演出

Boss HP <= 0 后：

立即：

```text
停止攻击
停止生成子弹
关闭碰撞伤害
```

但不要立即 destroy。

演出：

```text
0ms
Boss freeze

100ms
small explosion #1

250ms
small explosion #2

400ms
small explosion #3

550ms
screen shake

650ms
large explosion

700ms
white flash

800ms
boss sprite fade / break

1000ms
Victory
```

可加入：

```text
短暂慢动作
```

MVP 不必实现真正改变全局 timeScale。

可以通过统一 TimeScaleManager。

---

# 28. Hit Feedback / 打击感

这是最高优先级之一。

所有玩家攻击命中至少包含：

```text
Hit Particle
Hit Flash
SFX
Damage Number
```

高级攻击额外：

```text
Screen Shake
Hit Stop
Shockwave
```

---

# 29. Hit Stop

轻量实现：

普通攻击：

```text
0ms
```

暴击：

```text
10~20ms
```

重型爆炸：

```text
30ms
```

Boss 部位 / Phase Break：

```text
50ms
```

禁止频繁暂停导致游戏卡顿。

HitStopController 必须有：

```text
cooldown
maxDuration
priority
```

避免 100 颗子弹同时触发 hit stop。

---

# 30. 相机震动规范

定义：

```ts
enum ShakeStrength {
  LIGHT,
  MEDIUM,
  HEAVY,
}
```

LIGHT：

```text
普通受击
普通小爆炸
```

MEDIUM：

```text
Missile
Elite death
```

HEAVY：

```text
Boss phase break
Boss death
```

设置中允许关闭：

```text
Screen Shake
```

---

# 31. Damage Number

显示：

普通：

```text
42
```

暴击：

```text
128!
```

Boss：

可以减少数字密度。

必须使用对象池。

避免每颗高频武器都生成大量文本。

推荐节流：

相同目标：

```text
50ms 内伤害合并
```

---

# 32. 爆炸

至少：

```text
SmallExplosion
MediumExplosion
LargeExplosion
BossExplosion
```

第一版没有正式美术时：

允许通过：

```text
Circle
Particles
Tween
Alpha
Scale
```

动态生成占位效果。

不要因为缺少 PNG 而阻塞功能开发。

---

# 33. 临时美术策略

Codex 第一阶段禁止依赖外部付费素材。

全部使用：

```text
Phaser Graphics
Canvas Texture
简单几何图形
程序化粒子
占位音效
```

生成：

- 玩家飞机
- 敌人
- 子弹
- 导弹
- 经验球
- Boss
- 爆炸
- UI

要求占位图仍然有颜色 / 形状区分。

例如：

```text
玩家：蓝白
普通敌机：红
精英：紫
敌方子弹：红橙
玩家子弹：蓝
经验：绿色
Boss：深红 + 灰
```

正式美术后只替换资源，不改业务逻辑。

---

# 34. 飞机外观成长

飞机升级必须有视觉反馈。

MVP 至少实现 3 阶段：

## Form 1

```text
基础飞机
```

## Form 2

满足：

```text
总武器等级 >= 5
```

视觉：

```text
增加左右 Wing Attachment
```

## Form 3

满足：

```text
总武器等级 >= 10
```

视觉：

```text
更大机翼
能量核心
额外发光点
```

不要改变碰撞盒尺寸。

原因：

避免“升级后反而更容易中弹”。

---

# 35. UI

游戏 HUD：

```text
┌─────────────────────┐
│ HP ████████         │
│ Lv 6                │
│ Score 10,450        │
│          Level 3    │
│                     │
│                     │
│       GAME          │
│                     │
│                     │
│                     │
│ EXP ██████████      │
└─────────────────────┘
```

Boss 出现：

顶部：

```text
MECHANICAL EAGLE

████████████████████
```

---

# 36. Upgrade UI

升级界面：

```text
LEVEL UP

┌────────────┐
│ Lightning  │
│ Chain +2   │
└────────────┘

┌────────────┐
│ Missile    │
│ Unlock     │
└────────────┘

┌────────────┐
│ Attack     │
│ +15%       │
└────────────┘
```

PC：

```text
点击
1 / 2 / 3
```

手机：

```text
触摸
```

选择后需要：

```text
短暂动画
+
SFX
```

---

# 37. 暂停

ESC：

```text
Pause
```

Pause UI：

```text
Resume
Restart
Settings
Quit
```

手机：

右上角暂停按钮。

---

# 38. Result

胜利：

```text
LEVEL COMPLETE
```

显示：

```text
Time
Kills
Damage
Damage Taken
Score
Coins
```

按钮：

```text
Next Level
Retry
Main Menu
```

失败：

```text
MISSION FAILED
```

按钮：

```text
Retry
Main Menu
```

---

# 39. 音频

AudioManager：

```ts
playSfx(id)
playMusic(id)
stopMusic()
setMusicVolume()
setSfxVolume()
```

MVP 音效：

```text
player_shoot
laser
missile_launch
missile_explosion
lightning
enemy_hit
enemy_explosion
player_hit
upgrade
pickup
boss_warning
boss_phase
boss_explosion
victory
game_over
```

防止 Machine Gun 每 100ms 播放完整音效造成噪音。

高频武器需要：

```text
rate limit
volume variation
pitch variation
```

---

# 40. Event Bus

推荐全局事件：

```ts
GAME_STARTED
LEVEL_STARTED

PLAYER_HIT
PLAYER_DIED

ENEMY_KILLED

EXP_GAINED
PLAYER_LEVEL_UP

UPGRADE_SELECTED

BOSS_SPAWNED
BOSS_PHASE_CHANGED
BOSS_KILLED

LEVEL_COMPLETED

GAME_PAUSED
GAME_RESUMED
```

不要让：

```text
Enemy
直接控制
HUD
```

例如：

```text
Enemy dies
↓
GameEventBus.emit(ENEMY_KILLED)
↓
ScoreSystem
HUD
DropSystem
StatsSystem
```

分别响应。

---

# 41. Object Pool 通用接口

设计：

```ts
interface Poolable {
  activate(...args: unknown[]): void;
  deactivate(): void;
  isActive(): boolean;
}
```

通用：

```ts
class ObjectPool<T extends Poolable> {
  acquire(): T;
  release(item: T): void;
}
```

重点对象：

```text
PlayerBullet
EnemyBullet
Enemy
Pickup
Explosion
DamageNumber
```

---

# 42. 碰撞层

定义：

```text
PLAYER
PLAYER_BULLET
ENEMY
ENEMY_BULLET
PICKUP
```

碰撞：

```text
PLAYER_BULLET <-> ENEMY

PLAYER <-> ENEMY

PLAYER <-> ENEMY_BULLET

PLAYER <-> PICKUP
```

不要：

```text
PLAYER_BULLET <-> ENEMY_BULLET
```

除非 EMP。

---

# 43. Damage 模型

```ts
interface DamageRequest {
  sourceId?: string;

  baseDamage: number;

  critChance: number;
  critMultiplier: number;

  damageType:
    | 'KINETIC'
    | 'LASER'
    | 'EXPLOSIVE'
    | 'LIGHTNING'
    | 'TRUE';

  canCrit: boolean;
}
```

返回：

```ts
interface DamageResult {
  finalDamage: number;
  isCrit: boolean;
}
```

以后可加：

```text
Armor
Resistance
Element
```

MVP 暂时不需要复杂属性克制。

---

# 44. 随机数

必须统一：

```ts
Random
```

不要项目内到处 Math.random()。

接口：

```ts
Random.float()
Random.int(min, max)
Random.pick(array)
Random.weighted(entries)
```

未来可以加入：

```text
Seed
```

用于重放与调试。

---

# 45. 调试工具

开发模式必须提供 Debug Overlay。

按：

```text
F2
```

显示：

```text
FPS
Enemy Count
Player Bullet Count
Enemy Bullet Count
Particle Count
Pool Usage
Current Wave
Current Level
Player HP
Player Weapon Levels
```

按：

```text
F3
```

开启碰撞盒。

开发命令：

```text
K -> kill all normal enemies
B -> spawn boss
U -> force level up
H -> heal player
G -> toggle god mode
```

只允许 development mode。

生产构建禁用。

---

# 46. 性能指标

目标设备：

普通近 5 年手机。

最低目标：

```text
60 FPS preferred
45 FPS acceptable under extreme bullet scenes
```

MVP 性能测试场景：

```text
50 enemies
250 player bullets
200 enemy bullets
100 particles
```

不能产生明显持续卡顿。

重点监控：

```text
GC
Sprite 创建
Text 创建
Particle 数量
Physics bodies
```

---

# 47. 100 关章节规划

MVP 后按以下方向扩展。

| Chapter | Level | Theme |
|---|---:|---|
| 1 | 1-10 | City Sky |
| 2 | 11-20 | Desert Base |
| 3 | 21-30 | Ocean Fleet |
| 4 | 31-40 | Frozen Zone |
| 5 | 41-50 | Volcano |
| 6 | 51-60 | Space Orbit |
| 7 | 61-70 | Alien Planet |
| 8 | 71-80 | Machine City |
| 9 | 81-90 | Black Hole |
| 10 | 91-100 | Final Homeworld |

每 5 关 Boss：

```text
5
10
15
20
...
100
```

其中每 10 关：

```text
Chapter Boss
```

5 的倍数但不是 10：

```text
Mid Boss
```

---

# 48. 完整版敌人扩展

未来至少：

```text
Scout
ZigZag
Shooter
Charger
Kamikaze
Tank
Sniper
Shield
Healer
Splitter
Stealth
Turret
Carrier
MineLayer
Elite
```

这些 AI 可以通过视觉 + 属性变化生成多个变体。

---

# 49. 完整 Boss 方向

规划：

```text
05  Mechanical Eagle
10  Sky Fortress

15  Sand Worm
20  Desert Titan

25  Kraken Carrier
30  Ocean Leviathan

35  Ice Queen
40  Frozen Destroyer

45  Magma Dragon
50  Volcano Core

55  Orbital Weapon
60  Moon Fortress

65  Alien Hive
70  Hive Queen

75  Machine Serpent
80  Omega Mech

85  Void Eye
90  Black Hole Guardian

95  Final General
100 Origin Destroyer
```

名字可后续修改。

---

# 50. 难度曲线原则

禁止：

```text
Enemy HP = Base HP * Level * 10
```

必须组合：

```text
更多敌人
+
更多 AI 类型
+
更复杂编队
+
更快弹幕
+
更高攻击频率
+
少量属性成长
```

玩家应该觉得：

```text
敌人变聪明 / 更复杂
```

而不是：

```text
只是血变厚。
```

---

# 51. 数值放大限制

后期避免数值失控。

推荐：

100 关结束时：

普通敌人 HP 与第一关普通敌人相比：

```text
10~30 倍
```

而不是：

```text
10000 倍
```

大量成长应来自：

```text
武器组合
武器范围
攻击速度
暴击
连锁
穿透
爆炸
```

而不是无限 Damage Multiplication。

---

# 52. 第一阶段实施任务

Codex 必须严格分阶段开发。

不要一次生成整个游戏。

---

# Milestone 0 — Project Bootstrap

目标：

项目可启动。

任务：

```text
Vite
TypeScript
Phaser
ESLint
Prettier
Vitest
```

要求：

```text
pnpm install
pnpm dev
pnpm build
pnpm test
```

全部可执行。

验收：

浏览器显示：

```text
PROJECT SKYFIRE
```

---

# Milestone 1 — Player Movement

实现：

```text
GameScene
PlayerAircraft
InputController
```

玩家：

```text
Keyboard
Mouse
Touch
```

移动。

边界限制。

验收：

```text
飞机可以平滑移动
不会离开屏幕
手机触摸逻辑可运行
```

---

# Milestone 2 — Basic Shooting

实现：

```text
MachineGun
Bullet
BulletPool
WeaponManager
```

自动射击。

验收：

```text
不会持续 new/destroy bullet
子弹离开屏幕后进入 pool
```

---

# Milestone 3 — Enemy

实现：

```text
Enemy
EnemyPool
EnemyFactory
Scout
```

子弹击中敌人。

敌人死亡。

验收：

```text
伤害
Hit flash
Explosion
Score
```

---

# Milestone 4 — Player Damage

实现：

```text
EnemyBullet
Player HP
invulnerability
death
restart
```

---

# Milestone 5 — Wave System

实现：

```text
LevelConfig
WaveConfig
SpawnManager
WaveManager
```

完成：

```text
Level 1
```

---

# Milestone 6 — EXP + Level Up

实现：

```text
Energy Orb
Pickup
EXP
Level Up
Upgrade UI
```

暂停战斗三选一。

---

# Milestone 7 — Five Weapons

加入：

```text
Machine Gun
Spread Gun
Laser
Missile
Lightning
```

必须使用统一 Weapon API。

---

# Milestone 8 — Ten Items

加入 10 个 MVP Items。

确保：

```text
Buff
Instant
Passive
Revive
```

四类机制均能支持。

---

# Milestone 9 — Levels 2-4

完成：

```text
Shooter
Charger
Kamikaze
Heavy Tank
```

以及关卡配置。

---

# Milestone 10 — Boss

实现：

```text
Mechanical Eagle
3 phases
Boss HP bar
Boss warning
Boss death
```

---

# Milestone 11 — Juice Pass

专门优化：

```text
Hit Flash
Camera Shake
Particles
Damage Number
Explosion
Hit Stop
Sound
Boss Effects
```

不要在前期为了特效拖慢核心功能。

---

# Milestone 12 — Save + Result

实现：

```text
Level Complete
Game Over
SaveManager
Highest Level
Settings
```

---

# Milestone 13 — Performance

压力测试：

```text
250 player bullets
200 enemy bullets
50 enemies
```

修复：

```text
allocation
GC
pool
collision
```

---

# 53. 测试要求

不要求对 Phaser 渲染层做大量单元测试。

必须测试纯逻辑。

例如：

```text
DamageCalculator
EXP Curve
UpgradeGenerator
DropTable
FusionRecipe
SaveMigration
Random Weighted Selection
Boss Phase Threshold
```

示例：

```ts
describe('BossPhase', () => {
  it('switches to phase 2 below 70%', () => {
    // ...
  });
});
```

---

# 54. 验收标准

MVP 完成必须满足：

## Core

- [ ] 能打开游戏。
- [ ] 能开始 Level 1。
- [ ] 玩家可以键盘移动。
- [ ] 玩家可以鼠标移动。
- [ ] 玩家可以 Touch 移动。
- [ ] 自动射击。
- [ ] 敌人可以出现。
- [ ] 玩家可以杀敌。
- [ ] 玩家可以受伤。
- [ ] 玩家可以死亡。
- [ ] 游戏可以重开。

## Progression

- [ ] 敌人掉经验。
- [ ] 玩家可以升级。
- [ ] 升级出现三选一。
- [ ] 五种武器都能获得。
- [ ] 武器等级会改变攻击效果。
- [ ] 至少十种道具可生效。
- [ ] 飞机至少有三阶段外观变化。

## Level

- [ ] Level 1 完成。
- [ ] Level 2 完成。
- [ ] Level 3 完成。
- [ ] Level 4 完成。
- [ ] Level 5 Boss 完成。

## Boss

- [ ] Boss 有三个阶段。
- [ ] 阶段切换有演出。
- [ ] 攻击有预警。
- [ ] 不存在理论不可躲攻击。
- [ ] Boss 死亡有完整演出。

## Juice

- [ ] 命中火花。
- [ ] 命中闪白。
- [ ] 爆炸。
- [ ] Damage Number。
- [ ] 暴击差异。
- [ ] Camera Shake。
- [ ] Boss Death Shake。
- [ ] 基础 SFX。

## Technical

- [ ] TypeScript strict。
- [ ] npm/pnpm build 通过。
- [ ] Vitest 通过。
- [ ] Bullet Pool 生效。
- [ ] Enemy Pool 生效。
- [ ] 没有明显持续内存增长。
- [ ] Debug Overlay 可用。

---

# 55. Codex 编码规则

Codex 在执行任务时：

## MUST

1. 每完成一个 Milestone 才进入下一个。
2. 保证项目始终可以运行。
3. 修改前阅读现有相关文件。
4. 不重复创建职责相同的 Manager。
5. 使用现有接口，不随意复制逻辑。
6. 新功能优先增加配置，而不是改 GameScene。
7. 单文件建议不超过 400 行。
8. 超过约 400 行时考虑合理拆分。
9. public API 必须有明确类型。
10. 禁止 `any`，除非确实无法避免且注明原因。
11. 新增纯逻辑必须考虑测试。
12. 所有 magic number 迁移到配置。
13. 重要系统写简短注释说明“为什么”，而不是解释显而易见代码。
14. 所有高频创建对象必须考虑 Pool。
15. 编译错误必须修复后才能继续。

---

# 56. Codex 禁止事项

禁止：

```text
一次性开发 100 关
```

禁止：

```text
100 个几乎复制粘贴的 Level 类
```

禁止：

```text
所有逻辑写 GameScene
```

禁止：

```text
Enemy1
Enemy2
Enemy3
Enemy4
```

大量重复类。

禁止：

```text
把全部数值硬编码。
```

禁止：

```text
为了“以后可能需要”
提前造复杂框架。
```

禁止：

```text
未确认就引入大量第三方依赖。
```

禁止：

```text
为了美术资源中断核心玩法实现。
```

禁止使用有版权风险的游戏角色、美术和音频。

---

# 57. 推荐第一批 Config

例如：

```text
config/
├── balance/
│   └── playerBalance.ts
├── weapons/
│   ├── machineGun.ts
│   ├── spreadGun.ts
│   ├── laser.ts
│   ├── missile.ts
│   └── lightning.ts
├── enemies/
│   ├── scout.ts
│   ├── zigzagFighter.ts
│   ├── shooter.ts
│   ├── charger.ts
│   ├── kamikaze.ts
│   └── heavyTank.ts
├── bosses/
│   └── mechanicalEagle.ts
├── items/
│   └── items.ts
└── levels/
    ├── level01.ts
    ├── level02.ts
    ├── level03.ts
    ├── level04.ts
    └── level05.ts
```

TypeScript Config 比 JSON 更适合第一版：

原因：

```text
类型检查
IDE 提示
Refactor 安全
```

以后需要外部编辑器时再迁移 JSON。

---

# 58. Weapon Config 示例

```ts
export interface WeaponLevelConfig {
  damage: number;
  fireIntervalMs: number;

  projectileCount?: number;
  spreadAngle?: number;

  speed?: number;
  pierce?: number;

  explosionRadius?: number;

  chainCount?: number;
}

export interface WeaponConfig {
  id: string;
  name: string;

  maxLevel: number;

  levels: Record<number, WeaponLevelConfig>;
}
```

---

# 59. Enemy Config 示例

```ts
export const scoutConfig: EnemyConfig = {
  id: 'scout',

  maxHp: 30,

  speed: 120,

  collisionDamage: 10,

  score: 100,

  exp: 5,

  aiType: 'STRAIGHT',

  spriteKey: 'enemy_scout',

  hitbox: {
    width: 28,
    height: 28,
  },

  dropTableId: 'normal_enemy',
};
```

---

# 60. Level Config 示例

```ts
export const level01: LevelConfig = {
  id: 1,

  name: 'First Flight',

  chapter: 1,

  backgroundId: 'city_sky',

  waves: [
    {
      startAtMs: 0,

      groups: [
        {
          enemyId: 'scout',
          count: 5,
          intervalMs: 500,
          pattern: 'V',
        },
      ],
    },

    {
      startAtMs: 10000,

      groups: [
        {
          enemyId: 'scout',
          count: 8,
          intervalMs: 400,
          pattern: 'LEFT_RIGHT',
        },
      ],
    },
  ],

  rewards: {
    coins: 50,
  },
};
```

---

# 61. Boss Config 示例

```ts
export interface BossPhaseConfig {
  id: string;

  hpThreshold: number;

  movePattern: string;

  attackPatterns: Array<{
    patternId: string;
    cooldownMs: number;
    weight: number;
  }>;
}

export interface BossConfig {
  id: string;

  name: string;

  maxHp: number;

  phases: BossPhaseConfig[];
}
```

---

# 62. Game Loop 职责

GameScene.update：

只允许承担高层调度。

示例：

```ts
update(time: number, delta: number) {
  this.inputController.update(delta);

  this.playerController.update(delta);

  this.weaponManager.update(delta);

  this.enemyController.update(delta);

  this.waveManager.update(delta);

  this.effectManager.update(delta);
}
```

禁止 GameScene 出现大量：

```text
enemy AI
damage formulas
boss attacks
drop probability
weapon fire calculations
```

---

# 63. 页面流程

```text
LOAD
↓
MAIN MENU

START
↓
LEVEL SELECT

LEVEL 1
↓
GAME

Victory
↓
RESULT

Next
↓
LEVEL 2
```

MVP Level Select 可以非常简单：

```text
1
2
3
4
5
```

未解锁灰掉。

---

# 64. 存档规则

完成 Level N：

```text
highestUnlockedLevel =
max(current, N + 1)
```

Level 5：

完成后：

```text
highestUnlockedLevel = 6
```

即使 MVP 没有 Level 6，也允许内部记录。

---

# 65. 第一版不做的内容

明确 Out of Scope：

```text
登录
服务器
数据库
多人
PVP
在线排行榜
商城
皮肤付费
每日任务
广告
云存档
社交
公会
复杂剧情
100 关正式内容
关卡编辑器
正式运营后台
```

避免 Codex 擅自扩需求。

---

# 66. MVP 成功定义

项目完成不是以：

```text
代码很多
```

为标准。

而是：

玩家打开游戏之后：

```text
30 秒内理解玩法

1 分钟内第一次明显升级

3~5 分钟形成明显 Build

完成前 4 关后期待 Boss

Boss 战能够感受到阶段变化

Boss 死亡有明显爽感
```

如果这些不成立：

优先调整玩法。

不是继续堆功能。

---

# 67. Codex 第一条执行 Prompt

完成项目规格阅读后，第一条任务只执行：

```text
请完整阅读 GAME_SPEC.md。

当前只执行 Milestone 0：Project Bootstrap。

要求：

1. 创建 Vite + TypeScript + Phaser 4.2.1 项目。
2. 使用 pnpm。
3. 配置 TypeScript strict。
4. 配置 ESLint、Prettier、Vitest。
5. 创建最小 Phaser Game。
6. 浏览器中央显示 “PROJECT SKYFIRE”。
7. 创建基础目录，但不要创建大量无用空文件。
8. 添加 README 的启动命令。
9. 执行并确认：
   pnpm test
   pnpm build
10. 不要开始实现 Player、Enemy、Weapon。

完成后向我汇报：
- 创建了哪些文件
- 关键技术决策
- build/test 结果
- 下一 Milestone 建议
```

---

# 68. 后续 Codex 工作方式

建议每次只下一个 Milestone。

例如第二次：

```text
继续阅读 GAME_SPEC.md。

现在只实现：

Milestone 1 — Player Movement。

严格遵守已有架构。

完成后运行：
pnpm test
pnpm build

不要提前实现 Weapon 或 Enemy。
```

第三次：

```text
实现 Milestone 2 — Basic Shooting。
```

这样比一次告诉 Codex：

```text
“帮我把整个游戏写完”
```

可靠很多。

---

# 69. AI 开发中的验收规则

Codex 每次提交前必须：

```text
1. 阅读现有代码
2. 实现当前 Milestone
3. 补充必要测试
4. pnpm test
5. pnpm build
6. 修复报错
7. 总结改动
```

如果发现规格与当前代码冲突：

优先：

```text
保持现有可运行代码
+
最小重构
```

不要直接大规模重写。

---

# 70. Git 建议

分支：

```text
main
develop
feature/*
```

或者个人开发更简单：

```text
main
feature/*
```

提交示例：

```text
feat: bootstrap phaser project
feat: add player movement
feat: add bullet object pool
feat: add scout enemy
feat: add experience upgrade system
feat: add mechanical eagle boss
fix: prevent repeated player collision damage
perf: pool damage text objects
```

每个 Milestone 尽量一个或少量可回退提交。

---

# 71. 最终 MVP Definition of Done

只有下面全部达成才算 MVP 完成：

```text
5 个关卡
1 个完整 Boss
6 类敌人
5 类武器
10 类道具
升级三选一
飞机视觉成长
Boss 三阶段
Hit Feedback
Explosion
Camera Shake
Hit Stop
Damage Number
Sound
Save
Result
Restart
Touch
Keyboard
Mouse
Object Pool
Performance Test
Build Pass
Tests Pass
```

最后再决定是否进入：

```text
MVP 2
```

MVP 2 再开发：

```text
10 关
第二个 Boss
融合武器
浮游炮
僚机
精英怪
更多飞机形态
正式美术
正式音效
```

---

# 72. 最终产品扩展方向

完成 10 关后再评估：

```text
PWA
Capacitor App
微信小游戏
排行榜
账号
成就
每日任务
机库
战机解锁
装备系统
难度模式
无尽模式
Boss Rush
```

但这些全部不是当前 MVP 内容。

---

# 73. 最重要的开发原则

最后重复：

```text
先让“射击”爽。
再让“升级”爽。
再让“Boss”爽。
最后才扩关卡数量。
```

第一阶段不要追求：

```text
100 关
100 道具
几十架飞机
复杂系统
```

第一阶段真正目标只有一个：

> **完成一个只有 5 关，但玩家愿意反复玩的飞机射击小游戏。**

---

# Appendix A — 推荐执行顺序

```text
M0 Project Bootstrap
 ↓
M1 Player Movement
 ↓
M2 Basic Shooting
 ↓
M3 Enemy + Damage
 ↓
M4 Player Damage
 ↓
M5 Wave
 ↓
M6 EXP + Upgrade
 ↓
M7 Five Weapons
 ↓
M8 Ten Items
 ↓
M9 Level 2-4
 ↓
M10 Boss
 ↓
M11 Juice Pass
 ↓
M12 Save + Result
 ↓
M13 Performance
 ↓
MVP COMPLETE
```

---

# Appendix B — 初始玩法验证重点

每一个里程碑都问：

```text
现在比上个版本更好玩吗？
```

尤其关注：

### Movement

```text
飞机是否跟手？
```

### Shooting

```text
射击是否有力量感？
```

### Enemy

```text
敌人死亡是否爽？
```

### Upgrade

```text
升级后是否真的能看出来？
```

### Boss

```text
是否需要观察和躲避？
```

### Build

```text
不同武器组合是否有明显差异？
```

这些问题优先级高于代码行数。

---

# Appendix C — 技术版本说明

编写本规格时建议基线：

```text
Phaser 4.2.1
Vite 8.x
TypeScript 5.x
Node.js 22 LTS+
pnpm
Vitest
```

项目实际初始化时允许选择兼容的最新 patch/minor 版本，但：

- Phaser 保持 4.2.1 或经过验证的兼容 4.x。
- 不允许未经评估直接跨主要版本。
- package.json 应锁定实际采用版本。
- pnpm-lock.yaml 必须提交 Git。

---

**END OF SPEC**
