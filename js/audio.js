/**
 * RoboPrompt Audio Controller
 * Synthesizes SFX, ambient BGM, and robotic voice without external audio file dependencies.
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.ttsEnabled = true;
    this.voices = [];
    this.isSpeaking = false;
    this.initAudioContext();
    this.initSpeech();
  }

  initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.ctx = new AudioContext();
    }
  }

  ensureContext() {
    if (!this.ctx) this.initAudioContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initSpeech() {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        this.voices = window.speechSynthesis.getVoices();
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  speak(text, onEnd, onStart) {
    if (!this.ttsEnabled || !('speechSynthesis' in window) || this.isMuted) {
      this.isSpeaking = true;
      if (onStart) onStart();
      const fallbackDuration = Math.max(1500, text.length * 45);
      setTimeout(() => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      }, fallbackDuration);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Cari suara Bahasa Indonesia jika ada
      const idVoice = this.voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
      if (idVoice) utterance.voice = idVoice;
      
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      utterance.pitch = 1.35; // robotic friendly cute pitch
      utterance.volume = 0.95;

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  stopSpeech() {
    this.isSpeaking = false;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // --- Sound Effects Synthesizer ---
  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15, decay = true) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      if (decay) {
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  click() {
    this.playTone(800, 'sine', 0.05, 0.12);
  }

  whoosh() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  robotChirp() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f * 1.5, 'sine', 0.08, 0.08);
      }, idx * 60);
    });
  }

  successChime() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.35, 0.15);
      }, idx * 80);
    });
  }

  errorBuzz() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.setValueAtTime(130, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  coinDing() {
    this.playTone(987.77, 'sine', 0.12, 0.15);
    setTimeout(() => {
      this.playTone(1318.51, 'sine', 0.25, 0.15);
    }, 100);
  }

  // --- Ambient Sci-Fi Lo-Fi BGM Synthesizer ---
  startBGM() {
    if (this.bgmPlaying) return;
    this.ensureContext();
    this.bgmPlaying = true;

    // Chord sequence in Pentatonic/Lydian mood: Cmaj7 - Am9 - Fmaj7 - Gsus4
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 261.63, 329.63, 349.23], // Fmaj7
      [196.00, 261.63, 293.66, 392.00]  // Gsus4
    ];

    let chordIdx = 0;
    const playChordCycle = () => {
      if (!this.bgmPlaying || this.isMuted || !this.ctx) return;
      
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      // Play soft pad chords
      currentChord.forEach(freq => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, this.ctx.currentTime);

          gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.8);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start();
          osc.stop(this.ctx.currentTime + 4.0);
        } catch (e) {}
      });

      this.bgmTimer = setTimeout(playChordCycle, 4000);
    };

    playChordCycle();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleBGM() {
    if (this.bgmPlaying) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopSpeech();
      this.stopBGM();
    }
    return this.isMuted;
  }
}

window.audioMgr = new AudioManager();
