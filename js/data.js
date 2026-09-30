// Office Escape Survivor - Game Constants & Data Registry

window.GAME_DATA = {
  // 1. 캐릭터 직급 데이터 (남/여 캐릭터 4종 완비)
  CHARACTERS: {
    intern: {
      id: 'intern',
      name: '신입사원 이민우',
      title: '풋풋한 신입 (남)',
      sprite: 'office_intern',
      avatar: window.assets.spriteHtml('char_office_intern_idle', 34, 'head') || window.getGameIcon('char_intern'),
      desc: '빠른 발과 불타는 열정으로 야근 지옥을 탈출하는 새내기 사원입니다.',
      baseHp: 100,
      speed: 3.8,
      initialWeapon: 'stapler',
      bonusText: '이동 속도 +15% / 경험치 획득 +20%',
      bonus: { speedMul: 0.15, xpMul: 0.20 }
    },
    planner: {
      id: 'planner',
      name: '기획팀 대리 한소희',
      title: '스마트 기획자 (여)',
      sprite: 'office_planner',
      avatar: window.assets.spriteHtml('char_office_planner_idle', 34, 'head') || window.getGameIcon('char_planner'),
      desc: '완벽한 PT와 분석력으로 난관을 돌파하는 에이스 기획 대리입니다.',
      baseHp: 110,
      speed: 3.6,
      initialWeapon: 'laser',
      bonusText: '기본 공격력 +20% / 쿨타임 감소 -15%',
      bonus: { atkMul: 0.20, cdReduc: 0.15 }
    },
    deputy: {
      id: 'deputy',
      name: '만년 대리 김철수',
      title: '야근의 전설 (남)',
      sprite: 'office_deputy',
      avatar: window.assets.spriteHtml('char_office_deputy_idle', 34, 'head') || window.getGameIcon('char_deputy'),
      desc: '쌓인 짬바와 분노의 폭풍 타건력으로 결재 서류를 부수는 베테랑입니다.',
      baseHp: 125,
      speed: 3.3,
      initialWeapon: 'keyboard',
      bonusText: '치명타율 +15% / 치명타 피해량 +30%',
      bonus: { critRate: 0.15, critDmgMul: 0.30 }
    },
    manager: {
      id: 'manager',
      name: '마케팅 팀장 박영희',
      title: '철벽의 리더 (여)',
      sprite: 'office_manager',
      avatar: window.assets.spriteHtml('char_office_manager_idle', 34, 'head') || window.getGameIcon('char_manager'),
      desc: '어떤 폭풍 지시와 잔소리도 튕겨내는 카리스마 마케팅 팀장입니다.',
      baseHp: 160,
      speed: 3.1,
      initialWeapon: 'card',
      bonusText: '최대 체력 +40% / 초당 HP 재생 +2.0 / 피해 감소 10%',
      bonus: { hpMul: 0.40, regenRate: 2.0, dmgReduc: 0.10 }
    }
  },

  // 2. 오피스 기본 무기 8종 (누적 스탯 완전 보장)
  WEAPONS: {
    stapler: {
      id: 'stapler',
      name: '고속 스테이플러',
      icon: window.getGameIcon('stapler'),
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
        { dmg: 18, cooldown: 0.85, projectiles: 1, pierce: 1, desc: '기본 스테이플러 침 발사' },
        { dmg: 24, cooldown: 0.85, projectiles: 1, pierce: 1, desc: '피해량 증가 (+6)' },
        { dmg: 24, cooldown: 0.85, projectiles: 2, pierce: 1, desc: '발사 침 개수 +1' },
        { dmg: 28, cooldown: 0.65, projectiles: 2, pierce: 1, desc: '발사 속도 증가' },
        { dmg: 28, cooldown: 0.65, projectiles: 3, pierce: 2, desc: '발사 침 +1 & 관통력 +1' },
        { dmg: 38, cooldown: 0.65, projectiles: 3, pierce: 2, desc: '피해량 대폭 증가 (+10)' },
        { dmg: 38, cooldown: 0.45, projectiles: 4, pierce: 2, desc: '발사 침 +1 & 쿨타임 대폭 감소' },
        { dmg: 52, cooldown: 0.45, projectiles: 4, pierce: 3, desc: '최대 레벨! (관통 침 4연사)' }
      ]
    },
    drink: {
      id: 'drink',
      name: '핫식스 에너지캔',
      icon: window.getGameIcon('drink'),
      desc: '바닥에 탄산 에너지드링크를 투척하여 고농도 각성 장판을 생성합니다.',
      type: 'puddle',
      baseDmg: 14,
      cooldown: 1.8,
      area: 60,
      duration: 2.5,
      projectiles: 1,
      color: '#ffaa00',
      evolution: 'super_drink',
      partnerPassive: 'eyedrop',
      levels: [
        { dmg: 14, cooldown: 1.8, area: 60, duration: 2.5, projectiles: 1, desc: '바닥에 각성 장판 1개 투척' },
        { dmg: 18, cooldown: 1.8, area: 60, duration: 2.5, projectiles: 1, desc: '지속 피해량 증가 (+4)' },
        { dmg: 18, cooldown: 1.8, area: 80, duration: 2.5, projectiles: 1, desc: '장판 범위 30% 증가' },
        { dmg: 22, cooldown: 1.8, area: 80, duration: 2.8, projectiles: 2, desc: '투척 개수 +1' },
        { dmg: 22, cooldown: 1.4, area: 80, duration: 2.8, projectiles: 2, desc: '투척 쿨타임 감소' },
        { dmg: 28, cooldown: 1.4, area: 100, duration: 3.0, projectiles: 2, desc: '피해량 & 범위 증가' },
        { dmg: 28, cooldown: 1.2, area: 100, duration: 3.4, projectiles: 3, desc: '투척 개수 +1 & 지속 시간 증가' },
        { dmg: 40, cooldown: 1.0, area: 125, duration: 3.8, projectiles: 3, desc: '최대 레벨! (광역 3중 폭풍 장판)' }
      ]
    },
    keyboard: {
      id: 'keyboard',
      name: '기계식 청축 키보드',
      icon: window.assets.iconHtml('keyboard'),
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
        { dmg: 25, cooldown: 1.2, projectiles: 4, spread: 0.55, desc: '전방 4방향 키캡 산탄 발사' },
        { dmg: 32, cooldown: 1.2, projectiles: 4, spread: 0.55, desc: '피해량 증가 (+7)' },
        { dmg: 32, cooldown: 1.2, projectiles: 6, spread: 0.70, desc: '키캡 개수 +2 (범위 확장)' },
        { dmg: 36, cooldown: 0.95, projectiles: 6, spread: 0.70, desc: '연타 속도 증가' },
        { dmg: 44, cooldown: 0.95, projectiles: 8, spread: 0.75, desc: '피해량 증가 & 키캡 개수 +2' },
        { dmg: 44, cooldown: 0.75, projectiles: 8, spread: 0.75, desc: '쿨타임 감소' },
        { dmg: 50, cooldown: 0.75, projectiles: 10, spread: 0.85, desc: '키캡 개수 10발로 증가' },
        { dmg: 65, cooldown: 0.60, projectiles: 12, spread: 0.90, desc: '최대 레벨! (12발 산탄 폭격)' }
      ]
    },
    stamp: {
      id: 'stamp',
      name: '결재 반려 도장',
      icon: window.getGameIcon('stamp'),
      desc: '무작위 적 머리 위에 거대한 붉은 반려 도장을 낙하시켜 압살합니다.',
      type: 'strike',
      baseDmg: 45,
      cooldown: 2.2,
      area: 70,
      strikes: 1,
      color: '#ff2255',
      evolution: 'super_stamp',
      partnerPassive: 'bankbook',
      levels: [
        { dmg: 45, cooldown: 2.2, area: 70, strikes: 1, desc: '적 머리 위에 결재 반려 도장 낙하' },
        { dmg: 60, cooldown: 2.2, area: 70, strikes: 1, desc: '압살 피해량 증가 (+15)' },
        { dmg: 60, cooldown: 2.2, area: 90, strikes: 1, desc: '타격 반경 확장' },
        { dmg: 70, cooldown: 2.0, area: 90, strikes: 2, desc: '도장 낙하 횟수 +1' },
        { dmg: 70, cooldown: 1.6, area: 90, strikes: 2, desc: '결재 반려 쿨타임 감소' },
        { dmg: 90, cooldown: 1.6, area: 110, strikes: 2, desc: '피해량 & 범위 증가' },
        { dmg: 90, cooldown: 1.3, area: 110, strikes: 3, desc: '도장 3연속 낙하' },
        { dmg: 130, cooldown: 1.1, area: 130, strikes: 4, desc: '최대 레벨! (4연속 융단 반려 폭격)' }
      ]
    },
    card: {
      id: 'card',
      name: '법인카드 쉴드',
      icon: window.getGameIcon('card'),
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
        { dmg: 16, count: 2, orbitRadius: 65, orbitSpeed: 3.2, desc: '회전하는 법인카드 2장 생성' },
        { dmg: 22, count: 3, orbitRadius: 68, orbitSpeed: 3.5, desc: '카드 +1장 & 피해량 증가' },
        { dmg: 22, count: 4, orbitRadius: 72, orbitSpeed: 3.8, desc: '카드 +1장 (4장)' },
        { dmg: 26, count: 4, orbitRadius: 74, orbitSpeed: 4.5, desc: '회전 속도 및 피해량 증가' },
        { dmg: 26, count: 5, orbitRadius: 80, orbitSpeed: 4.8, desc: '카드 +1장 & 회전 반경 증가' },
        { dmg: 34, count: 6, orbitRadius: 84, orbitSpeed: 5.2, desc: '카드 +1장 (6장) & 피해량 증가' },
        { dmg: 38, count: 7, orbitRadius: 88, orbitSpeed: 5.8, desc: '카드 7장 & 초고속 회전' },
        { dmg: 50, count: 8, orbitRadius: 94, orbitSpeed: 6.5, desc: '최대 레벨! (8장 황금 실드 결계)' }
      ]
    },
    shredder: {
      id: 'shredder',
      name: '문서 세단기 칼날',
      icon: window.getGameIcon('shredder'),
      desc: '나선형으로 뻗어나가는 날카로운 파쇄기 톱니를 발사하여 적을 뚫어버립니다.',
      type: 'spiral',
      baseDmg: 20,
      cooldown: 1.5,
      projectiles: 1,
      speed: 5,
      pierce: 999,
      color: '#a044ff',
      evolution: 'super_shredder',
      partnerPassive: 'leave',
      levels: [
        { dmg: 20, cooldown: 1.5, projectiles: 1, speed: 5, desc: '나선형 관통 톱니 1개 발사' },
        { dmg: 28, cooldown: 1.5, projectiles: 1, speed: 5, desc: '톱니 피해량 증가 (+8)' },
        { dmg: 28, cooldown: 1.5, projectiles: 2, speed: 5.5, desc: '양방향 톱니 발사' },
        { dmg: 32, cooldown: 1.1, projectiles: 2, speed: 5.5, desc: '발사 쿨타임 감소' },
        { dmg: 38, cooldown: 1.1, projectiles: 3, speed: 6.0, desc: '3방향 톱니 발사' },
        { dmg: 38, cooldown: 1.0, projectiles: 3, speed: 7.0, desc: '톱니 비행 속도 & 지속 시간 증가' },
        { dmg: 45, cooldown: 0.8, projectiles: 4, speed: 7.5, desc: '4방향 톱니 발사' },
        { dmg: 60, cooldown: 0.7, projectiles: 6, speed: 8.5, desc: '최대 레벨! (6방향 문서 분쇄 토네이도)' }
      ]
    },
    laser: {
      id: 'laser',
      name: 'PT 레이저 포인터',
      icon: window.getGameIcon('laser'),
      desc: '가장 가까운 적들을 일직선으로 관통하는 고출력 그린 레이저 빔을 발사합니다.',
      type: 'laser',
      baseDmg: 22,
      cooldown: 1.1,
      projectiles: 1,
      speed: 16,
      pierce: 999,
      color: '#00ff88',
      evolution: 'super_laser',
      partnerPassive: 'timer',
      levels: [
        { dmg: 22, cooldown: 1.1, projectiles: 1, desc: '초록색 관통 레이저 빔 1줄기 발사' },
        { dmg: 30, cooldown: 1.1, projectiles: 1, desc: '레이저 출력 및 피해량 증가 (+8)' },
        { dmg: 30, cooldown: 1.1, projectiles: 2, desc: '트윈 레이저 빔 2줄기 발사' },
        { dmg: 36, cooldown: 0.85, projectiles: 2, desc: '레이저 조사 쿨타임 감소' },
        { dmg: 44, cooldown: 0.85, projectiles: 3, desc: '3방향 확산 레이저 빔 발사' },
        { dmg: 52, cooldown: 0.70, projectiles: 3, desc: '피해량 & 조사 속도 증가' },
        { dmg: 52, cooldown: 0.55, projectiles: 4, desc: '4방향 크로스 레이저 빔' },
        { dmg: 72, cooldown: 0.40, projectiles: 4, desc: '최대 레벨! (초고속 4줄기 파괴 광선)' }
      ]
    },
    coffee_bomb: {
      id: 'coffee_bomb',
      name: '갓 내린 텀블러',
      icon: window.assets.iconHtml('tumbler'),
      desc: '뜨거운 커피 텀블러를 던져 강력한 360도 스플래시 폭발을 일으킵니다.',
      type: 'bomb',
      baseDmg: 35,
      cooldown: 2.0,
      area: 75,
      projectiles: 1,
      color: '#c2410c',
      evolution: 'super_coffee',
      partnerPassive: 'bonus',
      levels: [
        { dmg: 35, cooldown: 2.0, area: 75, projectiles: 1, desc: '뜨거운 커피 텀블러 투척 폭발' },
        { dmg: 48, cooldown: 2.0, area: 75, projectiles: 1, desc: '폭발 피해량 증가 (+13)' },
        { dmg: 48, cooldown: 2.0, area: 95, projectiles: 1, desc: '스플래시 폭발 반경 확장' },
        { dmg: 56, cooldown: 1.7, area: 95, projectiles: 2, desc: '텀블러 2개 동시 투척' },
        { dmg: 56, cooldown: 1.35, area: 95, projectiles: 2, desc: '투척 쿨타임 대폭 감소' },
        { dmg: 72, cooldown: 1.35, area: 115, projectiles: 2, desc: '피해량 & 폭발 반경 증가' },
        { dmg: 72, cooldown: 1.1, area: 115, projectiles: 3, desc: '텀블러 3개 동시 투척' },
        { dmg: 105, cooldown: 0.9, area: 140, projectiles: 3, desc: '최대 레벨! (3중 화산 폭발 텀블러)' }
      ]
    },
    postit: {
      id: 'postit',
      name: '포스트잇 폭풍',
      icon: window.assets.iconHtml('memo'),
      desc: '몸 가까이에서 포스트잇이 빠르게 회전하며 달라붙는 적을 연속 타격합니다.',
      type: 'orbital',
      baseDmg: 9,
      cooldown: 0.5,
      count: 3,
      orbitRadius: 44,
      orbitSpeed: 5.5,
      color: '#fde047',
      levels: [
        { dmg: 9, count: 3, orbitRadius: 44, orbitSpeed: 5.5, desc: '포스트잇 3장이 몸 주위를 고속 회전' },
        { dmg: 12, count: 3, orbitRadius: 44, orbitSpeed: 6.0, desc: '피해량 증가 (+3)' },
        { dmg: 12, count: 4, orbitRadius: 46, orbitSpeed: 6.2, desc: '포스트잇 +1장' },
        { dmg: 15, count: 5, orbitRadius: 48, orbitSpeed: 6.6, desc: '포스트잇 +1장 & 피해량 증가' },
        { dmg: 18, count: 5, orbitRadius: 50, orbitSpeed: 7.0, desc: '회전 속도 & 피해량 증가' },
        { dmg: 18, count: 6, orbitRadius: 52, orbitSpeed: 7.4, desc: '포스트잇 +1장 (6장)' },
        { dmg: 22, count: 7, orbitRadius: 54, orbitSpeed: 7.8, desc: '포스트잇 7장 & 피해량 증가' },
        { dmg: 30, count: 8, orbitRadius: 56, orbitSpeed: 8.4, desc: '최대 레벨! (8장 포스트잇 회오리)' }
      ]
    },
    namecard: {
      id: 'namecard',
      name: '명함 부메랑',
      icon: window.assets.iconHtml('id_card'),
      desc: '넓은 궤도로 명함이 크게 돌며 부딪힌 적을 멀리 튕겨냅니다.',
      type: 'orbital',
      baseDmg: 30,
      cooldown: 0.5,
      count: 1,
      orbitRadius: 125,
      orbitSpeed: 2.2,
      color: '#e2e8f0',
      levels: [
        { dmg: 30, count: 1, orbitRadius: 125, orbitSpeed: 2.2, desc: '명함 1장이 넓은 궤도를 회전' },
        { dmg: 40, count: 1, orbitRadius: 130, orbitSpeed: 2.4, desc: '피해량 증가 (+10)' },
        { dmg: 40, count: 2, orbitRadius: 135, orbitSpeed: 2.5, desc: '명함 +1장' },
        { dmg: 50, count: 2, orbitRadius: 140, orbitSpeed: 2.7, desc: '피해량 & 궤도 증가' },
        { dmg: 55, count: 3, orbitRadius: 145, orbitSpeed: 2.8, desc: '명함 +1장 (3장)' },
        { dmg: 65, count: 3, orbitRadius: 152, orbitSpeed: 3.0, desc: '피해량 & 회전 속도 증가' },
        { dmg: 75, count: 4, orbitRadius: 158, orbitSpeed: 3.2, desc: '명함 +1장 (4장)' },
        { dmg: 95, count: 4, orbitRadius: 165, orbitSpeed: 3.4, desc: '최대 레벨! (4장 VIP 명함 부메랑)' }
      ]
    }
  },

  // 3. 초월 진화 무기 8종 (Super Weapons)
  SUPER_WEAPONS: {
    super_stapler: {
      id: 'super_stapler',
      name: '🔥 [고속 자동 제본건]',
      icon: window.getGameIcon('super_stapler'),
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
      icon: window.getGameIcon('super_drink'),
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
      icon: window.getGameIcon('super_keyboard'),
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
      icon: window.getGameIcon('super_stamp'),
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
      icon: window.getGameIcon('super_card'),
      desc: '빛나는 12장의 블랙카드가 절대 방어벽을 두르며 충격파를 뿜어냅니다!',
      type: 'super_orbital',
      baseDmg: 75,
      cooldown: 0.5,
      count: 12,
      orbitRadius: 95,
      orbitSpeed: 7.5,
      color: '#ffd700'
    },
    super_shredder: {
      id: 'super_shredder',
      name: '🔥 [초고속 문서 분쇄 토네이도]',
      icon: window.getGameIcon('super_shredder'),
      desc: '적들을 중심으로 끌어당겨 가루로 갈아버리는 블랙홀 분쇄 회오리!',
      type: 'super_spiral',
      baseDmg: 85,
      cooldown: 0.5,
      projectiles: 8,
      color: '#bb33ff'
    },
    super_laser: {
      id: 'super_laser',
      name: '🔥 [PT 결재 올패스 홀로그램 빔]',
      icon: window.getGameIcon('super_laser'),
      desc: '화면 전체를 꿰뚫는 4줄기의 영구적 무한 회전 홀로그램 레이저가 모든 적을 절단합니다!',
      type: 'super_laser',
      baseDmg: 95,
      cooldown: 0.3,
      projectiles: 4,
      color: '#00ffaa'
    },
    super_coffee: {
      id: 'super_coffee',
      name: '🔥 [화산 폭발 에스프레소 캐논]',
      icon: window.getGameIcon('super_coffee'),
      desc: '화면을 뒤흔드는 초거대 에스프레소 마그마 폭발로 광역 초토화!',
      type: 'super_bomb',
      baseDmg: 160,
      cooldown: 0.8,
      area: 200,
      projectiles: 4,
      color: '#ea580c'
    }
  },

  // 4. 사내 복지 패시브 10종
  PASSIVES: {
    glasses: {
      id: 'glasses',
      name: '블루라이트 차단 안경',
      icon: window.getGameIcon('glasses'),
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
      icon: window.getGameIcon('desk'),
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
      icon: window.getGameIcon('eyedrop'),
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
      icon: window.assets.iconHtml('wallet'),
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
      icon: window.assets.iconHtml('headphone'),
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
      icon: window.getGameIcon('leave'),
      desc: '초당 체력 회복과 사망 시 1회 완전 부활 기회를 얻습니다.',
      levels: [
        { hpRegen: 1.0, desc: '초당 HP +1 회복' },
        { hpRegen: 2.0, desc: '초당 HP +2 회복' },
        { hpRegen: 3.5, desc: '초당 HP +3.5 회복' },
        { hpRegen: 5.0, revive: 1, desc: '초당 HP +5 & 사망 시 1회 부활 (최대)' }
      ]
    },
    timer: {
      id: 'timer',
      name: '칼퇴 전자 스톱워치',
      icon: window.getGameIcon('timer'),
      desc: '모든 공격의 탄속 및 투사체 지속시간을 증가시킵니다.',
      levels: [
        { projectileSpeed: 0.15, desc: '탄속 및 지속시간 +15%' },
        { projectileSpeed: 0.30, desc: '탄속 및 지속시간 +30%' },
        { projectileSpeed: 0.45, desc: '탄속 및 지속시간 +45%' },
        { projectileSpeed: 0.65, desc: '탄속 및 지속시간 +65% (최대)' }
      ]
    },
    bonus: {
      id: 'bonus',
      name: '성과급 보너스 봉투',
      icon: window.getGameIcon('bonus'),
      desc: '치명타 확률과 치명타 피해량을 대폭 증가시킵니다.',
      levels: [
        { critRate: 0.06, critDmgMul: 0.25, desc: '치명타율 +6% / 치명타 피해 +25%' },
        { critRate: 0.12, critDmgMul: 0.50, desc: '치명타율 +12% / 치명타 피해 +50%' },
        { critRate: 0.18, critDmgMul: 0.75, desc: '치명타율 +18% / 치명타 피해 +75%' },
        { critRate: 0.25, critDmgMul: 1.10, desc: '치명타율 +25% / 치명타 피해 +110% (최대)' }
      ]
    },
    airpod: {
      id: 'airpod',
      name: '무선 노캔 이어폰',
      icon: window.getGameIcon('airpod'),
      desc: '대시 쿨타임을 단축시키고 위기 시 자동 회피율을 부여합니다.',
      levels: [
        { dodgeRate: 0.06, dashCdReduc: 0.10, desc: '회피율 +6% / 대시 쿨타임 -10%' },
        { dodgeRate: 0.12, dashCdReduc: 0.20, desc: '회피율 +12% / 대시 쿨타임 -20%' },
        { dodgeRate: 0.18, dashCdReduc: 0.30, desc: '회피율 +18% / 대시 쿨타임 -30%' },
        { dodgeRate: 0.25, dashCdReduc: 0.45, desc: '회피율 +25% / 대시 쿨타임 -45% (최대)' }
      ]
    },
    badge: {
      id: 'badge',
      name: '골드 마스터 사원증',
      icon: window.assets.iconHtml('lanyard'),
      desc: '경험치(커피콩) 및 골드(영수증) 획득량을 대폭 증가시킵니다.',
      levels: [
        { xpMul: 0.15, goldMul: 0.20, desc: '경험치 +15% / 골드 +20%' },
        { xpMul: 0.30, goldMul: 0.40, desc: '경험치 +30% / 골드 +40%' },
        { xpMul: 0.45, goldMul: 0.60, desc: '경험치 +45% / 골드 +60%' },
        { xpMul: 0.65, goldMul: 1.00, desc: '경험치 +65% / 골드 +100% (최대)' }
      ]
    }
  },

  // 5. 몬스터 8종 데이터
  MONSTERS: {
    paper: {
      name: '날아다니는 결재 서류',
      icon: window.assets.spriteHtml('mon_paper_walk0', 30) || window.getGameIcon('paper'),
      color: '#f8f9fa',
      baseHp: 16,
      baseAtk: 8,
      speed: 2.2,
      radius: 14,
      exp: 4
    },
    slime: {
      name: '엑셀 #REF! 오류 슬라임',
      icon: window.assets.spriteHtml('mon_slime_walk0', 30) || window.getGameIcon('slime'),
      color: '#2eb85c',
      baseHp: 36,
      baseAtk: 12,
      speed: 1.8,
      radius: 18,
      exp: 8,
      splitsOnDeath: true
    },
    copier: {
      name: '용지 걸린 멈춘 복사기',
      icon: window.getGameIcon('copier'),
      color: '#495057',
      baseHp: 64,
      baseAtk: 16,
      speed: 1.3,
      radius: 22,
      exp: 14,
      ranged: true
    },
    slack: {
      name: '미확인 슬랙 알림 괴물',
      icon: window.assets.spriteHtml('mon_slack_walk0', 30) || window.getGameIcon('slack'),
      color: '#e01e5a',
      baseHp: 48,
      baseAtk: 18,
      speed: 2.7,
      radius: 16,
      exp: 16
    },
    thief: {
      name: '탕비실 믹스커피 도둑',
      icon: window.assets.spriteHtml('mon_thief_walk0', 30) || window.getGameIcon('thief'),
      color: '#a0522d',
      baseHp: 96,
      baseAtk: 22,
      speed: 2.3,
      radius: 20,
      exp: 22
    },
    zombie: {
      name: '야근 좀비 동료',
      sprite: 'zombie',
      color: '#34d399',
      baseHp: 76,
      baseAtk: 16,
      speed: 1.9,
      radius: 18,
      exp: 13
    },
    robot: {
      name: 'AI 자동화 로봇',
      sprite: 'robot',
      color: '#60a5fa',
      baseHp: 92,
      baseAtk: 18,
      speed: 2.0,
      radius: 18,
      exp: 18,
      ranged: true
    },
    // 보스 3종
    boss_manager: {
      isBoss: true,
      name: '[중간보스] 꼰대 과장',
      title: '라떼는 말이야 음파 폭격',
      icon: window.getGameIcon('boss_manager'),
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
      icon: window.getGameIcon('boss_director'),
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
      icon: window.getGameIcon('boss_ceo'),
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
      name: '고카페인 체력 증진',
      icon: window.getGameIcon('up_hp'),
      desc: '기본 최대 체력을 영구적으로 +10% 증가시킵니다.',
      baseCost: 150,
      costMul: 2.1,
      maxLv: 10,
      bonusPerLv: 0.10,
      typeText: '최대 체력'
    },
    speed: {
      id: 'speed',
      name: '에어 쿠션 슬리퍼',
      icon: window.getGameIcon('up_speed'),
      desc: '기본 이동 속도를 영구적으로 +5% 증가시킵니다.',
      baseCost: 180,
      costMul: 1.9,
      maxLv: 5,
      bonusPerLv: 0.05,
      typeText: '이동 속도'
    },
    atk: {
      id: 'atk',
      name: '실무 타건 분노력',
      icon: window.getGameIcon('up_atk'),
      desc: '모든 무기의 기본 공격력을 영구적으로 +8% 증가시킵니다.',
      baseCost: 225,
      costMul: 2.15,
      maxLv: 10,
      bonusPerLv: 0.08,
      typeText: '공격력'
    },
    cd: {
      id: 'cd',
      name: '초고속 칼퇴 집념',
      icon: window.getGameIcon('up_cd'),
      desc: '모든 무기의 발사 쿨타임을 영구적으로 4% 감소시킵니다.',
      baseCost: 300,
      costMul: 2.2,
      maxLv: 8,
      bonusPerLv: 0.04,
      typeText: '쿨타임 감소'
    },
    magnet: {
      id: 'magnet',
      name: '법인카드 한도 증액',
      icon: window.getGameIcon('up_magnet'),
      desc: '아이템 및 커피콩 기본 자석 흡입 범위를 +25% 확장합니다.',
      baseCost: 150,
      costMul: 1.7,
      maxLv: 5,
      bonusPerLv: 0.25,
      typeText: '자석 범위'
    },
    gold: {
      id: 'gold',
      name: '초과근무 성과급',
      icon: window.getGameIcon('up_gold'),
      desc: '게임 내 획득하는 영수증(골드)을 영구적으로 +15% 증가시킵니다.',
      baseCost: 270,
      costMul: 1.9,
      maxLv: 5,
      bonusPerLv: 0.15,
      typeText: '코인 보너스'
    }
  },

  // 7. 사내 업적 10종 데이터 (Achievements)
  ACHIEVEMENTS: [
    {
      id: 'ach_first_clear',
      name: '11시 막차 탑승자',
      icon: window.getGameIcon('ach_first_clear'),
      desc: '10분간 생존하여 야근 탈출을 1회 완수하세요.',
      reward: 500
    },
    {
      id: 'ach_kills_500',
      name: '서류 파쇄기',
      icon: window.getGameIcon('ach_kills_500'),
      desc: '누적 500마리의 업무 몬스터를 처치하세요.',
      reward: 300
    },
    {
      id: 'ach_kills_2000',
      name: '업무 분쇄 마스터',
      icon: window.getGameIcon('ach_kills_2000'),
      desc: '누적 2,000마리의 업무 몬스터를 처치하세요.',
      reward: 800
    },
    {
      id: 'ach_gold_1000',
      name: '법카 VIP 회원',
      icon: window.getGameIcon('ach_gold_1000'),
      desc: '누적 1,000 커피 코인을 획득하세요.',
      reward: 300
    },
    {
      id: 'ach_gold_5000',
      name: '법인카드 블랙 등급',
      icon: window.getGameIcon('ach_gold_5000'),
      desc: '누적 5,000 커피 코인을 획득하세요.',
      reward: 1000
    },
    {
      id: 'ach_super_weapon',
      name: '야근 병기 각성',
      icon: window.getGameIcon('ach_super_weapon'),
      desc: '초월 진화 무기를 1회 이상 각성하세요.',
      reward: 400
    },
    {
      id: 'ach_props_20',
      name: '탕비실 습격자',
      icon: window.getGameIcon('ach_props_20'),
      desc: '오피스 기물(정수기/자판기/복사기)을 20개 이상 파괴하세요.',
      reward: 350
    },
    {
      id: 'ach_boss_manager',
      name: '라떼는 거절합니다',
      icon: window.getGameIcon('ach_boss_manager'),
      desc: '03:00 중간보스 꼰대 과장을 처치하세요.',
      reward: 300
    },
    {
      id: 'ach_boss_director',
      name: '주말출근 결재 반려',
      icon: window.getGameIcon('ach_boss_director'),
      desc: '07:00 엘리트보스 분노의 부장님을 처치하세요.',
      reward: 500
    },
    {
      id: 'ach_chapter5',
      name: '중간 관리자 승진',
      icon: window.getGameIcon('ach_boss_director'),
      desc: '5장 을지로 공기업 본사를 정복하세요.',
      reward: 3000
    },
    {
      id: 'ach_chapter10',
      name: '영원한 칼퇴',
      icon: window.getGameIcon('ach_boss_ceo'),
      desc: '10장 그룹 본관 최상층 회장실을 정복하세요.',
      reward: 10000
    },
    {
      id: 'ach_boss_ceo',
      name: '사직서 제출 완료',
      icon: window.getGameIcon('ach_boss_ceo'),
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
      icon: window.assets.spriteHtml('mon_paper_walk0', 30) || window.getGameIcon('paper'),
      desc: '수시로 날아오는 A4 서류 뭉치. 빠르고 약하지만 떼지어 몰려듭니다.',
      strategy: '스테이플러나 키보드로 빠르게 관통하여 길을 트세요.'
    },
    {
      id: 'slime',
      name: '엑셀 #REF! 오류 슬라임',
      type: '분열형 몬스터',
      icon: window.assets.spriteHtml('mon_slime_walk0', 30) || window.getGameIcon('slime'),
      desc: '수식이 꼬여 증식하는 젤리 괴물. 처치 시 2마리의 미니 슬라임으로 분열합니다.',
      strategy: '핫식스 장판이나 문서 세단기로 분열체까지 일괄 소탕하세요.'
    },
    {
      id: 'copier',
      name: '용지 걸린 폭주 복사기',
      type: '원거리 몬스터',
      icon: window.getGameIcon('copier'),
      desc: '과열되어 먹통이 된 대형 복사기. 주기적으로 토너 탄막을 발사합니다.',
      strategy: '발사 탄환을 무빙으로 피하면서 접근하여 집중 타격하세요.'
    },
    {
      id: 'slack',
      name: '미확인 슬랙 알림 괴물',
      type: '부유 관통형 몬스터',
      icon: window.assets.spriteHtml('mon_slack_walk0', 30) || window.getGameIcon('slack'),
      desc: '퇴근 직전 울리는 붉은 @Channel 알림 유령. 벽과 책상을 유유히 통과합니다.',
      strategy: '지형 뒤에 숨어 있어도 벽을 넘어오니 회전 법인카드로 견제하세요.'
    },
    {
      id: 'thief',
      name: '탕비실 믹스커피 도둑',
      type: '돌진형 엘리트',
      icon: window.assets.spriteHtml('mon_thief_walk0', 30) || window.getGameIcon('thief'),
      desc: '복면을 쓴 믹스커피 스틱이 탕비실 간식을 자루째 훔쳐 달아납니다. 튼튼한 맷집으로 정면 돌파해 옵니다.',
      strategy: '결재 반려 도장으로 강하게 스턴 및 압살 데미지를 넣으세요.'
    },
    {
      id: 'zombie',
      name: '야근 좀비 동료',
      type: '탱커형 몬스터',
      icon: window.assets.spriteHtml('char_zombie_idle', 30, 'head'),
      desc: '30일 연속 야근 끝에 좀비가 된 동료. 느리지만 맷집이 단단합니다. (2장부터 출현)',
      strategy: '장판과 폭탄으로 무리를 한 번에 녹이세요.'
    },
    {
      id: 'robot',
      name: 'AI 자동화 로봇',
      type: '원거리 몬스터',
      icon: window.assets.spriteHtml('char_robot_idle', 30, 'head'),
      desc: '모니터 머리에 사무용 의자 바퀴를 단 자동화 로봇. 주기적으로 레이저를 발사합니다. (4장부터 출현)',
      strategy: '레이저 발사 직후 대시로 파고들어 근접 처치하세요.'
    },
    {
      id: 'boss_manager',
      name: '꼰대 과장 (03:00)',
      type: '중간 보스',
      icon: window.getGameIcon('boss_manager'),
      desc: '"라떼는 말이야!" 음파 충격파와 3연속 반려 도장을 난사합니다.',
      strategy: '충격파 붉은 범위 밖으로 이탈 후 초월 무기 화력으로 속전속결하세요.'
    },
    {
      id: 'boss_director',
      name: '분노의 부장님 (07:00)',
      type: '엘리트 보스',
      icon: window.getGameIcon('boss_director'),
      desc: '"주말에 다 나와!" 플레이어 발밑에 3개의 붉은 폭격 장판을 소환합니다.',
      strategy: '발밑에 생기는 붉은 원에서 1초 이내에 빠르게 빠져나오세요.'
    },
    {
      id: 'boss_ceo',
      name: '철야 지시 대표이사 (10:00)',
      type: '최종 보스',
      icon: window.getGameIcon('boss_ceo'),
      desc: '"전사원 비상 야근 선포!" 16방향 초고속 레이저 탄막을 사방으로 난사합니다.',
      strategy: '탄막 사이 틈을 정밀하게 파고들며 6종 풀업 무기로 총공격하세요.'
    }
  ],

  // 9. 챕터 및 스테이지 데이터 (1챕터: 판교 테크노밸리 스타트업 탈출 1-1 ~ 1-10)
  CHAPTERS: {
    ch1: {
      id: 'ch1',
      title: '제1장: 판교 테크노밸리 스타트업 본사',
      subtitle: '칼퇴를 가로막는 10단계의 결재선을 돌파하라!',
      icon: window.getGameIcon('stage_open_office'),
      stages: [
        {
          id: '1-1',
          name: '1-1 탕비실 커피 쟁탈전',
          desc: '월요일 아침, 탕비실 믹스커피를 싹쓸이하는 너구리 도둑들을 소탕하고 생존 카페인을 확보하세요.',
          duration: 60,
          boss: null,
          spawnRate: 1.0,
          reward: 200,
          goldReward: 200,
          theme: 'pantry',
          targetKills: 30,
          monsters: ['paper', 'paper', 'paper', 'thief'],
          icon: window.getGameIcon('stage_pantry')
        },
        {
          id: '1-2',
          name: '1-2 오픈오피스 슬랙 폭격',
          desc: '퇴근 10분 전 쏟아지는 슬랙 @99+ 멘션 괴물들의 알림을 뚫고 다음 구역으로 전진하세요.',
          duration: 75,
          boss: null,
          spawnRate: 1.2,
          reward: 250,
          goldReward: 250,
          theme: 'open_office',
          targetKills: 45,
          monsters: ['paper', 'paper', 'slack'],
          icon: window.getGameIcon('stage_open_office')
        },
        {
          id: '1-3',
          name: '1-3 기획전략실 결재판 담판',
          desc: '라떼는 말이야 음파 폭격을 난사하는 꼰대 김과장의 결재판을 파쇄하세요!',
          duration: 90,
          boss: 'boss_manager',
          bossTime: 50,
          spawnRate: 1.3,
          reward: 400,
          goldReward: 400,
          theme: 'meeting_room',
          targetKills: 60,
          monsters: ['paper', 'slime', 'slack'],
          icon: window.getGameIcon('stage_meeting_room')
        },
        {
          id: '1-4',
          name: '1-4 재무회계팀 엑셀 지옥',
          desc: '끝없이 분열하며 증식하는 #REF! 수식 오류 슬라임들을 분쇄하고 결산서를 지키세요.',
          duration: 90,
          boss: null,
          spawnRate: 1.4,
          reward: 350,
          goldReward: 350,
          theme: 'open_office',
          targetKills: 75,
          monsters: ['slime', 'slime', 'paper'],
          icon: window.getGameIcon('stage_open_office')
        },
        {
          id: '1-5',
          name: '1-5 지하 전산 서버실 비상',
          desc: '과열된 서버 랙과 전산망 마비 오류 파편들을 뚫고 메인 전원을 재가동하세요.',
          duration: 100,
          boss: null,
          spawnRate: 1.5,
          reward: 450,
          goldReward: 450,
          theme: 'server_room',
          targetKills: 90,
          monsters: ['paper', 'slack', 'copier'],
          icon: window.getGameIcon('stage_server_room')
        },
        {
          id: '1-6',
          name: '1-6 디자인실 밤샘 마감',
          desc: '수정_최종_진짜최종.psd 파일 폭풍을 뚫고 클라이언트 컨펌을 통과시키세요.',
          duration: 110,
          boss: null,
          spawnRate: 1.6,
          reward: 500,
          goldReward: 500,
          theme: 'open_office',
          targetKills: 110,
          monsters: ['paper', 'slime', 'slack', 'copier'],
          icon: window.getGameIcon('stage_open_office')
        },
        {
          id: '1-7',
          name: '1-7 총무인사팀 복사기실',
          desc: '종이 걸린 채 사방으로 토너 레이저를 난사하는 폭주 복합기 군단을 모조리 파괴하세요.',
          duration: 120,
          boss: null,
          spawnRate: 1.7,
          reward: 600,
          goldReward: 600,
          theme: 'pantry',
          targetKills: 130,
          monsters: ['copier', 'copier', 'paper', 'slime'],
          icon: window.getGameIcon('stage_pantry')
        },
        {
          id: '1-8',
          name: '1-8 20층 대회의실 긴급소집',
          desc: '분노의 박부장이 뿜어내는 💢 분노 오라와 서류가방 투척 폭격을 격파하세요!',
          duration: 130,
          boss: 'boss_director',
          bossTime: 75,
          spawnRate: 1.8,
          reward: 750,
          goldReward: 750,
          theme: 'meeting_room',
          targetKills: 150,
          monsters: ['paper', 'slime', 'slack', 'copier', 'thief'],
          icon: window.getGameIcon('stage_meeting_room')
        },
        {
          id: '1-9',
          name: '1-9 펜트하우스 임원 비서실',
          desc: '철야 근무 사수대와 최정예 업무 몬스터들의 총공세를 돌파하여 대표이사실 문을 여세요.',
          duration: 140,
          boss: null,
          spawnRate: 2.0,
          reward: 900,
          goldReward: 900,
          theme: 'executive',
          targetKills: 170,
          monsters: ['slime', 'slack', 'copier', 'thief', 'thief'],
          icon: window.getGameIcon('stage_executive')
        },
        {
          id: '1-10',
          name: '1-10 대표이사실 최종 사직서',
          desc: '황금 결계 쉴드를 두른 철야 지시 대표이사를 쓰러뜨리고 최종 퇴근 결재 도장을 쟁취하세요!',
          duration: 180,
          boss: 'boss_ceo',
          bossTime: 90,
          spawnRate: 2.2,
          reward: 2000,
          goldReward: 2000,
          theme: 'executive',
          targetKills: 200,
          monsters: ['paper', 'slime', 'copier', 'slack', 'thief'],
          icon: window.getGameIcon('stage_executive')
        }
      ]
    }
  }
};

// 10. 챕터 2~10 자동 생성 (챕터가 오를수록 체력/공격력/물량/보상 증가)
(function buildChapters() {
  const D = window.GAME_DATA;
  const icon = k => window.getGameIcon(k);
  const BASE_DURATION = [60, 75, 90, 90, 100, 110, 120, 130, 140, 180];
  const BASE_REWARD = [200, 250, 400, 350, 450, 500, 600, 750, 900, 2000];
  const BOSS_AT = { 3: 'boss_manager', 8: 'boss_director', 10: 'boss_ceo' };
  const THEME_ICON = ['stage_pantry', 'stage_open_office', 'stage_meeting_room', 'stage_open_office', 'stage_server_room', 'stage_open_office', 'stage_pantry', 'stage_meeting_room', 'stage_executive', 'stage_executive'];

  const CHAPTER_DEFS = [
    {
      title: '여의도 금융타워', subtitle: '숫자와 호가가 폭주하는 증권가 한복판', pool: ['paper', 'slack', 'zombie', 'thief'],
      stages: [
        ['객장 시세판 폭주', '장 시작과 동시에 쏟아지는 체결 알림을 뚫고 자리를 지키세요.'],
        ['트레이딩룸 호가 전쟁', '1초에 수백 번 바뀌는 호가창 괴물들을 정리하세요.'],
        ['리서치센터 보고서 마감', '장 마감 전 보고서를 막아서는 꼰대 과장을 설득하세요.'],
        ['준법감시팀 감사 대비', '감사 서류 더미 사이로 야근 좀비 동료들이 몰려옵니다.'],
        ['백오피스 결제 마감', '결제 마감 직전, 오류 알림 폭탄을 해제하세요.'],
        ['IB본부 딜 클로징', '밤샘 딜 클로징에 지친 동료들이 좀비가 되었습니다.'],
        ['PB센터 VIP 응대', 'VIP 고객 간식을 노리는 탕비실 도둑단을 막으세요.'],
        ['리스크관리실 긴급 회의', '손실 보고에 분노한 부장님이 회의실을 봉쇄했습니다.'],
        ['임원 회의실 실적 보고', '실적 보고 자료를 지키며 임원층 복도를 돌파하세요.'],
        ['대표 집무실 결산 브리핑', '연말 결산을 앞둔 대표이사를 넘어 퇴근하세요.']
      ]
    },
    {
      title: '강남 광고대행사', subtitle: '수정의 수정의 수정본이 끝없이 나오는 곳', pool: ['paper', 'slime', 'slack', 'zombie'],
      stages: [
        ['아이데이션 회의실', '아이디어 회의가 끝나지 않습니다. 탈출구를 찾으세요.'],
        ['카피라이터 룸 야근', '한 줄 카피를 위해 밤을 새우는 좀비 카피라이터들.'],
        ['AE본부 광고주 미팅', '광고주의 “느낌 있게”를 해석하는 꼰대 과장이 등장합니다.'],
        ['디자인팀 시안 폭탄', '시안_최종_진짜최종 파일들이 슬라임으로 변했습니다.'],
        ['영상 편집실 렌더링', '렌더링 대기 중 튀어나오는 오류들을 처리하세요.'],
        ['미디어플래닝 엑셀', '미디어 믹스 엑셀 수식이 전부 #REF!로 깨졌습니다.'],
        ['PT 리허설룸', '경쟁 PT 전날, 슬랙 알림이 쉴 새 없이 울립니다.'],
        ['CD실 최종 컨펌', '크리에이티브 디렉터 부장님이 모든 시안을 반려합니다.'],
        ['광고주 본사 방문', '광고주 본사 로비에서 마지막 수정 요청을 막아내세요.'],
        ['대표실 수주 결정', '대행사 대표를 넘어 수주를 확정하고 퇴근하세요.']
      ]
    },
    {
      title: '구로 디지털단지 SI', subtitle: '오픈 전날은 언제나 장애가 난다', pool: ['slime', 'copier', 'robot', 'zombie'],
      stages: [
        ['개발자 휴게실', '에너지 드링크를 사수하며 첫 야근을 버티세요.'],
        ['QA팀 버그 리포트', '끝없이 등록되는 버그 티켓 괴물들을 처리하세요.'],
        ['PM실 일정 회의', '“이번 주까지 가능하죠?” 꼰대 과장의 일정 압박.'],
        ['DB 서버실 장애', '쿼리가 폭주한 서버실에 AI 자동화 로봇이 오작동합니다.'],
        ['인프라팀 배포 대기', '배포 버튼을 누르기 전, 로봇들이 경로를 막아섭니다.'],
        ['고객사 파견 사무실', '파견지 복사기가 과열되어 토너를 난사합니다.'],
        ['통합 테스트 룸', '테스트 케이스가 좀비처럼 되살아납니다.'],
        ['오픈 D-1 워룸', '오픈 연기를 막으려는 부장님과 워룸 결전.'],
        ['장애 대응 상황실', '새벽 3시 장애 호출. 모든 알림을 끄고 전진하세요.'],
        ['대표실 오픈 승인', '대표이사의 오픈 승인을 받고 드디어 퇴근하세요.']
      ]
    },
    {
      title: '을지로 공기업 본사', subtitle: '결재 도장 7개가 필요한 세계', pool: ['paper', 'copier', 'zombie', 'thief'],
      stages: [
        ['민원실 대기번호', '끝없는 대기번호 호출 사이로 서류가 날아듭니다.'],
        ['총무팀 비품 창고', '비품을 몰래 빼가는 도둑단을 소탕하세요.'],
        ['기획예산처 결재', '예산안 결재를 붙잡는 꼰대 과장과 담판.'],
        ['문서고 기록물 정리', '10년 치 문서가 좀비처럼 되살아났습니다.'],
        ['감사실 자료 제출', '감사 자료를 복사하던 복사기가 폭주합니다.'],
        ['인사팀 평가 시즌', '평가 시즌, 동료들이 모두 좀비가 되었습니다.'],
        ['대강당 행사 준비', '행사 전날 밤, 준비물을 노리는 도둑들을 막으세요.'],
        ['이사회 회의실', '보고서 양식을 트집 잡는 부장님이 등장합니다.'],
        ['부사장실 복도', '결재판을 든 수행비서들을 돌파하세요.'],
        ['사장실 최종 결재', '마지막 결재 도장을 받고 정시 퇴근하세요.']
      ]
    },
    {
      title: '광화문 대기업 본사', subtitle: '보고를 위한 보고의 보고', pool: ['slack', 'robot', 'zombie', 'thief'],
      stages: [
        ['사내 카페 줄서기', '출근 전 커피 전쟁에서 살아남으세요.'],
        ['전략기획실 보고서', '보고서 양식 3종을 동시에 채우는 지옥.'],
        ['해외사업부 화상회의', '시차 회의를 잡는 꼰대 과장을 설득하세요.'],
        ['DT추진팀 AI 도입', 'AI 자동화 로봇이 업무를 대신하겠다며 폭주합니다.'],
        ['홍보실 위기 대응', '실시간으로 쏟아지는 메신저 알림을 차단하세요.'],
        ['구매팀 협력사 미팅', '협력사 선물을 노리는 도둑단이 나타났습니다.'],
        ['법무팀 계약 검토', '계약서를 검토하다 지친 동료들이 좀비가 되었습니다.'],
        ['그룹 전략회의', '분기 실적에 분노한 부장님이 전략회의를 소집합니다.'],
        ['비서실 일정 조율', '회장님 일정을 사수하는 로봇 비서들을 돌파하세요.'],
        ['CEO 집무실', '대기업 CEO의 “하나만 더”를 이겨내고 퇴근하세요.']
      ]
    },
    {
      title: '세종 정부청사', subtitle: '국정감사 시즌, 불이 꺼지지 않는 청사', pool: ['paper', 'copier', 'robot', 'slime'],
      stages: [
        ['통근버스 정류장', '막차 통근버스를 놓치지 않도록 서두르세요.'],
        ['정책실 자료 준비', '국감 자료 요구가 서류 폭풍으로 몰려옵니다.'],
        ['예산실 심의', '예산 심의를 붙잡는 꼰대 과장이 등장합니다.'],
        ['전산정보실 시스템', '행정 시스템 로봇이 오작동하기 시작했습니다.'],
        ['국감 대비 복사실', '복사기 20대가 동시에 과열되었습니다.'],
        ['통계 담당관실', '통계 엑셀이 슬라임처럼 증식합니다.'],
        ['대변인실 브리핑', '브리핑 자료를 지키며 기자실을 통과하세요.'],
        ['장관 보고 대기실', '보고 순서를 뒤집는 부장님과의 결전.'],
        ['차관실 복도', '결재 로봇 경비를 뚫고 장관실로 향하세요.'],
        ['장관실 최종 보고', '장관 보고를 무사히 마치고 청사를 탈출하세요.']
      ]
    },
    {
      title: '해운대 물류센터', subtitle: '택배는 멈추지 않는다, 야근도 멈추지 않는다', pool: ['zombie', 'thief', 'robot', 'slack'],
      stages: [
        ['출고장 컨베이어', '끝없이 밀려오는 상자 사이를 헤쳐 나가세요.'],
        ['분류 로봇 구역', '분류 로봇이 사람까지 분류하려 합니다.'],
        ['재고관리실 실사', '재고 실사를 지휘하는 꼰대 과장이 등장합니다.'],
        ['야간 상하차장', '밤샘 상하차에 지친 좀비 동료들이 몰려옵니다.'],
        ['반품 처리 센터', '반품 상자를 노리는 도둑단을 소탕하세요.'],
        ['배차 관제실', '배차 알림이 1초에 수십 개씩 울립니다.'],
        ['냉동 창고', '얼어붙은 창고에서 로봇들이 오작동합니다.'],
        ['물류 본부 긴급 회의', '배송 지연에 분노한 부장님이 등장합니다.'],
        ['센터장 사무실 앞', '센터장 경호 로봇을 돌파하세요.'],
        ['물류 대표 집무실', '성수기 대표이사를 넘어 퇴근하세요.']
      ]
    },
    {
      title: '송도 글로벌 R&D센터', subtitle: '실험은 끝나지 않고 로봇은 늘어난다', pool: ['robot', 'slime', 'copier', 'zombie'],
      stages: [
        ['연구동 로비', '보안 게이트 로봇들이 출입을 막습니다.'],
        ['실험실 데이터 정리', '실험 데이터 엑셀이 슬라임으로 변했습니다.'],
        ['특허팀 출원 마감', '특허 출원 마감을 쥔 꼰대 과장과 담판.'],
        ['AI 연구소', '학습을 마친 AI 로봇들이 반란을 일으켰습니다.'],
        ['시제품 조립실', '시제품 도면을 출력하던 복사기가 폭주합니다.'],
        ['클린룸', '밤샘 실험에 지친 연구원들이 좀비가 되었습니다.'],
        ['해외 연구진 화상회의', '시차 회의 알림을 차단하며 전진하세요.'],
        ['연구소장 긴급 회의', '성과 압박에 분노한 부장님이 등장합니다.'],
        ['CTO 집무실 복도', 'CTO 비서 로봇 군단을 돌파하세요.'],
        ['CTO 최종 발표', '최종 발표를 통과하고 연구소를 탈출하세요.']
      ]
    },
    {
      title: '그룹 본관 최상층', subtitle: '모든 야근의 근원, 회장실을 향하여', pool: ['paper', 'slime', 'copier', 'slack', 'thief', 'zombie', 'robot'],
      stages: [
        ['본관 1층 로비', '그룹 본관의 모든 업무 괴물이 모였습니다.'],
        ['계열사 합동 회의', '모든 계열사의 슬랙 알림이 동시에 울립니다.'],
        ['그룹 감사실', '그룹 감사를 지휘하는 꼰대 과장이 등장합니다.'],
        ['경영지원 총괄실', '경영지원 문서가 끝없이 복제됩니다.'],
        ['그룹 IT 관제실', '그룹 전체 로봇이 한꺼번에 폭주합니다.'],
        ['임원 전용 라운지', '임원 간식을 노리는 최정예 도둑단.'],
        ['회장 비서실', '회장님 일정을 지키는 좀비 비서진을 돌파하세요.'],
        ['그룹 전략 사령부', '그룹 전략을 쥔 부장님과의 최후의 회의.'],
        ['회장실 대기 복도', '회장실로 향하는 마지막 복도를 돌파하세요.'],
        ['회장실 최종 사직서', '회장님께 사직서를 내고 영원한 칼퇴를 쟁취하세요!']
      ]
    }
  ];

  CHAPTER_DEFS.forEach((def, i) => {
    const ch = i + 2;
    D.CHAPTERS['ch' + ch] = {
      id: 'ch' + ch,
      number: ch,
      title: `제${ch}장: ${def.title}`,
      name: def.title,
      subtitle: def.subtitle,
      stages: def.stages.map(([name, desc], k) => {
        const s = k + 1;
        const boss = BOSS_AT[s] || null;
        // 스테이지별로 챕터 몬스터 중 하나를 주력으로 강조
        const focus = def.pool[k % def.pool.length];
        return {
          id: `${ch}-${s}`,
          name: `${ch}-${s} ${name}`,
          desc,
          duration: BASE_DURATION[k] + (ch - 1) * 8,
          boss,
          bossTime: boss ? Math.round((BASE_DURATION[k] + (ch - 1) * 8) * 0.5) : undefined,
          spawnRate: +(1 + 0.1 * (s - 1) + 0.12 * (ch - 1)).toFixed(2),
          reward: Math.round(BASE_REWARD[k] * (1 + 0.35 * (ch - 1)) / 10) * 10,
          goldReward: Math.round(BASE_REWARD[k] * (1 + 0.35 * (ch - 1)) / 10) * 10,
          monsters: [...def.pool, focus, focus],
          hpMul: +((1 + 0.28 * (ch - 1)) * (1 + 0.2 * (s - 1))).toFixed(2),
          atkMul: +((1 + 0.15 * (ch - 1)) * (1 + 0.08 * (s - 1))).toFixed(2),
          expMul: +(1 + 0.06 * (ch - 1)).toFixed(2),
          eliteChance: +(0.008 * (ch - 1)).toFixed(3),
          icon: icon(THEME_ICON[k])
        };
      })
    };
  });

  // 챕터 1도 스테이지마다 강해짐 (빌드가 다음 스테이지로 이어지므로)
  D.CHAPTERS.ch1.stages.forEach((st, k) => {
    st.hpMul = +(1 + 0.09 * k).toFixed(2);
    st.atkMul = +(1 + 0.05 * k).toFixed(2);
    st.expMul = 1;
    st.eliteChance = k >= 5 ? 0.01 : 0;
  });

  // 몬스터 · 보스 아이콘을 새 몬스터 아트로 (도감 · 목록 공통)
  if (window.MonsterArt) {
    const artIcon = key => (window.MonsterArt.has(key) ? window.MonsterArt.iconHtml(key, 36) : null);
    Object.keys(D.MONSTERS).forEach(key => { D.MONSTERS[key].icon = artIcon(key) || D.MONSTERS[key].icon; });
    D.BESTIARY.forEach(b => { b.icon = artIcon(b.id) || b.icon; });
  }

  // 챕터 1 메타 정보 보강
  D.CHAPTERS.ch1.number = 1;
  D.CHAPTERS.ch1.name = '판교 스타트업 본사';
  D.CHAPTERS.ch1.subtitle = '탕비실부터 대표이사실까지, 10단계 결재선을 돌파하고 퇴근하세요.';
})();
