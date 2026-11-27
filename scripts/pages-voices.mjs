import {mkdir, writeFile} from 'node:fs/promises';
import {DIALOGUE_CUES} from '../src/cartoon/timeline.ts';

const directory = 'dist/voices';
const configured = Boolean(process.env.FISH_AUDIO_API_KEY?.trim());
await mkdir(directory, {recursive: true});
if (configured) {
  const server = Bun.spawn(['bun', 'server.ts'], {
    env: {...process.env, NODE_ENV: 'production'},
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50 && !ready; attempt++) {
      const status = await fetch('http://127.0.0.1:3000/api/tts/status').catch(() => null);
      ready = status?.ok && (await status.json()).configured;
      if (!ready) await Bun.sleep(200);
    }
    if (!ready) throw new Error('Fish Audio server did not become ready');
    for (const cue of DIALOGUE_CUES) {
      const response = await fetch('http://127.0.0.1:3000/api/tts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({cueId: cue.id}),
      });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('audio/mpeg')) {
        throw new Error(`Fish Audio failed for ${cue.id} (HTTP ${response.status})`);
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length) throw new Error(`Empty audio for ${cue.id}`);
      await writeFile(`${directory}/${cue.id}.mp3`, bytes);
    }
  } finally {
    server.kill();
  }
}
await writeFile(`${directory}/status.json`, JSON.stringify({configured}));
