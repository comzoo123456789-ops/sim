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
    this.hurtTimer = 0; // 피격 포즈 유지 시간
    this.reviveCount = 0;
    this.revivesGranted = 0; // 패시브로 지금까지 지급된 부활 횟수 (재계산 시 중복 지급 방지)

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
    this.lastDashCooldown = 2.8; // 마지막 대시에 실제 적용된 쿨타임 (HUD 게이지용)
    this.dashVx = 0;
    this.dashVy = 0;
    this.ghostTrails = [];

    // 종합 스탯 캐시
    this.stats = {
      atkMul: 1.0 + (charData.bonus.atkMul || 0),
      speedMul: 1.0 + (charData.bonus.speedMul || 0),
      areaMul: 1.0,
      cdReduc: charData.bonus.cdReduc || 0.0,
      magnetRange: 65,
      dmgReduc: charData.bonus.dmgReduc || 0.0,
      hpRegen: charData.bonus.regenRate || 0,
      critRate: 0.05 + (charData.bonus.critRate || 0),
      critDmgMul: 1.0 + (charData.bonus.critDmgMul || 0),
      xpMul: 1.0 + (charData.bonus.xpMul || 0),
      goldMul: 1.0,
      dodgeRate: 0.0,
      dashCdReduc: 0.0,
      projectileSpeed: 1.0
    };

    this.recalculateStats();
  }

  // 패시브 습득 및 영구 강화에 따른 실시간 스탯 재계산
  recalculateStats() {
    let atkMul = 1.0 + (this.charData.bonus.atkMul || 0);
    let speedMul = 1.0 + (this.charData.bonus.speedMul || 0);
    let areaMul = 1.0;
    let cdReduc = this.charData.bonus.cdReduc || 0.0;
    let magnetRange = 65;
    let dmgReduc = this.charData.bonus.dmgReduc || 0.0;
    let hpRegen = this.charData.bonus.regenRate || 0;
    let critRate = 0.05 + (this.charData.bonus.critRate || 0);
    let critDmgMul = 1.0 + (this.charData.bonus.critDmgMul || 0);
    let xpMul = 1.0 + (this.charData.bonus.xpMul || 0);
    let maxHpBonus = 1.0 + (this.charData.bonus.hpMul || 0);
    let goldMul = 1.0;
    let dodgeRate = 0.0;
    let dashCdReduc = 0.0;
    let projectileSpeed = 1.0;
    let revive = 0;

    // 연봉 협상 영구 강화 스탯 적용 (수치는 data.js의 bonusPerLv와 일치)
    if (window.saveMgr) {
      const up = window.saveMgr.data.upgrades;
      const shop = window.GAME_DATA.SHOP_UPGRADES;
      if (up.hp) maxHpBonus += up.hp * shop.hp.bonusPerLv;
      if (up.speed) speedMul += up.speed * shop.speed.bonusPerLv;
      if (up.atk) atkMul += up.atk * shop.atk.bonusPerLv;
      if (up.cd) cdReduc += up.cd * shop.cd.bonusPerLv;
      if (up.magnet) magnetRange *= 1 + up.magnet * shop.magnet.bonusPerLv;
      if (up.gold) goldMul += up.gold * shop.gold.bonusPerLv;
    }

    // 사내 복지 패시브 적용 (10종)
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
      if (cur.revive) revive += cur.revive;
      if (cur.projectileSpeed) projectileSpeed += cur.projectileSpeed;
      if (cur.critRate) critRate += cur.critRate;
      if (cur.critDmgMul) critDmgMul += cur.critDmgMul;
      if (cur.dodgeRate) dodgeRate = Math.min(0.60, dodgeRate + cur.dodgeRate);
      if (cur.dashCdReduc) dashCdReduc = Math.min(0.50, dashCdReduc + cur.dashCdReduc);
      if (cur.xpMul) xpMul += cur.xpMul;
      if (cur.goldMul) goldMul += cur.goldMul;
    });

    // 탕비실 상점 아이템 (이번 판 동안 유지)
    if (window.runMgr && window.runMgr.active) {
      const b = window.runMgr.bonuses();
      atkMul += b.atkMul;
      speedMul += b.speedMul;
      areaMul += b.areaMul;
      cdReduc = Math.min(0.65, cdReduc + b.cdReduc);
      magnetRange += b.magnet;
      dmgReduc = Math.min(0.70, dmgReduc + b.dmgReduc);
      hpRegen += b.hpRegen;
      critRate += b.critRate;
      xpMul += b.xpMul;
      goldMul += b.goldMul;
      dashCdReduc = Math.min(0.50, dashCdReduc + b.dashCdReduc);
      maxHpBonus += b.hpMul;
      revive += b.revive;
    }

    // 새로 해금된 부활 횟수만 지급 (이미 사용한 부활이 다시 충전되지 않도록)
    if (revive > this.revivesGranted) {
      this.reviveCount += revive - this.revivesGranted;
      this.revivesGranted = revive;
    }

    this.stats = {
      atkMul,
      speedMul,
      areaMul,
      cdReduc,
      magnetRange,
      dmgReduc,
      hpRegen,
      critRate,
      critDmgMul,
      xpMul,
      goldMul,
      dodgeRate,
      dashCdReduc,
      projectileSpeed
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

    // 회피율 검사 (Passive: airpod)
    if (this.stats.dodgeRate > 0 && Math.random() < this.stats.dodgeRate) {
      if (window.game && window.game.effectEngine) {
        window.game.effectEngine.spawnFloatingText(this.x, this.y - 25, '💨 회피!', '#00f0ff');
        window.game.effectEngine.spawnPuff(this.x, this.y - 10, 40, '#e0f2fe', 0.3, 0.6);
      }
      return;
    }

    let actual = Math.max(1, Math.floor(amount * (1 - this.stats.dmgReduc)));
    this.hp -= actual;
    this.invincibleTimer = 0.45; // 0.45초 무적 시간
    this.hurtTimer = 0.25;

    if (window.soundEngine) window.soundEngine.playHurt();
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
          window.game.effectEngine.spawnFlash(this.x, this.y - 15, 'fx_glow', '#00ffaa', 200, 0.8, { follow: this });
          window.game.effectEngine.spawnEmote(this.x, this.y, 'heart', this);
        }
      } else {
        this.die();
      }
    }
  }

  die() {
    this.isDead = true;
    this.hp = 0;
    // 게임오버 사운드는 handleGameOver에서 재생 (중복 재생 방지)
    if (window.game) {
      window.game.handleGameOver(false);
    }
  }

  dash() {
    if (this.isDead || this.dashCooldown > 0 || this.isDashing) return;

    this.isDashing = true;
    this.dashTimer = 0.22;
    const cdFactor = Math.max(0.4, 1 - (this.stats.cdReduc * 0.3 + (this.stats.dashCdReduc || 0)));
    this.dashCooldown = this.maxDashCooldown * cdFactor;
    this.lastDashCooldown = this.dashCooldown;
    this.invincibleTimer = 0.28;

    // 대시 방향 산출
    let dirX = this.vx !== 0 ? Math.sign(this.vx) : (this.facing === 'left' ? -1 : 1);
    let dirY = this.vy !== 0 ? Math.sign(this.vy) : 0;
    const len = Math.hypot(dirX, dirY) || 1;

    this.dashVx = (dirX / len) * 11;
    this.dashVy = (dirY / len) * 11;

    if (window.soundEngine) window.soundEngine.playDash();
    if (window.game && window.game.effectEngine) {
      window.game.effectEngine.spawnShockwave(this.x, this.y, 45, '#00f0ff');
      window.game.effectEngine.spawnPuff(this.x, this.y - 8, 70, '#7dd3fc', 0.5, 0.8);
      window.game.effectEngine.spawnFloatingText(this.x, this.y - 25, '💨 대시!', '#00f0ff');
    }
  }

  update(dt, input) {
    if (this.isDead) return;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }
    if (this.hurtTimer > 0) this.hurtTimer -= dt;

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
      // 대시 궤적 연기
      if (Math.random() < 0.5 && window.game && window.game.effectEngine) {
        window.game.effectEngine.spawnPuff(this.x, this.y - 6, 34, '#bae6fd', 0.35, 0.5);
      }

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

  // 🎨 귀여운 K-직장인 SD 애니메이션 캔버스 2D 벡터 렌더링 (No Emojis!)
  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // 대시 푸른 잔상 렌더링
    const spriteId = this.charData.sprite;
    const useSprite = spriteId && window.assets && window.assets.atlasReady();

    this.ghostTrails.forEach(g => {
      const gx = g.x - camera.x;
      const gy = g.y - camera.y;
      if (useSprite) {
        window.assets.drawSprite(ctx, `char_${spriteId}_walk3`, gx, gy + 2, Player.SPRITE_SCALE, { flip: g.facing === 'left', alpha: Math.max(0, g.alpha * 0.35) });
        return;
      }
      ctx.save();
      ctx.translate(gx, gy);
      if (g.facing === 'left') ctx.scale(-1, 1);
      ctx.globalAlpha = Math.max(0, g.alpha * 0.4);
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, -22, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();

    // 1. 발바닥 지면 밀착 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 피격 무적 시 깜빡임
    if (this.invincibleTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    if (useSprite) {
      const moving = this.vx !== 0 || this.vy !== 0;
      let pose = 'idle';
      if (this.hurtTimer > 0) pose = 'hurt';
      else if (this.isDashing || moving) pose = 'walk' + (Math.floor(this.walkTimer * 0.9) % 8);
      // 대기 중 숨쉬기
      const breathe = pose === 'idle' ? 1 + Math.sin(performance.now() / 320) * 0.012 : 1;
      window.assets.drawSprite(ctx, `char_${spriteId}_${pose}`, sx, sy + 2, Player.SPRITE_SCALE, { flip: this.facing === 'left', squash: breathe });
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(sx, sy);
    if (this.facing === 'left') {
      ctx.scale(-1, 1);
    }

    const isMoving = (this.vx !== 0 || this.vy !== 0);
    const legStride = isMoving ? Math.sin(this.walkTimer) * 5 : 0;
    const bodyBob = isMoving ? Math.abs(Math.sin(this.walkTimer)) * 2 : 0;
    const bodyTilt = isMoving ? Math.sin(this.walkTimer * 0.5) * 0.05 : 0;

    ctx.rotate(bodyTilt);

    // [하체: 다리 & 신발]
    if (this.id === 'planner') {
      // 👩‍💼 기획팀 대리 한소희 (여): A라인 오피스 스커트 & 힐
      ctx.fillStyle = '#334155'; // 차콜 스커트
      ctx.beginPath();
      ctx.moveTo(-9, -16 - bodyBob);
      ctx.lineTo(9, -16 - bodyBob);
      ctx.lineTo(11, -8 - bodyBob);
      ctx.lineTo(-11, -8 - bodyBob);
      ctx.closePath();
      ctx.fill();

      // 다리 (살구빛)
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-6, -8 - bodyBob, 4, 8 + legStride);
      ctx.fillRect(2, -8 - bodyBob, 4, 8 - legStride);

      // 구두 (Rose Gold Stiletto Heels)
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(-7, legStride - bodyBob, 6, 4, [2, 2, 1, 1]);
      ctx.roundRect(1, -legStride - bodyBob, 6, 4, [2, 2, 1, 1]);
      ctx.fill();
    } else if (this.id === 'manager') {
      // 👩‍💻 마케팅 팀장 박영희 (여): 네이비 슬림 슬랙스 & 펌프스 힐
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-7, -15 - bodyBob, 5, 15 + legStride);
      ctx.fillRect(2, -15 - bodyBob, 5, 15 - legStride);

      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.roundRect(-8, legStride - bodyBob, 7, 4, [2, 2, 1, 1]);
      ctx.roundRect(1, -legStride - bodyBob, 7, 4, [2, 2, 1, 1]);
      ctx.fill();
    } else {
      // 🧑‍💻 신입사원 이민우 / 👨‍💼 만년 대리 김철수 (남): 슬랙스 & 스니커즈/구두
      ctx.fillStyle = (this.id === 'intern') ? '#1e293b' : '#334155';
      ctx.fillRect(-7, -15 - bodyBob, 5, 15 + legStride);
      ctx.fillRect(2, -15 - bodyBob, 5, 15 - legStride);

      ctx.fillStyle = (this.id === 'intern') ? '#ffffff' : '#090d16';
      ctx.beginPath();
      ctx.roundRect(-8, legStride - bodyBob, 7, 4, [2, 2, 1, 1]);
      ctx.roundRect(1, -legStride - bodyBob, 7, 4, [2, 2, 1, 1]);
      ctx.fill();
    }

    // [상체: 직급별 오피스웨어 & 의상]
    const bodyY = -30 - bodyBob;

    if (this.id === 'intern') {
      // 🧑‍💻 신입사원 이민우: 산뜻한 스카이블루 셔츠 + 노란 사원증
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(-9, bodyY, 18, 16, 4);
      ctx.fill();

      // 화이트 셔츠 깃
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-4, bodyY); ctx.lineTo(0, bodyY + 5); ctx.lineTo(4, bodyY);
      ctx.fill();

      // 사원증 목걸이 & 카드
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, bodyY); ctx.lineTo(0, bodyY + 9); ctx.lineTo(4, bodyY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, bodyY + 9, 6, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-2, bodyY + 11, 4, 3);
    } else if (this.id === 'planner') {
      // 👩‍💼 기획팀 대리 한소희: 아이보리 블라우스 + 라벤더 니트 조끼
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(-9, bodyY, 18, 16, 4);
      ctx.fill();

      // 라벤더 조끼
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(-9, bodyY + 2, 4, 14);
      ctx.fillRect(5, bodyY + 2, 4, 14);

      // 골드 하트 목걸이
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, bodyY + 6, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.id === 'deputy') {
      // 👨‍💼 만년 대리 김철수: 화이트 셔츠 + 다크 네이비 조끼 + 스트라이프 넥타이
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(-9, bodyY, 18, 16, 4);
      ctx.fill();

      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-9, bodyY + 1, 5, 15);
      ctx.fillRect(4, bodyY + 1, 5, 15);

      // 네이비/골드 넥타이
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(-1.5, bodyY + 2, 3, 11);
    } else {
      // 👩‍💻 마케팅 팀장 박영희: 카리스마 미드나잇 수트 & 골드 더블 버튼
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-10, bodyY, 20, 16, 4);
      ctx.fill();

      // 이너 버건디 탑
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(-4, bodyY); ctx.lineTo(0, bodyY + 6); ctx.lineTo(4, bodyY);
      ctx.fill();

      // 골드 단추 2개
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(-2, bodyY + 9, 1.5, 0, Math.PI * 2);
      ctx.arc(2, bodyY + 9, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // [머리 & 귀여운 얼굴 & 표정]
    const headY = bodyY - 11;
    const skinColor = '#fed7aa'; // 부드러운 웜톤 피치 피부

    // 목
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, bodyY - 2, 6, 4);

    // 얼굴 윤곽 (동글동글 귀여운 SD 뺨)
    ctx.beginPath();
    ctx.arc(0, headY, 12, 0, Math.PI * 2);
    ctx.fill();

    // 복숭아빛 볼터치
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.beginPath();
    ctx.arc(-6, headY + 3, 3, 0, Math.PI * 2);
    ctx.arc(6, headY + 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // 초롱초롱한 애니 눈 & 하이라이트
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(3, headY + 1, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, headY - 0.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 캐릭터별 개성 넘치는 헤어스타일 & 액세서리
    if (this.id === 'intern') {
      // 🧑‍💻 신입 이민우: 댄디 컷 뱅 헤어 (다크 브라운)
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(0, headY - 2, 13, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      // 앞머리 결
      ctx.beginPath();
      ctx.moveTo(-10, headY - 4);
      ctx.lineTo(-4, headY - 1);
      ctx.lineTo(2, headY - 3);
      ctx.lineTo(8, headY - 1);
      ctx.lineTo(12, headY - 5);
      ctx.fill();
    } else if (this.id === 'planner') {
      // 👩‍💼 기획 한소희: 우아한 웨이브 포니테일 & 리본 (카라멜 브라운)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, headY - 2, 13, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      // 옆머리 & 앞머리
      ctx.fillRect(-12, headY - 2, 3, 9);
      ctx.fillRect(8, headY - 2, 3, 9);
      // 뒷머리 포니테일
      ctx.beginPath();
      ctx.arc(-11, headY - 2, 7, 0, Math.PI * 2);
      ctx.fill();
      // 리본 끈
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-13, headY - 5, 4, 6);
    } else if (this.id === 'deputy') {
      // 👨‍💼 만년 대리 김철수: 7:3 가르마 블랙 헤어 + 둥근 뿔테 안경
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(0, headY - 2, 13, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      // 둥근 스마트 안경
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(3, headY + 1, 4.5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // 👩‍💻 마케팅 팀장 박영희: 시크한 칼단발 보브컷 + 골드 링 귀걸이 + 레드 립
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(0, headY - 2, 13.5, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();
      // 볼을 감싸는 샤프한 단발 옆선
      ctx.fillRect(-12, headY - 2, 4, 11);
      ctx.fillRect(8, headY - 2, 4, 11);

      // 골드 링 귀걸이
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-8, headY + 6, 2.5, 0, Math.PI * 2);
      ctx.stroke();

      // 레드 립
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(2, headY + 6, 3, 1.5);
    }

    // [손 & 스마트 오피스 기기 파지]
    const handX = 8;
    const handY = bodyY + 8 + (isMoving ? Math.sin(this.walkTimer) * 2 : 0);

    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(handX, handY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 손에 들린 오피스 기물 (노트북/태블릿/머그)
    if (this.id === 'intern') {
      // 실버 맥북 노트북
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(handX - 2, handY - 5, 9, 7);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(handX, handY - 3, 5, 4);
    } else if (this.id === 'planner') {
      // 스마트 태블릿 & 애플 펜슬
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(handX - 2, handY - 6, 8, 10);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(handX, handY - 4, 5, 6);
    } else if (this.id === 'deputy') {
      // 커피 텀블러
      ctx.fillStyle = '#475569';
      ctx.fillRect(handX - 1, handY - 5, 6, 9);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(handX - 1, handY - 6, 6, 2);
    }

    ctx.restore();
    ctx.restore();
  }
}

Player.SPRITE_SCALE = 0.56; // 128px 프레임 → 약 72px

window.Player = Player;
