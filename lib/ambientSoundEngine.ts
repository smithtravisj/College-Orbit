export type AmbientSoundType = 'whiteNoise' | 'pinkNoise' | 'brownNoise';

export const AMBIENT_SOUNDS: { type: AmbientSoundType; label: string }[] = [
  { type: 'whiteNoise', label: 'White Noise' },
  { type: 'pinkNoise', label: 'Pink Noise' },
  { type: 'brownNoise', label: 'Brown Noise' },
];

export class AmbientSoundEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private activeSourceNodes: AudioBufferSourceNode[] = [];
  private currentSound: AmbientSoundType | null = null;
  private _volume = 0.5;

  init(): void {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this._volume;
    this.masterGain.connect(this.audioContext.destination);
  }

  get isPlaying(): boolean {
    return this.currentSound !== null;
  }

  play(soundType: AmbientSoundType): void {
    this.init();
    if (!this.audioContext || !this.masterGain) return;

    if (this.currentSound) this.stopInternal();
    this.currentSound = soundType;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const ctx = this.audioContext;
    const sampleRate = ctx.sampleRate;
    const duration = 4; // 4-second looping buffer
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);

      if (soundType === 'whiteNoise') {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      } else if (soundType === 'pinkNoise') {
        // Paul Kellet pink noise algorithm — independent state per channel
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
      } else {
        // Brown noise — cumulative random walk, independent per channel
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        }
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.5;

    if (soundType === 'whiteNoise') {
      // Gentle lowpass to tame harsh high frequencies
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 4000;
      lowpass.Q.value = 0.5;
      source.connect(lowpass);
      lowpass.connect(gain);
      this.activeNodes.push(lowpass);
    } else {
      source.connect(gain);
    }

    gain.connect(this.masterGain);
    source.start();

    this.activeNodes.push(gain);
    this.activeSourceNodes.push(source);
  }

  stop(): void {
    this.stopInternal();
    this.currentSound = null;
  }

  private stopInternal(): void {
    for (const node of this.activeSourceNodes) {
      try { node.stop(); } catch { /* already stopped */ }
    }
    for (const node of this.activeNodes) {
      try { node.disconnect(); } catch { /* already disconnected */ }
    }
    this.activeNodes = [];
    this.activeSourceNodes = [];
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this._volume;
    }
  }

  resume(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  cleanup(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}
