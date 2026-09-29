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

    // 플레이어를 향해 추적 이동 (슬랙 유령은 벽을 통과하는 부유형, 나머지 모든 몬스터는 벽과 기물에 걸림)
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist > 5) {
      const ang = Math.atan2(player.y - this.y, player.x - this.x);
      this.x += Math.cos(ang) * this.speed * 60 * dt;
      this.y += Math.sin(ang) * this.speed * 60 * dt;

      // 장애물 및 기물 물리 충돌 해결
      if (this.typeKey !== 'slack' && window.game && window.game.propMgr) {
        window.game.propMgr.resolveCollisions(this);
      }
    }

    // 플레이어 접촉 공격
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

    // [보스 꼰대 과장 / 부장님 / 대표이사] 고유 탄막 및 특수 패턴
    if (this.isBoss) {
      this.attackTimer += dt;
      if (this.typeKey === 'boss_manager' && this.attackTimer >= 3.5) {
        // 라떼는 말이야 음파 충격파 + 반려 도장 3연사
        this.attackTimer = 0;
        if (window.game && window.game.effectEngine) {
          window.game.effectEngine.spawnShockwave(this.x, this.y, 140, '#ff9900');
          window.game.effectEngine.spawnFloatingText(this.x, this.y - 35, '"라떼는 밤새웠어!"', '#ff9900');
        }
        if (dist <= 140) player.takeDamage(this.atk * 1.5);

        // 부채꼴 3방향 반려 탄환
        const baseAng = Math.atan2(player.y - this.y, player.x - this.x);
        [-0.3, 0, 0.3].forEach(offset => {
          const a = baseAng + offset;
          window.game.monsterMgr.spawnEnemyBullet(this.x, this.y, Math.cos(a) * 5, Math.sin(a) * 5, this.atk, '#ff5500');
        });
      } else if (this.typeKey === 'boss_director' && this.attackTimer >= 4.0) {
        // 결재판 투척 & 주말출근 긴급 소집 폭격 장판 3개 생성
        this.attackTimer = 0;
        if (window.game && window.game.effectEngine) {
          window.game.effectEngine.screenShake(10, 0.35);
          window.game.effectEngine.spawnShockwave(this.x, this.y, 180, '#e63946');
          window.game.effectEngine.spawnFloatingText(this.x, this.y - 45, '"주말에 다 나와!"', '#e63946');
        }
        if (dist <= 180) player.takeDamage(this.atk * 1.8);

        // 플레이어 주변에 3개 폭격 장판 생성
        for (let i = 0; i < 3; i++) {
          const ox = (Math.random() - 0.5) * 160;
          const oy = (Math.random() - 0.5) * 160;
          window.game.monsterMgr.spawnWarningZone(player.x + ox, player.y + oy, 55, 1.2, this.atk * 2.0);
        }
      } else if (this.typeKey === 'boss_ceo' && this.attackTimer >= 2.6) {
        // 대표이사 전방위 16방향 철야 야근 탄막 폭풍
        this.attackTimer = 0;
        for (let b = 0; b < 16; b++) {
          const ba = (b / 16) * Math.PI * 2;
          if (window.game) {
            window.game.monsterMgr.spawnEnemyBullet(this.x, this.y, Math.cos(ba) * 5.5, Math.sin(ba) * 5.5, this.atk, '#a855f7');
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

    // 피격 시 백색 플래시
    if (this.hitTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    switch (this.typeKey) {
      case 'paper':
        this.renderPaper(ctx);
        break;
      case 'slime':
        this.renderSlime(ctx);
        break;
      case 'copier':
        this.renderCopier(ctx);
        break;
      case 'slack':
        this.renderSlack(ctx);
        break;
      case 'thief':
        this.renderThief(ctx);
        break;
      case 'boss_manager':
        this.renderBossManager(ctx);
        break;
      case 'boss_director':
        this.renderBossDirector(ctx);
        break;
      case 'boss_ceo':
        this.renderBossCEO(ctx);
        break;
      default:
        this.renderPaper(ctx);
        break;
    }

    // 보스 전용 HP바 표시
    if (this.isBoss) {
      const barW = this.radius * 2.2;
      const barH = 6;
      const barY = -this.radius - 12;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barW / 2, barY, barW, barH);

      ctx.fillStyle = '#ff2255';
      ctx.shadowColor = '#ff2255';
      ctx.shadowBlur = 6;
      ctx.fillRect(-barW / 2, barY, barW * (this.hp / this.maxHp), barH);
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW / 2, barY, barW, barH);
    }

    ctx.restore();
  }

  // 1. 날아다니는 A4 서류 뭉치
  renderPaper(ctx) {
    const wobble = Math.sin(this.animTimer) * 3;
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#94a3b8';
    ctx.shadowBlur = 4;
    ctx.fillRect(-8, -11 + wobble, 16, 22);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-6, -7 + wobble, 12, 2);
    ctx.fillRect(-6, -3 + wobble, 12, 2);
    ctx.fillRect(-6, 1 + wobble, 8, 2);

    // 붉은 반려 도장 마크
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('REJECT', -8, 8 + wobble);
  }

  // 2. 엑셀 수식 슬라임 (초록 젤리 + 격자무늬)
  renderSlime(ctx) {
    const squish = Math.sin(this.animTimer) * 0.15;
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * (1 + squish), this.radius * (1 - squish), 0, 0, Math.PI * 2);
    ctx.fill();

    // 엑셀 셀 라인
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.6, 0);
    ctx.lineTo(this.radius * 0.6, 0);
    ctx.moveTo(0, -this.radius * 0.6);
    ctx.lineTo(0, this.radius * 0.6);
    ctx.stroke();

    // 분노한 슬라임 눈
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -3, 3, 0, Math.PI * 2);
    ctx.arc(4, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-3.5, -3, 1.5, 0, Math.PI * 2);
    ctx.arc(4.5, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 고장난 폭주 복사기
  renderCopier(ctx) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(-14, -14, 28, 28);

    // 스캐너 빛
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillRect(-10, -10, 20, 6);

    // 경고등 (적색 점멸)
    ctx.fillStyle = Math.sin(this.animTimer * 2) > 0 ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(8, -14, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. 슬랙 알림 유령 (@Channel 빨간 뱃지)
  renderSlack(ctx) {
    const floatY = Math.sin(this.animTimer) * 4;
    ctx.fillStyle = 'rgba(238, 242, 255, 0.85)';
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(0, -4 + floatY, 12, Math.PI, 0);
    ctx.lineTo(12, 8 + floatY);
    ctx.lineTo(6, 4 + floatY);
    ctx.lineTo(0, 8 + floatY);
    ctx.lineTo(-6, 4 + floatY);
    ctx.lineTo(-12, 8 + floatY);
    ctx.closePath();
    ctx.fill();

    // 빨간색 @ 알림 뱃지
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(8, -8 + floatY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('@', 5, -5 + floatY);
  }

  // 5. 간식 도둑 (월급 루팡)
  renderThief(ctx) {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, -4, 10, 0, Math.PI * 2);
    ctx.fill();

    // 안대 / 마스크
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-10, -8, 20, 5);

    // 훔친 탕비실 과자 봉지
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-12, 2, 8, 10);
  }

  // 6. 03:00 보스: 꼰대 과장 (김과장)
  renderBossManager(ctx) {
    // 양복 몸체 (갈색 정장)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-16, -6, 32, 26);

    // 머리 & 벗겨진 이마
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, -16, 12, 0, Math.PI * 2);
    ctx.fill();

    // 안경
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-9, -19, 7, 5);
    ctx.strokeRect(2, -19, 7, 5);

    // '라떼는' 서류철
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-22, -2, 10, 16);
  }

  // 7. 07:00 보스: 분노의 부장님 (박부장)
  renderBossDirector(ctx) {
    // 붉은 아우라
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 18;

    // 네이비 정장
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-22, -8, 44, 34);

    // 머리
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(0, -22, 16, 0, Math.PI * 2);
    ctx.fill();

    // 붉게 충혈된 눈
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(-5, -24, 3, 0, Math.PI * 2);
    ctx.arc(5, -24, 3, 0, Math.PI * 2);
    ctx.fill();

    // 거대한 결재판
    ctx.fillStyle = '#713f12';
    ctx.fillRect(-30, -5, 14, 22);
  }

  // 8. 10:00 최종 보스: 대표이사 (CEO)
  renderBossCEO(ctx) {
    // 보라색 패왕의 오라
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 24;

    // 프리미엄 블랙 턱시도 & 금장 단추
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-26, -10, 52, 40);

    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-2, -4, 4, 4);
    ctx.fillRect(-2, 6, 4, 4);

    // 백발 머리
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(0, -26, 18, 0, Math.PI * 2);
    ctx.fill();

    // 금테 선글라스
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-12, -29, 24, 6);

    // 황금 만년필 & 사원 해고 통지서
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-34, -8, 16, 26);
  }
}

class MonsterManager {
  constructor() {
    this.monsters = [];
    this.enemyBullets = [];
    this.warningZones = [];
    this.spawnTimer = 0;
  }

  reset() {
    this.monsters = [];
    this.enemyBullets = [];
    this.warningZones = [];
    this.spawnTimer = 0;
  }

  spawnChildSlimes(x, y) {
    for (let i = 0; i < 2; i++) {
      const child = new Monster('slime', x + (i === 0 ? -15 : 15), y, 0.6);
      child.hp = Math.floor(child.maxHp * 0.4);
      this.monsters.push(child);
    }
  }

  spawnEnemyBullet(x, y, vx, vy, atk, color = '#38bdf8') {
    this.enemyBullets.push({
      x, y, vx, vy, atk, color,
      radius: 6,
      life: 5.0
    });
  }

  spawnWarningZone(x, y, radius, delay, dmg) {
    this.warningZones.push({
      x, y, radius, delay, maxDelay: delay, dmg
    });
  }

  wipeAllNonBosses() {
    this.monsters.forEach(m => {
      if (!m.isBoss && m.isAlive) {
        m.die();
      }
    });
  }

  update(dt, player, gameTime, effectEngine) {
    // 1. 타임라인에 따른 몬스터 주기적 스폰
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.4, 1.8 - ((600 - gameTime) / 600) * 1.3);

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnWave(player, gameTime);
    }

    // 2. 보스 시간대 체크 (03:00 김과장, 07:00 박부장, 10:00 대표이사)
    this.checkBossTimeline(gameTime);

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
      b.x += b.vx * 60 * dt;
      b.y += b.vy * 60 * dt;
      b.life -= dt;

      // 플레이어 피격
      const dist = Math.hypot(player.x - b.x, player.y - b.y);
      if (dist <= player.radius + b.radius) {
        player.takeDamage(b.atk);
        if (effectEngine) effectEngine.spawnHitSpark(b.x, b.y, b.color);
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // 5. 바닥 경고 장판(Warning Zone) 업데이트
    for (let i = this.warningZones.length - 1; i >= 0; i--) {
      const wz = this.warningZones[i];
      wz.delay -= dt;

      if (wz.delay <= 0) {
        // 폭발 발동!
        if (effectEngine) {
          effectEngine.screenShake(8, 0.3);
          effectEngine.spawnShockwave(wz.x, wz.y, wz.radius * 1.5, '#ef4444');
          effectEngine.spawnFloatingText(wz.x, wz.y - 20, '💥 야근 폭격!', '#ef4444');
        }
        if (window.soundEngine) window.soundEngine.playHit();

        const dist = Math.hypot(player.x - wz.x, player.y - wz.y);
        if (dist <= wz.radius + player.radius) {
          player.takeDamage(wz.dmg);
        }

        this.warningZones.splice(i, 1);
      }
    }
  }

  checkBossTimeline(gameTime) {
    const elapsed = 600 - gameTime;

    // 3분(180초) 경과 시 꼰대 과장 출현
    if (elapsed >= 180 && !this.boss1Spawned) {
      this.boss1Spawned = true;
      this.spawnBoss('boss_manager');
    }

    // 6분(360초) 경과 시 분노의 부장님 출현
    if (elapsed >= 360 && !this.boss2Spawned) {
      this.boss2Spawned = true;
      this.spawnBoss('boss_director');
    }

    // 9분(540초) 경과 시 최종 보스 대표이사 출현
    if (elapsed >= 540 && !this.boss3Spawned) {
      this.boss3Spawned = true;
      this.spawnBoss('boss_ceo');
    }
  }

  spawnBoss(typeKey) {
    if (window.soundEngine) window.soundEngine.playBossAlert();
    if (window.game && window.game.effectEngine) {
      window.game.effectEngine.screenShake(15, 0.6);
      window.game.effectEngine.spawnFloatingText(window.game.player.x, window.game.player.y - 60, '⚠️ 보스 등장!! ⚠️', '#ff0033');
    }

    const ang = Math.random() * Math.PI * 2;
    const dist = 380;
    const bx = window.game.player.x + Math.cos(ang) * dist;
    const by = window.game.player.y + Math.sin(ang) * dist;

    const boss = new Monster(typeKey, bx, by, 1.4);
    this.monsters.push(boss);
  }

  spawnWave(player, gameTime) {
    const elapsed = 600 - gameTime;
    let pool = ['paper'];

    if (elapsed > 40) pool.push('slime');
    if (elapsed > 90) pool.push('copier');
    if (elapsed > 150) pool.push('slack');
    if (elapsed > 240) pool.push('thief');

    const spawnCount = Math.min(18, 3 + Math.floor(elapsed / 30));
    for (let i = 0; i < spawnCount; i++) {
      const typeKey = pool[Math.floor(Math.random() * pool.length)];
      const ang = Math.random() * Math.PI * 2;
      const dist = 420 + Math.random() * 80;
      const mx = player.x + Math.cos(ang) * dist;
      const my = player.y + Math.sin(ang) * dist;

      this.monsters.push(new Monster(typeKey, mx, my));
    }
  }

  render(ctx, camera) {
    // 1. 바닥 경고 장판 렌더링
    this.warningZones.forEach(wz => {
      const sx = wz.x - camera.x;
      const sy = wz.y - camera.y;
      const progress = 1 - (wz.delay / wz.maxDelay);

      ctx.save();
      ctx.translate(sx, sy);

      // 붉은 경고 원
      ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + progress * 0.35})`;
      ctx.beginPath();
      ctx.arc(0, 0, wz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 차오르는 안쪽 원
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, wz.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // 2. 몬스터 렌더링
    this.monsters.forEach(m => m.render(ctx, camera));

    // 3. 적 탄환 렌더링
    this.enemyBullets.forEach(b => {
      const sx = b.x - camera.x;
      const sy = b.y - camera.y;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

window.Monster = Monster;
window.MonsterManager = MonsterManager;
