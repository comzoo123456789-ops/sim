// Office Escape Survivor - Core Game Loop, Effect Engine, Map Renderer & UI Controller

class EffectEngine {
  constructor() {
    this.floatingTexts = [];
    this.sparks = [];
    this.shockwaves = [];
    this.shakeMag = 0;
    this.shakeDuration = 0;
  }

  reset() {
    this.floatingTexts = [];
    this.sparks = [];
    this.shockwaves = [];
    this.shakeMag = 0;
    this.shakeDuration = 0;
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
  }

  render(ctx, camera) {
    // 1. 충격파 렌더링
    this.shockwaves.forEach(w => {
      const sx = w.x - camera.x;
      const sy = w.y - camera.y;
      const alpha = Math.max(0, w.life / w.maxLife);

      ctx.save();
      ctx.strokeStyle = w.color;
      ctx.lineWidth = 3 * alpha;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, w.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 2. 스파크 렌더링
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

    // 3. 플로팅 텍스트 렌더링
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

    // 4. 돌발 이벤트 배너 렌더링
    if (this.eventBanner && this.eventBanner.timer > 0) {
      const b = this.eventBanner;
      let alpha = 1.0;
      if (b.timer > b.maxTimer - 0.5) {
        alpha = (b.maxTimer - b.timer) / 0.5;
      } else if (b.timer < 0.5) {
        alpha = b.timer / 0.5;
      }

      const cx = ctx.canvas.width / 2;
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

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

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

    this.camera = { x: 0, y: 0 };
    this.input = {
      w: false, a: false, s: false, d: false,
      arrowUp: false, arrowDown: false, arrowLeft: false, arrowRight: false,
      joyX: 0, joyY: 0
    };

    this.levelUpQueue = 0;
    this.gameTime = 60; // 기본 1분 (스테이지별 duration으로 덮어씌워짐)
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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
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
      if (e.code === 'Space' || e.key === 'Shift' || e.key === ' ') {
        e.preventDefault();
        if (this.state === 'playing' && this.player) {
          this.player.dash();
        }
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

        joyBase.style.left = `${startX}px`;
        joyBase.style.top = `${startY}px`;
        joyBase.classList.add('active');

        joyStick.style.transform = 'translate(-50%, -50%)';
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

          joyStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;

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
          joyBase.classList.remove('active');
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
        if (grid) grid.style.display = 'grid';
        this.updateStageSelectedInfo();
        if (window.soundEngine) window.soundEngine.playClick();
      };

      btnModeSurvival.onclick = () => {
        this.selectedMode = 'survival';
        btnModeSurvival.classList.add('active');
        btnModeStage.classList.remove('active');
        const grid = document.getElementById('stageGridContainer');
        if (grid) grid.style.display = 'none';
        const titleEl = document.getElementById('selectedStageTitle');
        const rewardEl = document.getElementById('selectedStageReward');
        if (titleEl) titleEl.innerText = '모드: ⏱️ 10분 무한 심야 서바이벌 (막차 탈출)';
        if (rewardEl) rewardEl.innerText = '보스 처치 및 생존 시 대량의 코인 획득!';
        if (window.soundEngine) window.soundEngine.playClick();
      };
    }

    // 2. 스테이지 시작 버튼
    const btnStartSelectedStage = document.getElementById('btnStartSelectedStage');
    if (btnStartSelectedStage) {
      btnStartSelectedStage.onclick = () => {
        this.startGame(this.selectedCharId, this.selectedStageId, this.selectedMode);
      };
    }

    // 3. 사원 출근 시작 버튼
    const btnStartGame = document.getElementById('btnStartGame');
    if (btnStartGame) {
      btnStartGame.onclick = () => {
        this.startGame(this.selectedCharId, this.selectedStageId, this.selectedMode);
      };
    }

    // 4. 재도전 버튼
    const btnRestartGame = document.getElementById('btnRestartGame');
    if (btnRestartGame) {
      btnRestartGame.onclick = () => {
        this.startGame(this.selectedCharId, this.currentStageId, this.selectedMode);
      };
    }

    // 5. 로비로 돌아가기 버튼
    const btnReturnLobby = document.getElementById('btnReturnLobby');
    if (btnReturnLobby) {
      btnReturnLobby.onclick = () => {
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
      btnNextStage.onclick = () => {
        document.getElementById('stageClearModal').classList.remove('active');
        const curStageNum = parseInt(this.currentStageId.split('-')[1], 10);
        const nextStageId = `1-${Math.min(10, curStageNum + 1)}`;
        this.selectedStageId = nextStageId;
        this.startGame(this.selectedCharId, nextStageId, 'stage');
      };
    }

    // 7. 클리어 모달에서 스테이지 목록으로 귀환
    const btnClearToLobby = document.getElementById('btnClearToLobby');
    if (btnClearToLobby) {
      btnClearToLobby.onclick = () => {
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
          if (!window.soundEngine) window.soundEngine.playClick();
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
      { label: '현재 체력', val: `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`, icon: '❤️' },
      { label: '공격력 배율', val: `x${s.atkMul.toFixed(2)}`, icon: '⚔️' },
      { label: '이동 속도', val: `x${s.speedMul.toFixed(2)}`, icon: '👟' },
      { label: '쿨타임 감소', val: `-${Math.round(s.cdReduc * 100)}%`, icon: '⚡' },
      { label: '공격 범위', val: `+${Math.round((s.areaMul - 1) * 100)}%`, icon: '🎯' },
      { label: '자석 흡입', val: `${s.magnetRange}px`, icon: '🧲' },
      { label: '받는 피해 감소', val: `${Math.round(s.dmgReduc * 100)}%`, icon: '🛡️' },
      { label: '초당 HP 재생', val: `+${s.hpRegen.toFixed(1)}/초`, icon: '🌿' },
      { label: '치명타율', val: `${Math.round(s.critRate * 100)}%`, icon: '💥' },
      { label: '회피율', val: `${Math.round((s.dodgeRate || 0) * 100)}%`, icon: '💨' },
      { label: '부활 기회', val: `${this.player.reviveCount}회`, icon: '🏖️' },
      { label: '골드 획득량', val: `x${(s.goldMul || 1.0).toFixed(2)}`, icon: '🪙' }
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
    const tabs = document.querySelectorAll('.menu-tab-btn');
    tabs.forEach(btn => {
      btn.onclick = () => {
        const targetTab = btn.getAttribute('data-tab');
        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

        if (targetTab === 'stage') {
          document.getElementById('tabPanelStage').classList.add('active');
          this.renderStageSelectGrid();
        }
        if (targetTab === 'char') {
          document.getElementById('tabPanelChar').classList.add('active');
          this.renderCharSelectGrid();
        }
        if (targetTab === 'shop') {
          document.getElementById('tabPanelShop').classList.add('active');
          this.renderShop();
        }
        if (targetTab === 'ach') {
          document.getElementById('tabPanelAch').classList.add('active');
          this.renderAchievements();
        }
        if (targetTab === 'bestiary') {
          document.getElementById('tabPanelBestiary').classList.add('active');
          this.renderBestiary();
        }

        if (window.soundEngine) window.soundEngine.playClick();
      };
    });
  }

  updateLobbyGold() {
    const gold = window.saveMgr ? window.saveMgr.getGold() : 0;
    const el = document.getElementById('lobbyGoldVal');
    if (el) el.innerText = `${gold}`;
  }

  renderStageSelectGrid() {
    const grid = document.getElementById('stageGridContainer');
    if (!grid) return;
    grid.innerHTML = '';

    const ch1 = window.GAME_DATA.CHAPTERS.ch1;
    if (!ch1) return;

    ch1.stages.forEach(st => {
      const isUnlocked = window.saveMgr ? window.saveMgr.isStageUnlocked(st.id) : (st.id === '1-1');
      const stars = window.saveMgr ? window.saveMgr.getStageStars(st.id) : 0;
      const isSelected = st.id === this.selectedStageId;

      const card = document.createElement('div');
      card.className = `stage-card ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`;

      let starIcons = '';
      for (let s = 1; s <= 3; s++) {
        starIcons += `<span class="star-icon ${s <= stars ? 'active' : ''}">⭐</span>`;
      }

      const durM = Math.floor(st.duration / 60);
      const durS = (st.duration % 60).toString().padStart(2, '0');

      card.innerHTML = `
        <div class="stage-card-header">
          <span class="stage-id-badge">${st.id}</span>
          <div class="stage-stars-row">${starIcons}</div>
        </div>
        <div class="stage-card-title">${st.name}</div>
        <div class="stage-card-desc">${st.desc}</div>
        <div class="stage-card-meta">
          <span class="stage-meta-item">⏱️ ${durM}:${durS}</span>
          <span class="stage-meta-item">🪙 +${st.goldReward}</span>
          ${st.boss ? '<span class="stage-meta-boss">⚠️ 보스 출현</span>' : ''}
        </div>
        ${!isUnlocked ? '<div class="stage-lock-overlay">🔒 이전 결재선 승인 필요</div>' : ''}
      `;

      if (isUnlocked) {
        card.onclick = () => {
          this.selectedStageId = st.id;
          document.querySelectorAll('.stage-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          this.updateStageSelectedInfo();
          if (window.soundEngine) window.soundEngine.playClick();
        };
      }

      grid.appendChild(card);
    });

    this.updateStageSelectedInfo();
  }

  updateStageSelectedInfo() {
    const ch1 = window.GAME_DATA.CHAPTERS.ch1;
    if (!ch1) return;

    const st = ch1.stages.find(s => s.id === this.selectedStageId) || ch1.stages[0];
    const titleEl = document.getElementById('selectedStageTitle');
    const rewardEl = document.getElementById('selectedStageReward');

    if (this.selectedMode === 'stage' && st) {
      if (titleEl) titleEl.innerText = `선택된 결재선: [${st.id}] ${st.name} (${Math.floor(st.duration / 60)}분)`;
      if (rewardEl) rewardEl.innerText = `클리어 보상: +${st.goldReward} 코인 | 3성 달성 시 추가 보너스`;
    }
  }

  renderCharSelectGrid() {
    const grid = document.getElementById('charCardGrid');
    grid.innerHTML = '';

    Object.values(window.GAME_DATA.CHARACTERS).forEach(c => {
      const card = document.createElement('div');
      card.className = 'char-select-card' + (c.id === this.selectedCharId ? ' selected' : '');
      card.innerHTML = `
        <div class="char-card-avatar">${c.avatar}</div>
        <div class="char-card-info">
          <div class="char-card-name">${c.name} <small style="color:#94a3b8;">(${c.title})</small></div>
          <div style="font-size:12px;color:#cbd5e1;margin-bottom:3px;">${c.desc}</div>
          <div class="char-card-bonus">✨ ${c.bonusText}</div>
        </div>
      `;
      card.onclick = () => {
        this.selectedCharId = c.id;
        document.querySelectorAll('.char-select-card').forEach(el => el.classList.remove('selected'));
        card.classList.add('selected');
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
        <div class="shop-card-left">
          <div class="shop-card-icon">${up.icon}</div>
          <div class="shop-card-info">
            <div class="shop-card-name-row">
              <span class="shop-card-name">${up.name}</span>
              <div class="shop-pips-row">${pipsHtml}</div>
            </div>
            <div class="shop-card-desc">${up.desc} (현재: Lv.${curLv}/${up.maxLv})</div>
          </div>
        </div>
        <button class="shop-buy-btn ${isMax ? 'maxed' : ''}" data-id="${up.id}">
          ${isMax ? '최대 레벨' : `+ ${cost} 코인`}
        </button>
      `;

      const buyBtn = card.querySelector('.shop-buy-btn');
      if (!isMax) {
        buyBtn.onclick = () => {
          if (window.saveMgr && window.saveMgr.buyUpgrade(up.id)) {
            if (window.soundEngine) window.soundEngine.playBuy();
            this.updateLobbyGold();
            this.renderShop();
          } else {
            if (window.soundEngine) window.soundEngine.playHit();
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

    window.GAME_DATA.ACHIEVEMENTS.forEach(ach => {
      const isDone = window.saveMgr ? !!window.saveMgr.data.achievements[ach.id] : false;

      const card = document.createElement('div');
      card.className = 'ach-card' + (isDone ? ' completed' : '');
      card.innerHTML = `
        <div class="ach-card-info">
          <div class="ach-title">${ach.icon} ${ach.name}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
        <div class="ach-badge">${isDone ? '달성 완료 ✨' : `보상: ${ach.reward} 코인`}</div>
      `;
      list.appendChild(card);
    });
  }

  renderBestiary() {
    const list = document.getElementById('bestiaryList');
    if (!list) return;
    list.innerHTML = '';

    const unlocked = window.saveMgr ? (window.saveMgr.data.unlockedBestiary || []) : [];

    window.GAME_DATA.BESTIARY.forEach(b => {
      const isUnlocked = unlocked.includes(b.id);
      const card = document.createElement('div');
      card.className = 'bestiary-card' + (isUnlocked ? ' unlocked' : ' locked');

      if (isUnlocked) {
        card.innerHTML = `
          <div class="bestiary-card-info">
            <div class="bestiary-title">${b.icon} ${b.name} <small style="color:#00f0ff;font-size:11px;">[${b.type}]</small></div>
            <div class="bestiary-desc">${b.desc}</div>
            <div class="bestiary-strategy">💡 공략법: ${b.strategy}</div>
          </div>
          <div class="ach-badge" style="background:rgba(0,240,255,0.15);color:#00f0ff;border:1px solid rgba(0,240,255,0.3);">해금됨</div>
        `;
      } else {
        card.innerHTML = `
          <div class="bestiary-card-info">
            <div class="bestiary-title">🔒 ??? <small style="color:#64748b;font-size:11px;">[미확인 업무 괴물]</small></div>
            <div class="bestiary-desc" style="color:#64748b;">이 몬스터를 처치하여 사내 업무 도감을 해금하세요.</div>
          </div>
          <div class="ach-badge" style="background:rgba(100,116,139,0.2);color:#94a3b8;">미처치</div>
        `;
      }
      list.appendChild(card);
    });
  }

  startGame(charId, stageId = null, mode = 'stage') {
    document.getElementById('charSelectModal').classList.remove('active');
    document.getElementById('endGameModal').classList.remove('active');
    document.getElementById('stageClearModal').classList.remove('active');

    this.selectedCharId = charId || 'intern';
    this.selectedMode = mode || 'stage';
    this.currentStageId = stageId || this.selectedStageId || '1-1';

    if (this.selectedMode === 'stage') {
      const ch1 = window.GAME_DATA.CHAPTERS.ch1;
      this.currentStage = ch1.stages.find(s => s.id === this.currentStageId) || ch1.stages[0];
      this.gameTime = this.currentStage.duration;
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

    choices.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'upgrade-card' + (ch.isSuper ? ' super' : '');
      card.innerHTML = `
        <div class="upgrade-card-icon">${ch.icon}</div>
        <div class="upgrade-card-details">
          <div class="upgrade-card-header">
            <span class="upgrade-card-title">${ch.title}</span>
            <span class="upgrade-card-type">${ch.typeText}</span>
          </div>
          <div class="upgrade-card-desc">${ch.desc}</div>
        </div>
      `;

      const selectAction = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (hasSelected) return;
        hasSelected = true;

        this.applyUpgrade(ch);

        setTimeout(() => {
          this.processNextLevelUp();
        }, 50);
      };

      card.addEventListener('pointerup', selectAction);
      card.addEventListener('click', selectAction);

      deck.appendChild(card);
    });

    modal.classList.add('active');
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
        icon: '🍖',
        title: '야근 영양제 섭취',
        typeText: '즉시 회복',
        desc: '즉시 체력을 40% 회복하고 코인 +100을 획득합니다.'
      });
    }

    return choices;
  }

  applyUpgrade(ch) {
    if (window.soundEngine) window.soundEngine.playLevelUp();

    if (ch.category === 'super_weapon') {
      if (!this.player.superWeapons.includes(ch.id)) {
        this.player.superWeapons.push(ch.id);
      }
      this.effectEngine.screenShake(12, 0.4);
      this.effectEngine.spawnShockwave(this.player.x, this.player.y, 200, '#ffd700');
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
    this.effectEngine.spawnFloatingText(this.player.x, this.player.y - 45, '🎁 보스 황금 상자 획득!!', '#ffd700');

    let evolved = false;
    Object.entries(this.player.weapons).forEach(([wId, lv]) => {
      if (evolved) return;
      const wDef = window.GAME_DATA.WEAPONS[wId];
      if (lv >= 8 && !this.player.superWeapons.includes(wDef.evolution)) {
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

    const goldReward = this.currentStage ? this.currentStage.goldReward : 200;

    // 영구 데이터 저장 및 다음 스테이지 자동 해금
    if (window.saveMgr) {
      window.saveMgr.saveStageClear(this.currentStageId, stars, goldReward);
      window.saveMgr.addGold(this.player.gold);
      window.saveMgr.data.totalRuns = (window.saveMgr.data.totalRuns || 0) + 1;
      window.saveMgr.data.totalKills = (window.saveMgr.data.totalKills || 0) + this.player.kills;
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

    const stageTitle = this.currentStage ? this.currentStage.name : '스테이지';
    const subEl = document.getElementById('stageClearSubtitle');
    if (subEl) subEl.innerText = `[${this.currentStageId}] ${stageTitle} 결재 승인 완료! (${stars}성 획득)`;

    const totalDur = this.currentStage ? this.currentStage.duration : 60;
    const durM = Math.floor(totalDur / 60).toString().padStart(2, '0');
    const durS = (totalDur % 60).toString().padStart(2, '0');

    document.getElementById('clearTimeVal').innerText = `${durM}:${durS}`;
    document.getElementById('clearKillsVal').innerText = `${this.player.kills} 마리`;
    document.getElementById('clearGoldVal').innerText = `+${goldReward + this.player.gold} 코인`;

    // 마지막 1-10 스테이지 여부에 따른 다음 스테이지 버튼 텍스트 변경
    const nextBtn = document.getElementById('btnNextStage');
    if (nextBtn) {
      if (this.currentStageId === '1-10') {
        nextBtn.innerText = '🏆 챕터 1 완전 정복! (로비로)';
        nextBtn.onclick = () => {
          modal.classList.remove('active');
          document.getElementById('charSelectModal').classList.add('active');
          this.state = 'char_select';
          this.renderStageSelectGrid();
        };
      } else {
        nextBtn.innerText = '다음 결재선(스테이지) 출근 ➔';
      }
    }

    modal.classList.add('active');
  }

  handleGameOver(isVictory = false) {
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

      if (window.saveMgr.data.totalKills >= 500) window.saveMgr.checkAchievement('ach_kills_500', true);
      if (window.saveMgr.data.totalKills >= 2000) window.saveMgr.checkAchievement('ach_kills_2000', true);
      if (window.saveMgr.getGold() >= 1000) window.saveMgr.checkAchievement('ach_gold_1000', true);
      if (window.saveMgr.getGold() >= 5000) window.saveMgr.checkAchievement('ach_gold_5000', true);

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

  updateHUD() {
    if (!this.player) return;

    document.getElementById('hudLevelBadge').innerText = `Lv.${this.player.level}`;
    const xpRate = Math.min(100, (this.player.exp / this.player.nextExp) * 100);
    document.getElementById('hudXpFill').style.width = `${xpRate}%`;
    document.getElementById('hudXpText').innerText = `${this.player.exp} / ${this.player.nextExp} XP`;

    document.getElementById('hudPlayerName').innerText = this.player.name;
    document.getElementById('hudPlayerRank').innerText = this.player.title;
    document.getElementById('hudPlayerAvatar').innerText = this.player.charData.avatar;

    const hpRate = Math.max(0, Math.min(100, (this.player.hp / this.player.maxHp) * 100));
    document.getElementById('hudHpFill').style.width = `${hpRate}%`;
    document.getElementById('hudHpText').innerText = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;

    document.getElementById('hudKillCount').innerText = `${this.player.kills}`;
    document.getElementById('hudGoldCount').innerText = `${this.player.gold}`;

    // 타이머
    const m = Math.floor(this.gameTime / 60).toString().padStart(2, '0');
    const s = Math.floor(this.gameTime % 60).toString().padStart(2, '0');
    document.getElementById('hudTimerText').innerText = `${m}:${s}`;

    // 대시 버튼 쿨타임 UI 업데이트
    const dashOverlay = document.getElementById('dashCooldownOverlay');
    const dashBtn = document.getElementById('btnMobileDash');
    if (dashOverlay && dashBtn) {
      if (this.player.dashCooldown > 0) {
        const maxCd = this.player.maxDashCooldown * (1 - this.player.stats.cdReduc * 0.4);
        const rate = this.player.dashCooldown / maxCd;
        dashOverlay.style.height = `${Math.min(100, Math.max(0, rate * 100))}%`;
        dashBtn.classList.add('cooling');
      } else {
        dashOverlay.style.height = '0%';
        dashBtn.classList.remove('cooling');
      }
    }

    // 무기 및 패시브 슬롯 렌더링
    const wSlots = document.getElementById('hudWeaponSlots');
    wSlots.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const wIds = Object.keys(this.player.weapons);
      const wId = wIds[i];
      const box = document.createElement('div');
      box.className = 'slot-box' + (wId ? ' active' : '');

      if (wId) {
        const isSuper = this.player.superWeapons.includes(`super_${wId}`);
        const wDef = window.GAME_DATA.WEAPONS[wId];
        const curLv = isSuper ? 8 : (this.player.weapons[wId] || 1);

        if (isSuper) box.classList.add('super');

        let dotsHtml = '';
        for (let d = 0; d < 8; d++) {
          dotsHtml += `<div class="level-dot ${d < curLv ? 'fill' : ''}"></div>`;
        }

        box.innerHTML = `
          <span class="slot-icon">${isSuper ? '⚡' : wDef.icon}</span>
          <div class="slot-level-dots">${dotsHtml}</div>
        `;
      }
      wSlots.appendChild(box);
    }

    const pSlots = document.getElementById('hudPassiveSlots');
    pSlots.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const pIds = Object.keys(this.player.passives);
      const pId = pIds[i];
      const box = document.createElement('div');
      box.className = 'slot-box' + (pId ? ' active' : '');

      if (pId) {
        const pDef = window.GAME_DATA.PASSIVES[pId];
        const curLv = this.player.passives[pId] || 1;

        let dotsHtml = '';
        for (let d = 0; d < 4; d++) {
          dotsHtml += `<div class="level-dot ${d < curLv ? 'fill' : ''}"></div>`;
        }

        box.innerHTML = `
          <span class="slot-icon">${pDef.icon}</span>
          <div class="slot-level-dots">${dotsHtml}</div>
        `;
      }
      pSlots.appendChild(box);
    }
  }

  // 리얼 테크 오피스 2D 맵 렌더러 (5대 테마 구역 + 정밀 오피스 벡터 그래픽)
  renderOfficeMap(ctx, camera) {
    const mapW = 2400;
    const mapH = 2400;
    const tileSize = 80;

    const startX = Math.max(0, Math.floor(camera.x / tileSize) * tileSize);
    const startY = Math.max(0, Math.floor(camera.y / tileSize) * tileSize);
    const endX = Math.min(mapW, startX + this.canvas.width + tileSize * 2);
    const endY = Math.min(mapH, startY + this.canvas.height + tileSize * 2);

    // 1. 구역별 바닥재 렌더링
    for (let x = startX; x < endX; x += tileSize) {
      for (let y = startY; y < endY; y += tileSize) {
        const sx = x - camera.x;
        const sy = y - camera.y;

        // 구역 판별:
        // NW (0..1200, 0..1200): 오픈 오피스 (차콜 직조 카펫 타일)
        // NE (1200..2400, 0..1200): 탕비실 & 라운지 (내추럴 오크 마루바닥)
        // SW (0..1200, 1200..2400): IDC 서버실 (천공 메탈 패널 & 하저드 라인)
        // SE (1200..2400, 1200..2400): 임원실 & 대회의실 (월넛 헤링본 & 버건디 러그)
        // Center (900..1500, 900..1500): 중앙 테라조 대리석 로비

        const inCenterLobby = (x >= 900 && x < 1500 && y >= 900 && y < 1500);
        const inPantry = (x >= 1200 && y < 1200);
        const inServerRoom = (x < 1200 && y >= 1200);
        const inExecutive = (x >= 1200 && y >= 1200);

        if (inCenterLobby) {
          // 중앙 테라조 대리석 로비
          ctx.fillStyle = ((x / tileSize + y / tileSize) % 2 === 0) ? '#1e293b' : '#334155';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          // 골드 트림 라인
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.15)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx, sy, tileSize, tileSize);
        } else if (inPantry) {
          // 탕비실 & 라운지 (오크 우드 플랭크)
          ctx.fillStyle = ((x / tileSize + y / tileSize) % 2 === 0) ? '#292524' : '#1c1917';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          // 우드 결 라인
          ctx.strokeStyle = 'rgba(180, 83, 9, 0.12)';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, tileSize, tileSize);
          ctx.beginPath();
          ctx.moveTo(sx, sy + 25);
          ctx.lineTo(sx + tileSize, sy + 25);
          ctx.moveTo(sx, sy + 55);
          ctx.lineTo(sx + tileSize, sy + 55);
          ctx.stroke();
        } else if (inServerRoom) {
          // IDC 서버실 (천공 강철 패널)
          ctx.fillStyle = ((x / tileSize + y / tileSize) % 2 === 0) ? '#090d16' : '#0f172a';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          // 펀칭 메탈 도트
          ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
          ctx.beginPath();
          ctx.arc(sx + 20, sy + 20, 2, 0, Math.PI * 2);
          ctx.arc(sx + 60, sy + 20, 2, 0, Math.PI * 2);
          ctx.arc(sx + 20, sy + 60, 2, 0, Math.PI * 2);
          ctx.arc(sx + 60, sy + 60, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, tileSize, tileSize);
        } else if (inExecutive) {
          // 임원실 & 대회의실 (월넛 & 버건디)
          ctx.fillStyle = ((x / tileSize + y / tileSize) % 2 === 0) ? '#181119' : '#221520';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.1)';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, tileSize, tileSize);
        } else {
          // 일반 오픈 오피스 (차콜 직조 타일)
          ctx.fillStyle = ((x / tileSize + y / tileSize) % 2 === 0) ? '#0f172a' : '#141e33';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, tileSize, tileSize);
        }
      }
    }

    // 2. 오피스 구역 타이틀 바닥 네온 마킹
    this.renderZoneSign(ctx, camera, 400, 200, '💻 DEV & DESIGN OPEN OFFICE', '#38bdf8');
    this.renderZoneSign(ctx, camera, 1800, 200, '☕ PANTRY & SNACK LOUNGE', '#fbbf24');
    this.renderZoneSign(ctx, camera, 400, 2100, '🖥️ IDC SERVER & INFRA ROOM', '#00f0ff');
    this.renderZoneSign(ctx, camera, 1800, 2100, '👔 EXECUTIVE SUITE & BOARDROOM', '#f43f5e');

    // 3. 중앙 비상구 엘리베이터 및 탈출 지점 (1200, 1200)
    const exitX = 1200 - camera.x;
    const exitY = 1200 - camera.y;
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.roundRect(exitX - 80, exitY - 80, 160, 160, 16);
    ctx.fill();
    ctx.stroke();

    // 엘리베이터 문 슬릿
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(exitX, exitY - 70);
    ctx.lineTo(exitX, exitY + 70);
    ctx.stroke();

    ctx.shadowBlur = 6;
    ctx.fillStyle = '#22c55e';
    ctx.font = '900 13px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMERGENCY ESCAPE ELEVATOR', exitX, exitY - 25);
    ctx.font = '900 18px "Pretendard", sans-serif';
    ctx.fillText('[ 20F ▲ ]', exitX, exitY + 5);
    ctx.font = 'bold 12px "Pretendard", sans-serif';
    ctx.fillText('🚨 정시 퇴근 탈출구', exitX, exitY + 30);
    ctx.restore();

    // 4. 맵 경계 벽면 렌더링
    this.renderMapBorders(ctx, camera, mapW, mapH);

    // 5. 캐릭터 주변 부드러운 야근 조명 비네팅 효과
    const pScreenX = this.player ? this.player.x - camera.x : this.canvas.width / 2;
    const pScreenY = this.player ? this.player.y - camera.y : this.canvas.height / 2;

    ctx.save();
    const vigGrad = ctx.createRadialGradient(pScreenX, pScreenY, 200, pScreenX, pScreenY, 700);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(0.65, 'rgba(3, 7, 18, 0.35)');
    vigGrad.addColorStop(1, 'rgba(2, 6, 23, 0.92)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  renderZoneSign(ctx, camera, x, y, text, color) {
    const sx = x - camera.x;
    const sy = y - camera.y;
    if (sx < -200 || sx > this.canvas.width + 200 || sy < -100 || sy > this.canvas.height + 100) return;

    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.font = '900 22px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, sx, sy);
    ctx.restore();
  }

  renderMapBorders(ctx, camera, mapW, mapH) {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.strokeRect(-camera.x, -camera.y, mapW, mapH);
    ctx.restore();
  }

  gameLoop(now) {
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.state === 'playing' && this.player) {
      // 1. 타이머 업데이트
      this.gameTime -= dt;
      if (this.gameTime <= 0) {
        this.gameTime = 0;
        this.handleGameOver(true);
      }

      // 2. 엔티티 업데이트
      this.player.update(dt, this.input);
      this.propMgr.resolveCollisions(this.player);

      this.weaponMgr.update(dt, this.player, this.monsterMgr.monsters, this.effectEngine);
      this.monsterMgr.update(dt, this.player, this.gameTime, this.effectEngine);
      this.monsterMgr.monsters.forEach(m => this.propMgr.resolveCollisions(m));

      this.propMgr.update(dt);
      this.dropMgr.update(dt, this.player, this.effectEngine);
      this.effectEngine.update(dt);

      this.updateHUD();
    }

    // 3. 카메라 추종
    if (this.player) {
      let shakeX = 0;
      let shakeY = 0;
      if (this.effectEngine.shakeMag > 0) {
        shakeX = (Math.random() - 0.5) * this.effectEngine.shakeMag;
        shakeY = (Math.random() - 0.5) * this.effectEngine.shakeMag;
      }
      this.camera.x = this.player.x - this.canvas.width / 2 + shakeX;
      this.camera.y = this.player.y - this.canvas.height / 2 + shakeY;
    }

    // 4. 렌더링
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.player) {
      this.renderOfficeMap(this.ctx, this.camera);
      this.propMgr.render(this.ctx, this.camera);
      this.dropMgr.render(this.ctx, this.camera);
      this.weaponMgr.render(this.ctx, this.camera);
      this.monsterMgr.render(this.ctx, this.camera);
      this.player.render(this.ctx, this.camera);
      this.effectEngine.render(this.ctx, this.camera);
    }

    requestAnimationFrame(t => this.gameLoop(t));
  }
}

window.GameEngine = GameEngine;

// 게임 인스턴스 초기화
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
