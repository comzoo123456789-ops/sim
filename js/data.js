// Game Data & Constants for Abyss Tower ARPG

const GAME_CONFIG = {
  MAX_LEVEL: 99,
  MAX_FLOOR: 999,
  BASE_EXP: 100,
  EXP_SCALE: 1.25,
};

// 4대 직업 기본 데이터
const CLASSES = {
  warrior: {
    id: 'warrior',
    name: '전사',
    title: '강철의 검사',
    desc: '강력한 검과 단단한 체력으로 전선을 지휘하는 전사.',
    weaponType: 'sword',
    weaponName: '검',
    allowedArmor: ['plate', 'leather', 'cloth'],
    baseStats: {
      str: 16,
      dex: 8,
      int: 6,
      maxHp: 280,
      hp: 280,
      maxMp: 100,
      mp: 100,
      atk: 28,
      def: 18,
      critRate: 0.05,
      critDmg: 1.5,
      eva: 0.03,
      speed: 3.2,
      atkSpeed: 1.0,
    },
    statPerLevel: {
      str: 3,
      dex: 1,
      int: 1,
      maxHp: 28,
      maxMp: 8,
      atk: 3.5,
      def: 2.2,
    },
    // 상시 자동 발동 패시브 3종
    passives: [
      { id: 'w_pass_1', name: '거인의 힘', desc: '힘(STR) +15% 및 물리 공격력 10% 증가', type: 'passive', statBoost: { strMul: 1.15, atkMul: 1.10 } },
      { id: 'w_pass_2', name: '강철의 의지', desc: '방어력(DEF) +20% 및 피격 피해 8% 감소', type: 'passive', statBoost: { defMul: 1.20, dmgReduc: 0.08 } },
      { id: 'w_pass_3', name: '불굴의 생명력', desc: '최대 체력 +25% 및 5초마다 체력 2% 자동 재생', type: 'passive', statBoost: { hpMul: 1.25, hpRegen: 0.02 } }
    ],
    // 레벨 5, 10, 15, 20, 25 해금 액티브 스킬 5종
    skills: [
      {
        id: 'w_skill_1',
        slot: 1,
        unlockLevel: 5,
        name: '질풍 베기',
        cost: 15,
        cd: 3.0,
        desc: '전방으로 빠르게 파고들며 검을 크게 휘둘러 180% 피해를 입힙니다.',
        dmgRatio: 1.8,
        icon: '⚔️',
        type: 'slash_wave'
      },
      {
        id: 'w_skill_2',
        slot: 2,
        unlockLevel: 10,
        name: '대지 분쇄',
        cost: 25,
        cd: 5.0,
        desc: '지면을 검으로 내리찍어 충격파를 일으키며 240% 광역 피해와 1초 기절을 부여합니다.',
        dmgRatio: 2.4,
        icon: '💥',
        type: 'earth_shatter'
      },
      {
        id: 'w_skill_3',
        slot: 3,
        unlockLevel: 15,
        name: '진공 검기',
        cost: 30,
        cd: 4.5,
        desc: '초승달 형태의 거대한 진공 검기를 날려 관통하며 280% 피해를 입힙니다.',
        dmgRatio: 2.8,
        icon: '🌙',
        type: 'crescent_blade'
      },
      {
        id: 'w_skill_4',
        slot: 4,
        unlockLevel: 20,
        name: '회오리 참격',
        cost: 40,
        cd: 7.0,
        desc: '검을 회전시키며 전방위로 폭풍 같은 참격을 가해 350% 다단히트 피해를 줍니다.',
        dmgRatio: 3.5,
        icon: '🌀',
        type: 'blade_cyclone'
      },
      {
        id: 'w_skill_5',
        slot: 5,
        unlockLevel: 25,
        name: '심연 단죄',
        cost: 55,
        cd: 10.0,
        desc: '빛의 검기를 모아 전방 일직선으로 거대한 파멸의 검광을 내리꽂아 520% 치명 피해를 입힙니다.',
        dmgRatio: 5.2,
        icon: '⚡',
        type: 'judgment_blade'
      }
    ]
  },

  mage: {
    id: 'mage',
    name: '마법사',
    title: '원소의 탐구자',
    desc: '지팡이로 마력을 증폭시켜 강력한 원소 마법으로 적을 섬멸하는 마법사.',
    weaponType: 'staff',
    weaponName: '지팡이',
    allowedArmor: ['cloth', 'leather', 'plate'],
    baseStats: {
      str: 5,
      dex: 7,
      int: 18,
      maxHp: 180,
      hp: 180,
      maxMp: 240,
      mp: 240,
      atk: 32,
      def: 9,
      critRate: 0.08,
      critDmg: 1.6,
      eva: 0.04,
      speed: 3.1,
      atkSpeed: 0.9,
    },
    statPerLevel: {
      str: 1,
      dex: 1,
      int: 4,
      maxHp: 18,
      maxMp: 22,
      atk: 4.2,
      def: 1.2,
    },
    passives: [
      { id: 'm_pass_1', name: '비전 지능', desc: '지능(INT) +20% 및 마법 공격력 15% 증가', type: 'passive', statBoost: { intMul: 1.20, atkMul: 1.15 } },
      { id: 'm_pass_2', name: '마나 샘', desc: '최대 마나 +30% 및 초당 마나 5 자동 회복', type: 'passive', statBoost: { mpMul: 1.30, mpRegen: 5 } },
      { id: 'm_pass_3', name: '원소 가속', desc: '스킬 쿨타임 15% 감소 및 주문 치명타 확률 +8%', type: 'passive', statBoost: { cdReduc: 0.15, critRate: 0.08 } }
    ],
    skills: [
      {
        id: 'm_skill_1',
        slot: 1,
        unlockLevel: 5,
        name: '화염구 (파이어볼)',
        cost: 20,
        cd: 2.5,
        desc: '불타는 화염구를 날려 착탄 시 폭발하며 200% 범위 피해와 화상 화염을 남깁니다.',
        dmgRatio: 2.0,
        icon: '🔥',
        type: 'fireball'
      },
      {
        id: 'm_skill_2',
        slot: 2,
        unlockLevel: 10,
        name: '서리 폭발',
        cost: 28,
        cd: 4.5,
        desc: '주변 지면에 얼음 결정을 폭발시켜 220% 광역 피해와 2초간 동결 둔화를 겁니다.',
        dmgRatio: 2.2,
        icon: '❄️',
        type: 'frost_nova'
      },
      {
        id: 'm_skill_3',
        slot: 3,
        unlockLevel: 15,
        name: '연쇄 번개',
        cost: 35,
        cd: 5.0,
        desc: '강력한 뇌전을 방출하여 적 사이를 튀어가며 260% 피해를 연속으로 가합니다.',
        dmgRatio: 2.6,
        icon: '⚡',
        type: 'chain_lightning'
      },
      {
        id: 'm_skill_4',
        slot: 4,
        unlockLevel: 20,
        name: '비전 광선',
        cost: 45,
        cd: 6.5,
        desc: '응축된 순수 마력 광선을 전방으로 지속 발사하여 380% 관통 피해를 줍니다.',
        dmgRatio: 3.8,
        icon: '🔮',
        type: 'arcane_beam'
      },
      {
        id: 'm_skill_5',
        slot: 5,
        unlockLevel: 25,
        name: '메테오 스트라이크',
        cost: 65,
        cd: 12.0,
        desc: '우주에서 거대한 운석을 소환하여 전장을 초토화하며 600% 초대형 파멸 피해를 가합니다.',
        dmgRatio: 6.0,
        icon: '☄️',
        type: 'meteor'
      }
    ]
  },

  rogue: {
    id: 'rogue',
    name: '도적',
    title: '그림자 암살자',
    desc: '쌍검(이도류)을 자유자재로 다루며 기습과 치명타, 독 안개로 적을 농락하는 도적.',
    weaponType: 'dual_blades',
    weaponName: '이도류',
    allowedArmor: ['leather', 'cloth', 'plate'],
    baseStats: {
      str: 10,
      dex: 17,
      int: 7,
      maxHp: 210,
      hp: 210,
      maxMp: 120,
      mp: 120,
      atk: 30,
      def: 12,
      critRate: 0.15,
      critDmg: 1.8,
      eva: 0.12,
      speed: 3.6,
      atkSpeed: 1.3,
    },
    statPerLevel: {
      str: 1.5,
      dex: 3.5,
      int: 1,
      maxHp: 22,
      maxMp: 10,
      atk: 3.8,
      def: 1.5,
    },
    passives: [
      { id: 'r_pass_1', name: '암살자의 눈', desc: '치명타 확률 +12% 및 치명타 피해 +30% 증가', type: 'passive', statBoost: { critRate: 0.12, critDmg: 0.30 } },
      { id: 'r_pass_2', name: '그림자 발걸음', desc: '회피율 +15% 및 이동속도 +15% 증가', type: 'passive', statBoost: { eva: 0.15, speedMul: 1.15 } },
      { id: 'r_pass_3', name: '질풍의 칼날', desc: '공격속도 +25% 및 기본 공격 시 20% 확률로 2연타', type: 'passive', statBoost: { atkSpeedMul: 1.25, doubleHit: 0.20 } }
    ],
    skills: [
      {
        id: 'r_skill_1',
        slot: 1,
        unlockLevel: 5,
        name: '독 연무 (독 연기)',
        cost: 18,
        cd: 3.5,
        desc: '전방에 유독한 독가스 탄환을 던져 퍼뜨립니다. 독 연기 속 적에게 매초 지속 중독 피해를 줍니다.',
        dmgRatio: 1.6,
        icon: '🧪',
        type: 'poison_cloud'
      },
      {
        id: 'r_skill_2',
        slot: 2,
        unlockLevel: 10,
        name: '그림자 습격',
        cost: 22,
        cd: 4.0,
        desc: '적의 배후로 순간이동하여 쌍검으로 목을 그어 230% 확정 치명타 피해를 입힙니다.',
        dmgRatio: 2.3,
        icon: '🗡️',
        type: 'shadow_strike'
      },
      {
        id: 'r_skill_3',
        slot: 3,
        unlockLevel: 15,
        name: '환영 난무',
        cost: 32,
        cd: 5.5,
        desc: '분신을 만들어 전방 넓은 부채꼴 영역에 수십 번의 난도질을 가해 290% 다단히트를 가합니다.',
        dmgRatio: 2.9,
        icon: '⚔️',
        type: 'phantom_dance'
      },
      {
        id: 'r_skill_4',
        slot: 4,
        unlockLevel: 20,
        name: '맹독 표창 난사',
        cost: 38,
        cd: 6.0,
        desc: '사방으로 회전하는 독 표창을 8개 방출하여 340% 관통 및 이동속도 감소를 겁니다.',
        dmgRatio: 3.4,
        icon: '⭐',
        type: 'poison_stars'
      },
      {
        id: 'r_skill_5',
        slot: 5,
        unlockLevel: 25,
        name: '심장 적출',
        cost: 50,
        cd: 9.0,
        desc: '쌍검을 하나로 모아 적의 급소를 꿰뚫어 500% 초강력 치명 피해를 입힙니다.',
        dmgRatio: 5.0,
        icon: '🩸',
        type: 'heart_stab'
      }
    ]
  },

  fighter: {
    id: 'fighter',
    name: '격투가',
    title: '권황의 후예',
    desc: '강철 너클을 착용하고 온몸의 기를 폭발시켜 근접 타격과 장풍으로 전장을 압도하는 격투가.',
    weaponType: 'knuckle',
    weaponName: '너클',
    allowedArmor: ['leather', 'plate', 'cloth'],
    baseStats: {
      str: 14,
      dex: 13,
      int: 8,
      maxHp: 250,
      hp: 250,
      maxMp: 140,
      mp: 140,
      atk: 31,
      def: 15,
      critRate: 0.10,
      critDmg: 1.7,
      eva: 0.08,
      speed: 3.4,
      atkSpeed: 1.2,
    },
    statPerLevel: {
      str: 2.5,
      dex: 2.5,
      int: 1,
      maxHp: 26,
      maxMp: 12,
      atk: 3.9,
      def: 1.8,
    },
    passives: [
      { id: 'f_pass_1', name: '기공 강화', desc: '공격력 +15% 및 모든 스킬에 기공 파동 충격 부여', type: 'passive', statBoost: { atkMul: 1.15, chiShock: true } },
      { id: 'f_pass_2', name: '금강불괴', desc: '방어력 +15%, 최대 체력 +15% 및 피격 시 경직 무효', type: 'passive', statBoost: { defMul: 1.15, hpMul: 1.15, superArmor: true } },
      { id: 'f_pass_3', name: '신속의 연타', desc: '공격속도 +20% 및 기본 공격 적중 시 이동속도 10% 증가', type: 'passive', statBoost: { atkSpeedMul: 1.20, onHitSpeed: 0.10 } }
    ],
    skills: [
      {
        id: 'f_skill_1',
        slot: 1,
        unlockLevel: 5,
        name: '파동 장풍 (기공파)',
        cost: 16,
        cd: 2.8,
        desc: '양손에 푸른 기를 응축하여 전방으로 장풍을 날려 190% 관통 폭발 피해를 줍니다.',
        dmgRatio: 1.9,
        icon: '💨',
        type: 'chi_blast'
      },
      {
        id: 'f_skill_2',
        slot: 2,
        unlockLevel: 10,
        name: '승룡권',
        cost: 24,
        cd: 4.5,
        desc: '너클에 화염기를 두르고 솟구치며 타격하여 240% 피해와 적을 공중으로 띄웁니다.',
        dmgRatio: 2.4,
        icon: '🐲',
        type: 'rising_dragon'
      },
      {
        id: 'f_skill_3',
        slot: 15,
        unlockLevel: 15,
        name: '사자후 (충격파)',
        cost: 30,
        cd: 5.5,
        desc: '내력을 폭발시키는 고함과 충격파로 주변 적들에게 270% 광역 피해와 1.5초 기절을 겁니다.',
        dmgRatio: 2.7,
        icon: '🦁',
        type: 'lion_roar'
      },
      {
        id: 'f_skill_4',
        slot: 4,
        unlockLevel: 20,
        name: '백열권 (폭풍 연타)',
        cost: 40,
        cd: 6.5,
        desc: '보이지 않을 정도로 빠른 초고속 연타를 퍼부어 360% 누적 피해를 가합니다.',
        dmgRatio: 3.6,
        icon: '👊',
        type: 'hundred_fists'
      },
      {
        id: 'f_skill_5',
        slot: 5,
        unlockLevel: 25,
        name: '진·패황단공포',
        cost: 58,
        cd: 11.0,
        desc: '전신의 모든 기를 하나로 모아 전방을 흔드는 거대한 초토화 기공 탄환을 발사하여 540% 파멸 피해를 줍니다.',
        dmgRatio: 5.4,
        icon: '☄️',
        type: 'ultimate_chi_cannon'
      }
    ]
  }
};

// 방어구 3종 특성 정의
const ARMOR_TYPES = {
  cloth: {
    id: 'cloth',
    name: '천 방어구',
    desc: '가볍고 마력이 깃든 의복. 체력과 방어력은 낮지만 지능과 마나가 대폭 상승합니다.',
    hpScale: 0.6,
    defScale: 0.5,
    intBonus: 1.4,
    mpBonus: 1.5
  },
  leather: {
    id: 'leather',
    name: '가죽 방어구',
    desc: '가볍고 질긴 가죽 갑옷. 적절한 방어력과 함께 민첩과 회피율이 상승합니다.',
    hpScale: 0.85,
    defScale: 0.8,
    dexBonus: 1.35,
    evaBonus: 0.08
  },
  plate: {
    id: 'plate',
    name: '중갑 방어구',
    desc: '단단한 강철 판금 갑옷. 이동이 묵직한 대신 방어력과 최대 체력이 비약적으로 증가합니다.',
    hpScale: 1.5,
    defScale: 1.6,
    strBonus: 1.25,
    evaBonus: -0.02
  }
};

// 100층 구역 테마 및 몬스터 풀
const DUNGEON_THEMES = [
  { minF: 1, maxF: 10, name: '외곽 폐허 층', color: '#687352', floorColor: '#2b3024', wallColor: '#454e38' },
  { minF: 11, maxF: 20, name: '심연 하수도 & 이끼 동굴', color: '#4a7566', floorColor: '#1d2f29', wallColor: '#2f4940' },
  { minF: 21, maxF: 30, name: '작열하는 마그마 층', color: '#a04832', floorColor: '#361510', wallColor: '#5c2217' },
  { minF: 31, maxF: 40, name: '절대영도 설원 층', color: '#5b85a3', floorColor: '#1a2936', wallColor: '#2f4b63' },
  { minF: 41, maxF: 50, name: '뇌전의 수정 성소', color: '#8862a8', floorColor: '#2a1b38', wallColor: '#4a2f66' },
  { minF: 51, maxF: 60, name: '그림자 미궁 층', color: '#444857', floorColor: '#181a24', wallColor: '#2b2e3d' },
  { minF: 61, maxF: 70, name: '차원 왜곡 회랑', color: '#7a3e7a', floorColor: '#2d142d', wallColor: '#4d1e4d' },
  { minF: 71, maxF: 80, name: '공허의 제단 층', color: '#384860', floorColor: '#131b26', wallColor: '#233247' },
  { minF: 81, maxF: 90, name: '마룡의 둥지 층', color: '#8c2b2b', floorColor: '#360d0d', wallColor: '#591616' },
  { minF: 91, maxF: 100, name: '마계 심연의 옥좌 층', color: '#4d1357', floorColor: '#1f0424', wallColor: '#380a42' }
];

// 일반 몬스터 원형 (층에 따라 스탯 스케일링)
const MONSTER_PROTOTYPES = [
  { name: '외계 침공 슬라임', sprite: 'slime', baseHp: 80, baseAtk: 12, baseDef: 4, speed: 1.6, exp: 25 },
  { name: '포털 침식 고블린', sprite: 'goblin', baseHp: 110, baseAtk: 18, baseDef: 6, speed: 2.3, exp: 35 },
  { name: '마계 해골 궁병', sprite: 'skeleton', baseHp: 95, baseAtk: 24, baseDef: 5, speed: 1.8, exp: 40, ranged: true },
  { name: '차원 그림자 늑대', sprite: 'wolf', baseHp: 140, baseAtk: 22, baseDef: 7, speed: 2.8, exp: 50 },
  { name: '심연 가고일', sprite: 'gargoyle', baseHp: 190, baseAtk: 26, baseDef: 12, speed: 2.0, exp: 65 },
  { name: '마계 파괴 오크', sprite: 'orc', baseHp: 240, baseAtk: 32, baseDef: 15, speed: 1.7, exp: 80 },
  { name: '타락한 차원 골렘', sprite: 'golem', baseHp: 320, baseAtk: 38, baseDef: 22, speed: 1.3, exp: 105 },
  { name: '심연의 리치', sprite: 'lich', baseHp: 220, baseAtk: 46, baseDef: 14, speed: 1.9, exp: 120, ranged: true },
  { name: '공허의 암흑 기사', sprite: 'dark_knight', baseHp: 380, baseAtk: 50, baseDef: 28, speed: 2.1, exp: 150 }
];

// 10층 단위 대형 구역 보스 (매 10층마다 등장 및 체력 50% 이하 2페이즈 광폭화)
const ZONE_BOSSES = {
  10: { 
    name: '골렘 군주 그라니트', title: '10F 수호신', sprite: 'boss_golem', hpScale: 18, atkScale: 1.8, defScale: 1.8, special: 'slam', color: '#a68a68',
    p2Name: '각성한 강철 거신 그라니트', p2Title: '폭주하는 대지의 분노', p2Special: 'earthquake_barrage', p2Color: '#ff9900' 
  },
  20: { 
    name: '심연 사령술사 모르티스', title: '20F 군주', sprite: 'boss_necromancer', hpScale: 22, atkScale: 2.1, defScale: 1.5, special: 'summon', color: '#5a9675',
    p2Name: '영혼 수확자 모르티스', p2Title: '죽음의 나선 탄막', p2Special: 'dark_spiral', p2Color: '#aa33ff' 
  },
  30: { 
    name: '불꽃 군주 이그니스', title: '30F 군주', sprite: 'boss_ignis', hpScale: 26, atkScale: 2.5, defScale: 1.7, special: 'fire_ring', color: '#e04f2d',
    p2Name: '작열의 겁화 이그니스', p2Title: '지옥불 교차 탄막', p2Special: 'inferno_cross', p2Color: '#ff2200' 
  },
  40: { 
    name: '서리 여왕 시바', title: '40F 군주', sprite: 'boss_shiva', hpScale: 30, atkScale: 2.7, defScale: 1.9, special: 'blizzard', color: '#5cb8e6',
    p2Name: '절대영도 시바', p2Title: '혹한의 다이아몬드 더스트', p2Special: 'absolute_zero', p2Color: '#00ffff' 
  },
  50: { 
    name: '뇌전의 인도자 볼테르', title: '50F 군주', sprite: 'boss_volter', hpScale: 35, atkScale: 3.0, defScale: 2.0, special: 'thunder', color: '#b96ee8',
    p2Name: '천벌의 뇌제 볼테르', p2Title: '초전자 십자 레이저 탄막망', p2Special: 'laser_cross_storm', p2Color: '#ffd700' 
  },
  60: { 
    name: '그림자 암살왕 섀도우팡', title: '60F 군주', sprite: 'boss_shadow', hpScale: 40, atkScale: 3.4, defScale: 2.1, special: 'blink_slash', color: '#595d73',
    p2Name: '암영의 학살자 섀도우팡', p2Title: '무영 3중 참격 & 그림자 분신', p2Special: 'shadow_clones', p2Color: '#ff0055' 
  },
  70: { 
    name: '차원 파괴자 바알', title: '70F 군주', sprite: 'boss_baal', hpScale: 46, atkScale: 3.8, defScale: 2.4, special: 'rift_nova', color: '#963896',
    p2Name: '차원 붕괴자 바알', p2Title: '균열 탄막 폭격 & 인력 왜곡', p2Special: 'rift_bombard', p2Color: '#dd22dd' 
  },
  80: { 
    name: '공허의 기사 카오스', title: '80F 군주', sprite: 'boss_chaos', hpScale: 54, atkScale: 4.2, defScale: 2.7, special: 'void_blackhole', color: '#2d476e',
    p2Name: '혼돈의 지배자 카오스', p2Title: '8방향 핑퐁 반사 탄막', p2Special: 'chaos_ricochet', p2Color: '#00e5ff' 
  },
  90: { 
    name: '마룡왕 드라카리스', title: '90F 군주', sprite: 'boss_dragon', hpScale: 65, atkScale: 4.8, defScale: 3.0, special: 'dragon_breath', color: '#b82323',
    p2Name: '종말의 멸룡 드라카리스', p2Title: '180도 회전 궤도 브레스', p2Special: 'rotary_dragon_breath', p2Color: '#ff1100' 
  },
  100: { 
    name: '마계 군주 아자젤 (최종 보스)', title: '100F 심연의 절대자', sprite: 'boss_azazel', hpScale: 55, atkScale: 3.0, defScale: 2.4, special: 'cataclysm', color: '#e6005c',
    p2Name: '진·마계군주 아자젤', p2Title: '묵시록의 탄막 지옥 (Apocalypse Hell)', p2Special: 'apocalypse_hell', p2Color: '#ff0033' 
  }
};

// 미믹 & 황금 미믹 정의
const MIMIC_DATA = {
  normal: {
    name: '흉포한 미믹',
    sprite: 'mimic',
    hpMult: 6,
    atkMult: 1.6,
    expMult: 5,
    goldMult: 6,
    dropRateBonus: 0.3
  },
  golden: {
    name: '찬란한 황금 미믹',
    sprite: 'golden_mimic',
    hpMult: 9,
    atkMult: 1.9,
    expMult: 10,
    goldMult: 15,
    dropRateBonus: 0.7,
    guaranteedGem: true
  }
};

// 소켓에 장착 가능한 보석 데이터 (C: 4단계 티어 보석 세공/합성 시스템)
const GEMS = {
  // 1티어 (하급)
  ruby_1: { id: 'ruby_1', isGem: true, baseType: 'ruby', tier: 1, name: '[하급] 루비', icon: '💎', color: '#ff4d4d', statBonus: { atk: 25, fireDmg: 35 }, desc: '공격력 +25, 화염 피해 +35' },
  sapphire_1: { id: 'sapphire_1', isGem: true, baseType: 'sapphire', tier: 1, name: '[하급] 사파이어', icon: '🔷', color: '#3399ff', statBonus: { int: 18, maxMp: 80, coldDmg: 30 }, desc: '지능 +18, 최대 마나 +80, 냉기 피해 +30' },
  emerald_1: { id: 'emerald_1', isGem: true, baseType: 'emerald', tier: 1, name: '[하급] 에메랄드', icon: '🟢', color: '#34c759', statBonus: { dex: 18, critRate: 0.05, speedMul: 0.06 }, desc: '민첩 +18, 치명타율 +5%, 이동속도 +6%' },
  diamond_1: { id: 'diamond_1', isGem: true, baseType: 'diamond', tier: 1, name: '[하급] 다이아몬드', icon: '✨', color: '#ffffff', statBonus: { str: 15, dex: 15, int: 15, maxHp: 120, def: 20 }, desc: '모든 스탯 +15, 체력 +120, 방어력 +20' },

  // 2티어 (중급 - 1티어 3개 합성)
  ruby_2: { id: 'ruby_2', isGem: true, baseType: 'ruby', tier: 2, name: '[중급] 빛나는 루비', icon: '💎', color: '#ff2626', statBonus: { atk: 65, fireDmg: 90 }, desc: '공격력 +65, 화염 피해 +90' },
  sapphire_2: { id: 'sapphire_2', isGem: true, baseType: 'sapphire', tier: 2, name: '[중급] 빛나는 사파이어', icon: '🔷', color: '#0077ff', statBonus: { int: 45, maxMp: 200, coldDmg: 80 }, desc: '지능 +45, 최대 마나 +200, 냉기 피해 +80' },
  emerald_2: { id: 'emerald_2', isGem: true, baseType: 'emerald', tier: 2, name: '[중급] 빛나는 에메랄드', icon: '🟢', color: '#28a745', statBonus: { dex: 45, critRate: 0.09, speedMul: 0.10 }, desc: '민첩 +45, 치명타율 +9%, 이동속도 +10%' },
  diamond_2: { id: 'diamond_2', isGem: true, baseType: 'diamond', tier: 2, name: '[중급] 빛나는 다이아몬드', icon: '✨', color: '#fff9d6', statBonus: { str: 38, dex: 38, int: 38, maxHp: 320, def: 50 }, desc: '모든 스탯 +38, 체력 +320, 방어력 +50' },

  // 3티어 (상급 - 2티어 3개 합성)
  ruby_3: { id: 'ruby_3', isGem: true, baseType: 'ruby', tier: 3, name: '[상급] 찬란한 루비', icon: '💎', color: '#e60000', statBonus: { atk: 140, fireDmg: 200 }, desc: '공격력 +140, 화염 피해 +200' },
  sapphire_3: { id: 'sapphire_3', isGem: true, baseType: 'sapphire', tier: 3, name: '[상급] 찬란한 사파이어', icon: '🔷', color: '#0055ff', statBonus: { int: 100, maxMp: 450, coldDmg: 180 }, desc: '지능 +100, 최대 마나 +450, 냉기 피해 +180' },
  emerald_3: { id: 'emerald_3', isGem: true, baseType: 'emerald', tier: 3, name: '[상급] 찬란한 에메랄드', icon: '🟢', color: '#1e7e34', statBonus: { dex: 100, critRate: 0.15, speedMul: 0.15 }, desc: '민첩 +100, 치명타율 +15%, 이동속도 +15%' },
  diamond_3: { id: 'diamond_3', isGem: true, baseType: 'diamond', tier: 3, name: '[상급] 찬란한 다이아몬드', icon: '✨', color: '#ffeaa7', statBonus: { str: 85, dex: 85, int: 85, maxHp: 750, def: 110 }, desc: '모든 스탯 +85, 체력 +750, 방어력 +110' },

  // 4티어 (최상급 - 3티어 3개 합성)
  ruby_4: { id: 'ruby_4', isGem: true, baseType: 'ruby', tier: 4, name: '[최상급] 완전무결한 루비', icon: '💎', color: '#990000', statBonus: { atk: 300, fireDmg: 450 }, desc: '공격력 +300, 화염 피해 +450' },
  sapphire_4: { id: 'sapphire_4', isGem: true, baseType: 'sapphire', tier: 4, name: '[최상급] 완전무결한 사파이어', icon: '🔷', color: '#0033cc', statBonus: { int: 220, maxMp: 1000, coldDmg: 400 }, desc: '지능 +220, 최대 마나 +1000, 냉기 피해 +400' },
  emerald_4: { id: 'emerald_4', isGem: true, baseType: 'emerald', tier: 4, name: '[최상급] 완전무결한 에메랄드', icon: '🟢', color: '#155724', statBonus: { dex: 220, critRate: 0.25, speedMul: 0.22 }, desc: '민첩 +220, 치명타율 +25%, 이동속도 +22%' },
  diamond_4: { id: 'diamond_4', isGem: true, baseType: 'diamond', tier: 4, name: '[최상급] 완전무결한 다이아몬드', icon: '✨', color: '#ffd700', statBonus: { str: 180, dex: 180, int: 180, maxHp: 1600, def: 240 }, desc: '모든 스탯 +180, 체력 +1600, 방어력 +240' }
};

// 하위 호환성 에일리어스
GEMS.ruby = GEMS.ruby_1;
GEMS.sapphire = GEMS.sapphire_1;
GEMS.emerald = GEMS.emerald_1;
GEMS.diamond = GEMS.diamond_1;

// 제작 재료 정의
const CRAFT_MATERIALS = {
  iron_ore: { id: 'iron_ore', name: '마계 철광석', icon: '🪨', desc: '탑의 마력에 노출되어 단단해진 광석.' },
  dimension_shard: { id: 'dimension_shard', name: '차원의 파편', icon: '🔮', desc: '차원 포털 주변에서 채취되는 신비한 파편.' },
  upgrade_stone: { id: 'upgrade_stone', name: '강화석', icon: '💎', desc: '장비의 잠재력을 끌어올리는 제련석.' },
  abyss_crystal: { id: 'abyss_crystal', name: '심연의 정수 결정', icon: '🟣', desc: '고층 몬스터와 보스에게서만 추출되는 순수한 마력 결정체.' }
};

// 칭호 및 스탯 보너스 정의 (2순위: 칭호 시스템)
const TITLES = {
  novice: { id: 'novice', name: '새내기 모험가', icon: '🌱', statBoost: { maxHp: 50 }, desc: '최대 체력 +50' },
  first_blood: { id: 'first_blood', name: '모험의 시작', icon: '⚔️', statBoost: { atk: 15 }, desc: '공격력 +15' },
  boss_slayer: { id: 'boss_slayer', name: '보스 사냥꾼', icon: '👑', statBoost: { maxHp: 300, def: 20 }, desc: '최대 체력 +300, 방어력 +20' },
  mimic_hunter: { id: 'mimic_hunter', name: '황금 탐식자', icon: '💰', statBoost: { speedMul: 0.08, critRate: 0.03 }, desc: '이동속도 +8%, 치명타율 +3%' },
  enhance_master: { id: 'enhance_master', name: '전설의 대장장이', icon: '🔨', statBoost: { atk: 60, def: 40 }, desc: '공격력 +60, 방어력 +40' },
  gem_master: { id: 'gem_master', name: '차원 보석학자', icon: '💎', statBoost: { critRate: 0.07, critDmg: 0.25 }, desc: '치명타율 +7%, 치명타 피해 +25%' },
  tower_savior: { id: 'tower_savior', name: '행성의 수호신', icon: '🌟', statBoost: { str: 40, dex: 40, int: 40, atk: 120, maxHp: 800 }, desc: '올스탯 +40, 공격력 +120, 최대 체력 +800' }
};

// 업적 시스템 정의 (2순위: 업적 시스템)
const ACHIEVEMENTS = [
  { id: 'first_blood', name: '첫 번째 피', desc: '탑의 마계 몬스터를 1마리 이상 처치하세요.', rewardGold: 1000, titleId: 'first_blood' },
  { id: 'boss_slayer', name: '구역의 지배자', desc: '10층 단위 구역 보스를 1회 이상 처치하세요.', rewardGold: 5000, titleId: 'boss_slayer' },
  { id: 'mimic_hunter', name: '보물 사냥꾼', desc: '숨겨진 상자 미믹을 1회 이상 처치하세요.', rewardGold: 8000, titleId: 'mimic_hunter' },
  { id: 'enhance_master', name: '신의 망치질', desc: '장비를 +10강 이상으로 강화하세요.', rewardGold: 15000, titleId: 'enhance_master' },
  { id: 'gem_master', name: '완전무결의 연금술', desc: '대장간에서 보석 합성을 1회 이상 성공하세요.', rewardGold: 20000, titleId: 'gem_master' },
  { id: 'tower_savior', name: '행성의 구원자', desc: '100층 최종 보스 아자젤을 격파하고 탑을 무너뜨리세요.', rewardGold: 100000, titleId: 'tower_savior' }
];

// 3순위: 자동 루팅 펫 & 동행 서포터 정의
const PETS = {
  drone: {
    id: 'drone',
    name: '기계 정찰 드론',
    icon: '🛸',
    color: '#00f0ff',
    lootRange: 280,
    perkName: '플라즈마 레이저 지원',
    perkDesc: '주변 280px 내의 골드/장비/재료를 초고속 자동 자석 흡수하며, 7초마다 가장 가까운 적에게 220% 플라즈마 레이저를 발사합니다.',
    cd: 7.0
  },
  wisp: {
    id: 'wisp',
    name: '심연의 마력 위스프',
    icon: '✨',
    color: '#ffd700',
    lootRange: 250,
    perkName: '치유와 정화의 파동',
    perkDesc: '주변 250px 내의 아이템을 자동 흡수하며, 8초마다 주인의 HP와 MP를 20% 즉시 회복시키는 성스러운 빛을 발산합니다.',
    cd: 8.0
  },
  dragon: {
    id: 'dragon',
    name: '새끼 마룡 베이비',
    icon: '🐲',
    color: '#ff4444',
    lootRange: 240,
    perkName: '화룡의 분노 & 브레스',
    perkDesc: '주변 240px 내의 아이템을 자동 흡수하며, 주인의 공격력을 상시 +12% 증폭시키고 6초마다 전방에 화염구를 뿜어냅니다.',
    cd: 6.0
  }
};

// 4순위: 던전 신비한 성소(Shrine) & 이벤트 기믹 정의
const SHRINES = {
  berserk: {
    id: 'berserk',
    name: '광전사의 차원 성소',
    icon: '🔥',
    color: '#ff3344',
    desc: '30초간 공격속도 +60%, 이동속도 +35%, 치명타율 +20% 폭발!',
    duration: 30
  },
  healing_well: {
    id: 'healing_well',
    name: '영원의 치유 샘',
    icon: '💧',
    color: '#00ffaa',
    desc: '즉시 생명력 & 마나를 100% 회복하고 600 피해를 흡수하는 비전 보호막 부여!',
    duration: 0
  },
  demon_altar: {
    id: 'demon_altar',
    name: '마계의 암흑 제단',
    icon: '🩸',
    color: '#b55fe6',
    desc: '현재 체력의 35%를 제물로 바쳐 최고급 유니크/에픽 장비와 보석을 강제 소환!',
    duration: 0
  }
};

// 1번: 차원 용병 / 동료 서포터 정의
const MERCENARIES = {
  roland: {
    id: 'roland',
    name: '성기사 롤랑',
    job: 'paladin',
    title: '강철의 수호자',
    role: '탱커 / 방어 지원',
    icon: '🛡️',
    color: '#ffd700',
    cost: 5000,
    hp: 2200,
    baseHp: 2200,
    atk: 140,
    baseAtk: 140,
    def: 90,
    baseDef: 90,
    speed: 2.5,
    skillName: '정의의 도발 & 수호 방벽',
    skillDesc: '5초마다 240px 내의 적을 도발하여 어그로를 집중시키고, 플레이어의 방어력을 8초간 +25% 증가시킵니다.',
    skillCd: 5.0
  },
  ceria: {
    id: 'ceria',
    name: '대사제 세리아',
    job: 'priest',
    title: '빛의 인도자',
    role: '힐러 / 공격 버퍼',
    icon: '✨',
    color: '#00ffaa',
    cost: 7000,
    hp: 1400,
    baseHp: 1400,
    atk: 110,
    baseAtk: 110,
    def: 55,
    baseDef: 55,
    speed: 2.7,
    skillName: '성스러운 기적 & 축복 오라',
    skillDesc: '아군 체력이 75% 이하일 때 즉시 35% 생명력을 치유하며, 파티원의 공격력을 상시 +18% 증폭시킵니다.',
    skillCd: 6.0
  },
  kyle: {
    id: 'kyle',
    name: '그림자 명사수 카일',
    job: 'ranger',
    title: '심연의 저격수',
    role: '원거리 극딜러',
    icon: '🏹',
    color: '#ff3344',
    cost: 8500,
    hp: 1500,
    baseHp: 1500,
    atk: 260,
    baseAtk: 260,
    def: 60,
    baseDef: 60,
    speed: 3.0,
    skillName: '그림자 관통 화살 & 일제 사격',
    skillDesc: '원거리에서 3.5초마다 전방 적들을 일렬로 관통하는 암흑 화살을 발사하여 320% 관통 피해를 입힙니다.',
    skillCd: 3.5
  }
};

// 2번: 장비 세트 효과 정의 (2세트, 3세트, 5세트 보너스)
const SET_ITEMS = {
  dragon_fury: {
    id: 'dragon_fury',
    name: '마룡의 격노',
    color: '#ff4400',
    icon: '🐲',
    bonuses: {
      2: { desc: '화염 피해 +35%, 치명타율 +7%', statBoost: { fireDmgMul: 0.35, critRate: 0.07 } },
      3: { desc: '공격력 +25%, 공격속도 +15%', statBoost: { atkMul: 0.25, atkSpeedMul: 0.15 } },
      5: { desc: '공격 시 15% 확률로 거대 파멸 메테오 자동 낙하!', statBoost: { meteorOnHit: 0.15, critDmg: 0.30 } }
    }
  },
  abyss_sovereign: {
    id: 'abyss_sovereign',
    name: '심연의 지배자',
    color: '#a020f0',
    icon: '👑',
    bonuses: {
      2: { desc: '최대 체력 +30%, 방어력 +20%', statBoost: { hpMul: 0.30, defMul: 0.20 } },
      3: { desc: '모든 스탯 +60, 적 타격 시 6% 흡혈', statBoost: { str: 60, dex: 60, int: 60, lifesteal: 0.06 } },
      5: { desc: '치명타율 +20%, 사망 시 1회 60% 생명력으로 부활!', statBoost: { critRate: 0.20, reviveChance: true } }
    }
  },
  dimension_warp: {
    id: 'dimension_warp',
    name: '차원 왜곡자',
    color: '#00f0ff',
    icon: '🌀',
    bonuses: {
      2: { desc: '대시 쿨타임 -40%, 이동속도 +25%', statBoost: { dashCdMul: 0.40, speedMul: 0.25 } },
      3: { desc: '스킬 쿨타임 -20%, 최대 마나 +35%', statBoost: { cdReduc: 0.20, mpMul: 0.35 } },
      5: { desc: '기본 공격 시 30% 확률로 차원 참격 검기 추가 방출!', statBoost: { riftSlashOnHit: 0.30, atkMul: 0.20 } }
    }
  }
};

// 2번: 대장간 룬스톤 각인 정의
const RUNESTONES = {
  rune_destruction: {
    id: 'rune_destruction',
    key: 'rune_destruction',
    name: '파괴의 룬스톤',
    icon: '🔴',
    color: '#ff3344',
    statBonus: { atk: 150, critDmg: 0.20 },
    desc: '공격력 +150, 치명타 피해 +20%'
  },
  rune_ironwall: {
    id: 'rune_ironwall',
    key: 'rune_ironwall',
    name: '철벽의 룬스톤',
    icon: '🔵',
    color: '#3388ff',
    statBonus: { def: 120, maxHp: 900 },
    desc: '방어력 +120, 최대 체력 +900'
  },
  rune_swiftness: {
    id: 'rune_swiftness',
    key: 'rune_swiftness',
    name: '신속의 룬스톤',
    icon: '🟢',
    color: '#00ffaa',
    statBonus: { speedMul: 0.18, atkSpeedMul: 0.18 },
    desc: '이동속도 +18%, 공격속도 +18%'
  },
  rune_vampire: {
    id: 'rune_vampire',
    key: 'rune_vampire',
    name: '흡혈의 룬스톤',
    icon: '🟣',
    color: '#b55fe6',
    statBonus: { lifesteal: 0.08, atk: 90 },
    desc: '적 타격 시 8% 체력 흡수, 공격력 +90'
  }
};
// 호환성을 위한 별칭 매핑
RUNESTONES.rune_power = RUNESTONES.rune_destruction;
RUNESTONES.rune_defense = RUNESTONES.rune_ironwall;
RUNESTONES.rune_swift = RUNESTONES.rune_swiftness;

// 4번: 던전 차원 균열 돌발 이벤트 설정
const RIFT_EVENT_CONFIG = {
  duration: 30,
  waveInterval: 4.0,
  spawnChance: 0.5,
  chestRewardGold: 30000
};

// 3번: 스킬 룬 변환 & 원소 특성화 정의
const SKILL_ELEMENTAL_RUNES = {
  none: {
    id: 'none',
    name: '기본 무속성',
    icon: '🔘',
    color: '#a496bd',
    desc: '스킬 본래의 순수 물리/직업 특성 피해를 가합니다.'
  },
  fire: {
    id: 'fire',
    name: '화염 룬 (폭발 & 연소)',
    icon: '🔥',
    color: '#ff4400',
    desc: '스킬 피해량 +25%, 적에게 3초간 화상 지속 피해(Burn DOT) 부여 및 타격 시 화염 폭발 발동!'
  },
  cold: {
    id: 'cold',
    name: '냉기 룬 (둔화 & 동결)',
    icon: '❄️',
    color: '#00f0ff',
    desc: '적 이동속도 -40% 둔화, 30% 확률로 1.5초간 완전 동결(빙결 스턴) 부여!'
  },
  lightning: {
    id: 'lightning',
    name: '번개 룬 (연쇄 감전)',
    icon: '⚡',
    color: '#ffd700',
    desc: '타격 시 주변 다른 적 2명에게 75% 피해의 연쇄 번개 전격 방출!'
  },
  void: {
    id: 'void',
    name: '공허 룬 (인력 흡인 & 방어 약화)',
    icon: '🔮',
    color: '#a020f0',
    desc: '주변 적들을 스킬 중심으로 강하게 끌어당기며 5초간 적 방어력 -25% 약화!'
  }
};

// 6번: 마을 건설 & 연구소 업그레이드 시설 정의
const TOWN_RESEARCH = {
  forge: {
    id: 'forge',
    name: '아케인 마법 대장간',
    sub: '장비 제련 및 공/방 영구 증폭',
    icon: '🔨',
    color: '#ffd700',
    maxLevel: 10,
    costGoldBase: 3000,
    costRuneBase: 5,
    desc: '모든 장비 공격력/방어력 +3% (최대 +30%), 장비 제련 성공률 증가',
    effectDesc: (lvl) => `모든 장비 공/방 +${lvl * 3}%, 제련 성공률 +${lvl * 2}%`,
    cost: (lvl) => ({ gold: (lvl + 1) * 3000, iron_ore: (lvl + 1) * 8, upgrade_stone: (lvl + 1) * 4 })
  },
  alchemy: {
    id: 'alchemy',
    name: '초고농축 연금술 연구소',
    sub: '물약 회복량 및 소지 한도 확장',
    icon: '🧪',
    color: '#00ffaa',
    maxLevel: 10,
    costGoldBase: 3500,
    costRuneBase: 5,
    desc: '물약 회복량 +5% (최대 +50%), 물약 소지 한도 증가 (+1개/Lv)',
    effectDesc: (lvl) => `물약 회복량 +${lvl * 5}%, 물약 소지 한도 +${lvl}개`,
    cost: (lvl) => ({ gold: (lvl + 1) * 3500, dimension_shard: (lvl + 1) * 5 })
  },
  beacon: {
    id: 'beacon',
    name: '차원 성소 비콘',
    sub: '성소 버프 지속시간 & 보석 합성 할인',
    icon: '✨',
    color: '#b55fe6',
    maxLevel: 10,
    costGoldBase: 4000,
    costRuneBase: 6,
    desc: '던전 성소 버프 지속시간 +10% (최대 +100%), 보석 합성 골드 비용 -5%',
    effectDesc: (lvl) => `성소 버프 지속시간 +${lvl * 10}%, 보석 합성 비용 -${Math.min(50, lvl * 5)}%`,
    cost: (lvl) => ({ gold: (lvl + 1) * 4000, dimension_shard: (lvl + 1) * 6, abyss_crystal: (lvl + 1) * 3 })
  },
  pylon: {
    id: 'pylon',
    name: '원소 공명 수정탑',
    sub: '원소 피해 증폭 및 스킬 쿨타임 감소',
    icon: '🔮',
    color: '#3388ff',
    maxLevel: 10,
    costGoldBase: 4500,
    costRuneBase: 7,
    desc: '모든 원소(화염/냉기/번개/공허) 피해 +4% (최대 +40%), 스킬 쿨타임 -2% (최대 -20%)',
    effectDesc: (lvl) => `원소 피해 +${lvl * 4}%, 모든 스킬 쿨타임 -${lvl * 2}%`,
    cost: (lvl) => ({ gold: (lvl + 1) * 4500, abyss_crystal: (lvl + 1) * 4, dimension_shard: (lvl + 1) * 6 })
  },
  bastion: {
    id: 'bastion',
    name: '차원 요새 방벽',
    sub: '최대 생명력 증폭 및 피해 감소',
    icon: '🛡️',
    color: '#ff6644',
    maxLevel: 10,
    costGoldBase: 4000,
    costRuneBase: 6,
    desc: '최대 생명력 +4% (최대 +40%), 받는 모든 피해 -2% 감소 (최대 -20%)',
    effectDesc: (lvl) => `최대 생명력 +${lvl * 4}%, 받는 피해 -${lvl * 2}%`,
    cost: (lvl) => ({ gold: (lvl + 1) * 4000, iron_ore: (lvl + 1) * 12, abyss_crystal: (lvl + 1) * 3 })
  }
};

// 10종 무한 악몽 심연(101F~) 던전 돌연변이 어픽스 (Affixes) - 정수 퍼센티지 기준
const ABYSS_AFFIXES = {
  corpse_explosion: {
    id: 'corpse_explosion',
    name: '시체 폭발',
    eng: 'Volatile Corpses',
    icon: '💥',
    color: '#ff4422',
    desc: '몬스터 처치 시 0.7초 후 반경 90px 내에 치명적인 자폭 폭발을 일으킵니다.',
    mfBonus: 40,
    goldBonus: 50,
    expBonus: 40
  },
  vampiric: {
    id: 'vampiric',
    name: '흡혈 군주',
    eng: 'Vampiric Leech',
    icon: '🩸',
    color: '#ff1144',
    desc: '모든 몬스터가 공격 적중 시 입힌 피해의 35%만큼 생명력을 즉시 흡혈합니다.',
    mfBonus: 40,
    goldBonus: 50,
    expBonus: 40
  },
  thunder_storm: {
    id: 'thunder_storm',
    name: '하늘의 분노',
    eng: 'Storm Thunder',
    icon: '⚡',
    color: '#ffd700',
    desc: '3.5초마다 플레이어 위치에 전조 장판 후 강력한 벼락이 투하됩니다.',
    mfBonus: 40,
    goldBonus: 50,
    expBonus: 40
  },
  ironclad: {
    id: 'ironclad',
    name: '철벽 요새',
    eng: 'Ironclad Bastion',
    icon: '🛡️',
    color: '#aaccff',
    desc: '모든 몬스터의 방어력이 +50% 증가하고 받는 피해가 20% 감소합니다.',
    mfBonus: 40,
    goldBonus: 50,
    expBonus: 40
  },
  furious_haste: {
    id: 'furious_haste',
    name: '질풍의 광포화',
    eng: 'Furious Haste',
    icon: '💨',
    color: '#00ffcc',
    desc: '모든 몬스터의 이동속도가 +45%, 공격속도가 +40% 급증합니다.',
    mfBonus: 40,
    goldBonus: 50,
    expBonus: 40
  },
  freezing_aura: {
    id: 'freezing_aura',
    name: '혹한의 한기',
    eng: 'Freezing Aura',
    icon: '❄️',
    color: '#00d0ff',
    desc: '몬스터 주변 120px 내로 진입하면 플레이어의 이동속도가 35% 둔화됩니다.',
    mfBonus: 40,
    goldBonus: 50,
    expBonus: 40
  },
  magma_geysers: {
    id: 'magma_geysers',
    name: '용암 분출',
    eng: 'Magma Geysers',
    icon: '🌋',
    color: '#ff6600',
    desc: '던전 바닥 무작위 위치에서 주기적으로 화염 기둥이 치솟아 화상을 입힙니다.',
    mfBonus: 40,
    goldBonus: 50,
    expBonus: 40
  },
  toxic_contagion: {
    id: 'toxic_contagion',
    name: '맹독 감염',
    eng: 'Toxic Contagion',
    icon: '☠️',
    color: '#33ff33',
    desc: '몬스터에게 피격 시 4초간 지속되는 맹독 중독 피해(초당 최대 HP 3%)를 입습니다.',
    mfBonus: 40,
    goldBonus: 50,
    expBonus: 40
  },
  void_gravity: {
    id: 'void_gravity',
    name: '공허 왜곡',
    eng: 'Void Gravity',
    icon: '🌀',
    color: '#bb44ff',
    desc: '8초마다 맵 중심부로 모든 생명체를 끌어당기는 심연의 중력 홀이 열립니다.',
    mfBonus: 40,
    goldBonus: 50,
    expBonus: 40
  },
  empowered_elites: {
    id: 'empowered_elites',
    name: '군주의 권능',
    eng: 'Empowered Elites',
    icon: '👑',
    color: '#ffbb00',
    desc: '모든 일반 몬스터가 엘리트 정예급(HP 2.5배, 공격력 1.5배)으로 강화됩니다.',
    mfBonus: 40,
    goldBonus: 50,
    expBonus: 40
  }
};

// 로그라이크 고대 심연 유물 (Relics) 8종
const RELICS = {
  blood_blade: {
    id: 'blood_blade',
    name: '피의 갈증 검',
    icon: '🗡️',
    color: '#ff3344',
    desc: '적 처치 시 최대 생명력의 4%를 즉시 회복합니다.'
  },
  storm_sigil: {
    id: 'storm_sigil',
    name: '번개 폭풍의 인장',
    icon: '⚡',
    color: '#ffd700',
    desc: '치명타 적중 시 60% 확률로 적에게 낙뢰(공격력 120% 피해)를 투하합니다.'
  },
  holy_aegis: {
    id: 'holy_aegis',
    name: '성스러운 아에기스',
    icon: '🛡️',
    color: '#00e5ff',
    desc: '체력이 35% 이하로 떨어지면 800 피해를 흡수하는 신성 보호막을 자동 발동합니다. (쿨타임 30초)'
  },
  flame_trail: {
    id: 'flame_trail',
    name: '화염 분출 장화',
    icon: '🔥',
    color: '#ff6600',
    desc: '구르기(대시) 시 지나간 궤적에 3초간 지속되는 화염 장판을 생성합니다.'
  },
  soul_bomb: {
    id: 'soul_bomb',
    name: '영혼 폭탄',
    icon: '💣',
    color: '#bb44ff',
    desc: '적 처치 시 시체가 폭발하여 주변 적들에게 대상 최대 체력 15%의 범위 폭발 피해를 줍니다.'
  },
  chrono_glass: {
    id: 'chrono_glass',
    name: '시간 왜곡의 모래시계',
    icon: '⏱️',
    color: '#ffff55',
    desc: '완벽한 패링(Parry) 성공 시 모든 스킬 쿨타임이 3초 즉시 감소합니다.'
  },
  midas_hand: {
    id: 'midas_hand',
    name: '마이다스의 황금 손',
    icon: '💎',
    color: '#ffd700',
    desc: '골드 획득 시 20% 확률로 10배의 잭팟 골드를 획득합니다.'
  },
  immortal_elixir: {
    id: 'immortal_elixir',
    name: '불사의 엘릭서',
    icon: '🧪',
    color: '#00ffaa',
    desc: '물약 복용 시 주변 180px 적들을 강하게 밀쳐내며 2초간 완전 무적 상태에 돌입합니다.'
  }
};

window.GAME_CONFIG = GAME_CONFIG;
window.CLASSES = CLASSES;
window.ARMOR_TYPES = ARMOR_TYPES;
window.DUNGEON_THEMES = DUNGEON_THEMES;
window.MONSTER_PROTOTYPES = MONSTER_PROTOTYPES;
window.ZONE_BOSSES = ZONE_BOSSES;
window.MIMIC_DATA = MIMIC_DATA;
window.GEMS = GEMS;
window.CRAFT_MATERIALS = CRAFT_MATERIALS;
window.TITLES = TITLES;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.PETS = PETS;
window.SHRINES = SHRINES;
window.MERCENARIES = MERCENARIES;
window.SET_ITEMS = SET_ITEMS;
window.RUNESTONES = RUNESTONES;
window.RIFT_EVENT_CONFIG = RIFT_EVENT_CONFIG;
window.SKILL_ELEMENTAL_RUNES = SKILL_ELEMENTAL_RUNES;
window.TOWN_RESEARCH = TOWN_RESEARCH;
window.ABYSS_AFFIXES = ABYSS_AFFIXES;
window.RELICS = RELICS;
