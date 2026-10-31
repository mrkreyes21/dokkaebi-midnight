import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(gameConfig);
});
