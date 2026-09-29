// Monsters, Boss Attack Patterns, AI Pathfinding & 10-Minute Wave Spawner

class Monster {
  constructor(typeKey, x, y, scale = 1.0) {
    const proto = window.GAME_DATA.MONSTERS[typeKey] || window.GAME_DATA.MONSTERS.paper;
    this.typeKey = typeKey;
    this.name = proto.name;
    this.isBoss = proto.isBoss || false;
    this.isAlive = true;

    this.id = Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.radius = proto.radius * scale;
    this.speed = proto.speed * (0.9 + Math.random() * 0.2);

    this.maxHp = Math.floor(proto.baseHp * scale);
    this.hp = this.maxHp;
    this.atk = Math.floor(proto.baseAtk * scale);
    this.exp = proto.exp || 10;
    this.color = proto.color || '#fff';

    this.hitTimer = 0;
    this.animTimer = Math.random() * 10;
    this.attackTimer = 0;

    // 복사기 원거리 토너 탄막 리스트
    this.bullets = [];
  }

  takeDamage(amount, isCrit = false) {
    if (!this.isAlive) return;
    this.hp -= amount;
    this.hitTimer = 0.15;

    if (window.game && window.game.effectEngine) {
      window.game.effectEngine.spawnFloatingText(this.x, this.y - 15, `${amount}`, isCrit ? '#ffd700' : '#ffffff');
      window.game.effectEngine.spawnHitSpark(this.x, this.y, this.color);
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isAlive = false;
    this.hp = 0;

    if (window.soundEngine) window.soundEngine.playHit();
    if (window.game) {
      window.game.player.kills++;

      // 경험치 커피콩 & 골드 영수증 드랍
      if (this.isBoss) {
        // 보스는 황금 서류가방(보물상자) + 대량의 황금 원두 드랍
        window.game.dropMgr.spawnDrop(this.x, this.y, 'chest', 1);
        window.game.dropMgr.spawnDrop(this.x + 20, this.y, 'super_coffee', this.exp);
        window.game.dropMgr.spawnDrop(this.x - 20, this.y, 'receipt', 100);
      } else {
        if (Math.random() < 0.85) {
          window.game.dropMgr.spawnDrop(this.x, this.y, 'coffee_bean', this.exp);
        }
        if (Math.random() < 0.25) {
          window.game.dropMgr.spawnDrop(this.x, this.y, 'receipt', 10);
        }
        if (Math.random() < 0.05) {
          window.game.dropMgr.spawnDrop(this.x, this.y, 'aid_kit', 1);
        }

        // 엑셀 슬라임 분열 기믹
        if (this.typeKey === 'slime' && this.radius > 12) {
          window.game.monsterMgr.spawnChildSlimes(this.x, this.y);
        }
      }
    }
  }

  update(dt, player) {
    if (!this.isAlive) return;

    if (this.hitTimer > 0) this.hitTimer -= dt;
    this.animTimer += dt * 8;

    // 플레이어를 향해 추적 이동
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist > 5) {
      const ang = Math.atan2(player.y - this.y, player.x - this.x);
      this.x += Math.cos(ang) * this.speed * 60 * dt;
      this.y += Math.sin(ang) * this.speed * 60 * dt;
    }

    // 플레이어 접촉 공격 (0.6초 쿨타임)
    if (dist <= this.radius + player.radius) {
      player.takeDamage(this.atk);
    }

    // [복사기] 원거리 토너 탄막 발사
    if (this.typeKey === 'copier') {
      this.attackTimer += dt;
      if (this.attackTimer >= 2.8) {
        this.attackTimer = 0;
        const ang = Math.atan2(player.y - this.y, player.x - this.x);
        if (window.game) {
          window.game.monsterMgr.spawnEnemyBullet(this.x, this.y, Math.cos(ang) * 4.5, Math.sin(ang) * 4.5, this.atk);
        }
      }
    }

    // [보스 꼰대 과장 / 부장님 / 대표이사] 특수 공격
    if (this.isBoss) {
      this.attackTimer += dt;
      if (this.typeKey === 'boss_manager' && this.attackTimer >= 3.5) {
        // 라떼는 말이야 음파 충격파
        this.attackTimer = 0;
        if (window.game && window.game.effectEngine) {
          window.game.effectEngine.spawnShockwave(this.x, this.y, 140, '#ff9900');
          window.game.effectEngine.spawnFloatingText(this.x, this.y - 35, '"라떼는 밤새웠어!"', '#ff9900');
        }
        if (dist <= 140) player.takeDamage(this.atk * 1.5);
      } else if (this.typeKey === 'boss_director' && this.attackTimer >= 4.0) {
        // 결재판 투척 & 바닥 쾅
        this.attackTimer = 0;
        if (window.game && window.game.effectEngine) {
          window.game.effectEngine.screenShake(10, 0.35);
          window.game.effectEngine.spawnShockwave(this.x, this.y, 200, '#e63946');
          window.game.effectEngine.spawnFloatingText(this.x, this.y - 45, '"오늘 안에 다 해와!"', '#e63946');
        }
        if (dist <= 200) player.takeDamage(this.atk * 1.8);
      } else if (this.typeKey === 'boss_ceo' && this.attackTimer >= 3.0) {
        // 심야 전사원 긴급 소집 탄막
        this.attackTimer = 0;
        for (let b = 0; b < 12; b++) {
          const ba = (b / 12) * Math.PI * 2;
          if (window.game) {
            window.game.monsterMgr.spawnEnemyBullet(this.x, this.y, Math.cos(ba) * 5, Math.sin(ba) * 5, this.atk);
          }
        }
        if (window.game && window.game.effectEngine) {
          window.game.effectEngine.spawnFloatingText(this.x, this.y - 50, '"전사원 비상 야근 선포!"', '#9d4edd');
        }
      }
    }
  }

  // 몬스터 렌더링 (순수 캔버스 2D 고화질 벡터 아트 - No Emojis!)
  render(ctx, camera) {
    if (!this.isAlive) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    // 발밑 부드러운 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius * 0.8, this.radius * 0.8, this.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // 피격 플래시
    if (this.hitTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.typeKey === 'paper') {
      // 📄 펄럭이는 결재 서류 몬스터
      const flap = Math.sin(this.animTimer) * 5;
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#cbd5e1';
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.roundRect(-10, -12 + flap, 20, 24, 2);
      ctx.fill();

      // 붉은 반려 도장 마크
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-6, -4 + flap, 12, 4);

      // 성난 눈
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-5, -8 + flap, 3, 2);
      ctx.fillRect(2, -8 + flap, 3, 2);
    } else if (this.typeKey === 'slime') {
      // 📊 엑셀 #REF! 녹색 큐브 슬라임
      const squish = Math.sin(this.animTimer) * 2;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.85)';
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(-this.radius, -this.radius + squish, this.radius * 2, this.radius * 2 - squish, 6);
      ctx.fill();
      ctx.stroke();

      // 엑셀 격자선
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(-this.radius + 4, 0); ctx.lineTo(this.radius - 4, 0);
      ctx.moveTo(0, -this.radius + 4); ctx.lineTo(0, this.radius - 4);
      ctx.stroke();

      // #REF! 텍스트
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('#REF!', 0, squish);
    } else if (this.typeKey === 'copier') {
      // 🖨️ 용지 걸린 복사기 몬스터
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(-18, -16, 36, 32, 4);
      ctx.fill();
      ctx.stroke();

      // 스캐너 녹색 발광 램프
      ctx.fillStyle = (Math.floor(Date.now() / 150) % 2 === 0) ? '#22c55e' : '#ef4444';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fillRect(-12, -10, 24, 6);
    } else if (this.typeKey === 'slack') {
      // 💬 슬랙 멘션 알림 괴물
      ctx.fillStyle = '#e11d48';
      ctx.shadowColor = '#fb7185';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('@HERE', 0, 0);
    } else if (this.typeKey === 'thief') {
      // ☕ 탕비실 커피 도둑
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, -6, 12, 0, Math.PI * 2);
      ctx.fill();

      // 커피 머그잔
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, -4, 8, 10);
    } else if (this.isBoss) {
      // 👔 보스 캐릭터 렌더링 (대형 수트 & 아우라)
      const isDirector = this.typeKey === 'boss_director';
      const isCEO = this.typeKey === 'boss_ceo';

      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;

      // 보스 수트 바디
      ctx.fillStyle = isCEO ? '#4c1d95' : isDirector ? '#7f1d1d' : '#78350f';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.roundRect(-this.radius * 0.8, -this.radius * 1.1, this.radius * 1.6, this.radius * 2.0, 10);
      ctx.fill();
      ctx.stroke();

      // 붉은 분노의 눈
      ctx.fillStyle = '#ff0033';
      ctx.fillRect(-10, -this.radius * 0.6, 6, 4);
      ctx.fillRect(4, -this.radius * 0.6, 6, 4);

      // 보스 이름 & 타이틀 상단 표시
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-75, -this.radius - 36, 150, 24, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 12px "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.name, 0, -this.radius - 24);

      // 보스 HP 게이지 바
      const hpRate = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-60, -this.radius - 10, 120, 6);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-60, -this.radius - 10, 120 * hpRate, 6);
    }

    ctx.restore();
  }
}

class MonsterManager {
  constructor() {
    this.monsters = [];
    this.enemyBullets = [];
    this.spawnTimer = 0;
    this.elapsedTime = 0;
    this.bossSpawned = { manager: false, director: false, ceo: false };
  }

  reset() {
    this.monsters = [];
    this.enemyBullets = [];
    this.spawnTimer = 0;
    this.elapsedTime = 0;
    this.bossSpawned = { manager: false, director: false, ceo: false };
  }

  spawnEnemyBullet(x, y, vx, vy, dmg) {
    this.enemyBullets.push({
      x, y, vx, vy,
      damage: dmg,
      radius: 6,
      life: 4.0
    });
  }

  spawnChildSlimes(x, y) {
    for (let i = 0; i < 2; i++) {
      const child = new Monster('slime', x + (i === 0 ? -15 : 15), y, 0.65);
      this.monsters.push(child);
    }
  }

  update(dt, player) {
    this.elapsedTime += dt;
    this.spawnTimer += dt;

    // 1. 시간대별 몬스터 웨이브 스포너
    const spawnInterval = Math.max(0.35, 1.2 - (this.elapsedTime / 600) * 0.85);

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnWave(player);
    }

    // 2. 보스 시간별 스폰 체크 (2분, 5분, 10분)
    if (this.elapsedTime >= 120 && !this.bossSpawned.manager) {
      this.bossSpawned.manager = true;
      this.spawnBoss('boss_manager', player);
    }
    if (this.elapsedTime >= 300 && !this.bossSpawned.director) {
      this.bossSpawned.director = true;
      this.spawnBoss('boss_director', player);
    }
    if (this.elapsedTime >= 580 && !this.bossSpawned.ceo) {
      this.bossSpawned.ceo = true;
      this.spawnBoss('boss_ceo', player);
    }

    // 3. 몬스터 업데이트
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      m.update(dt, player);
      if (!m.isAlive) {
        this.monsters.splice(i, 1);
      }
    }

    // 4. 적 탄막 업데이트
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * dt * 60;
      b.y += b.vy * dt * 60;
      b.life -= dt;

      if (Math.hypot(player.x - b.x, player.y - b.y) <= player.radius + b.radius) {
        player.takeDamage(b.damage);
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  spawnWave(player) {
    const types = ['paper'];
    if (this.elapsedTime >= 60) types.push('slime');
    if (this.elapsedTime >= 180) types.push('copier');
    if (this.elapsedTime >= 300) types.push('slack');
    if (this.elapsedTime >= 420) types.push('thief');

    const count = 2 + Math.min(6, Math.floor(this.elapsedTime / 90));
    for (let i = 0; i < count; i++) {
      const t = types[Math.floor(Math.random() * types.length)];
      const ang = Math.random() * Math.PI * 2;
      const dist = 500 + Math.random() * 200;
      const mx = player.x + Math.cos(ang) * dist;
      const my = player.y + Math.sin(ang) * dist;

      const scale = 1.0 + (this.elapsedTime / 600) * 0.8;
      this.monsters.push(new Monster(t, mx, my, scale));
    }
  }

  spawnBoss(bossKey, player) {
    if (window.soundEngine) window.soundEngine.playBossAlert();
    if (window.game && window.game.effectEngine) {
      window.game.effectEngine.screenShake(12, 0.6);
      window.game.effectEngine.spawnFloatingText(player.x, player.y - 60, '🚨 [경고] 상사 몬스터 난입!', '#ff2255');
    }

    const ang = Math.random() * Math.PI * 2;
    const bx = player.x + Math.cos(ang) * 400;
    const by = player.y + Math.sin(ang) * 400;
    this.monsters.push(new Monster(bossKey, bx, by, 1.2));
  }

  render(ctx, camera) {
    // 1. 몬스터 렌더링
    this.monsters.forEach(m => m.render(ctx, camera));

    // 2. 적 탄막 렌더링
    this.enemyBullets.forEach(b => {
      const sx = b.x - camera.x;
      const sy = b.y - camera.y;

      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sx, sy, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

window.MonsterManager = MonsterManager;
