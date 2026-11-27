import { drawSwastikaVector } from './flags';

export type CharacterPose =
  | 'idle'
  | 'angry'
  | 'drawing'
  | 'pointing'
  | 'tug'
  | 'cheering'
  | 'muddy';

export interface CharacterRenderOpts {
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  t: number;
  lipOpen?: number; // 0..1
  pose?: CharacterPose;
  crayonColor?: string;
  messy?: boolean; // mud/ink/hay splatters
  noseScribble?: boolean; // Mussolini Act 2 gag
  inkSplat?: boolean; // Act 1 ink splatter on face
  captainHat?: boolean; // Act 5 captain's hat
  headOnly?: boolean; // For tank hatch / mud pit
}

const INK = '#1B140E';
const SKIN = '#F0D5B1';
const SKIN_SHADE = '#D6B185';
const GLOVE = '#F8F2E4';

function isBlinking(t: number, phaseOffset: number): boolean {
  const cycle = (t + phaseOffset) % 3.8;
  return cycle > 3.63;
}

/**
 * Draws classic 1940s Fleischer pie-cut oval cartoon eye.
 */
function drawPieEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  blinking: boolean,
  angryAngle = 0,
  halfLid = false
): void {
  ctx.save();
  ctx.translate(x, y);

  if (blinking) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-rx, 0);
    ctx.quadraticCurveTo(0, 4, rx, 0);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Eye white
  ctx.fillStyle = '#FCF7EC';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pie-cut black pupil
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(rx * 0.14, 0, rx * 0.56, 0.35, Math.PI * 2 - 0.35);
  ctx.closePath();
  ctx.fill();

  if (halfLid) {
    ctx.fillStyle = SKIN_SHADE;
    ctx.beginPath();
    ctx.ellipse(0, -ry * 0.45, rx + 1, ry * 0.6, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-rx, -ry * 0.25);
    ctx.lineTo(rx, -ry * 0.25);
    ctx.stroke();
  }

  if (angryAngle !== 0) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-rx - 2, -ry - 4 - angryAngle * 4);
    ctx.lineTo(rx + 2, -ry - 4 + angryAngle * 4);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws a rubber-hose cartoon arm with white 4-finger glove and optional giant crayon or pen.
 */
function drawRubberArm(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  bend: number,
  sleeveColor: string,
  armbandSwastika = false,
  crayonColor?: string
): void {
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2 + bend;

  ctx.save();
  ctx.lineCap = 'round';
  // Outer ink stroke
  ctx.strokeStyle = INK;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(mx, my, ex, ey);
  ctx.stroke();

  // Inner uniform sleeve fill
  ctx.strokeStyle = sleeveColor;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(mx, my, ex, ey);
  ctx.stroke();

  // Optional Nazi red armband with white circle + tilted swastika
  if (armbandSwastika) {
    const ax = sx * 0.62 + mx * 0.38;
    const ay = sy * 0.62 + my * 0.38;
    const ang = Math.atan2(my - sy, mx - sx);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.fillStyle = '#C42121';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.fillRect(-7, -8.5, 14, 17);
    ctx.strokeRect(-7, -8.5, 14, 17);
    ctx.fillStyle = '#F7F0E2';
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
    ctx.fill();
    drawSwastikaVector(ctx, 3.6, INK);
    ctx.restore();
  }

  // Giant cartoon crayon or pen in hand
  if (crayonColor) {
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(0.45);
    ctx.fillStyle = crayonColor;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.fillRect(-5, -38, 10, 44);
    ctx.strokeRect(-5, -38, 10, 44);
    // Paper wrapper band
    ctx.fillStyle = '#1B140E';
    ctx.fillRect(-5, -24, 10, 8);
    // Pointed tip
    ctx.fillStyle = crayonColor;
    ctx.beginPath();
    ctx.moveTo(-5, 6);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // White Fleischer cartoon glove
  ctx.fillStyle = GLOVE;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(ex, ey, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Glove knuckle lines
  ctx.beginPath();
  ctx.moveTo(ex - 4, ey - 3);
  ctx.lineTo(ex - 2, ey + 3);
  ctx.moveTo(ex + 2, ey - 3);
  ctx.lineTo(ex + 4, ey + 3);
  ctx.stroke();

  ctx.restore();
}

function drawMessOverlay(ctx: CanvasRenderingContext2D, t: number, seed: number): void {
  ctx.save();
  // Mud blotches
  ctx.fillStyle = '#4B3621';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  const spots = [
    { x: -16, y: -12, r: 7 },
    { x: 18, y: 6, r: 9 },
    { x: -8, y: 34, r: 10 },
    { x: 12, y: 52, r: 8 },
  ];
  for (let i = 0; i < spots.length; i++) {
    const s = spots[i];
    ctx.beginPath();
    ctx.arc(s.x + ((seed + i) % 3) * 2, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Golden hay stalks sticking out
  ctx.strokeStyle = '#DFB64E';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  const sway = Math.sin(t * 6 + seed) * 3;
  ctx.beginPath();
  ctx.moveTo(-18, -32);
  ctx.lineTo(-34, -46 + sway);
  ctx.moveTo(14, -36);
  ctx.lineTo(32, -52 - sway);
  ctx.moveTo(22, 12);
  ctx.lineTo(42, 4 + sway);
  ctx.stroke();
  ctx.restore();
}

function drawInkSplat(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#141110';
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.arc(10, -4, 4, 0, Math.PI * 2);
  ctx.arc(-9, 6, 4.5, 0, Math.PI * 2);
  ctx.arc(4, 11, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCartoonLegs(
  ctx: CanvasRenderingContext2D,
  bounce: number,
  t: number,
  phase: number,
  pantColor: string
): void {
  const kneeBendL = Math.sin(t * 7.2 + phase) * 8;
  const kneeBendR = -kneeBendL;

  ctx.save();
  ctx.lineCap = 'round';
  for (const [lx, bend] of [
    [-16, kneeBendL],
    [16, kneeBendR],
  ] as const) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(lx, 58 + bounce);
    ctx.quadraticCurveTo(lx + bend, 88 + bounce * 0.5, lx, 112);
    ctx.stroke();

    ctx.strokeStyle = pantColor;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(lx, 58 + bounce);
    ctx.quadraticCurveTo(lx + bend, 88 + bounce * 0.5, lx, 112);
    ctx.stroke();

    // Big glossy Fleischer cartoon boot
    ctx.fillStyle = '#1A130E';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(lx + 6, 116, 18, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Shoe shine highlight
    ctx.fillStyle = 'rgba(248, 240, 224, 0.35)';
    ctx.beginPath();
    ctx.ellipse(lx + 11, 113, 6, 2.6, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCaptainHat(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.save();
  ctx.translate(0, y);
  ctx.fillStyle = '#F7F1E2';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-28, 0);
  ctx.lineTo(-34, -18);
  ctx.quadraticCurveTo(0, -28, 34, -18);
  ctx.lineTo(28, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Visor band
  ctx.fillStyle = '#1B2845';
  ctx.fillRect(-26, -3, 52, 8);
  ctx.strokeRect(-26, -3, 52, 8);

  // Gold anchor badge
  ctx.fillStyle = '#E5B94C';
  ctx.beginPath();
  ctx.arc(0, -13, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws 1940s satirical caricature of Adolf Hitler.
 */
export function drawHitler(ctx: CanvasRenderingContext2D, opts: CharacterRenderOpts): void {
  const {
    x,
    y,
    scale = 1,
    facing = 1,
    t,
    lipOpen = 0,
    pose = 'idle',
    crayonColor,
    messy = false,
    inkSplat = false,
    captainHat = false,
    headOnly = false,
  } = opts;

  const bounce = Math.abs(Math.sin(t * 7.8)) * -8;
  const wave = Math.sin(t * 14) * (pose === 'angry' || pose === 'pointing' ? 24 : 9);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);

  if (!headOnly) {
    drawCartoonLegs(ctx, bounce, t, 0.2, '#4A3F32');

    // Back arm (gesturing furiously)
    const backArmY = pose === 'angry' ? -24 + wave : 16 + wave * 0.4;
    drawRubberArm(ctx, 20, 8 + bounce, 56, backArmY + bounce, -14, '#7E6B4F', false, crayonColor);

    // Torso (brown/khaki tunic + Sam Browne cross strap)
    ctx.fillStyle = '#7E6B4F';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-27, -2 + bounce, 54, 64, 14);
    ctx.fill();
    ctx.stroke();

    // Tie & collar
    ctx.fillStyle = '#1E1610';
    ctx.beginPath();
    ctx.moveTo(-8, -2 + bounce);
    ctx.lineTo(8, -2 + bounce);
    ctx.lineTo(4, 34 + bounce);
    ctx.lineTo(0, 42 + bounce);
    ctx.lineTo(-4, 34 + bounce);
    ctx.closePath();
    ctx.fill();

    // Diagonal leather belt
    ctx.strokeStyle = '#3C2819';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-22, 2 + bounce);
    ctx.lineTo(24, 48 + bounce);
    ctx.stroke();
    ctx.fillStyle = '#3C2819';
    ctx.fillRect(-27, 42 + bounce, 54, 10);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(-27, 42 + bounce, 54, 10);
  }

  // Head
  const headY = -36 + bounce;
  ctx.save();
  ctx.translate(0, headY);
  ctx.rotate(Math.sin(t * 11) * (lipOpen > 0.2 ? 0.08 : 0.03));

  // Ear
  ctx.fillStyle = SKIN;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(-25, 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head shape
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Flopping side-parted hair
  ctx.fillStyle = '#1E1713';
  ctx.beginPath();
  ctx.moveTo(-26, -6);
  ctx.quadraticCurveTo(-24, -36, 4, -33);
  ctx.quadraticCurveTo(28, -30, 26, -8);
  ctx.quadraticCurveTo(6, -24, -18, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Angry eyes
  const blink = isBlinking(t, 0.3);
  drawPieEye(ctx, -6, -4, 6.5, 9, blink, 1.1);
  drawPieEye(ctx, 13, -4, 6.5, 9, blink, -1.1);

  // Sharp nose
  ctx.fillStyle = SKIN_SHADE;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(4, -2);
  ctx.lineTo(13, 8);
  ctx.lineTo(3, 10);
  ctx.stroke();

  // Active lip-sync shouting mouth
  const mouthH = 4 + lipOpen * 16;
  ctx.fillStyle = '#7C1D1B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(4, 18, 12, mouthH * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (mouthH > 8) {
    ctx.fillStyle = '#FBF5E8';
    ctx.fillRect(-4, 18 - mouthH * 0.45, 16, 4);
  }

  // Signature small square toothbrush mustache
  ctx.fillStyle = '#1A1410';
  ctx.fillRect(-3, 9, 13, 7);

  if (inkSplat) drawInkSplat(ctx, 12, -10);
  if (captainHat) drawCaptainHat(ctx, -28);
  if (messy) drawMessOverlay(ctx, t, 1);

  ctx.restore();

  if (!headOnly) {
    // Front arm with red swastika armband (kept clear of face!)
    const frontX = pose === 'pointing' ? 66 : pose === 'drawing' ? 50 : pose === 'angry' ? 48 : 38;
    const frontY =
      pose === 'angry'
        ? -24 - wave * 0.75
        : pose === 'pointing'
          ? -4 + Math.sin(t * 16) * 8
          : 22 + Math.sin(t * 10) * 10;
    drawRubberArm(
      ctx,
      -20,
      10 + bounce,
      frontX,
      frontY + bounce,
      18,
      '#7E6B4F',
      true,
      pose === 'drawing' ? crayonColor : undefined
    );
  }

  ctx.restore();
}

/**
 * Draws 1940s satirical caricature of Joseph Stalin.
 */
export function drawStalin(ctx: CanvasRenderingContext2D, opts: CharacterRenderOpts): void {
  const {
    x,
    y,
    scale = 1,
    facing = 1,
    t,
    lipOpen = 0,
    pose = 'idle',
    crayonColor,
    messy = false,
    inkSplat = false,
    captainHat = false,
    headOnly = false,
  } = opts;

  const bounce = Math.abs(Math.sin(t * 6.4 + 1.1)) * -6;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);

  if (!headOnly) {
    drawCartoonLegs(ctx, bounce, t, 1.4, '#3A3229');

    // Back arm
    drawRubberArm(
      ctx,
      24,
      10 + bounce,
      pose === 'drawing' ? 58 : 48,
      pose === 'pointing' ? -8 + bounce : 24 + Math.sin(t * 8) * 8 + bounce,
      12,
      '#9B2C24',
      false,
      crayonColor
    );

    // Broad stoic Soviet marshal red/crimson tunic
    ctx.fillStyle = '#9B2C24';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-33, -4 + bounce, 66, 66, 16);
    ctx.fill();
    ctx.stroke();

    // Gold shoulder epaulettes
    ctx.fillStyle = '#E0B245';
    ctx.fillRect(-35, -5 + bounce, 18, 9);
    ctx.strokeRect(-35, -5 + bounce, 18, 9);
    ctx.fillRect(17, -5 + bounce, 18, 9);
    ctx.strokeRect(17, -5 + bounce, 18, 9);

    // Gold chest star & buttons
    ctx.fillStyle = '#E0B245';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 12 + i * 14 + bounce, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#3C2819';
    ctx.fillRect(-33, 44 + bounce, 66, 10);
    ctx.strokeRect(-33, 44 + bounce, 66, 10);
  }

  // Head
  const headY = -36 + bounce;
  ctx.save();
  ctx.translate(0, headY);
  ctx.rotate(Math.sin(t * 5) * 0.03);

  ctx.fillStyle = SKIN;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, 29, 31, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Thick swept-back dark hair
  ctx.fillStyle = '#241E1A';
  ctx.beginPath();
  ctx.moveTo(-29, -4);
  ctx.quadraticCurveTo(-28, -38, 4, -36);
  ctx.quadraticCurveTo(32, -32, 28, -4);
  ctx.quadraticCurveTo(8, -22, -29, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stoic half-lidded glaring eyes
  const blink = isBlinking(t, 1.4);
  drawPieEye(ctx, -7, -6, 6.5, 8.5, blink, 0.35, true);
  drawPieEye(ctx, 13, -6, 6.5, 8.5, blink, -0.35, true);

  // Mouth under giant mustache
  const mouthH = 2 + lipOpen * 12;
  if (mouthH > 2.5) {
    ctx.fillStyle = '#6D1C1A';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(4, 18, 9, mouthH * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // MASSIVE thick curved Stalin mustache
  ctx.fillStyle = '#231C17';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-24, 16);
  ctx.quadraticCurveTo(-12, 2, 4, 8);
  ctx.quadraticCurveTo(20, 2, 30, 17);
  ctx.quadraticCurveTo(14, 24, 4, 16);
  ctx.quadraticCurveTo(-8, 24, -24, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Smoking curved wooden pipe + drifting animated smoke puffs
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(15, 16);
  ctx.quadraticCurveTo(32, 22, 40, 14);
  ctx.stroke();
  ctx.fillStyle = '#5A361D';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(36, 4, 11, 13, 3);
  ctx.fill();
  ctx.stroke();

  // Rising pipe smoke puffs (constant motion)
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.9 + i * 0.33) % 1;
    const sx = 42 + Math.sin(t * 4 + i * 2) * 8 + p * 14;
    const sy = 2 - p * 38;
    const r = 4 + p * 8;
    ctx.fillStyle = `rgba(235, 228, 214, ${(1 - p) * 0.65})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (inkSplat) drawInkSplat(ctx, -10, -8);
  if (captainHat) drawCaptainHat(ctx, -30);
  if (messy) drawMessOverlay(ctx, t, 2);

  ctx.restore();

  if (!headOnly) {
    // Front arm
    const fx = pose === 'pointing' ? 60 : 34;
    const fy = pose === 'pointing' ? -6 : 24 + Math.sin(t * 7) * 6;
    drawRubberArm(ctx, -24, 12 + bounce, fx, fy + bounce, 18, '#9B2C24');
  }

  ctx.restore();
}

/**
 * Draws 1940s satirical caricature of Benito Mussolini.
 */
export function drawMussolini(ctx: CanvasRenderingContext2D, opts: CharacterRenderOpts): void {
  const {
    x,
    y,
    scale = 1,
    facing = 1,
    t,
    lipOpen = 0,
    pose = 'idle',
    crayonColor,
    messy = false,
    noseScribble = false,
    inkSplat = false,
    headOnly = false,
  } = opts;

  const bounce = Math.abs(Math.sin(t * 8.4 + 2.1)) * -9;
  const puff = 1 + Math.sin(t * 4.5) * 0.05;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);

  if (!headOnly) {
    drawCartoonLegs(ctx, bounce, t, 2.2, '#343631');

    // Back arm
    drawRubberArm(
      ctx,
      26,
      10 + bounce,
      pose === 'drawing' ? 40 : 54,
      pose === 'cheering' ? -30 + Math.sin(t * 14) * 14 : 18 + Math.sin(t * 9) * 10 + bounce,
      -10,
      '#4E5548',
      false,
      crayonColor
    );

    // Huge puffed-out barrel chest
    ctx.save();
    ctx.scale(puff, 1);
    ctx.fillStyle = '#4E5548';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(4, 28 + bounce, 36, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ribbons & flashy oversized medals
    const medalColors = ['#D9A63A', '#C4382A', '#3B7A57'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = medalColors[i];
      ctx.beginPath();
      ctx.arc(-6 + i * 13, 18 + bounce, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Head with oversized jutting chin
  const headY = -36 + bounce;
  ctx.save();
  ctx.translate(0, headY);
  ctx.rotate(-0.08 + Math.sin(t * 8) * 0.04);

  // Bald dome + giant jutting square jaw
  ctx.fillStyle = SKIN;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(-24, -14);
  ctx.quadraticCurveTo(-24, -36, 2, -35);
  ctx.quadraticCurveTo(26, -34, 26, -8);
  // Oversized jutting chin!
  ctx.lineTo(35, 24);
  ctx.quadraticCurveTo(28, 36, 6, 34);
  ctx.lineTo(-20, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Black military fez cap with swinging gold tassel
  ctx.fillStyle = '#1E1A17';
  ctx.beginPath();
  ctx.moveTo(-24, -18);
  ctx.lineTo(-18, -44);
  ctx.lineTo(18, -44);
  ctx.lineTo(24, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Tassel swinging continuously
  const tasselSwing = Math.sin(t * 9.5) * 8;
  ctx.strokeStyle = '#E0B245';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(14, -42);
  ctx.quadraticCurveTo(28, -32, 26 + tasselSwing, -12);
  ctx.stroke();
  ctx.fillStyle = '#E0B245';
  ctx.beginPath();
  ctx.arc(26 + tasselSwing, -10, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Proud dramatic eyes
  const blink = isBlinking(t, 2.3);
  drawPieEye(ctx, -4, -8, 6.8, 8.8, blink, 0.5);
  drawPieEye(ctx, 15, -8, 6.8, 8.8, blink, -0.5);

  // Prominent nose
  ctx.fillStyle = SKIN_SHADE;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(12, 4, 8, 5.5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Act 2 comedic crayon scribble on his own nose!
  if (noseScribble) {
    ctx.strokeStyle = '#1E7E43';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(3, 1);
    ctx.lineTo(19, 8);
    ctx.moveTo(6, 9);
    ctx.lineTo(20, 0);
    ctx.stroke();
  }

  // Expressive mouth
  const mouthH = 4 + lipOpen * 14;
  ctx.fillStyle = '#7C1D1B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(10, 18, 12, mouthH * 0.56, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (inkSplat) drawInkSplat(ctx, -4, 4);
  if (messy) drawMessOverlay(ctx, t, 3);

  ctx.restore();

  if (!headOnly) {
    // Front arm (either hands-on-hips pompous pose or gesturing/drawing on nose)
    if (noseScribble) {
      drawRubberArm(ctx, -20, 14 + bounce, 18, -28 + Math.sin(t * 15) * 6 + bounce, 14, '#4E5548', false, '#1E7E43');
    } else {
      const fx = pose === 'pointing' ? 62 : pose === 'cheering' ? 44 : -26;
      const fy = pose === 'pointing' ? -6 : pose === 'cheering' ? -34 + Math.sin(t * 12) * 10 : 40;
      drawRubberArm(ctx, -22, 12 + bounce, fx, fy + bounce, 18, '#4E5548');
    }
  }

  ctx.restore();
}

/**
 * Draws 1940s satirical caricature of Emperor Hirohito.
 */
export function drawHirohito(ctx: CanvasRenderingContext2D, opts: CharacterRenderOpts): void {
  const {
    x,
    y,
    scale = 1,
    facing = 1,
    t,
    lipOpen = 0,
    pose = 'idle',
    crayonColor,
    messy = false,
    inkSplat = false,
    headOnly = false,
  } = opts;

  // Measured, deadpan rhythmic bounce
  const bounce = Math.abs(Math.sin(t * 5.8 + 0.6)) * -4.5;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);

  if (!headOnly) {
    drawCartoonLegs(ctx, bounce, t, 3.1, '#4C4A3B');

    // Back arm
    drawRubberArm(
      ctx,
      18,
      10 + bounce,
      pose === 'drawing' ? 50 : 42,
      pose === 'pointing' ? -4 + bounce : 24 + Math.sin(t * 5) * 4 + bounce,
      10,
      '#6E6A4E',
      false,
      crayonColor
    );

    // Crisp military uniform with gold braid sash
    ctx.fillStyle = '#6E6A4E';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.roundRect(-24, -2 + bounce, 48, 62, 12);
    ctx.fill();
    ctx.stroke();

    // Red-and-gold ceremonial shoulder sash & collar tabs
    ctx.strokeStyle = '#C42828';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-18, 0 + bounce);
    ctx.lineTo(18, 46 + bounce);
    ctx.stroke();
    ctx.fillStyle = '#E0B245';
    ctx.fillRect(-10, -2 + bounce, 20, 7);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-10, -2 + bounce, 20, 7);
  }

  // Head
  const headY = -36 + bounce;
  ctx.save();
  ctx.translate(0, headY);

  ctx.fillStyle = SKIN;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Peaked military cap with red band and gold star
  ctx.fillStyle = '#5D5942';
  ctx.beginPath();
  ctx.moveTo(-25, -15);
  ctx.lineTo(-27, -34);
  ctx.quadraticCurveTo(0, -42, 27, -34);
  ctx.lineTo(25, -15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#B82525';
  ctx.fillRect(-24, -19, 48, 6);
  ctx.strokeRect(-24, -19, 48, 6);
  ctx.fillStyle = '#E5B94C';
  ctx.beginPath();
  ctx.arc(0, -26, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Cap brim
  ctx.fillStyle = '#1B140E';
  ctx.beginPath();
  ctx.ellipse(6, -13, 22, 4.5, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Deadpan eyes behind signature round glasses
  const blink = isBlinking(t, 3.0);
  drawPieEye(ctx, -7, -2, 5.2, 6.2, blink, 0);
  drawPieEye(ctx, 11, -2, 5.2, 6.2, blink, 0);

  // Round wire-rim glasses with vintage lens glint
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.fillStyle = 'rgba(255, 252, 240, 0.25)';
  ctx.beginPath();
  ctx.arc(-7, -2, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(11, -2, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2.5, -2);
  ctx.lineTo(1.5, -2);
  ctx.stroke();
  // Lens glint
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-11, -6);
  ctx.lineTo(-7, -8);
  ctx.moveTo(7, -6);
  ctx.lineTo(11, -8);
  ctx.stroke();

  // Neat thin mustache
  ctx.fillStyle = '#241E1A';
  ctx.fillRect(-3, 10, 12, 3.5);

  // Calm deadpan mouth
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  if (lipOpen > 0.15) {
    ctx.fillStyle = '#6D1C1A';
    ctx.beginPath();
    ctx.ellipse(3, 18, 7, 2 + lipOpen * 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-4, 18);
    ctx.lineTo(10, 18);
    ctx.stroke();
  }

  if (inkSplat) drawInkSplat(ctx, 8, 12);
  if (messy) drawMessOverlay(ctx, t, 4);

  ctx.restore();

  if (!headOnly) {
    const fx = pose === 'pointing' ? 54 : 26;
    const fy = pose === 'pointing' ? -2 : 28 + Math.sin(t * 4) * 3;
    drawRubberArm(ctx, -18, 10 + bounce, fx, fy + bounce, 14, '#6E6A4E');
  }

  ctx.restore();
}

/**
 * Draws cartoon Winston Churchill (Act 6 Allied Counter-Prank).
 */
export function drawChurchill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  const laughBounce = Math.sin(t * 11) * 4;
  ctx.save();
  ctx.translate(x, y + laughBounce);

  // Round suit torso
  ctx.fillStyle = '#2B323D';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 32, 36, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Polka-dot bow tie
  ctx.fillStyle = '#9D2B2B';
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(-14, -4);
  ctx.lineTo(-14, 10);
  ctx.closePath();
  ctx.moveTo(0, 4);
  ctx.lineTo(14, -4);
  ctx.lineTo(14, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Round jolly face
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(0, -24, 27, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bowler hat
  ctx.fillStyle = '#1E1A18';
  ctx.beginPath();
  ctx.arc(0, -42, 22, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -42, 31, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Laughing eyes + brass binoculars held up
  drawPieEye(ctx, -9, -26, 5.5, 7, false);
  drawPieEye(ctx, 11, -26, 5.5, 7, false);

  // Big laughing smile + cigar
  ctx.fillStyle = '#7C1D1B';
  ctx.beginPath();
  ctx.arc(2, -12, 11, 0, Math.PI);
  ctx.fill();
  ctx.stroke();

  // Cigar & smoke puff
  ctx.fillStyle = '#6A3F1E';
  ctx.fillRect(10, -14, 24, 6);
  ctx.strokeRect(10, -14, 24, 6);
  ctx.fillStyle = '#E85D2A';
  ctx.fillRect(32, -14, 4, 6);

  // Brass binoculars on right hand
  ctx.fillStyle = '#C99B3B';
  ctx.fillRect(14, -33, 28, 12);
  ctx.strokeRect(14, -33, 28, 12);

  // Teacup in left hand
  ctx.fillStyle = '#F7F1E2';
  ctx.beginPath();
  ctx.arc(-40, 14, 10, 0, Math.PI);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws cartoon Franklin D. Roosevelt (Act 6 Allied Counter-Prank).
 */
export function drawRoosevelt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  const laughBounce = Math.sin(t * 10.5 + 1.2) * 4;
  ctx.save();
  ctx.translate(x, y + laughBounce);

  // Navy pinstripe suit
  ctx.fillStyle = '#2F3D52';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-28, 0, 56, 62, 14);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(0, -26, 24, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Fedora hat
  ctx.fillStyle = '#4B443B';
  ctx.beginPath();
  ctx.moveTo(-24, -42);
  ctx.lineTo(-18, -62);
  ctx.lineTo(18, -62);
  ctx.lineTo(24, -42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -42, 34, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pince-nez glasses + laughing eyes
  drawPieEye(ctx, -8, -28, 5, 6.5, false);
  drawPieEye(ctx, 10, -28, 5, 6.5, false);
  ctx.strokeStyle = '#C99B3B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-8, -28, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(10, -28, 8, 0, Math.PI * 2);
  ctx.stroke();

  // Classic beaming grin + jaunty angled cigarette holder
  ctx.fillStyle = '#FCF7EC';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(2, -13, 12, 0.1, Math.PI - 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(12, -12);
  ctx.lineTo(38, -28);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a bouncing 1940s comic speech bubble with clean auto-wrapped text.
 */
export function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speakerName: string,
  text: string,
  accentColor: string,
  tailDirection: 'left' | 'right' | 'down',
  t: number
): void {
  ctx.save();
  const pop = 1 + Math.sin(t * 10) * 0.015;
  ctx.translate(x, y + Math.sin(t * 6) * 3);
  ctx.scale(pop, pop);

  ctx.font = '700 20px "Oswald", Impact, sans-serif';
  const maxLineWidth = 350;
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxLineWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const lineH = 26;
  const boxW = Math.min(395, Math.max(220, ...lines.map((l) => ctx.measureText(l).width + 44)));
  const boxH = 38 + lines.length * lineH + 16;
  const bx = -boxW / 2;
  const by = -boxH / 2;

  // Drop shadow
  ctx.fillStyle = 'rgba(20, 14, 10, 0.35)';
  ctx.beginPath();
  ctx.roundRect(bx + 6, by + 6, boxW, boxH, 16);
  ctx.fill();

  // Cream comic bubble body
  ctx.fillStyle = '#F9F2DF';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 16);
  ctx.fill();
  ctx.stroke();

  // Tail triangle
  ctx.fillStyle = '#F9F2DF';
  ctx.beginPath();
  if (tailDirection === 'down') {
    ctx.moveTo(-12, by + boxH - 2);
    ctx.lineTo(0, by + boxH + 22);
    ctx.lineTo(14, by + boxH - 2);
  } else if (tailDirection === 'left') {
    ctx.moveTo(bx + 2, 0);
    ctx.lineTo(bx - 24, 16);
    ctx.lineTo(bx + 10, 18);
  } else {
    ctx.moveTo(bx + boxW - 2, 0);
    ctx.lineTo(bx + boxW + 24, 16);
    ctx.lineTo(bx + boxW - 10, 18);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Speaker header bar
  ctx.fillStyle = accentColor;
  ctx.font = '700 14px "Oswald", Impact, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(speakerName, bx + 18, by + 23);

  // Wrapped bold speech lines
  ctx.fillStyle = INK;
  ctx.font = '700 20px "Oswald", Impact, sans-serif';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], bx + 18, by + 48 + i * lineH);
  }

  ctx.restore();
}
