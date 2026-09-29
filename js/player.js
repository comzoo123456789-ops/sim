// Player Controller, Movement, Stats, XP & Grounded 2D Character Renderer

class Player {
  constructor(charId = 'intern') {
    const charData = window.GAME_DATA.CHARACTERS[charId] || window.GAME_DATA.CHARACTERS.intern;
    this.charData = charData;
    this.id = charData.id;
    this.name = charData.name;
    this.title = charData.title;

    // 위치 및 물리
    this.x = 1200;
    this.y = 1200;
    this.radius = 18;
    this.facing = 'right';
    this.vx = 0;
    this.vy = 0;
    this.walkTimer = 0;

    // 레벨 및 경험치
    this.level = 1;
    this.exp = 0;
    this.nextExp = 25;
    this.gold = 0;
    this.kills = 0;

    // 생명력 및 무적 프레임
    this.maxHp = charData.baseHp * (1 + (charData.bonus.hpMul || 0));
    this.hp = this.maxHp;
    this.isDead = false;
    this.invincibleTimer = 0;
    this.reviveCount = 0;

    // 보유 무기 및 패시브 레벨 맵
    this.weapons = {}; // { stapler: level, keyboard: level, ... }
    this.passives = {}; // { glasses: level, desk: level, ... }
    this.superWeapons = []; // ['super_stapler', ...]

    // 기본 무기 등록
    this.weapons[charData.initialWeapon] = 1;

    // 칼퇴 대시 (Sprint / Dodge Skill)
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.maxDashCooldown = 2.8;
    this.dashVx = 0;
    this.dashVy = 0;
    this.ghostTrails = [];

    // 종합 스탯 캐시
    this.stats = {
      atkMul: 1.0 + (charData.bonus.atkMul || 0),
      speedMul: 1.0 + (charData.bonus.speedMul || 0),
      areaMul: 1.0,
      cdReduc: 0.0,
      magnetRange: 60,
      dmgReduc: 0.0,
      hpRegen: charData.bonus.regenRate || 0,
      critRate: charData.bonus.critRate || 0.05,
      xpMul: 1.0 + (charData.bonus.xpMul || 0)
    };

    this.recalculateStats();
  }

  // 패시브 습득 및 영구 강화에 따른 실시간 스탯 재계산
  recalculateStats() {
    let atkMul = 1.0 + (this.charData.bonus.atkMul || 0);
    let speedMul = 1.0 + (this.charData.bonus.speedMul || 0);
    let areaMul = 1.0;
    let cdReduc = 0.0;
    let magnetRange = 65;
    let dmgReduc = 0.0;
    let hpRegen = this.charData.bonus.regenRate || 0;
    let critRate = this.charData.bonus.critRate || 0.05;
    let xpMul = 1.0 + (this.charData.bonus.xpMul || 0);
    let maxHpBonus = 1.0 + (this.charData.bonus.hpMul || 0);
    let goldMul = 1.0;

    // 연봉 협상 영구 강화 스탯 적용
    if (window.saveMgr) {
      const up = window.saveMgr.data.upgrades;
      if (up.hp) maxHpBonus += up.hp * 0.10;
      if (up.speed) speedMul += up.speed * 0.05;
      if (up.atk) atkMul += up.atk * 0.08;
      if (up.cd) cdReduc += up.cd * 0.04;
      if (up.magnet) magnetRange += up.magnet * 20;
      if (up.gold) goldMul += up.gold * 0.15;
    }

    // 사내 복지 패시브 적용
    Object.entries(this.passives).forEach(([pId, lv]) => {
      const pDef = window.GAME_DATA.PASSIVES[pId];
      if (!pDef || !pDef.levels[lv - 1]) return;
      const cur = pDef.levels[lv - 1];

      if (cur.areaMul) areaMul += cur.areaMul;
      if (cur.speedMul) speedMul += cur.speedMul;
      if (cur.cdReduc) cdReduc = Math.min(0.65, cdReduc + cur.cdReduc);
      if (cur.magnetRange) magnetRange += cur.magnetRange;
      if (cur.dmgReduc) dmgReduc = Math.min(0.70, dmgReduc + cur.dmgReduc);
      if (cur.hpRegen) hpRegen += cur.hpRegen;
      if (cur.revive) this.reviveCount = cur.revive;
    });

    this.stats = {
      atkMul,
      speedMul,
      areaMul,
      cdReduc,
      magnetRange,
      dmgReduc,
      hpRegen,
      critRate,
      xpMul,
      goldMul
    };

    const newMaxHp = Math.floor(this.charData.baseHp * maxHpBonus);
    if (newMaxHp !== this.maxHp) {
      const ratio = this.hp / this.maxHp;
      this.maxHp = newMaxHp;
      this.hp = Math.floor(this.maxHp * ratio);
    }
  }

  recalcStats() {
    this.recalculateStats();
  }

  // 경험치 획득 및 레벨업
  addExp(amount) {
    if (this.isDead) return;
    const actualExp = Math.floor(amount * this.stats.xpMul);
    this.exp += actualExp;

    if (window.soundEngine) window.soundEngine.playXP();

    let levelUpsGained = 0;
    while (this.exp >= this.nextExp) {
      this.exp -= this.nextExp;
      this.level++;
      this.nextExp = Math.floor(this.nextExp * 1.35 + 15);
      levelUpsGained++;
    }

    if (levelUpsGained > 0 && window.game) {
      for (let i = 0; i < levelUpsGained; i++) {
        window.game.queueLevelUp();
      }
    }
  }

  // 피해 피격
  takeDamage(amount) {
    if (this.isDead || this.invincibleTimer > 0) return;

    let actual = Math.max(1, Math.floor(amount * (1 - this.stats.dmgReduc)));
    this.hp -= actual;
    this.invincibleTimer = 0.45; // 0.45초 무적 시간

    if (window.soundEngine) window.soundEngine.playHit();
    if (window.game && window.game.effectEngine) {
      window.game.effectEngine.spawnFloatingText(this.x, this.y - 25, `-${actual}`, '#ff3355');
      window.game.effectEngine.screenShake(5, 0.15);
    }

    if (this.hp <= 0) {
      if (this.reviveCount > 0) {
        this.reviveCount--;
        this.hp = Math.floor(this.maxHp * 0.5);
        this.invincibleTimer = 2.0;
        if (window.game && window.game.effectEngine) {
          window.game.effectEngine.spawnFloatingText(this.x, this.y - 35, '🏖️ [연차 휴가] 부활 완료!', '#00ffaa');
          window.game.effectEngine.spawnShockwave(this.x, this.y, 100, '#00ffaa');
        }
      } else {
        this.die();
      }
    }
  }

  die() {
    this.isDead = true;
    this.hp = 0;
    if (window.soundEngine) window.soundEngine.playGameOver();
    if (window.game) {
      window.game.handleGameOver(false);
    }
  }

  dash() {
    if (this.isDead || this.dashCooldown > 0 || this.isDashing) return;

    this.isDashing = true;
    this.dashTimer = 0.22;
    this.dashCooldown = this.maxDashCooldown * (1 - this.stats.cdReduc * 0.4);
    this.invincibleTimer = 0.28;

    // 대시 방향 산출
    let dirX = this.vx !== 0 ? Math.sign(this.vx) : (this.facing === 'left' ? -1 : 1);
    let dirY = this.vy !== 0 ? Math.sign(this.vy) : 0;
    const len = Math.hypot(dirX, dirY) || 1;

    this.dashVx = (dirX / len) * 11;
    this.dashVy = (dirY / len) * 11;

    if (window.soundEngine) window.soundEngine.playTone(680, 'triangle', 0.12, 0.25, 0.01);
    if (window.game && window.game.effectEngine) {
      window.game.effectEngine.spawnShockwave(this.x, this.y, 45, '#00f0ff');
      window.game.effectEngine.spawnFloatingText(this.x, this.y - 25, '💨 대시!', '#00f0ff');
    }
  }

  update(dt, input) {
    if (this.isDead) return;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }

    // 초당 자연 체력 재생
    if (this.stats.hpRegen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.stats.hpRegen * dt);
    }

    // 대시 쿨타임 업데이트
    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt;
      if (this.dashCooldown < 0) this.dashCooldown = 0;
    }

    // 대시 잔상 업데이트
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const g = this.ghostTrails[i];
      g.alpha -= dt * 4;
      if (g.alpha <= 0) this.ghostTrails.splice(i, 1);
    }

    if (this.isDashing) {
      this.dashTimer -= dt;
      this.x += this.dashVx * 60 * dt;
      this.y += this.dashVy * 60 * dt;

      this.ghostTrails.push({
        x: this.x,
        y: this.y,
        facing: this.facing,
        alpha: 0.6
      });

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else {
      // 조이스틱 및 키보드 입력 통합
      let mx = 0;
      let my = 0;

      if (input.w || input.arrowUp) my -= 1;
      if (input.s || input.arrowDown) my += 1;
      if (input.a || input.arrowLeft) mx -= 1;
      if (input.d || input.arrowRight) mx += 1;

      if (input.joyX || input.joyY) {
        mx += input.joyX;
        my += input.joyY;
      }

      const isMoving = (mx !== 0 || my !== 0);

      if (isMoving) {
        const len = Math.hypot(mx, my);
        const baseSpd = this.charData.speed * this.stats.speedMul * 60 * dt;
        this.vx = (mx / len) * baseSpd;
        this.vy = (my / len) * baseSpd;

        this.x += this.vx;
        this.y += this.vy;

        if (mx < -0.1) this.facing = 'left';
        else if (mx > 0.1) this.facing = 'right';

        this.walkTimer += dt * 10;
      } else {
        this.vx = 0;
        this.vy = 0;
        this.walkTimer = 0;
      }
    }

    // 맵 경계 제한 (2400 x 2400)
    this.x = Math.max(80, Math.min(2320, this.x));
    this.y = Math.max(80, Math.min(2320, this.y));
  }

  // 캐릭터 렌더링 (순수 캔버스 2D 벡터 아트 - 100% 지면 접지 & 양발 보행 모션)
  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // 대시 푸른 잔상 렌더링
    this.ghostTrails.forEach(g => {
      const gx = g.x - camera.x;
      const gy = g.y - camera.y;
      ctx.save();
      ctx.translate(gx, gy);
      if (g.facing === 'left') ctx.scale(-1, 1);
      ctx.globalAlpha = Math.max(0, g.alpha * 0.5);
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.roundRect(-8, -28, 16, 28, 4);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();

    // 1. 발바닥 바로 아래 지면 밀착 그림자 (간격 0px, 둥둥 떠다님 원천 차단)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 피격 무적 시 깜빡임
    if (this.invincibleTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    ctx.save();
    ctx.translate(sx, sy);
    if (this.facing === 'left') {
      ctx.scale(-1, 1);
    }

    const isMoving = (this.vx !== 0 || this.vy !== 0);
    const legStride = isMoving ? Math.sin(this.walkTimer) * 6 : 0;
    const bodyTilt = isMoving ? Math.sin(this.walkTimer * 0.5) * 0.06 : 0;

    ctx.rotate(bodyTilt);

    // [하체: 실제 양발 걸음걸이 관절] (바닥 y = 0 에 단단히 착지)
    ctx.fillStyle = '#1e293b'; // 슬랙스 바지
    // 왼발
    ctx.fillRect(-6, -14, 5, 14 + legStride);
    // 오른발
    ctx.fillRect(2, -14, 5, 14 - legStride);

    // 구두 (Black Oxford Shoes)
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-7, legStride, 7, 4, [2, 2, 1, 1]);
    ctx.roundRect(1, -legStride, 7, 4, [2, 2, 1, 1]);
    ctx.fill();

    // [상체: 셔츠 & 직급별 의상]
    if (this.id === 'intern') {
      // 🧑‍💻 신입사원: 하늘색 셔츠 + 사원증 목걸이
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(-8, -28, 16, 15, 3);
      ctx.fill();

      // 사원증 끈 & 카드
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-3, -28); ctx.lineTo(0, -20); ctx.lineTo(3, -28);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2.5, -20, 5, 7);
    } else if (this.id === 'deputy') {
      // 👨‍💼 만년 대리: 롤업 셔츠 + 네이비 조끼
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(-8, -28, 16, 15, 3);
      ctx.fill();

      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-8, -28, 4, 15);
      ctx.fillRect(4, -28, 4, 15);
    } else {
      // 🧓 멘탈갑 과장: 짙은 정장 수트 + 붉은 넥타이
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-9, -29, 18, 16, 3);
      ctx.fill();

      // 와이셔츠 & 붉은 넥타이
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-3, -29); ctx.lineTo(0, -22); ctx.lineTo(3, -29);
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-1.5, -28, 3, 10);
    }

    // [머리 & 얼굴]
    ctx.fillStyle = '#fcd34d'; // 피부톤
    ctx.beginPath();
    ctx.arc(0, -36, 9, 0, Math.PI * 2);
    ctx.fill();

    // 헤어스타일
    ctx.fillStyle = '#1e1e24';
    ctx.beginPath();
    ctx.arc(0, -38, 9.5, Math.PI, Math.PI * 2);
    ctx.fill();

    // 눈 (초롱초롱한 눈빛)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -37, 2, 3);

    // 대리인 경우 뿔테 안경 추가
    if (this.id === 'deputy') {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(1, -38, 4, 4);
    }

    // [손 & 무기 파지 모션]
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(6, -20 + (isMoving ? Math.sin(this.walkTimer) * 2 : 0), 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }
}

window.Player = Player;
