import { renderAct1, renderAct2, renderAct3, renderAct4 } from './scenesPart1';
import { renderAct5, renderAct6, renderAct7, renderAct8 } from './scenesPart2';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DialogueCue,
  getActAtTime,
  getActiveDialogue,
  getCameraShake,
  getIrisOpenRatio,
  wrapTime,
} from './timeline';

let cachedVignetteCtx: CanvasRenderingContext2D | null = null;
let cachedVignette: CanvasGradient | null = null;

function getVignette(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (cachedVignette && cachedVignetteCtx === ctx) {
    return cachedVignette;
  }
  const vig = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    340,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    780
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(18, 12, 8, 0.56)');
  cachedVignetteCtx = ctx;
  cachedVignette = vig;
  return vig;
}

/**
 * Draws authentic 1940s Fleischer sepia film grain, flickering projector scratches,
 * warm archival tint, vignette, and bottom newsreel captions.
 */
function drawVintageFilmOverlay(
  ctx: CanvasRenderingContext2D,
  t: number,
  activeDialogue: DialogueCue | null,
  actLabel: string,
  actTitle: string
): void {
  // Subtle warm sepia archival wash & projector flicker
  const flicker = 0.04 + Math.sin(t * 47.3) * 0.015 + Math.cos(t * 23.1) * 0.01;
  ctx.fillStyle = `rgba(112, 74, 34, ${flicker.toFixed(3)})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Moving vertical celluloid film scratches
  ctx.strokeStyle = 'rgba(248, 240, 220, 0.14)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const sx = ((Math.sin(t * 17.3 + i * 19.7) * 0.5 + 0.5) * CANVAS_WIDTH) | 0;
    if ((Math.floor(t * 24) + i) % 5 === 0) {
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx + Math.sin(t * 9) * 3, CANVAS_HEIGHT);
      ctx.stroke();
    }
  }

  // Lightweight procedural film grain dust specks (zero performance lag at 60fps)
  const seed = Math.floor(t * 24);
  for (let i = 0; i < 38; i++) {
    const h1 = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const h2 = Math.sin(seed * 45.164 + i * 94.673) * 28461.1234;
    const gx = (h1 - Math.floor(h1)) * CANVAS_WIDTH;
    const gy = (h2 - Math.floor(h2)) * CANVAS_HEIGHT;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 247, 230, 0.16)' : 'rgba(20, 14, 10, 0.14)';
    ctx.fillRect(gx, gy, 2.2, 2.2);
  }

  // Soft 1940s theater lens vignette (cached)
  ctx.fillStyle = getVignette(ctx);
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle top-left chapter slate title (clean editorial typography, no pill box)
  ctx.save();
  ctx.fillStyle = 'rgba(18, 13, 9, 0.62)';
  ctx.fillRect(24, 18, 390, 34);
  ctx.fillStyle = '#E8D8B9';
  ctx.font = '600 16px "Oswald", Impact, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${actLabel.toUpperCase()}  ·  ${actTitle.toUpperCase()}`, 36, 35);
  ctx.restore();

  // Bottom 1940s Newsreel Captions Bar whenever speech is active
  if (activeDialogue) {
    ctx.save();
    const barH = 74;
    const barY = CANVAS_HEIGHT - barH;
    const scrim = ctx.createLinearGradient(0, barY - 24, 0, CANVAS_HEIGHT);
    scrim.addColorStop(0, 'rgba(14, 10, 7, 0)');
    scrim.addColorStop(0.32, 'rgba(14, 10, 7, 0.84)');
    scrim.addColorStop(1, 'rgba(14, 10, 7, 0.94)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, barY - 24, CANVAS_WIDTH, barH + 24);

    // Speaker label + crisp readable caption
    ctx.fillStyle = '#E6B95C';
    ctx.font = '700 15px "Oswald", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(activeDialogue.speakerName, CANVAS_WIDTH / 2, barY + 21);

    ctx.fillStyle = '#FAF2DF';
    ctx.font = '600 23px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(`"${activeDialogue.text}"`, CANVAS_WIDTH / 2, barY + 52);
    ctx.restore();
  }
}

/**
 * Draws the classic circular 1940s iris-out / iris-open transition mask.
 */
function drawIrisWipe(ctx: CanvasRenderingContext2D, t: number): void {
  const ratio = getIrisOpenRatio(t);
  if (ratio >= 0.999) return;

  const maxR = Math.hypot(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2) + 20;
  const r = Math.max(0, ratio * maxR);

  ctx.save();
  ctx.fillStyle = '#0D0A08';
  ctx.beginPath();
  ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (r > 1) {
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20, r, 0, Math.PI * 2, true);
  }
  ctx.fill('evenodd');
  ctx.restore();
}

/**
 * Master 60fps frame renderer for the entire 5-minute (300s) animation.
 */
export function renderCartoonFrame(ctx: CanvasRenderingContext2D, rawTime: number): void {
  const t = wrapTime(rawTime);
  const act = getActAtTime(t);
  const activeDialogue = getActiveDialogue(t);
  const shake = getCameraShake(t);

  ctx.save();
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (shake.intensity > 0) {
    ctx.translate(shake.x, shake.y);
  }

  switch (act.id) {
    case 1:
      renderAct1(ctx, t, activeDialogue);
      break;
    case 2:
      renderAct2(ctx, t, activeDialogue);
      break;
    case 3:
      renderAct3(ctx, t, activeDialogue);
      break;
    case 4:
      renderAct4(ctx, t, activeDialogue);
      break;
    case 5:
      renderAct5(ctx, t, activeDialogue);
      break;
    case 6:
      renderAct6(ctx, t, activeDialogue);
      break;
    case 7:
      renderAct7(ctx, t, activeDialogue);
      break;
    case 8:
    default:
      renderAct8(ctx, t, activeDialogue);
      break;
  }

  ctx.restore();

  // Vintage film grain, vignette, chapter slate, captions, and iris wipe
  drawVintageFilmOverlay(ctx, t, activeDialogue, act.label, act.title);
  drawIrisWipe(ctx, t);
}
