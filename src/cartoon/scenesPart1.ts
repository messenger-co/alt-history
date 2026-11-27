import {
  drawHirohito,
  drawHitler,
  drawMussolini,
  drawSpeechBubble,
  drawStalin,
} from './characters';
import { drawPeriodFlag, drawWallBanners } from './flags';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DialogueCue,
  clamp01,
  easeOutBack,
  getLipSyncOpenness,
} from './timeline';

const INK = '#1B140E';

export function drawWarRoomBackdrop(
  ctx: CanvasRenderingContext2D,
  t: number,
  droop = 0,
  smoky = false
): void {
  // Warm sepia plastered wall
  const wallGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  wallGrad.addColorStop(0, '#C7B08A');
  wallGrad.addColorStop(0.68, '#B69A72');
  wallGrad.addColorStop(1, '#7D6344');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle vertical wood wainscoting
  ctx.fillStyle = '#8F714C';
  ctx.fillRect(0, 460, CANVAS_WIDTH, 260);
  ctx.strokeStyle = 'rgba(27, 20, 14, 0.25)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= CANVAS_WIDTH; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 460);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 460);
  ctx.lineTo(CANVAS_WIDTH, 460);
  ctx.stroke();

  // Floorboard horizon
  ctx.fillStyle = '#6E5236';
  ctx.fillRect(0, 560, CANVAS_WIDTH, 160);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 560);
  ctx.lineTo(CANVAS_WIDTH, 560);
  ctx.stroke();

  // Four uncensored period wall banners
  drawWallBanners(ctx, t, droop);

  // Floating dust particles (continuous animation)
  ctx.fillStyle = 'rgba(255, 245, 218, 0.26)';
  for (let i = 0; i < 24; i++) {
    const px = ((i * 97 + t * (16 + (i % 5) * 6)) % (CANVAS_WIDTH + 40)) - 20;
    const py = 70 + ((i * 53 + Math.sin(t * 1.4 + i) * 35) % 450);
    ctx.beginPath();
    ctx.arc(px, py, 1.8 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  // Optional smoking war room clouds (Act 7)
  if (smoky) {
    for (let i = 0; i < 10; i++) {
      const p = (t * 0.28 + i * 0.1) % 1;
      const sx = 120 + i * 115 + Math.sin(t * 2 + i) * 28;
      const sy = 560 - p * 540;
      const r = 24 + p * 46;
      ctx.fillStyle = `rgba(60, 52, 46, ${(1 - p) * 0.34})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawComicStarburst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  radius: number,
  fill: string,
  t: number
): void {
  ctx.save();
  const jitter = 1 + Math.sin(t * 28) * 0.06;
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 16) * 0.08);
  ctx.scale(jitter, jitter);

  const spikes = 14;
  ctx.fillStyle = fill;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.56;
    const a = (i * Math.PI) / spikes;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r * 0.72;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = `700 ${Math.round(radius * 0.34)}px "Oswald", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 2);
  ctx.restore();
}

/**
 * ACT 1 (0:00 – 0:25): Vintage Newsreel Intro & Pact Signing
 */
export function renderAct1(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeDialogue: DialogueCue | null
): void {
  if (t < 3.1) {
    // Vintage 1940s Academy film countdown (3... 2... 1...)
    ctx.fillStyle = '#3B3025';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Rotating radar sweep sector
    const num = t < 1.03 ? 3 : t < 2.06 ? 2 : 1;
    const frac = (t % 1.03) / 1.03;
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;

    ctx.fillStyle = 'rgba(232, 214, 178, 0.25)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 340, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    // Concentric Academy leader rings & crosshairs
    ctx.strokeStyle = '#EFE3C8';
    ctx.lineWidth = 4;
    for (const r of [140, 225, 310]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - 380, cy);
    ctx.lineTo(cx + 380, cy);
    ctx.moveTo(cx, cy - 340);
    ctx.lineTo(cx, cy + 340);
    ctx.stroke();

    // Sweep hand
    const sweepAngle = -Math.PI / 2 + frac * Math.PI * 2;
    ctx.strokeStyle = '#C8432B';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * 320, cy + Math.sin(sweepAngle) * 320);
    ctx.stroke();

    // Giant countdown numeral with bounce
    const pop = 1 + Math.sin(frac * Math.PI) * 0.14;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pop, pop);
    ctx.fillStyle = '#F6ECD4';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.font = '700 220px "Oswald", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(String(num), 0, 8);
    ctx.fillText(String(num), 0, 8);
    ctx.restore();

    ctx.fillStyle = '#E5D5B5';
    ctx.font = '600 24px "Oswald", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1940 ARCHIVAL NEWSREEL — STAND BY FOR PICTURE', cx, 645);
    return;
  }

  if (t < 10.5) {
    // Bouncing Title Card Slam with rotating vintage sunbeams
    const localT = t - 3.1;
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;

    ctx.fillStyle = '#2B2118';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Spinning sepia sunbeams
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.35);
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#D2B582' : '#B79361';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 900, (i * Math.PI) / 10, ((i + 1) * Math.PI) / 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Four waving corner flags
    drawPeriodFlag(ctx, 'nazi', 56, 48, 155, 98, t, 5);
    drawPeriodFlag(ctx, 'soviet', CANVAS_WIDTH - 211, 48, 155, 98, t + 1, 5);
    drawPeriodFlag(ctx, 'italy', 56, CANVAS_HEIGHT - 196, 155, 98, t + 2, 5);
    drawPeriodFlag(ctx, 'japan', CANVAS_WIDTH - 211, CANVAS_HEIGHT - 196, 155, 98, t + 3, 5);

    // Slamming parchment title placard
    const slamScale = easeOutBack(clamp01(localT / 0.55));
    const wobble = Math.sin(t * 7.5) * 0.018;
    ctx.save();
    ctx.translate(cx, cy - 22);
    ctx.scale(slamScale, slamScale);
    ctx.rotate(wobble);

    ctx.fillStyle = 'rgba(20, 14, 10, 0.45)';
    ctx.beginPath();
    ctx.roundRect(-430 + 10, -185 + 10, 860, 360, 22);
    ctx.fill();

    ctx.fillStyle = '#F7EED8';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(-430, -185, 860, 360, 22);
    ctx.fill();
    ctx.stroke();

    // Inner art-deco rule
    ctx.strokeStyle = '#C42B22';
    ctx.lineWidth = 4;
    ctx.strokeRect(-410, -165, 820, 320);

    // Header banner
    ctx.fillStyle = '#B82525';
    ctx.fillRect(-310, -142, 620, 44);
    ctx.fillStyle = '#F9F2DF';
    ctx.font = '700 26px "Oswald", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ALT-HISTORY NEWSREEL • SPECIAL EDITION 1940', 0, -112);

    // Main satirical headline
    ctx.fillStyle = INK;
    ctx.font = '700 44px "Oswald", Impact, sans-serif';
    ctx.fillText('WHAT IF STALIN, HITLER,', 0, -34);
    ctx.fillText('MUSSOLINI & HIROHITO', 0, 22);
    ctx.fillStyle = '#B82525';
    ctx.font = '700 48px "Oswald", Impact, sans-serif';
    ctx.fillText('INVADED THE WORLD TOGETHER?', 0, 82);

    ctx.fillStyle = '#4B3A29';
    ctx.font = '600 22px "Oswald", Impact, sans-serif';
    ctx.fillText('THE UNHOLY FOUR-WAY ALLIANCE — A 1940s FLEISCHER SATIRE', 0, 134);
    ctx.restore();
    return;
  }

  // 0:10.5 – 0:25: Tiny wobbling pact-signing desk chaos!
  drawWarRoomBackdrop(ctx, t, 0, false);

  const penSnapped = t >= 13.8;
  const inkSplatted = t >= 15.2;
  const jostle = Math.sin(t * 16) * 8;

  // Four crammed around the tiny wooden desk
  drawStalin(ctx, {
    x: 410 + jostle * 0.4,
    y: 448,
    scale: 1.05,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'stalin'),
    pose: 'drawing',
    crayonColor: '#1B140E',
    inkSplat: inkSplatted,
  });

  drawHitler(ctx, {
    x: 545 + jostle,
    y: 452,
    scale: 1.05,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'hitler'),
    pose: t >= 15 ? 'angry' : 'drawing',
    crayonColor: penSnapped ? undefined : '#1B140E',
    inkSplat: inkSplatted,
  });

  drawMussolini(ctx, {
    x: 715 - jostle,
    y: 452,
    scale: 1.05,
    facing: -1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'mussolini'),
    pose: 'drawing',
    crayonColor: '#1B140E',
    inkSplat: inkSplatted,
  });

  drawHirohito(ctx, {
    x: 860 - jostle * 0.3,
    y: 448,
    scale: 1.02,
    facing: -1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'hirohito'),
    pose: 'drawing',
    crayonColor: '#1B140E',
  });

  // Tiny wobbling wooden desk in front
  ctx.save();
  ctx.translate(640, 520);
  ctx.rotate(Math.sin(t * 18) * 0.03);
  ctx.fillStyle = '#7A512E';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.fillRect(-130, -28, 260, 26);
  ctx.strokeRect(-130, -28, 260, 26);
  // Wobbling desk legs
  ctx.fillRect(-115, -2, 20, 96);
  ctx.strokeRect(-115, -2, 20, 96);
  ctx.fillRect(95, -2, 20, 96);
  ctx.strokeRect(95, -2, 20, 96);

  // "GLOBAL CONQUEST PACT" scroll on tiny desk
  ctx.fillStyle = '#FBF2DC';
  ctx.fillRect(-92, -46, 184, 34);
  ctx.strokeRect(-92, -46, 184, 34);
  ctx.fillStyle = INK;
  ctx.font = '700 16px "Oswald", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GLOBAL CONQUEST PACT', 0, -24);

  // Oversized tipped inkwell & flying ink droplets
  ctx.fillStyle = '#141110';
  ctx.fillRect(55, -50, 22, 24);
  ctx.restore();

  // Snapped pen pieces & flying ink droplets
  if (penSnapped) {
    const dt = t - 13.8;
    ctx.save();
    ctx.fillStyle = '#141110';
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 + dt * 2.4;
      const dist = Math.min(180, (dt * 160 + i * 22) % 210);
      const dx = 640 + Math.cos(ang) * dist;
      const dy = 470 + Math.sin(ang) * dist * 0.7 - Math.abs(Math.sin(dt * 6 + i)) * 30;
      ctx.beginPath();
      ctx.arc(dx, dy, 4 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }
    if (dt < 1.6) {
      drawComicStarburst(ctx, 640, 390, 'SNAP!', 68, '#F2C94C', t);
    }
    ctx.restore();
  }

  if (activeDialogue?.speaker === 'hitler') {
    drawSpeechBubble(
      ctx,
      465,
      252,
      'ADOLF HITLER',
      activeDialogue.text,
      '#B82525',
      'down',
      t
    );
  }
}

/**
 * ACT 2 (0:25 – 1:05): Dividing the World Map
 */
export function renderAct2(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeDialogue: DialogueCue | null
): void {
  const localT = t - 25;
  drawWarRoomBackdrop(ctx, t, 0, false);

  // Characters standing behind & around the giant glowing world map table
  drawHitler(ctx, {
    x: 255,
    y: 400,
    scale: 1.05,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'hitler'),
    pose: localT < 16 ? 'angry' : 'pointing',
    crayonColor: '#C42121',
  });

  drawStalin(ctx, {
    x: 505,
    y: 392,
    scale: 1.05,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'stalin'),
    pose: 'drawing',
    crayonColor: '#A61818',
  });

  drawMussolini(ctx, {
    x: 780,
    y: 396,
    scale: 1.05,
    facing: -1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'mussolini'),
    pose: 'cheering',
    noseScribble: localT > 10, // Accidentally draws on his own nose!
  });

  drawHirohito(ctx, {
    x: 1025,
    y: 396,
    scale: 1.04,
    facing: -1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'hirohito'),
    pose: 'drawing',
    crayonColor: '#D48A28',
  });

  // Giant glowing illuminated World Map Table in perspective
  ctx.save();
  // Table wooden base
  ctx.fillStyle = '#5D3E22';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(155, 452);
  ctx.lineTo(1125, 452);
  ctx.lineTo(1205, 622);
  ctx.lineTo(75, 622);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing parchment map surface
  const mapGlow = ctx.createRadialGradient(640, 535, 30, 640, 535, 490);
  mapGlow.addColorStop(0, '#FFF8DF');
  mapGlow.addColorStop(0.65, '#EFE0B9');
  mapGlow.addColorStop(1, '#D3BA87');
  ctx.fillStyle = mapGlow;
  ctx.beginPath();
  ctx.moveTo(185, 466);
  ctx.lineTo(1095, 466);
  ctx.lineTo(1165, 606);
  ctx.lineTo(115, 606);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle glowing map grid lines
  ctx.strokeStyle = 'rgba(70, 55, 38, 0.22)';
  ctx.lineWidth = 1.5;
  for (let gx = 240; gx <= 1040; gx += 100) {
    ctx.beginPath();
    ctx.moveTo(gx, 468);
    ctx.lineTo(gx + (gx - 640) * 0.12, 604);
    ctx.stroke();
  }
  for (let gy = 496; gy <= 580; gy += 28) {
    ctx.beginPath();
    ctx.moveTo(155, gy);
    ctx.lineTo(1125, gy);
    ctx.stroke();
  }

  // Stylized painted continents
  ctx.fillStyle = '#C9B17E';
  ctx.strokeStyle = '#4B3A28';
  ctx.lineWidth = 2;

  // Americas (left) — separate beginPath per continent so no stray connector line appears
  ctx.beginPath();
  ctx.ellipse(275, 512, 54, 24, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(320, 568, 36, 22, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Europe (center-left)
  ctx.beginPath();
  ctx.ellipse(545, 508, 66, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Africa (below Europe)
  ctx.beginPath();
  ctx.ellipse(570, 566, 54, 26, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // USSR / Asia (center-right)
  ctx.beginPath();
  ctx.ellipse(765, 512, 118, 28, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pacific Islands & Japan
  ctx.beginPath();
  ctx.ellipse(985, 545, 42, 22, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Animated Crayon Scribbles!
  // 1) Hitler aggressively scribbles red/black over Europe (0..18s of Act 2)
  const hitlerProg = clamp01(localT / 12);
  if (hitlerProg > 0) {
    ctx.strokeStyle = '#2A1F1B';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const steps = Math.floor(hitlerProg * 14);
    for (let i = 0; i <= steps; i++) {
      const sx = 478 + i * 10;
      const sy = 492 + (i % 2 === 0 ? 0 : 32);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  // 2) Stalin immediately scribbles huge bold crimson over Hitler's half (from localT 13s onward)
  const stalinProg = clamp01((localT - 13) / 10);
  if (stalinProg > 0) {
    ctx.strokeStyle = '#C42121';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const steps = Math.floor(stalinProg * 18);
    for (let i = 0; i <= steps; i++) {
      const sx = 860 - i * 21;
      const sy = 490 + (i % 2 === 0 ? 4 : 38);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  // 3) Hirohito draws a super-neat circle around the entire Pacific Ocean (from localT 25s onward)
  const hiroProg = clamp01((localT - 25) / 8);
  if (hiroProg > 0) {
    ctx.strokeStyle = '#D47B1A';
    ctx.lineWidth = 5;
    ctx.setLineDash([12, 6]);
    ctx.beginPath();
    ctx.ellipse(990, 540, 108, 48, 0, 0, Math.PI * 2 * hiroProg);
    ctx.stroke();
    ctx.setLineDash([]);
    if (hiroProg > 0.85) {
      ctx.fillStyle = '#9E4D0E';
      ctx.font = '700 16px "Oswald", Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEAT PACIFIC CIRCLE', 990, 546);
    }
  }

  // Map labels
  ctx.fillStyle = 'rgba(27, 20, 14, 0.72)';
  ctx.font = '700 15px "Oswald", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EUROPE', 545, 513);
  ctx.fillText('USSR', 765, 515);
  ctx.fillText('PACIFIC', 985, 520);
  ctx.restore();

  // Active comic speech bubbles
  if (activeDialogue?.speaker === 'hitler') {
    drawSpeechBubble(ctx, 290, 210, 'ADOLF HITLER', activeDialogue.text, '#B82525', 'down', t);
  } else if (activeDialogue?.speaker === 'stalin') {
    drawSpeechBubble(ctx, 540, 206, 'JOSEPH STALIN', activeDialogue.text, '#9B2C24', 'down', t);
  } else if (activeDialogue?.speaker === 'hirohito') {
    drawSpeechBubble(ctx, 975, 206, 'EMPEROR HIROHITO', activeDialogue.text, '#C86D1A', 'down', t);
  }
}

/**
 * ACT 3 (1:05 – 1:45): Designing the "Mega-Weapon"
 */
export function renderAct3(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeDialogue: DialogueCue | null
): void {
  const localT = t - 65;
  drawWarRoomBackdrop(ctx, t, 0, false);

  // Giant chalkboard mounted on wall
  const boardX = 215;
  const boardY = 78;
  const boardW = 850;
  const boardH = 420;

  ctx.save();
  // Wooden chalk frame
  ctx.fillStyle = '#5F3F23';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.fillRect(boardX - 16, boardY - 16, boardW + 32, boardH + 38);
  ctx.strokeRect(boardX - 16, boardY - 16, boardW + 32, boardH + 38);

  // Slate chalkboard surface
  ctx.fillStyle = '#25352D';
  ctx.fillRect(boardX, boardY, boardW, boardH);
  ctx.strokeRect(boardX, boardY, boardW, boardH);

  // Subtle chalk grid
  ctx.strokeStyle = 'rgba(244, 239, 224, 0.08)';
  ctx.lineWidth = 1;
  for (let gx = boardX + 40; gx < boardX + boardW; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, boardY);
    ctx.lineTo(gx, boardY + boardH);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(244, 239, 224, 0.85)';
  ctx.font = '700 22px "Oswald", Impact, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TOP SECRET BLUEPRINT: FOUR-WAY MEGA-TANK', boardX + 24, boardY + 36);

  // Collapse physics at localT >= 32.5 (1:37.5 -> 97.5s)
  const collapseElapsed = Math.max(0, localT - 32.5);
  const preShake = localT > 30.5 && collapseElapsed === 0 ? Math.sin(t * 50) * 6 : 0;
  const fallY = collapseElapsed > 0 ? Math.min(245, collapseElapsed * collapseElapsed * 520) : 0;
  const fallRot = collapseElapsed > 0 ? Math.min(0.42, collapseElapsed * 0.55) : 0;

  ctx.save();
  ctx.beginPath();
  ctx.rect(boardX, boardY, boardW, boardH + 140);
  ctx.clip();

  ctx.translate(640 + preShake, 315 + fallY);
  ctx.rotate(fallRot);
  ctx.strokeStyle = '#F5F0DF';
  ctx.fillStyle = 'rgba(245, 240, 223, 0.14)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Base chalk tank chassis
  ctx.beginPath();
  ctx.roundRect(-160, -10, 320, 80, 24);
  ctx.fill();
  ctx.stroke();
  // Treads & wheels
  for (let i = -125; i <= 125; i += 50) {
    ctx.beginPath();
    ctx.arc(i, 58, 22, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Base turret
  ctx.beginPath();
  ctx.roundRect(-90, -78, 180, 68, 16);
  ctx.fill();
  ctx.stroke();

  // Feature 1 (localT >= 6): Mussolini's giant Espresso Machine on turret
  if (localT >= 6) {
    const p = clamp01((localT - 6) / 3);
    ctx.save();
    ctx.globalAlpha = p;
    ctx.strokeStyle = '#F7DF9B';
    ctx.strokeRect(-42, -162, 74, 82);
    // Dome & steam wand
    ctx.beginPath();
    ctx.arc(-5, -162, 37, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(32, -135);
    ctx.lineTo(54, -120);
    ctx.stroke();
    // Rising chalk steam waves
    for (let s = 0; s < 3; s++) {
      ctx.beginPath();
      ctx.moveTo(-20 + s * 16, -204);
      ctx.quadraticCurveTo(-12 + s * 16 + Math.sin(t * 7 + s) * 8, -218, -20 + s * 16, -232);
      ctx.stroke();
    }
    ctx.fillStyle = '#F7DF9B';
    ctx.font = '700 15px "Oswald", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESPRESSO MAKER', -5, -172);
    ctx.restore();
  }

  // Feature 2 (localT >= 14): Stalin's giant Iron Mustache Bumper
  if (localT >= 14) {
    const p = clamp01((localT - 14) / 3);
    ctx.save();
    ctx.globalAlpha = p;
    ctx.strokeStyle = '#F2A39A';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(158, 26);
    ctx.quadraticCurveTo(210, -8, 252, 34);
    ctx.quadraticCurveTo(210, 56, 158, 42);
    ctx.stroke();
    ctx.fillStyle = '#F2A39A';
    ctx.font = '700 15px "Oswald", Impact, sans-serif';
    ctx.fillText('IRON MUSTACHE BUMPER', 215, 76);
    ctx.restore();
  }

  // Feature 3 (localT >= 21): Hitler's 20 ridiculous overlapping cannons!
  if (localT >= 21) {
    const count = Math.min(20, Math.floor((localT - 21) * 3.2) + 1);
    ctx.strokeStyle = '#F5F0DF';
    ctx.lineWidth = 3.2;
    for (let c = 0; c < count; c++) {
      const ang = -0.7 + (c % 10) * 0.14;
      const ox = c < 10 ? 85 : -85;
      const dir = c < 10 ? 1 : -1;
      const len = 72 + (c % 4) * 26;
      const oy = -65 + (c % 5) * 14;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(ang) * len * dir, oy + Math.sin(ang) * len);
      ctx.stroke();
      // Mini cannon mounted on cannon!
      ctx.beginPath();
      ctx.arc(
        ox + Math.cos(ang) * len * dir,
        oy + Math.sin(ang) * len,
        6,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }

  // Feature 4 (localT >= 27): Hirohito's giant Folding Origami Wings
  if (localT >= 27) {
    const p = clamp01((localT - 27) / 3);
    ctx.save();
    ctx.globalAlpha = p;
    ctx.strokeStyle = '#BCE2F5';
    ctx.lineWidth = 3.6;
    // Left origami wing
    ctx.beginPath();
    ctx.moveTo(-150, -32);
    ctx.lineTo(-345, -135);
    ctx.lineTo(-295, -24);
    ctx.lineTo(-150, 8);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-150, -32);
    ctx.lineTo(-295, -24);
    ctx.stroke();
    ctx.fillStyle = '#BCE2F5';
    ctx.font = '700 15px "Oswald", Impact, sans-serif';
    ctx.fillText('ORIGAMI WINGS', -275, -145);
    ctx.restore();
  }

  ctx.restore(); // End chalkboard clip
  ctx.restore();

  // Crash dust cloud & starburst when chalk blueprint collapses!
  if (collapseElapsed > 0.35) {
    const dustP = clamp01((collapseElapsed - 0.35) / 1.8);
    for (let i = 0; i < 10; i++) {
      const dx = 440 + i * 44 + Math.sin(t * 5 + i) * 18;
      const dy = 525 - dustP * (40 + (i % 3) * 28);
      ctx.fillStyle = `rgba(244, 238, 224, ${(1 - dustP * 0.5) * 0.72})`;
      ctx.beginPath();
      ctx.arc(dx, dy, 22 + (i % 4) * 9, 0, Math.PI * 2);
      ctx.fill();
    }
    if (collapseElapsed < 3.4) {
      drawComicStarburst(ctx, 640, 440, 'CRASH!', 96, '#F2C94C', t);
    }
  }

  // Leaders standing in front with chalk
  drawMussolini(ctx, {
    x: 155,
    y: 515,
    scale: 1.0,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'mussolini'),
    pose: 'cheering',
    crayonColor: '#F7F1E2',
  });
  drawHitler(ctx, {
    x: 1120,
    y: 515,
    scale: 1.0,
    facing: -1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'hitler'),
    pose: 'angry',
    crayonColor: '#F7F1E2',
  });
  drawStalin(ctx, {
    x: 315,
    y: 530,
    scale: 0.92,
    facing: 1,
    t,
    lipOpen: 0,
    pose: 'idle',
  });
  drawHirohito(ctx, {
    x: 965,
    y: 530,
    scale: 0.92,
    facing: -1,
    t,
    lipOpen: 0,
    pose: 'drawing',
    crayonColor: '#F7F1E2',
  });

  if (activeDialogue?.speaker === 'mussolini') {
    drawSpeechBubble(ctx, 315, 290, 'BENITO MUSSOLINI', activeDialogue.text, '#2E7D32', 'left', t);
  } else if (activeDialogue?.speaker === 'hitler') {
    drawSpeechBubble(ctx, 940, 290, 'ADOLF HITLER', activeDialogue.text, '#B82525', 'right', t);
  }
}

/**
 * Helper: draws the absurd Four-Way Clown-Car Mega-Tank with all 4 flags,
 * iron mustache bumper, espresso machine, origami wings, and 4 heads fighting over 1 steering wheel.
 */
export function drawMegaTank(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  angle: number,
  crashed: boolean,
  activeDialogue: DialogueCue | null
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const engineBounce = crashed ? 0 : Math.sin(t * 28) * 3.5;

  // Origami wing sticking out back
  ctx.fillStyle = '#EDE4CE';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-110, -25 + engineBounce);
  ctx.lineTo(-195, -88 + engineBounce + Math.sin(t * 9) * 6);
  ctx.lineTo(-162, -10 + engineBounce);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Four fluttering flags mounted on poles!
  const flagPositions: Array<{ kind: 'nazi' | 'soviet' | 'italy' | 'japan'; px: number; py: number }> = [
    { kind: 'nazi', px: -102, py: -145 },
    { kind: 'soviet', px: -42, py: -158 },
    { kind: 'italy', px: 28, py: -155 },
    { kind: 'japan', px: 88, py: -142 },
  ];
  for (let i = 0; i < flagPositions.length; i++) {
    const fp = flagPositions[i];
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(fp.px, -45 + engineBounce);
    ctx.lineTo(fp.px, fp.py + engineBounce);
    ctx.stroke();
    drawPeriodFlag(ctx, fp.kind, fp.px, fp.py + engineBounce, 56, 36, t * 1.4 + i, 3.5);
  }

  // Main bristling cannon barrel shooting confetti & smoke
  ctx.fillStyle = '#555A4B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.fillRect(72, -62 + engineBounce, 115, 18);
  ctx.strokeRect(72, -62 + engineBounce, 115, 18);
  // Secondary absurd mini-cannon on top of cannon!
  ctx.fillRect(102, -74 + engineBounce, 66, 12);
  ctx.strokeRect(102, -74 + engineBounce, 66, 12);

  // Steaming espresso machine bolted on rear turret
  ctx.fillStyle = '#C99B3B';
  ctx.fillRect(-108, -88 + engineBounce, 34, 42);
  ctx.strokeRect(-108, -88 + engineBounce, 34, 42);
  ctx.beginPath();
  ctx.arc(-91, -88 + engineBounce, 17, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // Four heads crammed into the open top hatch!
  drawStalin(ctx, {
    x: -44,
    y: -48 + engineBounce,
    scale: 0.68,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'stalin'),
    headOnly: true,
    messy: crashed,
  });
  drawHitler(ctx, {
    x: -12,
    y: -52 + engineBounce,
    scale: 0.68,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'hitler'),
    headOnly: true,
    messy: crashed,
  });
  drawMussolini(ctx, {
    x: 22,
    y: -50 + engineBounce,
    scale: 0.68,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'mussolini'),
    headOnly: true,
    messy: crashed,
  });
  drawHirohito(ctx, {
    x: 54,
    y: -46 + engineBounce,
    scale: 0.66,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'hirohito'),
    headOnly: true,
    messy: crashed,
  });

  // Single steering wheel with 4 pairs of gloved hands fighting over it!
  const wheelX = 68;
  const wheelY = -74 + engineBounce;
  ctx.save();
  ctx.translate(wheelX, wheelY);
  ctx.rotate(Math.sin(t * 18) * 1.4);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(18, 0);
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 18);
  ctx.stroke();
  // Gloved hands clutching the wheel
  for (let h = 0; h < 6; h++) {
    const a = (h * Math.PI) / 3;
    ctx.fillStyle = '#F8F2E4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 18, Math.sin(a) * 18, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Turret body
  ctx.fillStyle = '#6B725D';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-78, -56 + engineBounce, 160, 52, 16);
  ctx.fill();
  ctx.stroke();

  // Hull body
  ctx.fillStyle = '#58604C';
  ctx.beginPath();
  ctx.roundRect(-124, -14 + engineBounce, 250, 62, 18);
  ctx.fill();
  ctx.stroke();

  // Riveted Iron Mustache Bumper on front!
  ctx.fillStyle = '#3E3A36';
  ctx.beginPath();
  ctx.moveTo(120, 12 + engineBounce);
  ctx.quadraticCurveTo(158, -14 + engineBounce, 178, 22 + engineBounce);
  ctx.quadraticCurveTo(148, 38 + engineBounce, 120, 28 + engineBounce);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tank treads & spinning wheels
  ctx.fillStyle = '#2B2621';
  ctx.beginPath();
  ctx.roundRect(-128, 34, 256, 40, 20);
  ctx.fill();
  ctx.stroke();

  for (let i = -95; i <= 95; i += 47.5) {
    ctx.save();
    ctx.translate(i, 54);
    ctx.rotate(crashed ? 0 : t * 8);
    ctx.fillStyle = '#8F8974';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 12);
    ctx.stroke();
    ctx.restore();
  }

  // Orbiting dizzy yellow stars if crashed!
  if (crashed) {
    for (let s = 0; s < 5; s++) {
      const a = t * 4.5 + (s * Math.PI * 2) / 5;
      const sx = Math.cos(a) * 86;
      const sy = -112 + Math.sin(a) * 22;
      ctx.fillStyle = '#F6CE46';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 === 0 ? 12 : 5;
        const ka = -Math.PI / 2 + (k * Math.PI) / 5;
        const px = sx + Math.cos(ka) * r;
        const py = sy + Math.sin(ka) * r;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * ACT 4 (1:45 – 2:30): The Four-Way Clown-Car Tank
 */
export function renderAct4(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeDialogue: DialogueCue | null
): void {
  const localT = t - 105;

  // Vintage sepia countryside sky
  const sky = ctx.createLinearGradient(0, 0, 0, 440);
  sky.addColorStop(0, '#D7C59F');
  sky.addColorStop(1, '#EFE3C5');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 440);

  // Drifting seamless 1940s painted cartoon clouds (no internal circle seams)
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 340 + t * 22) % (CANVAS_WIDTH + 220)) - 110;
    const cy = 86 + (i % 2) * 42;
    ctx.save();
    ctx.translate(cx, cy);
    // Outer ink outline pass
    ctx.fillStyle = INK;
    for (const [px, py, r] of [
      [-2, 4, 27],
      [26, -8, 34],
      [58, 4, 26],
      [26, 12, 24],
    ] as const) {
      ctx.beginPath();
      ctx.arc(px, py, r + 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Warm cream cloud fill pass
    ctx.fillStyle = '#FAF4E4';
    for (const [px, py, r] of [
      [-2, 4, 27],
      [26, -8, 34],
      [58, 4, 26],
      [26, 12, 24],
    ] as const) {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Rolling hills
  ctx.fillStyle = '#9EA471';
  ctx.beginPath();
  ctx.moveTo(0, 440);
  ctx.quadraticCurveTo(320, 330, 680, 410);
  ctx.quadraticCurveTo(1000, 320, 1280, 420);
  ctx.lineTo(1280, 500);
  ctx.lineTo(0, 500);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dirt road & pasture
  ctx.fillStyle = '#8C9160';
  ctx.fillRect(0, 440, CANVAS_WIDTH, 280);
  ctx.fillStyle = '#C1A477';
  ctx.fillRect(0, 505, CANVAS_WIDTH, 130);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 505);
  ctx.lineTo(CANVAS_WIDTH, 505);
  ctx.moveTo(0, 635);
  ctx.lineTo(CANVAS_WIDTH, 635);
  ctx.stroke();

  // Supply Tent (flattened at localT >= 17, i.e., 2:02)
  const tentFlat = clamp01((localT - 17) / 0.45);
  ctx.save();
  ctx.translate(450, 540);
  ctx.scale(1 + tentFlat * 0.45, Math.max(0.14, 1 - tentFlat * 0.86));
  ctx.fillStyle = '#DDD0AE';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-78, 0);
  ctx.lineTo(0, -110);
  ctx.lineTo(78, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2B221B';
  ctx.font = '700 18px "Oswald", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SUPPLY TENT', 0, -28);
  ctx.restore();

  // Wooden Barn on right (crashed into at localT >= 25, i.e., 2:10)
  const barnCrashed = localT >= 25;
  ctx.save();
  ctx.translate(1060, 495);
  if (barnCrashed) {
    ctx.rotate(0.08 + Math.sin(t * 25) * (localT < 26.5 ? 0.05 : 0));
  }
  ctx.fillStyle = '#9D3B2C';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.fillRect(-130, -145, 250, 195);
  ctx.strokeRect(-130, -145, 250, 195);
  // Barn gambrel roof
  ctx.fillStyle = '#5F422D';
  ctx.beginPath();
  ctx.moveTo(-145, -145);
  ctx.lineTo(-95, -210);
  ctx.lineTo(0, -242);
  ctx.lineTo(95, -210);
  ctx.lineTo(135, -145);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Barn X doors
  ctx.strokeStyle = '#F3EAD4';
  ctx.lineWidth = 5;
  ctx.strokeRect(-60, -82, 110, 128);
  ctx.beginPath();
  ctx.moveTo(-60, -82);
  ctx.lineTo(50, 46);
  ctx.moveTo(50, -82);
  ctx.lineTo(-60, 46);
  ctx.stroke();
  ctx.restore();

  // Two unimpressed blinking cartoon cows watching!
  for (const [cx, cy, phase] of [
    [1140, 585, 0],
    [825, 472, 1.8],
  ] as const) {
    ctx.save();
    ctx.translate(cx, cy);
    // Cow body
    ctx.fillStyle = '#F7F1E2';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Cow spots
    ctx.fillStyle = '#26201B';
    ctx.beginPath();
    ctx.arc(-10, -4, 10, 0, Math.PI * 2);
    ctx.arc(14, 6, 8, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.fillStyle = '#F7F1E2';
    for (const lx of [-24, -10, 12, 24]) {
      ctx.fillRect(lx, 18, 8, 22);
      ctx.strokeRect(lx, 18, 8, 22);
    }
    // Deadpan head chewing grass
    ctx.beginPath();
    ctx.ellipse(-42, -10, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Half-lidded unimpressed eye
    const cowBlink = ((t + phase) % 3.5) > 3.32;
    ctx.fillStyle = INK;
    if (cowBlink) {
      ctx.fillRect(-50, -14, 10, 2);
    } else {
      ctx.beginPath();
      ctx.arc(-45, -13, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-52, -16);
      ctx.lineTo(-38, -16);
      ctx.stroke();
    }
    // Chewing straw
    const chew = Math.sin(t * 7 + phase) * 3;
    ctx.strokeStyle = '#DFB64E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-54, -2);
    ctx.lineTo(-70, 4 + chew);
    ctx.stroke();
    ctx.restore();
  }

  // Tank motion trajectory: wild donuts (0..17s), flattening tent (17..24s), crashing barn (25..45s)
  let tankX = 280;
  let tankY = 530;
  let tankAngle = 0;

  if (localT < 16) {
    // Wild donuts & swerving
    tankX = 300 + Math.sin(localT * 1.45) * 165;
    tankY = 535 + Math.cos(localT * 2.9) * 28;
    tankAngle = Math.sin(localT * 5.2) * 0.14;
  } else if (localT < 25) {
    const p = (localT - 16) / 9;
    tankX = 320 + p * 545;
    tankY = 535 + Math.sin(localT * 8) * 12;
    tankAngle = Math.sin(localT * 9) * 0.08;
  } else {
    // Wedged nose-first into the barn!
    tankX = 875;
    tankY = 528;
    tankAngle = -0.09;
  }

  // Donut skid marks on road
  ctx.strokeStyle = 'rgba(42, 32, 22, 0.34)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.ellipse(300, 578, 175, 28, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Confetti & smoke blasting out the tank cannon before crash
  if (!barnCrashed) {
    const confettiColors = ['#C42121', '#E5B94C', '#2E7D32', '#2E5C8A', '#F7F1E2'];
    for (let i = 0; i < 16; i++) {
      const p = (t * 1.5 + i * 0.09) % 1;
      const cx = tankX + 185 + p * 180;
      const cy = tankY - 56 - Math.sin(p * Math.PI) * 75 + (i % 5) * 10;
      ctx.fillStyle = confettiColors[i % confettiColors.length];
      ctx.fillRect(cx, cy, 9, 9);
    }
  }

  // Draw the Four-Way Mega-Tank
  drawMegaTank(ctx, tankX, tankY, t, tankAngle, barnCrashed, activeDialogue);

  // Flying golden hay bales, smoke, & CRASH! burst after hitting barn
  if (barnCrashed) {
    const dt = localT - 25;
    // Rising engine smoke plumes
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.8 + i * 0.16) % 1;
      ctx.fillStyle = `rgba(60, 54, 48, ${(1 - p) * 0.6})`;
      ctx.beginPath();
      ctx.arc(955 + Math.sin(t * 3 + i) * 18, 470 - p * 185, 16 + p * 26, 0, Math.PI * 2);
      ctx.fill();
    }
    // Flying hay stalks & splintered wood
    ctx.strokeStyle = '#E5B94C';
    ctx.lineWidth = 4;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const dist = 40 + ((dt * 120 + i * 28) % 210);
      const hx = 970 + Math.cos(a) * dist;
      const hy = 450 + Math.sin(a) * dist * 0.65;
      ctx.beginPath();
      ctx.moveTo(hx - 10, hy);
      ctx.lineTo(hx + 10, hy + 8);
      ctx.stroke();
    }
    if (dt < 3.5) {
      drawComicStarburst(ctx, 1085, 315, 'CRASH!', 94, '#F2C94C', t);
    }
  }

  if (activeDialogue?.speaker === 'mussolini') {
    drawSpeechBubble(ctx, 430, 215, 'BENITO MUSSOLINI', activeDialogue.text, '#2E7D32', 'down', t);
  } else if (activeDialogue?.speaker === 'hirohito') {
    drawSpeechBubble(ctx, 730, 200, 'EMPEROR HIROHITO', activeDialogue.text, '#C86D1A', 'down', t);
  }
}
