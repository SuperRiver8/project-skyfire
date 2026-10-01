import Phaser from 'phaser';
import { gameConfig } from './game/GameConfig';
import './style.css';
import { riverPlatform } from './game/platform/platformClient';

void riverPlatform.initialize();
const game = new Phaser.Game(gameConfig);

// 开发环境暴露 game 实例，便于浏览器控制台调试（生产构建不包含）
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__game = game;
}
