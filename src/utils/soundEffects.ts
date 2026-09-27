/**
 * Web Audio API synthesizer for Egyptian Kotshina & Ahwa sound effects.
 * No external audio files needed - immediate, zero latency, reliable.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private isAmbientPlaying = false;
  private volume = 0.8;
  private enabled = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Realistic card flick/slide on felt table
  public playCardSlide() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Filtered white noise for card sliding paper texture
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
    } catch {
      // Audio fallback
    }
  }

  // Soft card deal pop
  public playCardDeal() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio fallback
    }
  }

  // Eat (الأكل) swoosh and capture chime
  public playEat() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Two ascending soft notes
      const notes = [440, 660];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(this.volume * 0.4, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.18);
      });
    } catch {
      // Audio fallback
    }
  }

  // Basra Fanfare! (Tada chord + joyous chime)
  public playBasra() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Majestic oriental-friendly major triad chime
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      chord.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);

        gain.gain.setValueAtTime(0, now + i * 0.07);
        gain.gain.linearRampToValueAtTime(this.volume * 0.5, now + i * 0.07 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.07);
        osc.stop(now + 1.2);
      });
    } catch {
      // Audio fallback
    }
  }

  // Jack / Kommy Sweep (قش الطاولة)
  public playSweep() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio fallback
    }
  }

  // Gold coins clinking sound
  public playCoin() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [1800, 2600];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(this.volume * 0.45, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
      });
    } catch {
      // Audio fallback
    }
  }

  // Button click / UI tap
  public playClick() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio fallback
    }
  }

  // --- EGYPTIAN AHWA (قهوة شعبية) AMBIENCE GENERATOR ---

  private ambientIntervalId: number | null = null;
  private ambientNoiseNode: AudioNode | null = null;

  // 1. Wooden chair scraping on tile floor (صوت سحب الكراسي الخشب)
  public playChairScrape() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const duration = 0.35 + Math.random() * 0.2; // 0.35s - 0.55s

      // Friction noise buffer
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Grainy texture simulating wood-on-tile friction
        const envelope = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * envelope * (Math.random() > 0.4 ? 1 : 0.2);
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Bandpass filter for low-mid wood resonance
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(220 + Math.random() * 120, now);
      filter.Q.setValueAtTime(4.5, now);

      // Low rumble osc for chair legs weight
      const rumbleOsc = this.ctx.createOscillator();
      rumbleOsc.type = 'triangle';
      rumbleOsc.frequency.setValueAtTime(85 + Math.random() * 30, now);
      rumbleOsc.frequency.linearRampToValueAtTime(70, now + duration);

      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(this.volume * 0.12, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const mainGain = this.ctx.createGain();
      mainGain.gain.setValueAtTime(this.volume * 0.22, now);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(this.ctx.destination);

      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(this.ctx.destination);

      noiseSource.start(now);
      rumbleOsc.start(now);
      noiseSource.stop(now + duration);
      rumbleOsc.stop(now + duration);
    } catch {
      // Audio fallback
    }
  }

  // 2. Coffee boiling / Kanoun bubbling (غلي القهوة وفوران الكنكة)
  public playCoffeeBoil() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const bubbleCount = 5 + Math.floor(Math.random() * 5); // 5-9 bubbles

      for (let i = 0; i < bubbleCount; i++) {
        const bubbleTime = now + (i * 0.08) + Math.random() * 0.04;
        const bubbleFreq = 380 + Math.random() * 260;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(bubbleFreq, bubbleTime);
        osc.frequency.exponentialRampToValueAtTime(bubbleFreq * 1.5, bubbleTime + 0.05);

        gain.gain.setValueAtTime(0.001, bubbleTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.14, bubbleTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, bubbleTime + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(bubbleTime);
        osc.stop(bubbleTime + 0.06);
      }

      // Soft hiss of steam / heat
      const hissDuration = 0.5;
      const hissBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * hissDuration), this.ctx.sampleRate);
      const hissData = hissBuffer.getChannelData(0);
      for (let j = 0; j < hissData.length; j++) {
        hissData[j] = (Math.random() * 2 - 1) * Math.exp(-j / (hissData.length * 0.5));
      }
      const hissSource = this.ctx.createBufferSource();
      hissSource.buffer = hissBuffer;
      const hissFilter = this.ctx.createBiquadFilter();
      hissFilter.type = 'highpass';
      hissFilter.frequency.setValueAtTime(3200, now);
      const hissGain = this.ctx.createGain();
      hissGain.gain.setValueAtTime(this.volume * 0.06, now);
      hissGain.gain.exponentialRampToValueAtTime(0.001, now + hissDuration);

      hissSource.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(this.ctx.destination);
      hissSource.start(now);
      hissSource.stop(now + hissDuration);
    } catch {
      // Audio fallback
    }
  }

  // 3. Tea glass and metal spoon clink (رنة كبايات واستكانات الشاي والمعلقة)
  public playTeaGlassClink() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // High harmonic frequencies typical of thin Egyptian tea glasses (كباية شاي خمسينة)
      const freqs = [2100 + Math.random() * 200, 3150 + Math.random() * 300, 4400];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);

        gain.gain.setValueAtTime(this.volume * (0.16 / (idx + 1)), now + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.02);
        osc.stop(now + idx * 0.02 + 0.35);
      });
    } catch {
      // Audio fallback
    }
  }

  // 4. Subtle background cafe murmur (همهمة القهوة وضجيج خفيف ناعم)
  public playCafeMurmur() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const duration = 1.2;
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * duration), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink/brown filtered murmur
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const pink = b0 + b1 + b2 + white * 0.5362;
        const env = Math.sin((i / data.length) * Math.PI);
        data[i] = pink * 0.1 * env;
      }

      const src = this.ctx.createBufferSource();
      src.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.1, now);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      src.start(now);
      src.stop(now + duration);
    } catch {
      // Audio fallback
    }
  }

  // Play a random ahwa atmosphere sound effect
  public playRandomAhwaAmbience() {
    if (!this.enabled || this.volume <= 0) return;
    const effects = [
      () => this.playChairScrape(),
      () => this.playCoffeeBoil(),
      () => this.playTeaGlassClink(),
      () => this.playCafeMurmur(),
    ];
    const pick = effects[Math.floor(Math.random() * effects.length)];
    pick();
  }

  // Start continuous coffee shop ambient loop with randomized events
  public startAhwaAtmosphere(isAmbientEnabled = true) {
    if (!isAmbientEnabled || !this.enabled) {
      this.stopAhwaAtmosphere();
      return;
    }

    if (this.ambientIntervalId !== null) {
      return; // Already running
    }

    this.isAmbientPlaying = true;

    // 1. Initial burst at match start: Chair slide + warm tea clink
    setTimeout(() => {
      this.playChairScrape();
    }, 400);

    setTimeout(() => {
      this.playTeaGlassClink();
    }, 1200);

    setTimeout(() => {
      this.playCoffeeBoil();
    }, 2800);

    // 2. Schedule recurring random ahwa sounds every 8 to 16 seconds
    const scheduleNext = () => {
      if (!this.isAmbientPlaying) return;
      const delayMs = 7000 + Math.random() * 8000; // 7s - 15s
      this.ambientIntervalId = window.setTimeout(() => {
        if (this.isAmbientPlaying) {
          this.playRandomAhwaAmbience();
          scheduleNext();
        }
      }, delayMs);
    };

    scheduleNext();
  }

  // Stop ambient atmosphere cleanly
  public stopAhwaAtmosphere() {
    this.isAmbientPlaying = false;
    if (this.ambientIntervalId !== null) {
      clearTimeout(this.ambientIntervalId);
      this.ambientIntervalId = null;
    }
  }

  // Convenience aliases
  public playCardFlip() {
    this.playCardSlide();
  }

  public playCardEat() {
    this.playEat();
  }

  public playWin() {
    this.playBasra();
  }
}

export const soundFx = new SoundManager();
