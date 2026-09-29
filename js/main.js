// Main Game Engine, Game Loop, UI Controller, Minimap & Custom Cursor

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('view');
    this.ctx = this.canvas.getContext('2d');
    this.minimapCanvas = document.getElementById('minimapView');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.state = 'town'; // 'town' or 'dungeon'

    this.player = null;
    this.townMgr = window.townMgr;
    this.dungeonMgr = new DungeonManager();
    this.effectMgr = window.effectMgr;
    this.soundMgr = window.soundMgr;
    this.accountMgr = window.accountMgr;

    this.camera = { x: 0, y: 0 };
    this.input = {
      w: false, a: false, s: false, d: false,
      space: false,
      mouseX: 0, mouseY: 0,
      mouseDown: false
    };

    this.hoveredEnemy = null;
    this.activeModal = null;
    this.lastTime = performance.now();
    this.autoSaveTimer = 0;

    // 1번: 무한 악몽 심연 10종 돌연변이 어픽스 & 고대 유물 시스템 상태
    this.selectedAffixes = ['corpse_explosion', 'vampiric', 'thunder_storm', 'ironclad'];
    this.currentRelicChoices = [];

    // B 항목: 시네마틱 슬로우 모션 & 승리 연출
    this.timeScale = 1.0;
    this.slowMoTimer = 0;
    this.victoryBanner = { active: false, timer: 0, text: '' };

    this.init();
  }

  // B 항목: 보스 처치 시 시네마틱 슬로우 모션 발동
  triggerCinematicSlowMo(duration = 1.2, bossName = '보스') {
    this.timeScale = 0.18; // 0.18배속으로 극적 감속
    this.slowMoTimer = duration;
    this.victoryBanner = {
      active: true,
      timer: duration + 1.5,
      text: `${bossName} 처치 완료! (BOSS DEFEATED)`
    };
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupInputListeners();
    this.setupUIBindings();
    this.setupTouchControls();

    // 99레벨 활성 캐릭터 로드
    this.loadActiveCharacter();

    const unlockAudio = () => {
      this.soundMgr.resume();
      this.soundMgr.playBGM('town');
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    requestAnimationFrame(time => this.gameLoop(time));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  loadActiveCharacter() {
    const charData = this.accountMgr.activeCharacter;
    this.player = new Player(charData);
    if (this.player.mercenaryId && window.MERCENARIES && window.MERCENARIES[this.player.mercenaryId]) {
      this.mercenary = new Mercenary(window.MERCENARIES[this.player.mercenaryId], this.player);
    } else {
      this.mercenary = null;
    }
    this.updateHUD();
    this.updateSkillbarUI();
  }

  returnToTown() {
    this.state = 'town';
    this.player.x = 400;
    this.player.y = 380;
    this.soundMgr.playBGM('town');
    this.effectMgr.addShockwave(this.player.x, this.player.y, 70, '#a044ff');
    this.effectMgr.addFloatingText(this.player.x, this.player.y - 20, '행성 기지로 귀환했습니다.', 'heal');
    this.accountMgr.saveActiveCharacterProgress(this.player);
    this.updateHUD();
  }

  enterDungeon(floor = 1) {
    this.state = 'dungeon';
    this.dungeonMgr.initFloor(floor, this.player);
    this.updateHUD();
  }

  setupInputListeners() {
    window.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();
      if (key === 'w') this.input.w = true;
      if (key === 'a') this.input.a = true;
      if (key === 's') this.input.s = true;
      if (key === 'd') this.input.d = true;

      // 스페이스바: 대시 / 구르기
      if (e.code === 'Space') {
        e.preventDefault();
        let ix = (this.input.d ? 1 : 0) - (this.input.a ? 1 : 0);
        let iy = (this.input.s ? 1 : 0) - (this.input.w ? 1 : 0);
        this.player.performDash(ix, iy);
      }

      // 1 ~ 5 스킬 시전
      if (['1', '2', '3', '4', '5'].includes(key)) {
        const slot = parseInt(key);
        const worldMouseX = this.input.mouseX + this.camera.x;
        const worldMouseY = this.input.mouseY + this.camera.y;
        const enemies = this.state === 'dungeon' ? this.dungeonMgr.enemies : [];
        SkillSystem.castSkill(this.player, slot, worldMouseX, worldMouseY, enemies);
      }

      if (key === 'q') {
        this.player.usePotion();
        this.updateHUD();
      }

      if (key === 't') {
        if (this.state === 'dungeon') {
          this.returnToTown();
        }
      }

      if (key === 'e') {
        if (this.state === 'town') {
          const npc = this.townMgr.checkInteraction(this.player);
          if (npc) this.handleNPCInteraction(npc);
        }
      }

      if (key === 'i') this.toggleModal('bag');
      if (key === 'k') this.toggleModal('skills');
      if (key === 'l') this.toggleModal('codex');
      if (key === 'p') this.toggleModal('pet');
      if (key === 'm') this.toggleModal('mercenary');
      if (key === 'r') this.toggleModal('research');
      if (key === 'u') this.toggleModal('relic_deck');
      if (key === 'y') this.toggleModal('affix');

      // 2번: 특수키 패링 (Shift / F)
      if (e.key === 'Shift' || key === 'f') {
        e.preventDefault();
        this.player.performParry();
      }
    });

    window.addEventListener('keyup', e => {
      const key = e.key.toLowerCase();
      if (key === 'w') this.input.w = false;
      if (key === 'a') this.input.a = false;
      if (key === 's') this.input.s = false;
      if (key === 'd') this.input.d = false;
    });

    this.canvas.addEventListener('mousemove', e => {
      this.input.mouseX = e.clientX;
      this.input.mouseY = e.clientY;
      const worldMouseX = this.input.mouseX + this.camera.x;
      const worldMouseY = this.input.mouseY + this.camera.y;
      this.player.angle = Math.atan2(worldMouseY - this.player.y, worldMouseX - this.player.x);

      // 적 타겟팅 호버 검사
      this.hoveredEnemy = null;
      if (this.state === 'dungeon') {
        for (let i = 0; i < this.dungeonMgr.enemies.length; i++) {
          const en = this.dungeonMgr.enemies[i];
          if (en.isAlive && Math.hypot(en.x - worldMouseX, en.y - worldMouseY) <= en.radius + 8) {
            this.hoveredEnemy = en;
            break;
          }
        }
      }
    });

    this.canvas.addEventListener('mousedown', e => {
      if (e.button === 0) {
        this.input.mouseDown = true;
        const worldMouseX = this.input.mouseX + this.camera.x;
        const worldMouseY = this.input.mouseY + this.camera.y;
        const enemies = this.state === 'dungeon' ? this.dungeonMgr.enemies : [];
        const dummy = this.state === 'town' ? this.townMgr.npcs.find(n => n.isDummy) : null;
        this.player.performBasicAttack(worldMouseX, worldMouseY, enemies, dummy);
      }
    });

    this.canvas.addEventListener('mouseup', e => {
      if (e.button === 0) this.input.mouseDown = false;
    });

    // 2번: 마우스 우클릭 패링 가드 (Sekiro / Elden Ring 스타일)
    this.canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      this.player.performParry();
    });
  }

  handleNPCInteraction(npc) {
    if (npc.id === 'portal') {
      this.openFloorSelectModal();
    } else if (npc.id === 'blacksmith') {
      this.openBlacksmithModal();
    } else if (npc.id === 'shop') {
      this.openShopModal();
    } else if (npc.id === 'mercenary') {
      this.toggleModal('mercenary');
    } else if (npc.id === 'research') {
      this.toggleModal('research');
    }
  }

  setupUIBindings() {
    // 🍔 모바일 햄버거 드로어 버튼 바인딩 (모바일 터치 즉각 반응 및 더블클릭/제스처 차단)
    const hamburgerBtn = document.getElementById('btnMobileHamburger');
    const sideDock = document.getElementById('sideNavDock');
    const backdrop = document.getElementById('menuDrawerBackdrop');
    const closeDrawerBtn = document.getElementById('btnCloseMobileDrawer');

    const closeMobileDrawer = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (sideDock) sideDock.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
    };

    const openMobileDrawer = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (sideDock) sideDock.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
    };

    if (hamburgerBtn) {
      let lastTrigger = 0;
      const toggleMenu = (e) => {
        const now = Date.now();
        if (now - lastTrigger < 200) return;
        lastTrigger = now;
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (sideDock && sideDock.classList.contains('open')) {
          closeMobileDrawer(e);
        } else {
          openMobileDrawer(e);
        }
      };
      hamburgerBtn.addEventListener('pointerdown', toggleMenu);
      hamburgerBtn.addEventListener('click', toggleMenu);
    }
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('pointerdown', closeMobileDrawer);
      closeDrawerBtn.addEventListener('click', closeMobileDrawer);
    }
    if (backdrop) {
      backdrop.addEventListener('pointerdown', closeMobileDrawer);
      backdrop.addEventListener('click', closeMobileDrawer);
    }

    // 📱 iOS/Safari 모바일 더블터치 화면 확대 방지
    let lastTouchTime = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchTime <= 300) {
        if (e.target && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }
      lastTouchTime = now;
    }, { passive: false });

    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });

    document.getElementById('btnSideBag').onclick = () => { closeMobileDrawer(); this.toggleModal('bag'); };
    document.getElementById('btnSideSkills').onclick = () => { closeMobileDrawer(); this.toggleModal('skills'); };
    document.getElementById('btnSideBlacksmith').onclick = () => { closeMobileDrawer(); this.openBlacksmithModal(); };
    document.getElementById('btnSideShop').onclick = () => { closeMobileDrawer(); this.openShopModal(); };
    document.getElementById('btnSideCodex').onclick = () => { closeMobileDrawer(); this.toggleModal('codex'); };
    document.getElementById('btnSidePet').onclick = () => { closeMobileDrawer(); this.toggleModal('pet'); };
    const btnMerc = document.getElementById('btnSideMercenary');
    if (btnMerc) btnMerc.onclick = () => { closeMobileDrawer(); this.toggleModal('mercenary'); };
    const btnRes = document.getElementById('btnSideResearch');
    if (btnRes) btnRes.onclick = () => { closeMobileDrawer(); this.toggleModal('research'); };
    const btnRelics = document.getElementById('btnSideRelics');
    if (btnRelics) btnRelics.onclick = () => { closeMobileDrawer(); this.toggleModal('relic_deck'); };
    const btnAffix = document.getElementById('btnSideAffix');
    if (btnAffix) btnAffix.onclick = () => { closeMobileDrawer(); this.toggleModal('affix'); };
    document.getElementById('btnSideAccount').onclick = () => { closeMobileDrawer(); this.toggleModal('account'); };

    document.getElementById('btnSideSound').onclick = () => {
      const isMuted = !this.soundMgr.isMuted;
      this.soundMgr.setMute(isMuted);
      const sb = document.getElementById('soundBadge') || document.getElementById('soundIcon');
      if (sb) sb.innerText = isMuted ? 'MUTE' : 'BGM';
    };

    document.getElementById('btnRecallRune').onclick = () => {
      if (this.state === 'dungeon') this.returnToTown();
    };

    const flaskBtn = document.getElementById('btnFlaskPotion');
    if (flaskBtn) {
      const triggerPotion = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.player.usePotion();
        this.updateHUD();
      };
      flaskBtn.addEventListener('pointerdown', triggerPotion);
      flaskBtn.addEventListener('click', triggerPotion);
    }

    // 2번: 패링 코어 오브 클릭 시 패링 발동
    const btnParry = document.getElementById('btnParryCore');
    if (btnParry) {
      btnParry.onclick = () => this.player.performParry();
    }

    document.getElementById('btnDashCore').onclick = () => {
      this.player.performDash(0, 0);
    };

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.onclick = () => this.closeAllModals();
    });

    document.getElementById('btnAutoEquip').onclick = () => {
      const changed = EquipmentManager.autoEquip(this.player);
      this.player.recalculateStats();
      this.updateHUD();
      this.renderBagUI();
      if (changed) {
        this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, '최적 장비 자동 장착 완료!', 'crit');
      } else {
        this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, '이미 최적의 장비를 착용 중입니다.', 'normal');
      }
    };
  }

  toggleModal(modalId) {
    if (this.activeModal === modalId) {
      this.closeAllModals();
      return;
    }
    this.closeAllModals();
    const el = document.getElementById('modal_' + modalId);
    if (el) {
      el.style.display = 'flex';
      this.activeModal = modalId;

      if (modalId === 'bag') this.renderBagUI();
      else if (modalId === 'skills') this.renderSkillsUI();
      else if (modalId === 'account') this.renderAccountUI();
      else if (modalId === 'codex') this.renderCodexUI('monsters');
      else if (modalId === 'pet') this.renderPetUI();
      else if (modalId === 'mercenary') this.renderMercenaryUI();
      else if (modalId === 'research') this.renderResearchUI();
      else if (modalId === 'affix') this.renderAffixUI();
      else if (modalId === 'relic_deck') this.renderRelicDeckUI();
    }
  }

  closeAllModals() {
    document.querySelectorAll('.game-modal').forEach(m => m.style.display = 'none');
    this.activeModal = null;
  }

  updateHUD() {
    if (!this.player) return;

    const jobInfo = CLASSES[this.player.job];

    const avatarIcon = this.player.job === 'warrior' ? '⚔️' : this.player.job === 'mage' ? '🪄' : this.player.job === 'rogue' ? '🗡️' : '🥊';
    document.getElementById('playerAvatarIcon').innerText = avatarIcon;
    const avatarImg = document.getElementById('playerAvatarImg');
    if (avatarImg) {
      avatarImg.src = `assets/portraits/${this.player.job}.jpg`;
      avatarImg.style.display = 'block';
    }
    document.getElementById('playerLevelBadge').innerText = `Lv.${this.player.level}`;

    const titleDef = (this.player.activeTitle && TITLES[this.player.activeTitle]) || TITLES.novice;
    const petDef = (this.player.activePet && PETS[this.player.activePet]) || PETS.drone;

    document.getElementById('playerNameText').innerHTML = `
      <span class="title-badge" title="${titleDef.desc}">${titleDef.icon} ${titleDef.name}</span>
      ${this.player.name}
      <span style="font-size:16px;cursor:pointer;margin-left:4px;" onclick="window.game.toggleModal('pet')" title="동행 펫: ${petDef.name} (${petDef.perkName})">${petDef.icon}</span>
    `;
    document.getElementById('playerJobTag').innerText = jobInfo.title;

    const hpRate = Math.max(0, Math.min(1, this.player.hp / this.player.statCache.maxHp));
    const mpRate = Math.max(0, Math.min(1, this.player.mp / this.player.statCache.maxMp));
    const expRate = Math.max(0, Math.min(1, this.player.exp / this.player.nextExp));

    document.getElementById('hpBarFill').style.width = `${hpRate * 100}%`;
    document.getElementById('txtHpVal').innerText = `${Math.floor(this.player.hp)} / ${this.player.statCache.maxHp}`;

    document.getElementById('mpBarFill').style.width = `${mpRate * 100}%`;
    document.getElementById('txtMpVal').innerText = `${Math.floor(this.player.mp)} / ${this.player.statCache.maxMp}`;

    document.getElementById('expBarFill').style.width = `${expRate * 100}%`;

    const passivesDeckEl = document.getElementById('activePassivesDeck');
    passivesDeckEl.innerHTML = '';
    jobInfo.passives.forEach(p => {
      const chip = document.createElement('div');
      chip.className = 'passive-rune-chip';
      chip.title = `${p.name}: ${p.desc}`;
      chip.innerHTML = `<i>◆</i><span>${p.name}</span>`;
      passivesDeckEl.appendChild(chip);
    });

    // 4순위: 차원 성소 버프 칩 표시
    if (this.player.buffs && this.player.buffs.berserk > 0) {
      const bChip = document.createElement('div');
      bChip.className = 'passive-rune-chip';
      bChip.style.borderColor = '#ff3344';
      bChip.style.color = '#ff99aa';
      bChip.title = '광전사 버프: 공속+60%, 이속+35%, 치명+20%';
      bChip.innerHTML = `<i>🔥</i><span>광전사 ${Math.ceil(this.player.buffs.berserk)}s</span>`;
      passivesDeckEl.appendChild(bChip);
    }
    if (this.player.buffs && this.player.buffs.shield > 0) {
      const sChip = document.createElement('div');
      sChip.className = 'passive-rune-chip';
      sChip.style.borderColor = '#00ffaa';
      sChip.style.color = '#aaffdd';
      sChip.title = `비전 보호막: ${this.player.buffs.shield} 피해 흡수`;
      sChip.innerHTML = `<i>🛡️</i><span>보호막 ${this.player.buffs.shield}</span>`;
      passivesDeckEl.appendChild(sChip);
    }

    if (this.state === 'town') {
      document.getElementById('locationText').innerText = this.player.isTowerDestroyed ? '평화의 캠프' : '베이스캠프';
    } else {
      if (this.dungeonMgr.currentFloor > 100) {
        document.getElementById('locationText').innerText = `심연 ${this.dungeonMgr.currentFloor}F`;
      } else {
        document.getElementById('locationText').innerText = `마계탑 ${this.dungeonMgr.currentFloor}F`;
      }
    }
    document.getElementById('goldText').innerText = this.player.gold.toLocaleString();

    const recallBtn = document.getElementById('btnRecallRune');
    const minimapBox = document.getElementById('minimapContainer');
    if (recallBtn) recallBtn.style.display = this.state === 'dungeon' ? 'flex' : 'none';
    if (minimapBox) {
      minimapBox.style.display = this.state === 'dungeon' ? 'flex' : 'none';
      document.getElementById('minimapFloorTag').innerText = this.dungeonMgr.currentFloor > 100 ? `악몽 ${this.dungeonMgr.currentFloor}F` : `${this.dungeonMgr.currentFloor}F`;
    }

    document.getElementById('txtFlaskCount').innerText = this.player.potions;
  }

  updateSkillbarUI() {
    const jobInfo = CLASSES[this.player.job];
    const skillbarEl = document.getElementById('arcaneSkillDeck');
    skillbarEl.innerHTML = '';

    jobInfo.skills.forEach(skill => {
      const slotDiv = document.createElement('div');
      slotDiv.className = 'skill-rune-slot';
      const isUnlocked = this.player.level >= skill.unlockLevel;

      if (!isUnlocked) {
        slotDiv.classList.add('locked');
      }

      const runeKey = (this.player.skillRunes && this.player.skillRunes[skill.id]) || 'none';
      const runeDef = window.SKILL_ELEMENTAL_RUNES && window.SKILL_ELEMENTAL_RUNES[runeKey];
      if (runeDef && runeKey !== 'none') {
        slotDiv.style.borderColor = runeDef.color;
        slotDiv.style.boxShadow = `0 0 12px ${runeDef.color}88`;
      }

      slotDiv.innerHTML = `
        <span class="skill-hotkey-badge">${skill.slot}</span>
        <span class="skill-rune-icon">${skill.icon}</span>
        ${runeDef && runeKey !== 'none' ? `<span class="skill-element-badge" style="color:${runeDef.color};">${runeDef.icon}</span>` : ''}
        ${!isUnlocked ? `<span class="skill-lock-overlay">Lv.${skill.unlockLevel}</span>` : ''}
        <div class="skill-cd-sweeper" id="cd_sweeper_${skill.id}"></div>
      `;

      let lastCastTime = 0;
      const triggerSkillCast = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const now = Date.now();
        if (now - lastCastTime < 120) return;
        lastCastTime = now;

        let worldTargetX = this.input.mouseX + this.camera.x;
        let worldTargetY = this.input.mouseY + this.camera.y;
        if (!this.input.mouseX && !this.input.mouseY) {
          worldTargetX = this.player.x + Math.cos(this.player.angle) * 140;
          worldTargetY = this.player.y + Math.sin(this.player.angle) * 140;
        }
        if (this.state === 'dungeon' && this.dungeonMgr.enemies.length > 0) {
          let nearest = null;
          let minDist = 350;
          this.dungeonMgr.enemies.forEach(en => {
            if (en.isAlive) {
              const d = Math.hypot(en.x - this.player.x, en.y - this.player.y);
              if (d < minDist) {
                minDist = d;
                nearest = en;
              }
            }
          });
          if (nearest) {
            worldTargetX = nearest.x;
            worldTargetY = nearest.y;
          }
        }
        const enemies = this.state === 'dungeon' ? this.dungeonMgr.enemies : [];
        SkillSystem.castSkill(this.player, skill.slot, worldTargetX, worldTargetY, enemies);
      };

      slotDiv.addEventListener('pointerdown', triggerSkillCast);
      slotDiv.addEventListener('click', triggerSkillCast);

      skillbarEl.appendChild(slotDiv);
    });
  }

  renderBagUI() {
    const equipSlotsEl = document.getElementById('equipSlots');
    const invSlotsEl = document.getElementById('inventorySlots');
    const playerStatsEl = document.getElementById('playerStatsDisplay');

    const bagPortraitEl = document.getElementById('bagCharPortrait');
    const bagNameEl = document.getElementById('bagCharName');
    const bagJobEl = document.getElementById('bagCharJob');
    if (bagPortraitEl) {
      bagPortraitEl.src = `assets/portraits/${this.player.job}.jpg`;
    }
    if (bagNameEl) {
      bagNameEl.innerText = this.player.name;
    }
    if (bagJobEl) {
      bagJobEl.innerText = `${CLASSES[this.player.job].name} (${CLASSES[this.player.job].title})`;
    }

    const s = this.player.statCache;
    const cleanCritRate = (Math.round((s.critRate || 0) * 1000) / 10).toFixed(1);
    const cleanCritDmg = (Math.round((s.critDmg || 0) * 100) / 100).toFixed(1);
    const cleanEva = (Math.round((s.eva || 0) * 1000) / 10).toFixed(1);
    const cleanAtkSpeed = (Math.round((s.atkSpeed || 0) * 100) / 100).toFixed(2);

    playerStatsEl.innerHTML = `
      <div class="stat-row"><b>직업</b><span>${CLASSES[this.player.job].name} (${CLASSES[this.player.job].weaponName} 전용)</span></div>
      <div class="stat-row"><b>전투력 (GS)</b><span style="color:#ffd700;font-weight:900;">${this.calculateTotalGS().toLocaleString()}</span></div>
      <div class="stat-row"><b>공격력</b><span>${s.atk}</span></div>
      <div class="stat-row"><b>방어력</b><span>${s.def}</span></div>
      <div class="stat-row"><b>힘 / 민첩 / 지능</b><span>${s.str} / ${s.dex} / ${s.int}</span></div>
      <div class="stat-row"><b>치명타율 / 배율</b><span>${cleanCritRate}% / ${cleanCritDmg}x</span></div>
      <div class="stat-row"><b>회피율 / 공속</b><span>${cleanEva}% / ${cleanAtkSpeed}x</span></div>
    `;

    equipSlotsEl.innerHTML = '';
    const slots = [
      { key: 'weapon', name: '무기' },
      { key: 'helmet', name: '투구' },
      { key: 'armor', name: '갑옷' },
      { key: 'gloves', name: '장갑' },
      { key: 'boots', name: '신발' }
    ];

    slots.forEach(slotDef => {
      const item = this.player.equip[slotDef.key];
      const div = document.createElement('div');
      div.className = 'item-box' + (item ? ` rarity-${item.rarity}` : ' empty');

      if (item) {
        div.innerHTML = `
          <span class="item-ico">${item.icon}</span>
          <span class="item-name">${item.enhance > 0 ? `+${item.enhance} ` : ''}${item.name}</span>
          ${item.sockets ? `<span class="item-sockets">${'💎'.repeat(item.gemList.length)}${'⭕'.repeat(item.sockets - item.gemList.length)}</span>` : ''}
        `;
        div.onmouseenter = e => this.showItemTooltip(e, item, null);
        div.onmouseleave = () => this.hideItemTooltip();
        div.onclick = () => {
          if (this.player.inventory.length < 36) {
            this.player.inventory.push(item);
            this.player.equip[slotDef.key] = null;
            this.player.recalculateStats();
            this.updateHUD();
            this.renderBagUI();
            this.hideItemTooltip();
          }
        };
      } else {
        div.innerHTML = `<span class="empty-lbl">${slotDef.name}</span>`;
      }
      equipSlotsEl.appendChild(div);
    });

    invSlotsEl.innerHTML = '';
    for (let i = 0; i < 36; i++) {
      const item = this.player.inventory[i];
      const div = document.createElement('div');
      div.className = 'item-box' + (item ? (item.isGem ? ' item-gem' : ` rarity-${item.rarity}`) : ' empty');

      if (item) {
        div.innerHTML = `
          <span class="item-ico">${item.icon}</span>
          <span class="item-name">${item.enhance > 0 ? `+${item.enhance} ` : ''}${item.name}</span>
          ${item.sockets ? `<span class="item-sockets">${'💎'.repeat((item.gemList || []).length)}${'⭕'.repeat(item.sockets - (item.gemList || []).length)}</span>` : ''}
        `;
        const currentEquip = item.slot ? this.player.equip[item.slot] : null;
        div.onmouseenter = e => this.showItemTooltip(e, item, currentEquip);
        div.onmouseleave = () => this.hideItemTooltip();
        div.onclick = () => {
          const check = EquipmentManager.canEquip(this.player, item);
          if (!check.ok) {
            alert(check.reason);
            return;
          }
          this.player.inventory.splice(i, 1);
          if (currentEquip) {
            this.player.inventory.push(currentEquip);
          }
          this.player.equip[item.slot] = item;
          this.player.recalculateStats();
          if (this.soundMgr) this.soundMgr.playItemEquip();
          this.updateHUD();
          this.renderBagUI();
          this.hideItemTooltip();
        };
      }
      invSlotsEl.appendChild(div);
    }
  }

  calculateTotalGS() {
    let total = 0;
    Object.values(this.player.equip).forEach(eq => {
      if (eq) total += EquipmentManager.calculateItemScore(eq);
    });
    return total;
  }

  showItemTooltip(e, item, equippedItem) {
    const tip = document.getElementById('itemTooltip');
    if (!tip || !item) return;

    if (item.isGem) {
      let html = `
        <div class="tip-header" style="color:${item.color || '#ffd700'}">
          <b>${item.icon || '💎'} ${item.name}</b>
          <span style="color:#ffd700;">[${item.tier}티어 보석]</span>
        </div>
        <div class="tip-sub" style="color:#00ffaa;margin:6px 0;">부여 효과: <b>${item.desc}</b></div>
        <hr>
        <div style="font-size:12px;color:#c9bede;line-height:1.5;">
          • 장비의 빈 소켓(⭕)에 결속하여 능력치 증폭<br>
          • 대장간 [💎 보석 세공 & 합성] 탭에서 동일 보석 3개로 다음 티어 연성 가능
        </div>
      `;
      tip.innerHTML = html;
      tip.style.display = 'block';
      tip.style.left = `${Math.min(window.innerWidth - 280, e.clientX + 16)}px`;
      tip.style.top = `${Math.min(window.innerHeight - 200, e.clientY + 16)}px`;
      return;
    }

    if (item.isRunestone || (item.key && window.RUNESTONES && window.RUNESTONES[item.key])) {
      const rune = item.isRunestone ? item : window.RUNESTONES[item.key];
      let html = `
        <div class="tip-header" style="color:${rune.color || '#00e5ff'}">
          <b>${rune.icon || '🌀'} ${rune.name}</b>
          <span style="color:#00e5ff;">[고대 각인 룬스톤]</span>
        </div>
        <div class="tip-sub" style="color:#00ffaa;margin:6px 0;">각인 효과: <b>${rune.desc}</b></div>
        <hr>
        <div style="font-size:12px;color:#c9bede;line-height:1.5;">
          • 장비에 영구 각인하여 강력한 고유 옵션 부여<br>
          • 대장간 [🌀 룬스톤 각인] 탭에서 원하는 장비에 각인 가능
        </div>
      `;
      tip.innerHTML = html;
      tip.style.display = 'block';
      tip.style.left = `${Math.min(window.innerWidth - 280, e.clientX + 16)}px`;
      tip.style.top = `${Math.min(window.innerHeight - 200, e.clientY + 16)}px`;
      return;
    }

    let html = `
      <div class="tip-header" style="color:${item.color || '#fff'}">
        <b>${item.enhance > 0 ? `+${item.enhance} ` : ''}${item.name}</b>
        <span>[${item.rarityName}]</span>
      </div>
      <div class="tip-sub">아이템 레벨: Lv.${item.level} | ${item.slot === 'weapon' ? item.weaponType : item.armorTypeName || '방어구'}</div>
      ${item.reqClassName ? `<div class="tip-req" style="color:#ffcc00;margin-top:4px;">착용 가능: ${item.reqClassName} 전용</div>` : ''}
      <hr>
      <div class="tip-stats">
    `;

    if (item.baseStat) {
      if (item.baseStat.atk) {
        const cur = (equippedItem && equippedItem.baseStat.atk) || 0;
        const diff = item.baseStat.atk - cur;
        html += `<div>기본 공격력: <b>+${item.baseStat.atk}</b> ${this.formatDiff(diff)}</div>`;
      }
      if (item.baseStat.def) {
        const cur = (equippedItem && equippedItem.baseStat.def) || 0;
        const diff = item.baseStat.def - cur;
        html += `<div>기본 방어력: <b>+${item.baseStat.def}</b> ${this.formatDiff(diff)}</div>`;
      }
      if (item.baseStat.maxHp) {
        const cur = (equippedItem && equippedItem.baseStat.maxHp) || 0;
        const diff = item.baseStat.maxHp - cur;
        html += `<div>최대 체력: <b>+${item.baseStat.maxHp}</b> ${this.formatDiff(diff)}</div>`;
      }
    }

    if (item.subStats && item.subStats.length > 0) {
      html += `<hr><div class="tip-substats">`;
      item.subStats.forEach(sub => {
        html += `<div style="color:#00ffaa">• ${sub.text}</div>`;
      });
      html += `</div>`;
    }

    if (item.runestone && window.RUNESTONES && window.RUNESTONES[item.runestone]) {
      const rune = window.RUNESTONES[item.runestone];
      html += `<hr><div class="tip-runestone" style="color:${rune.color};font-size:12px;">🌀 각인된 룬: <b>${rune.name}</b> (+${rune.desc})</div>`;
    }

    if (item.sockets > 0) {
      const gemCount = (item.gemList || []).length;
      html += `<hr><div class="tip-sockets" style="color:#00f0ff">보석 소켓: ${gemCount}/${item.sockets} 개 결속됨</div>`;
      if (item.gemList && item.gemList.length > 0) {
        item.gemList.forEach(gKey => {
          const g = GEMS[gKey];
          if (g) {
            html += `<div style="font-size:11px;color:${g.color || '#fff'};margin-left:6px;margin-top:2px;">💎 [${g.name}] : ${g.desc}</div>`;
          }
        });
      }
    }

    // 2번: 세트 아이템 정보 & 활성화 보너스 카운터
    if (item.setId && window.SET_ITEMS && window.SET_ITEMS[item.setId]) {
      const setDef = window.SET_ITEMS[item.setId];
      let equippedCount = 0;
      if (this.player && this.player.equip) {
        Object.values(this.player.equip).forEach(eq => {
          if (eq && eq.setId === item.setId) equippedCount++;
        });
      }
      html += `<hr><div class="tip-set" style="margin-top:6px;">
        <div style="color:${setDef.color || '#c084fc'};font-weight:900;font-size:13px;">${setDef.name} (${equippedCount}/5)</div>`;
      setDef.pieces.forEach(p => {
        const isActive = equippedCount >= p.count;
        html += `<div style="font-size:11px;margin-top:3px;color:${isActive ? '#00ffaa' : '#777'};">
          ${isActive ? '✔ ' : '○ '}(${p.count}세트) ${p.desc}
        </div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
    tip.innerHTML = html;
    tip.style.display = 'block';
    tip.style.left = `${Math.min(window.innerWidth - 280, e.clientX + 16)}px`;
    tip.style.top = `${Math.min(window.innerHeight - 320, e.clientY + 16)}px`;
  }

  formatDiff(diff) {
    const rounded = Math.round(diff * 10) / 10;
    if (rounded > 0) return `<span style="color:#00ffaa;font-weight:900;">(+${rounded})</span>`;
    if (rounded < 0) return `<span style="color:#ff3366;font-weight:900;">(${rounded})</span>`;
    return `<span style="color:#888;">(=)</span>`;
  }

  hideItemTooltip() {
    const tip = document.getElementById('itemTooltip');
    if (tip) tip.style.display = 'none';
  }

  renderSkillsUI() {
    const cls = CLASSES[this.player.job];
    const activeListEl = document.getElementById('activeSkillsList');
    const passiveListEl = document.getElementById('passiveSkillsList');

    activeListEl.innerHTML = '';
    cls.skills.forEach(s => {
      const isUnlocked = this.player.level >= s.unlockLevel;
      const card = document.createElement('div');
      card.className = 'skill-card' + (isUnlocked ? '' : ' locked');

      let runeHtml = '';
      if (isUnlocked && window.SKILL_ELEMENTAL_RUNES) {
        const currentRuneKey = (this.player.skillRunes && this.player.skillRunes[s.id]) || 'none';
        const currentRune = window.SKILL_ELEMENTAL_RUNES[currentRuneKey] || window.SKILL_ELEMENTAL_RUNES.none;

        const chipsHtml = Object.entries(window.SKILL_ELEMENTAL_RUNES).map(([rKey, rDef]) => {
          const isSelected = currentRuneKey === rKey;
          return `<button class="skill-rune-chip ${isSelected ? 'active' : ''}" style="${isSelected ? `border-color:${rDef.color};box-shadow:0 0 10px ${rDef.color}88;color:${rDef.color}` : ''}" onclick="window.game.setSkillRuneAction('${s.id}', '${rKey}')" title="${rDef.desc}">${rDef.icon} ${rDef.name.split(' ')[0]}</button>`;
        }).join('');

        runeHtml = `
          <div class="skill-rune-selector">
            <div style="font-size:12px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">
              <span style="color:#ffd700;font-weight:700;">🔮 원소 특성화 룬 각인</span>
              <span style="color:${currentRune.color};font-size:11px;">[현재: ${currentRune.icon} ${currentRune.name}]</span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
              ${chipsHtml}
            </div>
            <div style="font-size:11px;color:#c9bede;background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:4px;">
              속성 효과: <span style="color:${currentRune.color};">${currentRune.desc}</span>
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="sc-header">
          <span style="font-size:24px;">${s.icon}</span>
          <b style="color:#fff;font-size:15px;">${s.name} (슬롯 ${s.slot})</b>
          <span class="sc-tag">${isUnlocked ? '해금 완료 (사용 가능)' : `Lv.${s.unlockLevel} 필요`}</span>
        </div>
        <div class="sc-body">${s.desc}</div>
        <div class="sc-footer">마나 소모: ${s.cost} MP | 쿨타임: ${s.cd}초 | 위력: ${(s.dmgRatio * 100).toFixed(0)}%</div>
        ${runeHtml}
      `;
      activeListEl.appendChild(card);
    });

    passiveListEl.innerHTML = '';
    cls.passives.forEach(p => {
      const card = document.createElement('div');
      card.className = 'skill-card passive';
      card.innerHTML = `
        <div class="sc-header">
          <span style="font-size:22px;">✨</span>
          <b style="color:#00ffaa;font-size:15px;">${p.name}</b>
          <span class="sc-tag auto-active">상시 자동 적용</span>
        </div>
        <div class="sc-body">${p.desc}</div>
      `;
      passiveListEl.appendChild(card);
    });
  }

  setSkillRuneAction(skillId, runeKey) {
    if (!this.player.skillRunes) this.player.skillRunes = {};
    this.player.skillRunes[skillId] = runeKey;
    const runeDef = (window.SKILL_ELEMENTAL_RUNES && window.SKILL_ELEMENTAL_RUNES[runeKey]) || { name: '기본', icon: '⚪', color: '#fff' };

    if (this.effectMgr) {
      this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, `${runeDef.icon} [${runeDef.name.split(' ')[0]}] 룬 각인!`, 'crit');
      this.effectMgr.addShockwave(this.player.x, this.player.y, 60, runeDef.color);
    }
    if (this.soundMgr) this.soundMgr.playGem();
    this.accountMgr.saveActiveCharacterProgress(this.player);
    this.renderSkillsUI();
    this.updateSkillbarUI();
  }

  openBlacksmithModal() {
    this.toggleModal('blacksmith');
    this.renderBlacksmithUI('enhance');
  }

  renderBlacksmithUI(tab = 'enhance') {
    const container = document.getElementById('blacksmithContent');
    const matDisplay = document.getElementById('blacksmithMaterials');
    const stones = this.player.materials.upgrade_stone || 0;
    const iron = this.player.materials.iron_ore || 0;
    const shards = this.player.materials.dimension_shard || 0;
    const gold = Number(this.player.gold) || 0;

    // 탭 버튼 활성화 상태 갱신
    ['enhance', 'disassemble', 'craft', 'alchemy', 'runestone'].forEach(t => {
      const btn = document.getElementById(`bs_tab_${t}`);
      if (btn) {
        if (t === tab) btn.classList.add('gold-btn');
        else btn.classList.remove('gold-btn');
      }
    });

    matDisplay.innerHTML = `
      <div class="bs-mat-strip">
        <span>강화석: <b>${stones}</b>개</span>
        <span>철광석: <b>${iron}</b>개</span>
        <span>차원 파편: <b>${shards}</b>개</span>
        <span>보유 골드: <b>${gold.toLocaleString()} G</b></span>
      </div>
    `;

    if (tab === 'enhance') {
      const allItems = [
        ...Object.entries(this.player.equip).filter(([k, it]) => Boolean(it)).map(([k, it]) => ({ item: it, isEquipped: true })),
        ...this.player.inventory.filter(it => it && (it.type === 'weapon' || it.type === 'armor' || it.type === 'accessory' || it.type === 'shield')).map(it => ({ item: it, isEquipped: false }))
      ];

      container.innerHTML = `
        <div class="forge-container">
          <div class="forge-item-picker">
            <div class="forge-sub-title">제련 대상 장비 선택 (착용 장비 & 가방)</div>
            <div id="enhanceItemList" class="forge-gear-grid"></div>
          </div>
          <div class="forge-chamber" id="enhanceDetailBox">
            <div class="forge-empty-prompt">
              목록에서 제련할 장비를 선택하세요.<br>
              <span style="font-size:11px;color:#c4b5fd;margin-top:6px;display:inline-block;">+15단계까지 제련 가능하며 단계마다 능력치가 +12%씩 대폭 증가합니다.</span>
            </div>
          </div>
        </div>
      `;

      const grid = document.getElementById('enhanceItemList');
      if (allItems.length === 0) {
        grid.innerHTML = '<div style="color:#a496bd;font-size:12px;padding:20px;grid-column:span 4;text-align:center;">제련 가능한 장비가 없습니다.</div>';
      } else {
        allItems.forEach(({ item, isEquipped }, idx) => {
          const card = document.createElement('div');
          card.className = `forge-gear-card rarity-${item.rarity}`;
          card.id = `forge_card_${item.id || idx}`;
          card.innerHTML = `
            <span class="forge-enhance-badge">+${item.enhance}</span>
            ${isEquipped ? '<span class="forge-equip-tag">착용</span>' : ''}
            <div class="forge-gear-icon">${item.icon || '⚔️'}</div>
            <div class="forge-gear-name" title="${item.name}">${item.name}</div>
          `;
          card.onclick = () => this.selectEnhanceItem(item, card.id);
          grid.appendChild(card);
        });

        // 첫 번째 아이템 자동 선택
        if (allItems.length > 0) {
          const first = allItems[0];
          this.selectEnhanceItem(first.item, `forge_card_${first.item.id || 0}`);
        }
      }
    } else if (tab === 'disassemble') {
      const dismantleable = this.player.inventory.filter(it => it && (it.type === 'weapon' || it.type === 'armor' || it.type === 'accessory' || it.type === 'shield'));
      container.innerHTML = `
        <div style="background:rgba(14,8,24,0.9);border:1px solid rgba(160,110,240,0.25);border-radius:8px;padding:12px;margin-top:10px;">
          <div class="forge-sub-title">장비 분해 (철광석 및 강화석 환원)</div>
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <button class="game-btn" onclick="window.game.disassembleBulk('normal')">일반 등급 일괄 분해</button>
            <button class="game-btn" onclick="window.game.disassembleBulk('magic')">매직 이하 일괄 분해</button>
            <button class="game-btn" onclick="window.game.disassembleBulk('rare')">레어 이하 일괄 분해</button>
          </div>
          <div id="disassembleItemList" class="forge-gear-grid" style="max-height:300px;"></div>
        </div>
      `;
      const grid = document.getElementById('disassembleItemList');
      if (dismantleable.length === 0) {
        grid.innerHTML = '<div style="color:#a496bd;font-size:12px;padding:24px;text-align:center;grid-column:span 4;">가방에 분해할 장비가 없습니다.</div>';
      } else {
        dismantleable.forEach((item, idx) => {
          const invIdx = this.player.inventory.indexOf(item);
          const card = document.createElement('div');
          card.className = `forge-gear-card rarity-${item.rarity}`;
          card.innerHTML = `
            <span class="forge-enhance-badge">+${item.enhance}</span>
            <div class="forge-gear-icon">${item.icon || '⚔️'}</div>
            <div class="forge-gear-name" title="${item.name}">${item.name}</div>
          `;
          card.onclick = () => {
            if (confirm(`[${item.name}]을(를) 분해하여 철광석과 강화석을 추출하시겠습니까?`)) {
              const res = EquipmentManager.disassembleItem(this.player, invIdx);
              alert(res.msg);
              this.renderBlacksmithUI('disassemble');
              this.updateHUD();
            }
          };
          grid.appendChild(card);
        });
      }
    } else if (tab === 'craft') {
      const cls = CLASSES[this.player.job];
      const shardOwn = this.player.materials.dimension_shard || 0;
      const ironOwn = this.player.materials.iron_ore || 0;
      const goldOwn = Number(this.player.gold) || 0;

      const canUnique = shardOwn >= 5 && ironOwn >= 20 && goldOwn >= 3000;
      const canEpic = shardOwn >= 15 && ironOwn >= 50 && goldOwn >= 10000;

      container.innerHTML = `
        <div style="background:rgba(14,8,24,0.9);border:1px solid rgba(160,110,240,0.25);border-radius:8px;padding:12px;margin-top:10px;">
          <div class="forge-sub-title">장비 제작 - ${cls.name} 전용 전설 무기 주조</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:12px;margin-top:10px;">
            <div class="craft-card" style="background:rgba(25,12,40,0.85);border:1.5px solid #b55fe6;border-radius:8px;padding:14px;">
              <b style="color:#b55fe6;font-size:15px;display:block;margin-bottom:6px;">[유니크] ${cls.name} 전용 ${cls.weaponName}</b>
              <div style="font-size:12px;color:#c9bede;margin-bottom:10px;">
                차원의 파편: <b style="color:${shardOwn >= 5 ? '#00ffaa' : '#ff5566'};">${shardOwn}/5</b> |
                철광석: <b style="color:${ironOwn >= 20 ? '#00ffaa' : '#ff5566'};">${ironOwn}/20</b> |
                비용: <b style="color:${goldOwn >= 3000 ? '#ffd700' : '#ff5566'};">3,000 G</b>
              </div>
              <button class="game-btn ${canUnique ? 'gold-btn' : ''}" style="width:100%;${canUnique ? '' : 'opacity:0.5;cursor:not-allowed;'}" onclick="window.game.craftItem('unique', 'weapon')">유니크 무기 주조</button>
            </div>
            <div class="craft-card" style="background:rgba(35,16,10,0.85);border:1.5px solid #ff9900;border-radius:8px;padding:14px;">
              <b style="color:#ff9900;font-size:15px;display:block;margin-bottom:6px;">[에픽] ${cls.name} 전용 ${cls.weaponName}</b>
              <div style="font-size:12px;color:#c9bede;margin-bottom:10px;">
                차원의 파편: <b style="color:${shardOwn >= 15 ? '#00ffaa' : '#ff5566'};">${shardOwn}/15</b> |
                철광석: <b style="color:${ironOwn >= 50 ? '#00ffaa' : '#ff5566'};">${ironOwn}/50</b> |
                비용: <b style="color:${goldOwn >= 10000 ? '#ffd700' : '#ff5566'};">10,000 G</b>
              </div>
              <button class="game-btn ${canEpic ? 'gold-btn' : ''}" style="width:100%;${canEpic ? '' : 'opacity:0.5;cursor:not-allowed;'}" onclick="window.game.craftItem('epic', 'weapon')">에픽 무기 주조</button>
            </div>
          </div>
        </div>
      `;
    } else if (tab === 'alchemy') {
      this.renderJewelAlchemyTab(container);
    } else if (tab === 'runestone') {
      this.renderRunestoneTab(container);
    }
  }

  selectEnhanceItem(item, cardId) {
    if (cardId) {
      document.querySelectorAll('.forge-gear-card').forEach(c => c.classList.remove('selected'));
      const activeCard = document.getElementById(cardId);
      if (activeCard) activeCard.classList.add('selected');
    }

    const box = document.getElementById('enhanceDetailBox');
    if (!box) return;

    const costGold = Math.floor((item.enhance + 1) * 200 * (1 + item.level / 10));
    const costStones = Math.floor((item.enhance + 1) * 1.5);
    const successRates = [1.0, 0.95, 0.90, 0.80, 0.70, 0.60, 0.50, 0.40, 0.30, 0.25, 0.20, 0.15, 0.10, 0.07, 0.05];
    const rate = successRates[Math.min(successRates.length - 1, item.enhance)] || 0.05;
    const ratePct = Math.round(rate * 100);

    const curAtk = item.baseStat.atk || 0;
    const nextAtk = curAtk ? Math.floor(curAtk * 1.12) : null;
    const curDef = item.baseStat.def || 0;
    const nextDef = curDef ? Math.floor(curDef * 1.12) : null;

    const hasGold = this.player.gold >= costGold;
    const hasStones = (this.player.materials.upgrade_stone || 0) >= costStones;
    const isMax = item.enhance >= 15;
    const canEnhance = hasGold && hasStones && !isMax;

    box.innerHTML = `
      <div class="forge-item-header">
        <div class="forge-item-icon-box" style="border-color:${item.color};">${item.icon || '⚔️'}</div>
        <div>
          <div style="font-family:var(--font-title);font-size:15px;color:${item.color};font-weight:800;">
            ${item.name} <span style="color:#ffd700;margin-left:4px;">[+${item.enhance}]</span>
          </div>
          <div style="font-size:11px;color:#c4b5fd;margin-top:2px;">
            ${item.rarityName} ${item.type === 'weapon' ? '무기' : '방어구'} (장비 레벨 Lv.${item.level})
          </div>
        </div>
      </div>

      <div class="forge-stat-compare-grid">
        ${curAtk ? `<div>공격력: <b style="color:#fff;">${curAtk}</b> ➔ <b style="color:#00ffcc;">${nextAtk}</b> (+12%)</div>` : ''}
        ${curDef ? `<div>방어력: <b style="color:#fff;">${curDef}</b> ➔ <b style="color:#00ffcc;">${nextDef}</b> (+12%)</div>` : ''}
        <div>최대 제련 한계: <b style="color:#ffd700;">+15</b></div>
        <div>현재 단계: <b style="color:#ffcc00;">+${item.enhance}</b></div>
      </div>

      <div class="forge-rate-bar">
        <span>제련 성공 확률:</span>
        <b style="color:${ratePct >= 80 ? '#00ffaa' : ratePct >= 50 ? '#ffd700' : '#ff3344'};font-size:14px;font-family:var(--font-title);">
          ${ratePct}% ${ratePct === 100 ? '(안전 제련 보장)' : ''}
        </b>
      </div>

      <div class="forge-cost-grid">
        <div class="forge-cost-chip">
          <span>필요 골드:</span>
          <b style="color:${hasGold ? '#ffd700' : '#ff5566'};">${costGold.toLocaleString()} G</b>
        </div>
        <div class="forge-cost-chip">
          <span>필요 강화석:</span>
          <b style="color:${hasStones ? '#00ffcc' : '#ff5566'};">${costStones}개</b>
        </div>
      </div>

      ${isMax ? `
        <button class="game-btn" disabled style="width:100%;padding:10px;opacity:0.6;">최대 제련 단계 도달 (+15)</button>
      ` : `
        <button class="game-btn gold-btn forge-action-btn" id="btnDoEnhance" ${canEnhance ? '' : 'disabled style="opacity:0.5;cursor:not-allowed;"'}>
          ${canEnhance ? `차원 제련 시도 (+${item.enhance} ➔ +${item.enhance + 1})` : '재료 또는 골드 부족'}
        </button>
      `}
    `;

    const enhanceBtn = document.getElementById('btnDoEnhance');
    if (enhanceBtn && canEnhance) {
      enhanceBtn.onclick = () => {
        const res = EquipmentManager.enhanceItem(this.player, item);
        alert(res.msg);
        this.player.recalculateStats();
        this.updateHUD();
        this.renderBlacksmithUI('enhance');
        this.selectEnhanceItem(item, cardId);
      };
    }
  }

  disassembleBulk(maxRarity) {
    const ranks = { normal: 1, magic: 2, rare: 3 };
    const maxRank = ranks[maxRarity] || 1;
    let dismantledCount = 0;
    let totalIron = 0;
    let totalStones = 0;

    for (let i = this.player.inventory.length - 1; i >= 0; i--) {
      const it = this.player.inventory[i];
      if (it && (it.type === 'weapon' || it.type === 'armor' || it.type === 'accessory' || it.type === 'shield')) {
        const rRank = ranks[it.rarity] || 1;
        if (rRank <= maxRank) {
          const ironGain = (it.level || 1) * 2;
          const stoneGain = it.rarity === 'rare' ? 2 : 1;
          this.player.materials.iron_ore = (this.player.materials.iron_ore || 0) + ironGain;
          this.player.materials.upgrade_stone = (this.player.materials.upgrade_stone || 0) + stoneGain;
          totalIron += ironGain;
          totalStones += stoneGain;
          this.player.inventory.splice(i, 1);
          dismantledCount++;
        }
      }
    }

    if (dismantledCount === 0) {
      alert('조건에 해당하는 분해 대상 장비가 없습니다.');
    } else {
      if (this.soundMgr) this.soundMgr.playDismantle();
      alert(`[일괄 분해 완료!] 총 ${dismantledCount}개의 장비를 분해하여 철광석 +${totalIron}개, 강화석 +${totalStones}개를 획득했습니다!`);
      this.renderBlacksmithUI('disassemble');
      this.updateHUD();
    }
  }

  craftItem(rarity, type) {
    const shardCost = rarity === 'epic' ? 15 : 5;
    const ironCost = rarity === 'epic' ? 50 : 20;
    const goldCost = rarity === 'epic' ? 10000 : 3000;

    if (this.player.gold < goldCost ||
        (this.player.materials.dimension_shard || 0) < shardCost ||
        (this.player.materials.iron_ore || 0) < ironCost) {
      alert('제작 재료나 골드가 부족합니다!');
      return;
    }

    this.player.gold -= goldCost;
    this.player.materials.dimension_shard -= shardCost;
    this.player.materials.iron_ore -= ironCost;

    const cls = CLASSES[this.player.job];
    const newItem = ItemGenerator.generateItem({
      level: Math.max(1, this.player.level),
      rarity: rarity,
      type: 'weapon',
      weaponType: cls.weaponType
    });

    this.player.inventory.push(newItem);
    if (this.soundMgr) this.soundMgr.playEnhanceSuccess();
    alert(`[제작 대성공!] ${newItem.rarityName} 등급 [${newItem.name}]이(가) 가방에 지급되었습니다!`);
    this.renderBlacksmithUI('craft');
    this.updateHUD();
  }

  // C: 4단계 티어 보석 세공 & 합성 연금술 UI
  renderJewelAlchemyTab(container) {
    const gemCounts = {};
    this.player.inventory.forEach(it => {
      if (it && (it.isGem || it.baseType)) {
        gemCounts[it.id] = (gemCounts[it.id] || 0) + 1;
      }
    });

    const socketableItems = [];
    Object.entries(this.player.equip).forEach(([slot, it]) => {
      if (it && it.sockets > 0) {
        socketableItems.push({ item: it, isEquipped: true, slot: slot, label: `착용 중인 [${it.name}]` });
      }
    });
    this.player.inventory.forEach((it, invIdx) => {
      if (it && it.sockets > 0) {
        socketableItems.push({ item: it, isEquipped: false, invIdx: invIdx, label: `가방 슬롯 ${invIdx + 1} [${it.name}]` });
      }
    });

    const synthesizableGemKeys = [
      'ruby_1', 'ruby_2', 'ruby_3',
      'sapphire_1', 'sapphire_2', 'sapphire_3',
      'emerald_1', 'emerald_2', 'emerald_3',
      'diamond_1', 'diamond_2', 'diamond_3'
    ];

    let html = `
      <div class="alchemy-layout">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <h4 style="color:#ffd700;font-family:var(--font-title);margin:0;">
            💎 차원 보석 연성소 (동일 보석 3개 ➔ 상위 등급 보석 합성)
          </h4>
          <button class="game-btn" style="font-size:11px;padding:4px 8px;" onclick="window.game.grantTestGems()">
            🧪 테스트 보석 3세트 수급
          </button>
        </div>
        <p style="color:#a496bd;font-size:12px;margin:0 0 12px 0;">
          동일한 하위 티어 보석 3개와 골드를 제물로 바쳐 상위 등급의 보석을 연성합니다. (최대 4티어 완전무결 등급)
        </p>

        <div class="alchemy-gem-grid">
    `;

    synthesizableGemKeys.forEach(gKey => {
      const gem = GEMS[gKey];
      if (!gem) return;
      const count = gemCounts[gKey] || 0;
      const canCombine = count >= 3;
      const costGold = gem.tier * 2000;
      const nextKey = `${gem.baseType}_${gem.tier + 1}`;
      const nextGem = GEMS[nextKey];

      html += `
        <div class="alchemy-gem-card ${canCombine ? 'can-craft' : ''}">
          <div class="agc-header">
            <span class="agc-ico">${gem.icon}</span>
            <div class="agc-title">
              <b style="color:${gem.color};">${gem.name}</b>
              <span class="agc-count">보유: <b>${count}</b> / 3개</span>
            </div>
          </div>
          <div class="agc-desc">${gem.desc}</div>
          <div style="font-size:11px;color:#a496bd;margin:6px 0;">
            합성 ➔ <b style="color:${nextGem ? nextGem.color : '#ffd700'}">${nextGem ? nextGem.name : '최고등급'}</b><br>
            소모: 🪙 ${costGold.toLocaleString()} G
          </div>
          <button class="game-btn ${canCombine ? 'gold-btn' : ''}" 
                  ${!canCombine ? 'disabled' : ''} 
                  onclick="window.game.combineGemAction('${gKey}')">
            ${canCombine ? '✨ 3개 즉시 합성!' : `재료 부족 (${3 - count}개 필요)`}
          </button>
        </div>
      `;
    });

    ['ruby_4', 'sapphire_4', 'emerald_4', 'diamond_4'].forEach(gKey => {
      const gem = GEMS[gKey];
      const count = gemCounts[gKey] || 0;
      if (count > 0) {
        html += `
          <div class="alchemy-gem-card max-tier">
            <div class="agc-header">
              <span class="agc-ico">${gem.icon}</span>
              <div class="agc-title">
                <b style="color:${gem.color};">${gem.name}</b>
                <span class="agc-count" style="color:#ffd700;">보유: <b>${count}</b>개 [최고 티어]</span>
              </div>
            </div>
            <div class="agc-desc">${gem.desc}</div>
            <div style="font-size:11px;color:#00ffaa;margin:6px 0;">완전무결 등급: 최고 수준의 소켓 세공용 보석입니다.</div>
          </div>
        `;
      }
    });

    html += `
        </div>

        <div class="alchemy-section" style="margin-top:16px;">
          <h4 style="color:#00f0ff;margin-bottom:6px;font-family:var(--font-title);">
            ⚒️ 장비 소켓 세공 & 보석 장착 / 추출
          </h4>
          <p style="color:#a496bd;font-size:12px;margin:0 0 12px 0;">
            소켓(⭕)이 개방된 장비에 가방 내 보석을 결속하여 강력한 고유 스탯을 부여합니다.
          </p>
    `;

    if (socketableItems.length === 0) {
      html += `
        <div style="background:rgba(20,10,35,0.7);padding:18px;border-radius:10px;text-align:center;color:#a496bd;">
          현재 소켓(⭕)이 개방된 장비를 착용하거나 보유하고 있지 않습니다.<br>
          희귀 등급 이상의 장비 획득 시 1~3개의 소켓이 무작위로 개방됩니다.
        </div>
      `;
    } else {
      const availableGems = this.player.inventory.filter(it => it && (it.isGem || it.baseType));

      html += `<div class="socket-gear-list">`;
      socketableItems.forEach((entry, idx) => {
        const eqItem = entry.item;
        const gemList = eqItem.gemList || [];
        const freeSockets = eqItem.sockets - gemList.length;

        html += `
          <div class="socket-gear-card">
            <div class="sgc-header">
              <span style="font-size:24px;">${eqItem.icon}</span>
              <div>
                <b style="color:${eqItem.color};">${entry.label}</b>
                <span style="color:#ffd700;font-size:12px;margin-left:8px;">[${eqItem.rarityName}]</span>
                <div style="font-size:12px;color:#a496bd;margin-top:2px;">
                  소켓: <b>${gemList.length} / ${eqItem.sockets}</b> 결속됨
                  <span style="margin-left:6px;letter-spacing:2px;">${'💎'.repeat(gemList.length)}${'⭕'.repeat(freeSockets)}</span>
                </div>
              </div>
            </div>

            <div style="margin:10px 0;">
        `;

        if (gemList.length > 0) {
          gemList.forEach(gKey => {
            const g = GEMS[gKey];
            if (g) {
              html += `
                <div class="socket-item-row">
                  <span style="color:${g.color};font-weight:700;">💎 [${g.name}]</span>
                  <span style="color:#00ffaa;font-size:12px;">${g.desc}</span>
                </div>
              `;
            }
          });

          const extractCost = gemList.length * 1500;
          html += `
            <div style="margin-top:8px;">
              <button class="game-btn" onclick="window.game.extractGemAction(${entry.isEquipped}, '${entry.isEquipped ? entry.slot : entry.invIdx}')">
                ↩️ 결속된 보석 전량 안전 추출 (비용: 🪙 ${extractCost.toLocaleString()} G)
              </button>
            </div>
          `;
        } else {
          html += `<div style="font-size:12px;color:#8f82a6;">현재 결속된 보석이 없습니다. 빈 소켓에 보석을 장착하세요.</div>`;
        }

        html += `</div>`;

        if (freeSockets > 0) {
          if (availableGems.length > 0) {
            html += `
              <div class="socket-install-box" style="margin-top:8px;display:flex;gap:8px;align-items:center;">
                <select id="sel_gem_${idx}" style="background:#221338;border:1px solid #5a328c;color:#fff;padding:6px 10px;border-radius:6px;flex:1;">
                  ${availableGems.map(g => `<option value="${g.id}">${g.icon} ${g.name} (${g.desc})</option>`).join('')}
                </select>
                <button class="game-btn gold-btn" onclick="window.game.installGemAction(${entry.isEquipped}, '${entry.isEquipped ? entry.slot : entry.invIdx}', 'sel_gem_${idx}')">
                  💎 소켓에 장착하기
                </button>
              </div>
            `;
          } else {
            html += `<div style="font-size:11px;color:#ff9999;margin-top:4px;">⚠️ 가방에 장착 가능한 보석이 없습니다.</div>`;
          }
        }

        html += `</div>`;
      });
      html += `</div>`;
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  combineGemAction(gemKey) {
    const res = JewelAlchemyManager.combineGems(this.player, gemKey);
    alert(res.msg);
    this.updateHUD();
    this.renderBlacksmithUI('alchemy');
  }

  extractGemAction(isEquipped, slotOrInvIdx) {
    const item = isEquipped ? this.player.equip[slotOrInvIdx] : this.player.inventory[parseInt(slotOrInvIdx)];
    if (!item) return;

    if (confirm(`[${item.name}]에서 보석 ${item.gemList.length}개를 추출하여 가방으로 회수하시겠습니까?`)) {
      const res = JewelAlchemyManager.extractGems(this.player, item);
      alert(res.msg);
      this.player.recalculateStats();
      this.updateHUD();
      this.renderBlacksmithUI('alchemy');
    }
  }

  installGemAction(isEquipped, slotOrInvIdx, selectId) {
    const item = isEquipped ? this.player.equip[slotOrInvIdx] : this.player.inventory[parseInt(slotOrInvIdx)];
    if (!item) return;

    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;
    const gemKey = selectEl.value;

    const res = JewelAlchemyManager.socketGemIntoItem(this.player, item, gemKey);
    alert(res.msg);
    this.player.recalculateStats();
    this.updateHUD();
    this.renderBlacksmithUI('alchemy');
  }

  grantTestGems() {
    this.player.inventory.push(
      { ...GEMS.ruby_1 },
      { ...GEMS.ruby_1 },
      { ...GEMS.ruby_1 },
      { ...GEMS.sapphire_1 },
      { ...GEMS.sapphire_1 },
      { ...GEMS.sapphire_1 },
      { ...GEMS.emerald_2 },
      { ...GEMS.emerald_2 },
      { ...GEMS.emerald_2 },
      { ...GEMS.diamond_1 },
      { ...GEMS.diamond_1 },
      { ...GEMS.diamond_1 }
    );
    alert('테스트용 보석 3세트(루비x3, 사파이어x3, 에메랄드x3, 다이아x3)가 가방에 지급되었습니다!');
    this.updateHUD();
    this.renderBlacksmithUI('alchemy');
  }

  // --- 2번: 대장간 룬스톤 각인 탭 UI ---
  renderRunestoneTab(container) {
    const playerRunes = this.player.runestones || [];
    const runeCounts = {};
    playerRunes.forEach(r => { runeCounts[r] = (runeCounts[r] || 0) + 1; });

    let html = `
      <div class="runestone-section">
        <div style="background:rgba(20,10,35,0.8);border:1px solid #5a328c;padding:12px;border-radius:8px;margin-bottom:14px;">
          <h4 style="color:#00e5ff;margin:0 0 6px 0;font-family:var(--font-title);font-size:16px;">
            🌀 고대 룬스톤 각인 (Runestone Engraving)
          </h4>
          <p style="color:#c9bede;font-size:12px;margin:0;line-height:1.5;">
            차원 균열 돌발 이벤트 및 보스 처치로 획득한 고대 룬스톤을 장비에 영구 각인합니다.<br>
            각인된 장비는 파괴적인 고유 능력치(흡혈, 치명타 피해, 생명력, 공속 등)를 획득합니다. (장비당 1개 각인)
          </p>
        </div>

        <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
          <b style="color:#ffd700;font-size:14px;">📦 보유 중인 고대 룬스톤 목록</b>
          <button class="game-btn" style="font-size:11px;padding:4px 8px;" onclick="window.game.grantTestRunestones()">
            🧪 테스트용 4대 룬스톤 즉시 지급
          </button>
        </div>

        <div class="runestone-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:20px;">
    `;

    Object.values(window.RUNESTONES).forEach(rune => {
      const count = runeCounts[rune.key] || 0;
      html += `
        <div class="runestone-card" style="background:rgba(20,12,38,0.7);border:1px solid ${count > 0 ? rune.color : 'rgba(255,255,255,0.1)'};border-radius:8px;padding:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:24px;">${rune.icon}</span>
            <div>
              <b style="color:${rune.color};font-size:13px;">${rune.name}</b>
              <div style="font-size:11px;color:${count > 0 ? '#00ffaa' : '#888'};">보유: <b>${count}</b>개</div>
            </div>
          </div>
          <div style="color:#a496bd;font-size:11px;margin-top:6px;line-height:1.4;">${rune.desc}</div>
        </div>
      `;
    });

    html += `
        </div>

        <h4 style="color:#ffd700;margin-bottom:10px;font-family:var(--font-title);font-size:14px;">
          ⚒️ 각인 대상 장비 선택 (장착 장비 & 소지품)
        </h4>
        <div class="socket-gear-list">
    `;

    const gearList = [];
    const slots = ['weapon', 'helmet', 'armor', 'gloves', 'boots'];
    slots.forEach(slotKey => {
      const it = this.player.equip[slotKey];
      if (it) gearList.push({ isEquipped: true, slot: slotKey, item: it, label: `[착용 중: ${slotKey.toUpperCase()}] ${it.name}` });
    });
    this.player.inventory.forEach((it, idx) => {
      if (it && !it.isGem && it.slot) {
        gearList.push({ isEquipped: false, invIdx: idx, item: it, label: `[가방 ${idx + 1}] ${it.name}` });
      }
    });

    if (gearList.length === 0) {
      html += `<div style="color:#888;text-align:center;padding:20px;">각인 가능한 장비가 없습니다.</div>`;
    } else {
      const availableRunes = Object.values(window.RUNESTONES).filter(r => (runeCounts[r.key] || 0) > 0);

      gearList.forEach((entry, idx) => {
        const it = entry.item;
        const engravedKey = it.runestone;
        const engravedDef = engravedKey ? window.RUNESTONES[engravedKey] : null;

        html += `
          <div class="socket-gear-card" style="background:rgba(25,12,45,0.7);border:1px solid #4a256b;border-radius:8px;padding:12px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:24px;">${it.icon}</span>
                <div>
                  <b style="color:${it.color || '#fff'};font-size:14px;">${entry.label}</b>
                  <span style="color:#ffd700;font-size:11px;margin-left:6px;">[${it.rarityName}]</span>
                  ${it.setId ? `<span style="color:#c084fc;font-size:11px;margin-left:6px;">${it.setName}</span>` : ''}
                </div>
              </div>
            </div>

            <div style="margin-top:10px;padding:8px;background:rgba(10,5,20,0.5);border-radius:6px;">
        `;

        if (engravedDef) {
          html += `
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span style="color:${engravedDef.color};font-weight:700;">${engravedDef.icon} [각인 완료: ${engravedDef.name}]</span>
                <span style="color:#00ffaa;font-size:12px;margin-left:8px;">${engravedDef.desc}</span>
              </div>
              <button class="game-btn" style="border-color:#ff4466;color:#ff99aa;font-size:11px;" onclick="window.game.removeRunestoneAction(${entry.isEquipped}, '${entry.isEquipped ? entry.slot : entry.invIdx}')">
                ↩️ 룬 정화/회수
              </button>
            </div>
          `;
        } else {
          if (availableRunes.length > 0) {
            html += `
              <div style="display:flex;gap:8px;align-items:center;">
                <select id="sel_rune_${idx}" style="background:#221338;border:1px solid #5a328c;color:#fff;padding:6px 10px;border-radius:6px;flex:1;">
                  ${availableRunes.map(r => `<option value="${r.key}">${r.icon} ${r.name} (${r.desc}) - 보유 ${runeCounts[r.key]}개</option>`).join('')}
                </select>
                <button class="game-btn gold-btn" onclick="window.game.engraveRunestoneAction(${entry.isEquipped}, '${entry.isEquipped ? entry.slot : entry.invIdx}', 'sel_rune_${idx}')">
                  🌀 룬스톤 각인 (3,000G / 철광석 8)
                </button>
              </div>
            `;
          } else {
            html += `<div style="font-size:12px;color:#888;">각인 가능한 룬스톤을 보유하고 있지 않습니다.</div>`;
          }
        }

        html += `
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  engraveRunestoneAction(isEquipped, slotOrInvIdx, selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const runeKey = sel.value;
    const item = isEquipped ? this.player.equip[slotOrInvIdx] : this.player.inventory[parseInt(slotOrInvIdx)];
    if (!item) return;

    const res = RunestoneManager.engrave(this.player, item, runeKey);
    alert(res.msg);
    if (res.ok) {
      this.player.recalculateStats();
      this.updateHUD();
      this.renderBlacksmithUI('runestone');
      if (this.soundMgr) this.soundMgr.playEnhanceSuccess();
      if (this.effectMgr) {
        this.effectMgr.addShockwave(this.player.x, this.player.y, 60, '#00e5ff');
        this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, '🌀 룬스톤 각인 완료!', 'crit');
      }
    }
  }

  removeRunestoneAction(isEquipped, slotOrInvIdx) {
    const item = isEquipped ? this.player.equip[slotOrInvIdx] : this.player.inventory[parseInt(slotOrInvIdx)];
    if (!item) return;

    if (confirm(`[${item.name}]에 각인된 룬스톤을 정화하고 회수하시겠습니까?`)) {
      const res = RunestoneManager.remove(this.player, item);
      alert(res.msg);
      if (res.ok) {
        this.player.recalculateStats();
        this.updateHUD();
        this.renderBlacksmithUI('runestone');
        if (this.soundMgr) this.soundMgr.playItemEquip();
      }
    }
  }

  grantTestRunestones() {
    this.player.runestones = this.player.runestones || [];
    this.player.runestones.push('rune_destruction', 'rune_ironwall', 'rune_swiftness', 'rune_vampire');
    this.player.materials.iron_ore = (this.player.materials.iron_ore || 0) + 50;
    this.player.gold = (this.player.gold || 0) + 50000;
    alert('테스트용 4대 고대 룬스톤(파괴, 철벽, 신속, 흡혈) 및 철광석 50개, 50,000G가 지급되었습니다!');
    this.updateHUD();
    this.renderBlacksmithUI('runestone');
  }

  // D: 모바일 / 태블릿 화면 전체 동적 반응형 가상 조이스틱 바인딩
  setupTouchControls() {
    const vstickBase = document.getElementById('vstickBase');
    const vstickKnob = document.getElementById('vstickKnob');
    if (!vstickBase || !vstickKnob) return;

    let moveTouchId = null;
    let baseX = 0;
    let baseY = 0;
    const maxRadius = 45;

    const startJoy = (id, clientX, clientY) => {
      moveTouchId = id;
      baseX = clientX;
      baseY = clientY;

      // 터치한 임의의 화면 좌표로 조이스틱 동적 이동 및 노출
      vstickBase.style.left = `${clientX - 45}px`;
      vstickBase.style.top = `${clientY - 45}px`;
      vstickBase.style.display = 'block';
      vstickBase.style.opacity = '1';
      vstickKnob.style.transform = `translate(0px, 0px)`;
    };

    const moveJoy = (clientX, clientY) => {
      let dx = clientX - baseX;
      let dy = clientY - baseY;
      const dist = Math.hypot(dx, dy);

      let normX = 0;
      let normY = 0;
      if (dist > 0) {
        normX = dx / dist;
        normY = dy / dist;
      }

      const clampedDist = Math.min(dist, maxRadius);
      const knobX = normX * clampedDist;
      const knobY = normY * clampedDist;
      vstickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

      if (dist > 6) {
        const mag = clampedDist / maxRadius;
        this.input.joyX = normX * mag;
        this.input.joyY = normY * mag;
        this.player.angle = Math.atan2(normY, normX);
      } else {
        this.input.joyX = 0;
        this.input.joyY = 0;
      }
    };

    const stopJoy = () => {
      moveTouchId = null;
      this.input.joyX = 0;
      this.input.joyY = 0;
      vstickKnob.style.transform = `translate(0px, 0px)`;
      vstickBase.style.opacity = '0';
      setTimeout(() => {
        if (moveTouchId === null) vstickBase.style.display = 'none';
      }, 150);
    };

    // 화면 전체 터치 수신기 (UI 버튼 영역 제외 전체 화면 터치패드 반응)
    window.addEventListener('touchstart', e => {
      if (this.activeModal) return;

      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        const target = t.target;
        const isUI = target.closest('.game-modal, .mobile-action-cluster, .bottom-action-console, .side-nav-dock, .mobile-hamburger-btn, .game-btn, button');

        if (!isUI && moveTouchId === null) {
          startJoy(t.identifier, t.clientX, t.clientY);
          break;
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', e => {
      if (moveTouchId === null) return;
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        if (t.identifier === moveTouchId) {
          moveJoy(t.clientX, t.clientY);
          break;
        }
      }
    }, { passive: true });

    const handleTouchEnd = e => {
      if (moveTouchId === null) return;
      let stillActive = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === moveTouchId) {
          stillActive = true;
          break;
        }
      }
      if (!stillActive) {
        stopJoy();
      }
    };

    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    const mBtnAtk = document.getElementById('mBtnAtk');
    if (mBtnAtk) {
      const triggerAttack = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        let targetX = this.player.x + Math.cos(this.player.angle) * 80;
        let targetY = this.player.y + Math.sin(this.player.angle) * 80;

        if (this.state === 'dungeon' && this.dungeonMgr.enemies.length > 0) {
          let nearest = null;
          let minDist = 300;
          this.dungeonMgr.enemies.forEach(en => {
            if (en.isAlive) {
              const d = Math.hypot(en.x - this.player.x, en.y - this.player.y);
              if (d < minDist) {
                minDist = d;
                nearest = en;
              }
            }
          });
          if (nearest) {
            targetX = nearest.x;
            targetY = nearest.y;
          }
        } else if (this.state === 'town') {
          const dummy = this.townMgr.npcs.find(n => n.isDummy);
          if (dummy && Math.hypot(dummy.x - this.player.x, dummy.y - this.player.y) <= 180) {
            targetX = dummy.x;
            targetY = dummy.y;
          }
        }
        const enemies = this.state === 'dungeon' ? this.dungeonMgr.enemies : [];
        const dummy = this.state === 'town' ? this.townMgr.npcs.find(n => n.isDummy) : null;
        this.player.performBasicAttack(targetX, targetY, enemies, dummy);
      };
      mBtnAtk.addEventListener('touchstart', triggerAttack, { passive: false });
      mBtnAtk.addEventListener('click', triggerAttack);
    }

    const mBtnDash = document.getElementById('mBtnDash');
    if (mBtnDash) {
      const triggerDash = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const dx = this.input.joyX || (this.input.d ? 1 : this.input.a ? -1 : 0);
        const dy = this.input.joyY || (this.input.s ? 1 : this.input.w ? -1 : 0);
        this.player.performDash(dx, dy);
      };
      mBtnDash.addEventListener('touchstart', triggerDash, { passive: false });
      mBtnDash.addEventListener('click', triggerDash);
    }

    // 2번: 모바일 패링 버튼
    const mBtnParry = document.getElementById('mBtnParry');
    if (mBtnParry) {
      const triggerParry = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.player.performParry();
      };
      mBtnParry.addEventListener('touchstart', triggerParry, { passive: false });
      mBtnParry.addEventListener('click', triggerParry);
    }

    const mBtnPot = document.getElementById('mBtnPot');
    if (mBtnPot) {
      const triggerPot = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.player.usePotion();
        this.updateHUD();
      };
      mBtnPot.addEventListener('touchstart', triggerPot, { passive: false });
      mBtnPot.addEventListener('click', triggerPot);
    }
  }

  openShopModal() {
    this.toggleModal('shop');
    const container = document.getElementById('shopContent');
    container.innerHTML = `
      <div class="shop-list">
        <div class="shop-card">
          <div style="font-size:15px;font-weight:700;margin-bottom:8px;">🧪 생명력 & 마나 회복 물약 (HP/MP 45% 즉시 회복)</div>
          <div style="display:flex;gap:10px;">
            <button class="game-btn" onclick="window.game.buyPotion(1, 100)">1개 구매 (100 G)</button>
            <button class="game-btn" onclick="window.game.buyPotion(10, 950)">10개 묶음 (950 G)</button>
          </div>
        </div>
        <div class="shop-card" style="margin-top:14px;">
          <div style="font-size:15px;font-weight:700;margin-bottom:8px;">📦 레벨 맞춤형 장비 보급 상자 (Lv.${this.player.level})</div>
          <button class="game-btn gold-btn" onclick="window.game.buyRandomGear()">랜덤 장비 뽑기 (${this.player.level * 150} G)</button>
        </div>
      </div>
    `;
  }

  buyPotion(amount, cost) {
    if (this.player.gold < cost) {
      alert('골드가 부족합니다!');
      return;
    }
    this.player.gold -= cost;
    this.player.potions += amount;
    if (this.soundMgr) this.soundMgr.playItemEquip();
    this.updateHUD();
    alert(`물약 ${amount}개를 구매했습니다.`);
  }

  buyRandomGear() {
    const cost = this.player.level * 150;
    if (this.player.gold < cost) {
      alert('골드가 부족합니다!');
      return;
    }
    this.player.gold -= cost;
    const item = ItemGenerator.generateItem({ level: this.player.level });
    this.player.inventory.push(item);
    if (this.soundMgr) this.soundMgr.playItemEquip();
    this.updateHUD();
    alert(`[${item.rarityName}] ${item.name}을(를) 획득했습니다!`);
  }

  // --- 1~100층 10대 테마 구역 분할 깔끔한 선택 모달 ---
  openFloorSelectModal() {
    this.toggleModal('floorSelect');
    const container = document.getElementById('floorSelectList');
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';

    if (this.player.isTowerDestroyed) {
      const nmHeader = document.createElement('div');
      nmHeader.style.padding = '10px';
      nmHeader.style.background = 'rgba(255, 30, 60, 0.18)';
      nmHeader.style.border = '1px solid #ff1a40';
      nmHeader.style.borderRadius = '8px';
      nmHeader.style.textAlign = 'center';
      nmHeader.innerHTML = `
        <span style="color:#ffd700;font-weight:900;">💀 [무한 악몽 심연] 101F~ 무한 난이도 모드 해금됨</span>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;">
          <button class="game-btn" style="border-color:#ff3344;color:#ff9999;" onclick="window.game.enterDungeon(101); window.game.closeAllModals();">💀 101F 진입</button>
          <button class="game-btn" style="border-color:#ff3344;color:#ff9999;" onclick="window.game.enterDungeon(120); window.game.closeAllModals();">💀 120F 진입</button>
          <button class="game-btn" style="border-color:#ff3344;color:#ff9999;" onclick="window.game.enterDungeon(150); window.game.closeAllModals();">💀 150F 진입</button>
        </div>
      `;
      container.appendChild(nmHeader);
    }

    // 10대 테마 구역 탭 바 생성
    const tabContainer = document.createElement('div');
    tabContainer.style.display = 'flex';
    tabContainer.style.overflowX = 'auto';
    tabContainer.style.gap = '6px';
    tabContainer.style.paddingBottom = '6px';

    const contentArea = document.createElement('div');
    contentArea.id = 'zoneFloorGridArea';

    const curFloor = this.player.currentFloor || 1;
    let activeZoneIdx = Math.min(9, Math.floor((curFloor - 1) / 10));

    const renderZoneFloors = (zoneIdx) => {
      activeZoneIdx = zoneIdx;
      tabContainer.querySelectorAll('.zone-tab-btn').forEach((tb, i) => {
        if (i === zoneIdx) {
          tb.style.background = '#e67300';
          tb.style.color = '#fff';
          tb.style.borderColor = '#ffd700';
        } else {
          tb.style.background = 'rgba(25, 14, 38, 0.85)';
          tb.style.color = '#cfc0e6';
          tb.style.borderColor = 'rgba(255, 215, 0, 0.2)';
        }
      });

      const theme = window.DUNGEON_THEMES ? window.DUNGEON_THEMES[zoneIdx] : null;
      const startF = zoneIdx * 10 + 1;
      const endF = (zoneIdx + 1) * 10;

      contentArea.innerHTML = '';

      // 구역 헤더 카드
      const headerBox = document.createElement('div');
      headerBox.style.background = 'rgba(20, 10, 30, 0.9)';
      headerBox.style.border = `1px solid ${theme ? theme.color : '#e67300'}`;
      headerBox.style.borderRadius = '8px';
      headerBox.style.padding = '10px 14px';
      headerBox.style.marginBottom = '10px';
      headerBox.style.display = 'flex';
      headerBox.style.justifyContent = 'space-between';
      headerBox.style.alignItems = 'center';

      const bossInfo = window.ZONE_BOSSES ? window.ZONE_BOSSES[endF] : null;
      headerBox.innerHTML = `
        <div>
          <h4 style="margin:0;color:${theme ? theme.color : '#ffd700'};font-family:var(--font-title);">${startF}~${endF}F: ${theme ? theme.name : ''}</h4>
          <small style="color:#a496bd;">10층 보스: <b style="color:#ff6622;">${bossInfo ? bossInfo.name : '구역 수호자'}</b> (${bossInfo ? bossInfo.title : ''})</small>
        </div>
      `;
      contentArea.appendChild(headerBox);

      // 10개 층 콤팩트 버튼 그리드
      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
      grid.style.gap = '8px';

      for (let f = startF; f <= endF; f++) {
        const isBoss = (f % 10 === 0);
        const btn = document.createElement('button');
        btn.className = 'floor-select-btn' + (isBoss ? ' boss-floor' : '');
        btn.style.padding = '10px 6px';
        btn.style.textAlign = 'center';

        btn.innerHTML = `
          <span style="font-size:15px;font-weight:bold;display:block;">${f}F</span>
          <small style="display:block;font-size:10px;margin-top:2px;color:${isBoss ? '#ffd700' : '#8899aa'};">${isBoss ? '👹 구역 보스' : '일반 던전'}</small>
        `;
        btn.onclick = () => {
          this.closeAllModals();
          this.enterDungeon(f);
        };
        grid.appendChild(btn);
      }
      contentArea.appendChild(grid);
    };

    // 10대 구역 탭 버튼들 생성
    if (window.DUNGEON_THEMES) {
      window.DUNGEON_THEMES.forEach((th, idx) => {
        const tBtn = document.createElement('button');
        tBtn.className = 'zone-tab-btn';
        tBtn.style.padding = '6px 12px';
        tBtn.style.borderRadius = '6px';
        tBtn.style.fontSize = '11px';
        tBtn.style.whiteSpace = 'nowrap';
        tBtn.style.cursor = 'pointer';
        tBtn.style.border = '1px solid rgba(255, 215, 0, 0.2)';
        tBtn.innerText = `${th.minF}~${th.maxF}F`;
        tBtn.onclick = () => renderZoneFloors(idx);
        tabContainer.appendChild(tBtn);
      });
    }

    container.appendChild(tabContainer);
    container.appendChild(contentArea);

    // 초기 활성 구역 렌더링
    renderZoneFloors(activeZoneIdx);
  }

  selectJobForCreation(job) {
    const input = document.getElementById('newCharJob');
    if (input) input.value = job;
    document.querySelectorAll('.job-card-option').forEach(el => {
      if (el.getAttribute('data-job') === job) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  renderAccountUI() {
    const curAcct = this.accountMgr.currentAccount;
    document.getElementById('acctUsernameDisplay').innerText = curAcct.username;
    const charListEl = document.getElementById('accountCharList');
    charListEl.innerHTML = '';

    curAcct.characters.forEach(c => {
      const isCur = this.accountMgr.activeCharacter && this.accountMgr.activeCharacter.id === c.id;
      const div = document.createElement('div');
      div.className = 'char-card' + (isCur ? ' active' : '');
      div.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="assets/portraits/${c.job}.jpg" style="width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid ${isCur ? '#ffd700' : 'rgba(160,110,240,0.4)'};box-shadow:0 2px 6px rgba(0,0,0,0.6);" alt="${c.name}" />
          <div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <b style="font-size:15px;color:#fff;">${c.name}</b>
              <span style="color:#ffd700;font-weight:700;font-size:12px;background:rgba(255,215,0,0.15);padding:1px 6px;border-radius:4px;border:1px solid rgba(255,215,0,0.3);">Lv.${c.level} ${CLASSES[c.job].name}</span>
            </div>
            <div style="font-size:11px;color:#a496bd;margin-top:3px;">도달 층수: <b style="color:#00ffcc;">${c.currentFloor}F</b> | 보유 골드: <b style="color:#ffd700;">${c.gold.toLocaleString()} G</b></div>
          </div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="game-btn select-btn ${isCur ? 'gold-btn' : ''}" onclick="window.game.selectCharacter('${c.id}')">${isCur ? '접속중' : '선택'}</button>
          <button class="game-btn delete-btn" onclick="window.game.deleteCharacter('${c.id}')">삭제</button>
        </div>
      `;
      charListEl.appendChild(div);
    });
  }

  selectCharacter(charId) {
    this.accountMgr.selectCharacter(charId);
    this.loadActiveCharacter();
    this.closeAllModals();
  }

  deleteCharacter(charId) {
    if (confirm('정말로 이 캐릭터를 삭제하시겠습니까?')) {
      this.accountMgr.deleteCharacter(charId);
      this.renderAccountUI();
    }
  }

  createCharacterUI() {
    const name = document.getElementById('newCharName').value;
    const job = document.getElementById('newCharJob').value;
    if (!name || name.trim() === '') {
      alert('캐릭터 이름을 입력하세요.');
      return;
    }
    this.accountMgr.createCharacter(name, job, 99);
    this.loadActiveCharacter();
    this.renderAccountUI();
    alert(`신규 99레벨 캐릭터 [${name}] 생성이 완료되었습니다!`);
  }

  switchAccountUI() {
    const name = document.getElementById('switchAccountName').value;
    if (!name || name.trim() === '') return;
    this.accountMgr.loginOrCreate(name);
    if (this.accountMgr.currentAccount.characters.length > 0) {
      this.accountMgr.activeCharacter = this.accountMgr.currentAccount.characters[0];
    } else {
      this.accountMgr.createCharacter('용사', 'warrior', 99);
    }
    this.loadActiveCharacter();
    this.renderAccountUI();
    alert(`[${name}] 계정으로 접속했습니다.`);
  }

  // --- 2순위: 도감 & 업적 / 칭호 시스템 UI ---
  renderCodexUI(tab = 'monsters') {
    const btnM = document.getElementById('tab_btn_monsters');
    const btnA = document.getElementById('tab_btn_achievements');
    if (btnM && btnA) {
      if (tab === 'monsters') {
        btnM.classList.add('gold-btn');
        btnA.classList.remove('gold-btn');
      } else {
        btnA.classList.add('gold-btn');
        btnM.classList.remove('gold-btn');
      }
    }
    const container = document.getElementById('codexContent');
    if (!container) return;

    if (tab === 'monsters') {
      let bossHtml = '';
      for (const [floor, boss] of Object.entries(ZONE_BOSSES)) {
        bossHtml += `
          <div class="codex-boss-card">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <b style="color:#ffd700;font-size:15px;">${floor}F ${boss.name}</b>
              <span class="codex-badge-boss">구역 군주</span>
            </div>
            <div style="color:#a496bd;font-size:12px;margin-top:3px;">${boss.title} | 특수기: <span style="color:#ff5577;">${boss.special}</span></div>
            <div style="font-size:11px;color:#8df;margin-top:6px;">
              체력 x${boss.hpScale} | 공격 x${boss.atkScale} | 방어 x${boss.defScale}
            </div>
          </div>
        `;
      }

      let mobHtml = '';
      MONSTER_PROTOTYPES.forEach(m => {
        mobHtml += `
          <div class="codex-card">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <b style="color:#fff;font-size:14px;">${m.name}</b>
              <span class="codex-badge-mob">${m.ranged ? '원거리' : '근접'}</span>
            </div>
            <div style="font-size:11px;color:#aaa;margin-top:6px;">
              HP: ${m.baseHp} | 공격: ${m.baseAtk} | 방어: ${m.baseDef} | EXP: ${m.exp}
            </div>
          </div>
        `;
      });

      let mimicHtml = `
        <div class="codex-card" style="border-color:#ffaa00;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <b style="color:#ffd700;font-size:14px;">${MIMIC_DATA.normal.name}</b>
            <span class="codex-badge-mimic">보물상자 위장</span>
          </div>
          <div style="font-size:11px;color:#ccc;margin-top:6px;">
            일반 상자로 위장하며 접근 시 기습. EXP 5배 & 골드 6배 드랍.
          </div>
        </div>
        <div class="codex-card" style="border-color:#ffd700;box-shadow:0 0 10px rgba(255,215,0,0.3);">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <b style="color:#ffd700;font-size:14px;">${MIMIC_DATA.golden.name}</b>
            <span class="codex-badge-mimic" style="border-color:#ffd700;color:#ffd700;">황금상자 위장</span>
          </div>
          <div style="font-size:11px;color:#ccc;margin-top:6px;">
            황금빛 상자로 위장. EXP 10배, 골드 15배 및 고급 보석 확정 드랍.
          </div>
        </div>
      `;

      container.innerHTML = `
        <p style="color:#a496bd;margin-bottom:14px;font-size:13px;">
          마계의 탑을 침공한 마계 생명체들과 각 구역을 지배하는 10대 군주 보스 아카이브입니다.
        </p>
        <div class="codex-section-label" style="color:#ff3344;">10대 구역 군주 보스 (10F ~ 100F)</div>
        <div class="codex-grid" style="margin-bottom:20px;">${bossHtml}</div>
        <div class="codex-section-label" style="color:#00f0ff;">일반 마계 몬스터 (10종)</div>
        <div class="codex-grid" style="margin-bottom:20px;">${mobHtml}</div>
        <div class="codex-section-label" style="color:#ffd700;">신비한 상자 미믹 (2종)</div>
        <div class="codex-grid">${mimicHtml}</div>
      `;
    } else {
      // 업적 및 칭호 관리
      const curTitle = (this.player.activeTitle && TITLES[this.player.activeTitle]) || TITLES.novice;
      const unlocked = this.player.achievements || [];

      let achRows = '';
      ACHIEVEMENTS.forEach(ach => {
        const isDone = unlocked.includes(ach.id);
        const tDef = TITLES[ach.titleId];
        const isEquipped = this.player.activeTitle === ach.titleId;

        let progressStr = '0 / 1';
        if (ach.id === 'first_blood') progressStr = `${Math.min(1, this.player.stats_kills || 0)} / 1`;
        else if (ach.id === 'boss_slayer') progressStr = `${Math.min(1, this.player.stats_bossKills || 0)} / 1`;
        else if (ach.id === 'mimic_hunter') progressStr = `${Math.min(1, this.player.stats_mimicKills || 0)} / 1`;
        else if (ach.id === 'tower_savior') progressStr = this.player.isTowerDestroyed ? '1 / 1' : '0 / 1';
        else if (isDone) progressStr = '완료';

        achRows += `
          <div class="achievement-row ${isDone ? 'done' : ''}">
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;">
                <b style="font-size:14px;color:${isDone ? '#ffd700' : '#fff'};">${ach.name}</b>
                <span class="ach-status-tag ${isDone ? 'done' : ''}">${isDone ? '달성 완료' : '진행 중'}</span>
              </div>
              <div style="font-size:12px;color:#a496bd;margin-top:2px;">${ach.desc}</div>
              <div style="font-size:11px;color:#ffd700;margin-top:3px;">
                보상: <b>${ach.rewardGold.toLocaleString()} G</b> | 칭호 [${tDef.name}] <span style="color:#aaa;">(${tDef.desc})</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
              <span style="font-size:11px;color:#8df;">${progressStr}</span>
              ${isDone ? `
                <button class="game-btn ${isEquipped ? '' : 'gold-btn'}" style="padding:4px 10px;font-size:11px;" onclick="window.game.equipTitle('${ach.titleId}')">
                  ${isEquipped ? '착용 중' : '칭호 장착'}
                </button>
              ` : `
                <button class="game-btn" style="padding:4px 10px;font-size:11px;opacity:0.4;" disabled>미달성</button>
              `}
            </div>
          </div>
        `;
      });

      container.innerHTML = `
        <div style="background:rgba(20, 10, 35, 0.95);border:1px solid #d4af37;padding:12px;border-radius:10px;margin-bottom:14px;">
          <div style="font-size:11px;color:#a496bd;">현재 장착 중인 칭호</div>
          <div style="font-size:17px;font-weight:900;color:#ffd700;margin:4px 0;">
            [${curTitle.name}]
          </div>
          <div style="color:#00ffaa;font-size:12px;">효과: <b>${curTitle.desc}</b></div>
          <div style="margin-top:8px;">
            <button class="game-btn" style="font-size:11px;padding:3px 8px;" onclick="window.game.equipTitle('novice')">기본 칭호 [새내기 모험가]로 변경</button>
          </div>
        </div>
        <div class="codex-section-label" style="color:#ffd700;">원정 업적 및 칭호 목록</div>
        <div class="achievement-list">${achRows}</div>
      `;
    }
  }

  equipTitle(titleId) {
    if (!TITLES[titleId]) return;
    this.player.activeTitle = titleId;
    this.player.recalculateStats();
    this.updateHUD();
    this.accountMgr.saveActiveCharacterProgress(this.player);
    this.renderCodexUI('achievements');
    this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, `칭호 [${TITLES[titleId].name}] 장착!`, 'crit');
    if (this.soundMgr) this.soundMgr.playItemEquip();
  }

  checkAchievements() {
    if (!this.player) return;
    if (!this.player.achievements) this.player.achievements = [];

    ACHIEVEMENTS.forEach(ach => {
      if (this.player.achievements.includes(ach.id)) return;

      let satisfied = false;
      if (ach.id === 'first_blood' && (this.player.stats_kills || 0) >= 1) satisfied = true;
      if (ach.id === 'boss_slayer' && (this.player.stats_bossKills || 0) >= 1) satisfied = true;
      if (ach.id === 'mimic_hunter' && (this.player.stats_mimicKills || 0) >= 1) satisfied = true;
      if (ach.id === 'tower_savior' && this.player.isTowerDestroyed) satisfied = true;
      if (ach.id === 'enhance_master') {
        const allItems = [...Object.values(this.player.equip).filter(Boolean), ...this.player.inventory];
        if (allItems.some(it => it.enhance >= 10)) satisfied = true;
      }
      if (ach.id === 'gem_master') {
        const allItems = [...Object.values(this.player.equip).filter(Boolean), ...this.player.inventory];
        const hasHighGem = allItems.some(it => (it.gemList && it.gemList.some(g => g.tier >= 2)) || (it.isGem && it.tier >= 2));
        if (hasHighGem) satisfied = true;
      }

      if (satisfied) {
        this.player.achievements.push(ach.id);
        this.player.gold += ach.rewardGold;
        this.effectMgr.addFloatingText(this.player.x, this.player.y - 40, `🏆 업적 달성: [${ach.name}]!`, 'crit');
        this.effectMgr.addFloatingText(this.player.x, this.player.y - 60, `+${ach.rewardGold.toLocaleString()}G & [${TITLES[ach.titleId].name}] 칭호 획득!`, 'heal');
        if (this.soundMgr) this.soundMgr.playLevelUp();
        this.accountMgr.saveActiveCharacterProgress(this.player);
        this.updateHUD();
      }
    });
  }

  // --- 3순위: 동행 서포터 펫 UI 및 로직 ---
  renderPetUI() {
    const container = document.getElementById('petSelectList');
    if (!container) return;
    container.innerHTML = '';

    Object.values(PETS).forEach(pet => {
      const isEquipped = this.player.activePet === pet.id;
      const card = document.createElement('div');
      card.className = 'pet-card' + (isEquipped ? ' active' : '');
      card.innerHTML = `
        <div class="pet-card-info" style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:16px;font-weight:900;color:${pet.color};font-family:var(--font-title);">${pet.name}</span>
            ${isEquipped ? '<span class="pet-badge-active">동행 중</span>' : ''}
          </div>
          <div style="color:#ffd700;font-size:12px;font-weight:700;margin-top:2px;">
            ${pet.perkName} (쿨다운 ${pet.cd}초)
          </div>
          <div style="color:#ccc;font-size:11.5px;margin-top:3px;line-height:1.4;">
            ${pet.perkDesc}
          </div>
          <div style="color:#8df;font-size:11px;margin-top:3px;">
            자동 루팅 반경: <b>${pet.lootRange}px</b>
          </div>
        </div>
        <button class="game-btn ${isEquipped ? '' : 'gold-btn'}" style="padding:6px 12px;font-size:11.5px;flex-shrink:0;" onclick="window.game.selectPet('${pet.id}')">
          ${isEquipped ? '선택됨' : '동행 선택'}
        </button>
      `;
      container.appendChild(card);
    });
  }

  selectPet(petId) {
    if (!PETS[petId]) return;
    this.player.activePet = petId;
    this.player.recalculateStats();
    this.updateHUD();
    this.accountMgr.saveActiveCharacterProgress(this.player);
    this.renderPetUI();
    const pet = PETS[petId];
    this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, `🐾 [${pet.name}] 동행 시작!`, 'crit');
    if (this.soundMgr) this.soundMgr.playItemEquip();
  }

  updatePet(dt) {
    if (!this.player) return;
    if (!this.petPos) {
      this.petPos = { x: this.player.x, y: this.player.y };
    }

    const time = Date.now() * 0.003;
    const targetX = this.player.x + (this.player.facing === 'left' ? 32 : -32);
    const targetY = this.player.y - 36 + Math.sin(time * 2) * 8;
    this.petPos.x += (targetX - this.petPos.x) * 0.08;
    this.petPos.y += (targetY - this.petPos.y) * 0.08;

    const petDef = PETS[this.player.activePet] || PETS.drone;
    if (this.state === 'dungeon' && this.player.petCooldown <= 0) {
      const enemies = this.dungeonMgr.enemies.filter(e => e.isAlive);
      if (this.player.activePet === 'drone') {
        let nearest = null;
        let minDist = 300;
        enemies.forEach(e => {
          const d = Math.hypot(e.x - this.petPos.x, e.y - this.petPos.y);
          if (d < minDist) {
            minDist = d;
            nearest = e;
          }
        });
        if (nearest) {
          this.player.petCooldown = petDef.cd || 7.0;
          const dmg = Math.floor(this.player.statCache.atk * 2.2);
          nearest.takeDamage(dmg, false);
          this.effectMgr.createLaser(this.petPos.x, this.petPos.y, nearest.x, nearest.y, '#00f0ff', 0.25);
          this.effectMgr.addShockwave(nearest.x, nearest.y, 25, '#00f0ff');
          this.effectMgr.addFloatingText(nearest.x, nearest.y - 20, `${dmg} ⚡드론 사격!`, 'crit');
          if (this.soundMgr) this.soundMgr.playSkill('lightning');
        }
      } else if (this.player.activePet === 'wisp') {
        if (this.player.hp < this.player.statCache.maxHp || this.player.mp < this.player.statCache.maxMp) {
          this.player.petCooldown = petDef.cd || 8.0;
          const healHp = Math.floor(this.player.statCache.maxHp * 0.20);
          const healMp = Math.floor(this.player.statCache.maxMp * 0.20);
          this.player.hp = Math.min(this.player.statCache.maxHp, this.player.hp + healHp);
          this.player.mp = Math.min(this.player.statCache.maxMp, this.player.mp + healMp);
          this.effectMgr.addShockwave(this.player.x, this.player.y, 45, '#ffd700');
          this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, `+${healHp} HP 회복 (위스프)`, 'heal');
          this.updateHUD();
          if (this.soundMgr) this.soundMgr.playSkill('heal');
        }
      } else if (this.player.activePet === 'dragon') {
        let nearest = null;
        let minDist = 260;
        enemies.forEach(e => {
          const d = Math.hypot(e.x - this.petPos.x, e.y - this.petPos.y);
          if (d < minDist) {
            minDist = d;
            nearest = e;
          }
        });
        if (nearest) {
          this.player.petCooldown = petDef.cd || 6.0;
          const dmg = Math.floor(this.player.statCache.atk * 2.0);
          const vx = (nearest.x - this.petPos.x) / (minDist || 1);
          const vy = (nearest.y - this.petPos.y) / (minDist || 1);
          this.effectMgr.createProjectile({
            x: this.petPos.x,
            y: this.petPos.y,
            vx: vx * 9,
            vy: vy * 9,
            dmg: dmg,
            radius: 12,
            color: '#ff4400',
            duration: 2.0,
            type: 'fireball'
          });
          this.effectMgr.addFloatingText(this.petPos.x, this.petPos.y - 15, '🔥 브레스!', 'crit');
          if (this.soundMgr) this.soundMgr.playSkill('fireball');
        }
      }
    }
  }

  renderPet(ctx, camera) {
    if (!this.player || !this.petPos) return;
    const petDef = PETS[this.player.activePet] || PETS.drone;
    const px = this.petPos.x - camera.x;
    const py = this.petPos.y - camera.y;

    ctx.save();
    const shadowY = this.player.y - camera.y + 6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(px, shadowY, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = petDef.color;
    ctx.shadowBlur = 12;

    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(petDef.icon, px, py);

    ctx.font = 'bold 10px "Rajdhani", sans-serif';
    ctx.fillStyle = petDef.color;
    ctx.shadowBlur = 4;
    ctx.fillText(petDef.name, px, py - 18);
    ctx.restore();
  }

  // --- 1번: 차원 용병단 길드 UI 및 동행 관리 ---
  renderMercenaryUI() {
    const container = document.getElementById('mercenarySelectList');
    if (!container) return;
    container.innerHTML = '';

    const hiredList = this.player.hiredMercenaries || [];
    const activeId = this.player.mercenaryId;

    Object.values(window.MERCENARIES).forEach(merc => {
      const isHired = hiredList.includes(merc.id);
      const isActive = activeId === merc.id;

      const card = document.createElement('div');
      card.className = 'mercenary-card' + (isActive ? ' active' : '');
      card.innerHTML = `
        <div class="merc-header" style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <b style="color:${merc.color};font-size:16px;font-family:var(--font-title);">${merc.name}</b>
            <span style="color:#a496bd;font-size:12px;margin-left:6px;">[${merc.title}]</span>
          </div>
          <span class="merc-role-badge">${merc.role}</span>
        </div>

        <div class="merc-body" style="margin-top:8px;font-size:11.5px;color:#c9bede;line-height:1.4;">
          ${merc.desc}
        </div>

        <div class="merc-stats" style="margin-top:8px;background:rgba(10,5,20,0.6);padding:8px;border-radius:6px;font-size:11.5px;">
          <div style="display:flex;justify-content:space-between;color:#ff6688;">
            <span>생명력 (HP)</span><b>${((merc.hp || merc.baseHp || 1500)).toLocaleString()}</b>
          </div>
          <div style="display:flex;justify-content:space-between;color:#ffbb00;margin-top:2px;">
            <span>공격력</span><b>${(merc.atk || merc.baseAtk || 150)}</b>
          </div>
          <div style="display:flex;justify-content:space-between;color:#00e5ff;margin-top:2px;">
            <span>방어력</span><b>${(merc.def || merc.baseDef || 50)}</b>
          </div>
          <div style="color:#ffd700;margin-top:5px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:4px;">
            <b>고유 스킬:</b> ${merc.skillName} <span style="color:#bbb;font-size:11px;">(${merc.skillDesc})</span>
          </div>
        </div>

        <div class="merc-footer" style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#ffd700;font-weight:700;font-size:12.5px;">
            ${isHired ? '고용 완료' : `계약금: ${merc.cost.toLocaleString()} G`}
          </span>
          <div>
            ${isActive ? `
              <button class="game-btn" style="border-color:#ff4466;color:#ff99aa;padding:4px 10px;font-size:11.5px;" onclick="window.game.dismissMercenaryAction()">
                동행 해제
              </button>
            ` : isHired ? `
              <button class="game-btn gold-btn" style="padding:4px 10px;font-size:11.5px;" onclick="window.game.summonMercenaryAction('${merc.id}')">
                동행 출진
              </button>
            ` : `
              <button class="game-btn gold-btn" style="padding:4px 10px;font-size:11.5px;" onclick="window.game.hireMercenaryAction('${merc.id}')">
                용병 고용
              </button>
            `}
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  hireMercenaryAction(mercId) {
    const merc = window.MERCENARIES[mercId];
    if (!merc) return;
    if (this.player.gold < merc.cost) {
      alert(`골드가 부족합니다! (필요: ${merc.cost.toLocaleString()} G)`);
      return;
    }
    this.player.gold -= merc.cost;
    this.player.hiredMercenaries = this.player.hiredMercenaries || [];
    if (!this.player.hiredMercenaries.includes(mercId)) {
      this.player.hiredMercenaries.push(mercId);
    }
    this.summonMercenaryAction(mercId);
  }

  summonMercenaryAction(mercId) {
    const mercDef = window.MERCENARIES[mercId];
    if (!mercDef) return;
    this.player.mercenaryId = mercId;
    this.mercenary = new Mercenary(mercDef, this.player);
    this.player.recalculateStats();
    this.updateHUD();
    this.renderMercenaryUI();
    this.accountMgr.saveActiveCharacterProgress(this.player);

    if (this.soundMgr) this.soundMgr.playEnhanceSuccess();
    if (this.effectMgr) {
      this.effectMgr.addShockwave(this.player.x, this.player.y, 70, mercDef.color);
      this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, `🤝 [${mercDef.name}] 동행 시작!`, 'crit');
    }
  }

  dismissMercenaryAction() {
    this.player.mercenaryId = null;
    this.mercenary = null;
    this.player.recalculateStats();
    this.updateHUD();
    this.renderMercenaryUI();
    this.accountMgr.saveActiveCharacterProgress(this.player);

    if (this.effectMgr) {
      this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, '용병 동행이 해제되었습니다.', 'normal');
    }
  }

  // --- 6번: 마을 건설 & 고대 마법 연구소 UI 및 증축 관리 ---
  renderResearchUI() {
    const matBar = document.getElementById('researchMaterialsBar');
    const container = document.getElementById('researchFacilityList');
    if (!matBar || !container) return;

    if (typeof this.player.runestones === 'string') {
      const parsedNum = parseInt(this.player.runestones, 10);
      this.player.runestoneCurrency = Math.max(Number(this.player.runestoneCurrency) || 0, isNaN(parsedNum) ? 50 : Math.min(parsedNum, 500));
      this.player.runestones = [];
    }
    if (!Array.isArray(this.player.runestones)) {
      this.player.runestones = [];
    }

    const gold = Number(this.player.gold) || 0;
    const runestones = Number(this.player.runestoneCurrency) || 0;
    const enhanceStones = (this.player.materials && this.player.materials.upgrade_stone) || 0;
    const shards = (this.player.materials && this.player.materials.dimension_shard) || 0;

    matBar.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;">
        <div class="research-mat-strip">
          <span>골드: <b>${gold.toLocaleString()} G</b></span>
          <span>고대 룬스톤: <b>${runestones.toLocaleString()}</b></span>
          <span>강화석: <b>${enhanceStones}</b></span>
          <span>차원 파편: <b>${shards}</b></span>
        </div>
        <button class="game-btn gold-btn" style="padding:4px 10px;font-size:11px;" onclick="window.game.grantTestResearchMaterials()">
          지원 물자 수령 (+50,000 G / 룬스톤 50)
        </button>
      </div>
    `;

    container.innerHTML = '';
    const resLevels = this.player.researchLevels || {};

    Object.values(window.TOWN_RESEARCH || {}).forEach(fac => {
      const curLv = Number(resLevels[fac.id]) || 0;
      const isMax = curLv >= fac.maxLevel;
      const nextLv = curLv + 1;
      const costGold = (fac.costGoldBase || 3000) * (curLv + 1);
      const costRune = (fac.costRuneBase || 5) * (curLv + 1);
      const canAfford = gold >= costGold && runestones >= costRune;

      const card = document.createElement('div');
      card.className = 'research-card';
      card.innerHTML = `
        <div class="research-header">
          <div>
            <div style="font-size:15px;font-weight:700;color:#fff;">${fac.name}</div>
            <div style="font-size:11.5px;color:#a496bd;">${fac.sub || ''}</div>
          </div>
          <span class="research-level-badge ${isMax ? 'max' : ''}">
            ${isMax ? '연구 완료 (MAX)' : `Lv.${curLv} / Lv.${fac.maxLevel}`}
          </span>
        </div>

        <div class="research-body">
          <div style="margin-bottom:6px;font-size:12px;color:#c9bede;">${fac.desc}</div>
          <div style="background:rgba(20,10,35,0.7);padding:6px 8px;border-radius:6px;border-left:3px solid #ffcc00;font-size:11.5px;">
            <div style="color:#00ffaa;font-weight:600;">현재 효과: ${curLv === 0 ? '미건설 (효과 없음)' : (fac.effectDesc ? fac.effectDesc(curLv) : fac.desc)}</div>
            ${!isMax ? `<div style="color:#ffbb33;font-size:11px;margin-top:2px;">다음 단계: ${(fac.effectDesc ? fac.effectDesc(nextLv) : fac.desc)}</div>` : ''}
          </div>
        </div>

        <div class="research-footer">
          <div style="font-size:11.5px;">
            ${isMax ? `
              <span style="color:#00ffaa;font-weight:700;">최고 등급 도달</span>
            ` : `
              <span style="color:#ffd700;">비용: <b>${costGold.toLocaleString()} G</b> + <b>${costRune} 룬스톤</b></span>
            `}
          </div>
          <div>
            ${isMax ? `
              <button class="game-btn" disabled style="opacity:0.4;padding:4px 10px;font-size:11px;">최대 레벨</button>
            ` : `
              <button class="game-btn ${canAfford ? 'gold-btn' : ''}" style="${!canAfford ? 'opacity:0.4;' : ''}padding:4px 12px;font-size:11.5px;" onclick="window.game.upgradeResearchAction('${fac.id}')">
                연구 진행
              </button>
            `}
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  upgradeResearchAction(facId) {
    const fac = window.TOWN_RESEARCH && window.TOWN_RESEARCH[facId];
    if (!fac) return;

    if (!this.player.researchLevels) this.player.researchLevels = {};
    const curLv = Number(this.player.researchLevels[facId]) || 0;
    if (curLv >= fac.maxLevel) {
      alert('이미 최대 연구 레벨에 도달했습니다.');
      return;
    }

    const costGold = (fac.costGoldBase || 3000) * (curLv + 1);
    const costRune = (fac.costRuneBase || 5) * (curLv + 1);
    const curGold = Number(this.player.gold) || 0;
    const curRunestones = Number(this.player.runestoneCurrency) || 0;

    if (curGold < costGold) {
      alert(`골드가 부족합니다! (필요: ${costGold.toLocaleString()} G)`);
      return;
    }
    if (curRunestones < costRune) {
      alert(`고대 룬스톤이 부족합니다! (필요: ${costRune} 개) \n* 상단의 [연구 지원 물자 수령] 버튼을 눌러 테스트 물자를 획득하세요!`);
      return;
    }

    this.player.gold = curGold - costGold;
    this.player.runestoneCurrency = curRunestones - costRune;
    this.player.researchLevels[facId] = curLv + 1;

    this.player.recalculateStats();
    this.updateHUD();
    this.renderResearchUI();
    this.accountMgr.saveActiveCharacterProgress(this.player);

    if (this.soundMgr) this.soundMgr.playEnhanceSuccess();
    if (this.effectMgr) {
      this.effectMgr.addShockwave(this.player.x, this.player.y, 80, '#ffd700');
      this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, `🏛️ [${fac.name}] Lv.${curLv + 1} 증축 완료!`, 'crit');
    }
  }

  grantTestResearchMaterials() {
    this.player.gold = (Number(this.player.gold) || 0) + 50000;
    this.player.runestoneCurrency = (Number(this.player.runestoneCurrency) || 0) + 50;
    if (typeof this.player.runestones === 'string') {
      this.player.runestones = [];
    }
    if (this.player.materials) {
      this.player.materials.upgrade_stone = (Number(this.player.materials.upgrade_stone) || 0) + 20;
      this.player.materials.dimension_shard = (Number(this.player.materials.dimension_shard) || 0) + 20;
    }
    this.updateHUD();
    this.renderResearchUI();
    this.accountMgr.saveActiveCharacterProgress(this.player);

    if (this.soundMgr) this.soundMgr.playGem();
    if (this.effectMgr) {
      this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, `🧪 연구 물자 수령 완료! (+50,000G / +50 룬스톤)`, 'heal');
    }
  }

  // --- 1순위: 100층 탑 붕괴 엔딩 시네마틱 & 에필로그 ---
  triggerTowerCollapseEnding() {
    this.closeAllModals();
    const modal = document.getElementById('modal_ending');
    if (!modal) return;
    modal.style.display = 'flex';
    this.activeModal = 'ending';

    this.player.isTowerDestroyed = true;
    if (!this.player.achievements) this.player.achievements = [];
    if (!this.player.achievements.includes('tower_savior')) {
      this.player.achievements.push('tower_savior');
      this.player.gold += 100000;
      this.player.activeTitle = 'tower_savior';
      this.player.recalculateStats();
    }
    this.accountMgr.saveActiveCharacterProgress(this.player);
    this.updateHUD();

    const summaryEl = document.getElementById('endingStatsSummary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:14px;color:#eee;">
          <div>🏆 정복 층수: <b style="color:#ffd700;">100F 마계 군주 아자젤 격파</b></div>
          <div>⚔️ 총 처치 몬스터: <b style="color:#00ffaa;">${this.player.stats_kills || 0} 마리</b></div>
          <div>👑 격파 구역 보스: <b style="color:#ff5577;">${this.player.stats_bossKills || 0} 기</b></div>
          <div>📦 토벌 미믹: <b style="color:#ffd700;">${this.player.stats_mimicKills || 0} 체</b></div>
        </div>
        <div style="margin-top:12px;padding-top:10px;border-top:1px dashed #5a328c;color:#ffd700;font-size:13px;line-height:1.5;">
          ✨ 원정 보상: 전설 칭호 <b>[🌟 행성의 수호신]</b> 자동 장착 & <b>100,000 Gold</b> 특별 원정 보상금 지급 완료!<br>
          💀 극한 엔드콘텐츠: <b>무한 악몽 심연 (101F~)</b> 모드가 영구 개방되었습니다.
        </div>
      `;
    }

    if (this.soundMgr) this.soundMgr.playVictory();
    this.startTowerCollapseAnimation();
  }

  startTowerCollapseAnimation() {
    const canvas = document.getElementById('endingAnimCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const chunks = [];
    for (let i = 0; i < 45; i++) {
      chunks.push({
        x: w * 0.5 + (Math.random() - 0.5) * 70,
        y: h * 0.25 + Math.random() * 80,
        w: 8 + Math.random() * 16,
        h: 8 + Math.random() * 14,
        vx: (Math.random() - 0.5) * 5,
        vy: -2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.15,
        color: Math.random() > 0.4 ? '#4a255b' : '#271333'
      });
    }

    const sparks = [];
    for (let i = 0; i < 60; i++) {
      sparks.push({
        x: w * 0.5 + (Math.random() - 0.5) * 80,
        y: h * 0.4 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: Math.random() > 0.5 ? '#ffd700' : '#ff3344',
        size: 2 + Math.random() * 3,
        alpha: 1.0
      });
    }

    let startTime = Date.now();

    const loop = () => {
      const modal = document.getElementById('modal_ending');
      if (!modal || modal.style.display === 'none') return;

      const elapsed = (Date.now() - startTime) / 1000;
      ctx.clearRect(0, 0, w, h);

      const dawnProgress = Math.min(1.0, Math.max(0, (elapsed - 2.5) / 4.0));
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (dawnProgress < 1.0) {
        grad.addColorStop(0, '#0a0314');
        grad.addColorStop(0.6, '#280c35');
        grad.addColorStop(1, '#15061e');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (dawnProgress > 0) {
        ctx.save();
        ctx.globalAlpha = dawnProgress;
        const dawnGrad = ctx.createLinearGradient(0, 0, 0, h);
        dawnGrad.addColorStop(0, '#1a3c6e');
        dawnGrad.addColorStop(0.5, '#e08742');
        dawnGrad.addColorStop(0.85, '#ffd275');
        dawnGrad.addColorStop(1, '#81b29a');
        ctx.fillStyle = dawnGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#fff6cc';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.58, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = '#11071f';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.78);
      ctx.lineTo(w * 0.25, h * 0.72);
      ctx.lineTo(w * 0.5, h * 0.76);
      ctx.lineTo(w * 0.75, h * 0.70);
      ctx.lineTo(w, h * 0.77);
      ctx.lineTo(w, h);
      ctx.fill();

      const towerShake = elapsed < 3.5 ? Math.sin(elapsed * 45) * 4 : 0;
      const collapseY = Math.min(h * 0.6, Math.max(0, (elapsed - 1.5) * 35));

      if (elapsed < 6.0) {
        ctx.save();
        ctx.translate(w * 0.5 + towerShake, h * 0.75);
        ctx.fillStyle = '#321845';
        ctx.strokeStyle = '#ff3344';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(-45, 0);
        ctx.lineTo(-25, -70 + collapseY);
        ctx.lineTo(25, -70 + collapseY);
        ctx.lineTo(45, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-12, -40 + collapseY);
        ctx.lineTo(10, -55 + collapseY);
        ctx.stroke();
        ctx.restore();
      }

      if (elapsed > 1.2) {
        chunks.forEach(c => {
          c.x += c.vx;
          c.y += c.vy;
          c.vy += 0.18;
          c.rot += c.vrot;

          if (c.y < h * 0.78) {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.restore();
          }
        });
      }

      if (elapsed > 2.0 && elapsed < 8.0) {
        ctx.save();
        const beamAlpha = Math.min(1.0, (elapsed - 2.0) * 0.8) * Math.max(0, 1 - (elapsed - 5.5) / 2.5);
        ctx.globalAlpha = beamAlpha;
        const beamGrad = ctx.createLinearGradient(w * 0.5 - 40, 0, w * 0.5 + 40, 0);
        beamGrad.addColorStop(0, 'rgba(255, 215, 0, 0)');
        beamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
        beamGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(w * 0.5 - 50, 0, 100, h * 0.78);
        ctx.restore();
      }

      sparks.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.alpha = Math.max(0, s.alpha - 0.012);
        if (s.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = s.alpha;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      ctx.save();
      ctx.font = 'bold 15px "Cinzel", serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffbb00';
      ctx.shadowBlur = 10;
      if (elapsed > 4.5) {
        ctx.fillText('🌟 외계 행성에 찬란한 평화가 깃들었습니다 🌟', w / 2, h - 18);
      } else {
        ctx.fillText('⚡ 마계의 탑이 무너져 내립니다! ⚡', w / 2, h - 18);
      }
      ctx.restore();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  finishEndingAndReturnTown() {
    this.closeAllModals();
    this.returnToTown();
    this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, '🕊️ 평화로운 행성으로 귀환했습니다.', 'heal');
  }

  enterInfiniteNightmare() {
    this.closeAllModals();
    this.toggleModal('affix');
  }

  // --- 1번: 무한 악몽 심연 10종 돌연변이 어픽스 (Diablo / PoE 지도 모디파이어) UI & 설정 ---
  renderAffixUI() {
    const container = document.getElementById('affixCardGrid');
    if (!container) return;

    if (!this.selectedAffixes) {
      this.selectedAffixes = ['corpse_explosion', 'vampiric', 'thunder_storm', 'ironclad'];
    }

    container.innerHTML = '';
    const affixes = window.ABYSS_AFFIXES || {};

    const shortSummaries = {
      corpse_explosion: '처치 시 주변 자폭 폭발',
      vampiric: '적 공격 시 35% 생명력 흡혈',
      thunder_storm: '3.5초마다 플레이어 위치 벼락 투하',
      ironclad: '적 방어력 +50%, 받는 피해 20% 감소',
      furious_haste: '적 이동속도 +45%, 공격속도 +40%',
      freezing_aura: '적 주변 진입 시 이속 35% 둔화',
      magma_geysers: '던전 바닥 주기적 화염 기둥 분출',
      toxic_contagion: '피격 시 초당 지속 맹독 피해',
      void_gravity: '8초마다 중심부 심연 중력 홀 개방',
      empowered_elites: '모든 정예 적 추가 스킬 2종 보유'
    };

    Object.entries(affixes).forEach(([id, def]) => {
      const isActive = this.selectedAffixes.includes(id);
      const row = document.createElement('div');
      row.className = `affix-row ${isActive ? 'active' : ''}`;
      row.onclick = (e) => {
        if (e.target.tagName !== 'INPUT') {
          this.toggleAffixAction(id);
        }
      };

      const summary = shortSummaries[id] || def.desc;

      row.innerHTML = `
        <div class="affix-row-left">
          <input type="checkbox" class="affix-check" id="chk_${id}" ${isActive ? 'checked' : ''} onchange="window.game.toggleAffixAction('${id}')">
          <span class="affix-row-name" style="color:${isActive ? '#ffd700' : '#fff'};">${def.name}</span>
          <span class="affix-row-desc">${summary}</span>
        </div>
        <div class="affix-row-right">
          <span class="affix-bonus-tag">+${def.mfBonus}% MF</span>
        </div>
      `;
      container.appendChild(row);
    });

    this.updateAffixBonusSummary();
  }

  toggleAffixAction(id) {
    if (!this.selectedAffixes) this.selectedAffixes = [];
    const idx = this.selectedAffixes.indexOf(id);
    if (idx >= 0) {
      this.selectedAffixes.splice(idx, 1);
    } else {
      this.selectedAffixes.push(id);
    }
    this.renderAffixUI();
  }

  setAffixPreset(type) {
    const allKeys = Object.keys(window.ABYSS_AFFIXES || {});
    if (type === 'all') {
      this.selectedAffixes = [...allKeys];
    } else if (type === 'safe') {
      this.selectedAffixes = ['ironclad', 'furious_haste', 'empowered_elites'];
    } else if (type === 'random') {
      const shuffled = [...allKeys].sort(() => 0.5 - Math.random());
      this.selectedAffixes = shuffled.slice(0, 5);
    } else if (type === 'clear') {
      this.selectedAffixes = [];
    }
    this.renderAffixUI();
    if (this.soundMgr) this.soundMgr.playItemEquip();
  }

  updateAffixBonusSummary() {
    const affixes = window.ABYSS_AFFIXES || {};
    let totalMf = 0;
    let totalGold = 0;
    let totalExp = 0;

    (this.selectedAffixes || []).forEach(id => {
      const def = affixes[id];
      if (def) {
        totalMf += Math.round(Number(def.mfBonus) || 0);
        totalGold += Math.round(Number(def.goldBonus) || 0);
        totalExp += Math.round(Number(def.expBonus) || 0);
      }
    });

    const mfEl = document.getElementById('affixTotalMf');
    const goldEl = document.getElementById('affixTotalGold');
    const expEl = document.getElementById('affixTotalExp');

    if (mfEl) mfEl.innerText = `+${Math.round(totalMf)}%`;
    if (goldEl) goldEl.innerText = `+${Math.round(totalGold)}%`;
    if (expEl) expEl.innerText = `+${Math.round(totalExp)}%`;
  }

  applyAffixesAndLaunch() {
    if (!this.dungeonMgr) return;
    this.dungeonMgr.activeAffixes = [...(this.selectedAffixes || [])];
    this.closeAllModals();

    const targetFloor = (this.state === 'dungeon' && this.dungeonMgr.currentFloor >= 101) 
      ? this.dungeonMgr.currentFloor 
      : 101;

    this.enterDungeon(targetFloor);
    this.effectMgr.screenShake(16, 0.6);
    this.effectMgr.addFloatingText(this.player.x, this.player.y - 30, `💀 [${this.selectedAffixes.length}개 심연 돌연변이] 발동!`, 'crit');
    if (this.soundMgr) this.soundMgr.playBossEncounter();
  }

  // --- 1번: 고대 유물 (Roguelike Relic) 3택 선택 & 덱 관리 ---
  openRelicChoiceModal() {
    const modal = document.getElementById('modal_relic_select');
    const grid = document.getElementById('relicChoiceGrid');
    if (!modal || !grid) return;

    const owned = this.player.relics || [];
    const allRelics = Object.values(window.RELICS || {});
    const unowned = allRelics.filter(r => !owned.includes(r.id));

    // 만약 전부 획득했다면 전체 중에서 랜덤 3개
    const pool = unowned.length >= 3 ? unowned : allRelics;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    this.currentRelicChoices = shuffled.slice(0, 3);

    grid.innerHTML = '';
    this.currentRelicChoices.forEach(relic => {
      const card = document.createElement('div');
      card.className = 'relic-card';
      card.innerHTML = `
        <div class="relic-icon">${relic.icon}</div>
        <div class="relic-name">${relic.name}</div>
        <div class="relic-flavor">"${relic.flavor}"</div>
        <div class="relic-desc">${relic.desc}</div>
        <button class="relic-btn-pick" onclick="window.game.chooseRelicAction('${relic.id}')">선택하여 각성</button>
      `;
      grid.appendChild(card);
    });

    this.closeAllModals();
    modal.style.display = 'flex';
    this.activeModal = 'relic_select';
    if (this.soundMgr) this.soundMgr.playLevelUp();
  }

  chooseRelicAction(relicId) {
    const def = window.RELICS && window.RELICS[relicId];
    if (!def) return;

    if (!this.player.relics) this.player.relics = [];
    if (!this.player.relics.includes(relicId)) {
      this.player.relics.push(relicId);
    }

    this.closeAllModals();
    this.accountMgr.saveActiveCharacterProgress(this.player);

    if (this.soundMgr) this.soundMgr.playEnhanceSuccess();
    if (this.effectMgr) {
      this.effectMgr.screenShake(10, 0.4);
      this.effectMgr.addShockwave(this.player.x, this.player.y, 90, '#ffd700');
      this.effectMgr.spawnSparks(this.player.x, this.player.y, 35, '#ffd700');
      this.effectMgr.addFloatingText(this.player.x, this.player.y - 35, `📜 [고대 유물: ${def.name}] 각성 완료!`, 'crit');
    }
  }

  renderRelicDeckUI() {
    const container = document.getElementById('relicDeckList');
    if (!container) return;

    const owned = this.player.relics || [];
    if (owned.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:30px;color:#a496bd;">
          <div style="font-size:36px;margin-bottom:8px;">📜</div>
          <div>아직 획득한 고대 유물이 없습니다.</div>
          <div style="font-size:12px;color:#ffd700;margin-top:6px;">101층 이상의 무한 악몽 심연 보스를 처치하면 고대 유물을 선택할 수 있습니다!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    owned.forEach(rId => {
      const def = window.RELICS && window.RELICS[rId];
      if (!def) return;

      const card = document.createElement('div');
      card.className = 'relic-deck-card';
      card.innerHTML = `
        <div style="font-size:32px;">${def.icon}</div>
        <b style="color:#ffd700;font-size:14px;">${def.name}</b>
        <div style="color:#a496bd;font-size:11px;font-style:italic;">"${def.flavor}"</div>
        <div style="color:#00ffaa;font-size:12px;margin-top:4px;">${def.desc}</div>
      `;
      container.appendChild(card);
    });
  }

  // --- 2순위: 레이더 미니맵 렌더러 ---
  renderMinimap() {
    if (!this.minimapCtx || this.state !== 'dungeon') return;
    const mctx = this.minimapCtx;
    const mw = 140;
    const mh = 88;
    const mapW = this.dungeonMgr.width;
    const mapH = this.dungeonMgr.height;

    mctx.clearRect(0, 0, mw, mh);
    mctx.fillStyle = 'rgba(10, 5, 18, 0.95)';
    mctx.fillRect(0, 0, mw, mh);

    // 계단/포털 표시
    const stX = (this.dungeonMgr.stairs.x / mapW) * mw;
    const stY = (this.dungeonMgr.stairs.y / mapH) * mh;
    mctx.fillStyle = this.dungeonMgr.stairs.isOpen ? '#ffd700' : '#7755aa';
    mctx.beginPath();
    mctx.arc(stX, stY, 4, 0, Math.PI * 2);
    mctx.fill();

    // 몬스터 및 보스 표시
    this.dungeonMgr.enemies.forEach(en => {
      if (!en.isAlive) return;
      const ex = (en.x / mapW) * mw;
      const ey = (en.y / mapH) * mh;

      if (en.isBoss) {
        mctx.fillStyle = '#ff1a40';
        mctx.beginPath();
        mctx.arc(ex, ey, 5, 0, Math.PI * 2);
        mctx.fill();
        mctx.strokeStyle = '#ffd700';
        mctx.lineWidth = 1.5;
        mctx.stroke();
      } else if (en.isMimic) {
        mctx.fillStyle = '#ffcc00';
        mctx.fillRect(ex - 2, ey - 2, 4, 4);
      } else {
        mctx.fillStyle = '#ff4444';
        mctx.beginPath();
        mctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        mctx.fill();
      }
    });

    // 플레이어 위치 표시
    if (this.player) {
      const px = (this.player.x / mapW) * mw;
      const py = (this.player.y / mapH) * mh;

      mctx.fillStyle = '#00ffaa';
      mctx.beginPath();
      mctx.arc(px, py, 3.5, 0, Math.PI * 2);
      mctx.fill();

      // 시야 방향 선
      mctx.strokeStyle = '#00ffaa';
      mctx.lineWidth = 1.5;
      mctx.beginPath();
      mctx.moveTo(px, py);
      mctx.lineTo(px + Math.cos(this.player.angle) * 7, py + Math.sin(this.player.angle) * 7);
      mctx.stroke();
    }
  }

  // --- 3순위: 커스텀 아케인 조준선 커서 렌더러 ---
  renderCustomCursor() {
    const mx = this.input.mouseX;
    const my = this.input.mouseY;
    const ctx = this.ctx;

    ctx.save();
    const isTargeting = this.hoveredEnemy !== null;
    const color = isTargeting ? '#ff3344' : '#00f0ff';

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    // 회전 조준 링
    const time = Date.now() * 0.003;
    ctx.beginPath();
    ctx.arc(mx, my, isTargeting ? 18 : 12, time, time + Math.PI * 1.5);
    ctx.stroke();

    // 십자선
    const gap = isTargeting ? 6 : 4;
    const len = isTargeting ? 14 : 9;
    ctx.beginPath();
    ctx.moveTo(mx - len, my); ctx.lineTo(mx - gap, my);
    ctx.moveTo(mx + gap, my); ctx.lineTo(mx + len, my);
    ctx.moveTo(mx, my - len); ctx.lineTo(mx, my - gap);
    ctx.moveTo(mx, my + gap); ctx.lineTo(mx, my + len);
    ctx.stroke();

    // 중앙 타겟 점
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(mx, my, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- 메인 게임 루프 ---
  gameLoop(time) {
    const rawDt = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    // 슬로우 모션 타이머 관리
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= rawDt;
      if (this.slowMoTimer <= 0) {
        this.timeScale = 1.0; // 정상 속도 복귀
      }
    }

    if (this.victoryBanner.active) {
      this.victoryBanner.timer -= rawDt;
      if (this.victoryBanner.timer <= 0) {
        this.victoryBanner.active = false;
      }
    }

    const dt = rawDt * this.timeScale;

    this.update(dt);
    this.render();

    requestAnimationFrame(t => this.gameLoop(t));
  }

  update(dt) {
    if (!this.player) return;

    const walls = this.state === 'dungeon' ? this.dungeonMgr.walls : [];
    this.player.update(dt, this.input, walls);
    this.updatePet(dt);

    if (this.mercenary) {
      this.mercenary.update(dt, this.player, this.state === 'dungeon' ? this.dungeonMgr.enemies : []);
    }

    const jobInfo = CLASSES[this.player.job];
    jobInfo.skills.forEach(skill => {
      const cdEl = document.getElementById(`cd_sweeper_${skill.id}`);
      if (cdEl) {
        const cd = this.player.skillCooldowns[skill.id] || 0;
        if (cd > 0) {
          cdEl.style.height = `${(cd / skill.cd) * 100}%`;
          cdEl.innerText = cd.toFixed(1);
        } else {
          cdEl.style.height = '0%';
          cdEl.innerText = '';
        }
      }
    });

    // 2번: 패링 상태 HUD 비주얼 갱신
    const btnParryCore = document.getElementById('btnParryCore');
    if (btnParryCore) {
      if (this.player.isParrying) {
        btnParryCore.classList.add('parrying');
      } else {
        btnParryCore.classList.remove('parrying');
      }
    }

    // 모바일 전용 상호작용 / 던전 입장 버튼 활성화 갱신
    const mBtnInteract = document.getElementById('mBtnInteract');
    if (mBtnInteract) {
      if (this.state === 'town') {
        const nearbyNpc = this.townMgr.checkInteraction(this.player);
        if (nearbyNpc) {
          mBtnInteract.style.display = 'flex';
          const label = nearbyNpc.id === 'portal' ? '입장'
            : nearbyNpc.id === 'blacksmith' ? '대장간'
            : nearbyNpc.id === 'shop' ? '상점'
            : nearbyNpc.id === 'dummy' ? '훈련'
            : nearbyNpc.id === 'mercenary' ? '용병' : '연구소';
          mBtnInteract.innerText = label;
          const doInteract = (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            this.handleNPCInteraction(nearbyNpc);
          };
          mBtnInteract.onclick = doInteract;
          mBtnInteract.ontouchstart = doInteract;
        } else {
          mBtnInteract.style.display = 'none';
        }
      } else {
        if (this.dungeonMgr && this.dungeonMgr.portal) {
          const pd = Math.hypot(this.player.x - this.dungeonMgr.portal.x, this.player.y - this.dungeonMgr.portal.y);
          if (pd <= this.dungeonMgr.portal.radius + 35) {
            mBtnInteract.style.display = 'flex';
            mBtnInteract.innerText = '다음층';
            const doNextFloor = (e) => {
              if (e) { e.preventDefault(); e.stopPropagation(); }
              this.dungeonMgr.descendFloor(this.player);
            };
            mBtnInteract.onclick = doNextFloor;
            mBtnInteract.ontouchstart = doNextFloor;
          } else {
            mBtnInteract.style.display = 'none';
          }
        } else {
          mBtnInteract.style.display = 'none';
        }
      }
    }

    if (this.state === 'dungeon') {
      this.dungeonMgr.update(dt, this.player);
      this.effectMgr.update(dt, this.dungeonMgr.enemies, this.player);
    } else {
      this.effectMgr.update(dt, [], this.player);
    }

    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    if (this.effectMgr.shakeTime > 0) {
      this.camera.x += (Math.random() - 0.5) * this.effectMgr.shakeIntensity;
      this.camera.y += (Math.random() - 0.5) * this.effectMgr.shakeIntensity;
    }

    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 10) {
      this.autoSaveTimer = 0;
      this.accountMgr.saveActiveCharacterProgress(this.player);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === 'town') {
      this.townMgr.renderBackground(this.ctx, this.canvas.width, this.canvas.height, this.camera);
      this.townMgr.renderNPCs(this.ctx, this.camera);
    } else {
      this.dungeonMgr.render(this.ctx, this.camera);
    }

    if (this.player) {
      this.player.render(this.ctx, this.camera);
      this.renderPet(this.ctx, this.camera);
      if (this.mercenary) {
        this.mercenary.render(this.ctx, this.camera);
      }
    }

    this.effectMgr.render(this.ctx, this.camera);
    this.effectMgr.renderOverlay(this.ctx, this.canvas.width, this.canvas.height);

    // 2순위: 레이더 미니맵
    this.renderMinimap();

    // 3순위: 커스텀 아케인 조준선 커서
    this.renderCustomCursor();

    // B 항목: 보스 승리 시네마틱 골드 배너
    if (this.victoryBanner.active) {
      this.renderVictoryBanner();
    }
  }

  renderVictoryBanner() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(20, 10, 35, 0.7)';
    ctx.fillRect(0, h * 0.32, w, 110);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.32); ctx.lineTo(w, h * 0.32);
    ctx.moveTo(0, h * 0.32 + 110); ctx.lineTo(w, h * 0.32 + 110);
    ctx.stroke();

    ctx.font = '900 36px "Cinzel", serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffbb00';
    ctx.shadowBlur = 20;
    ctx.fillText('★ VICTORY - BOSS DEFEATED ★', w / 2, h * 0.32 + 50);

    ctx.font = 'bold 20px "Rajdhani", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(this.victoryBanner.text, w / 2, h * 0.32 + 88);
    ctx.restore();
  }
}

window.GameEngine = GameEngine;

window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
