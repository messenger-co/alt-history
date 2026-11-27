import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { FishTtsPayload, buildFishTtsPayload, findDialogueCueById } from './src/cartoon/voices';

const PORT = 3000;
const FISH_TTS_ENDPOINT = 'https://api.fish.audio/v1/tts';
const FISH_MODELS_ENDPOINT = 'https://api.fish.audio/model?page_size=20&language=en';
const MAX_VIDEO_UPLOAD_BYTES = 180 * 1024 * 1024; // 180 MB cap

// In-memory cache of generated Fish Audio MP3 buffers keyed by allowlisted cueId
const ttsAudioCache = new Map<string, Buffer>();
let cachedHirohitoRandomVoiceId: string | null = null;
let hirohitoVoiceChecked = false;

function getFishApiKey(): string | null {
  const key = process.env.FISH_AUDIO_API_KEY?.trim();
  if (!key || key === 'YOUR_FISH_AUDIO_API_KEY') {
    return null;
  }
  return key;
}

/**
 * Picks a random public Fish Audio voice ID once per server session for Hirohito.
 */
async function getRandomVoiceIdForHirohito(apiKey: string): Promise<string | null> {
  if (hirohitoVoiceChecked) return cachedHirohitoRandomVoiceId;
  hirohitoVoiceChecked = true;
  try {
    const res = await fetch(FISH_MODELS_ENDPOINT, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: Array<{ _id?: string }> };
    const candidates = (data.items ?? [])
      .map((item) => item._id)
      .filter((id): id is string => typeof id === 'string' && /^[a-f0-9]{16,64}$/i.test(id));
    if (candidates.length > 0) {
      const idx = crypto.randomInt(0, candidates.length);
      cachedHirohitoRandomVoiceId = candidates[idx];
    }
  } catch {
    // Non-fatal: Fish Audio uses its default voice when reference_id is omitted
  }
  return cachedHirohitoRandomVoiceId;
}

/**
 * Runs ffmpeg with strict argument array (shell: false) to transcode WebM/MP4 input
 * into a universally playable H.264 + AAC MP4 file.
 */
function runFfmpegToMp4(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputPath,
    ];

    const proc = spawn('ffmpeg', args, { shell: false, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < 4000) {
        stderr += chunk.toString('utf8');
      }
    });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-400)}`));
      }
    });
  });
}

const FISH_MODEL_CANDIDATES = ['s2.1-pro', 's2.1-pro-free', 's1', 'speech-1.6'] as const;
let preferredFishModel: string | null = null;

async function synthesizeWithFishAudio(
  apiKey: string,
  payload: FishTtsPayload
): Promise<{ ok: true; audio: Buffer; model: string } | { ok: false; status: number; detail: string }> {
  const modelsToTry = preferredFishModel
    ? [preferredFishModel, ...FISH_MODEL_CANDIDATES.filter((m) => m !== preferredFishModel)]
    : [...FISH_MODEL_CANDIDATES];

  let lastStatus = 502;
  let lastDetail = 'Fish Audio synthesis failed.';

  for (const model of modelsToTry) {
    const upstream = await fetch(FISH_TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        model,
      },
      body: JSON.stringify(payload),
    });

    if (upstream.ok) {
      const arrayBuf = await upstream.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuf);
      if (audioBuffer.length > 0) {
        preferredFishModel = model;
        return { ok: true, audio: audioBuffer, model };
      }
      lastStatus = 502;
      lastDetail = 'Empty audio response from Fish Audio.';
      continue;
    }

    lastStatus = upstream.status;
    try {
      const text = await upstream.text();
      lastDetail = text.slice(0, 240) || `Fish Audio returned HTTP ${upstream.status}.`;
    } catch {
      lastDetail = `Fish Audio returned HTTP ${upstream.status}.`;
    }

    // Retry next model on 400 / 402 / 404 / 422; stop immediately on 401 unauthorized
    if (upstream.status === 401) {
      break;
    }
  }

  return { ok: false, status: lastStatus, detail: lastDetail };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  // Health / Fish Audio configuration status (never exposes key value)
  app.get('/api/tts/status', (_req, res) => {
    res.json({
      configured: Boolean(getFishApiKey()),
      provider: 'fish-audio',
      model: preferredFishModel,
    });
  });

  // Server-side proxy for Fish Audio TTS restricted to allowlisted cartoon dialogue cue IDs
  app.post('/api/tts', express.json({ limit: '4kb' }), async (req, res) => {
    const apiKey = getFishApiKey();
    if (!apiKey) {
      res.status(503).json({
        error: 'Fish Audio API key is not configured in server environment.',
        configured: false,
      });
      return;
    }

    const cueId = typeof req.body?.cueId === 'string' ? req.body.cueId : '';
    const cue = findDialogueCueById(cueId);
    if (!cue) {
      res.status(400).json({ error: 'Invalid dialogue cueId.' });
      return;
    }

    const cached = ttsAudioCache.get(cue.id);
    if (cached) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(cached);
      return;
    }

    try {
      const randomVoice =
        cue.speaker === 'hirohito' ? await getRandomVoiceIdForHirohito(apiKey) : null;
      const payload = buildFishTtsPayload(cue.id, randomVoice);
      if (!payload) {
        res.status(400).json({ error: 'Unable to build TTS payload.' });
        return;
      }

      const result = await synthesizeWithFishAudio(apiKey, payload);
      if (!result.ok) {
        res.status(result.status === 401 || result.status === 402 ? result.status : 502).json({
          error: `Fish Audio error (${result.status})`,
          upstreamStatus: result.status,
          detail: result.detail,
        });
        return;
      }

      ttsAudioCache.set(cue.id, result.audio);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('X-Fish-Model', result.model);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(result.audio);
    } catch {
      res.status(502).json({ error: 'Failed to reach Fish Audio TTS service.' });
    }
  });

  // Server-side WebM -> MP4 (H.264/AAC) transcoder for guaranteed MP4 downloads across all browsers
  app.post(
    '/api/export-mp4',
    express.raw({
      type: ['video/webm', 'video/mp4', 'application/octet-stream'],
      limit: MAX_VIDEO_UPLOAD_BYTES,
    }),
    async (req, res) => {
      if (!Buffer.isBuffer(req.body) || req.body.length < 64) {
        res.status(400).json({ error: 'Missing or empty recorded video payload.' });
        return;
      }

      const baseDir = path.resolve(os.tmpdir(), 'newsreel-mp4-export');
      await fs.mkdir(baseDir, { recursive: true });
      const jobId = crypto.randomUUID();
      const inputPath = path.resolve(baseDir, `${jobId}.input.webm`);
      const outputPath = path.resolve(baseDir, `${jobId}.output.mp4`);

      // Confine strictly to temp directory
      if (
        !inputPath.startsWith(baseDir + path.sep) ||
        !outputPath.startsWith(baseDir + path.sep)
      ) {
        res.status(400).json({ error: 'Invalid export path.' });
        return;
      }

      try {
        await fs.writeFile(inputPath, req.body);
        await runFfmpegToMp4(inputPath, outputPath);
        const mp4Bytes = await fs.readFile(outputPath);

        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="alt-history-newsreel-1940.mp4"'
        );
        res.setHeader('Content-Length', String(mp4Bytes.length));
        res.send(mp4Bytes);
      } catch {
        res.status(500).json({ error: 'Failed to transcode recording to MP4.' });
      } finally {
        await fs.rm(inputPath, { force: true }).catch(() => {});
        await fs.rm(outputPath, { force: true }).catch(() => {});
      }
    }
  );

  // Mount Vite dev middleware in development or serve built dist/ in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
