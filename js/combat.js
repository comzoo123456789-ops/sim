// Player Controller, Combat Math, Movement, Dash & Stats Cache

// 직업별 다크 판타지 고화질 초상화 캐시
window.PLAYER_PORTRAITS = {
  warrior: new Image(),
  mage: new Image(),
  rogue: new Image(),
  fighter: new Image()
};
window.PLAYER_PORTRAITS.warrior.src = 'assets/portraits/warrior.jpg';
window.PLAYER_PORTRAITS.mage.src = 'assets/portraits/mage.jpg';
window.PLAYER_PORTRAITS.rogue.src = 'assets/portraits/rogue.jpg';
window.PLAYER_PORTRAITS.fighter.src = 'assets/portraits/fighter.jpg';

// 직업별 다크 판타지 3등신(SD) 캐릭터 스프라이트 캐시 및 투명화 처리
window.PLAYER_SPRITES_SD = {
  warrior: new Image(),
  mage: new Image()
};
window.PLAYER_SPRITES_SD.warrior.src = 'assets/characters/warrior_sd.jpg';
window.PLAYER_SPRITES_SD.mage.src = 'assets/characters/mage_sd.jpg';
window.PROCESSED_SD_SPRITES = {};

function getProcessedSDSprite(job) {
  if (window.PROCESSED_SD_SPRITES[job]) return window.PROCESSED_SD_SPRITES[job];
  const rawImg = window.PLAYER_SPRITES_SD && window.PLAYER_SPRITES_SD[job];
  if (!rawImg || !rawImg.complete || rawImg.naturalWidth <= 0) return null;

  try {
    const c = document.createElement('canvas');
    c.width = rawImg.naturalWidth;
    c.height = rawImg.naturalHeight;
    const cctx = c.getContext('2d');
    cctx.drawImage(rawImg, 0, 0);
    const imgData = cctx.getImageData(0, 0, c.width, c.height);
    const d = imgData.data;
    // 검은색 배경 크로마키 투명화 (< 26)
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      if (r < 26 && g < 26 && b < 26) {
        d[i+3] = 0;
      } else if (r < 46 && g < 46 && b < 46) {
        d[i+3] = Math.floor((Math.max(r, g, b) - 26) / 20 * 255);
      }
    }
    cctx.putImageData(imgData, 0, 0);
    window.PROCESSED_SD_SPRITES[job] = c;
    return c;
  } catch (e) {
    return null;
  }
}

class Player {
  constructor(charData) {
    this.charData = charData;
    this.id = charData.id;
    this.name = charData.name;
    this.job = charData.job;
    this.level = charData.level || 1;
    this.exp = charData.exp || 0;
    this.nextExp = charData.nextExp || GAME_CONFIG.BASE_EXP;
    this.gold = charData.gold || 500;
    this.currentFloor = charData.currentFloor || 1;
    this.potions = charData.potions || 5;

    this.equip = charData.equip || { weapon: null, helmet: null, armor: null, gloves: null, boots: null };
    this.inventory = charData.inventory || [];
    this.materials = charData.materials || { upgrade_stone: 5, iron_ore: 10, dimension_shard: 0, abyss_crystal: 0 };
    this.skillCooldowns = {};

    this.x = 400;
    this.y = 380;
    this.radius = 20;
    this.angle = 0;

    // 대시 / 구르기 상태
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashVx = 0;
    this.dashVy = 0;
    this.isInvincible = false;

    // 기본 공격 쿨타임
    this.atkCooldown = 0;

    // 1~4순위 시스템 속성 (칭호, 펫, 버프, 업적 통계)
    this.activeTitle = charData.activeTitle || 'novice';
    this.activePet = charData.activePet || 'drone';
    this.petCooldown = 0;
    this.buffs = { berserk: 0, shield: 0, counterStrike: 0 };
    this.stats_kills = charData.stats_kills || 0;
    this.stats_bossKills = charData.stats_bossKills || 0;
    this.stats_mimicKills = charData.stats_mimicKills || 0;
    this.achievements = Array.isArray(charData.achievements) ? charData.achievements : [];
    this.facing = 'right';
    this.isTowerDestroyed = charData.isTowerDestroyed || false;

    // 패링 (Parry) & 카운터 스트라이크 시스템
    this.isParrying = false;
    this.parryTimer = 0;
    this.parryCooldown = 0;

    // 1번: 로그라이크 고대 심연 유물 (Relics) 덱
    this.relics = Array.isArray(charData.relics) ? charData.relics : [];
    this.holyAegisCooldown = 0;

    // 1번, 2번, 3번, 6번 시스템 속성
    this.hiredMercenaries = Array.isArray(charData.hiredMercenaries) ? charData.hiredMercenaries : [];
    this.mercenaryId = charData.mercenaryId || null;
    this.runestones = Array.isArray(charData.runestones) ? charData.runestones : [];
    this.runestoneCurrency = Number(charData.runestoneCurrency) || 0;
    this.skillRunes = charData.skillRunes || {};
    this.researchLevels = charData.researchLevels || { forge: 0, alchemy: 0, beacon: 0, pylon: 0, bastion: 0 };
    this.dmgReduction = 0;

    // 스탯 캐시
    this.statCache = {};
    this.recalculateStats();

    this.hp = this.statCache.maxHp;
    this.mp = this.statCache.maxMp;
  }

  // 모든 장비, 레벨, 보석, 패시브를 반영한 종합 스탯 재계산
  recalculateStats() {
    const cls = CLASSES[this.job];
    const lvl = this.level;

    // 1. 기초 스탯 + 레벨 성장치
    let str = cls.baseStats.str + (lvl - 1) * cls.statPerLevel.str;
    let dex = cls.baseStats.dex + (lvl - 1) * cls.statPerLevel.dex;
    let int = cls.baseStats.int + (lvl - 1) * cls.statPerLevel.int;
    let maxHp = cls.baseStats.maxHp + (lvl - 1) * cls.statPerLevel.maxHp;
    let maxMp = cls.baseStats.maxMp + (lvl - 1) * cls.statPerLevel.maxMp;
    let atk = cls.baseStats.atk + (lvl - 1) * cls.statPerLevel.atk;
    let def = cls.baseStats.def + (lvl - 1) * cls.statPerLevel.def;
    let critRate = cls.baseStats.critRate;
    let critDmg = cls.baseStats.critDmg;
    let eva = cls.baseStats.eva;
    let speed = cls.baseStats.speed;
    let atkSpeed = cls.baseStats.atkSpeed;

    let fireDmg = 0, coldDmg = 0, lightningDmg = 0, darkDmg = 0;

    // 2. 장착 장비 스탯 가산
    Object.values(this.equip).forEach(item => {
      if (!item) return;

      // 기본 옵션
      if (item.baseStat) {
        if (item.baseStat.atk) atk += item.baseStat.atk;
        if (item.baseStat.def) def += item.baseStat.def;
        if (item.baseStat.maxHp) maxHp += item.baseStat.maxHp;
        if (item.baseStat.maxMp) maxMp += item.baseStat.maxMp;
        if (item.baseStat.str) str += item.baseStat.str;
        if (item.baseStat.dex) dex += item.baseStat.dex;
        if (item.baseStat.int) int += item.baseStat.int;
        if (item.baseStat.eva) eva += item.baseStat.eva;
      }

      // 부가 옵션 (Sub-Stats)
      if (item.subStats) {
        item.subStats.forEach(sub => {
          if (sub.id === 'atk') atk += sub.value;
          if (sub.id === 'def') def += sub.value;
          if (sub.id === 'maxHp') maxHp += sub.value;
          if (sub.id === 'maxMp') maxMp += sub.value;
          if (sub.id === 'str') str += sub.value;
          if (sub.id === 'dex') dex += sub.value;
          if (sub.id === 'int') int += sub.value;
          if (sub.id === 'critRate') critRate += sub.value;
          if (sub.id === 'critDmg') critDmg += sub.value;
          if (sub.id === 'eva') eva += sub.value;
          if (sub.id === 'speed') speed *= (1 + sub.value);
          if (sub.id === 'atkSpeed') atkSpeed *= (1 + sub.value);
          if (sub.id === 'fireDmg') fireDmg += sub.value;
          if (sub.id === 'coldDmg') coldDmg += sub.value;
          if (sub.id === 'lightningDmg') lightningDmg += sub.value;
          if (sub.id === 'darkDmg') darkDmg += sub.value;
        });
      }

      // 장착된 보석 (Gems)
      if (item.gemList) {
        item.gemList.forEach(gKey => {
          const gem = GEMS[gKey];
          if (gem && gem.statBonus) {
            if (gem.statBonus.atk) atk += gem.statBonus.atk;
            if (gem.statBonus.int) int += gem.statBonus.int;
            if (gem.statBonus.dex) dex += gem.statBonus.dex;
            if (gem.statBonus.str) str += gem.statBonus.str;
            if (gem.statBonus.maxHp) maxHp += gem.statBonus.maxHp;
            if (gem.statBonus.maxMp) maxMp += gem.statBonus.maxMp;
            if (gem.statBonus.def) def += gem.statBonus.def;
            if (gem.statBonus.critRate) critRate += gem.statBonus.critRate;
            if (gem.statBonus.fireDmg) fireDmg += gem.statBonus.fireDmg;
            if (gem.statBonus.coldDmg) coldDmg += gem.statBonus.coldDmg;
            if (gem.statBonus.speedMul) speed *= (1 + gem.statBonus.speedMul);
          }
        });
      }
    });

    // 3. 스탯 기반 보정 (힘->공격력, 지능->마나/주문공격, 민첩->치명타/회피)
    atk += Math.floor(str * 1.5 + dex * 0.8 + int * 1.2);
    def += Math.floor(str * 0.5 + dex * 0.3);
    critRate += (dex * 0.001);
    eva += (dex * 0.0008);

    // 4. 직업별 상시 자동 패시브/버프 3종 적용 (요구사항 3번 명시!)
    let cdReduc = 0;
    let hpRegen = 0;
    let mpRegen = 2;

    if (this.job === 'warrior') {
      str *= 1.15; // 거인의 힘
      atk *= 1.10;
      def *= 1.20; // 강철의 의지
      maxHp *= 1.25; // 불굴의 생명력
      hpRegen = 0.02;
    } else if (this.job === 'mage') {
      int *= 1.20; // 비전 지능
      atk *= 1.15;
      maxMp *= 1.30; // 마나 샘
      mpRegen += 5;
      cdReduc += 0.15; // 원소 가속
      critRate += 0.08;
    } else if (this.job === 'rogue') {
      critRate += 0.12; // 암살자의 눈
      critDmg += 0.30;
      eva += 0.15; // 그림자 발걸음
      speed *= 1.15;
      atkSpeed *= 1.25; // 질풍의 칼날
    } else if (this.job === 'fighter') {
      atk *= 1.15; // 기공 강화
      def *= 1.15; // 금강불괴
      maxHp *= 1.15;
      atkSpeed *= 1.20; // 신속의 연타
    }

    // 5. 칭호(Title) 스탯 보너스 반영 (2순위)
    if (this.activeTitle && window.TITLES && window.TITLES[this.activeTitle]) {
      const tb = window.TITLES[this.activeTitle].statBoost;
      if (tb.str) str += tb.str;
      if (tb.dex) dex += tb.dex;
      if (tb.int) int += tb.int;
      if (tb.atk) atk += tb.atk;
      if (tb.def) def += tb.def;
      if (tb.maxHp) maxHp += tb.maxHp;
      if (tb.critRate) critRate += tb.critRate;
      if (tb.critDmg) critDmg += tb.critDmg;
      if (tb.speedMul) speed *= (1 + tb.speedMul);
    }

    // 6. 동행 펫 상시 패시브 효과 (3순위: 베이비 드래곤 공격력 +12%)
    if (this.activePet === 'dragon') {
      atk *= 1.12;
    }

    // 7. 광전사의 차원 성소 버프 반영 (4순위: 공속 +60%, 이속 +35%, 치명 +20%)
    if (this.buffs && this.buffs.berserk > 0) {
      atkSpeed *= 1.60;
      speed *= 1.35;
      critRate += 0.20;
    }

    // 2번: 세트 아이템 보너스 (2셋, 3셋, 5셋)
    const setCount = {};
    Object.values(this.equip).forEach(eq => {
      if (eq && eq.setId) {
        setCount[eq.setId] = (setCount[eq.setId] || 0) + 1;
      }
    });

    this.activeSetEffects = [];
    this.lifesteal = 0;
    this.meteorOnHit = 0;
    this.reviveChance = false;
    this.riftSlashOnHit = 0;

    Object.entries(setCount).forEach(([setId, count]) => {
      const setDef = window.SET_ITEMS && window.SET_ITEMS[setId];
      if (!setDef) return;
      [2, 3, 5].forEach(thresh => {
        if (count >= thresh && setDef.bonuses[thresh]) {
          const b = setDef.bonuses[thresh];
          this.activeSetEffects.push({ setId, count: thresh, name: setDef.name, desc: b.desc });
          const sb = b.statBoost;
          if (sb.fireDmgMul) fireDmg *= (1 + sb.fireDmgMul);
          if (sb.critRate) critRate += sb.critRate;
          if (sb.atkMul) atk *= (1 + sb.atkMul);
          if (sb.atkSpeedMul) atkSpeed *= (1 + sb.atkSpeedMul);
          if (sb.critDmg) critDmg += sb.critDmg;
          if (sb.hpMul) maxHp *= (1 + sb.hpMul);
          if (sb.defMul) def *= (1 + sb.defMul);
          if (sb.str) str += sb.str;
          if (sb.dex) dex += sb.dex;
          if (sb.int) int += sb.int;
          if (sb.lifesteal) this.lifesteal += sb.lifesteal;
          if (sb.speedMul) speed *= (1 + sb.speedMul);
          if (sb.cdReduc) cdReduc += sb.cdReduc;
          if (sb.mpMul) maxMp *= (1 + sb.mpMul);
          if (sb.meteorOnHit) this.meteorOnHit = sb.meteorOnHit;
          if (sb.reviveChance) this.reviveChance = true;
          if (sb.riftSlashOnHit) this.riftSlashOnHit = sb.riftSlashOnHit;
        }
      });
    });

    // 2번: 장비 각인 룬스톤(Runestone) 스탯 반영
    Object.values(this.equip).forEach(eq => {
      if (eq && eq.runestone && window.RUNESTONES && window.RUNESTONES[eq.runestone]) {
        const rb = window.RUNESTONES[eq.runestone].statBonus;
        if (rb.atk) atk += rb.atk;
        if (rb.def) def += rb.def;
        if (rb.maxHp) maxHp += rb.maxHp;
        if (rb.critDmg) critDmg += rb.critDmg;
        if (rb.speedMul) speed *= (1 + rb.speedMul);
        if (rb.atkSpeedMul) atkSpeed *= (1 + rb.atkSpeedMul);
        if (rb.lifesteal) this.lifesteal += rb.lifesteal;
      }
    });

    // 1번: 대사제 세리아 동행 시 상시 공격력 +18% 증폭 오라
    if (this.activeMercenary === 'ceria' || this.mercenaryId === 'ceria') {
      atk *= 1.18;
    }

    // 6번: 마을 기지 연구소(Research Lab) 시설 업그레이드 보너스
    const res = this.researchLevels || {};
    const forgeLv = res.forge || 0;
    const bastionLv = res.bastion || 0;
    const pylonLv = res.pylon || 0;

    if (forgeLv > 0) {
      atk *= (1 + forgeLv * 0.03);
      def *= (1 + forgeLv * 0.03);
    }
    if (bastionLv > 0) {
      maxHp *= (1 + bastionLv * 0.04);
      this.dmgReduction = bastionLv * 0.02;
    } else {
      this.dmgReduction = 0;
    }
    if (pylonLv > 0) {
      fireDmg *= (1 + pylonLv * 0.04);
      coldDmg *= (1 + pylonLv * 0.04);
      lightningDmg *= (1 + pylonLv * 0.04);
      darkDmg *= (1 + pylonLv * 0.04);
      cdReduc += pylonLv * 0.02;
    }

    this.statCache = {
      str: Math.floor(str),
      dex: Math.floor(dex),
      int: Math.floor(int),
      maxHp: Math.floor(maxHp),
      maxMp: Math.floor(maxMp),
      atk: Math.floor(atk),
      def: Math.floor(def),
      critRate: Math.min(0.85, Number(critRate.toFixed(3))),
      critDmg: Number(critDmg.toFixed(2)),
      eva: Math.min(0.60, Number(eva.toFixed(3))),
      speed: Number(speed.toFixed(2)),
      atkSpeed: Number(atkSpeed.toFixed(2)),
      cdReduc: cdReduc,
      hpRegen: hpRegen,
      mpRegen: mpRegen,
      elements: { fire: fireDmg, cold: coldDmg, lightning: lightningDmg, dark: darkDmg }
    };
  }

  // 경험치 획득 및 레벨업
  addExp(amount) {
    this.exp += amount;
    window.effectMgr.addFloatingText(this.x, this.y - 25, `+${amount} EXP`, 'exp');

    while (this.exp >= this.nextExp && this.level < GAME_CONFIG.MAX_LEVEL) {
      this.exp -= this.nextExp;
      this.level++;
      this.nextExp = Math.floor(this.nextExp * GAME_CONFIG.EXP_SCALE);

      this.recalculateStats();
      this.hp = this.statCache.maxHp;
      this.mp = this.statCache.maxMp;

      if (window.soundMgr) window.soundMgr.playLevelUp();
      if (window.effectMgr) {
        window.effectMgr.addFloatingText(this.x, this.y - 45, `★ LEVEL UP! (Lv.${this.level}) ★`, 'crit');
        window.effectMgr.addShockwave(this.x, this.y, 80, '#ffd700');
        window.effectMgr.spawnSparks(this.x, this.y, 30, '#ffd700');
      }
    }
  }

  // 스페이스바 긴급 회피 / 구르기 (대시)
  performDash(inputX, inputY) {
    if (this.dashCooldown > 0 || this.isDashing) return;

    let dx = inputX;
    let dy = inputY;
    if (dx === 0 && dy === 0) {
      dx = Math.cos(this.angle);
      dy = Math.sin(this.angle);
    } else {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    this.isDashing = true;
    this.isInvincible = true;
    this.dashTimer = 0.22;
    this.dashCooldown = 2.0; // 쿨타임 2초
    this.dashVx = dx * 13.5;
    this.dashVy = dy * 13.5;

    if (window.soundMgr) window.soundMgr.playDash();
    if (window.effectMgr) {
      window.effectMgr.addDashGhost(this.x, this.y, this.radius, '#55ccff');
      // 유물 효과: [화염 분출 장화]
      if (this.relics && this.relics.includes('flame_trail')) {
        window.effectMgr.spawnSparks(this.x, this.y, 16, '#ff4400');
        window.effectMgr.addShockwave(this.x, this.y, 45, '#ff6600');
      }
    }
  }

  // 🛡️ 특수키 패링 (Parry) 시스템 (Shift / F / 우클릭)
  performParry() {
    if (this.parryCooldown > 0 || this.isDashing || this.isDead) return false;

    this.isParrying = true;
    this.parryTimer = 0.35; // 0.35초 저스트 패링 윈도우
    this.parryCooldown = 1.0; // 1.0초 쿨타임

    if (window.soundMgr && window.soundMgr.playParry) window.soundMgr.playParry();
    if (window.effectMgr) {
      window.effectMgr.addShockwave(this.x, this.y, 45, '#ffd700');
      window.effectMgr.addFloatingText(this.x, this.y - 20, '🛡️ 패링 방어 태세!', 'normal');
    }
    return true;
  }

  triggerParrySuccess(source = null) {
    this.isParrying = false;
    this.isInvincible = true;
    setTimeout(() => { if (!this.isDead) this.isInvincible = false; }, 350);

    if (window.soundMgr && window.soundMgr.playParrySuccess) window.soundMgr.playParrySuccess();
    if (window.effectMgr) {
      window.effectMgr.screenShake(11.0, 0.28);
      window.effectMgr.addShockwave(this.x, this.y, 110, '#ffd700');
      window.effectMgr.spawnSparks(this.x, this.y, 35, '#ffffff');
      window.effectMgr.addFloatingText(this.x, this.y - 35, '✨ PERFECT PARRY!', 'crit');
      window.effectMgr.addFloatingText(this.x, this.y - 55, '⚔️ 카운터 공격 준비! (치명타 100%)', 'heal');
    }

    // 카운터 버프 (3.5초간 치명타율 100%, 치명타 피해 2.2배)
    this.buffs.counterStrike = 3.5;

    // 유물 효과: [시간 왜곡의 모래시계] - 패링 성공 시 모든 스킬 쿨타임 3초 감소
    if (this.relics && this.relics.includes('chrono_glass')) {
      for (const k in this.skillCooldowns) {
        this.skillCooldowns[k] = Math.max(0, this.skillCooldowns[k] - 3.0);
      }
      if (window.effectMgr) {
        window.effectMgr.addFloatingText(this.x, this.y - 75, '⏱️ 모래시계: 쿨타임 -3초!', 'heal');
      }
    }

    // 공격자 그로기 스턴 & 카운터 반격 피해
    if (source && source.isAlive) {
      if (source.applyStun) source.applyStun(2.5);
      const counterDmg = Math.floor(this.statCache.atk * 2.8);
      source.takeDamage(counterDmg, true);
      if (window.effectMgr) {
        window.effectMgr.addFloatingText(source.x, source.y - 30, '⚡ GROGGY STUN!', 'crit');
        window.effectMgr.spawnSlashArc(source.x, source.y, Math.atan2(source.y - this.y, source.x - this.x), 80, '#ffd700');
      }
    }
  }

  // 기본 공격 (마우스 좌클릭)
  performBasicAttack(targetX, targetY, enemies, townDummy) {
    if (this.atkCooldown > 0) return;
    this.atkCooldown = Math.max(0.2, 0.65 / this.statCache.atkSpeed);

    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    this.angle = angle;

    // 공격 시전 시 미세한 묵직한 반동 진동 (내가 공격하고 있다는 손맛!)
    window.effectMgr.screenShake(3.5, 0.08);

    const isCounter = this.buffs && this.buffs.counterStrike > 0;
    const isCrit = isCounter || (Math.random() < this.statCache.critRate);
    const critMultiplier = isCounter ? (this.statCache.critDmg + 1.2) : this.statCache.critDmg;
    let dmg = this.statCache.atk * (isCrit ? critMultiplier : 1.0);

    if (isCounter) {
      this.buffs.counterStrike = 0;
      if (window.effectMgr) window.effectMgr.addFloatingText(this.x, this.y - 45, '💥 COUNTER STRIKE!', 'crit');
    }

    // 유물 효과: [번개 폭풍의 인장] - 치명타 적중 시 60% 확률로 낙뢰 투하
    if (isCrit && this.relics && this.relics.includes('storm_sigil') && Math.random() < 0.6) {
      if (window.effectMgr) {
        window.effectMgr.spawnSparks(targetX, targetY, 25, '#00ffff');
        window.effectMgr.addShockwave(targetX, targetY, 70, '#ffd700');
        window.effectMgr.addFloatingText(targetX, targetY - 30, '⚡ 낙뢰 강타!', 'crit');
      }
      if (window.soundMgr) window.soundMgr.playChiBlast();
      if (enemies) {
        enemies.forEach(en => {
          if (en.isAlive && Math.hypot(en.x - targetX, en.y - targetY) <= 80) {
            en.takeDamage(this.statCache.atk * 1.2, true);
          }
        });
      }
    }

    // 허수아비 타격 판정 (마을)
    if (townDummy) {
      const d = Math.hypot(townDummy.x - this.x, townDummy.y - this.y);
      if (d <= 95) {
        townDummy.hitDummy(Math.floor(dmg));
        window.effectMgr.addFloatingText(townDummy.x, townDummy.y, Math.floor(dmg).toLocaleString(), isCrit ? 'crit' : 'normal');
        window.effectMgr.spawnSparks(townDummy.x, townDummy.y, isCrit ? 16 : 8, isCrit ? '#ffd700' : '#ffffff');
        window.effectMgr.screenShake(isCrit ? 7 : 4.5, 0.12);
        if (window.soundMgr) {
          if (isCrit) window.soundMgr.playCritHit();
          else window.soundMgr.playHit();
        }
      }
    }

    // 직업별 고유 기본 공격 연출
    if (this.job === 'warrior') {
      window.effectMgr.spawnSlashArc(this.x, this.y, angle, 52, '#ffffff');
      SkillSystem.hitEnemiesInArc(this, enemies, angle, 62, Math.PI * 0.75, dmg, { forceCrit: isCrit });
      if (window.soundMgr) window.soundMgr.playSwordSlash();
    } else if (this.job === 'mage') {
      window.effectMgr.spawnFireball(this.x, this.y, targetX, targetY, dmg * 0.85);
      if (window.soundMgr) window.soundMgr.playMagicCast();
    } else if (this.job === 'rogue') {
      window.effectMgr.spawnSlashArc(this.x, this.y, angle - 0.2, 44, '#33ff99');
      setTimeout(() => {
        window.effectMgr.spawnSlashArc(this.x, this.y, angle + 0.2, 44, '#33ff99');
      }, 70);
      SkillSystem.hitEnemiesInArc(this, enemies, angle, 54, Math.PI * 0.6, dmg, { forceCrit: isCrit });
      if (window.soundMgr) window.soundMgr.playDaggerSlash();
    } else if (this.job === 'fighter') {
      window.effectMgr.addShockwave(this.x + Math.cos(angle) * 25, this.y + Math.sin(angle) * 25, 26, '#66ccff');
      SkillSystem.hitEnemiesInArc(this, enemies, angle, 56, Math.PI * 0.5, dmg, { forceCrit: isCrit });
      if (window.soundMgr) window.soundMgr.playKnucklePunch();
    }

    // 2번: 세트 효과 및 룬스톤 타격 발동
    if (this.lifesteal && this.lifesteal > 0 && this.hp < this.statCache.maxHp) {
      const healAmount = Math.max(1, Math.floor(dmg * this.lifesteal));
      this.hp = Math.min(this.statCache.maxHp, this.hp + healAmount);
      window.effectMgr.addFloatingText(this.x, this.y - 30, `+${healAmount} 흡혈`, 'heal');
    }
    if (this.meteorOnHit && Math.random() < this.meteorOnHit) {
      window.effectMgr.spawnMeteor(targetX, targetY, this.statCache.atk * 3.5, true);
      window.effectMgr.addFloatingText(this.x, this.y - 45, '☄️ 마룡의 메테오 강림!', 'crit');
    }
    if (this.riftSlashOnHit && Math.random() < this.riftSlashOnHit) {
      window.effectMgr.spawnCrescentBlade(this.x, this.y, targetX, targetY, this.statCache.atk * 1.8);
      window.effectMgr.addFloatingText(this.x, this.y - 35, '🌀 차원 참격!', 'crit');
    }
  }

  // 생명력 물약 사용 (Q 키)
  usePotion() {
    if (this.potions <= 0) {
      window.effectMgr.addFloatingText(this.x, this.y - 20, '물약이 부족합니다!', 'player_hit');
      return;
    }
    const healRatio = 0.45 + ((this.researchLevels && this.researchLevels.alchemy) || 0) * 0.05;
    const healHp = Math.floor(this.statCache.maxHp * healRatio);
    const healMp = Math.floor(this.statCache.maxMp * healRatio);
    this.hp = Math.min(this.statCache.maxHp, this.hp + healHp);
    this.mp = Math.min(this.statCache.maxMp, this.mp + healMp);
    this.potions--;

    if (window.soundMgr) window.soundMgr.playPotion();
    if (window.effectMgr) {
      window.effectMgr.addFloatingText(this.x, this.y - 25, `+${healHp} HP & +${healMp} MP`, 'heal');
      window.effectMgr.addShockwave(this.x, this.y, 45, '#33ff88');

      // 유물 효과: [불사의 엘릭서] - 물약 복용 시 주변 넉백 및 2초간 완전 무적
      if (this.relics && this.relics.includes('immortal_elixir')) {
        this.isInvincible = true;
        setTimeout(() => { if (!this.isDead) this.isInvincible = false; }, 2000);
        window.effectMgr.addShockwave(this.x, this.y, 180, '#00ffaa');
        window.effectMgr.addFloatingText(this.x, this.y - 45, '🧪 [불사의 엘릭서] 2초간 완전 무적!', 'crit');
      }
    }
  }

  // 피격 시 데미지 처리 (source: 공격한 몬스터 엔티티 또는 탄막)
  takeDamage(amount, source = null) {
    if (this.isInvincible) return;

    // 🛡️ 완벽한 패링 (Parry) 적중 검사
    if (this.isParrying) {
      this.triggerParrySuccess(source);
      return;
    }

    // 회피율 체크
    if (Math.random() < this.statCache.eva) {
      window.effectMgr.addFloatingText(this.x, this.y - 15, 'EVADE', 'evade');
      return;
    }

    // 방어력 감소 공식
    let actual = Math.max(1, Math.floor(amount * (100 / (100 + this.statCache.def))));

    // 6번: 차원 요새 방벽 연구 피해 감소
    if (this.dmgReduction && this.dmgReduction > 0) {
      actual = Math.max(1, Math.floor(actual * (1 - this.dmgReduction)));
    }

    // 보호막(Shield) 흡수
    if (this.buffs && this.buffs.shield > 0) {
      if (this.buffs.shield >= actual) {
        this.buffs.shield -= actual;
        window.effectMgr.addFloatingText(this.x, this.y - 25, `보호막 흡수 -${actual}`, 'heal');
        return;
      } else {
        actual -= this.buffs.shield;
        this.buffs.shield = 0;
        window.effectMgr.addFloatingText(this.x, this.y - 25, `보호막 파괴!`, 'player_hit');
      }
    }

    this.hp -= actual;

    // 유물 효과: [성스러운 아에기스] - 체력 35% 이하 시 800 보호막 발동 (쿨타임 30초)
    if (this.relics && this.relics.includes('holy_aegis') && this.holyAegisCooldown <= 0) {
      if (this.hp <= this.statCache.maxHp * 0.35) {
        this.buffs.shield = (this.buffs.shield || 0) + 800;
        this.holyAegisCooldown = 30.0;
        if (window.effectMgr) {
          window.effectMgr.addShockwave(this.x, this.y, 80, '#00e5ff');
          window.effectMgr.addFloatingText(this.x, this.y - 35, '🛡️ [성스러운 아에기스] +800 보호막 발동!', 'heal');
        }
      }
    }

    window.effectMgr.addFloatingText(this.x, this.y - 15, `-${actual}`, 'player_hit');
    window.effectMgr.screenShake(4, 0.15);
    if (window.soundMgr) window.soundMgr.playHit();

    if (this.hp <= 0) {
      this.die();
    }
  }

  // 1번: 몬스터 처치 시 유물 효과 격발
  triggerRelicOnKill(enemy) {
    if (!this.relics || this.relics.length === 0) return;

    // [피의 갈증 검] - 최대 HP 4% 즉시 회복
    if (this.relics.includes('blood_blade') && this.hp < this.statCache.maxHp) {
      const healAmt = Math.max(1, Math.floor(this.statCache.maxHp * 0.04));
      this.hp = Math.min(this.statCache.maxHp, this.hp + healAmt);
      if (window.effectMgr) window.effectMgr.addFloatingText(this.x, this.y - 20, `+${healAmt} 흡혈`, 'heal');
    }

    // [영혼 폭탄] - 적 시체 폭발하여 주변 적들에게 범위 피해
    if (this.relics.includes('soul_bomb') && enemy) {
      const bombDmg = Math.max(25, Math.floor(enemy.maxHp * 0.15));
      if (window.effectMgr) {
        window.effectMgr.addShockwave(enemy.x, enemy.y, 85, '#bb44ff');
        window.effectMgr.spawnSparks(enemy.x, enemy.y, 20, '#ff00ff');
      }
      if (window.game && window.game.dungeonMgr && window.game.dungeonMgr.enemies) {
        window.game.dungeonMgr.enemies.forEach(other => {
          if (other.isAlive && Math.hypot(other.x - enemy.x, other.y - enemy.y) <= 90) {
            other.takeDamage(bombDmg, true);
          }
        });
      }
    }
  }

  die() {
    if (this.isDead) return;

    // 2번: 심연의 지배자 5세트 불사 부활 특권
    if (this.reviveChance) {
      this.reviveChance = false;
      this.hp = Math.floor(this.statCache.maxHp * 0.60);
      this.isInvincible = true;
      if (window.effectMgr) {
        window.effectMgr.addShockwave(this.x, this.y, 80, '#a020f0');
        window.effectMgr.spawnSparks(this.x, this.y, 40, '#ffd700');
        window.effectMgr.addFloatingText(this.x, this.y - 40, '👑 [심연의 지배자] 불사 부활! (HP 60% 복구)', 'crit');
      }
      if (window.soundMgr) window.soundMgr.playEnhanceSuccess();
      setTimeout(() => { this.isInvincible = false; }, 1500);
      return;
    }

    this.isDead = true;
    this.hp = 0;
    this.isInvincible = true;
    if (window.effectMgr) {
      window.effectMgr.addFloatingText(this.x, this.y - 30, '💀 사망했습니다! 기지로 귀환합니다...', 'player_hit');
      window.effectMgr.screenShake(10, 0.4);
    }
    setTimeout(() => {
      this.hp = this.statCache.maxHp;
      this.mp = this.statCache.maxMp;
      this.isInvincible = false;
      this.isDead = false;
      if (window.game) {
        window.game.returnToTown();
      }
    }, 1000);
  }

  // 매 프레임 업데이트
  update(dt, input, walls) {
    if (this.isDead) return;

    // 쿨타임 감소
    if (this.atkCooldown > 0) this.atkCooldown -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.petCooldown > 0) this.petCooldown -= dt;

    // 패링 쿨타임 & 활성 시간 감소
    if (this.parryCooldown > 0) this.parryCooldown -= dt;
    if (this.isParrying) {
      this.parryTimer -= dt;
      if (this.parryTimer <= 0) {
        this.isParrying = false;
      }
    }
    // 카운터 스트라이크 버프 타이머
    if (this.buffs && this.buffs.counterStrike > 0) {
      this.buffs.counterStrike -= dt;
      if (this.buffs.counterStrike <= 0) this.buffs.counterStrike = 0;
    }
    if (this.holyAegisCooldown > 0) this.holyAegisCooldown -= dt;

    // 광전사 버프 타이머
    if (this.buffs && this.buffs.berserk > 0) {
      this.buffs.berserk -= dt;
      if (this.buffs.berserk <= 0) {
        this.buffs.berserk = 0;
        this.recalculateStats();
        if (window.effectMgr) window.effectMgr.addFloatingText(this.x, this.y - 25, '광전사 버프 만료', 'normal');
      }
    }

    // 스킬 쿨타임 감소
    Object.keys(this.skillCooldowns).forEach(k => {
      if (this.skillCooldowns[k] > 0) {
        this.skillCooldowns[k] -= dt;
      }
    });

    // 마나 & 체력 자연 회복
    if (this.statCache.mpRegen) {
      this.mp = Math.min(this.statCache.maxMp, this.mp + this.statCache.mpRegen * dt);
    }
    if (this.statCache.hpRegen) {
      this.hp = Math.min(this.statCache.maxHp, this.hp + this.statCache.maxHp * this.statCache.hpRegen * dt);
    }

    // 대시 중 이동
    if (this.isDashing) {
      this.x += this.dashVx;
      this.y += this.dashVy;
      this.dashTimer -= dt;
      window.effectMgr.addDashGhost(this.x, this.y, this.radius, 'rgba(100, 200, 255, 0.4)');
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.isInvincible = false;
      }
      return;
    }

    // WASD 이동 및 모바일 가상 조이스틱 이동
    let mx = 0;
    let my = 0;
    if (input.w) my -= 1;
    if (input.s) my += 1;
    if (input.a) { mx -= 1; this.facing = 'left'; }
    if (input.d) { mx += 1; this.facing = 'right'; }

    if (input.joyX || input.joyY) {
      mx += (input.joyX || 0);
      my += (input.joyY || 0);
      if (input.joyX < -0.2) this.facing = 'left';
      else if (input.joyX > 0.2) this.facing = 'right';
    }

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      const spd = this.statCache.speed;
      this.x += (mx / len) * spd;
      this.y += (my / len) * spd;
    }

    // 맵 경계 제한 (마을 맵 이탈 방지)
    if (window.game && window.game.state === 'town') {
      this.x = Math.max(120, Math.min(680, this.x));
      this.y = Math.max(160, Math.min(600, this.y));
    }

    // 벽 충돌 방지 (던전 모드)
    if (walls && walls.length > 0) {
      walls.forEach(w => {
        if (this.x + this.radius > w.x && this.x - this.radius < w.x + w.w &&
            this.y + this.radius > w.y && this.y - this.radius < w.y + w.h) {
          // 경계 밖으로 밀어내기
          const overlapLeft = (this.x + this.radius) - w.x;
          const overlapRight = (w.x + w.w) - (this.x - this.radius);
          const overlapTop = (this.y + this.radius) - w.y;
          const overlapBottom = (w.y + w.h) - (this.y - this.radius);

          const min = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
          if (min === overlapLeft) this.x = w.x - this.radius;
          else if (min === overlapRight) this.x = w.x + w.w + this.radius;
          else if (min === overlapTop) this.y = w.y - this.radius;
          else if (min === overlapBottom) this.y = w.y + w.h + this.radius;
        }
      });
    }
  }

  // 렌더링 (퍼지는 O 완전 제거, 3등신 액션 캐릭터 일체형 렌더링)
  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();

    // 1. 발 밑 깔끔한 타원형 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 22, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 3등신 다크 판타지 액션 RPG 캐릭터 모델 렌더링
    ctx.save();
    // 마우스/조이스틱 조준 방향에 따른 좌우 반전
    const isFacingLeft = Math.cos(this.angle) < 0;
    ctx.translate(sx, sy);
    if (isFacingLeft) {
      ctx.scale(-1, 1);
    }

    // 이동 중 상하 바운스 보빙 애니메이션
    const isMoving = (window.game && window.game.input && (window.game.input.w || window.game.input.a || window.game.input.s || window.game.input.d || window.game.input.joyX || window.game.input.joyY));
    const bobOffset = isMoving ? Math.sin(Date.now() * 0.016) * 2.5 : Math.sin(Date.now() * 0.003) * 0.8;
    ctx.translate(0, bobOffset);

    // 1.3배 확대하여 시원하고 또렷하게 캐릭터 표출
    ctx.scale(1.3, 1.3);

    // 모든 직업 일관 3등신 액션 렌더링
    this.render3HeadHero(ctx, isMoving);

    ctx.restore();

    // 3. 패링 방어막 렌더링
    if (this.isParrying) {
      ctx.save();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#ffd700';
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. 캐릭터 이름 & 레벨 (슬림 다크 글래스 배지)
    const isHighEnhanced = (this.equip.weapon && this.equip.weapon.enhance >= 10);
    const tagText = `Lv.${this.level} ${this.name}`;
    ctx.font = 'bold 11px "Cinzel", "Rajdhani", sans-serif';
    const textW = ctx.measureText(tagText).width;

    ctx.fillStyle = 'rgba(10, 5, 20, 0.85)';
    ctx.strokeStyle = isHighEnhanced ? '#ffd700' : 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(sx - textW/2 - 6, sy - this.radius - 22, textW + 12, 16, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, sx, sy - this.radius - 14);

    ctx.restore();
  }

  // 3등신 다크 판타지 액션 캐릭터 절차적 렌더링 & 직접 팔/무기 휘두름 모션
  render3HeadHero(ctx, isMoving) {
    const stepPhase = isMoving ? Math.sin(Date.now() * 0.018) : 0;
    const legOffsetL = stepPhase * 5;
    const legOffsetR = -stepPhase * 5;

    // 공격 발동 시 무기 & 팔 액션 수치 계산
    let atkProgress = 0;
    if (this.atkCooldown > 0) {
      const maxCd = Math.max(0.18, 0.65 / (this.statCache ? this.statCache.atkSpeed : 1));
      atkProgress = Math.max(0, Math.min(1, 1 - (this.atkCooldown / maxCd)));
    }

    if (this.job === 'warrior') {
      // --- ⚔️ 3등신 강철의 전사 (Warrior) ---
      // 1. 망토 (뒤쪽 흩날림)
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-18 - Math.abs(stepPhase) * 3, 16);
      ctx.lineTo(2, 14);
      ctx.closePath();
      ctx.fill();

      // 2. 다리 & 무장 부츠 (걸음걸이 직접 교차 모션)
      ctx.fillStyle = '#334155';
      ctx.fillRect(-7 + legOffsetL, 8, 5, 10);
      ctx.fillRect(2 + legOffsetR, 8, 5, 10);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-8 + legOffsetL, 15, 7, 4);
      ctx.fillRect(1 + legOffsetR, 15, 7, 4);

      // 3. 강철 갑옷 몸통 & 견갑
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(-9, -4, 18, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-9, -4, 18, 3); // 금빛 단장

      // 4. 뿔 투구 머리 & 붉은 안광
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, -12, 12, 0, Math.PI * 2);
      ctx.fill();
      // 투구 뿔
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(-10, -14);
      ctx.lineTo(-16, -24);
      ctx.lineTo(-6, -18);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, -14);
      ctx.lineTo(16, -24);
      ctx.lineTo(6, -18);
      ctx.closePath();
      ctx.fill();
      // 안광 바이저
      ctx.fillStyle = '#ff2244';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff2244';
      ctx.fillRect(-5, -13, 10, 3);
      ctx.shadowBlur = 0;

      // 5. 전사 대검 팔 휘두르기 액션 모션
      ctx.save();
      ctx.translate(4, -2);
      const swordSwing = atkProgress > 0 ? Math.sin(atkProgress * Math.PI) * 2.2 - 0.8 : 0.2;
      ctx.rotate(swordSwing);

      // 팔
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, -3, 14, 6);

      // 대검 날 & 자루
      ctx.fillStyle = '#78350f';
      ctx.fillRect(14, -2, 6, 4);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(20, -5, 3, 10);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(23, -4);
      ctx.lineTo(46, -2);
      ctx.lineTo(52, 0);
      ctx.lineTo(46, 2);
      ctx.lineTo(23, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 검기 궤적 이펙트
      if (atkProgress > 0 && atkProgress < 0.8) {
        ctx.strokeStyle = 'rgba(255, 50, 80, 0.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 48, -0.6, 0.8);
        ctx.stroke();
      }
      ctx.restore();

    } else if (this.job === 'mage') {
      // --- 🪄 3등신 비전의 마법사 (Mage) ---
      // 1. 비전 로브 바닥 펄럭임
      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-14 + legOffsetL, 18);
      ctx.lineTo(14 + legOffsetR, 18);
      ctx.lineTo(10, 0);
      ctx.closePath();
      ctx.fill();

      // 2. 신발 (로브 아래 살짝 보임)
      ctx.fillStyle = '#581c87';
      ctx.fillRect(-6 + legOffsetL, 12, 4, 6);
      ctx.fillRect(2 + legOffsetR, 12, 4, 6);

      // 3. 로브 상의 & 금빛 장식
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.roundRect(-8, -4, 16, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-2, -4, 4, 14);

      // 4. 후드 머리 & 영롱한 시안색 안광
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(0, -12, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f0ff';
      ctx.fillRect(-4, -13, 3, 3);
      ctx.fillRect(2, -13, 3, 3);
      ctx.shadowBlur = 0;

      // 5. 마법 지팡이 캐스팅 & 영창 모션
      ctx.save();
      ctx.translate(4, -2);
      const castThrust = atkProgress > 0 ? Math.sin(atkProgress * Math.PI) * 14 : 0;
      const castAngle = atkProgress > 0 ? -Math.sin(atkProgress * Math.PI) * 0.5 : 0.1;
      ctx.translate(castThrust, 0);
      ctx.rotate(castAngle);

      // 팔
      ctx.fillStyle = '#581c87';
      ctx.fillRect(0, -3, 12, 5);

      // 지팡이
      ctx.fillStyle = '#78350f';
      ctx.fillRect(12, -2, 28, 4);
      // 마법 수정 구체
      ctx.fillStyle = '#00ffff';
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#00ffff';
      ctx.beginPath();
      ctx.arc(42, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (atkProgress > 0) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(42, 0, 12 + atkProgress * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

    } else if (this.job === 'rogue') {
      // --- 🗡️ 3등신 그림자 암살자 (Rogue) ---
      // 1. 망토
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(-14 - Math.abs(stepPhase) * 2, 16);
      ctx.lineTo(-2, 12);
      ctx.closePath();
      ctx.fill();

      // 2. 가죽 신발 (걸음걸이 직접 모션)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6 + legOffsetL, 8, 4, 10);
      ctx.fillRect(2 + legOffsetR, 8, 4, 10);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-7 + legOffsetL, 15, 6, 4);
      ctx.fillRect(1 + legOffsetR, 15, 6, 4);

      // 3. 가죽 갑옷 몸통
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(-8, -4, 16, 14, 3);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 4. 그림자 두건 & 에메랄드 안광
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(0, -12, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-12, -12);
      ctx.lineTo(0, -24);
      ctx.lineTo(12, -12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#00ffaa';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00ffaa';
      ctx.fillRect(-5, -13, 3, 2);
      ctx.fillRect(2, -13, 3, 2);
      ctx.shadowBlur = 0;

      // 5. 양손 독단검 교차 찌르기 모션
      const stabL = atkProgress > 0 ? Math.sin(atkProgress * Math.PI * 2) * 12 : 0;
      const stabR = atkProgress > 0 ? Math.cos(atkProgress * Math.PI * 2) * 10 : 0;

      // 오른손 단검
      ctx.save();
      ctx.translate(6 + stabL, -3);
      ctx.fillStyle = '#00ffaa';
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(16, 0);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 왼손 단검
      ctx.save();
      ctx.translate(6 + stabR, 5);
      ctx.fillStyle = '#00ffaa';
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(14, 0);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

    } else {
      // --- 🥊 3등신 권법가 파이터 (Fighter) ---
      // 1. 다리 & 무도화 (걸음걸이 직접 모션)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-7 + legOffsetL, 8, 5, 10);
      ctx.fillRect(2 + legOffsetR, 8, 5, 10);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-8 + legOffsetL, 15, 7, 4);
      ctx.fillRect(1 + legOffsetR, 15, 7, 4);

      // 2. 도복 몸통 & 붉은 띠
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(-9, -4, 18, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-9, 4, 18, 4);

      // 3. 머리 & 흩날리는 붉은 헤어밴드
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, -12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-11, -15, 22, 4);
      // 헤어밴드 끈 흩날림
      ctx.beginPath();
      ctx.moveTo(-10, -13);
      ctx.lineTo(-18 - Math.abs(stepPhase) * 3, -8);
      ctx.lineTo(-16, -14);
      ctx.closePath();
      ctx.fill();

      // 눈매
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -11, 4, 2);
      ctx.fillRect(2, -11, 4, 2);
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(-4, -11, 2, 2);
      ctx.fillRect(4, -11, 2, 2);

      // 4. 연타 파이어 정권 지르기 모션
      const punchDist = atkProgress > 0 ? Math.sin(atkProgress * Math.PI * 2) * 16 : 0;

      ctx.save();
      ctx.translate(6 + punchDist, 2);
      ctx.fillStyle = '#ff6600';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff6600';
      ctx.beginPath();
      ctx.arc(6, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
}

// 1번: 차원 용병 (Mercenary Companion) 클래스
class Mercenary {
  constructor(data, player) {
    this.id = data.id;
    this.name = data.name;
    this.job = data.job;
    this.title = data.title;
    this.role = data.role;
    this.icon = data.icon;
    this.color = data.color;

    const lvl = player.level;
    this.maxHp = Math.floor(data.baseHp * (1 + lvl * 0.08));
    this.hp = this.maxHp;
    this.atk = Math.floor(data.baseAtk * (1 + lvl * 0.07));
    this.def = Math.floor(data.baseDef * (1 + lvl * 0.06));
    this.speed = data.speed;
    this.skillCd = data.skillCd;
    this.skillTimer = 1.0;
    this.atkTimer = 0;

    this.x = player.x - 40;
    this.y = player.y + 20;
    this.radius = 18;
    this.isAlive = true;
  }

  takeDamage(amount) {
    if (!this.isAlive) return;
    const actual = Math.max(1, Math.floor(amount * (100 / (100 + this.def))));
    this.hp -= actual;
    if (window.effectMgr) {
      window.effectMgr.addFloatingText(this.x, this.y - 15, `-${actual}`, 'player_hit');
    }
    if (this.hp <= 0) {
      this.isAlive = false;
      this.hp = 0;
      if (window.effectMgr) {
        window.effectMgr.addFloatingText(this.x, this.y - 30, `[${this.name}] 전투 불능!`, 'player_hit');
      }
    }
  }

  respawn(player) {
    this.isAlive = true;
    this.hp = this.maxHp;
    this.x = player.x - 30;
    this.y = player.y + 30;
  }

  update(dt, player, enemies) {
    if (!this.isAlive) return;

    if (this.atkTimer > 0) this.atkTimer -= dt;
    if (this.skillTimer > 0) this.skillTimer -= dt;

    // 플레이어 추종 (거리 75 이상 벌어지면 플레이어 방향으로 이동)
    const pDist = Math.hypot(player.x - this.x, player.y - this.y);
    if (pDist > 160) {
      this.x = player.x + (Math.random() - 0.5) * 40;
      this.y = player.y + (Math.random() - 0.5) * 40;
    } else if (pDist > 75) {
      const ang = Math.atan2(player.y - this.y, player.x - this.x);
      this.x += Math.cos(ang) * this.speed * 1.1;
      this.y += Math.sin(ang) * this.speed * 1.1;
    }

    const aliveEnemies = (enemies || []).filter(e => e.isAlive);

    // 스킬 사용
    if (this.skillTimer <= 0) {
      this.skillTimer = this.skillCd;

      if (this.id === 'roland') {
        if (window.effectMgr) {
          window.effectMgr.addShockwave(this.x, this.y, 110, '#ffd700');
          window.effectMgr.addFloatingText(this.x, this.y - 30, '🛡️ 정의의 도발!', 'crit');
          player.buffs.shield = (player.buffs.shield || 0) + 300;
          window.effectMgr.addFloatingText(player.x, player.y - 25, '+300 수호 방벽', 'heal');
        }
        aliveEnemies.forEach(e => {
          if (Math.hypot(e.x - this.x, e.y - this.y) <= 240) {
            e.x += (this.x - e.x) * 0.25;
            e.y += (this.y - e.y) * 0.25;
          }
        });
        if (window.soundMgr) window.soundMgr.playChiBlast();
      } else if (this.id === 'ceria') {
        if (player.hp < player.statCache.maxHp * 0.75 || this.hp < this.maxHp * 0.75) {
          const healP = Math.floor(player.statCache.maxHp * 0.35);
          player.hp = Math.min(player.statCache.maxHp, player.hp + healP);
          this.hp = Math.min(this.maxHp, this.hp + Math.floor(this.maxHp * 0.35));
          if (window.effectMgr) {
            window.effectMgr.addShockwave(player.x, player.y, 60, '#00ffaa');
            window.effectMgr.addFloatingText(player.x, player.y - 30, `+${healP} 기적의 치유 (세리아)`, 'heal');
          }
          if (window.soundMgr) window.soundMgr.playPotion();
        }
      } else if (this.id === 'kyle') {
        if (aliveEnemies.length > 0) {
          const target = aliveEnemies[0];
          if (window.effectMgr) {
            window.effectMgr.createLaser(this.x, this.y, target.x, target.y, '#ff3344', 0.25);
            window.effectMgr.addFloatingText(this.x, this.y - 20, '🏹 관통 저격!', 'crit');
          }
          aliveEnemies.forEach(e => {
            if (Math.hypot(e.x - target.x, e.y - target.y) <= 90) {
              e.takeDamage(this.atk * 3.2);
            }
          });
          if (window.soundMgr) window.soundMgr.playDaggerSlash();
        }
      }
    }

    // 기본 공격 AI
    if (this.atkTimer <= 0 && aliveEnemies.length > 0) {
      let nearest = null;
      let minD = 220;
      aliveEnemies.forEach(e => {
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < minD) {
          minD = d;
          nearest = e;
        }
      });
      if (nearest) {
        this.atkTimer = 1.2;
        nearest.takeDamage(this.atk);
        if (window.effectMgr) {
          window.effectMgr.spawnSlashArc(this.x, this.y, Math.atan2(nearest.y - this.y, nearest.x - this.x), 36, this.color);
          window.effectMgr.addFloatingText(nearest.x, nearest.y - 15, `${this.atk}`, 'normal');
        }
      }
    }
  }

  render(ctx, camera) {
    if (!this.isAlive) return;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.radius * 0.7, this.radius * 0.8, this.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, sx, sy);

    const mName = `${this.name} (${this.role})`;
    ctx.font = 'bold 11px "Rajdhani", sans-serif';
    const mW = ctx.measureText(mName).width;
    ctx.fillStyle = 'rgba(10, 5, 20, 0.85)';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(sx - mW/2 - 5, sy - this.radius - 23, mW + 10, 15, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mName, sx, sy - this.radius - 15);

    const barW = 36;
    const barH = 4;
    ctx.fillStyle = '#110a18';
    ctx.fillRect(sx - barW / 2, sy - this.radius - 6, barW, barH);
    ctx.fillStyle = '#00ffaa';
    ctx.fillRect(sx - barW / 2, sy - this.radius - 6, barW * Math.max(0, this.hp / this.maxHp), barH);

    ctx.restore();
  }
}

window.Player = Player;
window.Mercenary = Mercenary;
