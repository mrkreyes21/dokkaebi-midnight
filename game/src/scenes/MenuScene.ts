import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_PALETTE } from '../config/constants.js';
import { getPlatformService } from '../services/platform/PlatformManager.js';
import { AudioService } from '../services/AudioService.js';

export class MenuScene extends Phaser.Scene {
  private fireflies: Phaser.GameObjects.Arc[] = [];
  private soundEnabled: boolean = true;
  private soundBtnText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const platform = getPlatformService();
    const bestScore = platform.getBestScore();
    this.soundEnabled = AudioService.getInstance().isEnabled();

    // 1. Deep night sky background
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      COLOR_PALETTE.bgNightNavy,
      COLOR_PALETTE.bgNightNavy,
      COLOR_PALETTE.bgMidnightPlum,
      COLOR_PALETTE.bgMidnightPlum,
      1
    );
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Full Moon with luminous halo
    const moonHalo = this.add.graphics();
    moonHalo.fillStyle(0xd7ad66, 0.08);
    moonHalo.fillCircle(GAME_WIDTH / 2, 210, 110);
    moonHalo.fillStyle(0xd7ad66, 0.15);
    moonHalo.fillCircle(GAME_WIDTH / 2, 210, 80);
    moonHalo.fillStyle(0xfdf7e7, 0.95);
    moonHalo.fillCircle(GAME_WIDTH / 2, 210, 52);

    // Subtle moon pulse
    this.tweens.add({
      targets: moonHalo,
      alpha: 0.8,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. Floating fireflies
    this.createFireflies();

    // 4. Hanok village silhouette at the bottom
    this.drawHanokSilhouettes();

    // 5. Title & Korean lettering
    this.add.text(GAME_WIDTH / 2, 85, '도 깨 비', {
      fontFamily: '"Noto Serif KR", serif',
      fontSize: '48px',
      color: '#D7AD66',
      fontStyle: '900',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 135, 'DOKKAEBI', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '26px',
      color: '#F4EBDD',
      fontStyle: '800',
      letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 162, 'THE MIDNIGHT GAME', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '12px',
      color: '#58C9ED',
      letterSpacing: 6,
    }).setOrigin(0.5);

    // 6. Center Dokkaebi Mascot Container
    this.createMascot(GAME_WIDTH / 2, 335);

    // 7. Best Score Badge
    const badgeY = 445;
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0x1a152e, 0.9);
    badgeBg.fillRoundedRect(GAME_WIDTH / 2 - 120, badgeY - 18, 240, 36, 18);
    badgeBg.lineStyle(1.5, COLOR_PALETTE.warmGold, 0.5);
    badgeBg.strokeRoundedRect(GAME_WIDTH / 2 - 120, badgeY - 18, 240, 36, 18);

    this.add.text(GAME_WIDTH / 2, badgeY, `★ PERSONAL BEST: ${bestScore} PTS`, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '14px',
      color: '#D7AD66',
      fontStyle: '700',
      letterSpacing: 1,
    }).setOrigin(0.5);

    // 8. Quick Instruction Guide
    this.add.text(GAME_WIDTH / 2, 505, 'Catch the spirits before they shrink!', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '15px',
      color: '#F4EBDD',
      fontStyle: '600',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 530, 'Avoid the crimson cursed spirits! 30 seconds only.', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '12px',
      color: '#9F99B2',
    }).setOrigin(0.5);

    // 9. Interactive Play Button
    const playBtnY = 620;
    const playBtn = this.createButton(
      GAME_WIDTH / 2,
      playBtnY,
      220,
      60,
      'PLAY NOW',
      COLOR_PALETTE.warmGold,
      0x171326,
      () => {
        this.scene.start('GameScene');
      }
    );

    // Play button breathing animation
    this.tweens.add({
      targets: playBtn,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut',
    });

    // 10. Sound Toggle and Platform Info
    this.createSoundToggle(GAME_WIDTH - 65, 45);

    // Player greeting
    const player = platform.getPlayer();
    this.add.text(25, 45, `Player: ${player.name}`, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '12px',
      color: '#9F99B2',
    }).setOrigin(0, 0.5);
  }

  private createMascot(x: number, y: number): void {
    const mascot = this.add.container(x, y);

    const aura = this.add.graphics();
    aura.fillStyle(COLOR_PALETTE.spiritCyan, 0.15);
    aura.fillCircle(0, 0, 52);
    mascot.add(aura);

    const body = this.add.graphics();
    body.fillStyle(COLOR_PALETTE.spiritCyan, 1);
    body.fillCircle(0, 0, 38);

    // Horns
    body.fillStyle(0xffffff, 1);
    body.fillTriangle(-12, -30, -6, -46, 0, -30);
    body.fillTriangle(0, -30, 6, -46, 12, -30);

    // Eyes
    body.fillStyle(0x171326, 1);
    body.fillCircle(-10, -2, 4.5);
    body.fillCircle(10, -2, 4.5);

    // Eye shines
    body.fillStyle(0xffffff, 1);
    body.fillCircle(-8, -4, 2);
    body.fillCircle(12, -4, 2);

    // Smile
    body.lineStyle(2.5, 0x171326, 1);
    body.beginPath();
    body.arc(0, 6, 8, 0.2, Math.PI - 0.2, false);
    body.strokePath();

    // Rosy cheeks
    body.fillStyle(0xff94a8, 0.6);
    body.fillCircle(-18, 4, 4);
    body.fillCircle(18, 4, 4);

    mascot.add(body);

    // Floating bobbing motion
    this.tweens.add({
      targets: mascot,
      y: y - 12,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createFireflies(): void {
    for (let i = 0; i < 16; i++) {
      const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
      const y = Phaser.Math.Between(80, GAME_HEIGHT - 120);
      const fly = this.add.circle(x, y, Phaser.Math.Between(1.5, 3), 0x58c9ed, 0.65);
      this.fireflies.push(fly);

      this.tweens.add({
        targets: fly,
        x: x + Phaser.Math.Between(-30, 30),
        y: y + Phaser.Math.Between(-25, 25),
        alpha: { from: 0.2, to: 0.8 },
        duration: Phaser.Math.Between(2000, 4500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private drawHanokSilhouettes(): void {
    const g = this.add.graphics();
    g.fillStyle(0x0c0817, 0.95);

    // Layer 1: Distant roof silhouettes
    const yBase = GAME_HEIGHT;
    g.beginPath();
    g.moveTo(0, yBase);
    g.lineTo(0, yBase - 110);
    g.lineTo(70, yBase - 135);
    g.lineTo(130, yBase - 115);
    g.lineTo(210, yBase - 150);
    g.lineTo(270, yBase - 170); // central pagoda eaves
    g.lineTo(330, yBase - 150);
    g.lineTo(410, yBase - 115);
    g.lineTo(470, yBase - 135);
    g.lineTo(GAME_WIDTH, yBase - 110);
    g.lineTo(GAME_WIDTH, yBase);
    g.closePath();
    g.fillPath();

    // Layer 2: Lantern posts
    g.fillStyle(0xd7ad66, 0.4);
    g.fillCircle(100, yBase - 110, 4);
    g.fillCircle(GAME_WIDTH - 100, yBase - 110, 4);
  }

  private createButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    bgColor: number,
    textColor: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);

    // Inner bevel highlight
    bg.lineStyle(2, 0xffffff, 0.4);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    container.add(bg);

    const txt = this.add.text(0, 0, label, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '20px',
      color: '#171326',
      fontStyle: '900',
      letterSpacing: 2,
    }).setOrigin(0.5);
    container.add(txt);

    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xfff1bf, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      bg.lineStyle(2, 0xffffff, 0.7);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(bgColor, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      bg.lineStyle(2, 0xffffff, 0.4);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    });

    container.on('pointerdown', () => {
      container.setScale(0.96);
      AudioService.getInstance().playButtonClick();
    });

    container.on('pointerup', () => {
      container.setScale(1);
      onClick();
    });

    return container;
  }

  private createSoundToggle(x: number, y: number): void {
    const audio = AudioService.getInstance();
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x221a3a, 0.8);
    bg.fillRoundedRect(-32, -16, 64, 32, 16);
    bg.lineStyle(1, COLOR_PALETTE.textMuted, 0.4);
    bg.strokeRoundedRect(-32, -16, 64, 32, 16);
    btn.add(bg);

    const isEnabled = audio.isEnabled();
    this.soundBtnText = this.add.text(0, 0, isEnabled ? 'SFX: ON' : 'SFX: OFF', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '10px',
      color: isEnabled ? '#58C9ED' : '#9F99B2',
      fontStyle: '700',
    }).setOrigin(0.5);
    btn.add(this.soundBtnText);

    btn.setSize(64, 32);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      const nowEnabled = audio.toggle();
      this.soundBtnText.setText(nowEnabled ? 'SFX: ON' : 'SFX: OFF');
      this.soundBtnText.setColor(nowEnabled ? '#58C9ED' : '#9F99B2');
    });
  }
}
