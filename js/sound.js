// Office Escape Survivor - Sound Engine
// 효과음: Kenney.nl (CC0) 샘플을 Web Audio로 재생 (샘플 로드 전에는 기존 합성음으로 대체)
// 배경음악: Kevin MacLeod (incompetech.com), CC BY 4.0 — HTMLAudio 스트리밍, 트랙 전환 시 페이드
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.lastPlayed = {};
    this.sfxVolume = 0.55;
    this.bgmVolume = 0.32;
    this.bgm = null;
    this.bgmKey = null;
    this.bgmTarget = null;
    this.loaded = false;

    let saved = null;
    try { saved = localStorage.getItem('office_survivor_muted'); } catch (e) {}
    this.isMuted = saved === '1';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.sfxVolume;
        this.master.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (this.ctx && !this.loaded) this.loadSamples();
    // 사용자 제스처 이후 대기 중이던 BGM 재생
    if (this.bgmTarget && !this.bgmKey) this.playBgm(this.bgmTarget);
  }

  loadSamples() {
    this.loaded = true;
    SoundEngine.SFX.forEach(key => {
      fetch(`assets/audio/sfx/${key}.mp3`)
        .then(r => r.arrayBuffer())
        .then(buf => new Promise((res, rej) => this.ctx.decodeAudioData(buf, res, rej)))
        .then(decoded => { this.buffers[key] = decoded; })
        .catch(() => {});
    });
  }

  setMuted(muted) {
    this.isMuted = muted;
    try { localStorage.setItem('office_survivor_muted', muted ? '1' : '0'); } catch (e) {}
    if (this.bgm) {
      if (muted) this.bgm.pause();
      else this.bgm.play().catch(() => {});
    }
  }

  // 샘플 재생. throttle(ms): 같은 소리 최소 간격 (대량 처치 시 소리 뭉개짐 방지)
  playSfx(key, { vol = 1, rate = 1, jitter = 0.06, throttle = 40 } = {}) {
    if (this.isMuted || !this.ctx) return false;
    const buf = this.buffers[key];
    if (!buf) return false;
    const now = performance.now();
    if (now - (this.lastPlayed[key] || 0) < throttle) return true;
    this.lastPlayed[key] = now;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate * (1 + (Math.random() - 0.5) * jitter * 2);
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g);
      g.connect(this.master);
      src.start();
    } catch (e) {}
    return true;
  }

  // 배경음악 (같은 트랙이면 유지, 다른 트랙이면 페이드 전환)
  playBgm(key) {
    this.bgmTarget = key;
    if (this.bgmKey === key && this.bgm) return;
    if (!this.ctx) return; // 첫 터치 전에는 대기
    const prev = this.bgm;
    if (prev) this.fade(prev, 0, 600, () => prev.pause());
    const a = new Audio(`assets/audio/bgm/${key}.mp3`);
    a.loop = true;
    a.volume = 0;
    a.preload = 'auto';
    this.bgm = a;
    this.bgmKey = key;
    if (!this.isMuted) {
      a.play().then(() => this.fade(a, this.bgmVolume, 900)).catch(() => { this.bgmKey = null; });
    }
  }

  stopBgm(ms = 500) {
    const prev = this.bgm;
    this.bgm = null;
    this.bgmKey = null;
    this.bgmTarget = null;
    if (prev) this.fade(prev, 0, ms, () => prev.pause());
  }

  duckBgm(on) {
    if (this.bgm) this.fade(this.bgm, on ? this.bgmVolume * 0.35 : this.bgmVolume, 250);
  }

  fade(audio, to, ms, done) {
    const from = audio.volume;
    const t0 = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      try { audio.volume = Math.max(0, Math.min(1, from + (to - from) * p)); } catch (e) {}
      if (p < 1) requestAnimationFrame(step);
      else if (done) done();
    };
    requestAnimationFrame(step);
  }

  // 합성음 (샘플이 없을 때 대체용)
  playTone(freq, type, duration, gainStart = 0.15, gainEnd = 0.001) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainStart, now);
      gain.gain.exponentialRampToValueAtTime(gainEnd, now + duration);
      osc.connect(gain);
      gain.connect(this.master || this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  // ── 게임 이벤트별 효과음 (기존 호출부 호환) ──
  playStapler() { this.playSfx('stapler', { vol: 0.5, throttle: 60 }) || this.playTone(1400, 'triangle', 0.06, 0.2, 0.01); }
  playKeyboard() { this.playSfx('keyboard', { vol: 0.55, throttle: 70 }) || this.playTone(700, 'square', 0.04, 0.12, 0.005); }
  playDrink() { this.playSfx('drink', { vol: 0.6, throttle: 120 }) || this.playTone(320, 'sine', 0.15, 0.18, 0.01); }
  playExplosion() { this.playSfx('explosion', { vol: 0.55, throttle: 90 }) || this.playTone(90, 'sawtooth', 0.25, 0.3, 0.01); }
  playStamp() { this.playSfx('stamp', { vol: 0.8, throttle: 80 }) || this.playTone(160, 'sawtooth', 0.25, 0.35, 0.01); }
  playCard() { this.playSfx('card', { vol: 0.35, throttle: 90 }) || this.playTone(550, 'triangle', 0.08, 0.08, 0.01); }
  playShredder() { this.playSfx('shredder', { vol: 0.45, throttle: 120 }) || this.playTone(850, 'sawtooth', 0.09, 0.1, 0.01); }
  playLaser() { this.playSfx('laser', { vol: 0.4, throttle: 80 }) || this.playTone(880, 'sawtooth', 0.12, 0.2, 0.02); }
  playHit() { this.playSfx('hit', { vol: 0.35, throttle: 45, jitter: 0.12 }) || this.playTone(250, 'sine', 0.06, 0.12, 0.01); }
  playHurt() { this.playSfx('hurt', { vol: 0.8, throttle: 150 }) || this.playTone(140, 'square', 0.12, 0.25, 0.01); }
  playXP() { this.playSfx('xp', { vol: 0.25, throttle: 55, jitter: 0.1 }) || this.playTone(988, 'sine', 0.07, 0.08, 0.005); }
  playCoin() { this.playSfx('coin', { vol: 0.5, throttle: 90 }) || this.playXP(); }
  playDash() { this.playSfx('dash', { vol: 0.5, throttle: 100 }) || this.playTone(680, 'triangle', 0.12, 0.25, 0.01); }
  playRescue() { this.playSfx('rescue', { vol: 0.8, throttle: 300 }) || this.playLevelUp(); }
  playLevelUp() { this.playSfx('levelup', { vol: 0.7, throttle: 200, jitter: 0 }) || this.playTone(784, 'triangle', 0.2, 0.2, 0.01); }
  playEvolution() { this.playSfx('evolve', { vol: 0.8, throttle: 300, jitter: 0 }) || this.playTone(1108, 'sawtooth', 0.25, 0.25, 0.01); }
  playBossAlert() { this.playSfx('boss', { vol: 0.9, throttle: 400, jitter: 0 }) || this.playTone(220, 'sawtooth', 0.4, 0.3, 0.01); }
  playBuy() { this.playSfx('buy', { vol: 0.7, throttle: 100 }) || this.playTone(880, 'triangle', 0.18, 0.25, 0.01); }
  playClick() { this.playSfx('click', { vol: 0.5, throttle: 60, jitter: 0 }) || this.playTone(600, 'sine', 0.05, 0.1, 0.01); }
  playError() { this.playSfx('error', { vol: 0.5, throttle: 150, jitter: 0 }) || this.playTone(180, 'square', 0.1, 0.15, 0.01); }
  playVictory() { this.playSfx('victory', { vol: 0.8, throttle: 500, jitter: 0 }) || this.playTone(1046, 'sine', 0.35, 0.25, 0.01); }
  playGameOver() { this.playSfx('gameover', { vol: 0.8, throttle: 500, jitter: 0 }) || this.playTone(293, 'sawtooth', 0.35, 0.25, 0.01); }
}

SoundEngine.SFX = ['stapler', 'keyboard', 'drink', 'stamp', 'card', 'shredder', 'laser', 'explosion', 'hit', 'hurt', 'xp', 'coin',
  'levelup', 'evolve', 'boss', 'buy', 'click', 'victory', 'gameover', 'dash', 'rescue', 'error'];

window.soundEngine = new SoundEngine();
