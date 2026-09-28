// Visual Particle, Boss Telegraphed Attack Zones, & Special FX Engine

class EffectManager {
  constructor() {
    this.particles = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.areaEffects = [];
    this.warningZones = []; // 보스 장판 전조 경고 구역들!
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.critVignetteTimer = 0; // 치명타 화면 테두리 플래시
    this.bossWarning = { active: false, timer: 0, title: '', subtitle: '', color: '#ff3344' };
    this.floorTransition = { active: false, progress: 0, text: '', callback: null };
  }

  screenShake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeTime = duration;
  }

  triggerCritFlash() {
    this.critVignetteTimer = 0.2;
  }

  triggerBossWarning(title, subtitle, color = '#ff2a2a') {
    this.bossWarning = {
      active: true,
      timer: 2.8,
      title: title,
      subtitle: subtitle,
      color: color
    };
    if (window.soundMgr) window.soundMgr.playBossWarning();
    this.screenShake(10, 0.6);
  }

  triggerFloorTransition(nextFloor, callback) {
    this.floorTransition = {
      active: true,
      progress: 0,
      text: `${nextFloor}층으로 진입 중...`,
      callback: callback
    };
  }

  // 보스 전조 장판 등록 (1.2초 후 폭발)
  addWarningZone(x, y, radius, duration, onExplode, shape = 'circle', angle = 0, length = 0) {
    this.warningZones.push({
      x: x,
      y: y,
      radius: radius,
      shape: shape,
      angle: angle,
      length: length,
      duration: duration,
      maxDuration: duration,
      onExplode: onExplode
    });
  }

  addFloatingText(x, y, text, type = 'normal') {
    let color = '#ffffff';
    let size = 16;
    let weight = 'normal';

    if (type === 'crit') {
      color = '#ffd700';
      size = 24;
      weight = '900';
      this.triggerCritFlash();
    } else if (type === 'player_hit') {
      color = '#ff3344';
      size = 19;
      weight = 'bold';
    } else if (type === 'heal') {
      color = '#00ffaa';
      size = 18;
      weight = 'bold';
    } else if (type === 'evade') {
      color = '#00f0ff';
      size = 17;
      weight = '900';
    } else if (type === 'exp') {
      color = '#b800ff';
      size = 15;
    }

    this.floatingTexts.push({
      x: x + (Math.random() * 20 - 10),
      y: y - 10,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -2.4 - Math.random() * 0.8,
      text: text,
      color: color,
      size: size,
      weight: weight,
      life: 0.85,
      maxLife: 0.85
    });
  }

  addDashGhost(x, y, radius, color = 'rgba(0, 240, 255, 0.6)') {
    this.particles.push({
      type: 'ghost',
      x: x,
      y: y,
      radius: radius,
      color: color,
      life: 0.28,
      maxLife: 0.28
    });
  }

  // 투사체들
  spawnFireball(x, y, targetX, targetY, damage, isPlayer = true) {
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = 7.5;
    this.projectiles.push({
      type: 'fireball',
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: angle,
      damage: damage,
      radius: 13,
      life: 2.2,
      isPlayer: isPlayer,
      trailTimer: 0
    });
    if (window.soundMgr) window.soundMgr.playFireball();
  }

  spawnCrescentBlade(x, y, targetX, targetY, damage) {
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = 8.5;
    this.projectiles.push({
      type: 'crescent_blade',
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: angle,
      damage: damage,
      radius: 26,
      life: 1.6,
      isPlayer: true
    });
    if (window.soundMgr) window.soundMgr.playSwordWave();
  }

  spawnPoisonBomb(x, y, targetX, targetY, damage) {
    const angle = Math.atan2(targetY - y, targetX - x);
    const dist = Math.min(240, Math.hypot(targetX - x, targetY - y));
    const flightTime = 0.35;
    this.projectiles.push({
      type: 'poison_bomb',
      x: x,
      y: y,
      startX: x,
      startY: y,
      targetX: x + Math.cos(angle) * dist,
      targetY: y + Math.sin(angle) * dist,
      damage: damage,
      life: flightTime,
      totalTime: flightTime,
      isPlayer: true
    });
    if (window.soundMgr) window.soundMgr.playDaggerSlash();
  }

  spawnChiBlast(x, y, targetX, targetY, damage) {
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = 9.0;
    this.projectiles.push({
      type: 'chi_blast',
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: angle,
      damage: damage,
      radius: 17,
      life: 1.8,
      isPlayer: true
    });
    if (window.soundMgr) window.soundMgr.playChiBlast();
  }

  spawnSlashArc(x, y, angle, radius = 50, color = '#ffffff') {
    this.particles.push({
      type: 'slash_arc',
      x: x,
      y: y,
      angle: angle,
      radius: radius,
      color: color,
      life: 0.18,
      maxLife: 0.18
    });
    if (window.soundMgr) window.soundMgr.playSwordSlash();
  }

  spawnEarthShatter(x, y, angle, damage) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const dist = 30 + i * 28;
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;
      setTimeout(() => {
        this.addShockwave(px, py, 34, '#d47b2c');
        this.spawnSparks(px, py, 14, '#ffaa44');
      }, i * 40);
    }
    if (window.soundMgr) window.soundMgr.playSwordWave();
  }

  spawnFrostNova(x, y, radius = 95) {
    this.addShockwave(x, y, radius, '#77ddff');
    for (let i = 0; i < 16; i++) {
      const ang = (Math.PI * 2 / 16) * i;
      this.particles.push({
        type: 'ice_spike',
        x: x + Math.cos(ang) * (radius * 0.7),
        y: y + Math.sin(ang) * (radius * 0.7),
        vx: Math.cos(ang) * 1.5,
        vy: Math.sin(ang) * 1.5,
        color: '#aae8ff',
        size: 8,
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  spawnPoisonStars(x, y, damage) {
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 / 8) * i;
      const speed = 7.0;
      this.projectiles.push({
        type: 'shuriken',
        x: x,
        y: y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        angle: ang,
        damage: damage,
        radius: 10,
        life: 1.2,
        isPlayer: true
      });
    }
    if (window.soundMgr) window.soundMgr.playDaggerSlash();
  }

  spawnLionRoar(x, y, radius = 90) {
    this.addShockwave(x, y, radius, '#ffd700');
    this.addShockwave(x, y, radius * 1.3, '#ffffff');
    this.screenShake(7, 0.3);
  }

  spawnMeteor(targetX, targetY, damage, isPlayer = true) {
    const startX = targetX - 160;
    const startY = targetY - 240;
    this.projectiles.push({
      type: 'meteor',
      x: startX,
      y: startY,
      targetX: targetX,
      targetY: targetY,
      damage: damage,
      radius: 30,
      speed: 13,
      life: 1.6,
      isPlayer: isPlayer
    });
  }

  createLaser(x1, y1, x2, y2, color = '#00f0ff', duration = 0.25) {
    this.particles.push({
      type: 'laser',
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      color: color,
      life: duration,
      maxLife: duration
    });
  }

  createProjectile(opts) {
    this.projectiles.push({
      type: opts.type || 'fireball',
      x: opts.x,
      y: opts.y,
      vx: opts.vx || 0,
      vy: opts.vy || 0,
      damage: opts.dmg || 50,
      radius: opts.radius || 12,
      color: opts.color || '#ff4400',
      life: opts.duration || 2.0,
      isPlayer: true
    });
  }

  addShockwave(x, y, maxRadius, color = '#ffffff') {
    this.particles.push({
      type: 'shockwave',
      x: x,
      y: y,
      radius: 4,
      maxRadius: maxRadius,
      color: color,
      life: 0.35,
      maxLife: 0.35
    });
  }

  spawnSparks(x, y, count = 8, color = '#ffd700') {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4;
      this.particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: color,
        size: 2 + Math.random() * 3,
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.4
      });
    }
  }

  spawnPoisonCloudArea(x, y, radius = 75, duration = 4.0, damagePerTick = 15) {
    this.areaEffects.push({
      type: 'poison_cloud',
      x: x,
      y: y,
      radius: radius,
      duration: duration,
      damage: damagePerTick,
      tickTimer: 0,
      color: '#44dd44'
    });
    if (window.soundMgr) window.soundMgr.playPoisonMist();
  }

  // 매 프레임 업데이트
  update(dt, enemies, player) {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) this.shakeIntensity = 0;
    }

    if (this.critVignetteTimer > 0) {
      this.critVignetteTimer -= dt;
    }

    if (this.bossWarning.active) {
      this.bossWarning.timer -= dt;
      if (this.bossWarning.timer <= 0) this.bossWarning.active = false;
    }

    if (this.floorTransition.active) {
      this.floorTransition.progress += dt * 1.5;
      if (this.floorTransition.progress >= 1.0 && this.floorTransition.callback) {
        const cb = this.floorTransition.callback;
        this.floorTransition.callback = null;
        cb();
      }
      if (this.floorTransition.progress >= 2.0) {
        this.floorTransition.active = false;
      }
    }

    // 보스 전조 장판 카운트다운 & 폭발
    for (let i = this.warningZones.length - 1; i >= 0; i--) {
      const wz = this.warningZones[i];
      wz.duration -= dt;
      if (wz.duration <= 0) {
        if (wz.onExplode) wz.onExplode();
        this.warningZones.splice(i, 1);
      }
    }

    // 파티클 & 텍스트 메모리 최적화 및 60fps 유지
    if (this.particles.length > 250) this.particles.splice(0, this.particles.length - 250);
    if (this.floatingTexts.length > 50) this.floatingTexts.splice(0, this.floatingTexts.length - 50);

    // 1. 파티클
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.vx !== undefined) p.x += p.vx;
      if (p.vy !== undefined) p.y += p.vy;
      if (p.type === 'shockwave') {
        const prog = 1 - (p.life / p.maxLife);
        p.radius = prog * p.maxRadius;
      }
    }

    // 2. 투사체
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      if (pr.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.type === 'fireball' || pr.type === 'crescent_blade' || pr.type === 'chi_blast' || pr.type === 'shuriken') {
        pr.x += pr.vx;
        pr.y += pr.vy;
      } else if (pr.type === 'poison_bomb') {
        const t = 1 - (pr.life / pr.totalTime);
        pr.x = pr.startX + (pr.targetX - pr.startX) * t;
        pr.y = pr.startY + (pr.targetY - pr.startY) * t - Math.sin(t * Math.PI) * 45;
        if (t >= 0.98) {
          this.spawnPoisonCloudArea(pr.targetX, pr.targetY, 75, 4.5, pr.damage * 0.3);
          this.spawnSparks(pr.targetX, pr.targetY, 16, '#33ff33');
          this.projectiles.splice(i, 1);
          continue;
        }
      } else if (pr.type === 'meteor') {
        const dx = pr.targetX - pr.x;
        const dy = pr.targetY - pr.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 15) {
          this.screenShake(12, 0.5);
          this.addShockwave(pr.targetX, pr.targetY, 140, '#ff3300');
          this.spawnSparks(pr.targetX, pr.targetY, 40, '#ffbb22');

          if (pr.isPlayer && enemies) {
            enemies.forEach(en => {
              if (en.isAlive && Math.hypot(en.x - pr.targetX, en.y - pr.targetY) <= 140) {
                en.takeDamage(pr.damage, true);
              }
            });
          } else if (!pr.isPlayer && player) {
            if (Math.hypot(player.x - pr.targetX, player.y - pr.targetY) <= 140) {
              player.takeDamage(pr.damage);
            }
          }
          this.projectiles.splice(i, 1);
          continue;
        } else {
          pr.x += (dx / dist) * pr.speed;
          pr.y += (dy / dist) * pr.speed;
        }
      }

      // 플레이어 투사체 -> 적 충돌
      if (pr.isPlayer && enemies && enemies.length > 0) {
        let hit = false;
        for (let j = 0; j < enemies.length; j++) {
          const en = enemies[j];
          if (!en.isAlive) continue;
          const d = Math.hypot(en.x - pr.x, en.y - pr.y);
          if (d <= (pr.radius + (en.radius || 18))) {
            hit = true;
            en.takeDamage(pr.damage);
            this.spawnSparks(en.x, en.y, 10, '#ffd700');
            break;
          }
        }
        if (hit && pr.type !== 'crescent_blade') {
          this.projectiles.splice(i, 1);
        }
      }

      // 보스 투사체 -> 플레이어 충돌
      if (!pr.isPlayer && player) {
        const d = Math.hypot(player.x - pr.x, player.y - pr.y);
        if (d <= (pr.radius + player.radius)) {
          player.takeDamage(pr.damage);
          this.spawnSparks(player.x, player.y, 12, '#ff3300');
          this.projectiles.splice(i, 1);
        }
      }
    }

    // 3. 장판 (독구름)
    for (let i = this.areaEffects.length - 1; i >= 0; i--) {
      const area = this.areaEffects[i];
      area.duration -= dt;
      if (area.duration <= 0) {
        this.areaEffects.splice(i, 1);
        continue;
      }
      area.tickTimer += dt;
      if (area.tickTimer >= 0.5) {
        area.tickTimer = 0;
        if (enemies) {
          enemies.forEach(en => {
            if (en.isAlive && Math.hypot(en.x - area.x, en.y - area.y) <= area.radius) {
              en.takeDamage(area.damage, false, true);
            }
          });
        }
      }
    }

    // 4. 플로팅 텍스트
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.x += ft.vx;
      ft.y += ft.vy;
      ft.vy += 1.8 * dt;
    }
  }

  // 렌더링
  render(ctx, camera) {
    ctx.save();

    // 0. 보스 경고 장판 (Telegraphed Attack Zones)
    this.warningZones.forEach(wz => {
      const sx = wz.x - camera.x;
      const sy = wz.y - camera.y;
      const prog = 1 - (wz.duration / wz.maxDuration); // 0 -> 1

      ctx.save();
      if (wz.shape === 'circle') {
        // 외곽 붉은 경고 링
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 30, 60, 0.85)';
        ctx.lineWidth = 3;
        ctx.arc(sx, sy, wz.radius, 0, Math.PI * 2);
        ctx.stroke();

        // 안쪽에서 차오르는 경고 채우기
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 30, 60, 0.35)';
        ctx.arc(sx, sy, wz.radius * prog, 0, Math.PI * 2);
        ctx.fill();
      } else if (wz.shape === 'cone') {
        // 부채꼴 브레스 장판 (90도)
        ctx.translate(sx, sy);
        ctx.rotate(wz.angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, wz.radius, -Math.PI * 0.25, Math.PI * 0.25);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 60, 20, 0.85)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, wz.radius * prog, -Math.PI * 0.25, Math.PI * 0.25);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 60, 20, 0.4)';
        ctx.fill();
      }
      ctx.restore();
    });

    // 1. 장판
    this.areaEffects.forEach(area => {
      const sx = area.x - camera.x;
      const sy = area.y - camera.y;
      ctx.beginPath();
      const grad = ctx.createRadialGradient(sx, sy, 5, sx, sy, area.radius);
      grad.addColorStop(0, 'rgba(60, 240, 70, 0.35)');
      grad.addColorStop(0.7, 'rgba(40, 180, 50, 0.2)');
      grad.addColorStop(1, 'rgba(20, 120, 30, 0)');
      ctx.fillStyle = grad;
      ctx.arc(sx, sy, area.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. 파티클
    this.particles.forEach(p => {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      const alpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'ghost') {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.45;
        ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shockwave') {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'slash_arc') {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(p.angle);
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.arc(0, 0, p.radius, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'spark' || p.type === 'ice_spike') {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.arc(sx, sy, p.size || 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'laser') {
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 4 * alpha);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(p.x1 - camera.x, p.y1 - camera.y);
        ctx.lineTo(p.x2 - camera.x, p.y2 - camera.y);
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1.0;
    });

    // 3. 투사체
    this.projectiles.forEach(pr => {
      const sx = pr.x - camera.x;
      const sy = pr.y - camera.y;

      if (pr.type === 'fireball') {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(pr.angle);
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, pr.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#ffcc00');
        grad.addColorStop(0.8, '#ff4400');
        grad.addColorStop(1, 'rgba(255, 60, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (pr.type === 'crescent_blade') {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(pr.angle);
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#e6ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;
        ctx.arc(0, 0, pr.radius, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        ctx.restore();
      } else if (pr.type === 'chi_blast') {
        ctx.save();
        ctx.translate(sx, sy);
        const grad = ctx.createRadialGradient(0, 0, 3, 0, 0, pr.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#66ccff');
        grad.addColorStop(0.9, '#0066ff');
        grad.addColorStop(1, 'rgba(0, 102, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (pr.type === 'shuriken') {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(Date.now() * 0.02);
        ctx.fillStyle = '#33cc55';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.restore();
      } else if (pr.type === 'meteor') {
        ctx.save();
        ctx.translate(sx, sy);
        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, pr.radius);
        grad.addColorStop(0, '#ffffaa');
        grad.addColorStop(0.4, '#ff6600');
        grad.addColorStop(0.9, '#990000');
        grad.addColorStop(1, 'rgba(150, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // 4. 플로팅 텍스트
    this.floatingTexts.forEach(ft => {
      const sx = ft.x - camera.x;
      const sy = ft.y - camera.y;
      const alpha = Math.max(0, ft.life / ft.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${ft.weight} ${ft.size}px 'Rajdhani', sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, sx, sy);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, sx, sy);
      ctx.restore();
    });

    ctx.restore();
  }

  renderOverlay(ctx, width, height) {
    // 치명타 적중 시 화면 테두리 골드 비네팅 플래시
    if (this.critVignetteTimer > 0) {
      ctx.save();
      const alpha = this.critVignetteTimer / 0.2;
      const vigGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.7);
      vigGrad.addColorStop(0, 'rgba(255, 215, 0, 0)');
      vigGrad.addColorStop(1, `rgba(255, 215, 0, ${alpha * 0.35})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    if (this.bossWarning.active) {
      ctx.save();
      ctx.fillStyle = `rgba(180, 0, 0, ${0.35 * Math.sin(Date.now() * 0.015) + 0.35})`;
      ctx.fillRect(0, height * 0.22, width, 110);

      ctx.font = '900 32px "Cinzel", serif';
      ctx.fillStyle = this.bossWarning.color;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.strokeText('⚠️ WARNING: 구역 보스 출현! ⚠️', width / 2, height * 0.22 + 42);
      ctx.fillText('⚠️ WARNING: 구역 보스 출현! ⚠️', width / 2, height * 0.22 + 42);

      ctx.font = 'bold 22px "Rajdhani", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.strokeText(`[${this.bossWarning.title}] ${this.bossWarning.subtitle}`, width / 2, height * 0.22 + 82);
      ctx.fillText(`[${this.bossWarning.title}] ${this.bossWarning.subtitle}`, width / 2, height * 0.22 + 82);
      ctx.restore();
    }

    if (this.floorTransition.active) {
      ctx.save();
      const p = this.floorTransition.progress;
      let alpha = p <= 1.0 ? p : 2.0 - p;
      ctx.fillStyle = `rgba(7, 3, 13, ${Math.min(1, Math.max(0, alpha))})`;
      ctx.fillRect(0, 0, width, height);

      if (alpha > 0.4) {
        ctx.font = 'bold 30px "Cinzel", serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(this.floorTransition.text, width / 2, height / 2);
      }
      ctx.restore();
    }
  }
}

window.effectMgr = new EffectManager();
