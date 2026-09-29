// Office Escape Survivor - 런(연속 스테이지) 상태: 탕비실 상점 아이템 · 지갑 · 동료 사원

// ─────────────────────────── 탕비실 상점 아이템 ───────────────────────────
// rarity: common | rare | epic, max: 최대 보유 개수, bonus: 1개당 스탯 증가
const RUN_ITEMS = {
  americano: { name: '아메리카노 샷 추가', icon: 'mug', rarity: 'common', max: 5, desc: '공격력 +8%', bonus: { atkMul: 0.08 } },
  tumbler: { name: '대용량 보온 텀블러', icon: 'tumbler', rarity: 'common', max: 5, desc: '초당 체력 회복 +0.6', bonus: { hpRegen: 0.6 } },
  vitamin: { name: '종합 비타민', icon: 'pill', rarity: 'common', max: 5, desc: '최대 체력 +10%', bonus: { hpMul: 0.10 } },
  mouse: { name: '무소음 레이저 마우스', icon: 'pointer', rarity: 'common', max: 4, desc: '쿨타임 -5%', bonus: { cdReduc: 0.05 } },
  postit: { name: '포스트잇 뭉치', icon: 'memo', rarity: 'common', max: 4, desc: '공격 범위 +8%', bonus: { areaMul: 0.08 } },
  headset: { name: '노캔 헤드셋', icon: 'headphone', rarity: 'common', max: 4, desc: '받는 피해 -6%', bonus: { dmgReduc: 0.06 } },
  keyboard: { name: '저소음 적축 키보드', icon: 'keyboard', rarity: 'common', max: 5, desc: '치명타율 +4%', bonus: { critRate: 0.04 } },
  wallet: { name: '명함 지갑', icon: 'wallet', rarity: 'common', max: 4, desc: '코인 획득 +15%', bonus: { goldMul: 0.15 } },
  manual: { name: '업무 매뉴얼', icon: 'document', rarity: 'common', max: 4, desc: '경험치 획득 +12%', bonus: { xpMul: 0.12 } },
  binder: { name: '결재 파일철', icon: 'folder', rarity: 'common', max: 3, desc: '아이템 흡입 범위 +35', bonus: { magnet: 35 } },
  pass: { name: '출입증 프리패스', icon: 'id_card', rarity: 'common', max: 4, desc: '이동 속도 +6%', bonus: { speedMul: 0.06 } },
  monitor: { name: '듀얼 모니터', icon: 'monitor', rarity: 'common', max: 3, desc: '대시 쿨타임 -10%', bonus: { dashCdReduc: 0.10 } },
  vip_badge: { name: 'VIP 사원증', icon: 'lanyard', rarity: 'rare', max: 1, desc: '쓰러져도 1회 부활', bonus: { revive: 1 } },
  overtime_pay: { name: '야근 수당 봉투', icon: 'cash', rarity: 'rare', max: 2, desc: '스테이지 시작 시 레벨업 카드 +1장', bonus: { startLevels: 1 } },
  referral: { name: '인턴 추천서', icon: 'briefcase', rarity: 'rare', max: 2, desc: '즉시 동료 사원 1명 합류', bonus: {}, instant: 'companion' },
  laptop: { name: '법인 노트북 지급', icon: 'pc_tower', rarity: 'epic', max: 1, desc: '스테이지 시작 시 기본 무기 +2레벨', bonus: { startWeaponLv: 2 } },
  corp_card: { name: '무제한 법인카드', icon: 'receipt', rarity: 'epic', max: 1, desc: '공격력 +20% · 코인 +20%', bonus: { atkMul: 0.2, goldMul: 0.2 } },
  clinic: { name: '사내 의무실 VIP', icon: 'aid_kit', rarity: 'epic', max: 1, desc: '초당 회복 +2 · 받는 피해 -10%', bonus: { hpRegen: 2, dmgReduc: 0.1 } }
};
const RUN_PRICE = { common: 50, rare: 120, epic: 240 };
const RUN_RARITY_WEIGHT = { common: 66, rare: 27, epic: 7 };

class RunManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.items = {};      // { itemId: count }
    this.coins = 0;       // 탕비실 지갑 (한 판 동안만 유지)
    this.companions = []; // 합류한 동료 charId 목록
    this.rerolls = 0;
    this.offers = [];
  }

  start() {
    this.reset();
    this.active = true;
  }

  // 판 종료: 남은 지갑 코인을 은행으로 입금
  end() {
    const leftover = this.coins;
    if (leftover > 0 && window.saveMgr) window.saveMgr.addGold(leftover);
    this.reset();
    return leftover;
  }

  count(id) {
    return this.items[id] || 0;
  }

  // 보유 아이템 스탯 합계
  bonuses() {
    const b = { atkMul: 0, hpRegen: 0, hpMul: 0, cdReduc: 0, areaMul: 0, dmgReduc: 0, critRate: 0, goldMul: 0, xpMul: 0, magnet: 0, speedMul: 0, dashCdReduc: 0, revive: 0, startLevels: 0, startWeaponLv: 0 };
    Object.entries(this.items).forEach(([id, n]) => {
      const def = RUN_ITEMS[id];
      if (!def) return;
      Object.entries(def.bonus).forEach(([k, v]) => { b[k] = (b[k] || 0) + v * n; });
    });
    return b;
  }

  priceScale(chapter) {
    return 1 + 0.25 * ((chapter || 1) - 1);
  }

  price(id, chapter) {
    return Math.round(RUN_PRICE[RUN_ITEMS[id].rarity] * this.priceScale(chapter) / 5) * 5;
  }

  rerollCost(chapter) {
    return Math.round(15 * (1 + this.rerolls) * this.priceScale(chapter) / 5) * 5;
  }

  // 상점 진열 4칸 (등급 가중치, 최대치 도달 아이템 제외, 중복 없음)
  rollOffers(chapter) {
    const pool = Object.keys(RUN_ITEMS).filter(id => this.count(id) < RUN_ITEMS[id].max &&
      !(id === 'referral' && this.companions.length >= CompanionManager.MAX));
    const offers = [];
    for (let i = 0; i < 4 && pool.length; i++) {
      const total = pool.reduce((s, id) => s + RUN_RARITY_WEIGHT[RUN_ITEMS[id].rarity], 0);
      let r = Math.random() * total;
      const idx = pool.findIndex(id => (r -= RUN_RARITY_WEIGHT[RUN_ITEMS[id].rarity]) <= 0);
      const id = pool.splice(Math.max(0, idx), 1)[0];
      offers.push({ id, price: this.price(id, chapter), sold: false });
    }
    this.offers = offers;
    return offers;
  }

  buy(offerIdx, allCharIds, selectedCharId) {
    const o = this.offers[offerIdx];
    if (!o || o.sold || this.coins < o.price) return false;
    this.coins -= o.price;
    o.sold = true;
    this.items[o.id] = this.count(o.id) + 1;
    if (RUN_ITEMS[o.id].instant === 'companion') this.recruitRandom(allCharIds, selectedCharId);
    return true;
  }

  recruitRandom(allCharIds, selectedCharId) {
    const candidates = allCharIds.filter(id => id !== selectedCharId && !this.companions.includes(id));
    if (!candidates.length || this.companions.length >= CompanionManager.MAX) return null;
    const id = candidates[Math.floor(Math.random() * candidates.length)];
    this.companions.push(id);
    return id;
  }
}

// ─────────────────────────── 동료 사원 ───────────────────────────
// 동료별 전투 방식: 캐릭터의 기본 무기를 약하게 사용, 팀장은 회복 담당
const COMPANION_ROLE = {
  intern: { weapon: 'stapler', label: '스테이플러 지원' },
  planner: { weapon: 'laser', label: '레이저 지원' },
  deputy: { weapon: 'keyboard', label: '키보드 지원' },
  manager: { heal: true, label: '회복 지원' }
};

class Companion {
  constructor(charId, x, y, slot) {
    this.charId = charId;
    this.data = window.GAME_DATA.CHARACTERS[charId];
    this.role = COMPANION_ROLE[charId] || COMPANION_ROLE.intern;
    this.x = x;
    this.y = y;
    this.slot = slot;
    this.radius = 14;
    this.facing = 1;
    this.walkTimer = 0;
    this.moving = false;
    this.attackTimer = Math.random();
    this.isAlive = true;
  }

  // 플레이어 기준 대형 위치 (좌/우/뒤)
  formationTarget(player) {
    const offsets = [[-52, 18], [52, 18], [0, 52]];
    const [ox, oy] = offsets[this.slot % offsets.length];
    return { x: player.x + ox, y: player.y + oy };
  }

  update(dt, player, monsters, weaponMgr, fx) {
    const t = this.formationTarget(player);
    const dx = t.x - this.x;
    const dy = t.y - this.y;
    const dist = Math.hypot(dx, dy);

    // 너무 멀어지면 순간 합류 (장애물에 끼는 문제 방지)
    if (dist > 420) {
      this.x = t.x;
      this.y = t.y;
      if (fx) fx.spawnPuff(this.x, this.y - 10, 50, '#bae6fd', 0.4, 0.6);
    } else if (dist > 10) {
      const spd = player.charData.speed * player.stats.speedMul * 1.15 * 60 * dt;
      const step = Math.min(dist, spd);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      if (Math.abs(dx) > 2) this.facing = dx < 0 ? -1 : 1;
      if (window.game && window.game.propMgr) window.game.propMgr.resolveCollisions(this);
      this.moving = true;
      this.walkTimer += dt * 10;
    } else {
      this.moving = false;
    }

    // 전투: 레벨은 플레이어 레벨에 비례
    const lv = Math.min(8, 1 + Math.floor(player.level / 3));
    this.attackTimer += dt;

    if (this.role.heal) {
      if (this.attackTimer >= 4) {
        this.attackTimer = 0;
        const heal = Math.max(2, Math.floor(player.maxHp * 0.05));
        if (player.hp < player.maxHp) {
          player.hp = Math.min(player.maxHp, player.hp + heal);
          if (fx) {
            fx.spawnFlash(player.x, player.y - 14, 'fx_glow', '#34d399', 90, 0.5, { follow: player });
            fx.spawnFloatingText(player.x, player.y - 42, `+${heal}`, '#34d399');
          }
        }
      }
      return;
    }

    const stats = weaponMgr.getWeaponStats(this.role.weapon, lv);
    if (!stats) return;
    const cd = stats.cooldown * 1.35 * (1 - player.stats.cdReduc);
    if (this.attackTimer >= cd && monsters.some(m => m.isAlive && Math.hypot(m.x - this.x, m.y - this.y) < 520)) {
      this.attackTimer = 0;
      // 동료는 플레이어 스탯의 60% 공격력으로 같은 무기를 사용
      const proxy = {
        x: this.x,
        y: this.y,
        facing: this.facing < 0 ? 'left' : 'right',
        stats: { ...player.stats, atkMul: player.stats.atkMul * 0.6 }
      };
      weaponMgr.fireWeapon(this.role.weapon, lv, proxy, monsters, fx);
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const a = window.assets;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // 동료 표시 링
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 16, 6.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    const pose = this.moving ? 'walk' + (Math.floor(this.walkTimer * 0.9) % 8) : 'idle';
    if (!(a && a.drawSprite(ctx, `char_${this.data.sprite}_${pose}`, sx, sy + 2, 0.46, { flip: this.facing < 0 }))) {
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(sx, sy - 18, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

class CompanionManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.list = [];
    this.rescue = null;     // 현재 구조 대기 중인 동료
    this.schedule = [];     // 구조 이벤트 발생 시점 (경과 비율 또는 초)
    this.fired = 0;
  }

  // 스테이지 시작: 런에 합류한 동료 배치 + 구조 이벤트 일정
  setup(player, runCompanions, stage) {
    this.reset();
    runCompanions.forEach(id => this.addCompanion(id, player));
    this.schedule = stage ? [0.2, 0.55] : [90, 300, 480];
    this.isStage = !!stage;
  }

  addCompanion(charId, player) {
    if (this.list.length >= CompanionManager.MAX) return null;
    const c = new Companion(charId, player.x, player.y + 30, this.list.length);
    this.list.push(c);
    return c;
  }

  // 구조 이벤트: 플레이어에서 떨어진 빈 자리에 갇힌 동료 등장
  trySpawnRescue(game) {
    const run = game.run;
    const taken = [game.selectedCharId, ...run.companions];
    const candidates = Object.keys(window.GAME_DATA.CHARACTERS).filter(id => !taken.includes(id));
    if (!candidates.length || this.list.length >= CompanionManager.MAX) return;

    const p = game.player;
    for (let tries = 0; tries < 40; tries++) {
      const ang = Math.random() * Math.PI * 2;
      const d = 360 + Math.random() * 180;
      const x = Math.max(160, Math.min(OfficeMap.SIZE - 160, p.x + Math.cos(ang) * d));
      const y = Math.max(180, Math.min(OfficeMap.SIZE - 160, p.y + Math.sin(ang) * d));
      if (game.propMgr.overlapsObstacle(x - 30, y - 30, 60, 60, 10)) continue;
      this.rescue = { charId: candidates[Math.floor(Math.random() * candidates.length)], x, y, timer: 30, progress: 0, anim: 0 };
      const name = window.GAME_DATA.CHARACTERS[this.rescue.charId].name;
      game.effectEngine.spawnEventBanner(`[구조 요청] 야근에 갇힌 동료 발견!`, `${name} 곁에 잠시 머물러 구출하세요 (30초)`, '#34d399');
      if (window.soundEngine) window.soundEngine.playBossAlert();
      return;
    }
  }

  update(dt, game) {
    const p = game.player;
    const fx = game.effectEngine;

    // 구조 이벤트 일정 체크
    if (this.fired < this.schedule.length) {
      const at = this.schedule[this.fired];
      const reached = this.isStage
        ? (game.currentStage.duration - game.gameTime) / game.currentStage.duration >= at
        : (600 - game.gameTime) >= at;
      if (reached) {
        this.fired++;
        if (!this.rescue) this.trySpawnRescue(game);
      }
    }

    // 구조 진행: 근처에 머무르면 게이지 상승
    const r = this.rescue;
    if (r) {
      r.timer -= dt;
      r.anim += dt;
      const near = Math.hypot(p.x - r.x, p.y - r.y) < 70;
      r.progress = near ? Math.min(1, r.progress + dt / 1.2) : Math.max(0, r.progress - dt * 0.5);
      if (r.progress >= 1) {
        game.run.companions.push(r.charId);
        const c = this.addCompanion(r.charId, p);
        if (c) { c.x = r.x; c.y = r.y; }
        fx.spawnFlash(r.x, r.y - 20, 'fx_magic', '#34d399', 140, 0.7, { spin: 3 });
        fx.spawnEmote(r.x, r.y, 'heart', c);
        fx.spawnFloatingText(r.x, r.y - 60, `🤝 ${window.GAME_DATA.CHARACTERS[r.charId].name} 합류!`, '#34d399');
        if (window.soundEngine) window.soundEngine.playLevelUp();
        this.rescue = null;
      } else if (r.timer <= 0) {
        fx.spawnPuff(r.x, r.y - 10, 60, '#94a3b8', 0.6, 0.7);
        fx.spawnFloatingText(r.x, r.y - 50, '동료가 먼저 퇴근했습니다…', '#94a3b8');
        this.rescue = null;
      }
    }

    this.list.forEach(c => c.update(dt, p, game.monsterMgr.monsters, game.weaponMgr, fx));
  }

  collectRenderables(ctx, camera, out) {
    this.list.forEach(c => out.push({ y: c.y, draw: () => c.render(ctx, camera) }));
    const r = this.rescue;
    if (r) out.push({ y: r.y, draw: () => this.renderRescue(ctx, camera, r) });
  }

  renderRescue(ctx, camera, r) {
    const sx = r.x - camera.x;
    const sy = r.y - camera.y;
    const pulse = (Math.sin(r.anim * 5) + 1) / 2;

    // 구조 범위 + 진행 게이지
    ctx.save();
    ctx.strokeStyle = `rgba(52, 211, 153, ${0.35 + pulse * 0.3})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(sx, sy, 70, 28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (r.progress > 0) {
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(sx, sy - 88, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * r.progress);
      ctx.stroke();
    }
    ctx.restore();

    const a = window.assets;
    const data = window.GAME_DATA.CHARACTERS[r.charId];
    const shake = Math.sin(r.anim * 20) * 1.2;
    if (a) a.drawSprite(ctx, `char_${data.sprite}_hurt`, sx + shake, sy + 2, 0.46);

    // SOS 말풍선 + 남은 시간
    if (a) a.draw(ctx, 'emote_exclamations', sx, sy - 88 - pulse * 4, 30, 36);
    ctx.fillStyle = '#ecfdf5';
    ctx.font = '800 11px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`구출 ${Math.ceil(r.timer)}s`, sx, sy + 22);
  }

  // 화면 밖 구조 대상 방향 화살표
  renderIndicator(ctx, camera, viewW, viewH, player) {
    const r = this.rescue;
    if (!r) return;
    const sx = r.x - camera.x;
    const sy = r.y - camera.y;
    if (sx > 20 && sx < viewW - 20 && sy > 150 && sy < viewH - 20) return;
    const px = player.x - camera.x;
    const py = player.y - camera.y;
    const ang = Math.atan2(sy - py, sx - px);
    // 플레이어→대상 방향 직선이 화면 가장자리(HUD 아래)와 만나는 지점
    const margin = 34;
    const left = margin, right = viewW - margin, top = 170, bottom = viewH - margin;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    let t = Infinity;
    if (dx > 0) t = Math.min(t, (right - px) / dx);
    if (dx < 0) t = Math.min(t, (left - px) / dx);
    if (dy > 0) t = Math.min(t, (bottom - py) / dy);
    if (dy < 0) t = Math.min(t, (top - py) / dy);
    const cx = px + dx * t;
    const cy = py + dy * t;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = 'rgba(6, 78, 59, 0.9)';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(ang);
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(16, -7);
    ctx.lineTo(16, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ecfdf5';
    ctx.font = '900 12px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SOS', cx, cy);
    ctx.textBaseline = 'alphabetic';
  }
}

CompanionManager.MAX = 3;

window.RUN_ITEMS = RUN_ITEMS;
window.RunManager = RunManager;
window.CompanionManager = CompanionManager;
