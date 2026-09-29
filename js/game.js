// Office Escape Survivor - Core Game Loop, Effect Engine, Map Renderer & UI Controller

class EffectEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.floatingTexts = [];
    this.sparks = [];
    this.shockwaves = [];
    this.flashes = [];     // 스프라이트 섬광 (히트/치명타/마법진)
    this.anims = [];       // 프레임 애니메이션 (폭발/연기)
    this.emotes = [];      // 말풍선 이모트
    this.decals = [];      // 바닥 얼룩 (스플랫/그을음)
    this.shakeMag = 0;
    this.shakeDuration = 0;
    this.eventBanner = null;
  }

  screenShake(mag = 6, duration = 0.2) {
    this.shakeMag = mag;
    this.shakeDuration = duration;
  }

  spawnFloatingText(x, y, text, color = '#ffffff') {
    this.floatingTexts.push({
      x, y, text, color,
      life: 0.9,
      vy: -1.8
    });
  }

  spawnHitSpark(x, y, color = '#ffffff') {
    for (let i = 0; i < 5; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4;
      this.sparks.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color,
        life: 0.25,
        radius: 2 + Math.random() * 2
      });
    }
    this.spawnFlash(x, y, 'fx_spark', color, 22, 0.14);
  }

  // 스프라이트 섬광: 커졌다가 사라짐 (가산 합성)
  spawnFlash(x, y, key, color, size, life = 0.25, opts = {}) {
    if (this.flashes.length > EffectEngine.MAX_FLASHES) this.flashes.shift();
    this.flashes.push({
      x, y, key, color, size, life, maxLife: life,
      rot: opts.rot !== undefined ? opts.rot : Math.random() * Math.PI * 2,
      spin: opts.spin || 0,
      grow: opts.grow !== undefined ? opts.grow : 0.6,
      follow: opts.follow || null
    });
  }

  // 치명타 버스트
  spawnCritBurst(x, y) {
    this.spawnFlash(x, y, 'fx_burst', '#ffd700', 54, 0.22, { grow: 0.5 });
  }

  spawnShockwave(x, y, maxRadius = 80, color = '#00f0ff') {
    this.shockwaves.push({
      x, y,
      radius: 5,
      maxRadius,
      color,
      life: 0.35,
      maxLife: 0.35
    });
  }

  // 폭발 (Kenney Smoke Particles 9프레임)
  spawnExplosion(x, y, size = 120, duration = 0.5) {
    if (this.anims.length > EffectEngine.MAX_ANIMS) this.anims.shift();
    this.anims.push({ x, y, size, prefix: 'explosion', frames: 9, t: 0, duration, rot: Math.random() * Math.PI * 2, color: null, alpha: 0.85 });
  }

  // 연기 퍼프 (대시 잔상, 기물 파괴 등)
  spawnPuff(x, y, size = 50, color = null, duration = 0.45, alpha = 0.7) {
    if (this.anims.length > EffectEngine.MAX_ANIMS) this.anims.shift();
    this.anims.push({ x, y, size, prefix: 'puff', frames: 9, t: 0, duration, rot: Math.random() * Math.PI * 2, color, alpha });
  }

  // 말풍선 이모트 (보스 분노, 레벨업, 부활 등)
  spawnEmote(x, y, key, follow = null) {
    this.emotes = this.emotes.filter(e => !(follow && e.follow === follow)); // 대상당 1개
    this.emotes.push({ x, y, key: 'emote_' + key, life: 1.2, maxLife: 1.2, follow });
  }

  // 바닥 얼룩 (슬라임 사체, 커피 자국, 도장 그을음)
  spawnDecal(x, y, size, color, key = null, life = 6) {
    if (this.decals.length > EffectEngine.MAX_DECALS) this.decals.shift();
    this.decals.push({
      x, y, size, color, life, maxLife: life,
      key: key || ('splat' + Math.floor(Math.random() * 8)),
      rot: Math.random() * Math.PI * 2
    });
  }

  spawnEventBanner(title, subtitle, color = '#ef4444') {
    this.eventBanner = {
      title,
      subtitle,
      color,
      timer: 3.5,
      maxTimer: 3.5
    };
  }

  update(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) this.shakeMag = 0;
    }

    if (this.eventBanner && this.eventBanner.timer > 0) {
      this.eventBanner.timer -= dt;
      if (this.eventBanner.timer <= 0) this.eventBanner = null;
    }

    // 텍스트 업데이트
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.life -= dt;
      if (t.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // 스파크 업데이트
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= dt;
      if (s.life <= 0) this.sparks.splice(i, 1);
    }

    // 충격파 업데이트
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const w = this.shockwaves[i];
      w.life -= dt;
      w.radius += (w.maxRadius - w.radius) * 8 * dt;
      if (w.life <= 0) this.shockwaves.splice(i, 1);
    }

    // 스프라이트 섬광 / 애니메이션 / 이모트 / 바닥 얼룩
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.life -= dt;
      f.rot += f.spin * dt;
      if (f.life <= 0) this.flashes.splice(i, 1);
    }
    for (let i = this.anims.length - 1; i >= 0; i--) {
      const a = this.anims[i];
      a.t += dt;
      if (a.t >= a.duration) this.anims.splice(i, 1);
    }
    for (let i = this.emotes.length - 1; i >= 0; i--) {
      const e = this.emotes[i];
      e.life -= dt;
      if (e.life <= 0 || (e.follow && e.follow.isAlive === false)) this.emotes.splice(i, 1);
    }
    for (let i = this.decals.length - 1; i >= 0; i--) {
      const d = this.decals[i];
      d.life -= dt;
      if (d.life <= 0) this.decals.splice(i, 1);
    }
  }

  // 바닥 레이어 (맵 바로 위, 기물/캐릭터 아래)
  renderDecals(ctx, camera) {
    const a = window.assets;
    if (!a) return;
    this.decals.forEach(d => {
      const alpha = Math.min(1, d.life / (d.maxLife * 0.35)) * 0.55;
      a.draw(ctx, d.key, d.x - camera.x, d.y - camera.y, d.size, d.size, { color: d.color, alpha, rot: d.rot });
    });
  }

  render(ctx, camera, viewW) {
    const a = window.assets;

    // 1. 충격파 렌더링 (링 스프라이트, 미로드 시 벡터 원)
    this.shockwaves.forEach(w => {
      const sx = w.x - camera.x;
      const sy = w.y - camera.y;
      const alpha = Math.max(0, w.life / w.maxLife);
      const d = w.radius * 2.3;
      if (a && a.draw(ctx, 'fx_ring', sx, sy, d, d, { color: w.color, alpha, blend: 'lighter' })) return;

      ctx.save();
      ctx.strokeStyle = w.color;
      ctx.lineWidth = 3 * alpha;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, w.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 2. 폭발 / 연기 프레임 애니메이션
    if (a) {
      this.anims.forEach(an => {
        const p = an.t / an.duration;
        const frame = Math.min(an.frames - 1, Math.floor(p * an.frames));
        const alpha = an.alpha * (p > 0.7 ? (1 - p) / 0.3 : 1);
        a.draw(ctx, an.prefix + frame, an.x - camera.x, an.y - camera.y, an.size, an.size, { color: an.color, alpha, rot: an.rot });
      });
    }

    // 3. 스파크 렌더링
    this.sparks.forEach(s => {
      const sx = s.x - camera.x;
      const sy = s.y - camera.y;

      ctx.save();
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. 스프라이트 섬광 (가산 합성으로 네온 발광)
    if (a) {
      this.flashes.forEach(f => {
        const p = 1 - f.life / f.maxLife;
        const size = f.size * (1 - f.grow + f.grow * Math.min(1, p * 2.5));
        const fx = f.follow ? f.follow.x : f.x;
        const fy = f.follow ? f.follow.y : f.y;
        a.draw(ctx, f.key, fx - camera.x, fy - camera.y, size, size, { color: f.color, alpha: f.life / f.maxLife, rot: f.rot, blend: 'lighter' });
      });
    }

    // 5. 플로팅 텍스트 렌더링
    this.floatingTexts.forEach(t => {
      const sx = t.x - camera.x;
      const sy = t.y - camera.y;

      ctx.save();
      ctx.fillStyle = t.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 13px "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.text, sx, sy);
      ctx.restore();
    });

    // 6. 말풍선 이모트 (팝업 스케일 + 부유)
    if (a) {
      this.emotes.forEach(e => {
        const p = 1 - e.life / e.maxLife;
        const pop = p < 0.15 ? 0.6 + (p / 0.15) * 0.5 : (p < 0.25 ? 1.1 - ((p - 0.15) / 0.1) * 0.1 : 1);
        const alpha = e.life < 0.25 ? e.life / 0.25 : 1;
        const ex = e.follow ? e.follow.x : e.x;
        const ey = (e.follow ? e.follow.y - (e.follow.radius || 20) - 34 : e.y) - p * 10;
        a.draw(ctx, e.key, ex - camera.x, ey - camera.y, 34 * pop, 40 * pop, { alpha });
      });
    }

    // 7. 돌발 이벤트 배너 렌더링
    if (this.eventBanner && this.eventBanner.timer > 0) {
      const b = this.eventBanner;
      let alpha = 1.0;
      if (b.timer > b.maxTimer - 0.5) {
        alpha = (b.maxTimer - b.timer) / 0.5;
      } else if (b.timer < 0.5) {
        alpha = b.timer / 0.5;
      }

      const cx = (viewW || ctx.canvas.width) / 2;
      const cy = 135;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.roundRect(cx - 180, cy - 24, 360, 48, 10);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 14px "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.title, cx, cy - 4);

      ctx.fillStyle = b.color;
      ctx.font = 'bold 11px "Pretendard", sans-serif';
      ctx.fillText(b.subtitle, cx, cy + 13);

      ctx.restore();
    }
  }
}

// 이펙트 개수 상한 (대량 처치 시 프레임 드랍 방지)
EffectEngine.MAX_FLASHES = 160;
EffectEngine.MAX_ANIMS = 60;
EffectEngine.MAX_DECALS = 80;

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    // 논리 해상도 (CSS px). 실제 캔버스 픽셀은 DPR 배율 적용
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;

    // HUD DOM 캐시 (매 프레임 불필요한 DOM 재생성 방지)
    this.hudEls = {};
    this.hudCache = {};

    this.state = 'char_select'; // 'char_select', 'playing', 'level_up', 'game_over', 'victory', 'stage_clear'
    this.selectedCharId = 'intern';
    this.selectedMode = 'stage'; // 'stage' or 'survival'
    this.selectedStageId = '1-1';
    this.currentStageId = '1-1';
    this.currentStage = null;

    this.player = null;
    this.weaponMgr = new WeaponManager();
    this.monsterMgr = new MonsterManager();
    this.propMgr = new OfficePropManager();
    this.dropMgr = new DropManager();
    this.effectEngine = new EffectEngine();
    this.officeMap = new OfficeMap();

    this.camera = { x: 0, y: 0 };
    this.input = {
      w: false, a: false, s: false, d: false,
      arrowUp: false, arrowDown: false, arrowLeft: false, arrowRight: false,
      joyX: 0, joyY: 0
    };

    this.levelUpQueue = 0;
    this.gameTime = 60; // 초
    this.lastTime = performance.now();

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupInputListeners();
    this.setupTouchControls();
    this.setupUIBindings();
    this.setupLobbyTabs();

    this.renderStageSelectGrid();
    this.renderCharSelectGrid();
    this.renderShop();
    this.renderAchievements();
    this.renderBestiary();
    this.updateLobbyGold();

    // 오디오 잠금 해제 리스너
    const unlockAudio = () => {
      if (window.soundEngine) window.soundEngine.init();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    requestAnimationFrame(t => this.gameLoop(t));
  }

  resizeCanvas() {
    // 레티나/고해상도 모바일 선명도 확보 (성능을 위해 최대 2배)
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;
    this.canvas.width = Math.round(this.viewW * dpr);
    this.canvas.height = Math.round(this.viewH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.officeMap) this.officeMap.setScale(dpr);
  }

  setupInputListeners() {
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (k === 'w') this.input.w = true;
      if (k === 's') this.input.s = true;
      if (k === 'a') this.input.a = true;
      if (k === 'd') this.input.d = true;
      if (e.key === 'ArrowUp') this.input.arrowUp = true;
      if (e.key === 'ArrowDown') this.input.arrowDown = true;
      if (e.key === 'ArrowLeft') this.input.arrowLeft = true;
      if (e.key === 'ArrowRight') this.input.arrowRight = true;

      // 스페이스바 / 쉬프트 키로 칼퇴 대시 발동!
      if ((e.code === 'Space' || e.key === 'Shift' || e.key === ' ') && this.state === 'playing' && this.player) {
        e.preventDefault();
        this.player.dash();
      }
    });

    window.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      if (k === 'w') this.input.w = false;
      if (k === 's') this.input.s = false;
      if (k === 'a') this.input.a = false;
      if (k === 'd') this.input.d = false;
      if (e.key === 'ArrowUp') this.input.arrowUp = false;
      if (e.key === 'ArrowDown') this.input.arrowDown = false;
      if (e.key === 'ArrowLeft') this.input.arrowLeft = false;
      if (e.key === 'ArrowRight') this.input.arrowRight = false;
    });
  }

  // 모바일 다이내믹 가상 조이스틱 및 대시 터치 컨트롤
  setupTouchControls() {
    const joyBase = document.getElementById('joystickBase');
    const joyStick = document.getElementById('joystickStick');
    const dashBtn = document.getElementById('btnMobileDash');

    if (dashBtn) {
      const triggerDash = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (this.state === 'playing' && this.player) {
          this.player.dash();
        }
      };
      dashBtn.addEventListener('touchstart', triggerDash, { passive: false });
      dashBtn.addEventListener('click', triggerDash);
    }

    let touchId = null;
    let startX = 0;
    let startY = 0;
    const maxDist = 45;

    window.addEventListener('touchstart', e => {
      if (this.state !== 'playing') return;
      if (touchId === null && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        if (e.target.closest('.modal-window') || e.target.closest('#btnMobileDash') || e.target.closest('.hud-top-bar')) return;

        touchId = touch.identifier;
        startX = touch.clientX;
        startY = touch.clientY;

        if (joyBase) {
          joyBase.style.left = `${startX}px`;
          joyBase.style.top = `${startY}px`;
          joyBase.classList.add('active');
        }

        if (joyStick) {
          joyStick.style.transform = 'translate(-50%, -50%)';
        }
        this.input.joyX = 0;
        this.input.joyY = 0;
      }
    }, { passive: false });

    window.addEventListener('touchmove', e => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          e.preventDefault();
          const dx = touch.clientX - startX;
          const dy = touch.clientY - startY;
          const dist = Math.hypot(dx, dy);

          const clampedDist = Math.min(dist, maxDist);
          const ang = Math.atan2(dy, dx);

          const stickX = Math.cos(ang) * clampedDist;
          const stickY = Math.sin(ang) * clampedDist;

          if (joyStick) {
            joyStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
          }

          this.input.joyX = (dx / maxDist);
          this.input.joyY = (dy / maxDist);
          this.input.joyX = Math.max(-1, Math.min(1, this.input.joyX));
          this.input.joyY = Math.max(-1, Math.min(1, this.input.joyY));
          break;
        }
      }
    }, { passive: false });

    const endTouch = e => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          if (joyBase) joyBase.classList.remove('active');
          this.input.joyX = 0;
          this.input.joyY = 0;
          break;
        }
      }
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);
  }

  setupUIBindings() {
    // 1. 모드 토글 (스테이지 돌파 vs 10분 무한 서바이벌)
    const btnModeStage = document.getElementById('btnModeStage');
    const btnModeSurvival = document.getElementById('btnModeSurvival');

    if (btnModeStage && btnModeSurvival) {
      btnModeStage.onclick = () => {
        this.selectedMode = 'stage';
        btnModeStage.classList.add('active');
        btnModeSurvival.classList.remove('active');
        const grid = document.getElementById('stageGridContainer');
        if (grid) grid.style.display = 'flex';
        const survivalCard = document.getElementById('survivalInfoCard');
        if (survivalCard) survivalCard.hidden = true;
        this.updateStageSelectedInfo();
        if (window.soundEngine) window.soundEngine.playClick();
      };

      btnModeSurvival.onclick = () => {
        this.selectedMode = 'survival';
        btnModeSurvival.classList.add('active');
        btnModeStage.classList.remove('active');
        const grid = document.getElementById('stageGridContainer');
        if (grid) grid.style.display = 'none';
        const survivalCard = document.getElementById('survivalInfoCard');
        if (survivalCard) survivalCard.hidden = false;
        this.updateStageSelectedInfo();
        if (window.soundEngine) window.soundEngine.playClick();
      };
    }

    // 1-1. 챕터 이동 버튼
    const btnChapterPrev = document.getElementById('btnChapterPrev');
    const btnChapterNext = document.getElementById('btnChapterNext');
    if (btnChapterPrev) btnChapterPrev.onclick = () => this.changeChapter(-1);
    if (btnChapterNext) btnChapterNext.onclick = () => this.changeChapter(1);

    // 로비 첫 진입: 가장 최근에 열린 스테이지를 선택
    if (window.saveMgr) {
      const unlocked = window.saveMgr.data.unlockedStages || ['1-1'];
      const latest = unlocked.slice().sort((a, b) => {
        const [ac, as] = a.split('-').map(Number);
        const [bc, bs] = b.split('-').map(Number);
        return ac * 100 + as - (bc * 100 + bs);
      }).pop();
      if (latest && this.getStageById(latest)) {
        this.selectedStageId = latest;
        this.selectedChapter = parseInt(latest.split('-')[0], 10);
      }
    }

    // 2. 스테이지 시작 버튼
    const btnStartSelectedStage = document.getElementById('btnStartSelectedStage');
    if (btnStartSelectedStage) {
      btnStartSelectedStage.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.startGame(this.selectedCharId, this.selectedStageId, this.selectedMode);
      };
    }

    // 3. 사원 출근 시작 버튼
    const btnStartGame = document.getElementById('btnStartGame');
    if (btnStartGame) {
      btnStartGame.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.startGame(this.selectedCharId, this.selectedStageId, this.selectedMode);
      };
    }

    // 4. 재도전 버튼
    const btnRestartGame = document.getElementById('btnRestartGame');
    if (btnRestartGame) {
      btnRestartGame.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.startGame(this.selectedCharId, this.currentStageId, this.selectedMode);
      };
    }

    // 5. 로비로 돌아가기 버튼
    const btnReturnLobby = document.getElementById('btnReturnLobby');
    if (btnReturnLobby) {
      btnReturnLobby.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        document.getElementById('endGameModal').classList.remove('active');
        document.getElementById('stageClearModal').classList.remove('active');
        document.getElementById('charSelectModal').classList.add('active');
        this.state = 'char_select';
        this.updateLobbyGold();
        this.renderStageSelectGrid();
        this.renderShop();
        this.renderAchievements();
        this.renderBestiary();
      };
    }

    // 6. 다음 스테이지 출근 버튼
    const btnNextStage = document.getElementById('btnNextStage');
    if (btnNextStage) {
      btnNextStage.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        document.getElementById('stageClearModal').classList.remove('active');
        // 마지막 스테이지(10-10) 클리어 시에는 로비로 귀환
        const nextStageId = SaveManager.nextStageId(this.currentStageId);
        if (!nextStageId) {
          document.getElementById('charSelectModal').classList.add('active');
          this.state = 'char_select';
          this.updateLobbyGold();
          this.renderStageSelectGrid();
          return;
        }
        this.selectedStageId = nextStageId;
        this.selectedChapter = parseInt(nextStageId.split('-')[0], 10);
        this.startGame(this.selectedCharId, nextStageId, 'stage');
      };
    }

    // 7. 클리어 모달에서 스테이지 목록으로 귀환
    const btnClearToLobby = document.getElementById('btnClearToLobby');
    if (btnClearToLobby) {
      btnClearToLobby.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        document.getElementById('stageClearModal').classList.remove('active');
        document.getElementById('charSelectModal').classList.add('active');
        this.state = 'char_select';
        this.updateLobbyGold();
        this.renderStageSelectGrid();
      };
    }

    // 8. 일시정지 버튼
    const pauseModal = document.getElementById('pauseModal');
    const pauseBtn = document.getElementById('btnPauseGame');
    if (pauseBtn) {
      pauseBtn.onclick = () => {
        if (this.state === 'playing') {
          this.state = 'paused';
          this.renderPauseStats();
          pauseModal.classList.add('active');
          if (window.soundEngine) window.soundEngine.playClick();
        }
      };
    }

    // 9. 일시정지 해제 (재개)
    const resumeBtn = document.getElementById('btnResumeGame');
    if (resumeBtn) {
      resumeBtn.onclick = () => {
        if (this.state === 'paused') {
          pauseModal.classList.remove('active');
          this.state = 'playing';
          if (window.soundEngine) window.soundEngine.playClick();
        }
      };
    }

    // 10. 사운드 토글 버튼
    const soundBtn = document.getElementById('btnToggleSound');
    if (soundBtn) {
      soundBtn.onclick = () => {
        if (window.soundEngine) {
          window.soundEngine.isMuted = !window.soundEngine.isMuted;
          soundBtn.innerText = window.soundEngine.isMuted ? '🔇 사운드 OFF' : '🔊 사운드 ON';
          if (!window.soundEngine.isMuted) window.soundEngine.playClick();
        }
      };
    }

    // 11. 야근 포기 (항복 및 로비 귀환)
    const surrenderBtn = document.getElementById('btnSurrenderGame');
    if (surrenderBtn) {
      surrenderBtn.onclick = () => {
        if (this.state === 'paused') {
          pauseModal.classList.remove('active');
          this.handleGameOver(false);
        }
      };
    }
  }

  renderPauseStats() {
    const grid = document.getElementById('pauseStatsGrid');
    if (!grid || !this.player) return;

    const s = this.player.stats;
    const statsList = [
      { label: '현재 체력', val: `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`, icon: window.getGameIcon('heart_hp') },
      { label: '공격력 배율', val: `x${s.atkMul.toFixed(2)}`, icon: window.getGameIcon('up_atk') },
      { label: '이동 속도', val: `x${s.speedMul.toFixed(2)}`, icon: window.getGameIcon('up_speed') },
      { label: '쿨타임 감소', val: `-${Math.round(s.cdReduc * 100)}%`, icon: window.getGameIcon('up_cd') },
      { label: '공격 범위', val: `+${Math.round((s.areaMul - 1) * 100)}%`, icon: window.getGameIcon('glasses') },
      { label: '자석 흡입', val: `${s.magnetRange}px`, icon: window.getGameIcon('up_magnet') },
      { label: '받는 피해 감소', val: `${Math.round(s.dmgReduc * 100)}%`, icon: window.getGameIcon('headphone') },
      { label: '초당 HP 재생', val: `+${s.hpRegen.toFixed(1)}/초`, icon: window.getGameIcon('leave') },
      { label: '치명타율', val: `${Math.round(s.critRate * 100)}%`, icon: window.getGameIcon('bonus') },
      { label: '회피율', val: `${Math.round((s.dodgeRate || 0) * 100)}%`, icon: window.getGameIcon('airpod') },
      { label: '부활 기회', val: `${this.player.reviveCount}회`, icon: window.getGameIcon('leave') },
      { label: '골드 획득량', val: `x${(s.goldMul || 1.0).toFixed(2)}`, icon: window.getGameIcon('gold_coin') }
    ];

    grid.innerHTML = statsList.map(item => `
      <div class="pause-stat-card">
        <span class="pause-stat-icon">${item.icon}</span>
        <div class="pause-stat-col">
          <span class="pause-stat-label">${item.label}</span>
          <b class="pause-stat-val">${item.val}</b>
        </div>
      </div>
    `).join('');
  }

  setupLobbyTabs() {
    const panels = {
      stage: 'tabPanelStage',
      char: 'tabPanelChar',
      shop: 'tabPanelShop',
      ach: 'tabPanelAch',
      bestiary: 'tabPanelBestiary'
    };
    const renderers = {
      stage: () => this.renderStageSelectGrid(),
      char: () => this.renderCharSelectGrid(),
      shop: () => this.renderShop(),
      ach: () => this.renderAchievements(),
      bestiary: () => this.renderBestiary()
    };

    const tabs = document.querySelectorAll('.menu-tab-btn');
    tabs.forEach(btn => {
      btn.onclick = () => {
        const targetTab = btn.getAttribute('data-tab');
        tabs.forEach(b => b.classList.toggle('active', b === btn));
        Object.entries(panels).forEach(([key, id]) => {
          const panel = document.getElementById(id);
          if (panel) panel.classList.toggle('active', key === targetTab);
        });

        // 출근 바는 스테이지 / 사원 탭에서만 노출
        const actionBar = document.getElementById('lobbyActionBar');
        if (actionBar) actionBar.hidden = !(targetTab === 'stage' || targetTab === 'char');

        const body = document.querySelector('.lobby-body');
        if (body) body.scrollTop = 0;

        if (renderers[targetTab]) renderers[targetTab]();
        this.updateStageSelectedInfo();
        if (window.soundEngine) window.soundEngine.playClick();
      };
    });
  }

  updateLobbyGold() {
    const gold = window.saveMgr ? window.saveMgr.getGold() : 0;
    const el = document.getElementById('lobbyGoldVal');
    if (el) el.innerText = gold.toLocaleString();
  }

  getChapter(n) {
    const chapters = window.GAME_DATA && window.GAME_DATA.CHAPTERS;
    return chapters ? chapters['ch' + n] || null : null;
  }

  getChapter1() {
    return this.getChapter(this.selectedChapter || 1);
  }

  // "3-7" 같은 스테이지 ID로 스테이지 정의 조회
  getStageById(id) {
    const ch = this.getChapter(parseInt(String(id).split('-')[0], 10));
    return ch && ch.stages ? ch.stages.find(s => s.id === id) || null : null;
  }

  // 챕터 선택 (잠긴 챕터는 이동 불가)
  changeChapter(delta) {
    const next = (this.selectedChapter || 1) + delta;
    if (next < 1 || next > SaveManager.MAX_CHAPTER) return;
    if (window.saveMgr && !window.saveMgr.isChapterUnlocked(next)) {
      if (window.soundEngine) window.soundEngine.playHit();
      return;
    }
    this.selectedChapter = next;
    const ch = this.getChapter(next);
    const unlocked = ch.stages.filter(st => !window.saveMgr || window.saveMgr.isStageUnlocked(st.id));
    this.selectedStageId = (unlocked[unlocked.length - 1] || ch.stages[0]).id;
    this.renderStageSelectGrid();
    const body = document.querySelector('.lobby-body');
    if (body) body.scrollTop = 0;
    if (window.soundEngine) window.soundEngine.playClick();
  }

  renderChapterHeader() {
    const n = this.selectedChapter || 1;
    const ch = this.getChapter(n);
    if (!ch) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
    set('chapterBadge', `CHAPTER ${n}`);
    set('chapterTitle', ch.name || ch.title);
    set('chapterSubtitle', ch.subtitle || '');

    const prev = document.getElementById('btnChapterPrev');
    const next = document.getElementById('btnChapterNext');
    if (prev) prev.disabled = n <= 1;
    if (next) {
      next.disabled = n >= SaveManager.MAX_CHAPTER;
      next.classList.toggle('locked', !!(window.saveMgr && n < SaveManager.MAX_CHAPTER && !window.saveMgr.isChapterUnlocked(n + 1)));
    }

    const dots = document.getElementById('chapterDots');
    if (dots) {
      let html = '';
      for (let i = 1; i <= SaveManager.MAX_CHAPTER; i++) {
        const open = !window.saveMgr || window.saveMgr.isChapterUnlocked(i);
        html += `<span class="chapter-dot ${i === n ? 'active' : ''} ${open ? '' : 'locked'}"></span>`;
      }
      dots.innerHTML = html;
    }
  }

  // 스테이지 이름에서 "1-1 " 접두어 제거 (번호는 카드 좌측 배지로 표시)
  stageDisplayName(st) {
    return st.name.replace(/^\d+-\d+\s*/, '');
  }

  renderStageSelectGrid() {
    const grid = document.getElementById('stageGridContainer');
    if (!this.selectedChapter) this.selectedChapter = parseInt(String(this.selectedStageId).split('-')[0], 10) || 1;
    const ch1 = this.getChapter1();
    if (!grid || !ch1 || !ch1.stages) return;
    grid.innerHTML = '';
    this.renderChapterHeader();

    const lockSvg = '<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" stroke-width="1.8"/></svg>';
    let cleared = 0;

    ch1.stages.forEach(st => {
      const isUnlocked = window.saveMgr ? window.saveMgr.isStageUnlocked(st.id) : (st.id === '1-1');
      const stars = window.saveMgr ? window.saveMgr.getStageStars(st.id) : 0;
      const isSelected = st.id === this.selectedStageId;
      if (stars > 0) cleared++;

      const card = document.createElement('div');
      card.className = ['stage-card', isUnlocked ? 'unlocked' : 'locked', isSelected ? 'selected' : '', st.boss ? 'boss' : ''].join(' ').trim();

      const [chapterNo, stageNo] = st.id.split('-');
      const numHtml = `<div class="stage-num"><small>STAGE</small>${chapterNo}-${stageNo}</div>`;

      if (!isUnlocked) {
        card.innerHTML = `
          ${numHtml}
          <div class="stage-card-body"><div class="stage-card-title">${this.stageDisplayName(st)}</div></div>
          <div class="stage-card-side"><span class="stage-lock">${lockSvg}</span></div>
        `;
        grid.appendChild(card);
        return;
      }

      let starIcons = '';
      for (let s = 1; s <= 3; s++) {
        starIcons += window.getGameIcon(s <= stars ? 'star_gold' : 'star_empty');
      }

      const durM = Math.floor(st.duration / 60);
      const durS = (st.duration % 60).toString().padStart(2, '0');
      const goldReward = st.goldReward || st.reward || 200;

      card.innerHTML = `
        ${numHtml}
        <div class="stage-card-body">
          <div class="stage-card-title">${this.stageDisplayName(st)}</div>
          <div class="stage-card-desc">${st.desc}</div>
          <div class="stage-card-meta">
            <span class="stage-meta-tag">${window.getGameIcon('timer_clock')} ${durM}:${durS}</span>
            <span class="stage-meta-tag reward">${window.getGameIcon('gold_coin')} ${goldReward}</span>
            ${st.boss ? '<span class="stage-meta-tag boss">보스 출현</span>' : ''}
          </div>
        </div>
        <div class="stage-card-side"><div class="stage-stars-row">${starIcons}</div></div>
      `;

      card.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.selectedStageId = st.id;
        grid.querySelectorAll('.stage-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.updateStageSelectedInfo();
        if (window.soundEngine) window.soundEngine.playClick();
      };

      grid.appendChild(card);
    });

    // 챕터 진행도
    const total = ch1.stages.length;
    const fill = document.getElementById('chapterProgressFill');
    const text = document.getElementById('chapterProgressText');
    if (fill) fill.style.width = `${(cleared / total) * 100}%`;
    if (text) text.innerText = `${cleared} / ${total} 클리어`;

    this.updateStageSelectedInfo();
  }

  updateStageSelectedInfo() {
    const titleEl = document.getElementById('selectedStageTitle');
    const rewardEl = document.getElementById('selectedStageReward');
    if (!titleEl || !rewardEl) return;

    const charData = window.GAME_DATA.CHARACTERS[this.selectedCharId];
    const charName = charData ? charData.name : '';

    if (this.selectedMode === 'survival') {
      titleEl.innerText = '10분 무한 서바이벌';
      rewardEl.innerText = `${charName} · 보스 처치 시 대량 코인`;
      return;
    }

    const st = this.getStageById(this.selectedStageId) || this.getChapter(1).stages[0];
    const goldReward = st.goldReward || st.reward || 200;
    titleEl.innerText = `${st.id} ${this.stageDisplayName(st)}`;
    rewardEl.innerText = `${charName} · 클리어 +${goldReward} 코인`;
  }

  renderCharSelectGrid() {
    const grid = document.getElementById('charCardGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const chars = Object.values(window.GAME_DATA.CHARACTERS);
    const maxHp = Math.max(...chars.map(c => c.baseHp * (1 + (c.bonus.hpMul || 0))));
    const maxSpd = Math.max(...chars.map(c => c.speed * (1 + (c.bonus.speedMul || 0))));

    chars.forEach(c => {
      const hp = Math.round(c.baseHp * (1 + (c.bonus.hpMul || 0)));
      const spd = c.speed * (1 + (c.bonus.speedMul || 0));
      const weapon = window.GAME_DATA.WEAPONS[c.initialWeapon];

      const card = document.createElement('div');
      card.className = 'char-card' + (c.id === this.selectedCharId ? ' selected' : '');
      card.innerHTML = `
        <div class="char-portrait">${(c.sprite && window.assets.spriteHtml(`char_${c.sprite}_idle`, 60, 'full')) || c.avatar}</div>
        <div class="char-info">
          <div class="char-name-row">
            <span class="char-name">${c.name}</span>
            <span class="char-title">${c.title}</span>
          </div>
          <p class="char-desc">${c.desc}</p>
          <div class="char-stats">
            <span class="char-stat-label">체력</span>
            <span class="char-stat-bar hp"><i style="width:${(hp / maxHp) * 100}%"></i></span>
            <span class="char-stat-val">${hp}</span>
            <span class="char-stat-label">속도</span>
            <span class="char-stat-bar"><i style="width:${(spd / maxSpd) * 100}%"></i></span>
            <span class="char-stat-val">${spd.toFixed(1)}</span>
          </div>
          <div class="char-perk">${weapon ? weapon.icon : ''}<span>${weapon ? weapon.name : ''} · ${c.bonusText}</span></div>
        </div>
        <span class="char-check">✓</span>
      `;
      card.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.selectedCharId = c.id;
        grid.querySelectorAll('.char-card').forEach(el => el.classList.remove('selected'));
        card.classList.add('selected');
        this.updateStageSelectedInfo();
        if (window.soundEngine) window.soundEngine.playXP();
      };
      grid.appendChild(card);
    });
  }

  renderShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const gold = window.saveMgr ? window.saveMgr.getGold() : 0;

    Object.values(window.GAME_DATA.SHOP_UPGRADES).forEach(up => {
      const curLv = window.saveMgr ? window.saveMgr.getUpgradeLevel(up.id) : 0;
      const isMax = curLv >= up.maxLv;
      const cost = isMax ? 0 : Math.floor(up.baseCost * Math.pow(up.costMul, curLv));

      let pipsHtml = '';
      for (let i = 0; i < up.maxLv; i++) {
        pipsHtml += `<div class="shop-pip ${i < curLv ? 'fill' : ''}"></div>`;
      }

      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="shop-card-icon">${up.icon}</div>
        <div class="shop-card-info">
          <span class="shop-card-name">${up.name}</span>
          <span class="shop-card-desc">${up.desc}</span>
          <div class="shop-pips-row">${pipsHtml}</div>
        </div>
        <button class="shop-buy-btn ${isMax ? 'maxed' : (gold < cost ? 'poor' : '')}">
          ${isMax ? 'MAX' : `${window.getGameIcon('gold_coin')}${cost.toLocaleString()}`}
        </button>
      `;

      const buyBtn = card.querySelector('.shop-buy-btn');
      if (!isMax && buyBtn) {
        buyBtn.onclick = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (window.saveMgr && window.saveMgr.buyUpgrade(up.id)) {
            if (window.soundEngine) window.soundEngine.playBuy();
            this.updateLobbyGold();
            this.renderShop();
          } else if (window.soundEngine) {
            window.soundEngine.playHit();
          }
        };
      }

      grid.appendChild(card);
    });
  }

  renderAchievements() {
    const list = document.getElementById('achList');
    if (!list) return;
    list.innerHTML = '';
    let done = 0;

    window.GAME_DATA.ACHIEVEMENTS.forEach(ach => {
      const isDone = window.saveMgr ? !!window.saveMgr.data.achievements[ach.id] : false;
      if (isDone) done++;

      const card = document.createElement('div');
      card.className = 'ach-card' + (isDone ? ' completed' : '');
      card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-card-info">
          <div class="ach-title">${ach.name}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
        <div class="ach-badge">${isDone ? '달성' : `${window.getGameIcon('gold_coin')}${ach.reward}`}</div>
      `;
      list.appendChild(card);
    });

    const count = document.getElementById('achCount');
    if (count) count.innerText = `${done} / ${window.GAME_DATA.ACHIEVEMENTS.length}`;
  }

  renderBestiary() {
    const list = document.getElementById('bestiaryList');
    if (!list) return;
    list.innerHTML = '';

    const unlocked = window.saveMgr ? (window.saveMgr.data.unlockedBestiary || []) : [];
    let found = 0;

    window.GAME_DATA.BESTIARY.forEach(b => {
      const isUnlocked = unlocked.includes(b.id);
      const isBoss = b.id.startsWith('boss_');
      if (isUnlocked) found++;

      const card = document.createElement('div');
      card.className = ['bestiary-card', isUnlocked ? 'unlocked' : 'locked', isBoss ? 'boss' : ''].join(' ').trim();
      card.innerHTML = isUnlocked ? `
          <div class="bestiary-head">
            <div class="bestiary-icon">${b.icon}</div>
            <div>
              <div class="bestiary-name">${b.name}</div>
              <div class="bestiary-type">${b.type}</div>
            </div>
          </div>
          <div class="bestiary-desc">${b.desc}</div>
          <div class="bestiary-strategy">${b.strategy}</div>
        ` : `
          <div class="bestiary-head">
            <div class="bestiary-icon">${b.icon}</div>
            <div>
              <div class="bestiary-name">???</div>
              <div class="bestiary-type">${isBoss ? '보스' : '미확인'}</div>
            </div>
          </div>
          <div class="bestiary-desc">처치하면 정보가 해금됩니다.</div>
        `;
      list.appendChild(card);
    });

    const count = document.getElementById('bestiaryCount');
    if (count) count.innerText = `${found} / ${window.GAME_DATA.BESTIARY.length}`;
  }

  startGame(charId, stageId = null, mode = 'stage') {
    document.getElementById('charSelectModal').classList.remove('active');
    document.getElementById('endGameModal').classList.remove('active');
    document.getElementById('stageClearModal').classList.remove('active');
    document.getElementById('levelUpModal').classList.remove('active');
    document.getElementById('pauseModal').classList.remove('active');

    this.selectedCharId = charId || 'intern';
    this.selectedMode = mode || 'stage';
    this.currentStageId = stageId || this.selectedStageId || '1-1';

    if (this.selectedMode === 'stage') {
      this.currentStage = this.getStageById(this.currentStageId) || this.getChapter(1).stages[0];
      this.currentStageId = this.currentStage.id;
      this.gameTime = this.currentStage ? this.currentStage.duration : 60;
    } else {
      this.currentStage = null;
      this.gameTime = 600; // 10분
    }

    this.player = new Player(this.selectedCharId);
    this.weaponMgr.reset();
    this.monsterMgr.reset();
    this.propMgr.reset();
    this.dropMgr.reset();
    this.effectEngine.reset();

    this.monsterMgr.setStage(this.currentStage);

    this.levelUpQueue = 0;
    this.state = 'playing';

    if (window.soundEngine) window.soundEngine.playLevelUp();
    this.updateHUD();
  }

  queueLevelUp() {
    this.levelUpQueue = (this.levelUpQueue || 0) + 1;
    if (this.state === 'playing') {
      this.processNextLevelUp();
    }
  }

  processNextLevelUp() {
    const modal = document.getElementById('levelUpModal');
    if (!modal) return;

    if (this.levelUpQueue <= 0) {
      this.levelUpQueue = 0;
      modal.classList.remove('active');
      if (this.state === 'level_up') {
        this.state = 'playing';
      }
      return;
    }

    this.levelUpQueue--;
    this.state = 'level_up';

    const deck = document.getElementById('upgradeCardDeck');
    if (!deck) return;
    deck.innerHTML = '';

    const choices = this.generateUpgradeChoices();

    let hasSelected = false;
    // 이전 카드 선택의 지연 click(고스트 클릭)이 새 카드를 자동 선택하는 것 방지
    const shownAt = performance.now();

    const lvEl = document.getElementById('levelUpLevel');
    if (lvEl) lvEl.innerText = this.player.level - this.levelUpQueue;

    choices.forEach((ch, idx) => {
      const card = document.createElement('div');
      card.className = `lu-card rarity-${ch.category}`;
      card.style.setProperty('--i', idx);
      card.innerHTML = this.renderUpgradeCard(ch);

      const selectAction = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (hasSelected) return;
        if (performance.now() - shownAt < 350) return;
        hasSelected = true;

        // 선택 연출: 고른 카드는 확대·발광, 나머지는 퇴장
        card.classList.add('picked');
        deck.querySelectorAll('.lu-card').forEach(c => { if (c !== card) c.classList.add('dismiss'); });
        this.applyUpgrade(ch);

        setTimeout(() => {
          this.processNextLevelUp();
        }, 380);
      };

      card.addEventListener('pointerup', selectAction);
      card.addEventListener('click', selectAction);

      deck.appendChild(card);
    });

    modal.classList.add('active');
  }

  // 레벨업 카드 1장 마크업 (아이콘 / 이름 / 레벨 칸 / 설명)
  renderUpgradeCard(ch) {
    const D = window.GAME_DATA;
    let name = ch.title;
    let tag = ch.typeText;
    let cur = 0;
    let max = 0;
    let kind = '';

    if (ch.category === 'weapon') {
      name = D.WEAPONS[ch.id].name;
      cur = this.player.weapons[ch.id] || 0;
      max = D.WEAPONS[ch.id].levels.length;
      kind = '무기';
      tag = cur === 0 ? 'NEW' : `Lv.${cur + 1}`;
    } else if (ch.category === 'passive') {
      name = D.PASSIVES[ch.id].name;
      cur = this.player.passives[ch.id] || 0;
      max = D.PASSIVES[ch.id].levels.length;
      kind = '복지';
      tag = cur === 0 ? 'NEW' : `Lv.${cur + 1}`;
    } else if (ch.category === 'super_weapon') {
      name = D.SUPER_WEAPONS[ch.id].name.replace(/[🔥\[\]]/g, '').trim();
      kind = '초월 각성';
      tag = 'EVOLVE';
    } else {
      name = '야근 영양제';
      kind = '회복';
      tag = 'HEAL';
    }

    let pips = '';
    for (let i = 0; i < max; i++) {
      pips += `<i class="${i < cur ? 'on' : ''} ${i === cur ? 'next' : ''}"></i>`;
    }

    return `
      <div class="lu-card-inner">
        <span class="lu-tag ${tag === 'NEW' ? 'new' : ''}">${tag}</span>
        <div class="lu-icon"><div class="lu-icon-halo"></div>${ch.icon}</div>
        <div class="lu-name">${name}</div>
        ${max ? `<div class="lu-pips">${pips}</div>` : '<div class="lu-pips empty"></div>'}
        <div class="lu-desc">${ch.desc}</div>
        <div class="lu-kind">${kind}</div>
      </div>
    `;
  }

  generateUpgradeChoices() {
    const choices = [];
    if (!this.player) return choices;

    const ownedWeaponKeys = Object.keys(this.player.weapons);
    const ownedPassiveKeys = Object.keys(this.player.passives);

    // 1. 초월 진화 무기 각성 검사
    Object.entries(this.player.weapons).forEach(([wId, lv]) => {
      const wDef = window.GAME_DATA.WEAPONS[wId];
      if (wDef && lv >= 8 && this.player.passives[wDef.partnerPassive] && !this.player.superWeapons.includes(wDef.evolution)) {
        const sDef = window.GAME_DATA.SUPER_WEAPONS[wDef.evolution];
        if (sDef) {
          choices.push({
            isSuper: true,
            id: sDef.id,
            category: 'super_weapon',
            icon: sDef.icon,
            title: sDef.name,
            typeText: '초월 무기 각성',
            desc: sDef.desc
          });
        }
      }
    });

    // 2. 일반 무기 업그레이드 (최대 6개 슬롯 제한)
    const availableWeapons = Object.keys(window.GAME_DATA.WEAPONS).filter(wId => {
      const curLv = this.player.weapons[wId] || 0;
      if (this.player.superWeapons.includes(`super_${wId}`)) return false;
      if (curLv === 0) {
        return ownedWeaponKeys.length < 6;
      }
      return curLv < 8;
    });

    // 3. 일반 패시브 업그레이드 (최대 6개 슬롯 제한)
    const availablePassives = Object.keys(window.GAME_DATA.PASSIVES).filter(pId => {
      const curLv = this.player.passives[pId] || 0;
      if (curLv === 0) {
        return ownedPassiveKeys.length < 6;
      }
      return curLv < 4;
    });

    const pool = [
      ...availableWeapons.map(id => ({ id, cat: 'weapon' })),
      ...availablePassives.map(id => ({ id, cat: 'passive' }))
    ];

    while (choices.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      const item = pool.splice(idx, 1)[0];

      if (item.cat === 'weapon') {
        const wDef = window.GAME_DATA.WEAPONS[item.id];
        const curLv = this.player.weapons[item.id] || 0;
        const nextLv = curLv + 1;
        const lvData = wDef.levels[nextLv - 1];

        choices.push({
          id: item.id,
          category: 'weapon',
          icon: wDef.icon,
          title: curLv === 0 ? `[신규 무기] ${wDef.name}` : `${wDef.name} (Lv.${nextLv})`,
          typeText: curLv === 0 ? '신규 무기' : '무기 강화',
          desc: lvData ? lvData.desc : '공격 성능이 대폭 강화됩니다.'
        });
      } else {
        const pDef = window.GAME_DATA.PASSIVES[item.id];
        const curLv = this.player.passives[item.id] || 0;
        const nextLv = curLv + 1;
        const lvData = pDef.levels[nextLv - 1];

        choices.push({
          id: item.id,
          category: 'passive',
          icon: pDef.icon,
          title: curLv === 0 ? `[사내 복지] ${pDef.name}` : `${pDef.name} (Lv.${nextLv})`,
          typeText: curLv === 0 ? '신규 패시브' : '패시브 강화',
          desc: lvData ? lvData.desc : '업무 역량이 강화됩니다.'
        });
      }
    }

    // 선택지가 부족할 경우 체력 회복 카드로 대체
    while (choices.length < 3) {
      choices.push({
        id: 'heal_' + choices.length,
        category: 'heal',
        icon: window.assets.iconHtml('aid_kit'),
        title: '야근 영양제 섭취',
        typeText: '즉시 회복',
        desc: '즉시 체력을 40% 회복하고 코인 +100을 획득합니다.'
      });
    }

    return choices;
  }

  applyUpgrade(ch) {
    if (window.soundEngine) window.soundEngine.playLevelUp();
    // 레벨업 마법진 + 별 이모트
    this.effectEngine.spawnFlash(this.player.x, this.player.y - 10, 'fx_magic', '#00f0ff', 130, 0.7, { spin: 3, grow: 0.4, follow: this.player });
    this.effectEngine.spawnEmote(this.player.x, this.player.y, 'star', this.player);

    if (ch.category === 'super_weapon') {
      if (!this.player.superWeapons.includes(ch.id)) {
        this.player.superWeapons.push(ch.id);
      }
      this.effectEngine.screenShake(12, 0.4);
      this.effectEngine.spawnShockwave(this.player.x, this.player.y, 200, '#ffd700');
      this.effectEngine.spawnFlash(this.player.x, this.player.y - 20, 'fx_flare', '#ffd700', 240, 0.9, { spin: 2, grow: 0.8, follow: this.player });
      this.effectEngine.spawnFlash(this.player.x, this.player.y - 20, 'fx_burst', '#ffffff', 160, 0.5);
      this.effectEngine.spawnEmote(this.player.x, this.player.y, 'exclamations', this.player);
      this.effectEngine.spawnFloatingText(this.player.x, this.player.y - 40, '⚡ 초월 무기 각성! ⚡', '#ffd700');
      if (window.saveMgr) window.saveMgr.checkAchievement('ach_super_weapon', true);
    } else if (ch.category === 'weapon') {
      this.player.weapons[ch.id] = (this.player.weapons[ch.id] || 0) + 1;
    } else if (ch.category === 'passive') {
      this.player.passives[ch.id] = (this.player.passives[ch.id] || 0) + 1;
      this.player.recalcStats();
    } else if (ch.category === 'heal') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.4);
      this.player.gold += 100;
      this.effectEngine.spawnFloatingText(this.player.x, this.player.y - 30, '+40% 체력 & +100 코인', '#00ffaa');
    }

    this.updateHUD();
  }

  handleChestOpened() {
    if (window.soundEngine) window.soundEngine.playLevelUp();
    this.effectEngine.screenShake(10, 0.35);
    this.effectEngine.spawnShockwave(this.player.x, this.player.y, 160, '#ffd700');
    this.effectEngine.spawnFlash(this.player.x, this.player.y, 'fx_glow', '#ffd700', 220, 0.7);
    this.effectEngine.spawnEmote(this.player.x, this.player.y, 'cash', this.player);
    this.effectEngine.spawnFloatingText(this.player.x, this.player.y - 45, '🎁 보스 황금 상자 획득!!', '#ffd700');

    let evolved = false;
    Object.entries(this.player.weapons).forEach(([wId, lv]) => {
      if (evolved) return;
      const wDef = window.GAME_DATA.WEAPONS[wId];
      // 레벨업 각성과 동일한 조건: 무기 Lv8 + 짝 패시브 보유
      if (wDef && lv >= 8 && this.player.passives[wDef.partnerPassive] && !this.player.superWeapons.includes(wDef.evolution)) {
        this.player.superWeapons.push(wDef.evolution);
        evolved = true;
        if (window.saveMgr) window.saveMgr.checkAchievement('ach_super_weapon', true);
      }
    });

    if (!evolved) {
      this.player.gold += 300;
      this.player.hp = this.player.maxHp;
      this.effectEngine.spawnFloatingText(this.player.x, this.player.y - 60, '+300 코인 & 체력 완전 회복!', '#00ffaa');
    }

    this.updateHUD();
  }

  handleStageClear() {
    this.state = 'stage_clear';
    const modal = document.getElementById('stageClearModal');
    if (!modal) return;

    // 1. 별점 계산 (HP 잔여율 기준: 80% 이상 3성, 40% 이상 2성, 클리어 1성)
    const hpPercent = (this.player.hp / this.player.maxHp) * 100;
    let stars = 1;
    if (hpPercent >= 80) stars = 3;
    else if (hpPercent >= 40) stars = 2;

    const goldReward = this.currentStage ? (this.currentStage.goldReward || this.currentStage.reward || 200) : 200;

    // 영구 데이터 저장 및 다음 스테이지 자동 해금
    if (window.saveMgr) {
      window.saveMgr.saveStageClear(this.currentStageId, stars, goldReward);
      window.saveMgr.addGold(this.player.gold);
      window.saveMgr.data.totalRuns = (window.saveMgr.data.totalRuns || 0) + 1;
      window.saveMgr.data.totalKills = (window.saveMgr.data.totalKills || 0) + this.player.kills;
      window.saveMgr.checkProgressAchievements();
      window.saveMgr.save();
    }

    if (window.soundEngine) window.soundEngine.playVictory();

    // UI 별점 렌더링
    const starContainer = document.getElementById('clearStarRating');
    if (starContainer) {
      starContainer.innerHTML = '';
      for (let s = 1; s <= 3; s++) {
        const span = document.createElement('span');
        span.className = `star-pill star-${s} ${s <= stars ? 'earned' : 'empty'}`;
        span.innerText = s <= stars ? '⭐' : '☆';
        starContainer.appendChild(span);
      }
    }

    const stageTitle = this.currentStage ? this.stageDisplayName(this.currentStage) : '스테이지';
    const subEl = document.getElementById('stageClearSubtitle');
    if (subEl) subEl.innerText = `[${this.currentStageId}] ${stageTitle} 결재 승인 완료! (${stars}성 획득)`;

    const totalDur = this.currentStage ? this.currentStage.duration : 60;
    const durM = Math.floor(totalDur / 60).toString().padStart(2, '0');
    const durS = (totalDur % 60).toString().padStart(2, '0');

    document.getElementById('clearTimeVal').innerText = `${durM}:${durS}`;
    document.getElementById('clearKillsVal').innerText = `${this.player.kills} 마리`;
    document.getElementById('clearGoldVal').innerText = `+${goldReward + this.player.gold} 코인`;

    // 마지막 1-10 스테이지 여부에 따른 다음 스테이지 버튼 텍스트 변경
    // (클릭 동작은 setupUIBindings에서 currentStageId로 분기)
    const nextBtn = document.getElementById('btnNextStage');
    if (nextBtn) {
      const [clearedCh, clearedSt] = this.currentStageId.split('-').map(Number);
      if (this.currentStageId === '10-10') nextBtn.innerText = '🏆 전 챕터 정복! 로비로';
      else if (clearedSt === 10) nextBtn.innerText = `🏆 ${clearedCh}장 정복! ${clearedCh + 1}장으로 ➔`;
      else nextBtn.innerText = '다음 스테이지 출근 ➔';
    }

    modal.classList.add('active');
  }

  handleGameOver(isVictory = false) {
    // 이미 판이 끝난 상태면 무시 (같은 프레임 승리+사망 시 보상 이중 지급 방지)
    if (this.state === 'game_over' || this.state === 'victory' || this.state === 'stage_clear') return;

    // 스테이지 모드에서 생존 시간 만료로 클리어한 경우 -> 스테이지 클리어 모달 실행
    if (this.selectedMode === 'stage' && isVictory) {
      this.handleStageClear();
      return;
    }

    this.state = isVictory ? 'victory' : 'game_over';
    const modal = document.getElementById('endGameModal');
    const titleEl = document.getElementById('endModalTitle');
    const subEl = document.getElementById('endModalSubtitle');

    if (isVictory) {
      titleEl.innerText = '🎉 11:00 칼퇴 성공! 막차 탑승!';
      titleEl.style.color = '#00ffaa';
      subEl.innerText = '모든 업무 몬스터와 야근 지시 상사들을 물리치고 완벽하게 퇴근했습니다!';
      if (window.soundEngine) window.soundEngine.playVictory();
      if (window.saveMgr) window.saveMgr.checkAchievement('ach_first_clear', true);
    } else {
      titleEl.innerText = '💀 야근에 쓰러졌습니다...';
      titleEl.style.color = '#ff3355';
      subEl.innerText = '끝없는 결재 반려와 엑셀 오류를 버티지 못했습니다.';
      if (window.soundEngine) window.soundEngine.playGameOver();
    }

    // 영구 저장소에 골드 및 성과 동기화
    if (window.saveMgr) {
      window.saveMgr.addGold(this.player.gold);
      window.saveMgr.data.totalRuns = (window.saveMgr.data.totalRuns || 0) + 1;
      window.saveMgr.data.totalKills = (window.saveMgr.data.totalKills || 0) + this.player.kills;

      window.saveMgr.checkProgressAchievements();

      window.saveMgr.save();
    }

    const maxTime = this.currentStage ? this.currentStage.duration : 600;
    const elapsed = Math.max(0, maxTime - this.gameTime);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = Math.floor(elapsed % 60).toString().padStart(2, '0');

    document.getElementById('endSurvivalTime').innerText = `${m}:${s}`;
    document.getElementById('endFinalLevel').innerText = `Lv.${this.player.level}`;
    document.getElementById('endTotalKills').innerText = `${this.player.kills} 마리`;
    document.getElementById('endTotalGold').innerText = `+${this.player.gold} 코인`;
    document.getElementById('endBankGold').innerText = `${window.saveMgr ? window.saveMgr.getGold() : 0} 코인`;

    modal.classList.add('active');
  }

  // HUD 요소 참조 캐시
  hudEl(id) {
    if (!this.hudEls[id]) this.hudEls[id] = document.getElementById(id);
    return this.hudEls[id];
  }

  // 값이 바뀐 경우에만 DOM 갱신 (매 프레임 레이아웃/GC 부담 제거)
  setHud(id, key, value, apply) {
    if (this.hudCache[key] === value) return;
    this.hudCache[key] = value;
    const el = this.hudEl(id);
    if (el) apply(el, value);
  }

  updateHUD() {
    if (!this.player) return;
    const p = this.player;
    const setText = (el, v) => { el.innerText = v; };
    const setWidth = (el, v) => { el.style.width = v; };

    this.setHud('hudLevelBadge', 'level', `Lv.${p.level}`, setText);
    this.setHud('hudXpFill', 'xpW', `${Math.min(100, (p.exp / p.nextExp) * 100).toFixed(1)}%`, setWidth);
    this.setHud('hudXpText', 'xpT', `${p.exp} / ${p.nextExp} XP`, setText);

    this.setHud('hudPlayerName', 'name', p.name, setText);
    this.setHud('hudPlayerRank', 'rank', p.title, setText);
    this.setHud('hudPlayerAvatar', 'avatar', p.charData.avatar, (el, v) => { el.innerHTML = v; });

    const hpRate = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
    this.setHud('hudHpFill', 'hpW', `${hpRate.toFixed(1)}%`, setWidth);
    this.setHud('hudHpText', 'hpT', `${Math.ceil(p.hp)} / ${p.maxHp}`, setText);

    this.setHud('hudKillCount', 'kills', `${p.kills}`, setText);
    this.setHud('hudGoldCount', 'gold', `${p.gold}`, setText);

    // 타이머
    const m = Math.floor(this.gameTime / 60).toString().padStart(2, '0');
    const s = Math.floor(this.gameTime % 60).toString().padStart(2, '0');
    this.setHud('hudTimerText', 'timer', `${m}:${s}`, setText);

    // 대시 버튼 쿨타임 UI (실제 적용된 쿨타임 기준)
    const cdRate = p.dashCooldown > 0 ? Math.min(100, Math.max(0, (p.dashCooldown / p.lastDashCooldown) * 100)) : 0;
    this.setHud('dashCooldownOverlay', 'dashH', `${cdRate.toFixed(0)}%`, (el, v) => { el.style.height = v; });
    this.setHud('btnMobileDash', 'dashCool', cdRate > 0, (el, v) => { el.classList.toggle('cooling', v); });

    // 무기 및 패시브 슬롯: 구성/레벨이 바뀐 경우에만 재생성
    const slotSig = JSON.stringify([p.weapons, p.passives, p.superWeapons]);
    if (this.hudCache.slots !== slotSig) {
      this.hudCache.slots = slotSig;
      this.renderHudSlots();
    }
  }

  renderHudSlots() {
    const p = this.player;

    const wSlots = this.hudEl('hudWeaponSlots');
    if (wSlots) {
      const wIds = Object.keys(p.weapons);
      let html = '';
      for (let i = 0; i < 6; i++) {
        const wId = wIds[i];
        if (!wId) {
          html += '<div class="slot-box"></div>';
          continue;
        }
        const isSuper = p.superWeapons.includes(`super_${wId}`);
        const wDef = window.GAME_DATA.WEAPONS[wId];
        const curLv = isSuper ? 8 : (p.weapons[wId] || 1);
        const icon = isSuper
          ? (window.GAME_DATA.SUPER_WEAPONS[`super_${wId}`]?.icon || wDef?.icon || '')
          : (wDef ? wDef.icon : '');

        let dotsHtml = '';
        for (let d = 0; d < 8; d++) {
          dotsHtml += `<div class="level-dot ${d < curLv ? 'fill' : ''}"></div>`;
        }
        html += `<div class="slot-box active${isSuper ? ' super' : ''}">
            <span class="slot-icon">${icon}</span>
            <div class="slot-level-dots">${dotsHtml}</div>
          </div>`;
      }
      wSlots.innerHTML = html;
    }

    const pSlots = this.hudEl('hudPassiveSlots');
    if (pSlots) {
      const pIds = Object.keys(p.passives);
      let html = '';
      for (let i = 0; i < 6; i++) {
        const pId = pIds[i];
        if (!pId) {
          html += '<div class="slot-box"></div>';
          continue;
        }
        const pDef = window.GAME_DATA.PASSIVES[pId];
        const curLv = p.passives[pId] || 1;

        let dotsHtml = '';
        for (let d = 0; d < 4; d++) {
          dotsHtml += `<div class="level-dot ${d < curLv ? 'fill' : ''}"></div>`;
        }
        html += `<div class="slot-box active">
            <span class="slot-icon">${pDef ? pDef.icon : '✨'}</span>
            <div class="slot-level-dots">${dotsHtml}</div>
          </div>`;
      }
      pSlots.innerHTML = html;
    }
  }

  // 사무실 맵 렌더링 (정적 레이어는 OfficeMap 청크 캐시, 엘리베이터/비네팅만 매 프레임)
  renderOfficeMap(ctx, camera) {
    this.officeMap.render(ctx, camera, this.viewW, this.viewH, this.player);
  }

  gameLoop(now) {
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.state === 'playing' && this.player) {
      // 1. 타이머 업데이트
      this.gameTime -= dt;
      if (this.gameTime <= 0) {
        // 탈출 성공: 이 프레임의 전투 업데이트는 건너뜀 (클리어 직후 사망 처리 방지)
        this.gameTime = 0;
        this.updateHUD();
        this.handleGameOver(true);
      } else {
        // 2. 엔티티 업데이트
        this.player.update(dt, this.input);
        this.propMgr.resolveCollisions(this.player);

        this.weaponMgr.update(dt, this.player, this.monsterMgr.monsters, this.effectEngine);
        // 몬스터 벽 충돌은 Monster.update 내부에서 처리 (슬랙 유령은 벽 통과)
        this.monsterMgr.update(dt, this.player, this.gameTime, this.effectEngine);

        this.propMgr.update(dt);
        this.dropMgr.update(dt, this.player, this.effectEngine);
        this.effectEngine.update(dt);

        this.updateHUD();
      }
    }

    // 3. 카메라 추종
    if (this.player) {
      let shakeX = 0;
      let shakeY = 0;
      if (this.effectEngine.shakeMag > 0) {
        shakeX = (Math.random() - 0.5) * this.effectEngine.shakeMag;
        shakeY = (Math.random() - 0.5) * this.effectEngine.shakeMag;
      }
      this.camera.x = this.player.x - this.viewW / 2 + shakeX;
      this.camera.y = this.player.y - this.viewH / 2 + shakeY;
    }

    // 4. 렌더링
    this.ctx.clearRect(0, 0, this.viewW, this.viewH);

    if (this.player) {
      const ctx = this.ctx;
      const cam = this.camera;

      // 1) 바닥 레이어
      this.renderOfficeMap(ctx, cam);
      this.effectEngine.renderDecals(ctx, cam);
      this.propMgr.renderFlat(ctx, cam);
      this.monsterMgr.renderGround(ctx, cam);
      this.weaponMgr.render(ctx, cam, 'ground');
      this.dropMgr.render(ctx, cam);

      // 2) 깊이 정렬 레이어 (가구 · 기물 · 몬스터 · 플레이어를 발 위치 순으로)
      const depth = this.depthList || (this.depthList = []);
      depth.length = 0;
      this.propMgr.collectRenderables(cam, depth);
      this.monsterMgr.collectRenderables(ctx, cam, depth);
      depth.push({ y: this.player.y, draw: () => this.player.render(ctx, cam) });
      depth.sort((a, b) => a.y - b.y);
      for (let i = 0; i < depth.length; i++) depth[i].draw();

      // 3) 공중 레이어
      this.weaponMgr.render(ctx, cam, 'air');
      this.monsterMgr.renderBullets(ctx, cam);
      this.effectEngine.render(ctx, cam, this.viewW);
    }

    requestAnimationFrame(t => this.gameLoop(t));
  }
}

window.GameEngine = GameEngine;

// 게임 인스턴스 초기화
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
