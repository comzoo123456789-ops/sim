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
      if (isCrit) window.game.effectEngine.spawnCritBurst(this.x, this.y);
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

      // 도감 해금 및 보스 업적 체크
      if (window.saveMgr) {
        window.saveMgr.unlockBestiary(this.typeKey);
        if (this.typeKey === 'boss_manager') window.saveMgr.checkAchievement('ach_boss_manager', true);
        if (this.typeKey === 'boss_director') window.saveMgr.checkAchievement('ach_boss_director', true);
        if (this.typeKey === 'boss_ceo') window.saveMgr.checkAchievement('ach_boss_ceo', true);
      }

      // 처치 이펙트
      const fx = window.game.effectEngine;
      if (fx) {
        if (this.isBoss) {
          fx.spawnExplosion(this.x, this.y, this.radius * 5, 0.8);
          fx.spawnFlash(this.x, this.y, 'fx_burst', '#ffd700', this.radius * 6, 0.6);
          fx.spawnDecal(this.x, this.y, this.radius * 4, '#1f2937', 'fx_scorch', 10);
          fx.screenShake(14, 0.5);
        } else if (this.typeKey === 'slime') {
          fx.spawnDecal(this.x, this.y, this.radius * 3, '#10b981');
        } else if (this.typeKey === 'copier') {
          fx.spawnExplosion(this.x, this.y, this.radius * 3.5, 0.45);
        } else {
          fx.spawnPuff(this.x, this.y, this.radius * 2.6, this.color, 0.35, 0.55);
        }
      }

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
          window.game.effectEngine.spawnEmote(this.x, this.y, 'swirl', this);
        }
        if (dist <= 140) player.takeDamage(this.atk * 1.5);

        // 부채꼴 3방향 반려 서류 탄환
        const baseAng = Math.atan2(player.y - this.y, player.x - this.x);
        [-0.3, 0, 0.3].forEach(offset => {
          const a = baseAng + offset;
          window.game.monsterMgr.spawnEnemyBullet(this.x, this.y, Math.cos(a) * 5, Math.sin(a) * 5, this.atk, '#ff5500', 'item_document');
        });
      } else if (this.typeKey === 'boss_director' && this.attackTimer >= 4.0) {
        // 결재판 투척 & 주말출근 긴급 소집 폭격 장판 3개 생성
        this.attackTimer = 0;
        if (window.game && window.game.effectEngine) {
          window.game.effectEngine.screenShake(10, 0.35);
          window.game.effectEngine.spawnShockwave(this.x, this.y, 180, '#e63946');
          window.game.effectEngine.spawnFloatingText(this.x, this.y - 45, '"주말에 다 나와!"', '#e63946');
          window.game.effectEngine.spawnEmote(this.x, this.y, 'anger', this);
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
          window.game.effectEngine.spawnEmote(this.x, this.y, 'faceAngry', this);
          window.game.effectEngine.spawnFlash(this.x, this.y, 'fx_twirl', '#a855f7', this.radius * 5, 0.6, { spin: 6 });
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

  // 1. 날아다니는 A4 서류 뭉치 (Flying Paper Monster)
  renderPaper(ctx) {
    const wobble = Math.sin(this.animTimer) * 4;
    const flap = Math.cos(this.animTimer * 1.5) * 0.15;

    ctx.save();
    ctx.rotate(flap);

    // 3단 레이어 날갯짓 서류
    // 뒷장 그림자 서류
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-10, -13 + wobble, 18, 24);

    // 중간장
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-8, -12 + wobble * 0.8, 18, 24);

    // 앞장 (메인 고해상도 서류)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(-9, -14 + wobble, 18, 25, [3, 6, 2, 2]); // 우상단 종이 접힘
    ctx.fill();
    ctx.shadowBlur = 0;

    // 접힌 우상단 모서리
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(4, -14 + wobble);
    ctx.lineTo(9, -9 + wobble);
    ctx.lineTo(4, -9 + wobble);
    ctx.closePath();
    ctx.fill();

    // 텍스트 라인 & 표 구조
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-6, -8 + wobble, 10, 1.5);
    ctx.fillRect(-6, -4 + wobble, 12, 1.5);
    ctx.fillRect(-6, 0 + wobble, 8, 1.5);

    // 붉은 결재 반려 도장 (REJECT)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-7, 3 + wobble, 14, 7);
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 6.5px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('반려', 0, 8.5 + wobble);

    ctx.restore();
  }

  // 2. 엑셀 수식 슬라임 (Excel Error Slime)
  renderSlime(ctx) {
    const squish = Math.sin(this.animTimer) * 0.12;
    const r = this.radius;

    // 투명 에메랄드 젤리 본체
    const grad = ctx.createRadialGradient(0, -r * 0.3, r * 0.2, 0, 0, r);
    grad.addColorStop(0, '#34d399');
    grad.addColorStop(0.6, '#059669');
    grad.addColorStop(1, '#064e3b');

    ctx.fillStyle = grad;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * (1 + squish), r * (1 - squish), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 엑셀 격자 그리드 라인
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.1);
    ctx.lineTo(r * 0.7, -r * 0.1);
    ctx.moveTo(-r * 0.7, r * 0.3);
    ctx.lineTo(r * 0.7, r * 0.3);
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(0, r * 0.7);
    ctx.stroke();

    // 슬라임 내부 부유 에러 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText('#REF!', 0, r * 0.45);
    ctx.shadowBlur = 0;

    // 반짝이는 큰 눈망울 (초롱초롱 분노 눈)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.25, 4.5, 5.5, -0.1, 0, Math.PI * 2);
    ctx.ellipse(r * 0.35, -r * 0.25, 4.5, 5.5, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // 동공
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.25, 2.5, 0, Math.PI * 2);
    ctx.arc(r * 0.38, -r * 0.25, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 눈 하이라이트
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.32, 1.2, 0, Math.PI * 2);
    ctx.arc(r * 0.33, -r * 0.32, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 볼터치
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.beginPath();
    ctx.arc(-r * 0.55, 0, 2.5, 0, Math.PI * 2);
    ctx.arc(r * 0.55, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 고장난 폭주 복사기 (Broken Runaway Copier)
  renderCopier(ctx) {
    // 본체 (다크 슬레이트 메탈릭)
    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#334155');
    bodyGrad.addColorStop(0.5, '#475569');
    bodyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 32, 5);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 상단 스캐너 글래스 & 네온 레이저 빔
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-12, -12, 24, 8);

    const beamX = -10 + (Math.sin(this.animTimer * 5) + 1) * 0.5 * 20;
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillRect(beamX - 1.5, -12, 3, 8);
    ctx.shadowBlur = 0;

    // 용지 걸림 아코디언 종이
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.lineTo(-6, -2);
    ctx.lineTo(-2, 2);
    ctx.lineTo(2, -2);
    ctx.lineTo(6, 2);
    ctx.lineTo(10, -2);
    ctx.lineTo(10, 4);
    ctx.lineTo(-10, 4);
    ctx.closePath();
    ctx.fill();

    // 경고 사이렌 등 (상단)
    const isBlink = Math.sin(this.animTimer * 6) > 0;
    ctx.fillStyle = isBlink ? '#ef4444' : '#7f1d1d';
    ctx.shadowColor = isBlink ? '#ef4444' : 'transparent';
    ctx.shadowBlur = isBlink ? 12 : 0;
    ctx.beginPath();
    ctx.roundRect(4, -20, 8, 5, [3, 3, 0, 0]);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 전면 배출구
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-12, 8, 24, 5);
  }

  // 4. 슬랙 알림 유령 (Unread Slack Ghost)
  renderSlack(ctx) {
    const floatY = Math.sin(this.animTimer) * 5;
    const wave = Math.sin(this.animTimer * 2) * 3;

    ctx.save();
    ctx.translate(0, floatY);

    // 고스트 실루엣
    const ghostGrad = ctx.createLinearGradient(0, -18, 0, 16);
    ghostGrad.addColorStop(0, 'rgba(238, 242, 255, 0.95)');
    ghostGrad.addColorStop(0.7, 'rgba(199, 210, 254, 0.85)');
    ghostGrad.addColorStop(1, 'rgba(129, 140, 248, 0)');

    ctx.fillStyle = ghostGrad;
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(0, -8, 14, Math.PI, 0);
    ctx.lineTo(14, 10 + wave);
    ctx.quadraticCurveTo(7, 4, 0, 10 - wave);
    ctx.quadraticCurveTo(-7, 4, -14, 10 + wave);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // 슬랙 4색 해시태그 심볼 (#)
    ctx.lineWidth = 2;
    // 빨강
    ctx.strokeStyle = '#e01e5a';
    ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-6, 2); ctx.stroke();
    // 노랑
    ctx.strokeStyle = '#ecb22e';
    ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(6, 2); ctx.stroke();
    // 초록
    ctx.strokeStyle = '#2eb67d';
    ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(4, -4); ctx.stroke();
    // 파랑
    ctx.strokeStyle = '#36c5f0';
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(8, 0); ctx.stroke();

    // 붉은 분노 유령 눈
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(-5, -8, 2.5, 3.5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(5, -8, 2.5, 3.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 상단 플로팅 @99+ 빨간 알림 뱃지
    ctx.fillStyle = '#dc2626';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(2, -26, 18, 12, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 7.5px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('@99+', 11, -17.5);

    ctx.restore();
  }

  // 5. 탕비실 믹스커피 도둑 (Coffee Thief Bandit)
  renderThief(ctx) {
    const legStride = Math.sin(this.animTimer * 2) * 5;

    ctx.save();

    // 발/다리 뜀박질
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, 4, 4, 8 + legStride);
    ctx.fillRect(2, 4, 4, 8 - legStride);

    // 도둑 몸체 (스텔스 후드)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-10, -12, 20, 18, 5);
    ctx.fill();

    // 머리 & 도둑 마스크
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(0, -18, 9, 0, Math.PI * 2);
    ctx.fill();

    // 검은 안대 마스크
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-8, -21, 16, 5);

    // 날카로운 눈빛
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -20, 2, 2.5);
    ctx.fillRect(3, -20, 2, 2.5);

    // 훔친 거대한 맥심 골드 커피믹스 보따리
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(-18, -10, 12, 18, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 튀어나온 노란 커피믹스 스틱들
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-17, -15, 3, 8);
    ctx.fillRect(-13, -17, 3, 9);
    ctx.fillStyle = '#ef4444'; // 빨간 맥심 라벨
    ctx.fillRect(-17, -12, 3, 2);
    ctx.fillRect(-13, -13, 3, 2);

    ctx.restore();
  }

  // 6. 03:00 중간보스: 꼰대 과장 (김과장)
  renderBossManager(ctx) {
    ctx.save();

    // 꼰대 분노 오라 펄스
    const auraPulse = (Math.sin(this.animTimer) + 1) * 0.5;
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.3 + auraPulse * 0.4})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, -10, this.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 양복 수트 (브라운 체크 패턴)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(-20, -10, 40, 32, 6);
    ctx.fill();

    // 와이셔츠 & 줄무늬 넥타이
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-4, -10, 8, 14);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-2, -9, 4, 18);

    // 머리 & 벗겨진 이마 콤보버 머리
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, -24, 14, 0, Math.PI * 2);
    ctx.fill();

    // 콤보버 흑발 머리카락 (가르마)
    ctx.fillStyle = '#1e1e24';
    ctx.beginPath();
    ctx.arc(0, -27, 14.5, Math.PI * 0.9, Math.PI * 1.9);
    ctx.fill();
    // 흩날리는 잔머리
    ctx.fillRect(8, -26, 6, 2);

    // 금테 안경 & 번뜩이는 렌즈
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-11, -26, 8, 6);
    ctx.strokeRect(3, -26, 8, 6);
    ctx.beginPath(); ctx.moveTo(-3, -23); ctx.lineTo(3, -23); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -25, 3, 2);
    ctx.fillRect(6, -25, 3, 2);

    // 오른손: 김이 모락모락 피어나는 'LATTE' 머그잔
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(16, -14, 12, 14, 3);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 6px sans-serif';
    ctx.fillText('LATTE', 22, -6);

    // 모락모락 커피 김 (스팀)
    const steamY = Math.sin(this.animTimer * 3) * 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, -16);
    ctx.quadraticCurveTo(24, -20 + steamY, 20, -25);
    ctx.stroke();

    // 왼손: 두꺼운 파란색 결재 서류철 바인더
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-28, -12, 10, 22);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-26, -9, 6, 16);

    ctx.restore();
  }

  // 7. 07:00 엘리트보스: 분노의 부장님 (박부장)
  renderBossDirector(ctx) {
    ctx.save();

    // 붉은 화염 분노 아우라
    const firePulse = Math.sin(this.animTimer * 4) * 4;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(0, -12, this.radius + 8 + firePulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 네이비 스트라이프 최고급 수트
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-26, -14, 52, 42, 8);
    ctx.fill();

    // 골드 단추
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, -4, 2.5, 0, Math.PI * 2);
    ctx.arc(0, 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 새빨간 파워 넥타이
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-4, -14); ctx.lineTo(0, 16); ctx.lineTo(4, -14);
    ctx.fill();

    // 얼굴 (분노로 붉게 달아오름)
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(0, -32, 18, 0, Math.PI * 2);
    ctx.fill();

    // 이마에 솟아오른 분노 핏줄 마크 (💢)
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, -44); ctx.lineTo(-6, -40); ctx.lineTo(-10, -36);
    ctx.stroke();

    // 핏발 선 불타는 눈 & 일자 눈썹
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(-6, -34, 3.5, 0, Math.PI * 2);
    ctx.arc(6, -34, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 거대한 최고급 가죽 결재 서류가방 (무기화)
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-38, -12, 16, 28, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd700'; // 황금 버클
    ctx.fillRect(-32, -2, 4, 6);

    ctx.restore();
  }

  // 8. 10:00 최종보스: 철야 지시 대표이사 (CEO)
  renderBossCEO(ctx) {
    ctx.save();

    // 보라색 패왕의 암흑 소용돌이 오라
    const rot = performance.now() * 0.002;
    ctx.save();
    ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;

    // 프리미엄 블랙 턱시도 & 순금 라펠
    ctx.fillStyle = '#050508';
    ctx.beginPath();
    ctx.roundRect(-32, -18, 64, 52, 10);
    ctx.fill();

    // 순금 깃 라펠
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-24, -18); ctx.lineTo(-6, 12); ctx.lineTo(-2, -18);
    ctx.moveTo(24, -18); ctx.lineTo(6, 12); ctx.lineTo(2, -18);
    ctx.fill();

    // 순백 와이셔츠 & 보타이
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -18, 8, 14);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-6, -16, 12, 4);

    // 품격 있는 은발 포마드 헤어
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, -38, 20, 0, Math.PI * 2);
    ctx.fill();

    // 금테 틴트 선글라스
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-16, -42, 32, 8);
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 8;
    ctx.fillRect(-14, -40, 12, 5);
    ctx.fillRect(2, -40, 12, 5);
    ctx.shadowBlur = 0;

    // 오른손: 번개 불꽃을 뿜는 황금 만년필
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;
    ctx.fillRect(28, -20, 6, 24);
    ctx.beginPath();
    ctx.moveTo(28, -20); ctx.lineTo(31, -28); ctx.lineTo(34, -20);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 왼손: 붉은 도장이 찍힌 '사직서 반려' 통지서
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-44, -16, 16, 26);
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 6.5px sans-serif';
    ctx.fillText('사직반려', -36, -3);

    // 머리 위 절대 권력 황금 왕관 (👑)
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(-14, -58);
    ctx.lineTo(-10, -66);
    ctx.lineTo(-4, -60);
    ctx.lineTo(0, -68);
    ctx.lineTo(4, -60);
    ctx.lineTo(10, -66);
    ctx.lineTo(14, -58);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

class MonsterManager {
  constructor() {
    this.monsters = [];
    this.enemyBullets = [];
    this.warningZones = [];
    this.spawnTimer = 0;
    this.currentStage = null;
    this.stageBossSpawned = false;
  }

  reset() {
    this.monsters = [];
    this.enemyBullets = [];
    this.warningZones = [];
    this.spawnTimer = 0;
    this.stageBossSpawned = false;
    this.boss1Spawned = false;
    this.boss2Spawned = false;
    this.boss3Spawned = false;
    this.event1Spawned = false;
    this.event2Spawned = false;
    this.event3Spawned = false;
  }

  setStage(stageDef) {
    this.currentStage = stageDef;
    this.reset();
  }

  spawnChildSlimes(x, y) {
    for (let i = 0; i < 2; i++) {
      const child = new Monster('slime', x + (i === 0 ? -15 : 15), y, 0.6);
      child.hp = Math.floor(child.maxHp * 0.4);
      this.monsters.push(child);
    }
  }

  spawnEnemyBullet(x, y, vx, vy, atk, color = '#38bdf8', sprite = null) {
    this.enemyBullets.push({
      x, y, vx, vy, atk, color, sprite,
      radius: sprite ? 9 : 6,
      rot: Math.random() * Math.PI * 2,
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

    let spawnInterval = 1.4;
    if (this.currentStage) {
      const elapsed = this.currentStage.duration - gameTime;
      const rateMul = this.currentStage.spawnRate || 1.0;
      spawnInterval = Math.max(0.5, (1.6 / rateMul) - (elapsed / this.currentStage.duration) * 0.6);
    } else {
      spawnInterval = Math.max(0.4, 1.8 - ((600 - gameTime) / 600) * 1.3);
    }

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnWave(player, gameTime);
    }

    // 2. 보스 및 돌발 이벤트 시간대 체크
    if (this.currentStage) {
      this.checkStageBossTimeline(gameTime, player, effectEngine);
    } else {
      this.checkBossTimeline(gameTime, player, effectEngine);
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
          effectEngine.spawnExplosion(wz.x, wz.y, wz.radius * 2.6, 0.55);
          effectEngine.spawnDecal(wz.x, wz.y, wz.radius * 2.2, '#1f2937', 'fx_scorch', 5);
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

  checkStageBossTimeline(gameTime, player, effectEngine) {
    if (!this.currentStage || !player) return;

    const elapsed = this.currentStage.duration - gameTime;

    // 스테이지 보스가 지정되어 있고 보스 스폰 시간에 도달했을 때
    if (this.currentStage.boss && !this.stageBossSpawned && elapsed >= (this.currentStage.bossTime || 40)) {
      this.stageBossSpawned = true;
      const bKey = this.currentStage.boss;
      const bDef = window.GAME_DATA.MONSTERS[bKey];

      if (effectEngine) {
        effectEngine.spawnEventBanner(`⚠️ [결재선 보스 출현] ${bDef ? bDef.name : '상사 등장'}!`, bDef ? bDef.title : '결재판을 지키세요!', '#ff2255');
        effectEngine.screenShake(12, 0.5);
      }
      if (window.soundEngine) window.soundEngine.playBossAlert();

      const ang = Math.random() * Math.PI * 2;
      const boss = new Monster(bKey, player.x + Math.cos(ang) * 260, player.y + Math.sin(ang) * 260);
      this.monsters.push(boss);
      if (effectEngine) effectEngine.spawnEmote(boss.x, boss.y, 'exclamation', boss);
    }
  }

  checkBossTimeline(gameTime, player, effectEngine) {
    const elapsed = 600 - gameTime;

    // 돌발 이벤트 1: 08:30 (경과 90초) - 엑셀 대참사 (#REF! 슬라임 떼 소환)
    if (elapsed >= 90 && !this.event1Spawned && player) {
      this.event1Spawned = true;
      if (effectEngine) {
        effectEngine.spawnEventBanner('🚨 [돌발 업무] 전사 엑셀 #REF! 오류 대참사!', '증식하는 수식 슬라임 떼가 몰려옵니다!', '#10b981');
        effectEngine.screenShake(10, 0.4);
      }
      if (window.soundEngine) window.soundEngine.playBossAlert();
      for (let i = 0; i < 14; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 320 + Math.random() * 80;
        this.monsters.push(new Monster('slime', player.x + Math.cos(ang) * dist, player.y + Math.sin(ang) * dist));
      }
    }

    // 보스 1: 07:00 (경과 180초) - 꼰대 과장 출현
    if (elapsed >= 180 && !this.boss1Spawned) {
      this.boss1Spawned = true;
      this.spawnBoss('boss_manager');
    }

    // 돌발 이벤트 2: 05:30 (경과 270초) - 탕비실 커피 도둑들의 습격
    if (elapsed >= 270 && !this.event2Spawned && player) {
      this.event2Spawned = true;
      if (effectEngine) {
        effectEngine.spawnEventBanner('🚨 [돌발 업무] 탕비실 간식 도둑들의 총공격!', '빠른 도둑들을 소탕하고 황금 원두를 쟁탈하세요!', '#f59e0b');
        effectEngine.screenShake(10, 0.4);
      }
      if (window.soundEngine) window.soundEngine.playBossAlert();
      for (let i = 0; i < 10; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 340 + Math.random() * 80;
        const thief = new Monster('thief', player.x + Math.cos(ang) * dist, player.y + Math.sin(ang) * dist, 1.1);
        thief.speed *= 1.25;
        this.monsters.push(thief);
      }
    }

    // 보스 2: 04:00 (경과 360초) - 분노의 부장님 출현
    if (elapsed >= 360 && !this.boss2Spawned) {
      this.boss2Spawned = true;
      this.spawnBoss('boss_director');
    }

    // 돌발 이벤트 3: 02:30 (경과 450초) - 폭주 복사기 융단 폭격
    if (elapsed >= 450 && !this.event3Spawned && player) {
      this.event3Spawned = true;
      if (effectEngine) {
        effectEngine.spawnEventBanner('🚨 [돌발 업무] 전층 복사기 과열 폭주 발생!', '사방에서 날아오는 토너 탄막을 회피하세요!', '#a855f7');
        effectEngine.screenShake(12, 0.5);
      }
      if (window.soundEngine) window.soundEngine.playBossAlert();
      for (let i = 0; i < 8; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 350 + Math.random() * 80;
        this.monsters.push(new Monster('copier', player.x + Math.cos(ang) * dist, player.y + Math.sin(ang) * dist, 1.2));
      }
    }

    // 보스 3: 01:00 (경과 540초) - 최종 보스 대표이사 출현
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
    if (window.game && window.game.effectEngine) window.game.effectEngine.spawnEmote(bx, by, 'exclamation', boss);
  }

  spawnWave(player, gameTime) {
    // 동시 존재 몬스터 상한 (프레임 드랍 방지)
    const room = MonsterManager.MAX_MONSTERS - this.monsters.length;
    if (room <= 0) return;

    let pool;
    let spawnCount;

    if (this.currentStage) {
      // 스테이지 모드: 스테이지 고유 몬스터 구성 + 스테이지 진행률 기반 물량
      const st = this.currentStage;
      const progress = Math.min(1, (st.duration - gameTime) / st.duration);
      pool = st.monsters || ['paper'];
      spawnCount = Math.min(14, Math.round((2 + progress * 6) * (st.spawnRate || 1.0)));
    } else {
      // 10분 서바이벌 모드: 경과 시간에 따라 몬스터 종류 해금
      const elapsed = 600 - gameTime;
      pool = ['paper'];
      if (elapsed > 40) pool.push('slime');
      if (elapsed > 90) pool.push('copier');
      if (elapsed > 150) pool.push('slack');
      if (elapsed > 240) pool.push('thief');
      spawnCount = Math.min(18, 3 + Math.floor(elapsed / 30));
    }

    spawnCount = Math.min(spawnCount, room);
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

      // 스프라이트 탄환 (반려 서류 등)
      if (b.sprite && window.assets) {
        b.rot += 0.15;
        window.assets.draw(ctx, 'fx_glow', sx, sy, 44, 44, { color: b.color, alpha: 0.7, blend: 'lighter' });
        if (window.assets.draw(ctx, b.sprite, sx, sy, 24, 24, { rot: b.rot })) return;
      }

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

MonsterManager.MAX_MONSTERS = 160;

window.Monster = Monster;
window.MonsterManager = MonsterManager;
