// Office Escape Survivor - Permanent Save & Progression Manager

class SaveManager {
  constructor() {
    this.STORAGE_KEY = 'office_survivor_save_v1';
    this.data = {
      totalGold: 0,
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
          highScore: { ...this.data.highScore, ...(parsed.highScore || {}) }
        };
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

  getGold() {
    return this.data.totalGold || 0;
  }

  addGold(amount) {
    this.data.totalGold = (this.data.totalGold || 0) + amount;
    this.save();
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
