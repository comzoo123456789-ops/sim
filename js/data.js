// Office Escape Survivor - Game Constants & Data Registry

window.GAME_DATA = {
  // 1. 캐릭터 직급 데이터
  CHARACTERS: {
    intern: {
      id: 'intern',
      name: '신입사원 이민우',
      title: '풋풋한 신입',
      avatar: '🧑‍💻',
      desc: '빠른 발과 불타는 열정으로 야근 지옥을 탈출합니다.',
      baseHp: 100,
      speed: 3.8,
      initialWeapon: 'stapler',
      bonusText: '이동 속도 +15% / 경험치 획득 +20%',
      bonus: { speedMul: 0.15, xpMul: 0.20 }
    },
    deputy: {
      id: 'deputy',
      name: '만년 대리 김철수',
      title: '숙련된 야근 전사',
      avatar: '👨‍💼',
      desc: '쌓인 짬바와 분노의 타건력으로 결재 서류를 부숩니다.',
      baseHp: 120,
      speed: 3.3,
      initialWeapon: 'keyboard',
      bonusText: '기본 공격력 +20% / 치명타율 +10%',
      bonus: { atkMul: 0.20, critRate: 0.10 }
    },
    manager: {
      id: 'manager',
      name: '멘탈갑 과장 박영희',
      title: '철벽의 방어자',
      avatar: '🧓',
      desc: '어떤 폭풍 잔소리도 튕겨내는 강철 멘탈의 소유자입니다.',
      baseHp: 160,
      speed: 3.0,
      initialWeapon: 'card',
      bonusText: '최대 체력 +40% / 초당 HP 재생 +1.5%',
      bonus: { hpMul: 0.40, regenRate: 1.5 }
    }
  },

  // 2. 오피스 기본 무기 6종
  WEAPONS: {
    stapler: {
      id: 'stapler',
      name: '고속 스테이플러',
      icon: '📎',
      desc: '가장 가까운 적에게 날카로운 스테이플러 침을 연사합니다.',
      type: 'projectile',
      baseDmg: 18,
      cooldown: 0.85,
      projectiles: 1,
      speed: 9,
      pierce: 1,
      color: '#55ccff',
      evolution: 'super_stapler',
      partnerPassive: 'glasses',
      levels: [
        { desc: '기본 스테이플러 침 발사' },
        { dmg: 24, desc: '피해량 증가 (+6)' },
        { projectiles: 2, desc: '발사 침 개수 +1' },
        { cooldown: 0.65, desc: '발사 속도 증가' },
        { projectiles: 3, pierce: 2, desc: '발사 침 +1 & 관통력 +1' },
        { dmg: 36, desc: '피해량 대폭 증가 (+12)' },
        { projectiles: 4, cooldown: 0.45, desc: '발사 침 +1 & 쿨타임 대폭 감소' },
        { dmg: 50, pierce: 3, desc: '최대 레벨! (관통 침 4연사)' }
      ]
    },
    drink: {
      id: 'drink',
      name: '핫식스 에너지캔',
      icon: '🥤',
      desc: '바닥에 탄산 에너지드링크를 투척하여 고농도 각성 장판을 생성합니다.',
      type: 'puddle',
      baseDmg: 14,
      cooldown: 1.8,
      area: 60,
      duration: 2.5,
      color: '#ffaa00',
      evolution: 'super_drink',
      partnerPassive: 'eyedrop',
      levels: [
        { desc: '바닥에 각성 장판 1개 투척' },
        { dmg: 18, desc: '지속 피해량 증가 (+4)' },
        { area: 80, desc: '장판 범위 30% 증가' },
        { projectiles: 2, desc: '투척 개수 +1' },
        { cooldown: 1.4, desc: '투척 쿨타임 감소' },
        { dmg: 26, area: 100, desc: '피해량 & 범위 증가' },
        { projectiles: 3, duration: 3.2, desc: '투척 개수 +1 & 지속 시간 증가' },
        { dmg: 38, area: 120, desc: '최대 레벨! (광역 3중 폭풍 장판)' }
      ]
    },
    keyboard: {
      id: 'keyboard',
      name: '기계식 청축 키보드',
      icon: '⌨️',
      desc: '청축 타건음과 함께 전방 부채꼴로 키캡 산탄을 발사합니다.',
      type: 'shotgun',
      baseDmg: 25,
      cooldown: 1.2,
      projectiles: 4,
      spread: 0.55,
      speed: 8,
      color: '#00ffcc',
      evolution: 'super_keyboard',
      partnerPassive: 'desk',
      levels: [
        { desc: '전방 4방향 키캡 산탄 발사' },
        { dmg: 32, desc: '피해량 증가 (+7)' },
        { projectiles: 6, spread: 0.7, desc: '키캡 개수 +2 (범위 확장)' },
        { cooldown: 0.95, desc: '연타 속도 증가' },
        { dmg: 42, projectiles: 8, desc: '피해량 증가 & 키캡 개수 +2' },
        { cooldown: 0.75, desc: '쿨타임 감소' },
        { projectiles: 10, spread: 0.85, desc: '키캡 개수 10발로 증가' },
        { dmg: 60, projectiles: 12, desc: '최대 레벨! (12발 산탄 폭격)' }
      ]
    },
    stamp: {
      id: 'stamp',
      name: '결재 반려 도장',
      icon: '🛑',
      desc: '무작위 적 머리 위에 거대한 붉은 반려 도장을 낙하시켜 압살합니다.',
      type: 'strike',
      baseDmg: 45,
      cooldown: 2.2,
      area: 70,
      color: '#ff2255',
      evolution: 'super_stamp',
      partnerPassive: 'bankbook',
      levels: [
        { desc: '적 머리 위에 결재 반려 도장 낙하' },
        { dmg: 60, desc: '압살 피해량 증가 (+15)' },
        { area: 90, desc: '타격 반경 확장' },
        { strikes: 2, desc: '도장 낙하 횟수 +1' },
        { cooldown: 1.7, desc: '결재 반려 쿨타임 감소' },
        { dmg: 85, area: 110, desc: '피해량 & 범위 증가' },
        { strikes: 3, cooldown: 1.3, desc: '도장 3연속 낙하' },
        { dmg: 120, area: 130, strikes: 4, desc: '최대 레벨! (4연속 융단 반려 폭격)' }
      ]
    },
    card: {
      id: 'card',
      name: '법인카드 쉴드',
      icon: '💳',
      desc: '플레이어 주변을 고속 회전하며 접근하는 적을 튕겨내고 피해를 줍니다.',
      type: 'orbital',
      baseDmg: 16,
      cooldown: 0.5,
      count: 2,
      orbitRadius: 65,
      orbitSpeed: 3.2,
      color: '#ffd700',
      evolution: 'super_card',
      partnerPassive: 'headphone',
      levels: [
        { desc: '회전하는 법인카드 2장 생성' },
        { dmg: 22, desc: '타격 피해량 증가 (+6)' },
        { count: 3, desc: '카드 개수 +1' },
        { orbitSpeed: 4.2, desc: '회전 속도 증가' },
        { count: 4, orbitRadius: 75, desc: '카드 개수 +1 & 회전 반경 증가' },
        { dmg: 32, desc: '피해량 증가 (+10)' },
        { count: 5, orbitSpeed: 5.2, desc: '카드 개수 5장 & 초고속 회전' },
        { dmg: 48, count: 6, desc: '최대 레벨! (6장 황금 실드 결계)' }
      ]
    },
    shredder: {
      id: 'shredder',
      name: '문서 세단기 칼날',
      icon: '📑',
      desc: '나선형으로 뻗어나가는 날카로운 파쇄기 톱니를 발사하여 적을 뚫어버립니다.',
      type: 'spiral',
      baseDmg: 20,
      cooldown: 1.5,
      speed: 5,
      pierce: 999,
      color: '#a044ff',
      evolution: 'super_shredder',
      partnerPassive: 'leave',
      levels: [
        { desc: '나선형 관통 톱니 1개 발사' },
        { dmg: 28, desc: '톱니 피해량 증가 (+8)' },
        { projectiles: 2, desc: '양방향 톱니 발사' },
        { cooldown: 1.1, desc: '발사 쿨타임 감소' },
        { dmg: 38, projectiles: 3, desc: '3방향 톱니 발사' },
        { speed: 7, desc: '톱니 비행 속도 & 지속 시간 증가' },
        { projectiles: 4, cooldown: 0.8, desc: '4방향 톱니 발사' },
        { dmg: 55, projectiles: 6, desc: '최대 레벨! (6방향 문서 분쇄 토네이도)' }
      ]
    }
  },

  // 3. 초월 진화 무기 6종 (Super Weapons)
  SUPER_WEAPONS: {
    super_stapler: {
      id: 'super_stapler',
      name: '🔥 [고속 자동 제본건]',
      icon: '⚡',
      desc: '360도 전방위로 끝없는 관통 침 폭풍을 초고속 난사합니다!',
      type: 'super_projectile',
      baseDmg: 65,
      cooldown: 0.22,
      projectiles: 8,
      speed: 11,
      color: '#00f0ff'
    },
    super_drink: {
      id: 'super_drink',
      name: '🔥 [치명적 카페인 해일]',
      icon: '🌊',
      desc: '화면 전체를 뒤덮는 초거대 카페인 파도를 일으켜 적들을 녹여버립니다!',
      type: 'super_puddle',
      baseDmg: 55,
      cooldown: 1.0,
      area: 200,
      color: '#ff8800'
    },
    super_keyboard: {
      id: 'super_keyboard',
      name: '🔥 [분노의 2000타 광속 타자기]',
      icon: '💥',
      desc: '쉬지 않고 전방 180도를 키캡으로 융단폭격하는 광기의 2000타!',
      type: 'super_shotgun',
      baseDmg: 80,
      cooldown: 0.35,
      projectiles: 16,
      color: '#00ffaa'
    },
    super_stamp: {
      id: 'super_stamp',
      name: '🔥 [최종 승인 거부 스탬프]',
      icon: '☄️',
      desc: '화면 전체를 짓누르는 거대한 메가톤급 반려 도장이 연속 강타합니다!',
      type: 'super_strike',
      baseDmg: 180,
      cooldown: 0.9,
      area: 200,
      strikes: 6,
      color: '#ff0033'
    },
    super_card: {
      id: 'super_card',
      name: '🔥 [블랙 무한한도 플래티넘 실드]',
      icon: '👑',
      desc: '빛나는 8장의 블랙카드가 절대 방어벽을 두르며 충격파를 뿜어냅니다!',
      type: 'super_orbital',
      baseDmg: 70,
      cooldown: 0.5,
      count: 8,
      orbitRadius: 90,
      orbitSpeed: 7.0,
      color: '#ffd700'
    },
    super_shredder: {
      id: 'super_shredder',
      name: '🔥 [초고속 문서 분쇄 토네이도]',
      icon: '🌀',
      desc: '적들을 중심으로 끌어당겨 가루로 갈아버리는 블랙홀 분쇄 회오리!',
      type: 'super_spiral',
      baseDmg: 85,
      cooldown: 0.5,
      projectiles: 8,
      color: '#bb33ff'
    }
  },

  // 4. 사내 복지 패시브 6종
  PASSIVES: {
    glasses: {
      id: 'glasses',
      name: '블루라이트 차단 안경',
      icon: '👓',
      desc: '공격 범위 및 투사체 크기를 증가시킵니다.',
      levels: [
        { areaMul: 0.12, desc: '공격 범위 +12%' },
        { areaMul: 0.24, desc: '공격 범위 +24%' },
        { areaMul: 0.36, desc: '공격 범위 +36%' },
        { areaMul: 0.50, desc: '공격 범위 +50% (최대)' }
      ]
    },
    desk: {
      id: 'desk',
      name: '모션 스탠딩 데스크',
      icon: '🏃',
      desc: '플레이어의 이동 속도를 증가시킵니다.',
      levels: [
        { speedMul: 0.10, desc: '이동 속도 +10%' },
        { speedMul: 0.20, desc: '이동 속도 +20%' },
        { speedMul: 0.30, desc: '이동 속도 +30%' },
        { speedMul: 0.45, desc: '이동 속도 +45% (최대)' }
      ]
    },
    eyedrop: {
      id: 'eyedrop',
      name: '시원한 인공눈물',
      icon: '👁️',
      desc: '모든 무기의 공격 속도(쿨타임 감소)를 증가시킵니다.',
      levels: [
        { cdReduc: 0.08, desc: '쿨타임 감소 8%' },
        { cdReduc: 0.16, desc: '쿨타임 감소 16%' },
        { cdReduc: 0.24, desc: '쿨타임 감소 24%' },
        { cdReduc: 0.35, desc: '쿨타임 감소 35% (최대)' }
      ]
    },
    bankbook: {
      id: 'bankbook',
      name: '두둑한 월급 통장',
      icon: '💳',
      desc: '경험치(커피콩) 및 골드(영수증) 자석 흡입 반경을 늘립니다.',
      levels: [
        { magnetRange: 50, desc: '자석 흡입 반경 +50px' },
        { magnetRange: 100, desc: '자석 흡입 반경 +100px' },
        { magnetRange: 160, desc: '자석 흡입 반경 +160px' },
        { magnetRange: 240, desc: '자석 흡입 반경 +240px (최대)' }
      ]
    },
    headphone: {
      id: 'headphone',
      name: '노이즈캔슬링 헤드폰',
      icon: '🎧',
      desc: '상사의 잔소리를 차단하여 받는 모든 피해량을 감소시킵니다.',
      levels: [
        { dmgReduc: 0.10, desc: '받는 피해 10% 감소' },
        { dmgReduc: 0.20, desc: '받는 피해 20% 감소' },
        { dmgReduc: 0.30, desc: '받는 피해 30% 감소' },
        { dmgReduc: 0.45, desc: '받는 피해 45% 감소 (최대)' }
      ]
    },
    leave: {
      id: 'leave',
      name: '연차 유급 휴가권',
      icon: '🏖️',
      desc: '초당 체력 회복과 사망 시 1회 완전 부활 기회를 얻습니다.',
      levels: [
        { hpRegen: 1.0, desc: '초당 HP +1 회복' },
        { hpRegen: 2.0, desc: '초당 HP +2 회복' },
        { hpRegen: 3.5, desc: '초당 HP +3.5 회복' },
        { hpRegen: 5.0, revive: 1, desc: '초당 HP +5 & 사망 시 1회 부활 (최대)' }
      ]
    }
  },

  // 5. 몬스터 8종 데이터
  MONSTERS: {
    paper: {
      name: '날아다니는 결재 서류',
      icon: '📄',
      color: '#f8f9fa',
      baseHp: 20,
      baseAtk: 8,
      speed: 2.4,
      radius: 14,
      exp: 10
    },
    slime: {
      name: '엑셀 #REF! 오류 슬라임',
      icon: '📊',
      color: '#2eb85c',
      baseHp: 45,
      baseAtk: 12,
      speed: 1.8,
      radius: 18,
      exp: 20,
      splitsOnDeath: true
    },
    copier: {
      name: '용지 걸린 멈춘 복사기',
      icon: '🖨️',
      color: '#495057',
      baseHp: 80,
      baseAtk: 16,
      speed: 1.3,
      radius: 22,
      exp: 35,
      ranged: true
    },
    slack: {
      name: '미확인 슬랙 알림 괴물',
      icon: '💬',
      color: '#e01e5a',
      baseHp: 60,
      baseAtk: 18,
      speed: 3.4,
      radius: 16,
      exp: 40
    },
    thief: {
      name: '탕비실 믹스커피 도둑',
      icon: '☕',
      color: '#a0522d',
      baseHp: 120,
      baseAtk: 22,
      speed: 2.6,
      radius: 20,
      exp: 55
    },
    // 보스 3종
    boss_manager: {
      isBoss: true,
      name: '[중간보스] 꼰대 과장',
      title: '라떼는 말이야 음파 폭격',
      icon: '👔',
      color: '#ff9900',
      baseHp: 1200,
      baseAtk: 25,
      speed: 1.6,
      radius: 36,
      exp: 300
    },
    boss_director: {
      isBoss: true,
      name: '[엘리트보스] 분노의 부장님',
      title: '서류가방 투척 & 결재판 내리찍기',
      icon: '💼',
      color: '#e63946',
      baseHp: 3500,
      baseAtk: 35,
      speed: 1.9,
      radius: 44,
      exp: 800
    },
    boss_ceo: {
      isBoss: true,
      name: '[최종보스] 철야 지시 대표이사',
      title: '전사원 긴급 소집 & 심야 결재선 레이저',
      icon: '👑',
      color: '#9d4edd',
      baseHp: 9000,
      baseAtk: 45,
      speed: 2.1,
      radius: 52,
      exp: 2000
    }
  },

  // 6. 연봉 협상 영구 강화 상점 데이터 (Permanent Upgrades)
  SHOP_UPGRADES: {
    hp: {
      id: 'hp',
      name: '☕ 고카페인 체력 증진',
      icon: '☕',
      desc: '기본 최대 체력을 영구적으로 +10% 증가시킵니다.',
      baseCost: 100,
      costMul: 1.6,
      maxLv: 5,
      bonusPerLv: 0.10,
      typeText: '최대 체력'
    },
    speed: {
      id: 'speed',
      name: '👟 에어 쿠션 슬리퍼',
      icon: '👟',
      desc: '기본 이동 속도를 영구적으로 +5% 증가시킵니다.',
      baseCost: 120,
      costMul: 1.6,
      maxLv: 5,
      bonusPerLv: 0.05,
      typeText: '이동 속도'
    },
    atk: {
      id: 'atk',
      name: '💼 실무 타건 분노력',
      icon: '💼',
      desc: '모든 무기의 기본 공격력을 영구적으로 +8% 증가시킵니다.',
      baseCost: 150,
      costMul: 1.7,
      maxLv: 5,
      bonusPerLv: 0.08,
      typeText: '공격력'
    },
    cd: {
      id: 'cd',
      name: '⚡ 초고속 칼퇴 집념',
      icon: '⚡',
      desc: '모든 무기의 발사 쿨타임을 영구적으로 4% 감소시킵니다.',
      baseCost: 200,
      costMul: 1.8,
      maxLv: 5,
      bonusPerLv: 0.04,
      typeText: '쿨타임 감소'
    },
    magnet: {
      id: 'magnet',
      name: '🧲 법인카드 한도 증액',
      icon: '🧲',
      desc: '아이템 및 커피콩 기본 자석 흡입 범위를 +25% 확장합니다.',
      baseCost: 100,
      costMul: 1.5,
      maxLv: 5,
      bonusPerLv: 0.25,
      typeText: '자석 범위'
    },
    gold: {
      id: 'gold',
      name: '💰 초과근무 성과급',
      icon: '💰',
      desc: '게임 내 획득하는 영수증(골드)을 영구적으로 +15% 증가시킵니다.',
      baseCost: 180,
      costMul: 1.7,
      maxLv: 5,
      bonusPerLv: 0.15,
      typeText: '코인 보너스'
    }
  },

  // 7. 사내 업적 10종 데이터 (Achievements)
  ACHIEVEMENTS: [
    {
      id: 'ach_first_clear',
      name: '🎉 11시 막차 탑승자',
      icon: '🏆',
      desc: '10분간 생존하여 야근 탈출을 1회 완수하세요.',
      reward: 500
    },
    {
      id: 'ach_kills_500',
      name: '📑 서류 파쇄기',
      icon: '⚔️',
      desc: '누적 500마리의 업무 몬스터를 처치하세요.',
      reward: 300
    },
    {
      id: 'ach_kills_2000',
      name: '💥 업무 분쇄 마스터',
      icon: '💣',
      desc: '누적 2,000마리의 업무 몬스터를 처치하세요.',
      reward: 800
    },
    {
      id: 'ach_gold_1000',
      name: '💳 법카 VIP 회원',
      icon: '💰',
      desc: '누적 1,000 커피 코인을 획득하세요.',
      reward: 300
    },
    {
      id: 'ach_gold_5000',
      name: '👑 법인카드 블랙 등급',
      icon: '💎',
      desc: '누적 5,000 커피 코인을 획득하세요.',
      reward: 1000
    },
    {
      id: 'ach_super_weapon',
      name: '⚡ 야근 병기 각성',
      icon: '🔥',
      desc: '초월 진화 무기를 1회 이상 각성하세요.',
      reward: 400
    },
    {
      id: 'ach_props_20',
      name: '🥤 탕비실 습격자',
      icon: '🚰',
      desc: '오피스 기물(정수기/자판기/복사기)을 20개 이상 파괴하세요.',
      reward: 350
    },
    {
      id: 'ach_boss_manager',
      name: '👔 라떼는 거절합니다',
      icon: '🛑',
      desc: '03:00 중간보스 꼰대 과장을 처치하세요.',
      reward: 300
    },
    {
      id: 'ach_boss_director',
      name: '💼 주말출근 결재 반려',
      icon: '⚡',
      desc: '07:00 엘리트보스 분노의 부장님을 처치하세요.',
      reward: 500
    },
    {
      id: 'ach_boss_ceo',
      name: '🏢 사직서 제출 완료',
      icon: '👑',
      desc: '10:00 최종보스 대표이사를 쓰러뜨리고 완전한 자유를 얻으세요.',
      reward: 1500
    }
  ],

  // 8. 업무 몬스터 도감 (Bestiary)
  BESTIARY: [
    {
      id: 'paper',
      name: '날아다니는 결재 서류',
      type: '일반 몬스터',
      icon: '📄',
      desc: '수시로 날아오는 A4 서류 뭉치. 빠르고 약하지만 떼지어 몰려듭니다.',
      strategy: '스테이플러나 키보드로 빠르게 관통하여 길을 트세요.'
    },
    {
      id: 'slime',
      name: '엑셀 #REF! 오류 슬라임',
      type: '분열형 몬스터',
      icon: '📊',
      desc: '수식이 꼬여 증식하는 젤리 괴물. 처치 시 2마리의 미니 슬라임으로 분열합니다.',
      strategy: '핫식스 장판이나 문서 세단기로 분열체까지 일괄 소탕하세요.'
    },
    {
      id: 'copier',
      name: '용지 걸린 폭주 복사기',
      type: '원거리 몬스터',
      icon: '🖨️',
      desc: '과열되어 먹통이 된 대형 복사기. 주기적으로 토너 탄막을 발사합니다.',
      strategy: '발사 탄환을 무빙으로 피하면서 접근하여 집중 타격하세요.'
    },
    {
      id: 'slack',
      name: '미확인 슬랙 알림 괴물',
      type: '부유 관통형 몬스터',
      icon: '💬',
      desc: '퇴근 직전 울리는 붉은 @Channel 알림 유령. 벽과 책상을 유유히 통과합니다.',
      strategy: '지형 뒤에 숨어 있어도 벽을 넘어오니 회전 법인카드로 견제하세요.'
    },
    {
      id: 'thief',
      name: '탕비실 믹스커피 도둑',
      type: '돌진형 엘리트',
      icon: '☕',
      desc: '회사 간식을 싹쓸이하는 월급 루팡. 튼튼한 맷집으로 정면 돌파해 옵니다.',
      strategy: '결재 반려 도장으로 강하게 스턴 및 압살 데미지를 넣으세요.'
    },
    {
      id: 'boss_manager',
      name: '꼰대 과장 (03:00)',
      type: '중간 보스',
      icon: '👔',
      desc: '"라떼는 말이야!" 음파 충격파와 3연속 반려 도장을 난사합니다.',
      strategy: '충격파 붉은 범위 밖으로 이탈 후 초월 무기 화력으로 속전속결하세요.'
    },
    {
      id: 'boss_director',
      name: '분노의 부장님 (07:00)',
      type: '엘리트 보스',
      icon: '💼',
      desc: '"주말에 다 나와!" 플레이어 발밑에 3개의 붉은 폭격 장판을 소환합니다.',
      strategy: '발밑에 생기는 붉은 원에서 1초 이내에 빠르게 빠져나오세요.'
    },
    {
      id: 'boss_ceo',
      name: '철야 지시 대표이사 (10:00)',
      type: '최종 보스',
      icon: '👑',
      desc: '"전사원 비상 야근 선포!" 16방향 초고속 레이저 탄막을 사방으로 난사합니다.',
      strategy: '탄막 사이 틈을 정밀하게 파고들며 6종 풀업 무기로 총공격하세요.'
    }
  ]
};

