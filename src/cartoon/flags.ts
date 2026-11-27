export type FlagKind = 'nazi' | 'soviet' | 'italy' | 'japan';

/**
 * Draws a crisp tilted 45-degree black Hakenkreuz (swastika) centered at (0, 0).
 */
export function drawSwastikaVector(
  ctx: CanvasRenderingContext2D,
  radius: number,
  color = '#14110E'
): void {
  ctx.save();
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color;
  const armLen = radius * 1.48;
  const thickness = radius * 0.3;
  const halfT = thickness / 2;
  const halfLen = armLen / 2;

  // Main cross bars
  ctx.fillRect(-halfLen, -halfT, armLen, thickness);
  ctx.fillRect(-halfT, -halfLen, thickness, armLen);

  // Four right-angled clockwise hooks
  // Top arm hook pointing right
  ctx.fillRect(-halfT, -halfLen, halfLen + halfT, thickness);
  // Right arm hook pointing down
  ctx.fillRect(halfLen - thickness, -halfT, thickness, halfLen + halfT);
  // Bottom arm hook pointing left
  ctx.fillRect(-halfLen, halfLen - thickness, halfLen + halfT, thickness);
  // Left arm hook pointing up
  ctx.fillRect(-halfLen, -halfLen, thickness, halfLen + halfT);
  ctx.restore();
}

/**
 * Draws the Soviet gold star and hammer-and-sickle emblem centered at (cx, cy).
 */
function drawHammerAndSickle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Five-pointed gold star above
  ctx.strokeStyle = '#F2C94C';
  ctx.fillStyle = '#F2C94C';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 10 : 4.5;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = Math.cos(angle) * r;
    const py = -22 + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Sickle crescent blade
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 4, 15, -Math.PI * 0.72, Math.PI * 0.62, false);
  ctx.stroke();

  // Sickle handle
  ctx.lineWidth = 5.2;
  ctx.beginPath();
  ctx.moveTo(-10, 14);
  ctx.lineTo(-17, 21);
  ctx.stroke();

  // Hammer handle
  ctx.lineWidth = 4.6;
  ctx.beginPath();
  ctx.moveTo(-12, -8);
  ctx.lineTo(15, 19);
  ctx.stroke();

  // Hammer head
  ctx.save();
  ctx.translate(-9, -6);
  ctx.rotate(-Math.PI / 4);
  ctx.fillRect(-8, -4.5, 16, 9);
  ctx.restore();

  ctx.restore();
}

/**
 * Draws Fascist Italy coat of arms (Savoy shield + crown + fasces rods) at (cx, cy).
 */
function drawItalyEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Flanking fasces bundles
  ctx.fillStyle = '#B8893A';
  ctx.strokeStyle = '#1E1813';
  ctx.lineWidth = 1.6;
  ctx.fillRect(-21, -12, 6, 26);
  ctx.strokeRect(-21, -12, 6, 26);
  ctx.fillRect(15, -12, 6, 26);
  ctx.strokeRect(15, -12, 6, 26);

  // Crown
  ctx.fillStyle = '#E5B94C';
  ctx.beginPath();
  ctx.moveTo(-11, -14);
  ctx.lineTo(-13, -24);
  ctx.lineTo(-5, -19);
  ctx.lineTo(0, -26);
  ctx.lineTo(5, -19);
  ctx.lineTo(13, -24);
  ctx.lineTo(11, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Blue-bordered red Savoy shield with white cross
  ctx.fillStyle = '#244A7E';
  ctx.beginPath();
  ctx.moveTo(-13, -12);
  ctx.lineTo(13, -12);
  ctx.lineTo(13, 6);
  ctx.quadraticCurveTo(13, 18, 0, 23);
  ctx.quadraticCurveTo(-13, 18, -13, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#B82525';
  ctx.beginPath();
  ctx.moveTo(-9, -8);
  ctx.lineTo(9, -8);
  ctx.lineTo(9, 5);
  ctx.quadraticCurveTo(9, 14, 0, 18);
  ctx.quadraticCurveTo(-9, 14, -9, 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#F4EDE0';
  ctx.fillRect(-2.6, -7, 5.2, 23);
  ctx.fillRect(-8.5, 0, 17, 4.8);

  ctx.restore();
}

/**
 * Draws a rectangular waving period flag (horizontal orientation, ideal for poles, tanks, ships, and walls).
 */
export function drawPeriodFlag(
  ctx: CanvasRenderingContext2D,
  kind: FlagKind,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  waveAmp = 5,
  droop = 0
): void {
  ctx.save();
  ctx.translate(x, y);

  // Apply slight droop rotation when banners wilt in Act 7
  if (droop > 0) {
    ctx.rotate(droop * 0.28);
  }

  // Create wavy cloth clip silhouette
  const steps = 16;
  const topY = (u: number) =>
    Math.sin(u * 5.2 - t * 5.4) * waveAmp * u + droop * u * u * 26;
  const botY = (u: number) =>
    h + Math.sin(u * 5.2 - t * 5.4 + 0.6) * waveAmp * u + droop * u * u * 30;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 1; i <= steps; i++) {
    const u = i / steps;
    ctx.lineTo(u * w, topY(u));
  }
  for (let i = steps; i >= 0; i--) {
    const u = i / steps;
    ctx.lineTo(u * w, botY(u));
  }
  ctx.closePath();

  ctx.save();
  ctx.clip();

  const shiftY = Math.sin(2.6 - t * 5.4) * waveAmp * 0.45 + droop * 8;

  if (kind === 'nazi') {
    ctx.fillStyle = '#C42121';
    ctx.fillRect(-4, -30, w + 8, h + 70);

    const cx = w * 0.48;
    const cy = h * 0.5 + shiftY;
    const discR = Math.min(w, h) * 0.34;
    ctx.fillStyle = '#F5EFE0';
    ctx.beginPath();
    ctx.arc(cx, cy, discR, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    drawSwastikaVector(ctx, discR * 0.66, '#14110E');
    ctx.restore();
  } else if (kind === 'soviet') {
    ctx.fillStyle = '#B51A1A';
    ctx.fillRect(-4, -30, w + 8, h + 70);
    drawHammerAndSickle(
      ctx,
      w * 0.28,
      h * 0.38 + shiftY * 0.6,
      Math.min(w, h) / 115
    );
  } else if (kind === 'italy') {
    ctx.fillStyle = '#1E6F3C';
    ctx.fillRect(-4, -30, w / 3 + 4, h + 70);
    ctx.fillStyle = '#F3ECD9';
    ctx.fillRect(w / 3, -30, w / 3, h + 70);
    ctx.fillStyle = '#BD2525';
    ctx.fillRect((2 * w) / 3, -30, w / 3 + 6, h + 70);
    drawItalyEmblem(
      ctx,
      w * 0.5,
      h * 0.5 + shiftY,
      Math.min(w, h) / 86
    );
  } else if (kind === 'japan') {
    ctx.fillStyle = '#F3ECD9';
    ctx.fillRect(-4, -30, w + 8, h + 70);

    const cx = w * 0.44;
    const cy = h * 0.5 + shiftY;
    const rayCount = 16;
    const maxR = Math.hypot(w, h) * 1.15;
    ctx.fillStyle = '#BE1E24';
    for (let i = 0; i < rayCount; i++) {
      const a0 = (i * Math.PI * 2) / rayCount;
      const a1 = a0 + Math.PI / rayCount;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a0) * maxR, cy + Math.sin(a0) * maxR);
      ctx.lineTo(cx + Math.cos(a1) * maxR, cy + Math.sin(a1) * maxR);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle cloth highlight/shadow folds for 1940s painted depth (allocation-free)
  for (let i = 0; i < 4; i++) {
    const fx = ((i + 0.5) / 4) * w + Math.sin(t * 4 + i) * 6;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(20, 14, 10, 0.11)' : 'rgba(255, 248, 232, 0.08)';
    ctx.fillRect(fx - 12, -20, 24, h + 50);
  }

  ctx.restore();

  // Crisp vintage ink outline around wavy cloth
  ctx.strokeStyle = '#1E1610';
  ctx.lineWidth = 2.6;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws all four uncensored period wall banners hanging behind the war room.
 * `droop` in [0..1] wilts the banners downward during Act 7's meltdown.
 */
export function drawWallBanners(
  ctx: CanvasRenderingContext2D,
  t: number,
  droop = 0
): void {
  const configs: Array<{ kind: FlagKind; x: number; phase: number }> = [
    { kind: 'nazi', x: 105, phase: 0 },
    { kind: 'soviet', x: 375, phase: 1.2 },
    { kind: 'italy', x: 695, phase: 2.3 },
    { kind: 'japan', x: 965, phase: 3.4 },
  ];

  const flagW = 205;
  const flagH = 126;
  const topY = 70;

  for (const cfg of configs) {
    ctx.save();
    // Hanging brass rod
    ctx.strokeStyle = '#1E1610';
    ctx.fillStyle = '#B8924A';
    ctx.lineWidth = 2.5;
    const rodTilt = droop * (cfg.phase % 2 === 0 ? 12 : -14);

    ctx.beginPath();
    ctx.moveTo(cfg.x - 10, topY - 8);
    ctx.lineTo(cfg.x + flagW + 10, topY - 8 + rodTilt);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1E1610';
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#C9A154';
    ctx.stroke();

    // Brass finial balls
    for (const endX of [cfg.x - 12, cfg.x + flagW + 12]) {
      const endY = endX < cfg.x ? topY - 8 : topY - 8 + rodTilt;
      ctx.fillStyle = '#D2AA5C';
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E1610';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Hanging flag with gentle airflow ripple
    drawPeriodFlag(
      ctx,
      cfg.kind,
      cfg.x,
      topY,
      flagW,
      flagH,
      t + cfg.phase,
      4.2 * (1 - droop * 0.4),
      droop
    );

    // Gold bottom fringe tassels
    ctx.strokeStyle = '#D0A54F';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const u = (i + 0.5) / 14;
      const fx = cfg.x + u * flagW;
      const fy =
        topY +
        flagH +
        Math.sin(u * 5.2 - (t + cfg.phase) * 5.4 + 0.6) * 4.2 * u +
        droop * u * u * 30;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.sin(t * 4 + i) * 2, fy + 10);
      ctx.stroke();
    }

    ctx.restore();
  }
}
