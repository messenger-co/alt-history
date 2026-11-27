import { DIALOGUE_CUES, DialogueCue, SpeakerId } from './timeline';

/**
 * Fish Audio voice model IDs mapped accurately to each cast member.
 * Hirohito uses a random/default Fish Audio voice as requested.
 */
export const FISH_VOICE_MODELS: Record<SpeakerId, string | null> = {
  hitler: '26474a484e3640d086da631baf813050',
  stalin: '890a2fc6bb62428f9d2f9bf6c90879b8',
  mussolini: '926182b0e84c43fdbd95ea0d46f6b10b',
  hirohito: null,
  narrator: null,
};

export interface FishTtsPayload {
  text: string;
  format: 'mp3';
  reference_id?: string;
}

export function findDialogueCueById(cueId: string): DialogueCue | null {
  if (typeof cueId !== 'string' || cueId.length === 0 || cueId.length > 64) {
    return null;
  }
  return DIALOGUE_CUES.find((c) => c.id === cueId) ?? null;
}

/**
 * Builds a validated Fish Audio TTS payload strictly from our allowlisted
 * cartoon dialogue cues (prevents untrusted arbitrary text/model injection).
 */
export function buildFishTtsPayload(
  cueId: string,
  randomFallbackVoiceId?: string | null
): FishTtsPayload | null {
  const cue = findDialogueCueById(cueId);
  if (!cue) return null;

  const modelId = FISH_VOICE_MODELS[cue.speaker];
  const payload: FishTtsPayload = {
    text: cue.text,
    format: 'mp3',
  };

  if (modelId) {
    payload.reference_id = modelId;
  } else if (cue.speaker === 'hirohito' && randomFallbackVoiceId) {
    payload.reference_id = randomFallbackVoiceId;
  }

  return payload;
}

const PREFERRED_MIME_TYPES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
] as const;

export function selectBestRecorderMimeType(
  isTypeSupported: (mime: string) => boolean
): string {
  for (const mime of PREFERRED_MIME_TYPES) {
    if (isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

export function isNativeMp4Mime(mimeType: string): boolean {
  return mimeType.toLowerCase().startsWith('video/mp4');
}
