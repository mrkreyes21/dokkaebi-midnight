export interface ShareCardData {
  score: number;
  bestScore: number;
  playerName: string;
}

export class ShareCardService {
  /**
   * Generates a high-quality 600x600 PNG base64 data URL using an off-screen HTML5 Canvas.
   */
  public static generateCard(data: ShareCardData): string {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Deep Midnight Background
    const bgGradient = ctx.createRadialGradient(300, 250, 50, 300, 300, 400);
    bgGradient.addColorStop(0, '#263C61');
    bgGradient.addColorStop(0.5, '#171326');
    bgGradient.addColorStop(1, '#0C0817');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 600, 600);

    // Decorative border
    ctx.strokeStyle = '#D7AD66';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 568, 568);

    ctx.strokeStyle = 'rgba(215, 173, 102, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 24, 552, 552);

    // 2. Full Moon
    const moonGrad = ctx.createRadialGradient(300, 150, 10, 300, 150, 70);
    moonGrad.addColorStop(0, '#FDF7E7');
    moonGrad.addColorStop(0.8, '#FFE29A');
    moonGrad.addColorStop(1, 'rgba(215, 173, 102, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(300, 150, 70, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    ctx.fillStyle = '#FFFDF7';
    ctx.beginPath();
    ctx.arc(300, 150, 48, 0, Math.PI * 2);
    ctx.fill();

    // 3. Cute Dokkaebi Mascot on Moon
    // Cyan Body
    ctx.fillStyle = '#58C9ED';
    ctx.beginPath();
    ctx.arc(300, 150, 34, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(288, 124);
    ctx.lineTo(294, 108);
    ctx.lineTo(300, 124);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(300, 124);
    ctx.lineTo(306, 108);
    ctx.lineTo(312, 124);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#171326';
    ctx.beginPath();
    ctx.arc(292, 148, 4, 0, Math.PI * 2);
    ctx.arc(308, 148, 4, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#171326';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(300, 154, 7, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // 4. Header Titles
    ctx.textAlign = 'center';
    ctx.fillStyle = '#D7AD66';
    ctx.font = 'bold 24px serif';
    ctx.fillText('도 깨 비', 300, 255);

    ctx.fillStyle = '#F4EBDD';
    ctx.font = '800 28px sans-serif';
    ctx.fillText('DOKKAEBI: THE MIDNIGHT GAME', 300, 290);

    // 5. Score Highlight Box
    ctx.fillStyle = 'rgba(26, 21, 46, 0.85)';
    ctx.fillRect(120, 320, 360, 130);
    ctx.strokeStyle = '#D7AD66';
    ctx.lineWidth = 2;
    ctx.strokeRect(120, 320, 360, 130);

    ctx.fillStyle = '#9F99B2';
    ctx.font = '600 14px sans-serif';
    ctx.fillText('FINAL SPIRIT SCORE', 300, 350);

    ctx.fillStyle = '#58C9ED';
    ctx.font = '900 52px sans-serif';
    ctx.fillText(`${data.score}`, 300, 410);

    // 6. Challenge Callout Text
    ctx.fillStyle = '#F4EBDD';
    ctx.font = '600 16px sans-serif';
    ctx.fillText(
      `I caught ${data.score} spirits in 30 seconds! Can you beat me?`,
      300,
      485
    );

    ctx.fillStyle = '#D7AD66';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`Hunter: ${data.playerName}  |  Best: ${data.bestScore} pts`, 300, 520);

    ctx.fillStyle = '#58C9ED';
    ctx.font = '12px sans-serif';
    ctx.fillText('Play now on Facebook Instant Games', 300, 555);

    return canvas.toDataURL('image/png');
  }
}
