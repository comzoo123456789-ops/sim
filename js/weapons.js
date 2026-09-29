// Office Escape Survivor - High Quality Weapon & Projectile Physics Engine

class WeaponManager {
  constructor() {
    this.projectiles = [];
    this.puddles = [];
    this.orbitals = [];
    this.stampStrikes = [];
    this.timers = {};
  }

  reset() {
    this.projectiles = [];
    this.puddles = [];
    this.orbitals = [];
    this.stampStrikes = [];
    this.timers = {};
  }

  // 투사체 생성 (칼퇴 스톱워치 패시브의 탄속 보너스 적용)
  addProjectile(player, p) {
    const spdMul = player.stats.projectileSpeed || 1.0;
    p.vx *= spdMul;
    p.vy *= spdMul;
    this.projectiles.push(p);
  }

  // 치명타 판정 (모든 무기 공통: 확률 critRate, 배율 1.8 x critDmgMul)
  rollCrit(baseDmg, player) {
    const isCrit = Math.random() < player.stats.critRate;
    const dmg = isCrit ? Math.floor(baseDmg * 1.8 * (player.stats.critDmgMul || 1.0)) : baseDmg;
    return { dmg, isCrit };
  }

  // 결재 반려 도장 낙하 예약 (게임 시간 기준 지연 → 일시정지/재시작에 안전)
  queueStampStrike(x, y, radius, damage, delay, isSuper = false) {
    this.stampStrikes.push({ x, y, radius, damage, delay, progress: 0, hasHit: false, isSuper });
  }

  getWeaponStats(wId, level) {
    const wDef = window.GAME_DATA.WEAPONS[wId];
    if (!wDef) return null;

    const stats = {
      baseDmg: wDef.baseDmg || 10,
      cooldown: wDef.cooldown || 1.0,
      projectiles: wDef.projectiles || 1,
      speed: wDef.speed || 8,
      pierce: wDef.pierce || 1,
      area: wDef.area || 60,
      duration: wDef.duration || 2.5,
      spread: wDef.spread || 0.5,
      count: wDef.count || 2,
      orbitRadius: wDef.orbitRadius || 65,
      orbitSpeed: wDef.orbitSpeed || 3.2,
      strikes: wDef.strikes || 1
    };

    const targetLv = Math.min(level, wDef.levels.length);
    for (let i = 0; i < targetLv; i++) {
      const lvData = wDef.levels[i];
      if (lvData.dmg !== undefined) stats.baseDmg = lvData.dmg;
      if (lvData.cooldown !== undefined) stats.cooldown = lvData.cooldown;
      if (lvData.projectiles !== undefined) stats.projectiles = lvData.projectiles;
      if (lvData.speed !== undefined) stats.speed = lvData.speed;
      if (lvData.pierce !== undefined) stats.pierce = lvData.pierce;
      if (lvData.area !== undefined) stats.area = lvData.area;
      if (lvData.duration !== undefined) stats.duration = lvData.duration;
      if (lvData.spread !== undefined) stats.spread = lvData.spread;
      if (lvData.count !== undefined) stats.count = lvData.count;
      if (lvData.orbitRadius !== undefined) stats.orbitRadius = lvData.orbitRadius;
      if (lvData.orbitSpeed !== undefined) stats.orbitSpeed = lvData.orbitSpeed;
      if (lvData.strikes !== undefined) stats.strikes = lvData.strikes;
    }

    return stats;
  }

  syncOrbitals(player) {
    const hasSuperCard = player.superWeapons.includes('super_card');
    const cardLv = player.weapons['card'] || 0;

    if (!hasSuperCard && cardLv === 0) {
      if (this.orbitals.length > 0) this.orbitals = [];
      return;
    }

    let targetCount = 2;
    let targetRadius = 65;
    let targetSpeed = 3.2;
    let targetDmg = 16;
    let isSuper = false;

    if (hasSuperCard) {
      const sDef = window.GAME_DATA.SUPER_WEAPONS.super_card;
      targetCount = sDef.count || 8;
      targetRadius = (sDef.orbitRadius || 95) * player.stats.areaMul;
      targetSpeed = sDef.orbitSpeed || 7.5;
      targetDmg = Math.floor(sDef.baseDmg * player.stats.atkMul);
      isSuper = true;
    } else if (cardLv > 0) {
      const stats = this.getWeaponStats('card', cardLv);
      targetCount = stats.count;
      targetRadius = stats.orbitRadius * player.stats.areaMul;
      targetSpeed = stats.orbitSpeed;
      targetDmg = Math.floor(stats.baseDmg * player.stats.atkMul);
    }

    // 카드 개수 또는 슈퍼 모드가 변경되었을 때만 재배치 (각도 재분배)
    if (this.orbitals.length !== targetCount || (this.orbitals[0] && this.orbitals[0].isSuper !== isSuper)) {
      this.orbitals = [];
      for (let i = 0; i < targetCount; i++) {
        this.orbitals.push({
          angle: (i / targetCount) * Math.PI * 2,
          orbitRadius: targetRadius,
          speed: targetSpeed,
          damage: targetDmg,
          radius: isSuper ? 16 : 12,
          isSuper: isSuper,
          x: player.x,
          y: player.y,
          hitTimer: 0
        });
      }
    } else {
      // 개수가 동일할 때는 회전 위치를 보존하며 스탯만 부드럽게 갱신
      this.orbitals.forEach(orb => {
        orb.orbitRadius = targetRadius;
        orb.speed = targetSpeed;
        orb.damage = targetDmg;
      });
    }
  }

  update(dt, player, monsters, effectEngine) {
    // 0. 법인카드 쉴드 오비탈 상시 동기화
    this.syncOrbitals(player);

    // 1. 플레이어가 보유한 각 무기의 쿨타임 및 자동 발사
    Object.entries(player.weapons).forEach(([wId, level]) => {
      if (player.superWeapons.includes(`super_${wId}`)) return;
      if (wId === 'card') return; // 카드는 syncOrbitals로 상시 회전

      const stats = this.getWeaponStats(wId, level);
      if (!stats) return;

      this.timers[wId] = (this.timers[wId] || 0) + dt;
      const actualCd = stats.cooldown * (1 - player.stats.cdReduc);

      if (this.timers[wId] >= actualCd) {
        this.timers[wId] = 0;
        this.fireWeapon(wId, level, player, monsters, effectEngine);
      }
    });

    // 2. 초월 무기 (Super Weapons) 자동 발사
    player.superWeapons.forEach(sId => {
      if (sId === 'super_card') return; // 슈퍼 카드는 syncOrbitals로 상시 회전
      const sDef = window.GAME_DATA.SUPER_WEAPONS[sId];
      if (!sDef) return;

      this.timers[sId] = (this.timers[sId] || 0) + dt;
      const actualCd = (sDef.cooldown || 0.5) * (1 - player.stats.cdReduc);

      if (this.timers[sId] >= actualCd) {
        this.timers[sId] = 0;
        this.fireSuperWeapon(sId, player, monsters, effectEngine);
      }
    });

    // 3. 투사체 물리 이동 & 몬스터 충돌 검사
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.life -= dt;
      p.rot += dt * (p.rotSpeed || 10);

      // 폭탄 텀블러 지점 도달 시 폭발
      if (p.isBomb) {
        p.bombDist -= Math.hypot(p.vx * dt * 60, p.vy * dt * 60);
        if (p.bombDist <= 0 || p.life <= 0) {
          if (window.soundEngine) window.soundEngine.playDrink();
          if (effectEngine) {
            effectEngine.spawnShockwave(p.x, p.y, p.area, p.isSuper ? '#ea580c' : '#c2410c');
            effectEngine.spawnExplosion(p.x, p.y, p.area * 1.1, 0.4);
            effectEngine.spawnDecal(p.x, p.y, p.area * 1.3, '#78350f', null, 4);
            effectEngine.screenShake(5, 0.2);
          }
          monsters.forEach(m => {
            if (!m.isAlive) return;
            if (Math.hypot(m.x - p.x, m.y - p.y) <= p.area) {
              const hit = this.rollCrit(p.damage, player);
              m.takeDamage(hit.dmg, hit.isCrit);
            }
          });
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // 몬스터 피격 판정
      monsters.forEach(m => {
        if (!m.isAlive || p.hitMonsters.includes(m.id)) return;
        const dist = Math.hypot(m.x - p.x, m.y - p.y);
        if (dist <= m.radius + p.radius) {
          p.hitMonsters.push(m.id);
          const hit = this.rollCrit(p.damage, player);
          m.takeDamage(hit.dmg, hit.isCrit);

          if (effectEngine) {
            effectEngine.spawnHitSpark(p.x, p.y, p.color || '#fff');
          }

          p.pierce--;
        }
      });

      // 오피스 가구/기기 파괴 오브젝트 피격 판정
      if (window.game && window.game.propMgr) {
        window.game.propMgr.props.forEach(pr => {
          if (!pr.isAlive || p.hitMonsters.includes(`prop_${pr.x}_${pr.y}`)) return;
          const dist = Math.hypot(pr.x - p.x, pr.y - p.y);
          if (dist <= pr.radius + p.radius) {
            p.hitMonsters.push(`prop_${pr.x}_${pr.y}`);
            pr.takeDamage(p.damage);
            if (effectEngine) {
              effectEngine.spawnHitSpark(p.x, p.y, p.color || '#fff');
            }
            p.pierce--;
          }
        });
      }

      if (p.life <= 0 || p.pierce <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 4. 장판(핫식스) 틱 데미지 업데이트
    for (let i = this.puddles.length - 1; i >= 0; i--) {
      const pud = this.puddles[i];
      pud.duration -= dt;
      pud.tickTimer = (pud.tickTimer || 0) + dt;

      if (pud.tickTimer >= 0.25) {
        pud.tickTimer = 0;
        monsters.forEach(m => {
          if (!m.isAlive) return;
          if (Math.hypot(m.x - pud.x, m.y - pud.y) <= pud.radius) {
            m.takeDamage(pud.damage, false);
          }
        });

        if (window.game && window.game.propMgr) {
          window.game.propMgr.props.forEach(pr => {
            if (!pr.isAlive) return;
            if (Math.hypot(pr.x - pud.x, pr.y - pud.y) <= pud.radius + pr.radius) {
              pr.takeDamage(pud.damage * 0.7);
            }
          });
        }
      }

      if (pud.duration <= 0) {
        this.puddles.splice(i, 1);
      }
    }

    // 5. 법인카드 쉴드 회전 업데이트
    this.orbitals.forEach(orb => {
      if (orb.hitTimer > 0) orb.hitTimer -= dt;

      orb.angle += orb.speed * dt;
      orb.x = player.x + Math.cos(orb.angle) * orb.orbitRadius;
      orb.y = player.y + Math.sin(orb.angle) * orb.orbitRadius;

      monsters.forEach(m => {
        if (!m.isAlive) return;
        if (Math.hypot(m.x - orb.x, m.y - orb.y) <= m.radius + orb.radius) {
          if (orb.hitTimer <= 0) {
            orb.hitTimer = 0.18;
            const hit = this.rollCrit(orb.damage, player);
            m.takeDamage(hit.dmg, hit.isCrit);
            m.x += Math.cos(orb.angle) * 15;
            m.y += Math.sin(orb.angle) * 15;
            if (window.soundEngine) window.soundEngine.playCard();
            if (effectEngine) effectEngine.spawnHitSpark(orb.x, orb.y, orb.isSuper ? '#ffd700' : '#38bdf8');
          }
        }
      });

      if (window.game && window.game.propMgr) {
        window.game.propMgr.props.forEach(pr => {
          if (!pr.isAlive) return;
          if (Math.hypot(pr.x - orb.x, pr.y - orb.y) <= pr.radius + orb.radius) {
            pr.takeDamage(orb.damage * 0.5);
          }
        });
      }
    });

    // 6. 결재 반려 도장 낙하 연출 업데이트
    for (let i = this.stampStrikes.length - 1; i >= 0; i--) {
      const st = this.stampStrikes[i];
      if (st.delay > 0) {
        st.delay -= dt;
        continue;
      }
      st.progress += dt * 3.5;

      if (st.progress >= 1.0 && !st.hasHit) {
        st.hasHit = true;
        if (window.soundEngine) window.soundEngine.playStamp();
        if (effectEngine) {
          effectEngine.spawnShockwave(st.x, st.y, st.radius, '#ff2255');
          effectEngine.spawnFlash(st.x, st.y, 'fx_burst', '#ff2255', st.radius * 1.6, 0.25);
          effectEngine.spawnDecal(st.x, st.y, st.radius * 1.1, '#dc2626', null, 3);
          effectEngine.screenShake(6, 0.2);
        }
        monsters.forEach(m => {
          if (!m.isAlive) return;
          if (Math.hypot(m.x - st.x, m.y - st.y) <= st.radius) {
            const hit = this.rollCrit(st.damage, player);
            m.takeDamage(hit.dmg, hit.isCrit);
          }
        });

        if (window.game && window.game.propMgr) {
          window.game.propMgr.props.forEach(pr => {
            if (!pr.isAlive) return;
            if (Math.hypot(pr.x - st.x, pr.y - st.y) <= st.radius + pr.radius) {
              pr.takeDamage(st.damage);
            }
          });
        }
      }

      if (st.progress >= 1.8) {
        this.stampStrikes.splice(i, 1);
      }
    }
  }

  // 가장 가까운 적 탐색
  getNearestMonster(player, monsters) {
    let nearest = null;
    let minD = 9999;
    monsters.forEach(m => {
      if (!m.isAlive) return;
      const d = Math.hypot(m.x - player.x, m.y - player.y);
      if (d < minD) {
        minD = d;
        nearest = m;
      }
    });
    return nearest;
  }

  // 기본 무기 발사 로직
  fireWeapon(wId, level, player, monsters, effectEngine) {
    const wDef = window.GAME_DATA.WEAPONS[wId];
    const stats = this.getWeaponStats(wId, level);
    if (!stats || !wDef) return;

    const baseDmg = Math.floor(stats.baseDmg * player.stats.atkMul);
    const nearest = this.getNearestMonster(player, monsters);

    let targetAngle = 0;
    if (nearest) {
      targetAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    } else {
      targetAngle = player.facing === 'left' ? Math.PI : 0;
    }

    if (wId === 'stapler') {
      // 📎 스테이플러 (전방 날카로운 침 연사)
      if (window.soundEngine) window.soundEngine.playStapler();
      if (effectEngine) effectEngine.spawnFlash(player.x + Math.cos(targetAngle) * 16, player.y - 12 + Math.sin(targetAngle) * 16, 'fx_muzzle', '#7dd3fc', 30, 0.1, { rot: targetAngle + Math.PI / 2, grow: 0 });
      const count = stats.projectiles;
      const pierce = stats.pierce;

      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.12;
        const ang = targetAngle + spread;
        this.addProjectile(player, {
          type: 'staple',
          x: player.x,
          y: player.y - 12,
          vx: Math.cos(ang) * stats.speed,
          vy: Math.sin(ang) * stats.speed,
          damage: baseDmg,
          pierce: pierce,
          radius: 8,
          life: 2.0,
          color: wDef.color,
          rot: ang,
          hitMonsters: []
        });
      }
    } else if (wId === 'keyboard') {
      // ⌨️ 기계식 키보드 (키캡 산탄 폭발)
      if (window.soundEngine) window.soundEngine.playKeyboard();
      const count = stats.projectiles;
      const spread = stats.spread;

      for (let i = 0; i < count; i++) {
        const ang = targetAngle + (Math.random() - 0.5) * spread;
        const spd = stats.speed * (0.85 + Math.random() * 0.3);
        const keys = ['ESC', 'ENTER', 'CTRL', 'TAB', 'F5', 'DEL'];
        this.addProjectile(player, {
          type: 'keycap',
          label: keys[i % keys.length],
          x: player.x,
          y: player.y - 14,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          damage: baseDmg,
          pierce: 1,
          radius: 10,
          life: 1.1,
          color: wDef.color,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 15,
          hitMonsters: []
        });
      }
    } else if (wId === 'drink') {
      // 🥤 핫식스 에너지캔 (바닥 탄산 장판 투척)
      if (window.soundEngine) window.soundEngine.playDrink();
      const count = stats.projectiles;
      const area = stats.area * player.stats.areaMul;
      const duration = stats.duration * (player.stats.projectileSpeed || 1.0);

      for (let i = 0; i < count; i++) {
        const tx = nearest ? nearest.x + (Math.random() * 80 - 40) : player.x + Math.cos(targetAngle) * 140;
        const ty = nearest ? nearest.y + (Math.random() * 80 - 40) : player.y + Math.sin(targetAngle) * 140;
        this.puddles.push({
          x: tx,
          y: ty,
          radius: area,
          duration: duration,
          damage: baseDmg,
          color: wDef.color,
          tickTimer: 0
        });
      }
    } else if (wId === 'stamp') {
      // 🛑 결재 반려 도장 (머리 위 수직 강타)
      const count = stats.strikes;
      const area = stats.area * player.stats.areaMul;

      for (let i = 0; i < count; i++) {
        const target = monsters[Math.floor(Math.random() * monsters.length)] || nearest;
        const tx = target ? target.x : player.x + (Math.random() * 200 - 100);
        const ty = target ? target.y : player.y + (Math.random() * 200 - 100);

        this.queueStampStrike(tx, ty, area, baseDmg, i * 0.18);
      }
    } else if (wId === 'shredder') {
      // 📑 문서 세단기 톱니 (나선형 회전 관통)
      if (window.soundEngine) window.soundEngine.playShredder();
      const count = stats.projectiles;

      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        this.addProjectile(player, {
          type: 'shredder_blade',
          x: player.x,
          y: player.y - 10,
          vx: Math.cos(ang) * stats.speed,
          vy: Math.sin(ang) * stats.speed,
          damage: baseDmg,
          pierce: 999,
          radius: 14,
          life: 2.5,
          color: wDef.color,
          rot: 0,
          rotSpeed: 20,
          hitMonsters: []
        });
      }
    } else if (wId === 'laser') {
      // 🔦 PT 레이저 포인터 (고출력 관통 그린 빔)
      if (window.soundEngine) window.soundEngine.playTone(880, 'sawtooth', 0.12, 0.2, 0.02);
      const count = stats.projectiles;

      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.18;
        const ang = targetAngle + spread;
        this.addProjectile(player, {
          type: 'laser_beam',
          x: player.x,
          y: player.y - 12,
          vx: Math.cos(ang) * stats.speed,
          vy: Math.sin(ang) * stats.speed,
          damage: baseDmg,
          pierce: 999,
          radius: 12,
          life: 1.2,
          color: wDef.color,
          rot: ang,
          hitMonsters: []
        });
      }
    } else if (wId === 'coffee_bomb') {
      // ☕ 갓 내린 텀블러 (스플래시 폭발 투척)
      if (window.soundEngine) window.soundEngine.playDrink();
      const count = stats.projectiles;
      const area = stats.area * player.stats.areaMul;

      for (let i = 0; i < count; i++) {
        const dist = 120 + Math.random() * 80;
        const ang = targetAngle + (Math.random() - 0.5) * 0.4;
        this.addProjectile(player, {
          type: 'coffee_tumbler',
          x: player.x,
          y: player.y - 10,
          vx: Math.cos(ang) * 6.5,
          vy: Math.sin(ang) * 6.5,
          damage: baseDmg,
          area: area,
          isBomb: true,
          bombDist: dist,
          pierce: 999,
          radius: 10,
          life: 2.0,
          color: wDef.color,
          rot: 0,
          rotSpeed: 12,
          hitMonsters: []
        });
      }
    }
  }

  // 🔥 초월 진화 무기 발사 로직
  fireSuperWeapon(sId, player, monsters, effectEngine) {
    const sDef = window.GAME_DATA.SUPER_WEAPONS[sId];
    if (!sDef) return;
    const baseDmg = Math.floor(sDef.baseDmg * player.stats.atkMul);
    const nearest = this.getNearestMonster(player, monsters);

    if (sId === 'super_stapler') {
      // ⚡ [고속 자동 제본건] 360도 전방위 16연사 관통 침 폭풍
      if (window.soundEngine) window.soundEngine.playStapler();
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
        this.addProjectile(player, {
          type: 'super_staple',
          x: player.x,
          y: player.y - 12,
          vx: Math.cos(ang) * 12,
          vy: Math.sin(ang) * 12,
          damage: baseDmg,
          pierce: 5,
          radius: 10,
          life: 2.0,
          color: '#00f0ff',
          rot: ang,
          hitMonsters: []
        });
      }
    } else if (sId === 'super_drink') {
      // 🌊 [치명적 카페인 해일]
      if (window.soundEngine) window.soundEngine.playDrink();
      this.puddles.push({
        x: player.x,
        y: player.y,
        radius: 240 * player.stats.areaMul,
        duration: 4.0 * (player.stats.projectileSpeed || 1.0),
        damage: baseDmg,
        color: '#ff8800',
        tickTimer: 0
      });
      if (effectEngine) effectEngine.spawnShockwave(player.x, player.y, 240, '#ff8800');
    } else if (sId === 'super_keyboard') {
      // 💥 [분노의 2000타 광속 타자기]
      if (window.soundEngine) window.soundEngine.playKeyboard();
      for (let i = 0; i < 16; i++) {
        const ang = (player.facing === 'left' ? Math.PI : 0) + (Math.random() - 0.5) * 1.5;
        this.addProjectile(player, {
          type: 'super_keycap',
          label: 'CRIT!',
          x: player.x,
          y: player.y - 14,
          vx: Math.cos(ang) * (9 + Math.random() * 4),
          vy: Math.sin(ang) * (9 + Math.random() * 4),
          damage: baseDmg,
          pierce: 3,
          radius: 14,
          life: 1.4,
          color: '#00ffaa',
          rot: Math.random() * Math.PI * 2,
          rotSpeed: 25,
          hitMonsters: []
        });
      }
    } else if (sId === 'super_stamp') {
      // ☄️ [최종 승인 거부 스탬프]
      for (let i = 0; i < 6; i++) {
        const tx = player.x + (Math.random() * 400 - 200);
        const ty = player.y + (Math.random() * 400 - 200);
        this.queueStampStrike(tx, ty, 180 * player.stats.areaMul, baseDmg, i * 0.14, true);
      }
    } else if (sId === 'super_shredder') {
      // 🌀 [초고속 문서 분쇄 토네이도]
      if (window.soundEngine) window.soundEngine.playShredder();
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        this.addProjectile(player, {
          type: 'super_shredder_blade',
          x: player.x,
          y: player.y - 10,
          vx: Math.cos(ang) * 7.5,
          vy: Math.sin(ang) * 7.5,
          damage: baseDmg,
          pierce: 999,
          radius: 18,
          life: 3.2,
          color: '#bb33ff',
          rot: 0,
          rotSpeed: 30,
          hitMonsters: []
        });
      }
    } else if (sId === 'super_laser') {
      // 🌟 [PT 결재 올패스 홀로그램 빔] 360도 4방향 회전 무한 관통 홀로그램
      if (window.soundEngine) window.soundEngine.playTone(1100, 'sawtooth', 0.15, 0.25, 0.02);
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        this.addProjectile(player, {
          type: 'super_laser_beam',
          x: player.x,
          y: player.y - 12,
          vx: Math.cos(ang) * 18,
          vy: Math.sin(ang) * 18,
          damage: baseDmg,
          pierce: 999,
          radius: 16,
          life: 1.5,
          color: '#00ffaa',
          rot: ang,
          hitMonsters: []
        });
      }
    } else if (sId === 'super_coffee') {
      // 🌋 [화산 폭발 에스프레소 캐논] 4중 거대 에스프레소 마그마 폭발
      if (window.soundEngine) window.soundEngine.playDrink();
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        this.addProjectile(player, {
          type: 'super_coffee_tumbler',
          x: player.x,
          y: player.y - 10,
          vx: Math.cos(ang) * 8.0,
          vy: Math.sin(ang) * 8.0,
          damage: baseDmg,
          area: 200 * player.stats.areaMul,
          isBomb: true,
          isSuper: true,
          bombDist: 180,
          pierce: 999,
          radius: 14,
          life: 2.2,
          color: '#ea580c',
          rot: 0,
          rotSpeed: 18,
          hitMonsters: []
        });
      }
    }
  }

  // 무기 & 투사체 & 장판 & 쉴드 렌더링 (순수 캔버스 2D 벡터 아트 - No Emojis!)
  render(ctx, camera) {
    // 1. 핫식스 탄산 웅덩이 장판 렌더링
    this.puddles.forEach(pud => {
      const sx = pud.x - camera.x;
      const sy = pud.y - camera.y;

      ctx.save();
      ctx.translate(sx, sy);

      if (pud.splat === undefined) {
        pud.splat = 'splat' + Math.floor(Math.random() * 8);
        pud.rot = Math.random() * Math.PI * 2;
      }
      const fade = Math.min(1, pud.duration / 0.4);
      const drewSplat = window.assets && window.assets.draw(ctx, pud.splat, 0, 0, pud.radius * 2.3, pud.radius * 2.3, { color: pud.color, alpha: 0.32 * fade, rot: pud.rot });
      if (drewSplat) {
        window.assets.draw(ctx, 'fx_glow', 0, 0, pud.radius * 2.2, pud.radius * 2.2, { color: pud.color, alpha: 0.18 * fade, blend: 'lighter' });
      } else {
        ctx.fillStyle = pud.color + '44';
        ctx.beginPath();
        ctx.arc(0, 0, pud.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = pud.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = pud.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
      }

      for (let b = 0; b < 5; b++) {
        const ba = (b / 5) * Math.PI * 2 + Math.sin(performance.now() * 0.003 + b);
        const br = pud.radius * 0.5 + Math.cos(performance.now() * 0.004 + b) * (pud.radius * 0.3);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.cos(ba) * br, Math.sin(ba) * br, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 2. 투사체(스테이플러 침, 키캡, 톱니, 레이저, 텀블러 등) 렌더링
    this.projectiles.forEach(p => {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(p.rot || 0);

      if (p.type === 'staple' || p.type === 'super_staple') {
        const isSuper = (p.type === 'super_staple');
        ctx.fillStyle = isSuper ? '#00f0ff' : '#93c5fd';
        ctx.shadowColor = isSuper ? '#00f0ff' : '#60a5fa';
        ctx.shadowBlur = isSuper ? 12 : 6;

        ctx.fillRect(-8, -2, 16, 4);
        ctx.fillRect(-8, -2, 4, 8);
        ctx.fillRect(4, -2, 4, 8);
      } else if (p.type === 'keycap' || p.type === 'super_keycap') {
        const isSuper = (p.type === 'super_keycap');
        ctx.fillStyle = isSuper ? '#10b981' : '#0f172a';
        ctx.strokeStyle = isSuper ? '#00ffaa' : '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = isSuper ? '#00ffaa' : '#00f0ff';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.roundRect(-10, -10, 20, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label || 'K', 0, 0);
      } else if (p.type === 'shredder_blade' || p.type === 'super_shredder_blade') {
        const isSuper = (p.type === 'super_shredder_blade');
        if (window.assets) window.assets.draw(ctx, 'fx_twirl', 0, 0, p.radius * 3.4, p.radius * 3.4, { color: isSuper ? '#a855f7' : '#38bdf8', alpha: 0.8, blend: 'lighter' });
        ctx.fillStyle = isSuper ? '#a855f7' : '#94a3b8';
        ctx.strokeStyle = isSuper ? '#d8b4fe' : '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = isSuper ? '#a855f7' : '#38bdf8';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = (i % 2 === 0) ? p.radius : p.radius * 0.55;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (p.type === 'laser_beam' || p.type === 'super_laser_beam') {
        const isSuper = (p.type === 'super_laser_beam');
        if (window.assets) window.assets.draw(ctx, 'fx_trace', -6, 0, isSuper ? 40 : 28, isSuper ? 130 : 96, { color: isSuper ? '#00ffaa' : '#34d399', rot: Math.PI / 2, blend: 'lighter' });
        ctx.fillStyle = isSuper ? '#ffffff' : '#a7f3d0';
        ctx.strokeStyle = isSuper ? '#00ffaa' : '#10b981';
        ctx.lineWidth = isSuper ? 6 : 3.5;
        ctx.shadowColor = isSuper ? '#00ffaa' : '#34d399';
        ctx.shadowBlur = isSuper ? 16 : 10;

        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(18, 0, isSuper ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'coffee_tumbler' || p.type === 'super_coffee_tumbler') {
        const isSuper = (p.type === 'super_coffee_tumbler');
        if (window.assets && window.assets.get('item_tumbler')) {
          window.assets.draw(ctx, 'fx_glow', 0, 0, 48, 48, { color: isSuper ? '#ea580c' : '#f97316', alpha: 0.6, blend: 'lighter' });
          window.assets.draw(ctx, 'item_tumbler', 0, 0, isSuper ? 34 : 26, isSuper ? 34 : 26);
          ctx.restore();
          return;
        }
        ctx.fillStyle = isSuper ? '#7c2d12' : '#451a03';
        ctx.strokeStyle = isSuper ? '#ea580c' : '#fb923c';
        ctx.lineWidth = 2;
        ctx.shadowColor = isSuper ? '#ea580c' : '#f97316';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.roundRect(-7, -12, 14, 24, 3);
        ctx.fill();
        ctx.stroke();

        // 텀블러 리드 뚜껑
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-8, -15, 16, 4);
      }

      ctx.restore();
    });

    // 3. 법인카드 쉴드 렌더링
    this.orbitals.forEach(orb => {
      const sx = orb.x - camera.x;
      const sy = orb.y - camera.y;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(orb.angle + Math.PI / 2);

      ctx.fillStyle = orb.isSuper ? '#090d16' : '#1e293b';
      ctx.strokeStyle = orb.isSuper ? '#ffd700' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = orb.isSuper ? '#ffd700' : '#38bdf8';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.roundRect(-14, -8, 28, 16, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-10, -4, 6, 5);

      ctx.restore();
    });

    // 4. 결재 반려 도장 렌더링
    this.stampStrikes.forEach(st => {
      if (st.delay > 0) return;
      const sx = st.x - camera.x;
      const sy = st.y - camera.y;

      ctx.save();
      if (st.progress < 1.0) {
        const scale = 3.0 - st.progress * 2.0;
        const dropY = sy - (1.0 - st.progress) * 250;

        ctx.translate(sx, dropY);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#451a03';
        ctx.fillRect(-6, -26, 12, 22);

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(-16, -4, 32, 10, 3);
        ctx.fill();
      } else {
        const alpha = Math.max(0, 1 - (st.progress - 1.0) * 1.25);
        ctx.translate(sx, sy);
        ctx.globalAlpha = alpha;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
        ctx.strokeRect(-24, -12, 48, 24);

        ctx.fillStyle = '#ef4444';
        ctx.font = '900 13px "Pretendard", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.isSuper ? '최종 반려' : 'REJECT', 0, 0);
      }
      ctx.restore();
    });
  }
}

window.WeaponManager = WeaponManager;
