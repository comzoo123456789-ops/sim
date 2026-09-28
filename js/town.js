// Town Hub: Tower Background, Blacksmith, Shop, Dummy, and Dungeon Portal

class TownManager {
  constructor() {
    this.npcs = [
      {
        id: 'portal',
        name: '마계의 탑 차원문',
        title: '던전 입구',
        icon: '🌀',
        x: 400,
        y: 180,
        radius: 36,
        color: '#a044ff'
      },
      {
        id: 'blacksmith',
        name: '대장장이 드워프 브룩',
        title: '강화 / 분해 / 제작',
        icon: '🔨',
        x: 180,
        y: 350,
        radius: 28,
        color: '#e67300'
      },
      {
        id: 'shop',
        name: '상인 엘리아',
        title: '물약 & 장비 상점',
        icon: '⚖️',
        x: 620,
        y: 350,
        radius: 28,
        color: '#2eb85c'
      },
      {
        id: 'dummy',
        name: '훈련용 허수아비',
        title: 'DPS 측정기',
        icon: '🪵',
        x: 400,
        y: 520,
        radius: 26,
        color: '#a67c52',
        isDummy: true
      },
      {
        id: 'mercenary',
        name: '용병 단장 가릭',
        title: '차원 용병 길드',
        icon: '🤝',
        x: 180,
        y: 520,
        radius: 28,
        color: '#ffd700'
      },
      {
        id: 'research',
        name: '수석 연구원 메이슨',
        title: '기지 연구소',
        icon: '🏛️',
        x: 620,
        y: 520,
        radius: 28,
        color: '#00f0ff'
      }
    ];

    // 허수아비 DPS 측정 데이터
    this.dummyData = {
      totalDamage: 0,
      hitCount: 0,
      startTime: null,
      lastHitTime: 0,
      dps: 0
    };

    // POE & 디아블로 스타일 다크 판타지 전초기지 풀 월드 맵 텍스처
    this.townMapImg = new Image();
    this.townMapImg.src = 'assets/town/town_map_poe.jpg';
  }

  // 허수아비 타격 시 DPS 계산
  hitDummy(damage) {
    const now = Date.now();
    if (!this.dummyData.startTime || now - this.dummyData.lastHitTime > 4000) {
      this.dummyData.totalDamage = 0;
      this.dummyData.hitCount = 0;
      this.dummyData.startTime = now;
    }
    this.dummyData.totalDamage += damage;
    this.dummyData.hitCount++;
    this.dummyData.lastHitTime = now;

    const elapsed = Math.max(0.5, (now - this.dummyData.startTime) / 1000);
    this.dummyData.dps = Math.floor(this.dummyData.totalDamage / elapsed);
  }

  // 마을 배경 렌더링 (원경의 거대한 마계 탑과 디아블로/POE 스타일 전초기지 전체 맵)
  renderBackground(ctx, width, height, camera) {
    ctx.save();

    const isPeace = window.game && window.game.player && window.game.player.isTowerDestroyed;

    // 1. 다크 판타지 외계 행성 하늘 & 배경
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (isPeace) {
      skyGrad.addColorStop(0, '#0a2342');
      skyGrad.addColorStop(0.35, '#194b75');
      skyGrad.addColorStop(1, '#0e0b14');
    } else {
      skyGrad.addColorStop(0, '#0d0714');
      skyGrad.addColorStop(0.35, '#1a0d26');
      skyGrad.addColorStop(1, '#07050a');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. 별빛 성운 패럴랙스
    ctx.fillStyle = isPeace ? 'rgba(255, 235, 170, 0.7)' : 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 35; i++) {
      const bx = ((i * 73) - camera.x * 0.05) % width;
      const by = (i * 37) % (height * 0.38);
      const px = bx < 0 ? bx + width : bx;
      ctx.fillRect(px, by, (i % 2) + 1, (i % 2) + 1);
    }

    // 3. 지평선 너머 100층 "마계의 탑"
    const towerCenterX = 400 - camera.x * 0.15;
    const towerBaseY = height * 0.32;
    const towerWidth = 140;

    if (isPeace) {
      const peaceBeam = ctx.createLinearGradient(towerCenterX, 0, towerCenterX, towerBaseY);
      peaceBeam.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
      peaceBeam.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = peaceBeam;
      ctx.fillRect(towerCenterX - 50, 0, 100, towerBaseY);

      ctx.fillStyle = '#0a0a14';
      ctx.beginPath();
      ctx.moveTo(towerCenterX - towerWidth * 0.55, towerBaseY);
      ctx.lineTo(towerCenterX - towerWidth * 0.25, towerBaseY - 50);
      ctx.lineTo(towerCenterX - 10, towerBaseY - 30);
      ctx.lineTo(towerCenterX + 25, towerBaseY - 65);
      ctx.lineTo(towerCenterX + towerWidth * 0.45, towerBaseY);
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 12px "Cinzel", serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText('🕊️ 마탑 붕괴 - 행성의 평화 회복', towerCenterX, towerBaseY - 80);
    } else {
      const beamGrad = ctx.createLinearGradient(towerCenterX, 0, towerCenterX, towerBaseY);
      beamGrad.addColorStop(0, 'rgba(180, 50, 255, 0.35)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(towerCenterX - 35, 0, 70, towerBaseY);

      ctx.fillStyle = '#08040d';
      ctx.beginPath();
      ctx.moveTo(towerCenterX - towerWidth * 0.5, towerBaseY);
      ctx.lineTo(towerCenterX - towerWidth * 0.15, 20);
      ctx.lineTo(towerCenterX + towerWidth * 0.15, 20);
      ctx.lineTo(towerCenterX + towerWidth * 0.5, towerBaseY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 60, 80, 0.65)';
      ctx.lineWidth = 1.5;
      for (let f = 1; f < 8; f++) {
        const fy = towerBaseY - f * 20;
        const halfW = (towerWidth * 0.5) * (1 - (f / 10));
        ctx.beginPath();
        ctx.moveTo(towerCenterX - halfW + 4, fy);
        ctx.lineTo(towerCenterX + halfW - 4, fy);
        ctx.stroke();
      }
    }

    // 4. [POE & 디아블로 스타일 전체 맵] 사각형 필드 전체를 덮는 다크 판타지 고딕 전초기지 맵 (원형 'O' 클리핑 완전 제거!)
    const mapOriginX = -camera.x - 100;
    const mapOriginY = -camera.y - 40;
    const mapW = 1000;
    const mapH = 680;

    if (this.townMapImg && this.townMapImg.complete && this.townMapImg.naturalWidth > 0) {
      ctx.drawImage(this.townMapImg, mapOriginX, mapOriginY, mapW, mapH);

      // 전체 월드 다크 판타지 비네팅 및 안개 조명 오버레이
      const vigGrad = ctx.createRadialGradient(400 - camera.x, 380 - camera.y, 250, 400 - camera.x, 380 - camera.y, 550);
      vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vigGrad.addColorStop(0.65, 'rgba(5, 3, 10, 0.45)');
      vigGrad.addColorStop(1, 'rgba(4, 2, 8, 0.95)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#181220';
      ctx.fillRect(mapOriginX, mapOriginY, mapW, mapH);
    }

    ctx.restore();
  }

  // 마을 NPC 및 허수아비 렌더링 (원형 이모지 버튼 제거 -> 다크 판타지 인터랙티브 스테이션 & 비겹침 스마트 배지)
  renderNPCs(ctx, camera, player = null) {
    const curPlayer = player || (window.game && window.game.player);

    this.npcs.forEach(npc => {
      const sx = npc.x - camera.x;
      const sy = npc.y - camera.y;
      const dist = curPlayer ? Math.hypot(curPlayer.x - npc.x, curPlayer.y - npc.y) : 999;
      const isNearby = dist <= 110;

      ctx.save();

      // 1. 발 밑 은은한 다크 룬 링
      const ringColor = npc.id === 'portal' ? 'rgba(160, 68, 255, 0.65)'
        : npc.id === 'blacksmith' ? 'rgba(230, 115, 0, 0.65)'
        : npc.id === 'shop' ? 'rgba(46, 184, 92, 0.65)'
        : npc.id === 'research' ? 'rgba(0, 240, 255, 0.65)'
        : npc.id === 'mercenary' ? 'rgba(255, 215, 0, 0.65)'
        : 'rgba(166, 124, 82, 0.65)';

      const time = Date.now() * 0.003;
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = isNearby ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 12, npc.radius * 0.9, npc.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. 오브젝트별 전용 다크 판타지 비주얼
      if (npc.id === 'portal') {
        // 차원 포털: 소용돌이치는 보랏빛 심연 보텍스
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(time);
        const pGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, npc.radius);
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.35, '#8b00ff');
        pGrad.addColorStop(0.7, '#ff0077');
        pGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(0, 0, npc.radius + Math.sin(time * 3) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (npc.id === 'blacksmith') {
        // 대장장이 모루와 붉은 불꽃
        ctx.fillStyle = '#2d2218';
        ctx.beginPath();
        ctx.roundRect(sx - 16, sy - 10, 32, 22, 4);
        ctx.fill();
        ctx.strokeStyle = '#e67300';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔨', sx, sy);
      } else if (npc.id === 'shop') {
        // 상인 진열대
        ctx.fillStyle = '#162b1e';
        ctx.beginPath();
        ctx.roundRect(sx - 16, sy - 10, 32, 22, 4);
        ctx.fill();
        ctx.strokeStyle = '#2eb85c';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚖️', sx, sy);
      } else if (npc.id === 'dummy') {
        // 훈련용 허수아비
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(sx - 4, sy - 16, 8, 28);
        ctx.fillStyle = '#8b5a2b';
        ctx.beginPath();
        ctx.arc(sx, sy - 6, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎯', sx, sy - 6);
      } else if (npc.id === 'mercenary') {
        // 용병 길드
        ctx.fillStyle = '#2e2511';
        ctx.beginPath();
        ctx.roundRect(sx - 16, sy - 10, 32, 22, 4);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🤝', sx, sy);
      } else if (npc.id === 'research') {
        // 연구소
        ctx.fillStyle = '#0f2733';
        ctx.beginPath();
        ctx.roundRect(sx - 16, sy - 10, 32, 22, 4);
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏛️', sx, sy);
      }

      // 3. 네임태그: 깔끔하고 세련된 다크 판타지 배지 (화면 겹침 완전 해결!)
      const badgeY = sy - npc.radius - 12;
      ctx.font = 'bold 12px "Cinzel", "Rajdhani", sans-serif';
      const nameW = ctx.measureText(npc.name).width;

      ctx.fillStyle = 'rgba(10, 6, 16, 0.85)';
      ctx.strokeStyle = isNearby ? ringColor : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = isNearby ? 1.5 : 1;
      ctx.beginPath();
      ctx.roundRect(sx - nameW/2 - 8, badgeY - 14, nameW + 16, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isNearby ? '#ffd700' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(npc.name, sx, badgeY - 5);

      // 근접 시에만 상호작용 단축키 가이드 표시 ([E] 상호작용)
      if (isNearby) {
        ctx.font = 'bold 11px "Rajdhani", sans-serif';
        const guideText = npc.id === 'portal' ? '[E] 마계의 탑 입장' : `[E] ${npc.title}`;
        const gW = ctx.measureText(guideText).width;

        ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
        ctx.beginPath();
        ctx.roundRect(sx - gW/2 - 6, badgeY - 32, gW + 12, 16, 3);
        ctx.fill();

        ctx.fillStyle = '#0a0512';
        ctx.fillText(guideText, sx, badgeY - 24);
      }

      // 허수아비 DPS 박스
      if (npc.isDummy && this.dummyData.totalDamage > 0) {
        ctx.fillStyle = 'rgba(12, 7, 20, 0.9)';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(sx - 75, sy + 28, 150, 42, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff4455';
        ctx.font = 'bold 12px "Rajdhani", sans-serif';
        ctx.fillText(`DPS: ${this.dummyData.dps.toLocaleString()}`, sx, sy + 42);

        ctx.fillStyle = '#cfc0e6';
        ctx.font = '10px "Rajdhani", sans-serif';
        ctx.fillText(`누적: ${this.dummyData.totalDamage.toLocaleString()} (${this.dummyData.hitCount}타)`, sx, sy + 58);
      }

      ctx.restore();
    });
  }

  // NPC 상호작용 검사
  checkInteraction(player) {
    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
      if (dist <= npc.radius + 35) {
        return npc;
      }
    }
    return null;
  }
}

window.townMgr = new TownManager();
