// Office Escape Survivor - 스테이지별 사무실 평면도 생성기 + 몬스터 길찾기 격자
// 같은 스테이지 ID → 항상 같은 평면도 (시드 고정), 스테이지마다 방 배치 / 벽 / 문 / 출구가 다름

// 시드 고정 난수 (mulberry32)
function seededRandom(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class FloorPlan {
  // stage: 스테이지 정의 (없으면 서바이벌), theme: OfficeMap 테마
  constructor(seedKey, stage, theme) {
    this.rand = seededRandom(seedKey);
    this.theme = theme;
    this.rooms = [];
    this.walls = [];   // { x, y, w, h, glass }
    this.doors = [];   // { x, y } 문 중심 (가구 배치 금지 구역)
    this.generate(stage);
  }

  // 스테이지 이름으로 주력 방 용도 추정
  static focusFromName(name = '') {
    if (/탕비|카페|라운지|휴게|간식|로비/.test(name)) return 'pantry';
    if (/서버|전산|데이터|IT|관제|DB|장애|인프라|분류|로봇|AI/.test(name)) return 'server';
    if (/회의|PT|브리핑|워룸|소집|미팅|발표|결재판|심의/.test(name)) return 'meeting';
    if (/임원|대표|사장|회장|CEO|CTO|장관|차관|집무|비서|이사|센터장|소장/.test(name)) return 'exec';
    return 'office';
  }

  generate(stage) {
    const r = this.rand;
    const MIN = 90, MAX = 2310;

    // 1. BSP 분할: 긴 축을 35~65% 지점에서 반복 분할
    const leaves = [];
    const split = (x, y, w, h, depth) => {
      const canSplitW = w > 760, canSplitH = h > 760;
      if (depth >= 4 || (!canSplitW && !canSplitH) || (depth >= 2 && r() < 0.18)) {
        leaves.push({ x, y, w, h });
        return;
      }
      const vertical = canSplitW && (!canSplitH || w > h * (0.8 + r() * 0.4));
      const t = 0.36 + r() * 0.28;
      if (vertical) {
        const cut = Math.round(x + w * t);
        this.pendingEdges.push({ vertical: true, pos: cut, from: y, to: y + h });
        split(x, y, cut - x, h, depth + 1);
        split(cut, y, x + w - cut, h, depth + 1);
      } else {
        const cut = Math.round(y + h * t);
        this.pendingEdges.push({ vertical: false, pos: cut, from: x, to: x + w });
        split(x, y, w, cut - y, depth + 1);
        split(x, cut, w, y + h - cut, depth + 1);
      }
    };
    this.pendingEdges = [];
    split(MIN, MIN, MAX - MIN, MAX - MIN, 0);

    // 2. 방 용도 배정: 주력 용도는 가장 큰 방들, 출발 로비는 중간 크기 방
    const focus = stage ? FloorPlan.focusFromName(stage.name) : 'office';
    const sorted = leaves.slice().sort((a, b) => b.w * b.h - a.w * a.h);
    const pool = ['office', 'office', 'pantry', 'meeting', 'server', 'exec', 'office', 'meeting', 'pantry', 'office', 'server', 'exec', 'office'];
    const lobbyIdx = Math.min(sorted.length - 1, 2 + Math.floor(r() * Math.max(1, sorted.length - 4)));
    let p = Math.floor(r() * pool.length);
    sorted.forEach((leaf, i) => {
      let type;
      if (i === lobbyIdx) type = 'lobby';
      else if (i < 2) type = focus;
      else type = pool[p++ % pool.length];
      this.rooms.push({ ...leaf, type, id: this.rooms.length });
    });

    // 회의실은 너무 크면 사무실로 (회의실은 아담하게)
    this.rooms.forEach(room => { if (room.type === 'meeting' && room.w * room.h > 700 * 600) room.type = 'office'; });

    // 3. 경계선 → 벽 + 문. 인접한 두 방이 모두 오픈형이면 벽 없이 트인 공간
    const OPEN = { office: 1, pantry: 1, lobby: 1 };
    const T = 18; // 벽 두께
    this.pendingEdges.forEach(e => {
      // 경계를 공유하는 방 쌍 구간별로 벽 생성
      const segs = [];
      this.rooms.forEach(a => {
        this.rooms.forEach(b => {
          if (a.id >= b.id) return;
          let s = null;
          if (e.vertical) {
            const left = a.x + a.w === e.pos ? a : (b.x + b.w === e.pos ? b : null);
            const right = left === a ? (b.x === e.pos ? b : null) : (a.x === e.pos ? a : null);
            if (left && right) {
              const from = Math.max(left.y, right.y, e.from), to = Math.min(left.y + left.h, right.y + right.h, e.to);
              if (to - from > 60) s = { from, to, a: left, b: right };
            }
          } else {
            const top = a.y + a.h === e.pos ? a : (b.y + b.h === e.pos ? b : null);
            const bottom = top === a ? (b.y === e.pos ? b : null) : (a.y === e.pos ? a : null);
            if (top && bottom) {
              const from = Math.max(top.x, bottom.x, e.from), to = Math.min(top.x + top.w, bottom.x + bottom.w, e.to);
              if (to - from > 60) s = { from, to, a: top, b: bottom };
            }
          }
          if (s) segs.push(s);
        });
      });

      segs.forEach(s => {
        const bothOpen = OPEN[s.a.type] && OPEN[s.b.type];
        if (bothOpen && r() < 0.75) return; // 트인 오픈 오피스
        const glass = s.a.type === 'meeting' || s.b.type === 'meeting';
        const len = s.to - s.from;
        // 문: 길이에 따라 1~2개, 폭 150
        const doorW = 150;
        const doorCount = len > 700 ? 2 : 1;
        const doors = [];
        for (let d = 0; d < doorCount; d++) {
          const slot = len / doorCount;
          const c = s.from + slot * d + slot * (0.3 + r() * 0.4);
          doors.push(Math.max(s.from + doorW / 2 + 20, Math.min(s.to - doorW / 2 - 20, c)));
        }
        doors.sort((m, n) => m - n);
        let cur = s.from;
        doors.forEach(dc => {
          this.addWall(e.vertical, e.pos, cur, dc - doorW / 2, T, glass);
          this.doors.push(e.vertical ? { x: e.pos, y: dc } : { x: dc, y: e.pos });
          cur = dc + doorW / 2;
        });
        this.addWall(e.vertical, e.pos, cur, s.to, T, glass);
      });
    });
    delete this.pendingEdges;

    // 4. 출발 지점(엘리베이터) = 로비 방 중앙
    const lobby = this.rooms.find(room => room.type === 'lobby') || this.rooms[0];
    this.spawn = { x: Math.round(lobby.x + lobby.w / 2), y: Math.round(lobby.y + lobby.h / 2) };
  }

  addWall(vertical, pos, from, to, T, glass) {
    if (to - from < 24) return;
    if (vertical) this.walls.push({ x: pos - T / 2, y: from, w: T, h: to - from, glass });
    else this.walls.push({ x: from, y: pos - T / 2, w: to - from, h: T, glass });
  }

  roomAt(x, y) {
    for (const room of this.rooms) {
      if (x >= room.x && x < room.x + room.w && y >= room.y && y < room.y + room.h) return room;
    }
    return this.rooms[0];
  }
}

// ─────────────────────────── 몬스터 길찾기 격자 ───────────────────────────
// 40px 격자에 벽/가구를 막힘으로 표시하고, 주기적으로 플레이어 기준 BFS 거리장을 계산
class NavGrid {
  constructor(obstacles, size = 2400, cell = 40) {
    this.cell = cell;
    this.n = Math.ceil(size / cell);
    this.blocked = new Uint8Array(this.n * this.n);
    this.dist = new Int16Array(this.n * this.n).fill(-1);
    const pad = 10;
    obstacles.forEach(o => {
      const x0 = Math.max(0, Math.floor((o.x - pad) / cell));
      const y0 = Math.max(0, Math.floor((o.y - pad) / cell));
      const x1 = Math.min(this.n - 1, Math.floor((o.x + o.width + pad) / cell));
      const y1 = Math.min(this.n - 1, Math.floor((o.y + o.height + pad) / cell));
      for (let gy = y0; gy <= y1; gy++) {
        for (let gx = x0; gx <= x1; gx++) {
          const cx = gx * cell + cell / 2, cy = gy * cell + cell / 2;
          if (cx > o.x - pad && cx < o.x + o.width + pad && cy > o.y - pad && cy < o.y + o.height + pad) this.blocked[gy * this.n + gx] = 1;
        }
      }
    });
    this.queue = new Int32Array(this.n * this.n);
    this.lastTarget = -1;
  }

  // 플레이어 위치 기준 거리장 갱신
  update(px, py) {
    const n = this.n, c = this.cell;
    const tx = Math.max(0, Math.min(n - 1, Math.floor(px / c)));
    const ty = Math.max(0, Math.min(n - 1, Math.floor(py / c)));
    const target = ty * n + tx;
    this.dist.fill(-1);
    let head = 0, tail = 0;
    this.dist[target] = 0;
    this.queue[tail++] = target;
    while (head < tail) {
      const cur = this.queue[head++];
      const cx = cur % n, cy = (cur - cx) / n;
      const d = this.dist[cur] + 1;
      if (cx > 0) this.visit(cur - 1, d, tail) && tail++;
      if (cx < n - 1) this.visit(cur + 1, d, tail) && tail++;
      if (cy > 0) this.visit(cur - n, d, tail) && tail++;
      if (cy < n - 1) this.visit(cur + n, d, tail) && tail++;
    }
  }

  visit(i, d, tail) {
    if (this.dist[i] !== -1 || this.blocked[i]) return false;
    this.dist[i] = d;
    this.queue[tail] = i;
    return true;
  }

  // 현재 위치에서 플레이어 쪽으로 가는 다음 격자 중심 (길이 없으면 null)
  nextStep(x, y) {
    const n = this.n, c = this.cell;
    const gx = Math.floor(x / c), gy = Math.floor(y / c);
    if (gx < 0 || gy < 0 || gx >= n || gy >= n) return null;
    const here = this.dist[gy * n + gx];
    let best = here >= 0 ? here : 1e9, bx = -1, by = -1;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = gx + dx, ny = gy + dy;
        if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
        // 대각선은 양옆이 뚫려 있을 때만 (모서리 끼임 방지)
        if (dx && dy && (this.blocked[gy * n + nx] || this.blocked[ny * n + gx])) continue;
        const d = this.dist[ny * n + nx];
        if (d >= 0 && d < best) { best = d; bx = nx; by = ny; }
      }
    }
    if (bx < 0) return null;
    return { x: bx * c + c / 2, y: by * c + c / 2 };
  }
}

window.FloorPlan = FloorPlan;
window.NavGrid = NavGrid;
