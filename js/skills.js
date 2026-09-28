// Skill Execution & Passive/Buff System

class SkillSystem {
  // 스킬 시전 가능 여부 검사
  static canCast(player, skillSlot) {
    const jobData = CLASSES[player.job];
    if (!jobData) return { ok: false, reason: '직업 정보 없음' };

    const skill = jobData.skills.find(s => s.slot === skillSlot);
    if (!skill) return { ok: false, reason: '등록된 스킬이 없습니다.' };

    if (player.level < skill.unlockLevel) {
      return { ok: false, reason: `Lv.${skill.unlockLevel}에 해금되는 스킬입니다. (현재 Lv.${player.level})` };
    }

    const currentCd = player.skillCooldowns[skill.id] || 0;
    if (currentCd > 0) {
      return { ok: false, reason: `쿨타임 중입니다. (${currentCd.toFixed(1)}초)` };
    }

    if (player.mp < skill.cost) {
      return { ok: false, reason: `마나가 부족합니다. (필요 MP: ${skill.cost})` };
    }

    return { ok: true, skill };
  }

  // 스킬 시전 실행
  static castSkill(player, skillSlot, targetX, targetY, enemies) {
    const check = this.canCast(player, skillSlot);
    if (!check.ok) {
      if (window.effectMgr) {
        window.effectMgr.addFloatingText(player.x, player.y - 20, check.reason, 'player_hit');
      }
      return false;
    }

    const skill = check.skill;
    player.mp -= skill.cost;

    // 패시브 쿨타임 감소 계산
    let cdMultiplier = 1.0;
    if (player.statCache && player.statCache.cdReduc) {
      cdMultiplier -= player.statCache.cdReduc;
    }
    player.skillCooldowns[skill.id] = skill.cd * Math.max(0.5, cdMultiplier);

    // 3번: 스킬 원소 룬(Elemental Rune) 변환 적용
    const rune = (player.skillRunes && player.skillRunes[skill.id]) || 'none';
    let baseDmg = player.statCache.atk * skill.dmgRatio;
    if (rune === 'fire') {
      baseDmg *= 1.25; // 화염 룬 피해 +25%
    }

    // 직업별 스킬 타입별 실제 이펙트 및 판정 실행
    switch (skill.type) {
      // --- 전사 스킬 ---
      case 'slash_wave': { // 1. 질풍 베기
        const angle = Math.atan2(targetY - player.y, targetX - player.x);
        player.x += Math.cos(angle) * 35;
        player.y += Math.sin(angle) * 35;
        window.effectMgr.screenShake(5.5, 0.15);
        window.effectMgr.spawnSlashArc(player.x, player.y, angle, 55, '#ffaa33');
        this.hitEnemiesInArc(player, enemies, angle, 65, Math.PI * 0.7, baseDmg);
        break;
      }
      case 'earth_shatter': { // 2. 대지 분쇄
        const angle = Math.atan2(targetY - player.y, targetX - player.x);
        window.effectMgr.screenShake(8.5, 0.35);
        window.effectMgr.spawnEarthShatter(player.x, player.y, angle, baseDmg);
        this.hitEnemiesInArc(player, enemies, angle, 110, Math.PI * 0.5, baseDmg, { stun: 1.2 });
        break;
      }
      case 'crescent_blade': { // 3. 진공 검기
        window.effectMgr.screenShake(5.0, 0.15);
        window.effectMgr.spawnCrescentBlade(player.x, player.y, targetX, targetY, baseDmg);
        break;
      }
      case 'blade_cyclone': { // 4. 회오리 참격
        window.effectMgr.screenShake(7.5, 0.35);
        window.effectMgr.addShockwave(player.x, player.y, 90, '#ffd700');
        window.effectMgr.spawnSparks(player.x, player.y, 25, '#ffcc00');
        this.hitEnemiesInRadius(player, enemies, 90, baseDmg);
        if (window.soundMgr) window.soundMgr.playSwordWave();
        break;
      }
      case 'judgment_blade': { // 5. 심연 단죄
        const angle = Math.atan2(targetY - player.y, targetX - player.x);
        window.effectMgr.screenShake(12.0, 0.5);
        window.effectMgr.spawnSlashArc(player.x, player.y, angle, 120, '#ffff55');
        window.effectMgr.addShockwave(targetX, targetY, 70, '#ffffff');
        this.hitEnemiesInLine(player, enemies, angle, 220, 45, baseDmg * 1.3);
        if (window.soundMgr) window.soundMgr.playCritHit();
        break;
      }

      // --- 마법사 스킬 ---
      case 'fireball': { // 1. 화염구
        window.effectMgr.screenShake(5.0, 0.15);
        window.effectMgr.spawnFireball(player.x, player.y, targetX, targetY, baseDmg);
        break;
      }
      case 'frost_nova': { // 2. 서리 폭발
        window.effectMgr.screenShake(6.5, 0.25);
        window.effectMgr.spawnFrostNova(player.x, player.y, 95);
        this.hitEnemiesInRadius(player, enemies, 95, baseDmg, { slow: 2.0 });
        if (window.soundMgr) window.soundMgr.playMagicCast();
        break;
      }
      case 'chain_lightning': { // 3. 연쇄 번개
        window.effectMgr.screenShake(6.0, 0.2);
        this.castChainLightning(player, enemies, baseDmg);
        break;
      }
      case 'arcane_beam': { // 4. 비전 광선
        const angle = Math.atan2(targetY - player.y, targetX - player.x);
        window.effectMgr.screenShake(7.5, 0.35);
        window.effectMgr.spawnSlashArc(player.x, player.y, angle, 150, '#cc44ff');
        this.hitEnemiesInLine(player, enemies, angle, 200, 35, baseDmg);
        if (window.soundMgr) window.soundMgr.playMagicCast();
        break;
      }
      case 'meteor': { // 5. 메테오 스트라이크
        window.effectMgr.screenShake(14.0, 0.6);
        window.effectMgr.spawnMeteor(targetX, targetY, baseDmg);
        if (window.soundMgr) window.soundMgr.playFireball();
        break;
      }

      // --- 도적 스킬 ---
      case 'poison_cloud': { // 1. 독 연무
        window.effectMgr.screenShake(4.5, 0.15);
        window.effectMgr.spawnPoisonBomb(player.x, player.y, targetX, targetY, baseDmg);
        break;
      }
      case 'shadow_strike': { // 2. 그림자 습격
        const closest = this.findClosestEnemy(player, enemies, 180);
        window.effectMgr.screenShake(8.5, 0.25);
        if (closest) {
          player.x = closest.x - Math.cos(closest.angle || 0) * 25;
          player.y = closest.y - Math.sin(closest.angle || 0) * 25;
          window.effectMgr.addDashGhost(player.x, player.y, 20, '#9933ff');
          window.effectMgr.spawnSlashArc(player.x, player.y, Math.atan2(closest.y - player.y, closest.x - player.x), 45, '#aa00ff');
          closest.takeDamage(baseDmg, true);
          if (window.soundMgr) window.soundMgr.playCritHit();
        } else {
          const angle = Math.atan2(targetY - player.y, targetX - player.x);
          player.x += Math.cos(angle) * 50;
          player.y += Math.sin(angle) * 50;
          window.effectMgr.spawnSlashArc(player.x, player.y, angle, 45, '#aa00ff');
        }
        break;
      }
      case 'phantom_dance': { // 3. 환영 난무
        const angle = Math.atan2(targetY - player.y, targetX - player.x);
        window.effectMgr.screenShake(7.5, 0.3);
        for (let i = -2; i <= 2; i++) {
          setTimeout(() => {
            window.effectMgr.spawnSlashArc(player.x + (Math.random() * 20 - 10), player.y + (Math.random() * 20 - 10), angle + i * 0.2, 60, '#33ff88');
          }, Math.abs(i) * 60);
        }
        this.hitEnemiesInArc(player, enemies, angle, 85, Math.PI * 0.8, baseDmg);
        if (window.soundMgr) window.soundMgr.playDaggerSlash();
        break;
      }
      case 'poison_stars': { // 4. 맹독 표창 난사
        window.effectMgr.screenShake(5.5, 0.2);
        window.effectMgr.spawnPoisonStars(player.x, player.y, baseDmg);
        break;
      }
      case 'heart_stab': { // 5. 심장 적출
        const angle = Math.atan2(targetY - player.y, targetX - player.x);
        window.effectMgr.screenShake(10.5, 0.35);
        window.effectMgr.spawnSlashArc(player.x, player.y, angle, 60, '#ff0033');
        this.hitEnemiesInArc(player, enemies, angle, 75, Math.PI * 0.4, baseDmg * 1.5, { forceCrit: true });
        if (window.soundMgr) window.soundMgr.playCritHit();
        break;
      }

      // --- 격투가 스킬 ---
      case 'chi_blast': { // 1. 파동 장풍
        window.effectMgr.screenShake(6.0, 0.2);
        window.effectMgr.spawnChiBlast(player.x, player.y, targetX, targetY, baseDmg);
        break;
      }
      case 'rising_dragon': { // 2. 승룡권
        window.effectMgr.screenShake(8.0, 0.25);
        window.effectMgr.addShockwave(player.x, player.y, 60, '#ff6600');
        window.effectMgr.spawnSparks(player.x, player.y, 18, '#ff9900');
        this.hitEnemiesInRadius(player, enemies, 65, baseDmg, { knockback: 40 });
        if (window.soundMgr) window.soundMgr.playKnucklePunch();
        break;
      }
      case 'lion_roar': { // 3. 사자후
        window.effectMgr.screenShake(9.0, 0.35);
        window.effectMgr.spawnLionRoar(player.x, player.y, 90);
        this.hitEnemiesInRadius(player, enemies, 90, baseDmg, { stun: 1.5 });
        if (window.soundMgr) window.soundMgr.playChiBlast();
        break;
      }
      case 'hundred_fists': { // 4. 백열권
        const angle = Math.atan2(targetY - player.y, targetX - player.x);
        window.effectMgr.screenShake(8.5, 0.35);
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            const rx = player.x + Math.cos(angle) * (20 + i * 8) + (Math.random() * 16 - 8);
            const ry = player.y + Math.sin(angle) * (20 + i * 8) + (Math.random() * 16 - 8);
            window.effectMgr.addShockwave(rx, ry, 22, '#44aaff');
            window.effectMgr.spawnSparks(rx, ry, 5, '#ffffff');
          }, i * 50);
        }
        this.hitEnemiesInArc(player, enemies, angle, 80, Math.PI * 0.6, baseDmg);
        if (window.soundMgr) window.soundMgr.playKnucklePunch();
        break;
      }
      case 'ultimate_chi_cannon': { // 5. 진·패황단공포
        window.effectMgr.screenShake(13.0, 0.55);
        window.effectMgr.spawnChiBlast(player.x, player.y, targetX, targetY, baseDmg * 1.6);
        window.effectMgr.addShockwave(player.x, player.y, 80, '#00ffff');
        break;
      }
    }

    // 3번: 원소 룬 고유 추가 발동 (화상 DOT, 동결, 연쇄 번개, 공허 흡인)
    this.applySkillRuneProc(player, rune, targetX, targetY, enemies, baseDmg);

    return true;
  }

  // 3번: 스킬 원소 룬 효과 실행기
  static applySkillRuneProc(player, rune, targetX, targetY, enemies, dmg) {
    if (!rune || rune === 'none' || !enemies) return;

    if (rune === 'fire') {
      if (window.effectMgr) {
        window.effectMgr.addShockwave(targetX, targetY, 65, '#ff4400');
        window.effectMgr.spawnSparks(targetX, targetY, 20, '#ff6600');
        window.effectMgr.addFloatingText(targetX, targetY - 25, '🔥 화염 연소!', 'crit');
      }
      // 반경 130px 내 적들에게 화상 DOT 피해 (매초 ATK 35% 피해)
      enemies.forEach(en => {
        if (en.isAlive && Math.hypot(en.x - targetX, en.y - targetY) <= 130) {
          const burnDmg = Math.max(1, Math.floor(player.statCache.atk * 0.35));
          for (let step = 1; step <= 3; step++) {
            setTimeout(() => {
              if (en.isAlive) {
                en.takeDamage(burnDmg, false, true);
                if (window.effectMgr) {
                  window.effectMgr.spawnSparks(en.x, en.y, 4, '#ff3300');
                }
              }
            }, step * 600);
          }
        }
      });
      if (window.soundMgr) window.soundMgr.playFireball();
    } else if (rune === 'cold') {
      if (window.effectMgr) {
        window.effectMgr.spawnFrostNova(targetX, targetY, 80);
        window.effectMgr.addFloatingText(targetX, targetY - 25, '❄️ 극한의 동결!', 'heal');
      }
      enemies.forEach(en => {
        if (en.isAlive && Math.hypot(en.x - targetX, en.y - targetY) <= 130) {
          en.takeDamage(dmg * 0.3);
          if (Math.random() < 0.45) {
            en.applyStun(1.5);
            if (window.effectMgr) {
              window.effectMgr.addFloatingText(en.x, en.y - 20, '빙결!', 'heal');
            }
          }
        }
      });
      if (window.soundMgr) window.soundMgr.playMagicCast();
    } else if (rune === 'lightning') {
      if (window.effectMgr) {
        window.effectMgr.addShockwave(targetX, targetY, 70, '#ffd700');
        window.effectMgr.spawnSparks(targetX, targetY, 18, '#00f0ff');
        window.effectMgr.addFloatingText(targetX, targetY - 25, '⚡ 연쇄 감전!', 'crit');
      }
      this.castChainLightning(player, enemies, dmg * 0.75);
    } else if (rune === 'void') {
      if (window.effectMgr) {
        window.effectMgr.addShockwave(targetX, targetY, 90, '#a020f0');
        window.effectMgr.spawnSparks(targetX, targetY, 25, '#7928ca');
        window.effectMgr.addFloatingText(targetX, targetY - 25, '🔮 공허 인력 & 방어 -25%!', 'crit');
      }
      enemies.forEach(en => {
        if (en.isAlive && Math.hypot(en.x - targetX, en.y - targetY) <= 200) {
          // 중심부로 강하게 끌어당김
          en.x += (targetX - en.x) * 0.6;
          en.y += (targetY - en.y) * 0.6;
          en.def = Math.max(1, Math.floor(en.def * 0.75));
          en.takeDamage(dmg * 0.4);
        }
      });
      if (window.soundMgr) window.soundMgr.playChiBlast();
    }
  }

  // --- 타격 판정 헬퍼 메서드들 ---

  static hitEnemiesInRadius(player, enemies, radius, damage, options = {}) {
    if (!enemies) return;
    enemies.forEach(en => {
      if (!en.isAlive) return;
      const dist = Math.hypot(en.x - player.x, en.y - player.y);
      if (dist <= radius + (en.radius || 18)) {
        en.takeDamage(damage, options.forceCrit || false);
        if (options.stun) en.applyStun(options.stun);
        if (options.knockback) {
          const ang = Math.atan2(en.y - player.y, en.x - player.x);
          en.x += Math.cos(ang) * options.knockback;
          en.y += Math.sin(ang) * options.knockback;
        }
      }
    });
  }

  static hitEnemiesInArc(player, enemies, centerAngle, radius, arcAngle, damage, options = {}) {
    if (!enemies) return;
    enemies.forEach(en => {
      if (!en.isAlive) return;
      const dist = Math.hypot(en.x - player.x, en.y - player.y);
      if (dist <= radius + (en.radius || 18)) {
        let ang = Math.atan2(en.y - player.y, en.x - player.x) - centerAngle;
        while (ang < -Math.PI) ang += Math.PI * 2;
        while (ang > Math.PI) ang -= Math.PI * 2;
        if (Math.abs(ang) <= arcAngle / 2) {
          en.takeDamage(damage, options.forceCrit || false);
          if (options.stun) en.applyStun(options.stun);
        }
      }
    });
  }

  static hitEnemiesInLine(player, enemies, angle, length, thickness, damage) {
    if (!enemies) return;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    enemies.forEach(en => {
      if (!en.isAlive) return;
      const dx = en.x - player.x;
      const dy = en.y - player.y;
      const proj = dx * cos + dy * sin;
      if (proj >= 0 && proj <= length) {
        const perp = Math.abs(-dx * sin + dy * cos);
        if (perp <= thickness / 2 + (en.radius || 18)) {
          en.takeDamage(damage);
        }
      }
    });
  }

  static castChainLightning(player, enemies, damage) {
    if (!enemies || enemies.length === 0) return;
    const alive = enemies.filter(e => e.isAlive);
    if (alive.length === 0) return;

    // 가장 가까운 적 1타
    alive.sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
    const target1 = alive[0];
    if (Math.hypot(target1.x - player.x, target1.y - player.y) > 220) return;

    target1.takeDamage(damage);
    window.effectMgr.spawnSparks(target1.x, target1.y, 14, '#77ddff');

    // 2타, 3타 튀기
    let prev = target1;
    for (let i = 1; i < Math.min(4, alive.length); i++) {
      const next = alive[i];
      setTimeout(() => {
        if (next && next.isAlive) {
          next.takeDamage(damage * 0.8);
          window.effectMgr.spawnSparks(next.x, next.y, 12, '#88eeff');
        }
      }, i * 80);
      prev = next;
    }
    if (window.soundMgr) window.soundMgr.playMagicCast();
  }

  static findClosestEnemy(player, enemies, maxDist) {
    if (!enemies) return null;
    let closest = null;
    let minDist = maxDist;
    enemies.forEach(en => {
      if (!en.isAlive) return;
      const d = Math.hypot(en.x - player.x, en.y - player.y);
      if (d < minDist) {
        minDist = d;
        closest = en;
      }
    });
    return closest;
  }
}

window.SkillSystem = SkillSystem;
