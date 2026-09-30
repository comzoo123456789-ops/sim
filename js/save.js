// Office Escape Survivor - Permanent Save & Progression Manager

class SaveManager {
  constructor() {
    this.STORAGE_KEY = 'office_survivor_save_v1';
    this.data = {
      totalGold: 0,
      totalGoldEarned: 0, // 누적 획득 코인 (상점 소비와 무관, 업적 판정용)
      highScore: {
        survivedTime: 0,
        maxKills: 0,
        maxLevel: 1
      },
      upgrades: {
        hp: 0,
        speed: 0,
        atk: 0,
        cd: 0,
        magnet: 0,
        gold: 0
      },
      achievements: {}, // { ach_first_clear: true, ... }
      unlockedBestiary: ['paper', 'slime'],
      unlockedStages: ['1-1'],
      stageStars: {}, // { '1-1': 3, '1-2': 2 }
      clearedStages: [],
      totalRuns: 0,
      totalKills: 0,
      totalPropsDestroyed: 0,
      updatedAt: 0 // 마지막으로 진행이 바뀐 시각 (클라우드 저장과 비교)
    };
    this.defaults = JSON.parse(JSON.stringify(this.data));

    this.load();
    this.applyTestUnlock();
  }

  // 테스트 기간: 1-1 ~ 10-10 전 스테이지 해금 (SaveManager.TEST_UNLOCK_ALL = false 로 바꾸면 정상 진행 방식)
  // 주소에 ?unlock=all 을 붙여도 해금됨
  applyTestUnlock() {
    try {
      const byUrl = new URLSearchParams(window.location.search).get('unlock') === 'all';
      if (!SaveManager.TEST_UNLOCK_ALL && !byUrl) return;
      const all = [];
      for (let ch = 1; ch <= SaveManager.MAX_CHAPTER; ch++) {
        for (let st = 1; st <= 10; st++) all.push(`${ch}-${st}`);
      }
      this.data.unlockedStages = all;
      this.save(false);
    } catch (e) {
      console.warn('test unlock failed', e);
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) this.applyData(JSON.parse(raw));
    } catch (e) {
      console.warn('Save load failed, using defaults', e);
    }
  }

  // 저장 데이터를 기본값 위에 덮어 적용 (로컬 불러오기 · 클라우드 불러오기 공통)
  applyData(parsed) {
    const base = JSON.parse(JSON.stringify(this.defaults));
    this.data = {
      ...base,
      ...parsed,
      upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
      achievements: { ...(parsed.achievements || {}) },
      highScore: { ...base.highScore, ...(parsed.highScore || {}) },
      unlockedBestiary: parsed.unlockedBestiary || base.unlockedBestiary,
      unlockedStages: parsed.unlockedStages || ['1-1'],
      stageStars: parsed.stageStars || {},
      clearedStages: parsed.clearedStages || []
    };
    // 구버전 세이브: 누적 획득량이 없으면 현재 잔액으로 시작
    if (!parsed.totalGoldEarned) {
      this.data.totalGoldEarned = this.data.totalGold || 0;
    }
  }

  // touch=false: 진행이 바뀐 게 아니라 표시용 보정만 한 경우 (시각 유지, 업로드 안 함)
  save(touch = true) {
    if (touch) this.data.updatedAt = Date.now();
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Save write failed', e);
    }
    if (touch && window.account) window.account.scheduleUpload();
  }

  // 진행 요약 (계정 저장 선택 화면용)
  static summary(data) {
    const d = data || {};
    const stars = Object.values(d.stageStars || {}).reduce((n, v) => n + (v || 0), 0);
    return {
      cleared: (d.clearedStages || []).length,
      stars,
      gold: d.totalGold || 0,
      runs: d.totalRuns || 0,
      updatedAt: d.updatedAt || 0
    };
  }

  static hasProgress(data) {
    const s = SaveManager.summary(data);
    return s.cleared > 0 || s.runs > 0 || s.gold > 0;
  }

  isStageUnlocked(stageId) {
    return this.data.unlockedStages.includes(stageId);
  }

  getStageStars(stageId) {
    return this.data.stageStars[stageId] || 0;
  }

  saveStageClear(stageId, stars, goldReward) {
    if (!this.data.clearedStages.includes(stageId)) {
      this.data.clearedStages.push(stageId);
    }
    const curStars = this.data.stageStars[stageId] || 0;
    this.data.stageStars[stageId] = Math.max(curStars, stars);

    // 다음 스테이지 자동 해금 (x-10 클리어 시 다음 챕터 1스테이지)
    const nextId = SaveManager.nextStageId(stageId);
    if (nextId && !this.data.unlockedStages.includes(nextId)) {
      this.data.unlockedStages.push(nextId);
    }

    // 챕터 정복 업적
    if (stageId === '5-10') this.checkAchievement('ach_chapter5', true);
    if (stageId === '10-10') this.checkAchievement('ach_chapter10', true);

    if (goldReward > 0) {
      this.addGold(goldReward);
    }

    this.save();
  }

  // "3-10" → "4-1", "10-10" → null
  static nextStageId(stageId) {
    const [ch, st] = stageId.split('-').map(n => parseInt(n, 10));
    if (!ch || !st) return null;
    if (st < 10) return `${ch}-${st + 1}`;
    if (ch < SaveManager.MAX_CHAPTER) return `${ch + 1}-1`;
    return null;
  }

  // 로비에서 보여 줄 스테이지: 마지막으로 플레이한 스테이지 → 없으면 가장 멀리 깬 다음 스테이지
  // (테스트 전체 해금 중에도 해금 목록이 아니라 실제 진행 기준)
  progressStageId() {
    const last = this.data.lastStageId;
    if (last && this.isStageUnlocked(last)) return last;
    const key = id => { const [c, s] = id.split('-').map(Number); return c * 100 + s; };
    const cleared = (this.data.clearedStages || []).slice().sort((a, b) => key(a) - key(b));
    if (!cleared.length) return '1-1';
    const furthest = cleared[cleared.length - 1];
    return SaveManager.nextStageId(furthest) || furthest;
  }

  // 챕터 안에서 아직 안 깬 첫 스테이지 (다 깼으면 마지막 스테이지)
  firstUnclearedIn(ch) {
    for (let s = 1; s <= 10; s++) {
      const id = `${ch}-${s}`;
      if (!(this.data.clearedStages || []).includes(id)) return this.isStageUnlocked(id) ? id : `${ch}-1`;
    }
    return `${ch}-10`;
  }

  setLastStage(stageId) {
    if (this.data.lastStageId === stageId) return;
    this.data.lastStageId = stageId;
    this.save();
  }

  isChapterUnlocked(ch) {
    return this.isStageUnlocked(`${ch}-1`);
  }

    getGold() {
    return this.data.totalGold || 0;
  }

  addGold(amount) {
    this.data.totalGold = (this.data.totalGold || 0) + amount;
    if (amount > 0) {
      this.data.totalGoldEarned = (this.data.totalGoldEarned || 0) + amount;
    }
    this.save();
  }

  // 누적 처치/코인 기반 업적 일괄 검사
  checkProgressAchievements() {
    const kills = this.data.totalKills || 0;
    const earned = this.data.totalGoldEarned || 0;
    if (kills >= 500) this.checkAchievement('ach_kills_500', true);
    if (kills >= 2000) this.checkAchievement('ach_kills_2000', true);
    if (earned >= 1000) this.checkAchievement('ach_gold_1000', true);
    if (earned >= 5000) this.checkAchievement('ach_gold_5000', true);
  }

  getUpgradeLevel(key) {
    return this.data.upgrades[key] || 0;
  }

  buyUpgrade(key) {
    const upDef = window.GAME_DATA.SHOP_UPGRADES[key];
    if (!upDef) return false;

    const curLv = this.getUpgradeLevel(key);
    if (curLv >= upDef.maxLv) return false;

    const cost = Math.floor(upDef.baseCost * Math.pow(upDef.costMul, curLv));
    if (this.data.totalGold < cost) return false;

    this.data.totalGold -= cost;
    this.data.upgrades[key] = curLv + 1;
    this.save();
    return true;
  }

  unlockBestiary(key) {
    if (!this.data.unlockedBestiary.includes(key)) {
      this.data.unlockedBestiary.push(key);
      this.save();
    }
  }

  checkAchievement(id, conditionMet) {
    if (conditionMet && !this.data.achievements[id]) {
      this.data.achievements[id] = true;
      const ach = window.GAME_DATA.ACHIEVEMENTS.find(a => a.id === id);
      if (ach && ach.reward) {
        this.addGold(ach.reward);
      }
      this.save();

      if (window.game && window.game.effectEngine && window.game.player) {
        window.game.effectEngine.spawnFloatingText(
          window.game.player.x,
          window.game.player.y - 70,
          `🏆 업적 달성: ${ach ? ach.name : id}! (+${ach ? ach.reward : 0} 코인)`,
          '#ffd700'
        );
      }
      if (window.soundEngine) window.soundEngine.playVictory();
    }
  }
}

SaveManager.MAX_CHAPTER = 10;
SaveManager.TEST_UNLOCK_ALL = true; // 출시 전 테스트용 전체 해금

window.SaveManager = SaveManager;
window.saveMgr = new SaveManager();
