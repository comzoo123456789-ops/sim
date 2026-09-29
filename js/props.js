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
        this.name = '탕비실 소형 냉장고';
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
        this.name = '과열된 문서 세단기';
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
      window.game.effectEngine.spawnFloatingText(this.x, this.y - 20, `${Math.round(amount)}`, '#e2e8f0');
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

      // 잔해 파티클 + 폭발 + 연기
      for (let i = 0; i < 12; i++) {
        window.game.effectEngine.spawnHitSpark(this.x, this.y, this.color);
      }
      window.game.effectEngine.spawnExplosion(this.x, this.y, this.width * 2.6, 0.55);
      window.game.effectEngine.spawnPuff(this.x, this.y - 10, this.width * 2, '#94a3b8', 0.8, 0.6);
      window.game.effectEngine.spawnDecal(this.x, this.y, this.width * 1.8, '#111827', 'fx_scorch', 8);
    }

    if (window.saveMgr) {
      window.saveMgr.data.totalPropsDestroyed = (window.saveMgr.data.totalPropsDestroyed || 0) + 1;
      if (window.saveMgr.data.totalPropsDestroyed >= 20) {
        window.saveMgr.checkAchievement('ach_props_20', true);
      }
      window.saveMgr.save();
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

    // 오피스 스프라이트 (발 위치 = 충돌 박스 하단)
    const spriteKey = OfficeProp.SPRITES[this.type];
    const a = window.assets;
    if (spriteKey && a && a.atlasReady()) {
      const f = a.atlasMeta.frames[spriteKey.key];
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, this.height / 2, this.width * 0.7, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      const shake = this.hitTimer > 0 ? (Math.random() - 0.5) * 4 : 0;
      a.drawSprite(ctx, spriteKey.key, shake, this.height / 2 + 4, spriteKey.s, { flash: this.hitTimer > 0 ? 0.7 : 0 });
      this.renderHpBar(ctx, -(f.ay * spriteKey.s) + this.height / 2 - 6);
      ctx.restore();
      return;
    }

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

    this.renderHpBar(ctx, -this.height / 2 - 8);
    ctx.restore();
  }

  // 체력바 (피격 후에만 표시)
  renderHpBar(ctx, barY) {
    if (this.hp < this.maxHp) {
      const barW = this.width;
      const barH = 4;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barW / 2, barY, barW, barH);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-barW / 2, barY, barW * (this.hp / this.maxHp), barH);
    }
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
    ctx.fillRect(-w / 2 + 6, 8, 10, 4);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#020617';
    ctx.fillRect(-w / 2 + 6, 16, w - 12, 12);
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
  constructor(x, y, width, height, type = 'partition', opts = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.back = opts.back || [];   // 본체보다 먼저 그리는 스프라이트 (의자 등 뒤쪽)
    this.front = opts.front || []; // 본체 위에 그리는 스프라이트
    this.flat = type === 'meeting_wall';
    // partition, meeting_wall, desk_cluster, server_rack, cafe_table, exec_desk, meeting_table, counter, plant
    this.type = type;
    this.seed = Math.floor(x * 7 + y * 13);
  }

  // 깊이 정렬 기준선 (발자국 하단)
  get baseline() {
    return this.y + this.height;
  }

  drawSprites(ctx, camera, list, alpha) {
    const a = window.assets;
    if (!a || !a.atlasReady()) return false;
    list.forEach(p => a.drawSprite(ctx, 'prop_' + p.key, p.x - camera.x, p.y - camera.y, p.s, { flip: p.flip, alpha }));
    return true;
  }

  // 플레이어가 가구 뒤에 있으면 반투명 처리 (가려져도 위치 파악 가능)
  occlusionAlpha() {
    const p = window.game && window.game.player;
    if (!p || this.flat) return 1;
    const behind = p.y < this.baseline && p.y > this.y - 90 && p.x > this.x - 20 && p.x < this.x + this.width + 20;
    return behind ? 0.55 : 1;
  }

  render(ctx, camera) {
    const alpha = this.occlusionAlpha();
    if (this.type === 'composite') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(this.x + this.width / 2 - camera.x, this.baseline - 4 - camera.y, this.width * 0.55, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      if (this.drawSprites(ctx, camera, this.back, alpha) && this.drawSprites(ctx, camera, this.front, alpha)) return;
    }
    if (this.back.length) this.drawSprites(ctx, camera, this.back, alpha);

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.translate(sx, sy);

    // 바닥 그림자
    if (this.type !== 'meeting_wall') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.roundRect(4, 6, w, h, 8);
      ctx.fill();
    }

    switch (this.type) {
      case 'partition': this.renderPartition(ctx, w, h); break;
      case 'meeting_wall': this.renderGlassWall(ctx, w, h); break;
      case 'server_rack': this.renderServerRack(ctx, w, h); break;
      case 'cafe_table': this.renderCafeTable(ctx, w, h); break;
      case 'exec_desk': this.renderExecDesk(ctx, w, h); break;
      case 'meeting_table': this.renderMeetingTable(ctx, w, h); break;
      case 'counter': this.renderCounter(ctx, w, h); break;
      case 'plant': this.renderPlant(ctx, w, h); break;
      case 'composite':
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 6);
        ctx.fill();
        break;
      default: this.renderDesk(ctx, w, h); break;
    }

    ctx.restore();
  }

  // 패브릭 파티션 + 알루미늄 캡
  renderPartition(ctx, w, h) {
    ctx.fillStyle = '#3b4659';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 4; i < w; i += 5) ctx.fillRect(i, 2, 1, h - 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, w, 2);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, h - 2, w, 2);
  }

  // 회의실 유리벽 (반투명 + 프로스트 띠)
  renderGlassWall(ctx, w, h) {
    ctx.fillStyle = 'rgba(148, 197, 255, 0.14)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(226, 238, 255, 0.18)';
    if (w > h) ctx.fillRect(0, h * 0.35, w, h * 0.3); else ctx.fillRect(w * 0.35, 0, w * 0.3, h);
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
    ctx.fillStyle = '#64748b';
    const step = 70;
    if (w > h) { for (let i = 0; i <= w; i += step) ctx.fillRect(Math.min(i, w - 3), 0, 3, h); }
    else { for (let i = 0; i <= h; i += step) ctx.fillRect(0, Math.min(i, h - 3), w, 3); }
  }

  // 오픈 오피스 2인 책상 + 의자 + 모니터 (Kenney 아이템)
  renderDesk(ctx, w, h) {
    // 의자 (책상 아래쪽)
    ctx.fillStyle = '#111827';
    [w * 0.3, w * 0.7].forEach(cx => {
      ctx.beginPath();
      ctx.roundRect(cx - 11, h - 4, 22, 18, 6);
      ctx.fill();
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.roundRect(cx - 9, h + 8, 18, 6, 3);
      ctx.fill();
      ctx.fillStyle = '#111827';
    });

    // 상판 (라이트 오크)
    ctx.fillStyle = '#8b6b4a';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 5);
    ctx.fill();
    ctx.fillStyle = '#a07e58';
    ctx.beginPath();
    ctx.roundRect(1.5, 1.5, w - 3, h - 6, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(w / 2 - 0.5, 2, 1, h - 6);

    const a = window.assets;
    if (a && a.get('item_monitor')) {
      a.draw(ctx, 'fx_glow', w * 0.5, h * 0.3, w * 1.1, h, { color: '#38bdf8', alpha: 0.28, blend: 'lighter' });
      a.draw(ctx, 'item_monitor', w * 0.3, h * 0.34, 30, 30);
      a.draw(ctx, 'item_monitor_wide', w * 0.7, h * 0.34, 30, 30);
      a.draw(ctx, 'item_keyboard', w * 0.3, h * 0.72, 26, 26);
      a.draw(ctx, 'item_keyboard', w * 0.7, h * 0.72, 26, 26);
      a.draw(ctx, 'item_mug', w * 0.92, h * 0.7, 13, 13);
      a.draw(ctx, 'item_memo', w * 0.08, h * 0.68, 14, 14, { rot: -0.3 });
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(w * 0.15, 8, w * 0.3, 14);
      ctx.fillRect(w * 0.55, 8, w * 0.3, 14);
    }
  }

  // 전산실 서버 랙 2대 (LED 점멸)
  renderServerRack(ctx, w, h) {
    const t = performance.now() / 1000;
    const rackW = (w - 6) / 2;
    for (let r = 0; r < 2; r++) {
      const rx = r * (rackW + 6);
      ctx.fillStyle = '#0b1220';
      ctx.beginPath();
      ctx.roundRect(rx, 0, rackW, h, 4);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      for (let u = 0; u < 5; u++) {
        const uy = 6 + u * ((h - 12) / 5);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(rx + 4, uy, rackW - 8, (h - 12) / 5 - 3);
        for (let l = 0; l < 3; l++) {
          const on = Math.sin(t * (3 + l) + this.seed + u * 1.7 + r * 3) > 0.2;
          ctx.fillStyle = on ? (l === 2 ? '#f59e0b' : '#22d3ee') : '#0f2530';
          ctx.fillRect(rx + rackW - 10 - l * 5, uy + 3, 3, 3);
        }
      }
    }
    ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
    ctx.fillRect(0, h - 3, w, 3);
  }

  // 탕비실 원형 카페 테이블 + 의자 4개
  renderCafeTable(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    ctx.fillStyle = '#1c1917';
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(cx + dx * (w / 2 - 6), cy + dy * (h / 2 + 4), 9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#e7e0d6';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.36, h * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 2;
    ctx.stroke();
    const a = window.assets;
    if (a) {
      a.draw(ctx, 'item_mug', cx - 12, cy - 4, 16, 16);
      a.draw(ctx, 'item_tumbler', cx + 12, cy + 2, 16, 16);
    }
  }

  // 임원실 월넛 책상 + 가죽 의자 + 서류
  renderExecDesk(ctx, w, h) {
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 16, -14, 32, 20, 8);
    ctx.fill();

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#5b3a24');
    g.addColorStop(1, '#3f2716');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const a = window.assets;
    if (a && a.get('item_monitor')) {
      a.draw(ctx, 'item_monitor_wide', w * 0.5, h * 0.36, 32, 32);
      a.draw(ctx, 'item_folder', w * 0.18, h * 0.6, 20, 20, { rot: 0.2 });
      a.draw(ctx, 'item_document', w * 0.82, h * 0.6, 18, 18, { rot: -0.25 });
    }
  }

  // 회의실 테이블 + 의자
  renderMeetingTable(ctx, w, h) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(4, 8, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(4, h - 6, w - 8, 3, 2);
    ctx.fill();
    const a = window.assets;
    if (a) {
      a.draw(ctx, 'item_document', w * 0.3, h * 0.5, 16, 16, { rot: 0.4 });
      a.draw(ctx, 'item_memo', w * 0.55, h * 0.45, 14, 14);
      a.draw(ctx, 'item_mug', w * 0.78, h * 0.5, 13, 13);
    }
  }

  // 탕비실 주방 카운터 (싱크 / 커피머신 / 냉장고)
  renderCounter(ctx, w, h) {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, h - 8);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, h - 8, w, 8);

    // 싱크
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.roundRect(w * 0.18, 8, 60, h - 22, 6); ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.roundRect(w * 0.18 + 4, 12, 52, h - 30, 4); ctx.fill();

    // 커피머신
    ctx.fillStyle = '#1f2937';
    ctx.beginPath(); ctx.roundRect(w * 0.42, 4, 44, h - 14, 5); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(w * 0.42 + 8, 10, 6, 4);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(w * 0.42 + 18, 10, 6, 4);

    // 냉장고
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath(); ctx.roundRect(w - 70, -6, 60, h + 2, 5); ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(w - 20, 6, 3, h - 20);

    const a = window.assets;
    if (a) {
      a.draw(ctx, 'item_mug', w * 0.62, h * 0.4, 16, 16);
      a.draw(ctx, 'item_mug', w * 0.66, h * 0.45, 16, 16);
      a.draw(ctx, 'item_tumbler', w * 0.72, h * 0.4, 18, 18);
    }
  }

  // 사무실 화분
  renderPlant(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.36, 0, Math.PI * 2);
    ctx.fill();
    const leaves = ['#15803d', '#16a34a', '#22c55e'];
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2 + this.seed;
      const r = w * 0.32;
      ctx.fillStyle = leaves[i % 3];
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(ang) * r * 0.55, cy + Math.sin(ang) * r * 0.55, r * 0.55, r * 0.28, ang, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.12, 0, Math.PI * 2);
    ctx.fill();
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

  // 사각형 겹침 검사 (여백 포함)
  overlapsObstacle(x, y, w, h, pad = 20) {
    return this.obstacles.some(o => x < o.x + o.width + pad && x + w + pad > o.x && y < o.y + o.height + pad && y + h + pad > o.y);
  }

  // 회의실(출입구 앞 여백 포함)과 겹치는지 검사
  overlapsRoom(x, y, w, h, pad = 40) {
    return OfficeMap.MEETING_ROOMS.some(r => x < r.x + r.w + pad && x + w + pad > r.x && y < r.y + r.h + pad && y + h + pad > r.y);
  }

  // 회의실과 겹치지 않을 때만 가구 배치
  addFurniture(x, y, w, h, type) {
    if (this.overlapsRoom(x, y, w, h)) return;
    this.obstacles.push(new OfficeObstacle(x, y, w, h, type));
  }

  // 가구 조합 템플릿: 발자국(충돌 영역) w×h 와 하단 중앙 기준 스프라이트 배치 [key, dx, dy, scale, flip]
  static templates() {
    return {
      // 오픈 오피스
      desk_pod: { w: 100, h: 34, back: [['chair_task', 0, -40, 0.5]], front: [['desk_straight', 0, 6, 0.8], ['monitor_single_off', -16, -42, 0.3], ['mug', 30, -38, 0.17]] },
      desk_pod_b: { w: 100, h: 34, back: [['chair_task', 8, -40, 0.5, true]], front: [['desk_modesty_panel', 0, 6, 0.78], ['laptop_open_off', -12, -44, 0.28], ['pen_cup', 32, -40, 0.18]] },
      desk_l: { w: 112, h: 40, back: [['chair_task', 12, -44, 0.5]], front: [['desk_corner_l', 0, 6, 0.8], ['monitor_single_off', -22, -46, 0.3], ['papers_stack', 30, -40, 0.2]] },
      partition_row: { w: 176, h: 16, front: [['partition_fabric', -60, 4, 0.5], ['partition_fabric', 0, 4, 0.5], ['partition_fabric', 60, 4, 0.5]] },
      cabinet_row: { w: 128, h: 28, front: [['cabinet_filing_tall', -40, 2, 0.55], ['cabinet_filing_tall', 6, 2, 0.55], ['plant_snake', 48, 2, 0.45]] },
      printer_station: { w: 120, h: 30, front: [['credenza_low', -10, 4, 0.6], ['printer_small', -18, -38, 0.34], ['bin_waste', 52, 2, 0.38]] },
      // 탕비실
      fridge_row: { w: 128, h: 28, front: [['refrigerator_compact', -32, 2, 0.58], ['refrigerator_compact', 32, 2, 0.58]] },
      bar_table: { w: 84, h: 28, back: [['stool_high', -26, -30, 0.42], ['stool_high', 26, -30, 0.42]], front: [['desk_standing', 0, 4, 0.62], ['mug', -10, -44, 0.16], ['water_bottle', 16, -44, 0.2]] },
      lounge: { w: 150, h: 30, front: [['credenza_low', -14, 4, 0.7], ['mug', -30, -46, 0.17], ['succulent_small', 10, -48, 0.2], ['plant_palm', 58, 4, 0.55]] },
      recycle: { w: 80, h: 22, front: [['bin_recycling', -18, 2, 0.45], ['bin_waste', 22, 2, 0.42]] },
      // 전산실
      server_row: { w: 190, h: 30, front: [['computer_tower', -66, 2, 0.6], ['computer_tower', -14, 2, 0.6], ['computer_tower', 38, 2, 0.6], ['ups', 80, 2, 0.45]] },
      control_desk: { w: 100, h: 34, back: [['chair_task', 0, -40, 0.5]], front: [['desk_straight', 0, 6, 0.8], ['control_panel', -18, -42, 0.3], ['monitor_single_off', 18, -42, 0.3]] },
      archive: { w: 110, h: 28, front: [['archive_box', -30, 2, 0.4], ['archive_box', 14, 2, 0.4], ['archive_box', -8, -26, 0.38], ['shredder', 46, 2, 0.4]] },
      // 임원실
      exec_desk: { w: 150, h: 38, back: [['chair_task', -8, -44, 0.55]], front: [['desk_modesty_panel', -8, 6, 0.9], ['laptop_open_off', -24, -52, 0.28], ['organizer_desk', 14, -50, 0.2], ['lamp_floor', 62, 4, 0.55]] },
      visitor_set: { w: 130, h: 24, front: [['chair_visitor', -40, 2, 0.5], ['chair_visitor', 4, 2, 0.5, true], ['plant_snake', 50, 2, 0.45]] },
      exec_shelf: { w: 130, h: 30, front: [['credenza_low', 0, 4, 0.76], ['folder_closed', -30, -50, 0.2], ['archive_box', 28, -48, 0.22]] },
      // 공용
      tree: { w: 40, h: 20, front: [['tree_indoor', 0, 4, 0.7]] },
      plant_big: { w: 40, h: 20, front: [['plant_broadleaf', 0, 4, 0.58]] },
      plant_palm: { w: 40, h: 20, front: [['plant_palm', 0, 4, 0.58]] },
      umbrella: { w: 26, h: 16, front: [['stand_umbrella', 0, 4, 0.45]] },
      reception: { w: 136, h: 34, back: [['chair_task', 0, -36, 0.48]], front: [['counter_reception_curved', 0, 6, 0.9], ['monitor_single_off', -20, -44, 0.28]] }
    };
  }

  // 템플릿 가구 배치 (회의실/로비/기존 가구와 여유 간격 확보)
  placeTemplate(name, cx, by, pad = 46) {
    const t = OfficePropManager.templates()[name];
    if (!t) return false;
    const x = cx - t.w / 2;
    const y = by - t.h;
    if (x < 90 || y < 90 || x + t.w > OfficeMap.SIZE - 90 || y + t.h > OfficeMap.SIZE - 90) return false;
    if (this.overlapsRoom(x, y, t.w, t.h) || this.overlapsObstacle(x, y, t.w, t.h, pad)) return false;
    if (x < 1520 && x + t.w > 880 && y < 1520 && y + t.h > 880 && name !== 'reception' && !OfficePropManager.LOBBY_DECOR.includes(name)) return false;
    const toWorld = arr => (arr || []).map(([key, dx, dy, s, flip]) => ({ key, x: cx + dx, y: by + dy, s, flip: !!flip }));
    this.obstacles.push(new OfficeObstacle(x, y, t.w, t.h, 'composite', { back: toWorld(t.back), front: toWorld(t.front) }));
    return true;
  }

  generateMapLayout() {
    const mapSize = OfficeMap.SIZE;
    const jitter = () => (Math.random() - 0.5) * 24;

    // 1. 회의실 4개 (유리벽 + 회의 테이블 + 회의 의자)
    OfficeMap.MEETING_ROOMS.forEach(r => {
      const t = 'meeting_wall';
      this.obstacles.push(new OfficeObstacle(r.x, r.y, r.w, 16, t)); // 상단
      this.obstacles.push(new OfficeObstacle(r.x, r.y, 16, r.h, t)); // 좌측
      this.obstacles.push(new OfficeObstacle(r.x + r.w - 16, r.y, 16, r.h, t)); // 우측
      this.obstacles.push(new OfficeObstacle(r.x, r.y + r.h - 16, r.w * 0.6, 16, t)); // 하단 (출입구 개방)
      const tx = r.x + r.w / 2 - 70;
      const ty = r.y + r.h / 2 - 20;
      const chairs = [];
      [-45, 0, 45].forEach(dx => chairs.push({ key: 'chair_meeting', x: r.x + r.w / 2 + dx, y: ty + 4, s: 0.42, flip: dx > 0 }));
      this.obstacles.push(new OfficeObstacle(tx, ty, 140, 46, 'meeting_table', { back: chairs, front: [] }));
    });

    // 2. 구역별 가구 조합 (격자 슬롯 + 약간의 흔들림으로 자연스럽게)
    const zonePlans = {
      office: ['desk_pod', 'desk_pod_b', 'desk_l', 'desk_pod', 'partition_row', 'cabinet_row', 'desk_pod_b', 'printer_station'],
      pantry: ['bar_table', 'lounge', 'fridge_row', 'bar_table', 'recycle', 'plant_palm'],
      server: ['server_row', 'control_desk', 'server_row', 'archive', 'server_row'],
      exec: ['exec_desk', 'visitor_set', 'exec_shelf', 'plant_big', 'exec_desk']
    };
    let n = 0;
    for (let gy = 260; gy <= 2200; gy += 210) {
      for (let gx = 200; gx <= 2200; gx += 240) {
        const cx = gx + ((gy / 210) % 2) * 90 + jitter();
        const by = gy + jitter();
        const zone = OfficeMap.zoneAt(cx, by);
        const plan = zonePlans[zone];
        if (!plan) continue;
        if (Math.hypot(cx - 1200, by - 1200) < 260) continue;
        this.placeTemplate(plan[n++ % plan.length], cx, by);
      }
    }

    // 3. 벽면을 따라 캐비닛/화분 (공간 가장자리 채우기)
    const nearSign = x => Math.abs(x - 600) < 170 || Math.abs(x - 1800) < 170;
    for (let x = 180; x < mapSize - 180; x += 210) {
      if (nearSign(x)) continue;
      const topZone = OfficeMap.zoneAt(x, 140);
      if (topZone === 'office') this.placeTemplate(x % 420 < 210 ? 'cabinet_row' : 'plant_big', x, 132, 30);
      const bottomZone = OfficeMap.zoneAt(x, 2270);
      if (bottomZone === 'exec') this.placeTemplate(x % 420 < 210 ? 'exec_shelf' : 'plant_palm', x, 2300, 30);
      if (bottomZone === 'server') this.placeTemplate('archive', x, 2300, 30);
    }

    // 4. 탕비실 주방 카운터 (상단 벽면)
    this.obstacles.push(new OfficeObstacle(1300, 70, 700, 44, 'counter'));

    // 5. 중앙 로비: 안내데스크, 대형 화분, 우산꽂이
    this.placeTemplate('reception', 1200, 1440, 20);
    [[950, 950], [1450, 950], [950, 1460], [1450, 1460]].forEach(([x, y]) => this.placeTemplate('tree', x, y, 10));
    this.placeTemplate('umbrella', 1300, 1000, 10);

    // 6. 파괴 가능한 기물 (가구와 겹치지 않게 분산 배치)
    const propTypes = ['water_purifier', 'vending_machine', 'copier', 'cabinet'];
    let placed = 0;
    for (let i = 0; i < 300 && placed < 36; i++) {
      const type = propTypes[placed % propTypes.length];
      const px = 150 + Math.random() * (mapSize - 300);
      const py = 170 + Math.random() * (mapSize - 320);
      if (Math.hypot(px - 1200, py - 1200) < 200) continue;
      if (this.overlapsObstacle(px - 30, py - 36, 60, 72, 30)) continue;
      if (this.props.some(p => Math.hypot(p.x - px, p.y - py) < 110)) continue;
      this.props.push(new OfficeProp(type, px, py));
      placed++;
    }
  }

  update(dt) {
    this.props.forEach(p => p.update(dt));
  }

  // 충돌 해결 (플레이어 및 모든 지상 몬스터가 벽과 기물에 완벽하게 가로막힘)
  resolveCollisions(entity) {
    const r = entity.radius || 16;

    // 1. 벽, 파티션, 책상 장애물 충돌 검사
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

    // 2. 살아있는 기물(정수기, 자판기, 복사기, 캐비닛) 충돌 검사
    this.props.forEach(p => {
      if (!p.isAlive) return;
      const minX = p.x - p.width / 2;
      const maxX = p.x + p.width / 2;
      const minY = p.y - p.height / 2;
      const maxY = p.y + p.height / 2;

      const nearestX = Math.max(minX, Math.min(entity.x, maxX));
      const nearestY = Math.max(minY, Math.min(entity.y, maxY));
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

  inView(x, y, w, h, camera, margin = 160) {
    return x + w >= camera.x - margin && x <= camera.x + window.innerWidth + margin &&
      y + h >= camera.y - margin && y <= camera.y + window.innerHeight + margin;
  }

  // 바닥에 붙은 평면 장애물 (회의실 유리벽)
  renderFlat(ctx, camera) {
    this.obstacles.forEach(obs => {
      if (obs.flat && this.inView(obs.x, obs.y, obs.width, obs.height, camera)) obs.render(ctx, camera);
    });
  }

  // 깊이 정렬용 렌더 목록 (가구 + 파괴 기물)
  collectRenderables(camera, out) {
    this.obstacles.forEach(obs => {
      if (!obs.flat && this.inView(obs.x, obs.y - 120, obs.width, obs.height + 140, camera)) {
        out.push({ y: obs.baseline, draw: () => obs.render(ctx0(), camera) });
      }
    });
    this.props.forEach(p => {
      if (p.isAlive && this.inView(p.x - 60, p.y - 120, 120, 160, camera)) {
        out.push({ y: p.y + p.height / 2, draw: () => p.render(ctx0(), camera) });
      }
    });
  }

  // (호환용) 전체 렌더
  render(ctx, camera) {
    this.renderFlat(ctx, camera);
    const list = [];
    this.collectRenderables(camera, list);
    list.sort((a, b) => a.y - b.y).forEach(it => it.draw());
  }
}

// 깊이 정렬 draw 콜백이 사용할 현재 캔버스 컨텍스트
function ctx0() {
  return window.game.ctx;
}

OfficePropManager.LOBBY_DECOR = ['tree', 'umbrella', 'plant_big', 'plant_palm'];

OfficeProp.SPRITES = {
  water_purifier: { key: 'prop_refrigerator_compact', s: 0.58 },
  copier: { key: 'prop_shredder', s: 0.62 },
  cabinet: { key: 'prop_cabinet_filing_tall', s: 0.6 }
};

window.OfficePropManager = OfficePropManager;
