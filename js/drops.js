// Drops, XP Coffee Beans, Gold Receipts, Magnet Physics & Special Powerups

class DropManager {
  constructor() {
    this.drops = [];
  }

  reset() {
    this.drops = [];
  }

  spawnDrop(x, y, type = 'coffee_bean', value = 10) {
    this.drops.push({
      x: x + (Math.random() * 20 - 10),
      y: y + (Math.random() * 20 - 10),
      type: type, // 'coffee_bean', 'super_coffee', 'receipt', 'aid_kit', 'chest', 'caffeine_bomb', 'magnet_clip'
      value: value,
      radius: (type === 'chest' || type === 'caffeine_bomb' || type === 'magnet_clip') ? 16 : 8,
      isAttracted: false,
      rot: Math.random() * Math.PI * 2
    });
  }

  // 화면 내 모든 드랍 아이템 강제 흡입
  pullAllDrops() {
    this.drops.forEach(d => {
      d.isAttracted = true;
    });
  }

  update(dt, player, effectEngine) {
    const magnetRange = player.stats.magnetRange;

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      const dist = Math.hypot(player.x - d.x, player.y - d.y);

      // 자석 흡입 거리 내 진입 시 플레이어로 고속 가속
      if (dist <= magnetRange || d.isAttracted) {
        d.isAttracted = true;
        const ang = Math.atan2(player.y - d.y, player.x - d.x);
        const pullSpd = 14 * 60 * dt;
        d.x += Math.cos(ang) * pullSpd;
        d.y += Math.sin(ang) * pullSpd;
      }

      // 플레이어 접촉 시 획득
      if (dist <= player.radius + d.radius) {
        if (d.type === 'coffee_bean') {
          player.addExp(d.value);
        } else if (d.type === 'super_coffee') {
          player.addExp(d.value * 5);
        } else if (d.type === 'receipt') {
          const actualGold = Math.floor(d.value * (player.stats.goldMul || 1.0));
          player.gold += actualGold;
          if (window.soundEngine) window.soundEngine.playXP();
          if (effectEngine) effectEngine.spawnFloatingText(player.x, player.y - 20, `+${actualGold} 코인`, '#ffd700');
        } else if (d.type === 'aid_kit') {
          const heal = Math.floor(player.maxHp * 0.35);
          player.hp = Math.min(player.maxHp, player.hp + heal);
          if (window.soundEngine) window.soundEngine.playXP();
          if (effectEngine) {
            effectEngine.spawnFloatingText(player.x, player.y - 25, `+${heal} HP 회복`, '#00ffaa');
            effectEngine.spawnShockwave(player.x, player.y, 45, '#00ffaa');
          }
        } else if (d.type === 'caffeine_bomb') {
          // 카페인 폭탄: 화면 내 모든 일반 몬스터 일괄 처치!
          if (window.soundEngine) window.soundEngine.playHit();
          if (effectEngine) {
            effectEngine.screenShake(12, 0.4);
            effectEngine.spawnShockwave(player.x, player.y, 300, '#ffaa00');
            effectEngine.spawnFloatingText(player.x, player.y - 35, '⚡ 카페인 폭탄 발동!', '#ffaa00');
          }
          if (window.game && window.game.monsterMgr) {
            window.game.monsterMgr.wipeAllNonBosses();
          }
        } else if (d.type === 'magnet_clip') {
          // 자석 클립: 맵 전체 드랍 아이템 즉시 끌어당김
          if (window.soundEngine) window.soundEngine.playXP();
          if (effectEngine) {
            effectEngine.spawnShockwave(player.x, player.y, 120, '#38bdf8');
            effectEngine.spawnFloatingText(player.x, player.y - 30, '🧲 전원 회수 자석!', '#38bdf8');
          }
          this.pullAllDrops();
        } else if (d.type === 'chest') {
          // 보스 상자: 초월 무기 진화 기회 부여!
          if (window.game) {
            window.game.handleChestOpened();
          }
        }

        this.drops.splice(i, 1);
      }
    }
  }

  // 드랍 아이템 렌더링 (순수 캔버스 2D 벡터 아트 - No Emojis!)
  render(ctx, camera) {
    this.drops.forEach(d => {
      const sx = d.x - camera.x;
      const sy = d.y - camera.y;

      ctx.save();
      ctx.translate(sx, sy);

      if (d.type === 'coffee_bean') {
        // 원두 콩 (짙은 에스프레소 브라운 타원 + 중앙 홈)
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 5, d.rot, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.quadraticCurveTo(0, 2, 4, 0);
        ctx.stroke();
      } else if (d.type === 'super_coffee') {
        // 황금 원두 콩 (빛나는 골드 콩)
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 6, d.rot, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.quadraticCurveTo(0, 3, 5, 0);
        ctx.stroke();
      } else if (d.type === 'receipt') {
        // 법인카드 영수증 (하얀 사각형 + 바코드 라인)
        ctx.fillStyle = '#f8fafc';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fillRect(-6, -8, 12, 16);

        ctx.fillStyle = '#64748b';
        ctx.fillRect(-4, -5, 8, 1.5);
        ctx.fillRect(-4, -1, 8, 1.5);
        ctx.fillRect(-4, 3, 5, 1.5);
      } else if (d.type === 'aid_kit') {
        // 구급상자 (초록/하양 크로스)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 8;
        ctx.fillRect(-8, -8, 16, 16);

        ctx.fillStyle = '#10b981';
        ctx.fillRect(-6, -2, 12, 4);
        ctx.fillRect(-2, -6, 4, 12);
      } else if (d.type === 'caffeine_bomb') {
        // 카페인 폭탄 (빛나는 주황 플라스크 캔)
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.roundRect(-9, -12, 18, 24, 6);
        ctx.fill();

        // 번개 마크
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(2, -8);
        ctx.lineTo(-4, 0);
        ctx.lineTo(1, 0);
        ctx.lineTo(-2, 8);
        ctx.lineTo(4, -1);
        ctx.lineTo(-1, -1);
        ctx.closePath();
        ctx.fill();
      } else if (d.type === 'magnet_clip') {
        // 대형 자석 클립 (메탈릭 실버 클립 + 자성 블루 오라)
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-6, 8);
        ctx.lineTo(-6, -6);
        ctx.arc(0, -6, 6, Math.PI, 0);
        ctx.lineTo(6, 6);
        ctx.arc(2, 6, 4, 0, Math.PI);
        ctx.lineTo(-2, -2);
        ctx.stroke();
      } else if (d.type === 'chest') {
        // 보스 황금 서류가방 (Treasure Briefcase)
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.roundRect(-14, -10, 28, 20, 4);
        ctx.fill();

        // 황금 버클
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-4, -2, 8, 6);

        // 손잡이
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -10, 5, Math.PI, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }
}

window.DropManager = DropManager;
