// Items, Equipment, Drop Generator, Crafting & Enhancement System

const RARITIES = {
  normal: { id: 'normal', name: '노멀', color: '#c0c5cf', border: '#7a8194', subStatCount: 0, mult: 1.0, socketChance: 0 },
  rare:   { id: 'rare',   name: '희귀', color: '#3399ff', border: '#1f6ec7', subStatCount: 2, mult: 1.35, socketChance: 0.35, maxSockets: 1 },
  unique: { id: 'unique', name: '유니크', color: '#b55fe6', border: '#8431b5', subStatCount: 3, mult: 1.8, socketChance: 0.65, maxSockets: 2 },
  epic:   { id: 'epic',   name: '에픽', color: '#ff9900', border: '#c76e00', subStatCount: 4, mult: 2.5, socketChance: 0.85, maxSockets: 3 }
};

const SUBSTAT_POOL = [
  { id: 'critRate', name: '치명타 확률', format: v => `+${(v * 100).toFixed(1)}%`, min: 0.02, max: 0.07 },
  { id: 'critDmg', name: '치명타 피해량', format: v => `+${(v * 100).toFixed(0)}%`, min: 0.15, max: 0.45 },
  { id: 'fireDmg', name: '화염 추가 피해', format: v => `+${v}`, min: 8, max: 25, isFlat: true },
  { id: 'coldDmg', name: '냉기 추가 피해', format: v => `+${v}`, min: 8, max: 25, isFlat: true },
  { id: 'lightningDmg', name: '번개 추가 피해', format: v => `+${v}`, min: 10, max: 30, isFlat: true },
  { id: 'darkDmg', name: '암흑 추가 피해', format: v => `+${v}`, min: 12, max: 35, isFlat: true },
  { id: 'atkSpeed', name: '공격 속도 증가', format: v => `+${(v * 100).toFixed(1)}%`, min: 0.05, max: 0.18 },
  { id: 'speed', name: '이동 속도 증가', format: v => `+${(v * 100).toFixed(1)}%`, min: 0.04, max: 0.14 },
  { id: 'str', name: '힘 (STR)', format: v => `+${v}`, min: 4, max: 15, isStat: true },
  { id: 'dex', name: '민첩 (DEX)', format: v => `+${v}`, min: 4, max: 15, isStat: true },
  { id: 'int', name: '지능 (INT)', format: v => `+${v}`, min: 4, max: 15, isStat: true },
  { id: 'eva', name: '회피율', format: v => `+${(v * 100).toFixed(1)}%`, min: 0.02, max: 0.08 },
  { id: 'maxHp', name: '최대 체력', format: v => `+${v}`, min: 30, max: 120, isHp: true },
  { id: 'maxMp', name: '최대 마나', format: v => `+${v}`, min: 20, max: 80, isHp: true }
];

const WEAPON_NAMES = {
  sword: ['수련자의 검', '강철 롱소드', '기사의 기병검', '차원의 서슬검', '심연 학살검', '마황의 파멸검'],
  staff: ['견습 마법봉', '흑요석 지팡이', '원소 증폭 로드', '별빛의 영혼봉', '심연 비전장', '아자젤의 종말장'],
  dual_blades: ['수습생 단검', '쌍둥이 암살도', '그림자 절단검', '맹독의 쌍비수', '심연의 어둠검', '환영의 영혼도'],
  knuckle: ['가죽 글러브', '청동 너클', '강철 건틀릿', '폭풍의 권갑', '패황의 파천갑', '성스러운 투신의 손']
};

const ARMOR_NAMES = {
  cloth: {
    helmet: ['마법사 모자', '비전의 두건', '차원 현자의 관'],
    armor: ['수련 로브', '마력의 외투', '심연 비전 로브'],
    gloves: ['천 장갑', '영혼의 붕대', '마도사의 손길'],
    boots: ['천 신발', '비전 가죽신', '시공간의 워커']
  },
  leather: {
    helmet: ['가죽 모자', '그림자 복면', '심연의 섀도우 마스크'],
    armor: ['가죽 튜닉', '암살자의 가죽갑', '차원 추적자의 슈트'],
    gloves: ['가죽 글러브', '질풍의 손장갑', '칼날 접촉 장갑'],
    boots: ['가죽 부츠', '은밀한 쾌속화', '차원의 질풍 부츠']
  },
  plate: {
    helmet: ['강철 투구', '기사의 면갑', '마황의 철가면'],
    armor: ['판금 갑옷', '강철 흉갑', '심연 요새의 대갑'],
    gloves: ['판금 건틀릿', '수호자의 철장갑', '불굴의 거인 손'],
    boots: ['판금 부츠', '철벽의 그리브', '대지 분쇄의 군화']
  }
};

class ItemGenerator {
  // 층수 기반 스마트 아이템 레벨 산출 (예: 80층에서는 절대 1레벨 템 안 나옴!)
  static getSmartItemLevel(floor) {
    const f = Math.max(1, Math.min(GAME_CONFIG.MAX_FLOOR, floor));
    // 층수 - 3 ~ 층수 + 2 사이로 스케일링, 최소 1, 최대 99
    const minL = Math.max(1, f - 3);
    const maxL = Math.min(99, f + 2);
    return Math.floor(Math.random() * (maxL - minL + 1)) + minL;
  }

  // 무작위 희귀도 결정
  static rollRarity(isBoss = false, isMimic = false) {
    const rand = Math.random();
    if (isBoss) {
      if (rand < 0.25) return 'epic';
      if (rand < 0.70) return 'unique';
      return 'rare';
    }
    if (isMimic) {
      if (rand < 0.40) return 'epic';
      if (rand < 0.85) return 'unique';
      return 'rare';
    }
    if (rand < 0.05) return 'epic';
    if (rand < 0.20) return 'unique';
    if (rand < 0.50) return 'rare';
    return 'normal';
  }

  // 아이템 생성 메인 함수
  static generateItem(options = {}) {
    const floor = options.floor || 1;
    const itemLevel = options.level || this.getSmartItemLevel(floor);
    const rarityKey = options.rarity || this.rollRarity(options.isBoss, options.isMimic);
    const rarity = RARITIES[rarityKey];

    // 종류 결정 (무기 or 방어구)
    let type = options.type;
    if (!type) {
      const types = ['weapon', 'armor', 'armor', 'armor', 'armor'];
      type = types[Math.floor(Math.random() * types.length)];
    }

    const item = {
      id: 'item_' + Date.now() + '_' + Math.floor(Math.random() * 100000),
      type: type,
      level: itemLevel,
      rarity: rarityKey,
      rarityName: rarity.name,
      color: rarity.color,
      enhance: 0,
      sockets: 0,
      gemList: [],
      subStats: []
    };

    // 소켓 결정: 희귀 ~ 에픽 아이템에 확률형 소켓 (0개~maxSockets)
    if (rarity.socketChance && Math.random() < rarity.socketChance) {
      const numSockets = Math.floor(Math.random() * rarity.maxSockets) + 1;
      item.sockets = numSockets;
    }

    item.runestone = null;

    if (type === 'weapon') {
      this.populateWeapon(item, options.weaponType);
    } else {
      this.populateArmor(item, options.slot, options.armorType);
    }

    // 2번: 세트 아이템 판정 (유니크 30%, 에픽 50% 확률로 세트 장비 부여)
    const setChance = rarityKey === 'epic' ? 0.50 : (rarityKey === 'unique' ? 0.30 : 0);
    if (Math.random() < setChance && window.SET_ITEMS) {
      const setKeys = Object.keys(window.SET_ITEMS);
      const chosenSet = window.SET_ITEMS[setKeys[Math.floor(Math.random() * setKeys.length)]];
      item.setId = chosenSet.id;
      item.setName = chosenSet.name;
      item.setColor = chosenSet.color;
      item.name = `[${chosenSet.name}] ` + item.name;
    }

    // 부가 옵션 (Sub-Stats) 부여
    this.populateSubStats(item, rarity.subStatCount);

    return item;
  }

  // 무기 세부 생성
  static populateWeapon(item, fixedWeaponType = null) {
    const weaponKeys = ['sword', 'staff', 'dual_blades', 'knuckle'];
    const weaponType = fixedWeaponType || weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
    const rarity = RARITIES[item.rarity];

    item.weaponType = weaponType;
    item.slot = 'weapon';

    const names = WEAPON_NAMES[weaponType];
    const nameIdx = Math.min(names.length - 1, Math.floor((item.level - 1) / 18));
    item.name = names[nameIdx];
    item.icon = weaponType === 'sword' ? '🗡️' : weaponType === 'staff' ? '🪄' : weaponType === 'dual_blades' ? '⚔️' : '🥊';

    // 기본 공격력 계산 (레벨 + 등급 배수 + 5% 랜덤 오차)
    const baseAtk = Math.floor((item.level * 3.5 + 12) * rarity.mult * (0.95 + Math.random() * 0.1));
    item.baseStat = { atk: baseAtk };

    // 직업별 추천/고유 스탯 가산
    if (weaponType === 'sword') {
      item.reqClass = 'warrior';
      item.reqClassName = '전사';
      item.baseStat.str = Math.floor(item.level * 0.6 * rarity.mult);
    } else if (weaponType === 'staff') {
      item.reqClass = 'mage';
      item.reqClassName = '마법사';
      item.baseStat.int = Math.floor(item.level * 0.7 * rarity.mult);
    } else if (weaponType === 'dual_blades') {
      item.reqClass = 'rogue';
      item.reqClassName = '도적';
      item.baseStat.dex = Math.floor(item.level * 0.65 * rarity.mult);
    } else if (weaponType === 'knuckle') {
      item.reqClass = 'fighter';
      item.reqClassName = '격투가';
      item.baseStat.str = Math.floor(item.level * 0.45 * rarity.mult);
      item.baseStat.dex = Math.floor(item.level * 0.45 * rarity.mult);
    }
  }

  // 방어구 세부 생성 (천, 가죽, 중갑)
  static populateArmor(item, fixedSlot = null, fixedArmorType = null) {
    const slots = ['helmet', 'armor', 'gloves', 'boots'];
    const slot = fixedSlot || slots[Math.floor(Math.random() * slots.length)];
    const armorTypes = ['cloth', 'leather', 'plate'];
    const armorType = fixedArmorType || armorTypes[Math.floor(Math.random() * armorTypes.length)];
    const armorData = ARMOR_TYPES[armorType];
    const rarity = RARITIES[item.rarity];

    item.slot = slot;
    item.armorType = armorType;
    item.armorTypeName = armorData.name;

    const names = ARMOR_NAMES[armorType][slot];
    const nameIdx = Math.min(names.length - 1, Math.floor((item.level - 1) / 35));
    item.name = names[nameIdx];
    item.icon = slot === 'helmet' ? '🪖' : slot === 'armor' ? '🛡️' : slot === 'gloves' ? '🧤' : '👢';

    // 기본 방어력 & 체력 스탯
    const baseDef = Math.floor((item.level * 1.8 + 4) * armorData.defScale * rarity.mult * (0.95 + Math.random() * 0.1));
    const baseHp = Math.floor((item.level * 10 + 20) * armorData.hpScale * rarity.mult);

    item.baseStat = {
      def: Math.max(1, baseDef),
      maxHp: Math.max(5, baseHp)
    };

    // 방어구 특성 보너스 (천: 지능/마나, 가죽: 민첩/회피, 중갑: 힘/방어)
    if (armorType === 'cloth') {
      item.baseStat.int = Math.floor(item.level * 0.5 * armorData.intBonus * rarity.mult);
      item.baseStat.maxMp = Math.floor(item.level * 6 * armorData.mpBonus);
    } else if (armorType === 'leather') {
      item.baseStat.dex = Math.floor(item.level * 0.5 * armorData.dexBonus * rarity.mult);
      item.baseStat.eva = Number((armorData.evaBonus * (rarity.mult * 0.8)).toFixed(3));
    } else if (armorType === 'plate') {
      item.baseStat.str = Math.floor(item.level * 0.5 * armorData.strBonus * rarity.mult);
    }
  }

  // 부가 옵션 (Sub-Stats) 부여
  static populateSubStats(item, count) {
    if (count <= 0) return;
    const shuffled = [...SUBSTAT_POOL].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, count);

    chosen.forEach(sub => {
      let val = sub.min + Math.random() * (sub.max - sub.min);
      // 레벨 스케일링
      if (sub.isFlat || sub.isStat || sub.isHp) {
        val = Math.floor(val * (1 + (item.level / 20)));
      } else {
        val = Number(val.toFixed(3));
      }

      item.subStats.push({
        id: sub.id,
        name: sub.name,
        value: val,
        text: `${sub.name} ${sub.format(val)}`
      });
    });
  }
}

// 장비 관리자 (장착, 분해, 강화, 소켓 보석 결합)
class EquipmentManager {
  // 직업별 장비 착용 가능 여부 판별 (엄격한 규칙!)
  static canEquip(player, item) {
    if (!item) return { ok: false, reason: '아이템이 없습니다.' };

    if (item.isGem || !item.slot) {
      return {
        ok: false,
        reason: '보석은 대장간 [💎 보석 세공 & 합성] 탭에서 장비 소켓에 장착할 수 있습니다.'
      };
    }

    if (item.type === 'weapon') {
      const cls = CLASSES[player.job];
      if (item.weaponType !== cls.weaponType) {
        return {
          ok: false,
          reason: `${cls.name}은(는) [${cls.weaponName}]만 사용할 수 있습니다! (타 직업 무기 사용 불가)`
        };
      }
    }

    if (item.level > player.level) {
      return {
        ok: false,
        reason: `레벨 ${item.level} 이상만 착용할 수 있습니다. (현재 Lv.${player.level})`
      };
    }

    return { ok: true };
  }

  // 전투력 (Gear Score / Combat Power) 계산
  static calculateItemScore(item) {
    if (!item) return 0;
    let score = item.level * 10;
    if (item.baseStat.atk) score += item.baseStat.atk * 8;
    if (item.baseStat.def) score += item.baseStat.def * 6;
    if (item.baseStat.maxHp) score += item.baseStat.maxHp * 0.8;
    if (item.baseStat.str) score += item.baseStat.str * 5;
    if (item.baseStat.dex) score += item.baseStat.dex * 5;
    if (item.baseStat.int) score += item.baseStat.int * 5;
    if (item.enhance) score += item.enhance * 25;
    if (item.subStats) score += item.subStats.length * 40;
    if (item.gemList) score += item.gemList.length * 60;
    return Math.floor(score);
  }

  // 원클릭 자동 장착 (Auto-Equip)
  static autoEquip(player) {
    let changed = false;
    const slots = ['weapon', 'helmet', 'armor', 'gloves', 'boots'];

    slots.forEach(slot => {
      let currentEquip = player.equip[slot];
      let currentScore = currentEquip ? this.calculateItemScore(currentEquip) : 0;
      let bestItem = null;
      let bestScore = currentScore;
      let bestIdx = -1;

      player.inventory.forEach((invItem, idx) => {
        if (!invItem) return;
        if (invItem.slot !== slot) return;
        const check = this.canEquip(player, invItem);
        if (!check.ok) return;

        const score = this.calculateItemScore(invItem);
        if (score > bestScore) {
          bestScore = score;
          bestItem = invItem;
          bestIdx = idx;
        }
      });

      if (bestItem && bestIdx !== -1) {
        // 기존 템 가방으로, 새 템 장착
        player.inventory.splice(bestIdx, 1);
        if (currentEquip) {
          player.inventory.push(currentEquip);
        }
        player.equip[slot] = bestItem;
        changed = true;
      }
    });

    if (changed) {
      if (window.soundMgr) window.soundMgr.playItemEquip();
    }
    return changed;
  }

  // 장비 강화 (+1 ~ +15)
  static enhanceItem(player, item) {
    if (!item) return { ok: false, msg: '장비가 선택되지 않았습니다.' };
    const costGold = Math.floor((item.enhance + 1) * 200 * (1 + item.level / 10));
    const costStones = Math.floor((item.enhance + 1) * 1.5);

    if (player.gold < costGold) {
      return { ok: false, msg: `골드가 부족합니다. (필요: ${costGold} G)` };
    }
    const currentStones = player.materials.upgrade_stone || 0;
    if (currentStones < costStones) {
      return { ok: false, msg: `강화석이 부족합니다. (필요: ${costStones}개, 보유: ${currentStones}개)` };
    }

    // 강화 확률 (수치에 따라 점진적 감소)
    const successRates = [1.0, 0.95, 0.90, 0.80, 0.70, 0.60, 0.50, 0.40, 0.30, 0.25, 0.20, 0.15, 0.10, 0.07, 0.05];
    const rate = successRates[Math.min(successRates.length - 1, item.enhance)] || 0.05;

    player.gold -= costGold;
    player.materials.upgrade_stone -= costStones;

    const roll = Math.random();
    if (roll < rate) {
      item.enhance += 1;
      // 스탯 12% 증폭
      if (item.baseStat.atk) item.baseStat.atk = Math.floor(item.baseStat.atk * 1.12);
      if (item.baseStat.def) item.baseStat.def = Math.floor(item.baseStat.def * 1.12);
      if (item.baseStat.maxHp) item.baseStat.maxHp = Math.floor(item.baseStat.maxHp * 1.12);

      if (window.soundMgr) window.soundMgr.playEnhanceSuccess();
      return { ok: true, msg: `[강화 성공!] +${item.enhance} 강으로 상승했습니다!` };
    } else {
      if (window.soundMgr) window.soundMgr.playEnhanceFail();
      return { ok: false, msg: `[강화 실패] 마력이 분산되었습니다.` };
    }
  }

  // 장비 분해
  static disassembleItem(player, invIndex) {
    const item = player.inventory[invIndex];
    if (!item) return { ok: false, msg: '아이템이 없습니다.' };

    const rarity = RARITIES[item.rarity];
    const stones = Math.max(1, Math.floor((rarity.mult * 2) + (item.level / 15)));
    const iron = Math.floor(item.level / 8) + 2;
    const shards = item.rarity === 'unique' || item.rarity === 'epic' ? Math.floor(item.level / 20) + 1 : 0;

    player.materials.upgrade_stone = (player.materials.upgrade_stone || 0) + stones;
    player.materials.iron_ore = (player.materials.iron_ore || 0) + iron;
    if (shards > 0) {
      player.materials.dimension_shard = (player.materials.dimension_shard || 0) + shards;
    }

    player.inventory.splice(invIndex, 1);
    return {
      ok: true,
      msg: `분해 완료: 강화석 ${stones}개, 철광석 ${iron}개${shards > 0 ? `, 차원의 파편 ${shards}개` : ''} 획득!`
    };
  }

  // 보석 소켓 장착
  static socketGem(item, gemKey) {
    if (!item.sockets || item.sockets <= 0) {
      return { ok: false, msg: '이 아이템에는 소켓이 없습니다.' };
    }
    if (item.gemList.length >= item.sockets) {
      return { ok: false, msg: '소켓이 모두 채워져 있습니다.' };
    }
    const gem = GEMS[gemKey];
    if (!gem) return { ok: false, msg: '존재하지 않는 보석입니다.' };

    item.gemList.push(gemKey);
    return { ok: true, msg: `${gem.name}을(를) 소켓에 장착했습니다!` };
  }
}

// C: 보석 연금술 & 세공 관리자
class JewelAlchemyManager {
  // 동일 보석 3개 합성 -> 상위 티어 보석 생성
  static combineGems(player, gemKey) {
    const gem = GEMS[gemKey];
    if (!gem || gem.tier >= 4) {
      return { ok: false, msg: '최고 등급 보석이거나 합성할 수 없는 보석입니다.' };
    }

    // 인벤토리에서 동일 보석 3개 검색
    const indices = [];
    player.inventory.forEach((invItem, idx) => {
      if (invItem && invItem.id === gemKey) {
        indices.push(idx);
      }
    });

    if (indices.length < 3) {
      return { ok: false, msg: `동일한 ${gem.name}이 3개 필요합니다. (현재 보유: ${indices.length}개)` };
    }

    const nextTier = gem.tier + 1;
    const nextGemKey = `${gem.baseType}_${nextTier}`;
    const nextGem = GEMS[nextGemKey];
    if (!nextGem) return { ok: false, msg: '상위 등급 보석 데이터 오류' };

    const costGold = gem.tier * 2000;
    if (player.gold < costGold) {
      return { ok: false, msg: `합성 비용 골드가 부족합니다. (필요: ${costGold} G)` };
    }

    // 3개 소모
    player.gold -= costGold;
    // 뒤에서부터 splice
    indices.slice(0, 3).sort((a, b) => b - a).forEach(idx => {
      player.inventory.splice(idx, 1);
    });

    // 상위 보석 지급
    player.inventory.push(nextGem);
    if (window.soundMgr) window.soundMgr.playEnhanceSuccess();
    return { ok: true, msg: `[합성 대성공!] ${gem.name} 3개를 합성하여 ${nextGem.name}을(를) 연성했습니다!` };
  }

  // 장비에서 보석 추출/회수
  static extractGems(player, item) {
    if (!item.gemList || item.gemList.length === 0) {
      return { ok: false, msg: '추출할 보석이 없습니다.' };
    }
    const costGold = item.gemList.length * 1500;
    if (player.gold < costGold) {
      return { ok: false, msg: `보석 추출 비용이 부족합니다. (필요: ${costGold} G)` };
    }
    player.gold -= costGold;
    const count = item.gemList.length;
    item.gemList.forEach(gKey => {
      player.inventory.push(GEMS[gKey] || GEMS.ruby_1);
    });
    item.gemList = [];
    player.recalculateStats();
    return { ok: true, msg: `${count}개의 보석을 안전하게 가방으로 추출했습니다.` };
  }

  // 장비 빈 소켓에 인벤토리 보석 장착/세공
  static socketGemIntoItem(player, item, gemKey) {
    if (!item.sockets || item.sockets === 0) {
      return { ok: false, msg: '선택한 장비에는 보석 소켓이 없습니다.' };
    }
    if (!item.gemList) item.gemList = [];
    if (item.gemList.length >= item.sockets) {
      return { ok: false, msg: '이 장비의 소켓이 이미 모두 채워져 있습니다.' };
    }
    const gem = GEMS[gemKey];
    if (!gem) return { ok: false, msg: '유효하지 않은 보석입니다.' };

    const invIdx = player.inventory.findIndex(it => it && it.id === gemKey);
    if (invIdx === -1) {
      return { ok: false, msg: `인벤토리에 ${gem.name}이(가) 없습니다.` };
    }

    // 소모 및 장착
    player.inventory.splice(invIdx, 1);
    item.gemList.push(gemKey);
    player.recalculateStats();

    if (window.soundMgr) window.soundMgr.playItemEquip();
    return { ok: true, msg: `${item.name}의 소켓에 [${gem.name}]을(를) 성공적으로 장착했습니다!` };
  }
}

// 2번: 룬스톤 각인 매니저
class RunestoneManager {
  static engrave(player, item, runeKey) {
    if (!item) return { ok: false, msg: '장비가 선택되지 않았습니다.' };
    const rune = RUNESTONES[runeKey];
    if (!rune) return { ok: false, msg: '유효하지 않은 룬스톤입니다.' };

    player.runestones = player.runestones || [];
    const rIdx = player.runestones.indexOf(runeKey);
    if (rIdx === -1) {
      return { ok: false, msg: `보유한 [${rune.name}]이 없습니다. (던전 차원 균열 또는 보스 처치로 획득)` };
    }

    const costGold = 3000;
    const costOre = 8;
    if (player.gold < costGold) return { ok: false, msg: `골드가 부족합니다. (필요: ${costGold} G)` };
    if ((player.materials.iron_ore || 0) < costOre) return { ok: false, msg: `마계 철광석이 부족합니다. (필요: ${costOre}개)` };

    player.gold -= costGold;
    player.materials.iron_ore -= costOre;
    player.runestones.splice(rIdx, 1);
    item.runestone = runeKey;
    player.recalculateStats();

    if (window.soundMgr) window.soundMgr.playEnhanceSuccess();
    return { ok: true, msg: `${item.name}에 [${rune.name}] 각인을 성공했습니다! (${rune.desc})` };
  }

  static remove(player, item) {
    if (!item || !item.runestone) return { ok: false, msg: '각인된 룬스톤이 없습니다.' };
    const oldRune = item.runestone;
    item.runestone = null;
    player.runestones = player.runestones || [];
    player.runestones.push(oldRune);
    player.recalculateStats();
    return { ok: true, msg: '각인된 룬스톤을 추출하여 룬 보관함에 회수했습니다.' };
  }
}

window.ItemGenerator = ItemGenerator;
window.EquipmentManager = EquipmentManager;
window.JewelAlchemyManager = JewelAlchemyManager;
window.RunestoneManager = RunestoneManager;
window.RARITIES = RARITIES;
window.SUBSTAT_POOL = SUBSTAT_POOL;
