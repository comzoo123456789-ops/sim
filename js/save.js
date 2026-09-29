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
      totalPropsDestroyed: 0
    };

    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed,
          upgrades: { ...this.data.upgrades, ...(parsed.upgrades || {}) },
          achievements: { ...this.data.achievements, ...(parsed.achievements || {}) },
          highScore: { ...this.data.highScore, ...(parsed.highScore || {}) },
          unlockedStages: parsed.unlockedStages || ['1-1'],
          stageStars: parsed.stageStars || {},
          clearedStages: parsed.clearedStages || []
        };
        // 구버전 세이브: 누적 획득량이 없으면 현재 잔액으로 시작
        if (!parsed.totalGoldEarned) {
          this.data.totalGoldEarned = this.data.totalGold || 0;
        }
      }
    } catch (e) {
      console.warn('Save load failed, using defaults', e);
    }
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Save write failed', e);
    }
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

    // 다음 스테이지 자동 해금
    const parts = stageId.split('-');
    if (parts.length === 2) {
      const nextNum = parseInt(parts[1], 10) + 1;
      const nextId = `${parts[0]}-${nextNum}`;
      if (!this.data.unlockedStages.includes(nextId) && nextNum <= 10) {
        this.data.unlockedStages.push(nextId);
      }
    }

    if (goldReward > 0) {
      this.addGold(goldReward);
    }

    this.save();
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

window.SaveManager = SaveManager;
window.saveMgr = new SaveManager();
