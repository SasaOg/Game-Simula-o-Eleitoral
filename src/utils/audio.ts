/**
 * Motor de Áudio da Urna Eletrônica e Trilha Sonora 8-bit
 * Utiliza Web Audio API pura com parâmetros precisos.
 */

// Constantes do Som de Confirmação da Urna
export const CONFIRM_FREQ_1_HZ = 2200;
export const CONFIRM_FREQ_2_HZ = 2306;
export const CONFIRM_DURATION_MS = 1350;
export const CONFIRM_ATTACK_MS = 30;
export const CONFIRM_RELEASE_MS = 5;

// Constantes do Som de Tecla
export const KEY_BEEP_HZ = 2200;
export const KEY_BEEP_MS = 80;

// Constantes da Música de Espera
export const MUSIC_BPM = 110;
export const MUSIC_VOLUME = 0.12;
export const MELODY_WAVE: OscillatorType = 'square';
export const BASS_WAVE: OscillatorType = 'triangle';

// Conversão das notas em frequências (Hz)
const NOTE_FREQS: Record<string, number> = {
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880.00,
  C3: 130.81,
  G2: 98.00,
  A2: 110.00,
  F2: 87.31,
};

// 16 notas de colcheia da melodia
const MELODY_SEQUENCE = [
  'C5', 'E5', 'G5', 'E5',
  'A5', 'G5', 'E5', 'D5',
  'C5', 'E5', 'G5', 'A5',
  'G5', 'E5', 'D5', 'C5',
];

// Baixo: 1 nota por compasso (cada compasso tem 4 tempos = 8 colcheias)
const BASS_SEQUENCE = ['C3', 'G2', 'A2', 'F2'];

class SoundController {
  private ctx: AudioContext | null = null;
  private musicInterval: number | null = null;
  private isMusicPlaying = false;
  private isMuted = false;
  private musicStep = 0;

  constructor() {
    // Inicialização atrasada para obedecer políticas dos navegadores
    const savedMute = localStorage.getItem('urna_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    localStorage.setItem('urna_muted', String(muted));
    if (muted && this.isMusicPlaying) {
      this.stopMusic();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Bipe curto ao pressionar teclas numéricas
   */
  public playKeyBeep(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(KEY_BEEP_HZ, ctx.currentTime);

      const durationSec = KEY_BEEP_MS / 1000;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.005);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + durationSec - 0.005);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch (err) {
      console.warn('Erro ao reproduzir bipe:', err);
    }
  }

  /**
   * Som oficial de confirmação da urna eletrônica fornecido pelo usuário
   */
  public playConfirmSound(): Promise<void> {
    if (this.isMuted) return Promise.resolve();

    return new Promise((resolve) => {
      let resolved = false;
      const finish = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      try {
        const audio = new Audio('/assets/aistudio/confirma-urna_91ce1866.mp3');
        audio.volume = 0.9;

        audio.addEventListener('ended', finish);
        audio.addEventListener('error', (e) => {
          console.warn('Erro no arquivo mp3 da urna, usando síntese senoidal:', e);
          this.playSyntheticConfirm().then(finish);
        });

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Falha no elemento Audio play, usando síntese:', err);
            this.playSyntheticConfirm().then(finish);
          });
        }

        // Timeout de segurança
        setTimeout(finish, 2200);
      } catch (err) {
        console.warn('Erro ao inicializar som de confirmação:', err);
        this.playSyntheticConfirm().then(finish);
      }
    });
  }

  /**
   * Síntese com dois osciladores senoidais batimento (fallback)
   */
  public playSyntheticConfirm(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = this.initContext();
        const durationSec = CONFIRM_DURATION_MS / 1000;
        const attackSec = CONFIRM_ATTACK_MS / 1000;
        const releaseSec = CONFIRM_RELEASE_MS / 1000;
        const startTime = ctx.currentTime;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, startTime);
        masterGain.gain.linearRampToValueAtTime(0.45, startTime + attackSec);
        masterGain.gain.setValueAtTime(0.45, startTime + durationSec - releaseSec);
        masterGain.gain.linearRampToValueAtTime(0, startTime + durationSec);
        masterGain.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(CONFIRM_FREQ_1_HZ, startTime);
        gain1.gain.setValueAtTime(1.0, startTime);
        osc1.connect(gain1);
        gain1.connect(masterGain);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(CONFIRM_FREQ_2_HZ, startTime);
        gain2.gain.setValueAtTime(0.66, startTime);
        osc2.connect(gain2);
        gain2.connect(masterGain);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + durationSec);
        osc2.stop(startTime + durationSec);

        setTimeout(() => {
          resolve();
        }, CONFIRM_DURATION_MS);
      } catch (err) {
        console.warn('Erro ao reproduzir som sintetizado:', err);
        resolve();
      }
    });
  }

  /**
   * Música de Espera Chiptune (8-bit loop)
   */
  public startWaitingMusic(): void {
    if (this.isMuted || this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.musicStep = 0;

    const eighthNoteSec = 60 / MUSIC_BPM / 2; // ~0.2727 segundos

    const tick = () => {
      if (!this.isMusicPlaying || this.isMuted) return;

      try {
        const ctx = this.initContext();
        const now = ctx.currentTime;
        const noteDuration = eighthNoteSec * 0.85;

        // 1. Toca a melodia (colcheia)
        const melodyNote = MELODY_SEQUENCE[this.musicStep % MELODY_SEQUENCE.length];
        const melodyFreq = NOTE_FREQS[melodyNote];

        const melOsc = ctx.createOscillator();
        const melGain = ctx.createGain();
        melOsc.type = MELODY_WAVE;
        melOsc.frequency.setValueAtTime(melodyFreq, now);

        melGain.gain.setValueAtTime(0, now);
        melGain.gain.linearRampToValueAtTime(MUSIC_VOLUME, now + 0.01);
        melGain.gain.exponentialRampToValueAtTime(0.001, now + noteDuration);

        melOsc.connect(melGain);
        melGain.connect(ctx.destination);
        melOsc.start(now);
        melOsc.stop(now + noteDuration);

        // 2. Toca o baixo (uma nota a cada início de compasso = a cada 8 colcheias)
        if (this.musicStep % 8 === 0) {
          const measureIndex = Math.floor(this.musicStep / 8) % BASS_SEQUENCE.length;
          const bassNote = BASS_SEQUENCE[measureIndex];
          const bassFreq = NOTE_FREQS[bassNote];

          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = BASS_WAVE;
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          const bassDuration = eighthNoteSec * 7;
          bassGain.gain.setValueAtTime(0, now);
          bassGain.gain.linearRampToValueAtTime(MUSIC_VOLUME * 1.3, now + 0.02);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + bassDuration);

          bassOsc.connect(bassGain);
          bassGain.connect(ctx.destination);
          bassOsc.start(now);
          bassOsc.stop(now + bassDuration);
        }

        this.musicStep = (this.musicStep + 1) % (MELODY_SEQUENCE.length * 2);
      } catch (e) {
        console.warn('Erro ao processar trilha:', e);
      }
    };

    tick();
    this.musicInterval = window.setInterval(tick, eighthNoteSec * 1000);
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  /**
   * Rufar de caixa (~2 segundos) para a apuração dos votos
   */
  public playDrumRoll(): Promise<void> {
    return new Promise((resolve) => {
      this.stopMusic();
      try {
        const ctx = this.initContext();
        const durationSec = 2.0;
        const totalHits = 32;
        const startTime = ctx.currentTime;

        // Cria buffer de ruído branco para as batidas de tarol
        const bufferSize = ctx.sampleRate * 0.08;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        // Simula aceleração e crescendo das baquetas
        for (let i = 0; i < totalHits; i++) {
          const hitTime = startTime + (i / totalHits) * (durationSec - 0.2);
          const hitVolume = 0.05 + Math.pow(i / totalHits, 1.8) * 0.4;

          const source = ctx.createBufferSource();
          source.buffer = noiseBuffer;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1000 + (i / totalHits) * 800, hitTime);
          filter.Q.setValueAtTime(2.5, hitTime);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(hitVolume, hitTime);
          gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.06);

          source.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          source.start(hitTime);
          source.stop(hitTime + 0.07);
        }

        // Batida final marcante (prato + caixa)
        const finalHitTime = startTime + durationSec;
        const finalSource = ctx.createBufferSource();
        finalSource.buffer = noiseBuffer;

        const finalFilter = ctx.createBiquadFilter();
        finalFilter.type = 'highpass';
        finalFilter.frequency.setValueAtTime(2500, finalHitTime);

        const finalGain = ctx.createGain();
        finalGain.gain.setValueAtTime(0.7, finalHitTime);
        finalGain.gain.exponentialRampToValueAtTime(0.001, finalHitTime + 0.6);

        finalSource.connect(finalFilter);
        finalFilter.connect(finalGain);
        finalGain.connect(ctx.destination);

        finalSource.start(finalHitTime);
        finalSource.stop(finalHitTime + 0.7);

        setTimeout(() => {
          resolve();
        }, (durationSec + 0.6) * 1000);
      } catch (err) {
        console.warn('Erro ao tocar rufar:', err);
        resolve();
      }
    });
  }
}

export const audioSystem = new SoundController();
