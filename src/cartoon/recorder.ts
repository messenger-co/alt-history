import { isNativeMp4Mime, selectBestRecorderMimeType } from './voices';

export type ExportPhase = 'idle' | 'recording' | 'encoding' | 'done' | 'error';

export class CartoonMp4Recorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private mimeType = '';
  private combinedStream: MediaStream | null = null;

  public start(canvas: HTMLCanvasElement, audioStream: MediaStream | null): void {
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('Video recording is not supported in this browser.');
    }

    const videoStream = canvas.captureStream(30);
    const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];
    if (audioStream) {
      tracks.push(...audioStream.getAudioTracks());
    }

    this.combinedStream = new MediaStream(tracks);
    this.mimeType = selectBestRecorderMimeType((mime) => MediaRecorder.isTypeSupported(mime));
    this.chunks = [];

    const options: MediaRecorderOptions = {
      videoBitsPerSecond: 4_500_000,
    };
    if (this.mimeType) {
      options.mimeType = this.mimeType;
    }

    this.mediaRecorder = new MediaRecorder(this.combinedStream, options);
    this.mediaRecorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        this.chunks.push(ev.data);
      }
    };
    this.mediaRecorder.start(500);
  }

  public async stopAndExportMp4(filename: string): Promise<void> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state === 'inactive') {
      throw new Error('No active recording to export.');
    }

    const recordedBlob = await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.mimeType || 'video/webm',
        });
        resolve(blob);
      };
      recorder.onerror = () => reject(new Error('Recording failed while stopping.'));
      recorder.stop();
    });

    this.cleanupTracks();

    if (recordedBlob.size === 0) {
      throw new Error('Recorded video was empty.');
    }

    let mp4Blob: Blob;
    if (isNativeMp4Mime(recordedBlob.type)) {
      mp4Blob = recordedBlob;
    } else {
      // Transcode WebM capture to genuine H.264/AAC MP4 via our Express ffmpeg endpoint
      const response = await fetch('/api/export-mp4', {
        method: 'POST',
        headers: {
          'Content-Type': recordedBlob.type.split(';')[0] || 'video/webm',
        },
        body: recordedBlob,
      });

      if (!response.ok) {
        throw new Error('MP4 encoding failed on the server.');
      }
      mp4Blob = await response.blob();
    }

    triggerBlobDownload(mp4Blob, filename);
  }

  public abort(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore stop errors during abort
      }
    }
    this.cleanupTracks();
    this.chunks = [];
  }

  private cleanupTracks(): void {
    if (this.combinedStream) {
      for (const track of this.combinedStream.getVideoTracks()) {
        track.stop();
      }
      this.combinedStream = null;
    }
    this.mediaRecorder = null;
  }
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}
