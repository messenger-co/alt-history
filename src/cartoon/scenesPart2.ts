import {
  drawChurchill,
  drawHirohito,
  drawHitler,
  drawMussolini,
  drawRoosevelt,
  drawSpeechBubble,
  drawStalin,
} from './characters';
import { drawPeriodFlag } from './flags';
import { drawComicStarburst, drawMegaTank, drawWarRoomBackdrop } from './scenesPart1';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DialogueCue,
  clamp01,
  easeOutBack,
  getLipSyncOpenness,
} from './timeline';

const INK = '#1B140E';

/**
 * Draws a laughing 1940s rubber-hose cartoon shark popping out of ocean waves.
 */
function drawLaughingShark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  phase: number,
  facing: 1 | -1
): void {
  const bob = Math.sin(t * 7 + phase) * 10;
  const finWave = Math.sin(t * 14 + phase) * 0.4;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(facing, 1);

  // Shark torso popping out of water
  ctx.fillStyle = '#6D7E87';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-36, 48);
  ctx.quadraticCurveTo(-32, -46, 8, -50);
  ctx.quadraticCurveTo(44, -46, 38, 48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cream belly
  ctx.fillStyle = '#EFE9D8';
  ctx.beginPath();
  ctx.ellipse(10, 12, 20, 32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Waving fin!
  ctx.save();
  ctx.translate(32, -2);
  ctx.rotate(-0.6 + finWave);
  ctx.fillStyle = '#6D7E87';
  ctx.beginPath();
  ctx.ellipse(16, 0, 18, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Laughing eyes squinting with glee
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -24, 6, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(18, -24, 6, Math.PI, 0);
  ctx.stroke();

  // Wide laughing toothy shark mouth
  ctx.fillStyle = '#8F2424';
  ctx.beginPath();
  ctx.arc(10, -8, 17, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Zigzag teeth
  ctx.fillStyle = '#FCF7EC';
  for (let i = -12; i <= 8; i += 8) {
    ctx.beginPath();
    ctx.moveTo(10 + i, -8);
    ctx.lineTo(14 + i, -1);
    ctx.lineTo(18 + i, -8);
    ctx.closePath();
    ctx.fill();
  }

  // "HA HA!" text floating above shark (un-flipped so always readable!)
  ctx.save();
  ctx.scale(facing, 1);
  ctx.fillStyle = '#FAF2DC';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.font = '700 20px "Oswald", Impact, sans-serif';
  ctx.textAlign = 'center';
  const laughY = -66 - Math.abs(Math.sin(t * 8 + phase)) * 10;
  ctx.strokeText('HA HA!', 8 * facing, laughY);
  ctx.fillText('HA HA!', 8 * facing, laughY);
  ctx.restore();

  ctx.restore();
}

/**
 * ACT 5 (2:30 – 3:10): The Naval Disaster
 */
export function renderAct5(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeDialogue: DialogueCue | null
): void {
  const localT = t - 150;
  const rudderGone = localT >= 18.5; // 2:48.5

  // Vintage nautical sky
  const sky = ctx.createLinearGradient(0, 0, 0, 390);
  sky.addColorStop(0, '#C7BFA8');
  sky.addColorStop(1, '#EBE1C8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 390);

  // Flying cartoon seagulls
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  for (let i = 0; i < 4; i++) {
    const gx = ((i * 310 + t * 55) % (CANVAS_WIDTH + 160)) - 80;
    const gy = 80 + i * 32 + Math.sin(t * 4 + i) * 14;
    const flap = Math.sin(t * 10 + i) * 9;
    ctx.beginPath();
    ctx.moveTo(gx - 18, gy + flap);
    ctx.quadraticCurveTo(gx - 8, gy - 8, gx, gy);
    ctx.quadraticCurveTo(gx + 8, gy - 8, gx + 18, gy + flap);
    ctx.stroke();
  }

  // Back ocean layer
  ctx.fillStyle = '#4B6B73';
  ctx.fillRect(0, 385, CANVAS_WIDTH, 335);

  // Whirlpool concentric rings once rudder breaks off!
  const shipCenterX = 640 + (rudderGone ? Math.cos(t * 2.8) * 135 : Math.sin(t * 1.3) * 32);
  const shipCenterY = 448 + Math.sin(t * 3.4) * 14;
  if (rudderGone) {
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 238, 222, 0.45)';
    ctx.lineWidth = 4;
    for (let r = 1; r <= 4; r++) {
      ctx.beginPath();
      ctx.ellipse(640, 520, r * 95, r * 26, 0, (t * 4 + r) % (Math.PI * 2), (t * 4 + r) % (Math.PI * 2) + 4.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Overloaded Raft / Battleship Hybrid!
  ctx.save();
  ctx.translate(shipCenterX, shipCenterY);
  const rock = rudderGone ? Math.sin(t * 6.5) * 0.14 : Math.sin(t * 3) * 0.04;
  ctx.rotate(rock);
  // Flip left-right smoothly as it spins in circles!
  const spinScaleX = rudderGone ? Math.cos(t * 2.6) : 1;
  const clampedSpinX = Math.abs(spinScaleX) < 0.25 ? (spinScaleX >= 0 ? 0.25 : -0.25) : spinScaleX;
  ctx.scale(clampedSpinX, 1);

  // Four period flags fluttering on battleship mast
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -185);
  ctx.lineTo(0, -30);
  ctx.stroke();
  drawPeriodFlag(ctx, 'nazi', 0, -184, 62, 38, t * 1.5, 4);
  drawPeriodFlag(ctx, 'soviet', -64, -150, 62, 38, t * 1.5 + 1, 4);
  drawPeriodFlag(ctx, 'italy', 0, -142, 62, 38, t * 1.5 + 2, 4);
  drawPeriodFlag(ctx, 'japan', -64, -108, 62, 38, t * 1.5 + 3, 4);

  // Steel battleship smokestack & turret
  ctx.fillStyle = '#5E6669';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.fillRect(-58, -110, 42, 85);
  ctx.strokeRect(-58, -110, 42, 85);
  ctx.fillRect(16, -68, 72, 44);
  ctx.strokeRect(16, -68, 72, 44);

  // Characters on deck: Stalin & Hitler fighting over the Captain's Hat!
  const tug = Math.sin(t * 14) * 12;
  drawStalin(ctx, {
    x: -95 + tug * 0.4,
    y: -40,
    scale: 0.78,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'stalin'),
    pose: 'pointing',
    captainHat: localT >= 10 && localT < 20,
  });
  drawHitler(ctx, {
    x: -15 + tug * 0.4,
    y: -40,
    scale: 0.78,
    facing: -1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'hitler'),
    pose: 'angry',
    captainHat: localT < 10 || localT >= 20,
  });
  drawMussolini(ctx, {
    x: 82,
    y: -36,
    scale: 0.74,
    facing: -1,
    t,
    lipOpen: 0,
    pose: 'cheering',
  });
  drawHirohito(ctx, {
    x: 145,
    y: -34,
    scale: 0.72,
    facing: -1,
    t,
    lipOpen: 0,
    pose: 'idle',
  });

  // Steel battleship upper deck welded onto lashed wooden raft logs!
  ctx.fillStyle = '#6A7175';
  ctx.beginPath();
  ctx.moveTo(-195, -8);
  ctx.lineTo(205, -8);
  ctx.lineTo(182, 40);
  ctx.lineTo(-175, 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lashed wooden raft logs floating underneath
  ctx.fillStyle = '#875B32';
  for (let log = -155; log <= 155; log += 38) {
    ctx.beginPath();
    ctx.arc(log, 50, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Wooden rudder on stern (breaks off at 18.5s!)
  if (!rudderGone) {
    ctx.fillStyle = '#6E4623';
    ctx.fillRect(-218, 8, 26, 56);
    ctx.strokeRect(-218, 8, 26, 56);
  }
  ctx.restore();

  // Detached rudder flying & splashing into sea at 18.5s
  if (rudderGone && localT < 23) {
    const dt = localT - 18.5;
    ctx.save();
    ctx.translate(410 - dt * 65, 460 + dt * dt * 55 - dt * 90);
    ctx.rotate(dt * 9);
    ctx.fillStyle = '#6E4623';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.fillRect(-14, -28, 28, 56);
    ctx.strokeRect(-14, -28, 28, 56);
    ctx.restore();
    if (dt < 2.2) {
      drawComicStarburst(ctx, 360, 490, 'SPLASH!', 74, '#D9EEF5', t);
    }
  }

  // Laughing cartoon sharks waving from the waves!
  drawLaughingShark(ctx, 200, 520, t, 0, 1);
  drawLaughingShark(ctx, 1075, 524, t, 1.8, -1);
  if (rudderGone) {
    drawLaughingShark(ctx, 640, 558, t, 3.1, 1);
  }

  // Foreground animated rolling waves
  for (let row = 0; row < 2; row++) {
    ctx.fillStyle = row === 0 ? '#3E5B63' : '#314950';
    ctx.strokeStyle = '#EAE2CC';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    const baseY = 535 + row * 72;
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH; x += 32) {
      const wy = baseY + Math.sin(x * 0.018 + t * (4.2 + row * 1.1) + row * 2) * 14;
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // A folded map sails past the spinning flagship on its first and only crossing.
  if (localT > 31) {
    const progress = clamp01((localT - 31) / 9);
    const x = -55 + progress * (CANVAS_WIDTH + 110);
    const phase = x * 0.018 + t * 5.3 + 2;
    ctx.save();
    ctx.translate(x, 607 + Math.sin(phase) * 14);
    ctx.rotate(Math.cos(phase) * 0.18);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.fillStyle = '#EFE1BB';
    ctx.beginPath();
    ctx.moveTo(-46, -15);
    ctx.lineTo(-10, -9);
    ctx.lineTo(5, -38);
    ctx.lineTo(22, -11);
    ctx.lineTo(48, -20);
    ctx.lineTo(26, 0);
    ctx.lineTo(-22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, -9);
    ctx.lineTo(22, -11);
    ctx.stroke();
    ctx.restore();
  }

  if (activeDialogue?.speaker === 'stalin') {
    drawSpeechBubble(ctx, 380, 180, 'JOSEPH STALIN', activeDialogue.text, '#9B2C24', 'down', t);
  } else if (activeDialogue?.speaker === 'hitler') {
    drawSpeechBubble(ctx, 845, 175, 'ADOLF HITLER', activeDialogue.text, '#B82525', 'down', t);
  }
}

/**
 * ACT 6 (3:10 – 3:50): The Allied Counter-Prank
 */
export function renderAct6(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeDialogue: DialogueCue | null
): void {
  const localT = t - 190;
  const signFlipped = localT >= 15.5; // 3:25.5
  const inMud = localT >= 24.5; // 3:34.5

  // Bright sepia countryside sky
  const sky = ctx.createLinearGradient(0, 0, 0, 360);
  sky.addColorStop(0, '#D8C7A2');
  sky.addColorStop(1, '#F3E9D2');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 360);

  // Soft painted clouds across the right horizon for balanced composition
  for (let i = 0; i < 3; i++) {
    const cx = 620 + ((i * 250 + t * 14) % 720);
    const cy = 84 + (i % 2) * 46;
    ctx.fillStyle = '#FAF3E1';
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.arc(cx + 24, cy - 10, 30, 0, Math.PI * 2);
    ctx.arc(cx + 52, cy, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant rolling hills on the right side
  ctx.fillStyle = '#A6B07B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(560, 360);
  ctx.quadraticCurveTo(860, 275, 1140, 330);
  ctx.quadraticCurveTo(1230, 310, 1280, 335);
  ctx.lineTo(1280, 380);
  ctx.lineTo(560, 380);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Upper grassy bluff where Churchill & Roosevelt watch & laugh!
  ctx.fillStyle = '#8FA066';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 345);
  ctx.quadraticCurveTo(320, 282, 620, 338);
  ctx.lineTo(620, 420);
  ctx.lineTo(0, 420);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Striped beach umbrella over Churchill & Roosevelt (clear of top slate!)
  ctx.save();
  ctx.translate(295, 168);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 152);
  ctx.stroke();
  // Umbrella canopy
  ctx.fillStyle = '#B8332A';
  ctx.beginPath();
  ctx.arc(0, 8, 118, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#F7EED8';
  ctx.beginPath();
  ctx.moveTo(0, -110);
  ctx.lineTo(-38, 8);
  ctx.lineTo(38, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Striped beach chairs
  for (const cx of [195, 385]) {
    ctx.fillStyle = '#D4B67B';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 42, 330);
    ctx.lineTo(cx - 24, 260);
    ctx.lineTo(cx + 38, 276);
    ctx.lineTo(cx + 42, 330);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawChurchill(ctx, 200, 262, t);
  drawRoosevelt(ctx, 382, 264, t);

  // Laughing text floating above Allies
  ctx.fillStyle = '#2B221B';
  ctx.font = '700 22px "Oswald", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AHAHAHA!', 292, 198 + Math.sin(t * 10) * 5);

  // Lower meadow & dirt road leading to the giant mud pit!
  ctx.fillStyle = '#7E8F58';
  ctx.fillRect(0, 355, CANVAS_WIDTH, 365);
  ctx.fillStyle = '#C7AA7C';
  ctx.fillRect(0, 485, CANVAS_WIDTH, 135);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 485);
  ctx.lineTo(CANVAS_WIDTH, 485);
  ctx.moveTo(0, 620);
  ctx.lineTo(CANVAS_WIDTH, 620);
  ctx.stroke();

  // Giant bubbling cartoon MUD PIT on the left!
  ctx.fillStyle = '#4B341E';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(290, 565, 225, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Animated mud bubbles popping
  for (let i = 0; i < 6; i++) {
    const bp = (t * 1.4 + i * 0.27) % 1;
    const bx = 135 + i * 62;
    const by = 562 + Math.sin(i * 2.1) * 20;
    ctx.fillStyle = '#69492B';
    ctx.beginPath();
    ctx.arc(bx, by, 5 + Math.sin(bp * Math.PI) * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // The Famous Wooden Road Sign (flips at localT >= 15.5)
  const flipAnim = clamp01((localT - 15.5) / 0.45);
  ctx.save();
  ctx.translate(650, 468);
  // Post
  ctx.fillStyle = '#6E4826';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.fillRect(-10, -140, 20, 165);
  ctx.strokeRect(-10, -140, 20, 165);

  // Flipping wooden arrow sign
  const flipScaleX = signFlipped ? -1 + (1 - flipAnim) * 2 : 1;
  ctx.save();
  ctx.translate(0, -110);
  ctx.scale(Math.abs(flipScaleX) < 0.12 ? 0.12 : flipScaleX, 1);
  ctx.fillStyle = '#F5EAD0';
  ctx.beginPath();
  ctx.moveTo(-140, -32);
  ctx.lineTo(105, -32);
  ctx.lineTo(155, 0);
  ctx.lineTo(105, 32);
  ctx.lineTo(-140, 32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Sign text (always readable, changes when flipped!)
  ctx.fillStyle = signFlipped ? '#B82525' : INK;
  ctx.font = '700 22px "Oswald", Impact, sans-serif';
  ctx.textAlign = 'center';
  if (!signFlipped) {
    ctx.fillText('WORLD DOMINATION ->', 0, -102);
  } else {
    ctx.fillText('<- FREE BUFFET / DEAD END', 0, -102);
  }
  ctx.restore();

  // Four-Way Alliance marching blindly along the road straight into the mud pit!
  if (!inMud) {
    // Marching from right (1150) towards the mud pit (320)
    const marchProgress = clamp01((localT - 4) / 20.5);
    const leadX = 1140 - marchProgress * 820;
    const step = Math.sin(t * 10) * 6;
    drawHitler(ctx, { x: leadX, y: 495 + step, scale: 0.88, facing: -1, t, pose: 'pointing' });
    drawMussolini(ctx, { x: leadX + 105, y: 495 - step, scale: 0.88, facing: -1, t, pose: 'cheering' });
    drawStalin(ctx, { x: leadX + 210, y: 495 + step, scale: 0.88, facing: -1, t, pose: 'idle' });
    drawHirohito(ctx, { x: leadX + 305, y: 495 - step, scale: 0.85, facing: -1, t, pose: 'idle' });
  } else {
    // All four stuck neck-deep inside the giant bubbling mud pit!
    const mudDt = localT - 24.5;
    drawHitler(ctx, {
      x: 220,
      y: 565,
      scale: 0.92,
      facing: 1,
      t,
      lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'hitler'),
      headOnly: true,
      messy: true,
    });
    drawStalin(ctx, {
      x: 315,
      y: 572,
      scale: 0.88,
      facing: 1,
      t,
      headOnly: true,
      messy: true,
    });
    drawMussolini(ctx, {
      x: 135,
      y: 576,
      scale: 0.86,
      facing: 1,
      t,
      headOnly: true,
      messy: true,
    });
    drawHirohito(ctx, {
      x: 405,
      y: 574,
      scale: 0.86,
      facing: -1,
      t,
      headOnly: true,
      messy: true,
    });

    // Front mud rim overlapping their chins/necks
    ctx.fillStyle = '#4B341E';
    ctx.beginPath();
    ctx.ellipse(290, 594, 210, 32, 0, 0, Math.PI);
    ctx.fill();

    // Mud splash burst on initial plunge!
    if (mudDt < 2.2) {
      drawComicStarburst(ctx, 290, 480, 'SPLAT!', 88, '#9A6F40', t);
    }
  }

  if (activeDialogue?.speaker === 'hitler') {
    drawSpeechBubble(ctx, 275, 405, 'ADOLF HITLER', activeDialogue.text, '#B82525', 'down', t);
  }
}

/**
 * ACT 7 (3:50 – 4:30): Total Alliance Meltdown
 */
export function renderAct7(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeDialogue: DialogueCue | null
): void {
  const localT = t - 230;
  // Wall banners gradually droop downward in total defeat!
  const droop = clamp01((localT - 12) / 14);
  drawWarRoomBackdrop(ctx, t, droop, true);

  // All four covered in mud, hay, and ink, furiously pointing fingers at each other!
  drawHitler(ctx, {
    x: 245 + Math.sin(t * 16) * 8,
    y: 445,
    scale: 1.04,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'hitler' || localT < 10),
    pose: 'pointing',
    messy: true,
    inkSplat: true,
  });
  drawMussolini(ctx, {
    x: 495 + Math.cos(t * 15) * 8,
    y: 448,
    scale: 1.04,
    facing: 1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'mussolini'),
    pose: 'pointing',
    messy: true,
    inkSplat: true,
  });
  drawStalin(ctx, {
    x: 785 - Math.sin(t * 13) * 6,
    y: 444,
    scale: 1.04,
    facing: -1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'stalin'),
    pose: 'pointing',
    messy: true,
  });
  drawHirohito(ctx, {
    x: 1030,
    y: 446,
    scale: 1.02,
    facing: -1,
    t,
    lipOpen: getLipSyncOpenness(t, activeDialogue?.speaker === 'hirohito'),
    pose: 'pointing',
    messy: true,
  });

  // World map table in foreground — SNAPS IN HALF at localT >= 26.5 (4:16.5)!
  const snapped = localT >= 26.5;
  const snapAnim = clamp01((localT - 26.5) / 0.55);

  ctx.save();
  // Left half of map table
  ctx.save();
  ctx.translate(450, 560);
  ctx.rotate(snapped ? snapAnim * 0.24 : Math.sin(t * 22) * 0.015);
  ctx.fillStyle = '#6B4829';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.fillRect(-260, -24, 260, 42);
  ctx.strokeRect(-260, -24, 260, 42);
  ctx.fillStyle = '#EFE0B9';
  ctx.fillRect(-248, -32, 246, 18);
  ctx.strokeRect(-248, -32, 246, 18);
  ctx.restore();

  // Right half of map table
  ctx.save();
  ctx.translate(830, 560);
  ctx.rotate(snapped ? -snapAnim * 0.26 : -Math.sin(t * 22) * 0.015);
  ctx.fillStyle = '#6B4829';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.fillRect(0, -24, 260, 42);
  ctx.strokeRect(0, -24, 260, 42);
  ctx.fillStyle = '#EFE0B9';
  ctx.fillRect(2, -32, 246, 18);
  ctx.strokeRect(2, -32, 246, 18);
  ctx.restore();
  ctx.restore();

  // Exploding comic shout bursts ("NEIN!", "NYET!", "MAMMA MIA!", "...")
  const shouts = [
    { label: 'NEIN!', x: 245, y: 245, fill: '#E85642', phase: 0 },
    { label: 'MAMMA MIA!', x: 520, y: 215, fill: '#79B465', phase: 0.9 },
    { label: 'NYET!', x: 785, y: 235, fill: '#D94336', phase: 1.7 },
    { label: '...', x: 1035, y: 255, fill: '#F4E8CC', phase: 2.5 },
  ];
  for (const s of shouts) {
    const pulse = Math.sin(t * 5.2 + s.phase);
    if (pulse > -0.35) {
      drawComicStarburst(ctx, s.x, s.y, s.label, 62 + pulse * 10, s.fill, t + s.phase);
    }
  }

  if (snapped && localT < 30.5) {
    drawComicStarburst(ctx, 640, 515, 'CRACK!', 88, '#F2C94C', t);
  }

  if (activeDialogue?.speaker === 'mussolini') {
    drawSpeechBubble(ctx, 480, 175, 'BENITO MUSSOLINI', activeDialogue.text, '#2E7D32', 'down', t);
  } else if (activeDialogue?.speaker === 'stalin') {
    drawSpeechBubble(ctx, 815, 175, 'JOSEPH STALIN', activeDialogue.text, '#9B2C24', 'down', t);
  }
}

/**
 * ACT 8 (4:30 – 5:00): Finale — World Conquest Cancelled
 */
export function renderAct8(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeDialogue: DialogueCue | null
): void {
  const localT = t - 270;

  if (localT < 17) {
    // Spinning 1940s Newspaper Front Page Zoom-In!
    ctx.fillStyle = '#2B2219';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Vintage sunburst behind spinning newspaper
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.rotate(t * 0.45);
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#524130' : '#3C2F23';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 880, (i * Math.PI) / 8, ((i + 1) * Math.PI) / 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    const spinT = clamp01(localT / 1.35);
    const scale = 0.08 + easeOutBack(spinT) * 0.92;
    const rot = spinT < 1 ? (1 - spinT) * Math.PI * 6 : Math.sin(t * 4.5) * 0.025;

    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 18);
    ctx.scale(scale, scale);
    ctx.rotate(rot);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(-430 + 12, -265 + 12, 860, 530);

    // Aged newsprint page
    ctx.fillStyle = '#EFE5CC';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.fillRect(-430, -265, 860, 530);
    ctx.strokeRect(-430, -265, 860, 530);

    // Newspaper masthead
    ctx.fillStyle = INK;
    ctx.font = '700 42px "Oswald", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE WORLD CHRONICLE — EXTRA! EXTRA!', 0, -214);

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-405, -196);
    ctx.lineTo(405, -196);
    ctx.moveTo(-405, -188);
    ctx.lineTo(405, -188);
    ctx.stroke();

    // Giant front-page satirical headline
    ctx.fillStyle = '#B82525';
    ctx.font = '700 54px "Oswald", Impact, sans-serif';
    ctx.fillText('GLOBAL INVASION CANCELLED', 0, -128);

    ctx.fillStyle = INK;
    ctx.font = '700 30px "Oswald", Impact, sans-serif';
    ctx.fillText('ALL FOUR LEADERS ARGUING OVER WHO GETS SHOTGUN', 0, -82);

    // Newspaper halftone photo box showing the crashed tank
    ctx.fillStyle = '#D2C3A3';
    ctx.fillRect(-250, -58, 500, 260);
    ctx.strokeRect(-250, -58, 500, 260);

    ctx.save();
    ctx.beginPath();
    ctx.rect(-250, -58, 500, 260);
    ctx.clip();
    ctx.translate(14, 128);
    ctx.scale(0.84, 0.84);
    drawMegaTank(ctx, 0, 0, t, -0.05, true, null);
    ctx.restore();

    // Side filler newspaper columns
    ctx.fillStyle = '#3C3227';
    for (const colX of [-400, 272]) {
      for (let line = 0; line < 14; line++) {
        ctx.fillRect(colX, -52 + line * 18, 128 - (line % 3) * 16, 6);
      }
    }

    ctx.fillStyle = INK;
    ctx.font = '600 18px "Oswald", Impact, sans-serif';
    ctx.fillText('SPECIAL REPORT: COWS REMAIN UNIMPRESSED • ROAD SIGN RECEIVES MEDAL OF HONOR', 0, 236);
    ctx.restore();
    return;
  }

  // 4:47 – 5:00: Smoking tank hatch finale with all 4 popping up & pointing fingers for circular iris-out!
  const sky = ctx.createLinearGradient(0, 0, 0, 440);
  sky.addColorStop(0, '#C8B48D');
  sky.addColorStop(1, '#E9DBC0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 440);

  ctx.fillStyle = '#89905E';
  ctx.fillRect(0, 440, CANVAS_WIDTH, 280);

  // Rising smoke clouds from the tank
  for (let i = 0; i < 7; i++) {
    const p = (t * 0.7 + i * 0.14) % 1;
    ctx.fillStyle = `rgba(58, 50, 44, ${(1 - p) * 0.55})`;
    ctx.beginPath();
    ctx.arc(640 + Math.sin(t * 3 + i) * 32, 370 - p * 230, 22 + p * 34, 0, Math.PI * 2);
    ctx.fill();
  }

  // Centered close-up of the smoking Mega-Tank with all 4 popping up & bickering
  ctx.save();
  ctx.translate(640, 455);
  ctx.scale(1.38, 1.38);
  drawMegaTank(ctx, 0, 0, t, -0.04, true, activeDialogue);
  ctx.restore();

  // Animated bickering finger-pointing icons popping above hatch
  if (localT < 19) {
    drawComicStarburst(ctx, 430, 215, 'YOU DROVE!', 66, '#E85642', t);
  } else {
    // The wallet opens on the last line. A moth is its sole occupant.
    const elapsed = localT - 19;
    ctx.save();
    ctx.translate(895, 235 - 22 * Math.sin(Math.PI * clamp01(elapsed / 0.6)));
    ctx.rotate(0.12);
    ctx.fillStyle = '#875B32';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.fillRect(-34, 0, 68, 39);
    ctx.strokeRect(-34, 0, 68, 39);
    const lid = 7 + 27 * clamp01(elapsed / 0.6);
    ctx.fillRect(-34, -lid, 68, lid);
    ctx.strokeRect(-34, -lid, 68, lid);
    if (elapsed > 0.6) {
      const flight = elapsed - 0.6;
      ctx.translate(flight * 37, -lid - flight * 24 + Math.sin(flight * 4) * 9);
      ctx.fillStyle = '#F5DF9C';
      const wing = 2 + 7 * Math.abs(Math.sin(flight * 13));
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * wing, 0, wing, 6, side * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  ctx.fillStyle = '#F7EED8';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.font = '700 38px "Oswald", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeText("THAT'S ALL, COMRADES!", 640, 128);
  ctx.fillText("THAT'S ALL, COMRADES!", 640, 128);
}
