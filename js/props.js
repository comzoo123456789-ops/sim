// Office Escape Survivor - Breakable Office Props, Partitions & Environment Interaction Engine

class OfficeProp {
  constructor(type, x, y) {
    this.type = type; // 'water_purifier', 'vending_machine', 'copier', 'cabinet'
    this.x = x;
    this.y = y;
    this.isAlive = true;
    this.hitTimer = 0;
    this.animTimer = Math.random() * 10;

    switch (type) {
      case 'water_purifier':
        this.name = '얼음 냉정수기';
        this.maxHp = 60;
        this.width = 36;
        this.height = 48;
        this.radius = 22;
        this.color = '#38bdf8';
        break;
      case 'vending_machine':
        this.name = '심야 캔음료 자판기';
        this.maxHp = 140;
        this.width = 46;
        this.height = 64;
        this.radius = 28;
        this.color = '#f59e0b';
        break;
      case 'copier':
        this.name = '과열된 복사기';
        this.maxHp = 90;
        this.width = 44;
        this.height = 42;
        this.radius = 24;
        this.color = '#a855f7';
        break;
      case 'cabinet':
      default:
        this.name = '철제 서류 캐비닛';
        this.maxHp = 70;
        this.width = 38;
        this.height = 44;
        this.radius = 22;
        this.color = '#64748b';
        break;
    }

    this.hp = this.maxHp;
  }

  takeDamage(amount) {
    if (!this.isAlive) return;
    this.hp -= amount;
    this.hitTimer = 0.15;

    if (window.game && window.game.effectEngine) {
      window.game.effectEngine.spawnHitSpark(this.x, this.y, this.color);
      window.game.effectEngine.spawnFloatingText(this.x, this.y - 20, `${amount}`, '#e2e8f0');
    }

    if (this.hp <= 0) {
      this.destroy();
    }
  }

  destroy() {
    this.isAlive = false;
    this.hp = 0;

    if (window.soundEngine) window.soundEngine.playHit();

    if (window.game && window.game.effectEngine) {
      window.game.effectEngine.screenShake(6, 0.25);
      window.game.effectEngine.spawnShockwave(this.x, this.y, 60, this.color);

      // 잔해 파티클 생성
      for (let i = 0; i < 12; i++) {
        window.game.effectEngine.spawnHitSpark(this.x, this.y, this.color);
      }
    }

    // 아이템 드랍
    if (window.game && window.game.dropMgr) {
      switch (this.type) {
        case 'water_purifier':
          // 냉음료 (체력 40 회복)
          window.game.dropMgr.spawnDrop(this.x, this.y, 'aid_kit', 1);
          if (Math.random() < 0.5) {
            window.game.dropMgr.spawnDrop(this.x + 10, this.y, 'super_coffee', 25);
          }
          break;

        case 'vending_machine':
          // 카페인 폭탄(화면 클리어) or 대량 영수증
          if (Math.random() < 0.4) {
            window.game.dropMgr.spawnDrop(this.x, this.y, 'caffeine_bomb', 1);
          } else {
            window.game.dropMgr.spawnDrop(this.x, this.y, 'receipt', 150);
            window.game.dropMgr.spawnDrop(this.x + 12, this.y, 'super_coffee', 40);
          }
          break;

        case 'copier':
          // 대량 황금 커피콩 (+400 XP)
          window.game.dropMgr.spawnDrop(this.x, this.y, 'super_coffee', 80);
          window.game.dropMgr.spawnDrop(this.x - 10, this.y, 'coffee_bean', 30);
          window.game.dropMgr.spawnDrop(this.x + 10, this.y, 'coffee_bean', 30);
          break;

        case 'cabinet':
          // 자석 클립 (모든 드랍 자석 흡입) or 골드
          if (Math.random() < 0.4) {
            window.game.dropMgr.spawnDrop(this.x, this.y, 'magnet_clip', 1);
          } else {
            window.game.dropMgr.spawnDrop(this.x, this.y, 'receipt', 80);
            window.game.dropMgr.spawnDrop(this.x + 10, this.y, 'coffee_bean', 40);
          }
          break;
      }
    }
  }

  update(dt) {
    if (!this.isAlive) return;
    if (this.hitTimer > 0) this.hitTimer -= dt;
    this.animTimer += dt;
  }

  render(ctx, camera) {
    if (!this.isAlive) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    if (this.hitTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
      return;
    }

    // 바닥 접지 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, this.height / 2 + 2, this.width / 2 + 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (this.type) {
      case 'water_purifier':
        this.renderWaterPurifier(ctx);
        break;
      case 'vending_machine':
        this.renderVendingMachine(ctx);
        break;
      case 'copier':
        this.renderCopier(ctx);
        break;
      case 'cabinet':
      default:
        this.renderCabinet(ctx);
        break;
    }

    // 체력바 표시 (피격 시)
    if (this.hp < this.maxHp) {
      const barW = this.width;
      const barH = 4;
      const barY = -this.height / 2 - 8;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barW / 2, barY, barW, barH);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-barW / 2, barY, barW * (this.hp / this.maxHp), barH);
    }

    ctx.restore();
  }

  renderWaterPurifier(ctx) {
    const w = this.width;
    const h = this.height;

    // 본체 (메탈 화이트)
    const bodyGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    bodyGrad.addColorStop(0, '#cbd5e1');
    bodyGrad.addColorStop(0.5, '#f8fafc');
    bodyGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.fill();

    // 상단 물통 (투명 블루 글래스)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, 14, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 물결 애니메이션
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w / 2 + 8, -h / 2 + 8, (w - 16) * 0.4, 2);

    // 출수구 (온/냉 레버)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-6, -2, 4, 8);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(2, -2, 4, 8);

    // 물받침대
    ctx.fillStyle = '#475569';
    ctx.fillRect(-w / 2 + 4, 10, w - 8, 4);
  }

  renderVendingMachine(ctx) {
    const w = this.width;
    const h = this.height;

    // 본체 (진한 네이비/메탈릭)
    const bodyGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    bodyGrad.addColorStop(0, '#1e293b');
    bodyGrad.addColorStop(0.5, '#334155');
    bodyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.fill();

    // 음료 쇼케이스 유리창
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-w / 2 + 5, -h / 2 + 6, w - 10, 28);

    // 진열된 미니 캔 음료들
    const canColors = ['#ef4444', '#eab308', '#22c55e', '#3b82f6'];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle = canColors[(col + row) % canColors.length];
        ctx.fillRect(-w / 2 + 8 + col * 8, -h / 2 + 9 + row * 12, 6, 9);
      }
    }

    // 전면 배출구 및 버튼 패널
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 4;
    ctx.fillRect(-w / 2 + 6, 8, 10, 4); // 금액 표시창
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#020617';
    ctx.fillRect(-w / 2 + 6, 16, w - 12, 12); // 캔 배출구
  }

  renderCopier(ctx) {
    const w = this.width;
    const h = this.height;

    // 본체 (오피스 그레이)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.fill();

    // 상단 스캐너 유리판
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, 12);
    ctx.shadowBlur = 0;

    // 스캐너 빛나는 빔 애니메이션
    const beamX = -w / 2 + 6 + (Math.sin(this.animTimer * 4) + 1) * 0.5 * (w - 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(beamX, -h / 2 + 4, 3, 12);

    // 용지 배출 트레이 및 서류
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-w / 2 + 6, 4, 16, 6);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-w / 2 + 6, 12, w - 12, 4);
  }

  renderCabinet(ctx) {
    const w = this.width;
    const h = this.height;

    // 본체 (스틸 슬레이트)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 4);
    ctx.fill();

    // 3단 서랍 분할선 및 크롬 손잡이
    for (let i = 0; i < 3; i++) {
      const dy = -h / 2 + 4 + i * 13;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-w / 2 + 3, dy, w - 6, 11);

      // 손잡이
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-6, dy + 4, 12, 3);
    }
  }
}

class OfficeObstacle {
  constructor(x, y, width, height, type = 'partition') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'partition', 'meeting_wall', 'desk_cluster'
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, this.height, this.width, 6);

    if (this.type === 'partition') {
      // 오피스 블루 파티션 벽
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, this.width, this.height);

      // 패브릭 질감 스트라이프
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 8; i < this.width; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, this.height);
        ctx.stroke();
      }
    } else if (this.type === 'meeting_wall') {
      // 회의실 유리 파티션 벽
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, this.width, this.height);

      // 네온 유리 반사선
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(this.width - 10, this.height);
      ctx.stroke();
    } else {
      // 책상 군집
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }
}

class OfficePropManager {
  constructor() {
    this.props = [];
    this.obstacles = [];
  }

  reset() {
    this.props = [];
    this.obstacles = [];
    this.generateMapLayout();
  }

  generateMapLayout() {
    const mapSize = 2400;
    const propTypes = ['water_purifier', 'vending_machine', 'copier', 'cabinet'];

    // 1. 파괴 가능한 인터랙션 오피스 오브젝트 분산 배치
    for (let i = 0; i < 48; i++) {
      const type = propTypes[i % propTypes.length];
      const px = 150 + Math.random() * (mapSize - 300);
      const py = 150 + Math.random() * (mapSize - 300);

      // 시작 지점(1200, 1200) 근처 150px 이내는 비움
      if (Math.hypot(px - 1200, py - 1200) > 150) {
        this.props.push(new OfficeProp(type, px, py));
      }
    }

    // 2. 오피스 파티션 및 회의실 벽 배치
    // 회의실 4개 (A, B, C, D 룸)
    const rooms = [
      { x: 400, y: 400, w: 280, h: 200, type: 'meeting_wall' },
      { x: 1700, y: 400, w: 280, h: 200, type: 'meeting_wall' },
      { x: 400, y: 1700, w: 280, h: 200, type: 'meeting_wall' },
      { x: 1700, y: 1700, w: 280, h: 200, type: 'meeting_wall' },
    ];

    rooms.forEach(r => {
      // 상하좌우 벽 (입구 뚫림)
      this.obstacles.push(new OfficeObstacle(r.x, r.y, r.w, 16, r.type)); // 상
      this.obstacles.push(new OfficeObstacle(r.x, r.y, 16, r.h, r.type)); // 좌
      this.obstacles.push(new OfficeObstacle(r.x + r.w - 16, r.y, 16, r.h, r.type)); // 우
      this.obstacles.push(new OfficeObstacle(r.x, r.y + r.h - 16, r.w * 0.6, 16, r.type)); // 하단(출입구 제외)
    });

    // 중앙 파티션 기둥들
    for (let x = 600; x <= 1800; x += 400) {
      for (let y = 600; y <= 1800; y += 400) {
        if (Math.hypot(x - 1200, y - 1200) > 200) {
          this.obstacles.push(new OfficeObstacle(x - 40, y - 6, 80, 12, 'partition'));
        }
      }
    }
  }

  update(dt) {
    this.props.forEach(p => p.update(dt));
  }

  // 충돌 해결 (플레이어 및 몬스터가 벽에 걸리지 않고 미끄러지도록 처리)
  resolveCollisions(entity) {
    const r = entity.radius || 16;

    this.obstacles.forEach(obs => {
      const nearestX = Math.max(obs.x, Math.min(entity.x, obs.x + obs.width));
      const nearestY = Math.max(obs.y, Math.min(entity.y, obs.y + obs.height));
      const distX = entity.x - nearestX;
      const distY = entity.y - nearestY;
      const dist = Math.hypot(distX, distY);

      if (dist < r && dist > 0) {
        const overlap = r - dist;
        entity.x += (distX / dist) * overlap;
        entity.y += (distY / dist) * overlap;
      }
    });
  }

  render(ctx, camera) {
    const viewL = camera.x - 100;
    const viewR = camera.x + window.innerWidth + 100;
    const viewT = camera.y - 100;
    const viewB = camera.y + window.innerHeight + 100;

    // 장애물 렌더링
    this.obstacles.forEach(obs => {
      if (obs.x + obs.width >= viewL && obs.x <= viewR && obs.y + obs.height >= viewT && obs.y <= viewB) {
        obs.render(ctx, camera);
      }
    });

    // 인터랙션 오브젝트 렌더링
    this.props.forEach(p => {
      if (p.isAlive && p.x >= viewL && p.x <= viewR && p.y >= viewT && p.y <= viewB) {
        p.render(ctx, camera);
      }
    });
  }
}

window.OfficePropManager = OfficePropManager;
