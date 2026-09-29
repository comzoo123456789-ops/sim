// Web Audio API procedural sound engine for Office Escape Survivor
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

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
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Ignore audio glitches
    }
  }

  // 스테이플러 발사음 (경쾌한 찰칵 소리)
  playStapler() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  // 기계식 키보드 타건음 (청축 딸깍)
  playKeyboard() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      const freq = 600 + Math.random() * 400;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // 핫식스 캔 투척 (치이익 탄산 액체 소리)
  playDrink() {
    this.playTone(320, 'sine', 0.15, 0.18, 0.01);
  }

  // 결재 반려 도장 (쿵! 묵직한 타격음)
  playStamp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // 법인카드 쉴드 회전음 (가벼운 윙 소리)
  playCard() {
    this.playTone(550, 'triangle', 0.08, 0.08, 0.01);
  }

  // 파쇄기 톱니 소리
  playShredder() {
    this.playTone(850, 'sawtooth', 0.09, 0.1, 0.01);
  }

  // 적 피격/처치음 (퐁퐁 팝핑 사운드)
  playHit() {
    this.playTone(200 + Math.random() * 150, 'sine', 0.06, 0.12, 0.01);
  }

  // 커피콩 / 영수증 XP 획득음 (영롱한 팅 소리)
  playXP() {
    const freqs = [880, 988, 1046, 1175, 1318];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    this.playTone(f, 'sine', 0.07, 0.08, 0.005);
  }

  // 레벨업 팡파레
  playLevelUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.2, 0.01);
      }, idx * 70);
    });
  }

  // 초월 진화 무기 각성 징글
  playEvolution() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [440, 554, 659, 880, 1108, 1318];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.25, 0.25, 0.01);
      }, idx * 60);
    });
  }

  // 보스 출현 사이렌
  playBossAlert() {
    this.playTone(220, 'sawtooth', 0.4, 0.3, 0.01);
    setTimeout(() => this.playTone(220, 'sawtooth', 0.4, 0.3, 0.01), 300);
  }

  // 탈출 승리 음악
  playVictory() {
    const notes = [523, 659, 783, 1046, 1318, 1567];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.35, 0.25, 0.01);
      }, idx * 100);
    });
  }

  // 게임 오버
  playGameOver() {
    const notes = [440, 392, 349, 293];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.35, 0.25, 0.01);
      }, idx * 120);
    });
  }
}

window.soundEngine = new SoundEngine();
