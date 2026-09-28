// 1~100 Floor Dungeon Generator, Monster Spawner, Boss Unique Telegraphed Attack Patterns & Mimics

class DungeonManager {
  constructor() {
    this.currentFloor = 1;
    this.theme = null;
    this.width = 1600;
    this.height = 1200;
    this.walls = [];
    this.enemies = [];
    this.drops = [];
    this.stairs = { x: 1400, y: 600, radius: 40, isOpen: false };
    this.entrance = { x: 200, y: 600 };
    this.isCleared = false;
    this.bossAlive = false;
    this.isFinalCleared = false;

    // 층별 고해상도 던전 바닥 타일 텍스처 프리로드
    this.textures = {
      crypt: new Image(),
      magma: new Image(),
      ice: new Image(),
      thunder: new Image(),
      abyss: new Image()
    };
    this.textures.crypt.src = 'assets/dungeons/crypt.jpg';
    this.textures.magma.src = 'assets/dungeons/magma.jpg';
    this.textures.ice.src = 'assets/dungeons/ice.jpg';
    this.textures.thunder.src = 'assets/dungeons/thunder.jpg';
    this.textures.abyss.src = 'assets/dungeons/abyss.jpg';
    this.patternCache = {};
  }

  getTextureKeyForFloor(floor) {
    if (floor >= 91) return 'abyss';
    if (floor >= 81) return 'magma';
    if (floor >= 51) return 'crypt';
    if (floor >= 41) return 'thunder';
    if (floor >= 31) return 'ice';
    if (floor >= 21) return 'magma';
    return 'crypt';
  }

  getThemeForFloor(floor) {
    for (let i = 0; i < DUNGEON_THEMES.length; i++) {
      const th = DUNGEON_THEMES[i];
      if (floor >= th.minF && floor <= th.maxF) return th;
    }
    return DUNGEON_THEMES[DUNGEON_THEMES.length - 1];
  }

  initFloor(floor, player) {
    this.currentFloor = Math.max(1, Math.min(GAME_CONFIG.MAX_FLOOR, floor));
    this.theme = this.getThemeForFloor(this.currentFloor);
    this.enemies = [];
    this.drops = [];
    this.bossBullets = [];
    this.affixTimer = 0;
    this.isCleared = false;
    this.bossAlive = false;

    // 1번: 무한 악몽 심연 (101F~) 던전 돌연변이 어픽스 세팅
    if (this.currentFloor >= 101) {
      if (window.game && window.game.selectedAffixes && window.game.selectedAffixes.length > 0) {
        this.activeAffixes = [...window.game.selectedAffixes];
      } else {
        const affKeys = Object.keys(window.ABYSS_AFFIXES || {});
        this.activeAffixes = affKeys.slice(0, 4);
      }
      this.affixMfBonus = 1 + (this.activeAffixes.length * 0.40);
      this.affixGoldBonus = 1 + (this.activeAffixes.length * 0.50);
      this.affixExpBonus = 1 + (this.activeAffixes.length * 0.40);

      setTimeout(() => {
        if (window.effectMgr && this.activeAffixes.length > 0) {
          window.effectMgr.addFloatingText(player.x, player.y - 45, `💀 심연 돌연변이 ${this.activeAffixes.length}중첩 적용! (파밍 +${Math.round((this.affixMfBonus-1)*100)}%)`, 'crit');
          window.effectMgr.screenShake(6, 0.2);
        }
      }, 500);
    } else {
      this.activeAffixes = [];
      this.affixMfBonus = 1.0;
      this.affixGoldBonus = 1.0;
      this.affixExpBonus = 1.0;
    }

    player.x = this.entrance.x;
    player.y = this.entrance.y;

    this.walls = [
      { x: 0, y: 0, w: this.width, h: 40 },
      { x: 0, y: this.height - 40, w: this.width, h: 40 },
      { x: 0, y: 0, w: 40, h: this.height },
      { x: this.width - 40, y: 0, w: 40, h: this.height }
    ];

    this.createPillars();
    this.spawnEntities();
    this.spawnShrines();
    this.spawnDimensionRift();

    if (this.currentFloor % 10 === 0) {
      if (window.soundMgr) window.soundMgr.playBGM('boss');
    } else {
      if (window.soundMgr) window.soundMgr.playBGM('dungeon');
    }
  }

  // 2번: 보스 탄막 스포너 (Bullet Hell Engine)
  spawnBossBullet(opts) {
    if (!this.bossBullets) this.bossBullets = [];
    this.bossBullets.push({
      x: opts.x,
      y: opts.y,
      vx: opts.vx || 0,
      vy: opts.vy || 0,
      radius: opts.radius || 7,
      color: opts.color || '#ff3344',
      damage: opts.damage || 25,
      life: opts.life || 6.0,
      bounce: opts.bounce || 0
    });
  }

  createPillars() {
    const pillarPositions = [
      { x: 500, y: 350, w: 70, h: 70 },
      { x: 500, y: 850, w: 70, h: 70 },
      { x: 1100, y: 350, w: 70, h: 70 },
      { x: 1100, y: 850, w: 70, h: 70 },
      { x: 800, y: 600, w: 80, h: 80 }
    ];
    pillarPositions.forEach(p => this.walls.push(p));
  }

  spawnEntities() {
    const f = this.currentFloor;
    const isMajorBossFloor = (f % 10 === 0);

    if (isMajorBossFloor) {
      const bossData = ZONE_BOSSES[f] || ZONE_BOSSES[100];
      const boss = new Monster({
        name: bossData.name,
        title: bossData.title,
        x: 1100,
        y: 600,
        floor: f,
        isBoss: true,
        bossType: bossData.special,
        hpScale: bossData.hpScale,
        atkScale: bossData.atkScale,
        defScale: bossData.defScale,
        color: bossData.color,
        radius: f === 100 ? 60 : 48
      });
      this.enemies.push(boss);
      this.bossAlive = true;

      setTimeout(() => {
        if (window.effectMgr) {
          window.effectMgr.triggerBossWarning(bossData.name, bossData.title, bossData.color);
        }
      }, 300);

      // 보스 호위병
      for (let i = 0; i < 4; i++) {
        const guard = new Monster({
          name: `심연 근위 기사`,
          x: 950 + Math.cos(i * 1.5) * 110,
          y: 600 + Math.sin(i * 1.5) * 110,
          floor: f,
          hpScale: 2.0,
          atkScale: 1.3,
          defScale: 1.2
        });
        this.enemies.push(guard);
      }
    } else {
      const mobCount = 7 + Math.min(8, Math.floor(f / 12));
      for (let i = 0; i < mobCount; i++) {
        const proto = MONSTER_PROTOTYPES[Math.floor(Math.random() * MONSTER_PROTOTYPES.length)];
        const mx = 450 + Math.random() * 850;
        const my = 150 + Math.random() * 900;
        const mob = new Monster({
          name: `${proto.name}`,
          x: mx,
          y: my,
          floor: f,
          proto: proto
        });
        this.enemies.push(mob);
      }

      // 매 층 중간 보스 (엘리트)
      const elitePrefixes = ['분노의', '불멸의', '신속한', '파멸의', '냉혹한', '암흑의'];
      const prefix = elitePrefixes[Math.floor(Math.random() * elitePrefixes.length)];
      const proto = MONSTER_PROTOTYPES[Math.floor(Math.random() * MONSTER_PROTOTYPES.length)];
      const eliteMob = new Monster({
        name: `[중간 보스] ${prefix} ${proto.name}`,
        x: 1200,
        y: 600,
        floor: f,
        isElite: true,
        hpScale: 5.0,
        atkScale: 1.7,
        defScale: 1.5,
        color: '#ff6622',
        radius: 36
      });
      this.enemies.push(eliteMob);

      // 미믹 또는 황금 미믹 스폰 (30% 확률)
      if (Math.random() < 0.35) {
        const isGolden = Math.random() < 0.28;
        const mimicType = isGolden ? 'golden' : 'normal';
        const mimic = new Monster({
          name: MIMIC_DATA[mimicType].name,
          x: 750 + (Math.random() * 300 - 150),
          y: 300 + (Math.random() * 600 - 300),
          floor: f,
          isMimic: true,
          mimicType: mimicType,
          color: isGolden ? '#ffd700' : '#8b4513',
          radius: 28
        });
        this.enemies.push(mimic);
      }
    }
  }

  update(dt, player) {
    let aliveCount = 0;
    this.enemies.forEach(en => {
      if (en.isAlive) {
        aliveCount++;
        en.update(dt, player, this.walls);
      }
    });

    if (aliveCount === 0 && !this.stairs.isOpen) {
      this.stairs.isOpen = true;
      this.isCleared = true;
      if (window.effectMgr) {
        window.effectMgr.addFloatingText(this.stairs.x, this.stairs.y - 30, '포털 개방! 계단으로 이동하세요', 'heal');
        window.effectMgr.addShockwave(this.stairs.x, this.stairs.y, 75, '#ffd700');
      }

      if (this.currentFloor === 100) {
        this.isFinalCleared = true;
      }
    }

    // 2번: 보스 탄막 업데이트 & 피격/패링 판정
    if (this.bossBullets && this.bossBullets.length > 0) {
      for (let i = this.bossBullets.length - 1; i >= 0; i--) {
        const b = this.bossBullets[i];
        b.x += b.vx * dt * 60;
        b.y += b.vy * dt * 60;
        b.life -= dt;

        // 벽 충돌 (바운스 또는 소멸)
        if (b.x < 40 || b.x > this.width - 40 || b.y < 40 || b.y > this.height - 40) {
          if (b.bounce > 0) {
            b.bounce--;
            if (b.x < 40 || b.x > this.width - 40) b.vx *= -1;
            if (b.y < 40 || b.y > this.height - 40) b.vy *= -1;
          } else {
            this.bossBullets.splice(i, 1);
            continue;
          }
        }

        if (b.life <= 0) {
          this.bossBullets.splice(i, 1);
          continue;
        }

        // 플레이어 피격/패링 검사
        const distToPlayer = Math.hypot(b.x - player.x, b.y - player.y);
        if (distToPlayer <= b.radius + player.radius) {
          if (player.isParrying) {
            // 🛡️ 완벽한 탄막 패링 성공!
            player.triggerParrySuccess(null);
            if (window.effectMgr) {
              window.effectMgr.spawnSparks(b.x, b.y, 16, '#ffd700');
            }
            this.bossBullets.splice(i, 1);
            continue;
          } else if (!player.isInvincible) {
            player.takeDamage(b.damage);
            this.bossBullets.splice(i, 1);
            continue;
          }
        }
      }
    }

    // 1번: 무한 악몽 심연 던전 돌연변이 어픽스 주기적 환경 이벤트
    if (this.activeAffixes && this.activeAffixes.length > 0) {
      this.affixTimer = (this.affixTimer || 0) + dt;

      // 1. [하늘의 분노] 벼락 낙하 (3.5초 주기)
      if (this.activeAffixes.includes('thunder_storm') && this.affixTimer % 3.5 < dt) {
        const tx = player.x + (Math.random() * 120 - 60);
        const ty = player.y + (Math.random() * 120 - 60);
        window.effectMgr.addWarningZone(tx, ty, 75, 0.9, () => {
          window.effectMgr.addShockwave(tx, ty, 75, '#cc44ff');
          window.effectMgr.spawnSparks(tx, ty, 20, '#ffd700');
          if (Math.hypot(player.x - tx, player.y - ty) <= 75) {
            player.takeDamage(45);
          }
        });
      }

      // 2. [용암 분출] 바닥 화염 기둥 (4.0초 주기)
      if (this.activeAffixes.includes('magma_geysers') && this.affixTimer % 4.0 < dt) {
        for (let g = 0; g < 2; g++) {
          const gx = 200 + Math.random() * (this.width - 400);
          const gy = 150 + Math.random() * (this.height - 300);
          window.effectMgr.addWarningZone(gx, gy, 85, 1.0, () => {
            window.effectMgr.spawnSparks(gx, gy, 30, '#ff4400');
            window.effectMgr.addShockwave(gx, gy, 85, '#ff2200');
            if (Math.hypot(player.x - gx, player.y - gy) <= 85) {
              player.takeDamage(55);
              window.effectMgr.addFloatingText(player.x, player.y - 20, '🔥 화염 분출 피격!', 'player_hit');
            }
          });
        }
      }

      // 3. [공허 왜곡] 8초마다 맵 중심부 인력 흡인
      if (this.activeAffixes.includes('void_gravity') && this.affixTimer % 8.0 < dt) {
        const cx = this.width / 2;
        const cy = this.height / 2;
        window.effectMgr.addShockwave(cx, cy, 200, '#bb44ff');
        window.effectMgr.addFloatingText(player.x, player.y - 30, '🌀 심연의 중력 왜곡!', 'crit');
        player.x += (cx - player.x) * 0.25;
        player.y += (cy - player.y) * 0.25;
      }
    }

    // 아이템 드랍 물리 비행 & 획득 검사
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];

      // 포물선 솟구침 물리 (Loot Fountain arc)
      if (drop.isFlying) {
        drop.x += drop.vx;
        drop.y += drop.vy;
        drop.vy += 22 * dt; // 중력 가속도
        if (drop.y >= drop.targetFloorY && drop.vy > 0) {
          drop.vy = -drop.vy * 0.4; // 1회 바운스
          if (Math.abs(drop.vy) < 1.5) {
            drop.isFlying = false;
            drop.vy = 0;
            drop.vx = 0;
          }
        }
      }

      // 3순위: 동행 펫의 전리품 자동 자석 흡수 (Auto-Loot Vacuum)
      if (player.activePet && window.PETS && window.PETS[player.activePet]) {
        const petDef = window.PETS[player.activePet];
        const pDist = Math.hypot(player.x - drop.x, player.y - drop.y);
        if (pDist <= petDef.lootRange && !drop.isFlying) {
          drop.x += (player.x - drop.x) * 0.16;
          drop.y += (player.y - drop.y) * 0.16;
        }
      }

      const dist = Math.hypot(player.x - drop.x, player.y - drop.y);
      if (dist <= 40 && !drop.isFlying) {
        this.pickupDrop(player, drop);
        this.drops.splice(i, 1);
      }
    }

    // 4순위: 차원 성소(Shrine) 상호작용 검사
    if (this.shrines) {
      this.shrines.forEach(shrine => {
        if (!shrine.isUsed) {
          const sDist = Math.hypot(player.x - shrine.x, player.y - shrine.y);
          if (sDist <= shrine.radius + 15) {
            this.activateShrine(player, shrine);
          }
        }
      });
    }

    // 4번: 차원 균열 돌발 이벤트 상호작용 및 웨이브 진행
    if (this.rift) {
      if (!this.rift.isActive && !this.rift.isCleared) {
        const rDist = Math.hypot(player.x - this.rift.x, player.y - this.rift.y);
        if (rDist <= this.rift.radius + 15) {
          this.startRiftEvent(player);
        }
      } else if (this.rift.isActive) {
        this.rift.timer -= dt;
        this.rift.waveTimer += dt;

        const timerEl = document.getElementById('riftTimerText');
        const killEl = document.getElementById('riftKillText');
        if (timerEl) timerEl.innerText = Math.max(0, this.rift.timer).toFixed(1) + 's';
        if (killEl) killEl.innerText = this.rift.kills + ' 마리';

        // 4초마다 공허 몬스터 무리 스폰
        if (this.rift.waveTimer >= window.RIFT_EVENT_CONFIG.waveInterval) {
          this.rift.waveTimer = 0;
          for (let k = 0; k < 3; k++) {
            const proto = window.MONSTER_PROTOTYPES[Math.floor(Math.random() * window.MONSTER_PROTOTYPES.length)];
            const voidMob = new Monster({
              name: `[공허의 침식자] ${proto.name}`,
              x: this.rift.x + (Math.random() * 120 - 60),
              y: this.rift.y + (Math.random() * 120 - 60),
              floor: this.currentFloor,
              hpScale: 2.2,
              atkScale: 1.4,
              color: '#a020f0'
            });
            this.enemies.push(voidMob);
            if (window.effectMgr) {
              window.effectMgr.spawnSparks(voidMob.x, voidMob.y, 16, '#a020f0');
            }
          }
          if (window.soundMgr) window.soundMgr.playChiBlast();
        }

        // 30초 방어 성공 시 클리어
        if (this.rift.timer <= 0) {
          this.clearRiftEvent(player);
        }
      }

      // 차원 보물 상자 개봉
      if (this.rift.chest && !this.rift.chest.isOpened) {
        const cDist = Math.hypot(player.x - this.rift.chest.x, player.y - this.rift.chest.y);
        if (cDist <= 35) {
          this.openRiftChest(player);
        }
      }
    }

    if (this.stairs.isOpen) {
      const d = Math.hypot(player.x - this.stairs.x, player.y - this.stairs.y);
      if (d <= this.stairs.radius + 15) {
        this.stairs.isOpen = false;
        // 1순위: 100층 클리어 시 탑 붕괴 엔딩 시네마틱 트리거
        if (this.currentFloor >= 100) {
          player.isTowerDestroyed = true;
          if (window.game) window.game.triggerTowerCollapseEnding();
        } else {
          const nextF = this.currentFloor + 1;
          window.effectMgr.triggerFloorTransition(nextF, () => {
            this.initFloor(nextF, player);
            player.currentFloor = nextF;
            if (window.accountMgr) window.accountMgr.saveActiveCharacterProgress(player);
          });
        }
      }
    }
  }

  // 4순위: 신비한 차원 성소 스폰
  spawnShrines() {
    this.shrines = [];
    const count = Math.random() < 0.65 ? 2 : 1;
    const types = ['berserk', 'healing_well', 'demon_altar'];
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      this.shrines.push({
        type: type,
        x: 450 + Math.random() * 700,
        y: 350 + Math.random() * 500,
        radius: 26,
        isUsed: false
      });
    }
  }

  // 4순위: 성소 활성화 효과
  activateShrine(player, shrine) {
    if (shrine.isUsed) return;
    shrine.isUsed = true;

    if (shrine.type === 'berserk') {
      player.buffs.berserk = 30;
      player.recalculateStats();
      window.effectMgr.addFloatingText(player.x, player.y - 30, '🔥 광전사의 격노! (공속+60%, 이속+35%, 치명+20%)', 'crit');
      window.effectMgr.spawnSparks(shrine.x, shrine.y, 40, '#ff3344');
      window.effectMgr.screenShake(6, 0.2);
      if (window.soundMgr) window.soundMgr.playEnhanceSuccess();
    } else if (shrine.type === 'healing_well') {
      player.hp = player.statCache.maxHp;
      player.mp = player.statCache.maxMp;
      player.buffs.shield = (player.buffs.shield || 0) + 600;
      window.effectMgr.addFloatingText(player.x, player.y - 30, '💧 영원의 치유 완충 & 600 보호막 생성!', 'heal');
      window.effectMgr.addShockwave(shrine.x, shrine.y, 60, '#00ffaa');
      if (window.soundMgr) window.soundMgr.playLevelUp();
    } else if (shrine.type === 'demon_altar') {
      const sacrifice = Math.max(1, Math.floor(player.hp * 0.35));
      player.hp = Math.max(1, player.hp - sacrifice);
      window.effectMgr.addFloatingText(player.x, player.y - 30, `🩸 피의 제물 (-${sacrifice} HP) ➔ 보물 강제 연성!`, 'crit');
      window.effectMgr.screenShake(10, 0.4);
      if (window.soundMgr) window.soundMgr.playBossHit();

      // 최고급 장비 및 보석 드랍
      const item = ItemGenerator.generateItem({
        floor: this.currentFloor,
        rarity: Math.random() < 0.6 ? 'epic' : 'unique',
        level: player.level
      });
      this.drops.push({
        type: 'item',
        item: item,
        x: shrine.x + (Math.random() * 40 - 20),
        y: shrine.y + (Math.random() * 40 - 20)
      });
      const gemKeys = Object.keys(GEMS);
      for (let i = 0; i < 2; i++) {
        const g = GEMS[gemKeys[Math.floor(Math.random() * gemKeys.length)]];
        this.drops.push({
          type: 'gem',
          item: g,
          x: shrine.x + (Math.random() * 40 - 20),
          y: shrine.y + (Math.random() * 40 - 20)
        });
      }
    }
  }

  // 4번: 차원 균열 스폰 (50% 확률)
  spawnDimensionRift() {
    this.rift = null;
    const hud = document.getElementById('riftEventHUD');
    if (hud) hud.classList.add('hidden');

    // 보스 층이 아닌 일반 층에서 50% 확률로 출현
    if (this.currentFloor % 10 !== 0 && Math.random() < 0.5) {
      this.rift = {
        x: 600 + Math.random() * 400,
        y: 400 + Math.random() * 400,
        radius: 36,
        isActive: false,
        isCleared: false,
        timer: (window.RIFT_EVENT_CONFIG && window.RIFT_EVENT_CONFIG.duration) || 30,
        waveTimer: 0,
        kills: 0,
        chest: null
      };
    }
  }

  // 차원 균열 이벤트 시작
  startRiftEvent(player) {
    if (!this.rift || this.rift.isActive || this.rift.isCleared) return;
    this.rift.isActive = true;
    this.rift.waveTimer = 3.5; // 시작 직후 첫 웨이브

    const hud = document.getElementById('riftEventHUD');
    if (hud) hud.classList.remove('hidden');

    if (window.effectMgr) {
      window.effectMgr.addFloatingText(this.rift.x, this.rift.y - 40, '⚡ 차원 균열 개방! 30초간 침공을 막아내라!', 'crit');
      window.effectMgr.addShockwave(this.rift.x, this.rift.y, 100, '#a020f0');
      window.effectMgr.screenShake(10, 0.4);
    }
    if (window.soundMgr) window.soundMgr.playChiBlast();
  }

  // 차원 균열 이벤트 클리어
  clearRiftEvent(player) {
    if (!this.rift || !this.rift.isActive) return;
    this.rift.isActive = false;
    this.rift.isCleared = true;

    const hud = document.getElementById('riftEventHUD');
    if (hud) hud.classList.add('hidden');

    this.rift.chest = {
      x: this.rift.x,
      y: this.rift.y,
      radius: 30,
      isOpened: false
    };

    if (window.effectMgr) {
      window.effectMgr.addFloatingText(this.rift.x, this.rift.y - 45, '🏆 차원 균열 방어 성공! 전설의 보물상자 출현!', 'heal');
      window.effectMgr.addShockwave(this.rift.x, this.rift.y, 120, '#ffd700');
      window.effectMgr.spawnSparks(this.rift.x, this.rift.y, 50, '#ffd700');
      window.effectMgr.screenShake(12, 0.5);
    }
    if (window.soundMgr) window.soundMgr.playVictory();
  }

  // 전설의 차원 보물 상자 개봉
  openRiftChest(player) {
    if (!this.rift || !this.rift.chest || this.rift.chest.isOpened) return;
    this.rift.chest.isOpened = true;

    if (window.effectMgr) {
      window.effectMgr.addFloatingText(player.x, player.y - 40, '🎁 [전설의 차원 보물상자] 개봉!', 'crit');
      window.effectMgr.addShockwave(this.rift.chest.x, this.rift.chest.y, 100, '#ffd700');
      window.effectMgr.spawnSparks(this.rift.chest.x, this.rift.chest.y, 40, '#ffd700');
    }
    if (window.soundMgr) window.soundMgr.playEnhanceSuccess();

    // 1. 30,000 골드
    const goldCount = 6;
    for (let i = 0; i < goldCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 4 + Math.random() * 5;
      this.drops.push({
        type: 'gold',
        x: this.rift.chest.x,
        y: this.rift.chest.y,
        amount: 5000,
        vx: Math.cos(ang) * spd,
        vy: -6 - Math.random() * 4,
        targetFloorY: this.rift.chest.y + (Math.random() * 60 - 30),
        isFlying: true
      });
    }

    // 2. 룬스톤 1~2개
    if (window.RUNESTONES) {
      const runeKeys = Object.keys(window.RUNESTONES);
      const runeCount = 1 + (Math.random() < 0.5 ? 1 : 0);
      for (let i = 0; i < runeCount; i++) {
        const rKey = runeKeys[Math.floor(Math.random() * runeKeys.length)];
        const ang = Math.random() * Math.PI * 2;
        const spd = 3 + Math.random() * 4;
        this.drops.push({
          type: 'runestone',
          item: window.RUNESTONES[rKey],
          x: this.rift.chest.x,
          y: this.rift.chest.y,
          vx: Math.cos(ang) * spd,
          vy: -5 - Math.random() * 3,
          targetFloorY: this.rift.chest.y + (Math.random() * 60 - 30),
          isFlying: true
        });
      }
    }

    // 3. 에픽/유니크 세트 장비 2개
    for (let i = 0; i < 2; i++) {
      const setItem = ItemGenerator.generateItem({
        floor: this.currentFloor,
        rarity: i === 0 ? 'unique' : 'epic',
        level: player.level
      });
      const ang = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 4;
      this.drops.push({
        type: 'item',
        item: setItem,
        x: this.rift.chest.x,
        y: this.rift.chest.y,
        vx: Math.cos(ang) * spd,
        vy: -6 - Math.random() * 4,
        targetFloorY: this.rift.chest.y + (Math.random() * 60 - 30),
        isFlying: true
      });
    }
  }

  pickupDrop(player, drop) {
    if (drop.type === 'gold') {
      player.gold += drop.amount;
      window.effectMgr.addFloatingText(player.x, player.y - 15, `+${drop.amount} Gold`, 'crit');
      if (window.soundMgr) window.soundMgr.playItemEquip();
    } else if (drop.type === 'potion') {
      player.potions += drop.amount;
      window.effectMgr.addFloatingText(player.x, player.y - 15, `+${drop.amount} 물약`, 'heal');
      if (window.soundMgr) window.soundMgr.playItemEquip();
    } else if (drop.type === 'gem') {
      player.inventory.push(drop.item);
      window.effectMgr.addFloatingText(player.x, player.y - 15, `[보석] ${drop.item.name}`, 'crit');
      if (window.soundMgr) window.soundMgr.playItemEquip();
    } else if (drop.type === 'runestone') {
      player.runestones = player.runestones || [];
      player.runestones.push(drop.item.key);
      window.effectMgr.addFloatingText(player.x, player.y - 15, `[룬스톤] ${drop.item.name} 획득!`, 'heal');
      if (window.soundMgr) window.soundMgr.playItemEquip();
    } else if (drop.type === 'item') {
      if (player.inventory.length < 36) {
        player.inventory.push(drop.item);
        window.effectMgr.addFloatingText(player.x, player.y - 15, `[${drop.item.rarityName}] ${drop.item.name}`, 'crit');
        if (window.soundMgr) window.soundMgr.playItemEquip();
      } else {
        window.effectMgr.addFloatingText(player.x, player.y - 15, '가방이 가득 찼습니다!', 'player_hit');
      }
    } else if (drop.type === 'material') {
      player.materials[drop.matKey] = (player.materials[drop.matKey] || 0) + drop.amount;
      window.effectMgr.addFloatingText(player.x, player.y - 15, `+${drop.name} ${drop.amount}개`, 'crit');
    }
  }

  render(ctx, camera) {
    ctx.save();

    const texKey = this.getTextureKeyForFloor(this.currentFloor);
    const texImg = this.textures && this.textures[texKey];

    if (texImg && texImg.complete && texImg.naturalWidth > 0) {
      if (!this.patternCache[texKey]) {
        this.patternCache[texKey] = ctx.createPattern(texImg, 'repeat');
      }
      ctx.save();
      ctx.translate(-camera.x, -camera.y);
      ctx.fillStyle = this.patternCache[texKey];
      ctx.fillRect(0, 0, this.width, this.height);

      // 던전 구역 테마 앰비언트 블렌드 오버레이
      ctx.fillStyle = this.theme.floorColor;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    } else {
      ctx.fillStyle = this.theme.floorColor;
      ctx.fillRect(-camera.x, -camera.y, this.width, this.height);
    }

    // 타일 라인
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x - camera.x, -camera.y);
      ctx.lineTo(x - camera.x, this.height - camera.y);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(-camera.x, y - camera.y);
      ctx.lineTo(this.width - camera.x, y - camera.y);
      ctx.stroke();
    }

    // 벽체 및 기둥
    ctx.fillStyle = this.theme.wallColor;
    this.walls.forEach(w => {
      ctx.fillRect(w.x - camera.x, w.y - camera.y, w.w, w.h);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x - camera.x, w.y - camera.y, w.w, w.h);
    });

    // 계단 / 포털
    const stX = this.stairs.x - camera.x;
    const stY = this.stairs.y - camera.y;

    if (this.stairs.isOpen) {
      const time = Date.now() * 0.003;
      ctx.save();
      ctx.translate(stX, stY);
      ctx.rotate(time);
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.stairs.radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#ffd700');
      grad.addColorStop(0.8, '#ff8800');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.stairs.radius + Math.sin(time * 4) * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.font = 'bold 14px "Cinzel", serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText(`▲ ${this.currentFloor + 1}층 계단 개방`, stX, stY - this.stairs.radius - 8);
    } else {
      ctx.fillStyle = '#1c1524';
      ctx.beginPath();
      ctx.arc(stX, stY, this.stairs.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5a3b78';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '12px "Rajdhani", sans-serif';
      ctx.fillStyle = '#8f7da8';
      ctx.textAlign = 'center';
      ctx.fillText('🔒 차원 봉인', stX, stY + 4);
    }

    // 4순위: 차원 성소(Shrine) 렌더링
    if (this.shrines) {
      this.shrines.forEach(shrine => {
        const sx = shrine.x - camera.x;
        const sy = shrine.y - camera.y;
        const def = SHRINES[shrine.type] || SHRINES.healing_well;

        ctx.save();
        if (shrine.isUsed) {
          ctx.globalAlpha = 0.35;
        }

        const time = Date.now() * 0.002;
        ctx.beginPath();
        ctx.arc(sx, sy, shrine.radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy, shrine.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10, 5, 20, 0.8)';
        ctx.fill();

        const floatY = sy + Math.sin(time * 3 + shrine.x) * 4;
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.icon, sx, floatY);

        ctx.font = 'bold 11px "Rajdhani", sans-serif';
        ctx.fillStyle = shrine.isUsed ? '#888' : def.color;
        ctx.fillText(shrine.isUsed ? `[${def.name} (소진)]` : `[${def.name}]`, sx, sy - shrine.radius - 8);
        if (!shrine.isUsed) {
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#fff';
          ctx.fillText('접근 시 활성화', sx, sy + shrine.radius + 12);
        }

        ctx.restore();
      });
    }

    // 4번: 차원 균열(Rift) 및 보물상자 렌더링
    if (this.rift) {
      const rx = this.rift.x - camera.x;
      const ry = this.rift.y - camera.y;

      if (!this.rift.isCleared) {
        ctx.save();
        const time = Date.now() * 0.003;

        // 외곽 소용돌이
        ctx.beginPath();
        ctx.arc(rx, ry, this.rift.radius + 10 + Math.sin(time * 4) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = this.rift.isActive ? '#ff0055' : '#a020f0';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 중앙 블랙홀 코어
        const grad = ctx.createRadialGradient(rx, ry, 5, rx, ry, this.rift.radius);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(0.6, this.rift.isActive ? '#a020f0' : '#4b0082');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rx, ry, this.rift.radius, 0, Math.PI * 2);
        ctx.fill();

        // 소용돌이 아이콘
        ctx.font = '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌀', rx, ry);

        // 텍스트 라벨
        ctx.font = 'bold 12px "Rajdhani", sans-serif';
        ctx.fillStyle = this.rift.isActive ? '#ff4488' : '#c084fc';
        ctx.fillText(this.rift.isActive ? `[차원 균열 침공 중 (${Math.ceil(this.rift.timer)}s)]` : `[불안정한 차원 균열]`, rx, ry - this.rift.radius - 12);

        if (!this.rift.isActive) {
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#ffcc00';
          ctx.fillText('접근 시 30초 방어 이벤트 시작', rx, ry + this.rift.radius + 14);
        }
        ctx.restore();
      }

      // 차원 보물 상자
      if (this.rift.chest && !this.rift.chest.isOpened) {
        const cx = this.rift.chest.x - camera.x;
        const cy = this.rift.chest.y - camera.y + Math.sin(Date.now() * 0.005) * 4;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎁', cx, cy);

        ctx.font = 'bold 12px "Rajdhani", sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('[전설의 차원 보물 상자]', cx, cy - 32);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('접근 시 개봉', cx, cy + 32);
        ctx.restore();
      }
    }

    // 드랍 아이템
    this.drops.forEach(drop => {
      const dx = drop.x - camera.x;
      const dy = drop.y - camera.y + Math.sin(Date.now() * 0.005 + drop.x) * 4;

      ctx.save();
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (drop.type === 'gold') {
        ctx.fillText('🪙', dx, dy);
      } else if (drop.type === 'potion') {
        ctx.fillText('🧪', dx, dy);
      } else if (drop.type === 'gem') {
        ctx.fillText(drop.item.icon || '💎', dx, dy);
      } else if (drop.type === 'runestone') {
        ctx.beginPath();
        ctx.arc(dx, dy, 18, 0, Math.PI * 2);
        ctx.fillStyle = drop.item.color || '#00e5ff';
        ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.fillText(drop.item.icon || '🌀', dx, dy);
      } else if (drop.type === 'item') {
        ctx.beginPath();
        ctx.arc(dx, dy, 18, 0, Math.PI * 2);
        ctx.fillStyle = drop.item.color || '#fff';
        ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.fillText(drop.item.icon || '📦', dx, dy);
      } else if (drop.type === 'material') {
        ctx.fillText(drop.icon || '🪨', dx, dy);
      }
      ctx.restore();
    });

    // 몬스터
    this.enemies.forEach(en => {
      if (en.isAlive) {
        en.render(ctx, camera);
      }
    });

    // 2번: 보스 탄막 (Boss Bullets) 렌더링
    if (this.bossBullets && this.bossBullets.length > 0) {
      this.bossBullets.forEach(b => {
        const bx = b.x - camera.x;
        const by = b.y - camera.y;
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = b.color || '#ff0055';
        ctx.fillStyle = b.color || '#ff0055';
        ctx.beginPath();
        ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // 내부 발광 코어
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(1.5, b.radius * 0.45), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    ctx.restore();
  }
}

// 몬스터 및 보스 고유 패턴 엔티티 클래스
class Monster {
  constructor(opts) {
    this.x = opts.x;
    this.y = opts.y;
    this.name = opts.name;
    this.title = opts.title || '';
    this.floor = opts.floor || 1;
    this.isBoss = opts.isBoss || false;
    this.bossType = opts.bossType || 'slam';
    this.isElite = opts.isElite || false;
    this.isMimic = opts.isMimic || false;
    this.mimicType = opts.mimicType || 'normal';
    this.isMimicAwake = !opts.isMimic;

    this.radius = opts.radius || 18;
    this.color = opts.color || '#dd4444';

    const f = this.floor;
    const hpScale = opts.hpScale || 1.0;
    const atkScale = opts.atkScale || 1.0;
    const defScale = opts.defScale || 1.0;

    this.maxHp = Math.floor((120 + f * 55) * hpScale);
    this.hp = this.maxHp;
    this.atk = Math.floor((15 + f * 5.5) * atkScale);
    this.def = Math.floor((5 + f * 2.2) * defScale);
    this.speed = opts.isBoss ? 2.3 : (opts.proto ? opts.proto.speed : 1.9);
    this.exp = Math.floor((30 + f * 20) * (this.isBoss ? 30 : this.isElite ? 5 : 1));
    this.gold = Math.floor((25 + f * 15) * (this.isBoss ? 25 : this.isElite ? 4 : 1));

    this.isAlive = true;
    this.stunTimer = 0;
    this.atkCooldown = 0;
    this.attackRange = this.isBoss ? 60 : 32;

    // 2페이즈 광폭화 변수 (체력 50% 이하 시 발동)
    this.isPhase2 = false;
    this.phase2Triggered = false;

    // 1번: 무한 악몽 심연 던전 돌연변이 어픽스 몬스터 강화
    if (window.game && window.game.dungeonMgr && window.game.dungeonMgr.activeAffixes) {
      const affixes = window.game.dungeonMgr.activeAffixes;
      if (affixes.includes('ironclad')) {
        this.def = Math.floor(this.def * 1.5);
      }
      if (affixes.includes('furious_haste')) {
        this.speed *= 1.45;
        this.atkCooldown = 0.8;
      }
      if (affixes.includes('empowered_elites') && !this.isBoss) {
        this.maxHp = Math.floor(this.maxHp * 2.5);
        this.hp = this.maxHp;
        this.atk = Math.floor(this.atk * 1.5);
        this.color = '#ffbb00';
      }
    }

    // 보스 고유 특수 패턴 쿨타임 (4~6초마다 시전)
    this.specialPatternTimer = 3.5;
  }

  applyStun(duration) {
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  takeDamage(amount, isCrit = false, isDot = false) {
    if (!this.isAlive) return;

    if (this.isMimic && !this.isMimicAwake) {
      this.isMimicAwake = true;
      this.name = this.mimicType === 'golden' ? '깨어난 찬란한 황금 미믹' : '깨어난 흉포한 미믹';
    }

    const actualDmg = Math.max(1, Math.floor(amount * (100 / (100 + this.def))));
    this.hp -= actualDmg;

    // 2번: 보스 체력 50% 이하 시 2페이즈 광폭화 각성 발동!
    if (this.isBoss && !this.phase2Triggered && this.hp <= this.maxHp * 0.5) {
      this.triggerPhase2Berserk();
    }

    if (window.effectMgr) {
      window.effectMgr.addFloatingText(this.x, this.y, actualDmg.toLocaleString(), isCrit ? 'crit' : 'normal');
      window.effectMgr.spawnSparks(this.x, this.y, isCrit ? 16 : 8, isCrit ? '#ffd700' : '#ffffff');
      // 공격 적중 시 화면 흔들림! (크리티컬 시 더욱 강렬한 진동)
      window.effectMgr.screenShake(isCrit ? 6.5 : 3.5, 0.1);
    }
    if (window.soundMgr && !isDot) {
      if (isCrit) window.soundMgr.playCritHit();
      else window.soundMgr.playHit();
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  // 2번: 10대 군주 보스 2페이즈 광폭화 각성
  triggerPhase2Berserk() {
    this.phase2Triggered = true;
    this.isPhase2 = true;

    const bData = (window.ZONE_BOSSES && (window.ZONE_BOSSES[this.floor] || window.ZONE_BOSSES[100])) || {};
    this.name = bData.p2Name || (this.name + ' [2페이즈 각성]');
    this.title = bData.p2Title || '광폭화 탄막 모드';
    this.color = bData.p2Color || '#ff0033';
    this.bossType = bData.p2Special || this.bossType;
    this.atk = Math.floor(this.atk * 1.35);
    this.speed = this.speed * 1.3;
    this.radius = Math.floor(this.radius * 1.25);
    this.specialPatternTimer = 0.5; // 즉시 특수 탄막 패턴 시전

    if (window.effectMgr) {
      window.effectMgr.screenShake(16.0, 0.6);
      window.effectMgr.addShockwave(this.x, this.y, 160, this.color);
      window.effectMgr.spawnSparks(this.x, this.y, 60, '#ff1100');
      window.effectMgr.addFloatingText(this.x, this.y - 45, '⚠️ [광폭화 2페이즈 각성!]', 'crit');
      window.effectMgr.triggerBossWarning(this.name, '⚠️ 광폭화 2페이즈: 묵시록 탄막 모드 발동!', this.color);
    }
    if (window.soundMgr) window.soundMgr.playEnhanceSuccess();
  }

  die() {
    this.isAlive = false;
    this.hp = 0;

    if (window.soundMgr) window.soundMgr.playHit();

    // B 항목: 보스 처치 시 시네마틱 슬로우 모션 & 승리 연출
    if (this.isBoss && window.game) {
      window.game.triggerCinematicSlowMo(1.2, this.name);
      if (window.soundMgr) window.soundMgr.playLevelUp();
    }

    if (window.effectMgr) {
      window.effectMgr.addShockwave(this.x, this.y, this.radius * (this.isBoss ? 3.5 : 2.2), this.isBoss ? '#ffd700' : '#ff3333');
      window.effectMgr.spawnSparks(this.x, this.y, this.isBoss ? 60 : 25, '#ffd700');
      window.effectMgr.screenShake(this.isBoss ? 16 : 8, 0.4);
    }

    if (window.game && window.game.player) {
      const p = window.game.player;
      p.addExp(Math.floor(this.exp * (window.game.dungeonMgr?.affixExpBonus || 1.0)));
      p.stats_kills = (p.stats_kills || 0) + 1;

      // 1번: 유물 효과 - 적 처치 시 유물 발동 (피의 갈증 검, 영혼 폭탄 등)
      if (p.triggerRelicOnKill) p.triggerRelicOnKill(this);

      // 1번: 어픽스 [시체 폭발]
      if (window.game && window.game.dungeonMgr && window.game.dungeonMgr.activeAffixes) {
        if (window.game.dungeonMgr.activeAffixes.includes('corpse_explosion')) {
          const exX = this.x;
          const exY = this.y;
          const exAtk = this.atk;
          setTimeout(() => {
            if (window.effectMgr) {
              window.effectMgr.screenShake(6, 0.2);
              window.effectMgr.addShockwave(exX, exY, 85, '#ff3300');
              window.effectMgr.spawnSparks(exX, exY, 20, '#ffaa00');
            }
            if (window.soundMgr) window.soundMgr.playChiBlast();
            if (p && Math.hypot(p.x - exX, p.y - exY) <= 85) {
              p.takeDamage(exAtk * 1.2);
              if (window.effectMgr) window.effectMgr.addFloatingText(p.x, p.y - 20, '💥 시체 폭발 피격!', 'player_hit');
            }
          }, 700);
        }
      }

      if (this.isBoss) {
        p.stats_bossKills = (p.stats_bossKills || 0) + 1;
        if (this.floor === 100) {
          p.isTowerDestroyed = true;
          setTimeout(() => {
            if (window.game) window.game.triggerTowerCollapseEnding();
          }, 1600);
        }

        // 1번: 심연 101F 이상 보스 격파 시 고대 유물 선택 모달 팝업!
        if (this.floor >= 101 && window.game) {
          setTimeout(() => {
            if (window.game.openRelicChoiceModal) window.game.openRelicChoiceModal();
          }, 1400);
        }
      }
      if (this.isMimic) {
        p.stats_mimicKills = (p.stats_mimicKills || 0) + 1;
      }
      if (window.game && window.game.dungeonMgr && window.game.dungeonMgr.rift && window.game.dungeonMgr.rift.isActive) {
        window.game.dungeonMgr.rift.kills = (window.game.dungeonMgr.rift.kills || 0) + 1;
      }
      if (window.game && window.game.checkAchievements) {
        window.game.checkAchievements();
      }
    }

    // B 항목: 사방으로 솟구쳐 떨어지는 전리품 폭발 분수 (Loot Fountain)
    this.generateLootFountain();
  }

  generateLootFountain() {
    if (!window.game || !window.game.dungeonMgr) return;
    const drops = window.game.dungeonMgr.drops;
    const isBoss = this.isBoss;

    const activeAffixes = window.game?.dungeonMgr?.activeAffixes || [];
    const affixGoldMul = 1 + (activeAffixes.length * 0.50);
    const affixMfMul = 1 + (activeAffixes.length * 0.40);

    const createFountainDrop = (dropObj) => {
      const ang = Math.random() * Math.PI * 2;
      const spd = isBoss ? (4 + Math.random() * 8) : (2 + Math.random() * 4);
      dropObj.vx = Math.cos(ang) * spd;
      dropObj.vy = isBoss ? (-8 - Math.random() * 5) : (-4 - Math.random() * 3);
      dropObj.vz = 0;
      dropObj.isFlying = true;
      dropObj.targetFloorY = this.y + (Math.random() * 80 - 40);
      drops.push(dropObj);
    };

    // 1. 골드 분수 (어픽스 보너스 적용)
    const goldCount = isBoss ? 8 : 2;
    const totalGold = Math.floor(this.gold * affixGoldMul);
    for (let i = 0; i < goldCount; i++) {
      createFountainDrop({
        type: 'gold',
        x: this.x,
        y: this.y,
        amount: Math.ceil(totalGold / goldCount)
      });
    }

    // 2. 물약 분수
    if (Math.random() < 0.4 || isBoss) {
      const potCount = isBoss ? 4 : 1;
      for (let i = 0; i < potCount; i++) {
        createFountainDrop({
          type: 'potion',
          x: this.x,
          y: this.y,
          amount: 1
        });
      }
    }

    // 3. 재료 분수
    const matKeys = ['upgrade_stone', 'iron_ore', 'dimension_shard', 'abyss_crystal'];
    const matCount = isBoss ? (5 + Math.floor(activeAffixes.length * 0.4)) : (this.isElite ? 2 : 1);
    for (let i = 0; i < matCount; i++) {
      const mKey = isBoss ? (Math.random() < 0.5 ? 'dimension_shard' : 'abyss_crystal') : matKeys[Math.floor(Math.random() * 3)];
      createFountainDrop({
        type: 'material',
        matKey: mKey,
        name: CRAFT_MATERIALS[mKey].name,
        icon: CRAFT_MATERIALS[mKey].icon,
        amount: isBoss ? 3 : 1,
        x: this.x,
        y: this.y
      });
    }

    // 4. 장비 분수 (어픽스 드랍율 폭증 적용)
    const equipCount = isBoss ? (3 + Math.floor(activeAffixes.length * 0.5)) : (this.isElite || this.isMimic ? 1 : (Math.random() < (0.25 * affixMfMul) ? 1 : 0));
    for (let i = 0; i < equipCount; i++) {
      const item = ItemGenerator.generateItem({
        floor: this.floor,
        isBoss: this.isBoss,
        isMimic: this.isMimic,
        rarity: isBoss ? (i === 0 ? 'epic' : 'unique') : null
      });
      createFountainDrop({
        type: 'item',
        item: item,
        x: this.x,
        y: this.y
      });
    }

    // 5. 보석 분수
    if (isBoss || (this.isMimic && Math.random() < 0.7)) {
      const gemKeys = Object.keys(GEMS);
      const chosenGem = GEMS[gemKeys[Math.floor(Math.random() * gemKeys.length)]];
      createFountainDrop({
        type: 'gem',
        item: chosenGem,
        x: this.x,
        y: this.y
      });
    }

    // 6. 룬스톤 분수 (보스 처치 시 50% 확률로 룬스톤 드랍)
    if ((isBoss && Math.random() < 0.5) && window.RUNESTONES) {
      const runeKeys = Object.keys(window.RUNESTONES);
      const runeKey = runeKeys[Math.floor(Math.random() * runeKeys.length)];
      createFountainDrop({
        type: 'runestone',
        item: window.RUNESTONES[runeKey],
        x: this.x,
        y: this.y
      });
    }
  }

  // --- 보스 고유 장판 및 특수 패턴 실행 (1순위 기믹 & 2페이즈 광폭화 탄막) ---
  triggerBossSpecialPattern(player) {
    if (!this.isBoss || !player) return;
    const type = this.bossType;
    const dm = window.game?.dungeonMgr;

    // ==========================================
    // 🔥 [2페이즈 광폭화 전용 극한 탄막 & 돌진 패턴]
    // ==========================================
    if (this.isPhase2) {
      if (window.effectMgr) {
        window.effectMgr.screenShake(10, 0.35);
        window.effectMgr.addFloatingText(this.x, this.y - 45, `⚡ [광폭화] ${this.name} 특수 발동!`, 'crit');
      }

      // 10F 골렘: [대지 파쇄 탄막 폭풍] 지진 강타 + 사방으로 16개의 바위 파편 탄막이 튕기며 분출!
      if (type === 'slam' || type === 'earthquake_barrage') {
        const px = player.x;
        const py = player.y;
        window.effectMgr.addWarningZone(px, py, 130, 1.0, () => {
          window.effectMgr.spawnEarthShatter(px, py, 0, this.atk * 2.2);
          window.effectMgr.screenShake(12, 0.4);
          if (Math.hypot(player.x - px, player.y - py) <= 130) {
            player.takeDamage(this.atk * 2.2);
          }
          if (dm) {
            for (let i = 0; i < 16; i++) {
              const ang = (Math.PI * 2 / 16) * i;
              const spd = 3.5 + Math.random() * 2;
              dm.spawnBossBullet({
                x: px,
                y: py,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                radius: 8,
                color: '#c29a64',
                damage: Math.floor(this.atk * 0.9),
                bounce: 1,
                life: 5.0
              });
            }
          }
        });
        return;
      }

      // 20F 모르티스: [암흑 나선 영혼 탄막] 24개의 암흑 유령 탄환이 회전하며 방사
      if (type === 'summon' || type === 'dark_spiral') {
        window.effectMgr.addWarningZone(this.x, this.y, 160, 1.1, () => {
          window.effectMgr.addShockwave(this.x, this.y, 160, '#aa00ff');
          if (Math.hypot(player.x - this.x, player.y - this.y) <= 160) {
            player.takeDamage(this.atk * 1.8);
          }
        });
        if (dm) {
          for (let i = 0; i < 24; i++) {
            setTimeout(() => {
              if (!this.isAlive) return;
              const ang = (Math.PI * 2 / 12) * i + (i * 0.15);
              dm.spawnBossBullet({
                x: this.x,
                y: this.y,
                vx: Math.cos(ang) * 4.2,
                vy: Math.sin(ang) * 4.2,
                radius: 7,
                color: '#bf55ec',
                damage: Math.floor(this.atk * 0.8),
                life: 6.0
              });
            }, i * 65);
          }
        }
        return;
      }

      // 30F 이그니스: [업화의 십자포화 & 산탄 탄막] 16방향 전방위 화염 탄막 + 5연속 화염탄 난사
      if (type === 'fire_ring' || type === 'inferno_cross') {
        window.effectMgr.addShockwave(this.x, this.y, 70, '#ff4400');
        if (dm) {
          for (let i = 0; i < 16; i++) {
            const ang = (Math.PI * 2 / 16) * i;
            dm.spawnBossBullet({
              x: this.x,
              y: this.y,
              vx: Math.cos(ang) * 4.0,
              vy: Math.sin(ang) * 4.0,
              radius: 9,
              color: '#ff3300',
              damage: Math.floor(this.atk * 0.85),
              life: 5.5
            });
          }
          // 플레이어를 향해 5연속 고속 화염 미사일 투사
          for (let j = 0; j < 5; j++) {
            setTimeout(() => {
              if (!this.isAlive || !player) return;
              const baseAng = Math.atan2(player.y - this.y, player.x - this.x);
              const spread = (j - 2) * 0.12;
              dm.spawnBossBullet({
                x: this.x,
                y: this.y,
                vx: Math.cos(baseAng + spread) * 6.5,
                vy: Math.sin(baseAng + spread) * 6.5,
                radius: 7,
                color: '#ffbb00',
                damage: Math.floor(this.atk * 0.95),
                life: 4.5
              });
            }, j * 120);
          }
        }
        return;
      }

      // 40F 시바: [절대영도 서리 수리검] 사방 12방향으로 튕기는 얼음 결정체 탄막 방출 (바운스 2회)
      if (type === 'blizzard' || type === 'absolute_zero') {
        window.effectMgr.addShockwave(this.x, this.y, 80, '#00ffff');
        if (dm) {
          for (let i = 0; i < 14; i++) {
            const ang = (Math.PI * 2 / 14) * i;
            dm.spawnBossBullet({
              x: this.x,
              y: this.y,
              vx: Math.cos(ang) * 4.5,
              vy: Math.sin(ang) * 4.5,
              radius: 8,
              color: '#00e5ff',
              damage: Math.floor(this.atk * 0.8),
              bounce: 2,
              life: 6.5
            });
          }
        }
        return;
      }

      // 50F 볼테르: [뇌신 십자 전격 레이저 폭풍]
      if (type === 'thunder' || type === 'laser_cross_storm') {
        const px = player.x;
        const py = player.y;
        window.effectMgr.addWarningZone(px, py, 110, 0.85, () => {
          window.effectMgr.addShockwave(px, py, 110, '#cc44ff');
          window.effectMgr.spawnSparks(px, py, 25, '#00ffff');
          if (Math.hypot(player.x - px, player.y - py) <= 110) {
            player.takeDamage(this.atk * 2.2);
          }
        });
        if (dm) {
          const crossAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
          crossAngles.forEach(ang => {
            for (let k = 0; k < 4; k++) {
              dm.spawnBossBullet({
                x: this.x,
                y: this.y,
                vx: Math.cos(ang) * (3.5 + k * 1.2),
                vy: Math.sin(ang) * (3.5 + k * 1.2),
                radius: 7,
                color: '#e066ff',
                damage: Math.floor(this.atk * 0.85),
                life: 5.0
              });
            }
          });
        }
        return;
      }

      // 60F 섀도우팡: [그림자 분신 연격 & 반월 참격파]
      if (type === 'blink_slash' || type === 'shadow_clones') {
        this.x = player.x - Math.cos(player.angle) * 40;
        this.y = player.y - Math.sin(player.angle) * 40;
        window.effectMgr.addDashGhost(this.x, this.y, this.radius, '#595d73');
        window.effectMgr.spawnSlashArc(this.x, this.y, Math.atan2(player.y - this.y, player.x - this.x), 75, '#aa00ff');
        player.takeDamage(this.atk * 1.8);

        // 3갈래 반월 암흑 탄환 사격
        if (dm) {
          const targetAng = Math.atan2(player.y - this.y, player.x - this.x);
          [-0.3, 0, 0.3].forEach(offset => {
            dm.spawnBossBullet({
              x: this.x,
              y: this.y,
              vx: Math.cos(targetAng + offset) * 6.0,
              vy: Math.sin(targetAng + offset) * 6.0,
              radius: 8,
              color: '#9933ff',
              damage: Math.floor(this.atk * 0.9),
              life: 4.5
            });
          });
        }
        return;
      }

      // 70F 바알: [차원의 붕괴 구체]
      if (type === 'rift_nova' || type === 'rift_bombard') {
        if (dm) {
          for (let i = 0; i < 18; i++) {
            const ang = (Math.PI * 2 / 18) * i;
            dm.spawnBossBullet({
              x: this.x,
              y: this.y,
              vx: Math.cos(ang) * 4.8,
              vy: Math.sin(ang) * 4.8,
              radius: 9,
              color: '#cc00cc',
              damage: Math.floor(this.atk * 0.95),
              bounce: 1,
              life: 6.0
            });
          }
        }
        return;
      }

      // 80F 카오스: [혼돈의 도탄 탄막 폭풍 (Ricochet Storm)] 바운스 3회 20발 난사!
      if (type === 'void_blackhole' || type === 'chaos_ricochet') {
        if (dm) {
          for (let i = 0; i < 20; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 4.0 + Math.random() * 3;
            dm.spawnBossBullet({
              x: this.x,
              y: this.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              radius: 8,
              color: '#ff00aa',
              damage: Math.floor(this.atk * 0.8),
              bounce: 3,
              life: 7.0
            });
          }
        }
        return;
      }

      // 90F 마룡왕 드라카리스: [선회 용염 브레스 탄막 & 유성우]
      if (type === 'dragon_breath' || type === 'rotary_dragon_breath') {
        const baseAng = Math.atan2(player.y - this.y, player.x - this.x);
        window.effectMgr.screenShake(12, 0.5);
        if (dm) {
          for (let i = 0; i < 20; i++) {
            setTimeout(() => {
              if (!this.isAlive) return;
              const ang = baseAng - 0.9 + (i * 0.09);
              dm.spawnBossBullet({
                x: this.x,
                y: this.y,
                vx: Math.cos(ang) * 5.5,
                vy: Math.sin(ang) * 5.5,
                radius: 10,
                color: '#ff3300',
                damage: Math.floor(this.atk * 1.1),
                life: 5.0
              });
            }, i * 40);
          }
        }
        // 상공에서 메테오 2발 추가
        for (let m = 0; m < 2; m++) {
          const mx = player.x + (Math.random() * 160 - 80);
          const my = player.y + (Math.random() * 160 - 80);
          window.effectMgr.addWarningZone(mx, my, 80, 1.1, () => {
            window.effectMgr.spawnMeteor(mx, my, this.atk * 2.0, false);
          });
        }
        return;
      }

      // 100F 아자젤: [종말의 카타클리즘 32방향 멸망 성진]
      if (type === 'cataclysm' || type === 'apocalypse_hell') {
        window.effectMgr.screenShake(16, 0.7);
        window.effectMgr.addFloatingText(this.x, this.y - 45, '🔥 종말의 카타클리즘 멸망 성진!', 'crit');
        if (dm) {
          // 32방향 전방위 탄막
          for (let i = 0; i < 32; i++) {
            const ang = (Math.PI * 2 / 32) * i;
            dm.spawnBossBullet({
              x: this.x,
              y: this.y,
              vx: Math.cos(ang) * 4.6,
              vy: Math.sin(ang) * 4.6,
              radius: 9,
              color: '#ff0033',
              damage: Math.floor(this.atk * 1.2),
              bounce: 1,
              life: 6.5
            });
          }
        }
        for (let i = 0; i < 6; i++) {
          const mx = player.x + (Math.random() * 300 - 150);
          const my = player.y + (Math.random() * 300 - 150);
          window.effectMgr.addWarningZone(mx, my, 90, 1.1, () => {
            window.effectMgr.spawnMeteor(mx, my, this.atk * 2.5, false);
          });
        }
        return;
      }
    }

    // ==========================================
    // 🛡️ [1페이즈 기본 패턴 (HP 50% 이상)]
    // ==========================================
    // 10F 골렘: [대지 강타] 플레이어 현재 위치에 원형 장판 전조 후 지진 폭발
    if (type === 'slam') {
      const px = player.x;
      const py = player.y;
      window.effectMgr.addWarningZone(px, py, 110, 1.3, () => {
        window.effectMgr.spawnEarthShatter(px, py, 0, this.atk * 1.8);
        window.effectMgr.screenShake(10, 0.4);
        if (Math.hypot(player.x - px, player.y - py) <= 110) {
          player.takeDamage(this.atk * 1.8);
          window.effectMgr.addFloatingText(player.x, player.y - 20, '지진 강타 피격!', 'player_hit');
        }
      });
    }
    // 20F 모르티스: [영혼 흡수진] 보스 주변 광역 원형 장판
    else if (type === 'summon') {
      window.effectMgr.addWarningZone(this.x, this.y, 140, 1.4, () => {
        window.effectMgr.addShockwave(this.x, this.y, 140, '#a020f0');
        if (Math.hypot(player.x - this.x, player.y - this.y) <= 140) {
          player.takeDamage(this.atk * 1.6);
        }
      });
    }
    // 30F 이그니스: [작열의 겁화] 360도 8방향 화염구 방출
    else if (type === 'fire_ring') {
      window.effectMgr.addShockwave(this.x, this.y, 60, '#ff4400');
      for (let i = 0; i < 8; i++) {
        const ang = (Math.PI * 2 / 8) * i;
        window.effectMgr.spawnFireball(this.x, this.y, this.x + Math.cos(ang) * 200, this.y + Math.sin(ang) * 200, this.atk * 1.2, false);
      }
    }
    // 40F 시바: [빙결 눈보라 탄막]
    else if (type === 'blizzard') {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (this.isAlive) {
            window.effectMgr.spawnFireball(this.x, this.y, player.x, player.y, this.atk * 0.9, false);
          }
        }, i * 150);
      }
    }
    // 50F 볼테르: [연쇄 낙뢰] 플레이어 위치에 번개 장판
    else if (type === 'thunder') {
      const px = player.x;
      const py = player.y;
      window.effectMgr.addWarningZone(px, py, 90, 1.1, () => {
        window.effectMgr.addShockwave(px, py, 90, '#cc44ff');
        window.effectMgr.spawnSparks(px, py, 20, '#00ffff');
        if (Math.hypot(player.x - px, player.y - py) <= 90) {
          player.takeDamage(this.atk * 2.0);
        }
      });
    }
    // 60F 섀도우팡: [그림자 기습]
    else if (type === 'blink_slash') {
      this.x = player.x - Math.cos(player.angle) * 35;
      this.y = player.y - Math.sin(player.angle) * 35;
      window.effectMgr.addDashGhost(this.x, this.y, this.radius, '#595d73');
      window.effectMgr.spawnSlashArc(this.x, this.y, Math.atan2(player.y - this.y, player.x - this.x), 60, '#aa00ff');
      player.takeDamage(this.atk * 1.5);
    }
    // 70F 바알 & 80F 카오스: 차원 왜곡 폭발
    else if (type === 'rift_nova' || type === 'void_blackhole') {
      for (let i = 0; i < 3; i++) {
        const rx = player.x + (Math.random() * 200 - 100);
        const ry = player.y + (Math.random() * 200 - 100);
        window.effectMgr.addWarningZone(rx, ry, 80, 1.3, () => {
          window.effectMgr.addShockwave(rx, ry, 80, '#963896');
          if (Math.hypot(player.x - rx, player.y - ry) <= 80) {
            player.takeDamage(this.atk * 1.7);
          }
        });
      }
    }
    // 90F 마룡왕 드라카리스: [마룡의 겁화 브레스] 부채꼴 전조 장판 후 화염 브레스!
    else if (type === 'dragon_breath') {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      window.effectMgr.addWarningZone(this.x, this.y, 230, 1.4, () => {
        window.effectMgr.screenShake(10, 0.4);
        window.effectMgr.spawnSlashArc(this.x, this.y, angle, 220, '#ff3300');
        // 부채꼴 내 피격 검사
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist <= 230) {
          let angDiff = Math.atan2(player.y - this.y, player.x - this.x) - angle;
          while (angDiff < -Math.PI) angDiff += Math.PI * 2;
          while (angDiff > Math.PI) angDiff -= Math.PI * 2;
          if (Math.abs(angDiff) <= Math.PI * 0.25) {
            player.takeDamage(this.atk * 2.5);
            window.effectMgr.addFloatingText(player.x, player.y - 20, '화염 브레스 피격!', 'player_hit');
          }
        }
      }, 'cone', angle);
    }
    // 100F 최종 보스 아자젤: [종말의 카타클리즘] 화면 전체 메테오 비 + 암흑 파동
    else if (type === 'cataclysm') {
      window.effectMgr.screenShake(12, 0.6);
      window.effectMgr.addFloatingText(this.x, this.y - 40, '종말의 카타클리즘!', 'crit');
      for (let i = 0; i < 4; i++) {
        const mx = player.x + (Math.random() * 260 - 130);
        const my = player.y + (Math.random() * 260 - 130);
        window.effectMgr.addWarningZone(mx, my, 85, 1.2, () => {
          window.effectMgr.spawnMeteor(mx, my, this.atk * 2.2, false);
        });
      }
    }
  }

  update(dt, player, walls) {
    if (!this.isAlive) return;

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      return;
    }

    if (this.atkCooldown > 0) this.atkCooldown -= dt;

    // 보스 특수 패턴 타이머 카운트다운
    if (this.isBoss) {
      this.specialPatternTimer -= dt;
      if (this.specialPatternTimer <= 0) {
        this.specialPatternTimer = this.isPhase2 ? (2.8 + Math.random() * 1.2) : (4.5 + Math.random() * 1.5);
        this.triggerBossSpecialPattern(player);
      }
    }

    if (this.isMimic && !this.isMimicAwake) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      if (dist <= 70) {
        this.isMimicAwake = true;
        this.name = this.mimicType === 'golden' ? '깨어난 황금 미믹' : '깨어난 흉포한 미믹';
        if (window.effectMgr) {
          window.effectMgr.addFloatingText(this.x, this.y - 25, '미믹 기습!', 'crit');
          window.effectMgr.spawnSparks(this.x, this.y, 14, '#ff3300');
        }
      }
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > this.attackRange) {
      const spd = this.speed;
      const safeDist = dist || 1;
      this.x += (dx / safeDist) * spd;
      this.y += (dy / safeDist) * spd;
    } else {
      if (this.atkCooldown <= 0) {
        this.atkCooldown = 1.3;
        player.takeDamage(this.atk);
      }
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();

    if (this.isMimic && !this.isMimicAwake) {
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.mimicType === 'golden' ? '👑' : '🎁', sx, sy);

      ctx.font = '12px "Rajdhani", sans-serif';
      ctx.fillStyle = this.mimicType === 'golden' ? '#ffd700' : '#d2b48c';
      ctx.fillText(this.name, sx, sy - 24);
      ctx.restore();
      return;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.radius * 0.7, this.radius * 0.85, this.radius * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = this.isBoss ? 4 : 2;
    ctx.strokeStyle = this.isBoss ? '#ffd700' : '#ffffff';
    ctx.stroke();

    if (this.isBoss) {
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 60, 60, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.font = this.isBoss ? 'bold 15px "Cinzel", serif' : '12px "Rajdhani", sans-serif';
    ctx.fillStyle = this.isBoss ? '#ff3344' : this.isElite ? '#ffaa00' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, sx, sy - this.radius - 14);

    const barW = this.radius * 2.3;
    const barH = 5;
    const barX = sx - barW / 2;
    const barY = sy - this.radius - 8;

    ctx.fillStyle = '#110a18';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = this.isBoss ? '#e6005c' : '#ff4444';
    const hpRate = Math.max(0, this.hp / this.maxHp);
    ctx.fillRect(barX, barY, barW * hpRate, barH);

    ctx.restore();
  }
}

window.DungeonManager = DungeonManager;
window.Monster = Monster;
