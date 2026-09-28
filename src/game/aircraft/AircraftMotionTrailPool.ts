import Phaser from 'phaser';
import { aircraftEffectVisuals } from '../../config/aircraft/aircraftVisuals';
import { ObjectPool } from '../utils/ObjectPool';

class AircraftGhost extends Phaser.GameObjects.Image {
  private remainingMs = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'player_form_1');
    this.setActive(false).setVisible(false);
    scene.add.existing(this);
  }

  activate(
    texture: string,
    x: number,
    y: number,
    rotation: number,
    scaleX: number,
    scaleY: number,
    flipY: boolean,
    depth: number,
    tint: number,
  ): void {
    this.setTexture(texture).setPosition(x, y).setRotation(rotation);
    this.setScale(scaleX, scaleY).setFlipY(flipY).setTint(tint);
    this.setDepth(depth).setAlpha(0.32).setActive(true).setVisible(true);
    this.remainingMs = aircraftEffectVisuals.trailLifeMs;
  }

  advance(deltaMs: number): boolean {
    this.remainingMs -= deltaMs;
    this.setAlpha(
      0.32 * Math.max(0, this.remainingMs / aircraftEffectVisuals.trailLifeMs),
    );
    this.setScale(
      this.scaleX * (1 + deltaMs * 0.00035),
      this.scaleY * (1 + deltaMs * 0.00035),
    );
    return this.remainingMs <= 0;
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
  }

  isActive(): boolean {
    return this.active;
  }
}

// 所有飞机共享一个场景级残影池，仅高速状态取用，不在每帧创建或销毁贴图。
export class AircraftMotionTrailPool {
  private static readonly instances = new WeakMap<
    Phaser.Scene,
    AircraftMotionTrailPool
  >();
  private readonly pool: ObjectPool<AircraftGhost>;

  static forScene(scene: Phaser.Scene): AircraftMotionTrailPool {
    let instance = this.instances.get(scene);
    if (!instance) {
      instance = new AircraftMotionTrailPool(scene);
      this.instances.set(scene, instance);
    }
    return instance;
  }

  private constructor(private readonly scene: Phaser.Scene) {
    this.pool = new ObjectPool(
      () => new AircraftGhost(scene),
      aircraftEffectVisuals.trailPoolSize,
    );
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  emit(
    texture: string,
    x: number,
    y: number,
    rotation: number,
    scaleX: number,
    scaleY: number,
    flipY: boolean,
    depth: number,
    tint: number,
  ): void {
    if (this.pool.activeCount >= aircraftEffectVisuals.trailMaxActive) return;
    this.pool
      .acquire()
      .activate(texture, x, y, rotation, scaleX, scaleY, flipY, depth, tint);
  }

  update(deltaMs: number): void {
    for (const ghost of this.pool.activeItems())
      if (ghost.advance(deltaMs)) this.pool.release(ghost);
  }

  private destroy(): void {
    for (const ghost of this.pool.allItems()) ghost.destroy();
    AircraftMotionTrailPool.instances.delete(this.scene);
  }
}
