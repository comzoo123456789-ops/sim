// Office Escape Survivor - Office Floor Map Renderer
// 정적인 바닥/벽/창문/사인은 청크 단위로 한 번만 그려 캐시하고(LRU), 매 프레임엔 복사만 합니다.

class OfficeMap {
  constructor() {
    this.size = OfficeMap.SIZE;
    this.chunkSize = 480;
    this.chunks = new Map(); // key → { canvas, used }
    this.maxChunks = 12;
    this.scale = 1;
    this.frame = 0;

    // 웹폰트 로드 전에 구운 청크(사인 글씨)는 폰트 로드 후 다시 그림
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => this.chunks.clear());
    }
  }

  // 구역 판정 (props.js의 배치 로직과 공유)
  static zoneAt(x, y) {
    if (x >= 900 && x < 1500 && y >= 900 && y < 1500) return 'lobby';
    if (x >= 1200 && y < 1200) return 'pantry';
    if (x < 1200 && y >= 1200) return 'server';
    if (x >= 1200 && y >= 1200) return 'exec';
    return 'office';
  }

  // 결정적 난수 (같은 좌표 → 항상 같은 값, 청크 경계에서도 이음새 없음)
  static rand(x, y, k = 0) {
    let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return ((h >>> 0) % 10000) / 10000;
  }

  setScale(scale) {
    if (scale !== this.scale) {
      this.scale = scale;
      this.chunks.clear();
    }
  }

  getChunk(cx, cy) {
    const key = cx + ',' + cy;
    let c = this.chunks.get(key);
    if (!c) {
      const cs = this.chunkSize;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(cs * this.scale);
      canvas.height = Math.ceil(cs * this.scale);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(this.scale, 0, 0, this.scale, -cx * cs * this.scale, -cy * cs * this.scale);
      this.paintRegion(ctx, cx * cs, cy * cs, cs, cs);
      c = { canvas, used: 0 };
      this.chunks.set(key, c);

      if (this.chunks.size > this.maxChunks) {
        let oldestKey = null;
        let oldest = Infinity;
        this.chunks.forEach((v, k) => { if (v.used < oldest && k !== key) { oldest = v.used; oldestKey = k; } });
        if (oldestKey) this.chunks.delete(oldestKey);
      }
    }
    c.used = this.frame;
    return c.canvas;
  }

  render(ctx, camera, viewW, viewH, player) {
    this.frame++;
    const cs = this.chunkSize;

    // 맵 바깥 (야외 어둠)
    ctx.fillStyle = '#04060b';
    ctx.fillRect(0, 0, viewW, viewH);

    const x0 = Math.max(0, Math.floor(camera.x / cs));
    const y0 = Math.max(0, Math.floor(camera.y / cs));
    const x1 = Math.min(Math.ceil(this.size / cs) - 1, Math.floor((camera.x + viewW) / cs));
    const y1 = Math.min(Math.ceil(this.size / cs) - 1, Math.floor((camera.y + viewH) / cs));

    // 기기 픽셀 정렬로 청크 이음새 제거
    const s = this.scale;
    const ox = Math.round(camera.x * s) / s;
    const oy = Math.round(camera.y * s) / s;

    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        ctx.drawImage(this.getChunk(cx, cy), cx * cs - ox, cy * cs - oy, cs, cs);
      }
    }

    this.renderElevator(ctx, camera);
    this.renderNightVignette(ctx, camera, viewW, viewH, player);
  }

  // ───────────────────────── 정적 레이어 (청크에 1회만 그림) ─────────────────────────
  paintRegion(ctx, rx, ry, rw, rh) {
    const T = 80;
    const tx0 = Math.floor(rx / T) * T;
    const ty0 = Math.floor(ry / T) * T;

    for (let x = tx0; x < rx + rw; x += T) {
      for (let y = ty0; y < ry + rh; y += T) {
        if (x < 0 || y < 0 || x >= this.size || y >= this.size) continue;
        switch (OfficeMap.zoneAt(x, y)) {
          case 'lobby': this.paintMarble(ctx, x, y, T); break;
          case 'pantry': this.paintWood(ctx, x, y, T); break;
          case 'server': this.paintRaisedFloor(ctx, x, y, T); break;
          case 'exec': this.paintExecCarpet(ctx, x, y, T); break;
          default: this.paintCarpet(ctx, x, y, T); break;
        }
      }
    }

    this.paintMeetingRoomFloors(ctx);
    this.paintExecRug(ctx);
    this.paintLobbyInlay(ctx);
    this.paintZoneDividers(ctx);
    this.paintCeilingLights(ctx, rx, ry, rw, rh);
    this.paintFloorSigns(ctx);
    this.paintWalls(ctx);
  }

  // 오픈 오피스: 방향이 교차하는 카펫 타일
  paintCarpet(ctx, x, y, T) {
    const odd = ((x / T) + (y / T)) % 2 === 1;
    ctx.fillStyle = odd ? '#1a2231' : '#1d2636';
    ctx.fillRect(x, y, T, T);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.028)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 6; i < T; i += 6) {
      if (odd) { ctx.moveTo(x + i, y + 3); ctx.lineTo(x + i, y + T - 3); }
      else { ctx.moveTo(x + 3, y + i); ctx.lineTo(x + T - 3, y + i); }
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    for (let i = 0; i < 14; i++) {
      ctx.fillRect(x + OfficeMap.rand(x, y, i) * T, y + OfficeMap.rand(x, y, i + 50) * T, 1.2, 1.2);
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
  }

  // 탕비실: 원목 플로어링
  paintWood(ctx, x, y, T) {
    const colors = ['#3b2b1f', '#402f21', '#35271c', '#45321f', '#3d2c1d'];
    const plankH = 16;
    for (let row = 0; row < T / plankH; row++) {
      const py = y + row * plankH;
      const worldRow = Math.floor(py / plankH);
      const offset = Math.floor(OfficeMap.rand(worldRow, 7, 3) * 160);
      const plankLen = 160;
      // 월드 좌표 기준 판자 경계 → 타일 경계에 이음새 없음
      let startX = x - ((x + offset) % plankLen);
      for (let px = startX; px < x + T; px += plankLen) {
        const idx = Math.floor((px + offset) / plankLen);
        const sx = Math.max(px, x);
        const ex = Math.min(px + plankLen, x + T);
        ctx.fillStyle = colors[Math.floor(OfficeMap.rand(idx, worldRow, 9) * colors.length)];
        ctx.fillRect(sx, py, ex - sx, plankH);
        if (px >= x && px < x + T) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(px, py, 1, plankH);
        }
      }
      // 나뭇결
      ctx.strokeStyle = 'rgba(255, 220, 170, 0.04)';
      ctx.beginPath();
      ctx.moveTo(x, py + 5 + OfficeMap.rand(x, worldRow, 1) * 3);
      ctx.lineTo(x + T, py + 5 + OfficeMap.rand(x + T, worldRow, 1) * 3);
      ctx.moveTo(x, py + 11);
      ctx.lineTo(x + T, py + 11 + OfficeMap.rand(x, worldRow, 2) * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(x, py + plankH - 1, T, 1);
    }
  }

  // 전산실: 이중마루(액세스 플로어) + 통풍 타공 패널
  paintRaisedFloor(ctx, x, y, T) {
    ctx.fillStyle = '#1f2835';
    ctx.fillRect(x, y, T, T);
    ctx.fillStyle = '#263141';
    ctx.fillRect(x + 3, y + 3, T - 6, T - 6);

    const vent = OfficeMap.rand(x, y, 11) < 0.28;
    if (vent) {
      ctx.fillStyle = 'rgba(8, 12, 20, 0.85)';
      for (let i = 12; i < T - 8; i += 7) {
        for (let j = 12; j < T - 8; j += 7) {
          ctx.fillRect(x + i, y + j, 3, 3);
        }
      }
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(x + 8, y + 8, T - 16, T - 16);
    }

    // 베벨
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(x + 3, y + 3, T - 6, 1);
    ctx.fillRect(x + 3, y + 3, 1, T - 6);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x + 3, y + T - 4, T - 6, 1);
    ctx.fillRect(x + T - 4, y + 3, 1, T - 6);
  }

  // 임원실: 버건디 카펫 + 금사 격자 무늬
  paintExecCarpet(ctx, x, y, T) {
    ctx.fillStyle = '#221620';
    ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + T, y + T);
    ctx.moveTo(x + T, y); ctx.lineTo(x, y + T);
    ctx.moveTo(x + T / 2, y); ctx.lineTo(x + T, y + T / 2); ctx.lineTo(x + T / 2, y + T); ctx.lineTo(x, y + T / 2); ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
    ctx.fillRect(x + T / 2 - 1.5, y + T / 2 - 1.5, 3, 3);
  }

  // 중앙 로비: 대리석 타일
  paintMarble(ctx, x, y, T) {
    const odd = ((x / T) + (y / T)) % 2 === 1;
    ctx.fillStyle = odd ? '#2a303c' : '#313847';
    ctx.fillRect(x, y, T, T);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let v = 0; v < 2; v++) {
      const a = OfficeMap.rand(x, y, 20 + v);
      const b = OfficeMap.rand(x, y, 30 + v);
      ctx.beginPath();
      ctx.moveTo(x, y + a * T);
      ctx.bezierCurveTo(x + T * 0.3, y + b * T, x + T * 0.6, y + a * T * 0.6, x + T, y + b * T);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(x + 1, y + 1, T - 2, 1);
  }

  paintLobbyInlay(ctx) {
    // 금색 인레이 테두리 + 안내 동선
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(912, 912, 576, 576);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(924, 924, 552, 552);

    // 엘리베이터로 향하는 유도선 (초록 비상 동선)
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.18)';
    ctx.lineWidth = 6;
    ctx.setLineDash([18, 14]);
    ctx.beginPath();
    ctx.moveTo(1200, 930); ctx.lineTo(1200, 1100);
    ctx.moveTo(1200, 1300); ctx.lineTo(1200, 1470);
    ctx.moveTo(930, 1200); ctx.lineTo(1100, 1200);
    ctx.moveTo(1300, 1200); ctx.lineTo(1470, 1200);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  paintMeetingRoomFloors(ctx) {
    OfficeMap.MEETING_ROOMS.forEach(r => {
      ctx.fillStyle = '#2a3243';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = r.x + 10; i < r.x + r.w; i += 10) { ctx.moveTo(i, r.y); ctx.lineTo(i, r.y + r.h); }
      ctx.stroke();
      // 룸 이름 바닥 표기
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.font = '800 12px "Pretendard", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(r.label, r.x + 24, r.y + 36);
    });
  }

  paintExecRug(ctx) {
    const x = 1580, y = 1960, w = 440, h = 230;
    ctx.fillStyle = '#3a1c2b';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 12, y + 12, w - 24, h - 24);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 22, y + 22, w - 44, h - 44);
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, 90, 60, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 구역 경계 금속 몰딩
  paintZoneDividers(ctx) {
    const strip = (x, y, w, h) => {
      ctx.fillStyle = '#3b4658';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      if (w > h) ctx.fillRect(x, y, w, 1); else ctx.fillRect(x, y, 1, h);
    };
    strip(1197, 70, 6, 830);
    strip(1197, 1500, 6, 830);
    strip(70, 1197, 830, 6);
    strip(1500, 1197, 830, 6);
  }

  // 천장 조명이 바닥에 떨어지는 빛 웅덩이
  paintCeilingLights(ctx, rx, ry, rw, rh) {
    const step = 300;
    const R = 170;
    for (let lx = 150; lx < this.size; lx += step) {
      for (let ly = 150; ly < this.size; ly += step) {
        if (lx + R < rx || lx - R > rx + rw || ly + R < ry || ly - R > ry + rh) continue;
        const zone = OfficeMap.zoneAt(lx, ly);
        const color = zone === 'server' ? '125, 211, 252' : (zone === 'pantry' ? '255, 214, 160' : '255, 244, 220');
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, R);
        g.addColorStop(0, `rgba(${color}, 0.075)`);
        g.addColorStop(1, `rgba(${color}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(lx - R, ly - R, R * 2, R * 2);
      }
    }
  }

  // 구역 안내 바닥 사인
  paintFloorSigns(ctx) {
    const signs = [
      { x: 600, y: 150, en: 'OPEN OFFICE', ko: '개발 · 디자인팀', color: '56, 189, 248' },
      { x: 1800, y: 150, en: 'PANTRY', ko: '탕비실 · 라운지', color: '251, 191, 36' },
      { x: 600, y: 2260, en: 'SERVER ROOM', ko: '전산 · 인프라실', color: '34, 211, 238' },
      { x: 1800, y: 2260, en: 'EXECUTIVE', ko: '임원실 · 대회의실', color: '244, 114, 182' }
    ];
    signs.forEach(s => {
      ctx.save();
      ctx.fillStyle = `rgba(${s.color}, 0.08)`;
      ctx.strokeStyle = `rgba(${s.color}, 0.35)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(s.x - 120, s.y - 26, 240, 52, 10);
      ctx.fill();
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(${s.color}, 0.8)`;
      ctx.font = '800 17px "Rajdhani", "Pretendard", sans-serif';
      ctx.fillText(s.en.split('').join(String.fromCharCode(8202)), s.x, s.y - 3);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.font = '700 11px "Pretendard", sans-serif';
      ctx.fillText(s.ko, s.x, s.y + 15);
      ctx.restore();
    });
  }

  // 외벽 + 야경 창문
  paintWalls(ctx) {
    const W = 70;
    const S = this.size;

    ctx.fillStyle = '#0b1019';
    ctx.fillRect(0, 0, S, W);
    ctx.fillRect(0, S - W, S, W);
    ctx.fillRect(0, 0, W, S);
    ctx.fillRect(S - W, 0, W, S);

    // 창문 (상/하: 가로 배치, 좌/우: 세로 배치)
    const pane = 150;
    const gap = 22;
    for (let p = W + 20; p + pane < S - W - 10; p += pane + gap) {
      this.paintWindow(ctx, p, 12, pane, W - 24, p);
      this.paintWindow(ctx, p, S - W + 12, pane, W - 24, p + 7);
      this.paintWindow(ctx, 12, p, W - 24, pane, p + 13);
      this.paintWindow(ctx, S - W + 12, p, W - 24, pane, p + 19);
    }

    // 벽 안쪽 몰딩
    ctx.fillStyle = '#26303f';
    ctx.fillRect(W - 4, W - 4, S - W * 2 + 8, 4);
    ctx.fillRect(W - 4, S - W, S - W * 2 + 8, 4);
    ctx.fillRect(W - 4, W - 4, 4, S - W * 2 + 8);
    ctx.fillRect(S - W, W - 4, 4, S - W * 2 + 8);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(W, W, S - W * 2, 10);

    // 모서리 기둥
    ctx.fillStyle = '#151c29';
    [[0, 0], [S - W, 0], [0, S - W], [S - W, S - W]].forEach(([x, y]) => ctx.fillRect(x, y, W, W));
  }

  paintWindow(ctx, x, y, w, h, seed) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#0d1b33');
    g.addColorStop(1, '#16294a');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    // 도시 빌딩 실루엣 + 켜진 창문
    const horizontal = w > h;
    const len = horizontal ? w : h;
    for (let i = 0; i < len; i += 14) {
      const bh = 8 + OfficeMap.rand(seed, i, 5) * ((horizontal ? h : w) * 0.7);
      ctx.fillStyle = '#0a1426';
      if (horizontal) ctx.fillRect(x + i, y + h - bh, 12, bh);
      else ctx.fillRect(x + w - bh, y + i, bh, 12);

      for (let k = 0; k < 3; k++) {
        if (OfficeMap.rand(seed, i, k + 40) < 0.45) {
          ctx.fillStyle = OfficeMap.rand(seed, i, k + 60) < 0.7 ? 'rgba(251, 191, 36, 0.75)' : 'rgba(186, 230, 253, 0.6)';
          const d = 3 + k * 5;
          if (horizontal) ctx.fillRect(x + i + 3 + (k % 2) * 4, y + h - bh + d, 2, 2);
          else ctx.fillRect(x + w - bh + d, y + i + 3 + (k % 2) * 4, 2, 2);
        }
      }
    }

    // 유리 반사 & 창틀
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    if (horizontal) ctx.fillRect(x, y, w, h * 0.35); else ctx.fillRect(x, y, w * 0.35, h);
    ctx.strokeStyle = '#2b3547';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath();
    if (horizontal) { ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); }
    else { ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); }
    ctx.stroke();
  }

  // ───────────────────────── 동적 레이어 (매 프레임) ─────────────────────────
  renderElevator(ctx, camera) {
    const cx = 1200 - camera.x;
    const cy = 1200 - camera.y;
    const t = performance.now() / 1000;
    const pulse = (Math.sin(t * 2.4) + 1) / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // 바닥 안전 구역 (황색/흑색 경고 테두리)
    ctx.fillStyle = '#10151f';
    ctx.fillRect(-92, -70, 184, 150);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-92, -70, 184, 150);
    ctx.rect(-80, -58, 160, 126);
    ctx.clip('evenodd');
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-92, -70, 184, 150);
    ctx.fillStyle = '#111827';
    for (let i = -300; i < 300; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, -80); ctx.lineTo(i + 8, -80); ctx.lineTo(i + 8 + 160, 90); ctx.lineTo(i + 160, 90);
      ctx.fill();
    }
    ctx.restore();

    // 엘리베이터 문 (스테인리스)
    const door = ctx.createLinearGradient(-60, 0, 60, 0);
    door.addColorStop(0, '#5b6678');
    door.addColorStop(0.45, '#aeb8c6');
    door.addColorStop(0.5, '#6b7686');
    door.addColorStop(0.55, '#aeb8c6');
    door.addColorStop(1, '#5b6678');
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-66, -52, 132, 112);
    ctx.fillStyle = door;
    ctx.fillRect(-58, -44, 116, 100);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-1, -44, 2, 100);

    // 비상구 사인 (초록 발광)
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 10 + pulse * 10;
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(-44, -68, 88, 20, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ecfdf5';
    ctx.font = '900 12px "Rajdhani", "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT  20F ▲', 0, -57.5);

    // 바닥 라벨
    ctx.fillStyle = `rgba(52, 211, 153, ${0.55 + pulse * 0.35})`;
    ctx.font = '800 11px "Pretendard", sans-serif';
    ctx.fillText('비상 엘리베이터 · 정시 퇴근', 0, 94);
    ctx.restore();
  }

  renderNightVignette(ctx, camera, viewW, viewH, player) {
    const px = player ? player.x - camera.x : viewW / 2;
    const py = player ? player.y - camera.y : viewH / 2;
    const r = Math.max(viewW, viewH);
    const g = ctx.createRadialGradient(px, py, r * 0.25, px, py, r * 0.85);
    g.addColorStop(0, 'rgba(2, 5, 12, 0)');
    g.addColorStop(1, 'rgba(2, 5, 12, 0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);
  }
}

OfficeMap.SIZE = 2400;
OfficeMap.MEETING_ROOMS = [
  { x: 400, y: 400, w: 280, h: 200, label: 'MEETING A · 기획회의실' },
  { x: 1700, y: 400, w: 280, h: 200, label: 'LOUNGE B · 휴게실' },
  { x: 400, y: 1700, w: 280, h: 200, label: 'NOC C · 관제실' },
  { x: 1700, y: 1700, w: 280, h: 200, label: 'BOARD D · 대회의실' }
];

window.OfficeMap = OfficeMap;
