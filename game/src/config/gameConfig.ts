import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_PALETTE } from './constants.js';
import { BootScene } from '../scenes/BootScene.js';
import { PreloadScene } from '../scenes/PreloadScene.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLOR_PALETTE.bgMidnightPlum,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  input: {
    activePointers: 3, // Enable multi-touch reflex tapping on mobile devices
    touch: {
      capture: true,
    },
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, GameOverScene],
};
