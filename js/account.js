// Account & Character Slot Persistence System

class AccountManager {
  constructor() {
    this.STORAGE_KEY = 'abyss_tower_arpg_accounts_v2';
    this.CURRENT_ACCT_KEY = 'abyss_tower_current_acct_v2';
    this.accounts = {};
    this.currentAccount = null;
    this.activeCharacter = null;
    this.loadAll();
  }

  loadAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.accounts = JSON.parse(data);
      } else {
        // 최초 접속 시 99레벨 테스트 전사 계정 생성
        this.accounts = {
          'Master_Hero': {
            username: 'Master_Hero',
            createdAt: Date.now(),
            characters: []
          }
        };
        this.saveAll();
      }

      const lastAcct = localStorage.getItem(this.CURRENT_ACCT_KEY);
      if (lastAcct && this.accounts[lastAcct]) {
        this.currentAccount = this.accounts[lastAcct];
      } else {
        this.currentAccount = this.accounts[Object.keys(this.accounts)[0]];
      }

      if (this.currentAccount && this.currentAccount.characters.length === 0) {
        this.createCharacter('전설의 용사', 'warrior', 99);
      } else if (this.currentAccount && this.currentAccount.characters.length > 0) {
        this.activeCharacter = this.currentAccount.characters[0];
        // 기존 유저도 99레벨로 부스팅
        if (this.activeCharacter.level < 99) {
          this.boostCharacterTo99(this.activeCharacter);
        }
      }
    } catch (e) {
      console.error('Failed to load accounts', e);
    }
  }

  boostCharacterTo99(char) {
    char.level = 99;
    char.exp = 0;
    char.nextExp = 99999999;
    char.gold = 500000;
    char.potions = 99;
    char.materials = {
      upgrade_stone: 150,
      iron_ore: 300,
      dimension_shard: 80,
      abyss_crystal: 50
    };
    char.currentFloor = 100;
    char.maxFloorReached = 100;

    const cls = CLASSES[char.job];
    // 99레벨 에픽 전용 무기 지급 (3소켓 부여)
    char.equip.weapon = ItemGenerator.generateItem({
      floor: 100,
      level: 99,
      rarity: 'epic',
      type: 'weapon',
      weaponType: cls.weaponType
    });
    char.equip.weapon.enhance = 12;
    char.equip.weapon.sockets = 3;
    char.equip.weapon.gemList = [];

    // 99레벨 에픽 방어구 풀세트 지급
    ['helmet', 'armor', 'gloves', 'boots'].forEach(slot => {
      char.equip[slot] = ItemGenerator.generateItem({
        floor: 100,
        level: 99,
        rarity: 'epic',
        type: 'armor',
        slot: slot,
        armorType: 'plate'
      });
      char.equip[slot].enhance = 10;
      char.equip[slot].sockets = 2;
      char.equip[slot].gemList = [];
    });

    // 보석 합성 & 세공 테스트를 위한 초기 보석 세트 지급 (동일 보석 3개씩)
    char.inventory = [
      { ...GEMS.ruby_1 },
      { ...GEMS.ruby_1 },
      { ...GEMS.ruby_1 },
      { ...GEMS.sapphire_1 },
      { ...GEMS.sapphire_1 },
      { ...GEMS.sapphire_1 },
      { ...GEMS.emerald_2 },
      { ...GEMS.emerald_2 },
      { ...GEMS.emerald_2 },
      { ...GEMS.diamond_1 },
      { ...GEMS.diamond_1 },
      { ...GEMS.diamond_1 },
      { ...GEMS.diamond_3 }
    ];

    this.saveAll();
  }

  saveAll() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.accounts));
      if (this.currentAccount) {
        localStorage.setItem(this.CURRENT_ACCT_KEY, this.currentAccount.username);
      }
    } catch (e) {
      console.error('Failed to save accounts', e);
    }
  }

  loginOrCreate(username) {
    if (!username || username.trim() === '') return false;
    username = username.trim();
    if (!this.accounts[username]) {
      this.accounts[username] = {
        username: username,
        createdAt: Date.now(),
        characters: []
      };
    }
    this.currentAccount = this.accounts[username];
    this.saveAll();
    return true;
  }

  // 신규 캐릭터 생성 (기본 99레벨 지원)
  createCharacter(name, job, level = 99) {
    if (!this.currentAccount) return null;
    const cls = CLASSES[job];
    if (!cls) return null;

    const charId = 'char_' + Date.now();
    const newChar = {
      id: charId,
      name: name.trim() || '영웅',
      job: job,
      level: level,
      exp: 0,
      nextExp: 99999999,
      gold: 500000,
      currentFloor: 100,
      maxFloorReached: 100,
      potions: 99,
      equip: {
        weapon: null,
        helmet: null,
        armor: null,
        gloves: null,
        boots: null
      },
      inventory: [],
      materials: {
        upgrade_stone: 150,
        iron_ore: 300,
        dimension_shard: 80,
        abyss_crystal: 50
      },
      stats: { ...cls.baseStats },
      skillCooldowns: {},
      createdAt: Date.now()
    };

    // 99레벨 에픽 전용 무기 세팅 (+12강, 3소켓)
    const epicWeapon = ItemGenerator.generateItem({
      floor: 100,
      level: 99,
      rarity: 'epic',
      type: 'weapon',
      weaponType: cls.weaponType
    });
    epicWeapon.enhance = 12;
    epicWeapon.sockets = 3;
    epicWeapon.gemList = [];
    newChar.equip.weapon = epicWeapon;

    // 99레벨 에픽 방어구 세팅 (+10강, 2소켓)
    ['helmet', 'armor', 'gloves', 'boots'].forEach(slot => {
      const eq = ItemGenerator.generateItem({
        floor: 100,
        level: 99,
        rarity: 'epic',
        type: 'armor',
        slot: slot,
        armorType: job === 'mage' ? 'cloth' : (job === 'rogue' ? 'leather' : 'plate')
      });
      eq.enhance = 10;
      eq.sockets = 2;
      eq.gemList = [];
      newChar.equip[slot] = eq;
    });

    // 보석 합성 & 세공 테스트용 초기 보석
    newChar.inventory = [
      { ...GEMS.ruby_1 },
      { ...GEMS.ruby_1 },
      { ...GEMS.ruby_1 },
      { ...GEMS.sapphire_1 },
      { ...GEMS.sapphire_1 },
      { ...GEMS.sapphire_1 },
      { ...GEMS.emerald_2 },
      { ...GEMS.emerald_2 },
      { ...GEMS.emerald_2 },
      { ...GEMS.diamond_1 },
      { ...GEMS.diamond_1 },
      { ...GEMS.diamond_1 },
      { ...GEMS.diamond_3 }
    ];

    this.currentAccount.characters.push(newChar);
    this.activeCharacter = newChar;
    this.saveAll();
    return newChar;
  }

  deleteCharacter(charId) {
    if (!this.currentAccount) return false;
    const idx = this.currentAccount.characters.findIndex(c => c.id === charId);
    if (idx !== -1) {
      this.currentAccount.characters.splice(idx, 1);
      if (this.activeCharacter && this.activeCharacter.id === charId) {
        this.activeCharacter = this.currentAccount.characters[0] || null;
      }
      this.saveAll();
      return true;
    }
    return false;
  }

  selectCharacter(charId) {
    if (!this.currentAccount) return false;
    const char = this.currentAccount.characters.find(c => c.id === charId);
    if (char) {
      this.activeCharacter = char;
      this.saveAll();
      return true;
    }
    return false;
  }

  saveActiveCharacterProgress(player) {
    if (!this.activeCharacter || !player) return;
    this.activeCharacter.level = player.level;
    this.activeCharacter.exp = player.exp;
    this.activeCharacter.nextExp = player.nextExp;
    this.activeCharacter.gold = player.gold;
    this.activeCharacter.currentFloor = player.currentFloor;
    this.activeCharacter.maxFloorReached = Math.max(this.activeCharacter.maxFloorReached, player.currentFloor);
    this.activeCharacter.potions = player.potions;
    this.activeCharacter.equip = player.equip;
    this.activeCharacter.inventory = player.inventory;
    this.activeCharacter.materials = player.materials;
    this.activeCharacter.skillRunes = player.skillRunes;
    this.activeCharacter.researchLevels = player.researchLevels;
    this.activeCharacter.hiredMercenaries = player.hiredMercenaries;
    this.activeCharacter.mercenaryId = player.mercenaryId;
    this.activeCharacter.runestones = Array.isArray(player.runestones) ? player.runestones : [];
    this.activeCharacter.runestoneCurrency = Number(player.runestoneCurrency) || 0;
    this.activeCharacter.relics = player.relics || [];
    this.saveAll();
  }
}

window.accountMgr = new AccountManager();
