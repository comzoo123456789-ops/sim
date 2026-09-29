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
      targetRadius = (sDef.orbitRadius || 90) * player.stats.areaMul;
      targetSpeed = sDef.orbitSpeed || 7.0;
      targetDmg = Math.floor(sDef.baseDmg * player.stats.atkMul);
      isSuper = true;
    } else if (cardLv > 0) {
      const wDef = window.GAME_DATA.WEAPONS.card;
      const curLv = wDef.levels[cardLv - 1] || wDef.levels[0];
      targetCount = curLv.count || wDef.count || 2;
      targetRadius = (curLv.orbitRadius || wDef.orbitRadius || 65) * player.stats.areaMul;
      targetSpeed = curLv.orbitSpeed || wDef.orbitSpeed || 3.2;
      targetDmg = Math.floor((curLv.dmg || wDef.baseDmg) * player.stats.atkMul);
    }

    if (this.orbitals.length !== targetCount || this.orbitals[0]?.isSuper !== isSuper) {
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

      const wDef = window.GAME_DATA.WEAPONS[wId];
      if (!wDef) return;

      this.timers[wId] = (this.timers[wId] || 0) + dt;
      const curLv = wDef.levels[level - 1] || wDef.levels[0];
      const actualCd = (curLv.cooldown || wDef.cooldown || 1.0) * (1 - player.stats.cdReduc);

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

      // 몬스터 피격 판정
      monsters.forEach(m => {
        if (!m.isAlive || p.hitMonsters.includes(m.id)) return;
        const dist = Math.hypot(m.x - p.x, m.y - p.y);
        if (dist <= m.radius + p.radius) {
          p.hitMonsters.push(m.id);
          const isCrit = Math.random() < player.stats.critRate;
          const dmg = isCrit ? Math.floor(p.damage * 1.8) : p.damage;
          m.takeDamage(dmg, isCrit);

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
            m.takeDamage(orb.damage, Math.random() < player.stats.critRate);
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
      st.progress += dt * 3.5;

      if (st.progress >= 1.0 && !st.hasHit) {
        st.hasHit = true;
        if (window.soundEngine) window.soundEngine.playStamp();
        if (effectEngine) {
          effectEngine.spawnShockwave(st.x, st.y, st.radius, '#ff2255');
          effectEngine.screenShake(6, 0.2);
        }
        monsters.forEach(m => {
          if (!m.isAlive) return;
          if (Math.hypot(m.x - st.x, m.y - st.y) <= st.radius) {
            m.takeDamage(st.damage, true);
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
    const curLv = wDef.levels[level - 1] || wDef.levels[0];
    const baseDmg = Math.floor((curLv.dmg || wDef.baseDmg) * player.stats.atkMul);
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
      const count = curLv.projectiles || wDef.projectiles || 1;
      const pierce = curLv.pierce || wDef.pierce || 1;

      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.12;
        const ang = targetAngle + spread;
        this.projectiles.push({
          type: 'staple',
          x: player.x,
          y: player.y - 12,
          vx: Math.cos(ang) * (wDef.speed || 9),
          vy: Math.sin(ang) * (wDef.speed || 9),
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
      const count = curLv.projectiles || wDef.projectiles || 4;
      const spread = curLv.spread || wDef.spread || 0.55;

      for (let i = 0; i < count; i++) {
        const ang = targetAngle + (Math.random() - 0.5) * spread;
        const spd = (wDef.speed || 8) * (0.85 + Math.random() * 0.3);
        const keys = ['ESC', 'ENTER', 'CTRL', 'TAB', 'F5'];
        this.projectiles.push({
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
      const count = curLv.projectiles || 1;
      const area = (curLv.area || wDef.area) * player.stats.areaMul;
      const duration = curLv.duration || wDef.duration;

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
      const count = curLv.strikes || 1;
      const area = (curLv.area || wDef.area) * player.stats.areaMul;

      for (let i = 0; i < count; i++) {
        const target = monsters[Math.floor(Math.random() * monsters.length)] || nearest;
        const tx = target ? target.x : player.x + (Math.random() * 200 - 100);
        const ty = target ? target.y : player.y + (Math.random() * 200 - 100);

        setTimeout(() => {
          this.stampStrikes.push({
            x: tx,
            y: ty,
            radius: area,
            damage: baseDmg,
            progress: 0,
            hasHit: false
          });
        }, i * 180);
      }
    } else if (wId === 'shredder') {
      // 📑 문서 세단기 톱니 (나선형 회전 관통)
      if (window.soundEngine) window.soundEngine.playShredder();
      const count = curLv.projectiles || 1;

      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        this.projectiles.push({
          type: 'shredder_blade',
          x: player.x,
          y: player.y - 10,
          vx: Math.cos(ang) * (wDef.speed || 5),
          vy: Math.sin(ang) * (wDef.speed || 5),
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
    }
  }

  // 🔥 초월 진화 무기 발사 로직
  fireSuperWeapon(sId, player, monsters, effectEngine) {
    const sDef = window.GAME_DATA.SUPER_WEAPONS[sId];
    const baseDmg = Math.floor(sDef.baseDmg * player.stats.atkMul);
    const nearest = this.getNearestMonster(player, monsters);

    if (sId === 'super_stapler') {
      // ⚡ [고속 자동 제본건] 360도 전방위 16연사 관통 침 폭풍
      if (window.soundEngine) window.soundEngine.playStapler();
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
        this.projectiles.push({
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
        duration: 4.0,
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
        this.projectiles.push({
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
        setTimeout(() => {
          this.stampStrikes.push({
            x: tx,
            y: ty,
            radius: 180 * player.stats.areaMul,
            damage: baseDmg,
            progress: 0,
            hasHit: false,
            isSuper: true
          });
        }, i * 140);
      }
    } else if (sId === 'super_shredder') {
      // 🌀 [초고속 문서 분쇄 토네이도]
      if (window.soundEngine) window.soundEngine.playShredder();
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        this.projectiles.push({
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

      // 탄산 발포 원형 장판
      ctx.fillStyle = pud.color + '44';
      ctx.beginPath();
      ctx.arc(0, 0, pud.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = pud.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = pud.color;
      ctx.shadowBlur = 12;
      ctx.stroke();

      // 보글보글 기포 효과
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

    // 2. 투사체(스테이플러 침, 키캡, 톱니 등) 렌더링
    this.projectiles.forEach(p => {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(p.rot || 0);

      if (p.type === 'staple' || p.type === 'super_staple') {
        // 스테이플러 철제 침 (ㄷ자 메탈릭 발사체)
        const isSuper = (p.type === 'super_staple');
        ctx.fillStyle = isSuper ? '#00f0ff' : '#93c5fd';
        ctx.shadowColor = isSuper ? '#00f0ff' : '#60a5fa';
        ctx.shadowBlur = isSuper ? 12 : 6;

        ctx.fillRect(-8, -2, 16, 4);
        ctx.fillRect(-8, -2, 4, 8);
        ctx.fillRect(4, -2, 4, 8);
      } else if (p.type === 'keycap' || p.type === 'super_keycap') {
        // 기계식 키보드 키캡 (3D 입체)
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
        // 티타늄 파쇄 톱날 (8각 회전 블레이드)
        const isSuper = (p.type === 'super_shredder_blade');
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

      // 블랙 플래티넘 카드 본체
      ctx.fillStyle = orb.isSuper ? '#090d16' : '#1e293b';
      ctx.strokeStyle = orb.isSuper ? '#ffd700' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = orb.isSuper ? '#ffd700' : '#38bdf8';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.roundRect(-14, -8, 28, 16, 3);
      ctx.fill();
      ctx.stroke();

      // 황금 IC칩 각인
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-10, -4, 6, 5);

      ctx.restore();
    });

    // 4. 결재 반려 도장 렌더링
    this.stampStrikes.forEach(st => {
      const sx = st.x - camera.x;
      const sy = st.y - camera.y;

      ctx.save();
      if (st.progress < 1.0) {
        // 상공에서 회전하며 수직 낙하 중
        const scale = 3.0 - st.progress * 2.0;
        const dropY = sy - (1.0 - st.progress) * 250;

        ctx.translate(sx, dropY);
        ctx.scale(scale, scale);

        // 원목 손잡이
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-6, -26, 12, 22);

        // 황동 헤드 & 붉은 고무 인장
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(-16, -4, 32, 10, 3);
        ctx.fill();
      } else {
        // 바닥 충돌 충격파 & 붉은 낙인
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
