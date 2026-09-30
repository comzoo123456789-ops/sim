// Office Escape Survivor - 몬스터 아트 ("사무실에 깃든 괴물들")
// 모든 몬스터 · 보스를 같은 카툰 톤(굵은 외곽선 + 셀 음영)으로 시작 시 한 번 그려 캐시한다.
// 프레임마다 오프스크린 캔버스를 만들고, 피격 플래시용 흰 실루엣도 함께 굽는다.

(function () {
  const OL = '#1c1433';      // 외곽선
  const LW = 5;              // 기준 외곽선 두께 (원본 해상도 기준)
  const FRAMES = 4;

  // 원본 캔버스 크기와 발 위치 (발 = 그림자 중심)
  const BOX = { mob: { w: 170, h: 170, fx: 85, fy: 150, body: 130 }, boss: { w: 260, h: 280, fx: 130, fy: 262, body: 230 } };

  // ---------- 그리기 도우미 ----------
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
  function ink(ctx, fill, lw = LW) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.lineWidth = lw;
    ctx.strokeStyle = OL;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  // 현재 경로 안쪽에만 그리기 (음영 · 하이라이트)
  function inside(ctx, drawPath, fn) {
    ctx.save();
    drawPath();
    ctx.clip();
    fn();
    ctx.restore();
  }
  function line(ctx, x1, y1, x2, y2, color = OL, lw = LW) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  function ellipse(ctx, x, y, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  }
  // 화난 눈: 흰자 + 동공 + 안쪽으로 기운 눈썹
  function angryEye(ctx, x, y, r, dir, opts = {}) {
    ellipse(ctx, x, y, r, r * 1.08);
    ink(ctx, opts.white || '#ffffff', 3.5);
    ellipse(ctx, x + dir * r * 0.18, y + r * 0.22, r * 0.52, r * 0.58);
    ctx.fillStyle = opts.pupil || '#161022';
    ctx.fill();
    ellipse(ctx, x + dir * r * 0.05 - r * 0.12, y, r * 0.17, r * 0.17);
    ctx.fillStyle = '#fff';
    ctx.fill();
    if (opts.brow !== false) {
      // 눈썹: 바깥이 높고 안쪽(얼굴 중심)이 낮다
      const bx = x, by = y - r * 1.05;
      ctx.beginPath();
      ctx.moveTo(bx - dir * r * 1.1, by - r * 0.45);
      ctx.lineTo(bx + dir * r * 0.9, by + r * 0.25);
      ctx.strokeStyle = opts.browColor || OL;
      ctx.lineWidth = opts.browW || r * 0.55;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  // 빛나는 빨간 눈 (홀린 사무용품)
  function glowEye(ctx, x, y, r, dir, color = '#ff3b3b') {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = r * 2.2;
    ctx.beginPath();
    ctx.moveTo(x - dir * r * 1.1, y - r * 0.55);
    ctx.lineTo(x + dir * r * 1.0, y + r * 0.1);
    ctx.lineTo(x - dir * r * 0.9, y + r * 0.6);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(x - dir * r * 1.1, y - r * 0.55);
    ctx.lineTo(x + dir * r * 1.0, y + r * 0.1);
    ctx.lineTo(x - dir * r * 0.9, y + r * 0.6);
    ctx.closePath();
    ink(ctx, null, 2.5);
    ellipse(ctx, x - dir * r * 0.35, y + r * 0.02, r * 0.22, r * 0.22);
    ctx.fillStyle = '#fff6f6';
    ctx.fill();
  }
  function mouthGrr(ctx, x, y, w, h, open = 0) {
    rr(ctx, x - w / 2, y - h / 2, w, h + open, h * 0.45);
    ink(ctx, '#3b0d1a', 3.5);
    // 이빨
    ctx.fillStyle = '#fff';
    const n = Math.max(3, Math.round(w / 9));
    for (let i = 0; i < n; i++) {
      const tx = x - w / 2 + 3 + (i + 0.5) * ((w - 6) / n);
      ctx.beginPath();
      ctx.moveTo(tx - (w - 6) / n / 2 + 0.5, y - h / 2 + 2);
      ctx.lineTo(tx + (w - 6) / n / 2 - 0.5, y - h / 2 + 2);
      ctx.lineTo(tx, y - h / 2 + h * 0.5);
      ctx.fill();
    }
  }
  function legs(ctx, x, y, gap, len, t, color, shoe = OL, w = 11) {
    const sw = Math.sin(t) * len * 0.35;
    [[-1, sw], [1, -sw]].forEach(([side, off]) => {
      const lx = x + side * gap;
      rr(ctx, lx - w / 2 + off * 0.35, y - 2, w, len, w / 2);
      ink(ctx, color, 4);
      ellipse(ctx, lx + off * 0.6 + side * 3, y + len - 1, w * 0.85, w * 0.5);
      ink(ctx, shoe, 3.5);
    });
  }
  function arm(ctx, x1, y1, x2, y2, color, w = 10, hand = null) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL;
    ctx.lineWidth = w + 7;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.stroke();
    if (hand) {
      ellipse(ctx, x2, y2, w * 0.72, w * 0.72);
      ink(ctx, hand, 3.5);
    }
  }
  function sweat(ctx, x, y, s = 1) {
    ctx.beginPath();
    ctx.moveTo(x, y - 7 * s);
    ctx.quadraticCurveTo(x + 5 * s, y + 1 * s, x, y + 4 * s);
    ctx.quadraticCurveTo(x - 5 * s, y + 1 * s, x, y - 7 * s);
    ink(ctx, '#7dd3fc', 2.5);
  }
  // 좌우 반전 프레임을 구울 때도 글자는 정방향으로 쓴다
  let mirror = 1;
  function text(ctx, str, x, y, size, color, weight = 900, align = 'center') {
    if (mirror < 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      mirror = 1;
      text(ctx, str, 0, 0, size, color, weight, align);
      mirror = -1;
      ctx.restore();
      return;
    }
    ctx.font = `${weight} ${size}px Pretendard, 'Malgun Gothic', sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  // ---------- 몬스터 7종 (원점 = 발, 위가 -y) ----------
  const ART = {};

  // 1. 날아다니는 결재 서류: 서류 세 장이 종이 날개로 퍼덕인다, 빨간 반려 도장
  ART.paper = (ctx, f) => {
    const t = f / FRAMES * Math.PI * 2;
    const bob = Math.sin(t) * 5 - 12;
    const flap = Math.sin(t) * 0.55;
    ctx.translate(0, bob);
    // 날개 (접힌 종이)
    [-1, 1].forEach(side => {
      ctx.save();
      ctx.translate(side * 26, -58);
      ctx.rotate(side * (-0.35 + flap));
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(side * 40, -26);
      ctx.lineTo(side * 34, 0);
      ctx.lineTo(side * 44, 12);
      ctx.lineTo(0, 12);
      ctx.closePath();
      ink(ctx, '#e2e8f0', 4);
      line(ctx, side * 4, 4, side * 34, 0, '#94a3b8', 2.5);
      ctx.restore();
    });
    // 뒷장 두 장
    ctx.save(); ctx.rotate(-0.12);
    rr(ctx, -30, -104, 56, 74, 4); ink(ctx, '#cbd5e1', 4);
    ctx.restore();
    ctx.save(); ctx.rotate(0.08);
    rr(ctx, -27, -102, 56, 74, 4); ink(ctx, '#e2e8f0', 4);
    ctx.restore();
    // 앞장 + 접힌 모서리
    ctx.beginPath();
    ctx.moveTo(-30, -104); ctx.lineTo(16, -104); ctx.lineTo(30, -90); ctx.lineTo(30, -28); ctx.lineTo(-30, -28); ctx.closePath();
    ink(ctx, '#ffffff');
    inside(ctx, () => { ctx.beginPath(); ctx.moveTo(-30, -104); ctx.lineTo(16, -104); ctx.lineTo(30, -90); ctx.lineTo(30, -28); ctx.lineTo(-30, -28); ctx.closePath(); }, () => {
      ctx.fillStyle = '#dbe3ee';
      ctx.fillRect(-30, -40, 60, 14);
    });
    ctx.beginPath(); ctx.moveTo(16, -104); ctx.lineTo(16, -90); ctx.lineTo(30, -90); ctx.closePath(); ink(ctx, '#cbd5e1', 3.5);
    // 제목 줄 · 본문 줄
    line(ctx, -21, -95, 6, -95, '#1e3a8a', 4);
    [-49, -42, -35].forEach((y, i) => line(ctx, -22, y, 22 - i * 8, y, '#94a3b8', 2.5));
    // 눈 · 입
    angryEye(ctx, -12, -72, 8, 1);
    angryEye(ctx, 12, -72, 8, -1);
    mouthGrr(ctx, 0, -55, 18, 7, Math.max(0, Math.sin(t)) * 3);
    // 반려 도장
    ctx.save();
    ctx.translate(19, -38); ctx.rotate(-0.3);
    ellipse(ctx, 0, 0, 12, 12);
    ctx.lineWidth = 3; ctx.strokeStyle = '#dc2626'; ctx.stroke();
    text(ctx, '반려', 0, 0.5, 9, '#dc2626');
    ctx.restore();
  };

  // 2. 엑셀 #REF! 오류 슬라임: 셀 격자가 비치는 초록 젤리, 이마에 #REF!
  ART.slime = (ctx, f) => {
    const t = f / FRAMES * Math.PI * 2;
    const sq = Math.sin(t);
    const w = 62 + sq * 5, h = 66 - sq * 6;
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(-w, 0);
      ctx.bezierCurveTo(-w - 4, -h * 0.9, -w * 0.55, -h * 1.45, 0, -h * 1.45);
      ctx.bezierCurveTo(w * 0.55, -h * 1.45, w + 4, -h * 0.9, w, 0);
      ctx.quadraticCurveTo(w * 0.5, 7, 0, 4);
      ctx.quadraticCurveTo(-w * 0.5, 7, -w, 0);
      ctx.closePath();
    };
    body();
    ink(ctx, '#22c55e');
    inside(ctx, body, () => {
      // 셀 격자
      ctx.strokeStyle = 'rgba(20, 83, 45, 0.35)';
      ctx.lineWidth = 2;
      for (let x = -w; x < w; x += 18) { ctx.beginPath(); ctx.moveTo(x, -h * 1.5); ctx.lineTo(x, 8); ctx.stroke(); }
      for (let y = -h * 1.5; y < 8; y += 14) { ctx.beginPath(); ctx.moveTo(-w - 5, y); ctx.lineTo(w + 5, y); ctx.stroke(); }
      // 아래 음영 · 위 광택
      ctx.fillStyle = 'rgba(21, 128, 61, 0.55)';
      ellipse(ctx, 0, 6, w * 1.1, h * 0.42); ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ellipse(ctx, -w * 0.42, -h * 1.12, w * 0.2, h * 0.12, -0.5); ctx.fill();
    });
    // #REF! 라벨
    rr(ctx, -27, -h * 1.22, 54, 17, 4);
    ink(ctx, '#fee2e2', 3);
    text(ctx, '#REF!', 0, -h * 1.22 + 9, 13, '#dc2626');
    // 졸린 듯 화난 눈
    angryEye(ctx, -17, -h * 0.62, 10, 1);
    angryEye(ctx, 17, -h * 0.62, 10, -1);
    // 삐뚤 입
    ctx.beginPath();
    ctx.moveTo(-11, -h * 0.3); ctx.quadraticCurveTo(0, -h * 0.38, 11, -h * 0.26);
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke();
    // 흘러내리는 방울
    const drip = (f % 2) * 5;
    ctx.beginPath();
    ctx.moveTo(w * 0.62, -h * 0.35); ctx.quadraticCurveTo(w * 0.78, -h * 0.1 + drip, w * 0.62, -h * 0.05 + drip);
    ctx.quadraticCurveTo(w * 0.52, -h * 0.15, w * 0.62, -h * 0.35);
    ink(ctx, '#4ade80', 3);
  };

  // 3. 용지 걸린 복사기: 뚜껑이 입처럼 여닫히고, 걸린 종이가 혀처럼 나온다
  ART.copier = (ctx, f) => {
    const t = f / FRAMES * Math.PI * 2;
    const bob = Math.abs(Math.sin(t)) * -4;
    legs(ctx, 0, -20, 22, 18, t, '#475569');
    ctx.translate(0, bob);
    // 몸통
    const bodyPath = () => rr(ctx, -50, -96, 100, 76, 10);
    bodyPath(); ink(ctx, '#cbd5e1');
    inside(ctx, bodyPath, () => {
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(-50, -40, 100, 22);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-44, -92, 60, 5);
    });
    // 용지함 줄
    line(ctx, -40, -34, 40, -34, '#64748b', 3);
    rr(ctx, -12, -31, 24, 6, 3); ink(ctx, '#e2e8f0', 2.5);
    // LCD 얼굴 판
    rr(ctx, -34, -84, 50, 32, 6); ink(ctx, '#0f172a', 4);
    glowEye(ctx, -19, -69, 8, 1);
    glowEye(ctx, 2, -69, 8, -1);
    // 버튼 · 경고등
    ellipse(ctx, 32, -78, 6, 6); ink(ctx, f % 2 ? '#ef4444' : '#7f1d1d', 3);
    rr(ctx, 25, -66, 14, 6, 2); ink(ctx, '#22c55e', 2.5);
    // 뚜껑 (입)
    const open = 0.18 + Math.max(0, Math.sin(t)) * 0.3;
    ctx.save();
    ctx.translate(-50, -96);
    ctx.rotate(-open);
    rr(ctx, -2, -14, 104, 16, 6); ink(ctx, '#64748b');
    ctx.restore();
    // 입 안 + 이빨처럼 삐져나온 종이
    ctx.beginPath();
    ctx.moveTo(-46, -97); ctx.lineTo(48, -97); ctx.lineTo(48, -97 - 100 * Math.sin(open)); ctx.closePath();
    ctx.fillStyle = '#3b0d1a'; ctx.fill();
    // 걸린 종이 혀
    ctx.save();
    ctx.translate(46, -50);
    ctx.rotate(0.35 + Math.sin(t) * 0.12);
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(34, -8); ctx.quadraticCurveTo(40, 4, 30, 14); ctx.lineTo(0, 10); ctx.closePath();
    ink(ctx, '#ffffff', 3.5);
    line(ctx, 6, -3, 26, -1, '#94a3b8', 2);
    line(ctx, 6, 3, 22, 5, '#94a3b8', 2);
    ctx.restore();
  };

  // 4. 미확인 슬랙 알림 괴물: 말풍선 유령, 머리 위 빨간 99+ 배지, 입은 입력 중 …
  ART.slack = (ctx, f) => {
    const t = f / FRAMES * Math.PI * 2;
    ctx.translate(0, Math.sin(t) * 5 - 30);
    const sway = Math.sin(t) * 6;
    const ghost = () => {
      ctx.beginPath();
      ctx.moveTo(-44, -60);
      ctx.bezierCurveTo(-44, -112, 44, -112, 44, -60);
      ctx.lineTo(44, -18);
      // 물결 꼬리
      ctx.quadraticCurveTo(34 + sway, -4, 24, -16);
      ctx.quadraticCurveTo(14 + sway, -2, 4, -16);
      ctx.quadraticCurveTo(-8 + sway, -2, -16, -16);
      ctx.quadraticCurveTo(-26 + sway, 0, -44, -12);
      ctx.closePath();
    };
    ghost(); ink(ctx, '#f5f3ff');
    inside(ctx, ghost, () => {
      ctx.fillStyle = '#ddd6fe';
      ellipse(ctx, 18, -20, 50, 30); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ellipse(ctx, -22, -86, 10, 6, -0.6); ctx.fill();
    });
    // 해시 기호 무늬
    ctx.save();
    ctx.translate(-26, -40); ctx.rotate(-0.2);
    [[-4, 0, '#36c5f0'], [4, 0, '#2eb67d']].forEach(([x, , c]) => line(ctx, x, -7, x - 2, 7, c, 3));
    [[-3, '#ecb22e'], [3, '#e01e5a']].forEach(([y, c]) => line(ctx, -8, y, 7, y, c, 3));
    ctx.restore();
    angryEye(ctx, -15, -70, 10, 1);
    angryEye(ctx, 15, -70, 10, -1);
    // 입력 중 말줄임
    rr(ctx, -14, -52, 28, 13, 6.5); ink(ctx, '#4a154b', 3);
    [-7, 0, 7].forEach((x, i) => { ellipse(ctx, x, -45.5, 2.4, 2.4); ctx.fillStyle = i === f % 3 ? '#fff' : '#c4b5fd'; ctx.fill(); });
    // 알림 배지
    const pop = 1 + (f % 2) * 0.08;
    ctx.save();
    ctx.translate(34, -100); ctx.scale(pop, pop);
    rr(ctx, -17, -12, 34, 24, 12); ink(ctx, '#e01e5a', 4);
    text(ctx, '99+', 0, 0.5, 14, '#ffffff');
    ctx.restore();
  };

  // 5. 탕비실 믹스커피 도둑: 복면 쓴 노란 믹스커피 스틱이 훔친 봉지를 메고 달린다
  ART.thief = (ctx, f) => {
    const t = f / FRAMES * Math.PI * 2;
    legs(ctx, 0, -22, 13, 20, t * 1, '#1f2937', '#111827', 10);
    ctx.translate(0, -Math.abs(Math.sin(t)) * 4);
    // 훔친 봉지 (등 뒤)
    ellipse(ctx, 30, -76, 24, 28, 0.3); ink(ctx, '#a16207');
    line(ctx, 18, -98, 30, -104, OL, 4);
    text(ctx, '₩', 32, -72, 18, '#fde68a');
    // 스틱 몸통
    ctx.save();
    ctx.rotate(-0.08 + Math.sin(t) * 0.04);
    const stick = () => rr(ctx, -24, -128, 48, 112, 14);
    stick(); ink(ctx, '#facc15');
    inside(ctx, stick, () => {
      ctx.fillStyle = '#ca8a04'; ctx.fillRect(8, -130, 20, 120);
      ctx.fillStyle = '#b45309'; ctx.fillRect(-26, -46, 54, 16);
      ctx.fillStyle = '#fef08a'; ctx.fillRect(-18, -122, 6, 60);
    });
    text(ctx, 'MIX', 0, -38, 12, '#fef3c7');
    // 뜯긴 윗부분 톱니
    ctx.beginPath();
    ctx.moveTo(-24, -118);
    for (let i = 0; i <= 8; i++) ctx.lineTo(-24 + i * 6, -118 - (i % 2 ? 7 : 0));
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
    // 복면 띠 + 눈
    rr(ctx, -30, -98, 60, 22, 8); ink(ctx, '#111827', 4);
    line(ctx, -30, -88, -44, -80 + Math.sin(t) * 6, '#111827', 6);
    line(ctx, -30, -84, -42, -72 + Math.sin(t + 1) * 6, '#111827', 5);
    ellipse(ctx, -10, -87, 7, 5.5); ctx.fillStyle = '#fff'; ctx.fill();
    ellipse(ctx, 10, -87, 7, 5.5); ctx.fill();
    ellipse(ctx, -8, -86, 3, 3); ctx.fillStyle = OL; ctx.fill();
    ellipse(ctx, 12, -86, 3, 3); ctx.fill();
    // 씩 웃는 입
    ctx.beginPath(); ctx.moveTo(-9, -64); ctx.quadraticCurveTo(0, -56, 11, -66);
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
    // 봉지 끈 잡은 팔
    arm(ctx, 16, -76, 24, -98, '#facc15', 8, '#fde047');
  };

  // 6. 야근 좀비 동료: 창백한 얼굴, 다크서클, 풀린 넥타이, 사원증, 앞으로 뻗은 팔
  ART.zombie = (ctx, f) => {
    const t = f / FRAMES * Math.PI * 2;
    legs(ctx, 0, -26, 12, 24, t, '#334155', '#1e293b', 12);
    ctx.translate(0, -Math.abs(Math.sin(t)) * 3);
    ctx.rotate(Math.sin(t) * 0.05);
    // 뒤 팔
    arm(ctx, 14, -66, 44, -70 + Math.sin(t + 1) * 4, '#f8fafc', 11, '#a7c4a0');
    // 셔츠 몸통
    const torso = () => rr(ctx, -24, -80, 48, 56, 12);
    torso(); ink(ctx, '#f1f5f9');
    inside(ctx, torso, () => { ctx.fillStyle = '#cbd5e1'; ctx.fillRect(8, -82, 20, 60); ctx.fillStyle = '#94a3b8'; ctx.fillRect(-26, -34, 52, 12); });
    // 풀린 넥타이
    ctx.beginPath();
    ctx.moveTo(-4, -78); ctx.lineTo(6, -78); ctx.lineTo(10 + Math.sin(t) * 3, -46); ctx.lineTo(2 + Math.sin(t) * 3, -40); ctx.lineTo(-3, -48); ctx.closePath();
    ink(ctx, '#dc2626', 3.5);
    // 사원증
    line(ctx, -14, -78, -12, -58, '#2563eb', 2.5);
    rr(ctx, -20, -60, 14, 18, 2); ink(ctx, '#fff', 2.5);
    ctx.fillStyle = '#60a5fa'; ctx.fillRect(-17, -57, 8, 5);
    // 머리
    const head = () => { ctx.beginPath(); ctx.roundRect(-34, -148, 68, 66, 26); };
    head(); ink(ctx, '#a7c4a0');
    inside(ctx, head, () => {
      ctx.fillStyle = '#86a97f'; ctx.fillRect(10, -150, 30, 70);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ellipse(ctx, -18, -132, 8, 5, -0.5); ctx.fill();
    });
    // 헝클어진 머리카락
    ctx.beginPath();
    ctx.moveTo(-36, -124);
    ctx.quadraticCurveTo(-40, -156, -10, -154);
    ctx.lineTo(-6, -146); ctx.lineTo(0, -156); ctx.lineTo(8, -146); ctx.lineTo(16, -157);
    ctx.quadraticCurveTo(42, -152, 36, -122);
    ctx.quadraticCurveTo(24, -140, 4, -136);
    ctx.quadraticCurveTo(-20, -140, -36, -124);
    ink(ctx, '#3f3a52', 4);
    // 다크서클 눈 (좌우 크기 다르게)
    ellipse(ctx, -14, -114, 11, 10); ctx.fillStyle = '#6b7a68'; ctx.fill();
    ellipse(ctx, 15, -113, 9, 8); ctx.fill();
    ellipse(ctx, -14, -116, 8, 7.5); ink(ctx, '#fef9c3', 3);
    ellipse(ctx, 15, -115, 6, 6); ink(ctx, '#fef9c3', 3);
    ellipse(ctx, -12, -115, 2.4, 2.4); ctx.fillStyle = OL; ctx.fill();
    ellipse(ctx, 16, -114, 2, 2); ctx.fill();
    // 벌어진 입 + 침
    ellipse(ctx, 2, -94, 9, 6 + Math.max(0, Math.sin(t)) * 3); ink(ctx, '#3b0d1a', 3.5);
    ctx.fillStyle = '#fff'; ctx.fillRect(-2, -99, 5, 3);
    // 앞 팔 (앞으로 뻗기)
    arm(ctx, -14, -68, 30, -76 + Math.sin(t) * 4, '#f8fafc', 11, '#a7c4a0');
    // Zzz 대신 커피 얼룩
    ellipse(ctx, 12, -44, 5, 3.5); ctx.fillStyle = '#92400e'; ctx.fill();
  };

  // 7. AI 자동화 로봇: 모니터 머리 + 사무용 의자 바퀴, 기계 집게 팔
  ART.robot = (ctx, f) => {
    const t = f / FRAMES * Math.PI * 2;
    // 의자 다리 · 바퀴
    line(ctx, 0, -36, 0, -14, '#334155', 7);
    [-26, -9, 9, 26].forEach((x, i) => {
      line(ctx, 0, -14, x, -6, '#475569', 6);
      ellipse(ctx, x, -3 + (i + f) % 2, 6, 6); ink(ctx, '#1e293b', 3);
    });
    ctx.translate(0, Math.sin(t) * 2);
    // 몸통 (키보드 가슴)
    const torso = () => rr(ctx, -30, -80, 60, 46, 10);
    torso(); ink(ctx, '#94a3b8');
    inside(ctx, torso, () => { ctx.fillStyle = '#64748b'; ctx.fillRect(10, -82, 24, 50); });
    rr(ctx, -22, -66, 44, 18, 4); ink(ctx, '#1e293b', 3);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
      ctx.fillStyle = (r * 5 + c + f) % 4 === 0 ? '#38bdf8' : '#94a3b8';
      ctx.fillRect(-19 + c * 8, -63 + r * 8, 6, 5);
    }
    // 집게 팔
    const swing = Math.sin(t) * 6;
    [-1, 1].forEach(side => {
      arm(ctx, side * 28, -70, side * 46, -52 + side * swing, '#64748b', 7);
      ctx.save();
      ctx.translate(side * 46, -52 + side * swing);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(side * 9, 8); ctx.lineTo(side * 3, 10);
      ctx.moveTo(0, 0); ctx.lineTo(-side * 5, 10); ctx.lineTo(-side * 1, 12);
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
    });
    // 목
    rr(ctx, -8, -90, 16, 12, 3); ink(ctx, '#475569', 3.5);
    // 모니터 머리
    const mon = () => rr(ctx, -46, -148, 92, 62, 10);
    mon(); ink(ctx, '#e2e8f0');
    rr(ctx, -38, -141, 76, 46, 6); ink(ctx, '#082f49', 3.5);
    inside(ctx, () => rr(ctx, -38, -141, 76, 46, 6), () => {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      for (let y = -141; y < -95; y += 5) ctx.fillRect(-38, y, 76, 2);
    });
    // 화면 속 화난 얼굴 (청록 발광)
    ctx.save();
    ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#67e8f9';
    const blink = f === 3 ? 0.25 : 1;
    ctx.beginPath(); ctx.moveTo(-26, -128); ctx.lineTo(-8, -122); ctx.lineTo(-10, -122 + 10 * blink); ctx.lineTo(-24, -122 + 8 * blink); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(26, -128); ctx.lineTo(8, -122); ctx.lineTo(10, -122 + 10 * blink); ctx.lineTo(24, -122 + 8 * blink); ctx.closePath(); ctx.fill();
    ctx.fillRect(-12, -104, 24, 3);
    ctx.restore();
    text(ctx, 'AI', 34, -93, 9, '#475569');
    // 안테나 (케이블)
    ctx.beginPath(); ctx.moveTo(20, -148); ctx.quadraticCurveTo(30, -164, 22 + Math.sin(t) * 4, -170);
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke();
    ellipse(ctx, 22 + Math.sin(t) * 4, -172, 5, 5); ink(ctx, f % 2 ? '#f43f5e' : '#fb7185', 3);
  };

  // ---------- 보스 3종 (사람, 2~2.5등신) ----------
  function suitBody(ctx, t, o) {
    // o: { suit, shirt, tie, pants, belly, w }
    const w = o.w || 60;
    legs(ctx, 0, -46, w * 0.34, 40, t, o.pants, '#0f0a1e', 20);
    const torso = () => {
      ctx.beginPath();
      ctx.moveTo(-w, -46);
      ctx.bezierCurveTo(-w - (o.belly || 0), -80, -w * 0.9, -130, -w * 0.62, -136);
      ctx.lineTo(w * 0.62, -136);
      ctx.bezierCurveTo(w * 0.9, -130, w + (o.belly || 0), -80, w, -46);
      ctx.closePath();
    };
    torso(); ink(ctx, o.suit, 6);
    inside(ctx, torso, () => {
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(w * 0.3, -140, w, 100);
      // 셔츠 V
      ctx.beginPath(); ctx.moveTo(-w * 0.34, -137); ctx.lineTo(0, -84); ctx.lineTo(w * 0.34, -137); ctx.closePath();
      ctx.fillStyle = o.shirt; ctx.fill();
    });
    // 옷깃
    ctx.beginPath(); ctx.moveTo(-w * 0.36, -136); ctx.lineTo(-4, -86); ctx.lineTo(-w * 0.5, -104); ctx.closePath(); ink(ctx, o.suit, 4);
    ctx.beginPath(); ctx.moveTo(w * 0.36, -136); ctx.lineTo(4, -86); ctx.lineTo(w * 0.5, -104); ctx.closePath(); ink(ctx, o.suit, 4);
    // 넥타이
    ctx.beginPath(); ctx.moveTo(-7, -134); ctx.lineTo(7, -134); ctx.lineTo(10, -96); ctx.lineTo(0, -84); ctx.lineTo(-10, -96); ctx.closePath();
    ink(ctx, o.tie, 4);
    // 단추
    [-70, -56].forEach(y => { ellipse(ctx, 0, y, 3.5, 3.5); ctx.fillStyle = OL; ctx.fill(); });
  }
  function bossHead(ctx, cx, cy, r, skin, shade) {
    const head = () => ellipse(ctx, cx, cy, r, r * 0.95);
    head(); ink(ctx, skin, 6);
    inside(ctx, head, () => {
      ctx.fillStyle = shade; ellipse(ctx, cx + r * 0.7, cy + r * 0.2, r * 0.6, r * 1.1); ctx.fill();
    });
    // 귀
    [-1, 1].forEach(s => { ellipse(ctx, cx + s * r * 0.98, cy + r * 0.1, r * 0.17, r * 0.24); ink(ctx, skin, 4); });
    head(); ctx.lineWidth = 6; ctx.strokeStyle = OL; ctx.stroke();
  }

  // 8. 꼰대 과장: 반쯤 벗겨진 머리, 두꺼운 안경, 콧수염, "라떼" 머그컵
  ART.boss_manager = (ctx, f, attack) => {
    const t = f / FRAMES * Math.PI * 2;
    suitBody(ctx, t, { suit: '#a16207', shirt: '#fef3c7', tie: '#1d4ed8', pants: '#57534e', belly: 16, w: 58 });
    const hy = -178;
    // 머그 든 팔
    const lift = attack ? -40 : Math.sin(t) * 4;
    arm(ctx, 50, -122, 74, -92 + lift, '#a16207', 16, '#fcd9b6');
    rr(ctx, 62, -124 + lift, 30, 32, 5); ink(ctx, '#fff', 4);
    ctx.beginPath(); ctx.arc(94, -108 + lift, 8, -1.2, 1.2); ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke();
    text(ctx, '라떼', 77, -106 + lift, 11, '#92400e');
    if (attack) [0, 1, 2].forEach(i => { ctx.beginPath(); ctx.moveTo(70 + i * 8, -132 + lift); ctx.quadraticCurveTo(74 + i * 8, -142 + lift, 70 + i * 8, -150 + lift); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.stroke(); });
    arm(ctx, -50, -122, -66, -80 + Math.sin(t + 2) * 4, '#a16207', 16, '#fcd9b6');
    bossHead(ctx, 0, hy, 50, '#fcd9b6', '#f0bf94');
    // 옆머리 + 빗어 넘긴 세 가닥
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(s * 42, hy - 6, 14, 26, s * 0.2, 0, Math.PI * 2); ink(ctx, '#57534e', 4); });
    [-12, 0, 12].forEach(x => { ctx.beginPath(); ctx.moveTo(-40, hy - 26 + x * 0.3); ctx.quadraticCurveTo(0, hy - 58 + x, 40, hy - 28 + x * 0.2); ctx.strokeStyle = '#57534e'; ctx.lineWidth = 4; ctx.stroke(); });
    // 이마 광
    ellipse(ctx, -16, hy - 34, 10, 5, -0.3); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
    // 두꺼운 안경
    [-1, 1].forEach(s => { rr(ctx, s * 22 - 17, hy - 12, 34, 24, 8); ink(ctx, 'rgba(186, 230, 253, 0.55)', 5); });
    line(ctx, -5, hy - 2, 5, hy - 2, OL, 5);
    ellipse(ctx, -20, hy + 1, 4, 4); ctx.fillStyle = OL; ctx.fill();
    ellipse(ctx, 20, hy + 1, 4, 4); ctx.fill();
    line(ctx, -34, hy - 18, -10, hy - 14, OL, 5);
    line(ctx, 34, hy - 18, 10, hy - 14, OL, 5);
    // 콧수염 + 입
    ctx.beginPath();
    ctx.moveTo(0, hy + 18);
    ctx.quadraticCurveTo(-18, hy + 14, -24, hy + 24);
    ctx.quadraticCurveTo(-10, hy + 22, 0, hy + 22);
    ctx.quadraticCurveTo(10, hy + 22, 24, hy + 24);
    ctx.quadraticCurveTo(18, hy + 14, 0, hy + 18);
    ink(ctx, '#44403c', 3.5);
    if (attack) { ellipse(ctx, 0, hy + 33, 12, 9); ink(ctx, '#3b0d1a', 4); }
    else line(ctx, -9, hy + 32, 9, hy + 30, OL, 4);
    if (attack) {
      rr(ctx, -110, hy - 78, 84, 34, 14); ink(ctx, '#fff', 4);
      ctx.beginPath(); ctx.moveTo(-50, hy - 45); ctx.lineTo(-38, hy - 28); ctx.lineTo(-40, hy - 46); ctx.fillStyle = '#fff'; ctx.fill();
      text(ctx, '라떼는!', -68, hy - 61, 17, '#b45309');
    }
  };

  // 9. 분노의 부장님: 새빨간 얼굴, 김 나는 머리, 💢 표시, 결재판/서류가방
  ART.boss_director = (ctx, f, attack) => {
    const t = f / FRAMES * Math.PI * 2;
    suitBody(ctx, t, { suit: '#1e293b', shirt: '#e2e8f0', tie: '#dc2626', pants: '#0f172a', belly: 8, w: 62 });
    const hy = -182;
    // 서류가방 팔
    const raise = attack ? -86 : 0;
    arm(ctx, 54, -124, attack ? 70 : 76, (attack ? -150 : -76) + Math.sin(t) * 3, '#1e293b', 17, '#f87171');
    ctx.save();
    ctx.translate(attack ? 62 : 76, (attack ? -196 : -60) + Math.sin(t) * 3);
    rr(ctx, -26, 0, 52, 38, 6); ink(ctx, '#7c2d12', 5);
    rr(ctx, -10, -9, 20, 11, 4); ctx.lineWidth = 4; ctx.strokeStyle = OL; ctx.stroke();
    line(ctx, -26, 14, 26, 14, '#451a03', 3);
    rr(ctx, -4, 10, 8, 8, 2); ink(ctx, '#fbbf24', 2.5);
    ctx.restore();
    void raise;
    arm(ctx, -54, -124, -72, -84 + Math.sin(t + 2) * 3, '#1e293b', 17, '#f87171');
    bossHead(ctx, 0, hy, 52, '#f87171', '#ef4444');
    // 짧은 스포츠 머리
    ctx.beginPath(); ctx.ellipse(0, hy - 30, 48, 26, 0, Math.PI, 0); ink(ctx, '#1f1b2e', 5);
    // 김
    [-26, 0, 26].forEach((x, i) => {
      const k = (f + i) % 4;
      ctx.beginPath(); ctx.moveTo(x, hy - 60); ctx.quadraticCurveTo(x + 10, hy - 72 - k * 2, x, hy - 84 - k * 3); ctx.quadraticCurveTo(x - 10, hy - 94, x, hy - 104 - k * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 5; ctx.stroke();
    });
    // 💢 핏대
    ctx.save(); ctx.translate(34, hy - 36);
    [0, 1, 2, 3].forEach(i => { ctx.save(); ctx.rotate(i * Math.PI / 2); ctx.beginPath(); ctx.moveTo(3, -12); ctx.quadraticCurveTo(4, -4, 12, -3); ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 4.5; ctx.stroke(); ctx.restore(); });
    ctx.restore();
    // 부릅뜬 눈
    angryEye(ctx, -19, hy - 2, 12, 1, { browW: 8 });
    angryEye(ctx, 19, hy - 2, 12, -1, { browW: 8 });
    // 고함치는 입
    mouthGrr(ctx, 0, hy + 28, attack ? 40 : 30, attack ? 20 : 12, attack ? 4 : 0);
  };

  // 10. 철야 지시 대표이사: 보라 정장, 금 넥타이, 올백 머리, 선글라스, 황금 만년필
  ART.boss_ceo = (ctx, f, attack) => {
    const t = f / FRAMES * Math.PI * 2;
    // 망토처럼 펄럭이는 정장 자락 (뒤)
    ctx.beginPath();
    ctx.moveTo(-60, -140); ctx.quadraticCurveTo(-90 - Math.sin(t) * 8, -80, -76, -30); ctx.lineTo(76, -30); ctx.quadraticCurveTo(90 + Math.sin(t) * 8, -80, 60, -140); ctx.closePath();
    ink(ctx, '#3b0764', 6);
    suitBody(ctx, t, { suit: '#6d28d9', shirt: '#0f0a1e', tie: '#facc15', pants: '#2e1065', belly: 4, w: 60 });
    const hy = -184;
    // 만년필 든 팔 (공격 시 앞으로 겨눔)
    if (attack) {
      arm(ctx, 52, -124, 98, -150, '#6d28d9', 17, '#f5d0b0');
      ctx.save(); ctx.translate(98, -150); ctx.rotate(-0.55);
      rr(ctx, -4, -6, 44, 12, 5); ink(ctx, '#facc15', 4);
      ctx.beginPath(); ctx.moveTo(40, -6); ctx.lineTo(56, 0); ctx.lineTo(40, 6); ctx.closePath(); ink(ctx, '#fde68a', 3.5);
      ctx.restore();
    } else {
      arm(ctx, 52, -124, 72, -82 + Math.sin(t) * 3, '#6d28d9', 17, '#f5d0b0');
      ctx.save(); ctx.translate(74, -84 + Math.sin(t) * 3); ctx.rotate(1.1);
      rr(ctx, -4, -5, 38, 10, 5); ink(ctx, '#facc15', 3.5);
      ctx.restore();
    }
    arm(ctx, -52, -124, -70, -84 + Math.sin(t + 2) * 3, '#6d28d9', 17, '#f5d0b0');
    bossHead(ctx, 0, hy, 50, '#f5d0b0', '#e8b890');
    // 올백 머리
    ctx.beginPath();
    ctx.moveTo(-50, hy - 4);
    ctx.bezierCurveTo(-58, hy - 70, 58, hy - 70, 50, hy - 4);
    ctx.bezierCurveTo(40, hy - 34, -40, hy - 34, -50, hy - 4);
    ink(ctx, '#111827', 5);
    [-20, 0, 20].forEach(x => { ctx.beginPath(); ctx.moveTo(x - 12, hy - 34); ctx.quadraticCurveTo(x, hy - 56, x + 16, hy - 50); ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 3; ctx.stroke(); });
    // 선글라스
    [-1, 1].forEach(s => {
      ctx.beginPath(); ctx.moveTo(s * 4, hy - 8); ctx.lineTo(s * 40, hy - 12); ctx.lineTo(s * 36, hy + 8); ctx.quadraticCurveTo(s * 20, hy + 16, s * 6, hy + 4); ctx.closePath();
      ink(ctx, '#0f0a1e', 4);
    });
    ctx.beginPath(); ctx.moveTo(-30, hy - 6); ctx.lineTo(-18, hy - 7); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, hy - 7); ctx.lineTo(26, hy - 8); ctx.stroke();
    // 비웃는 입꼬리
    ctx.beginPath(); ctx.moveTo(-14, hy + 28); ctx.quadraticCurveTo(4, hy + 32, 18, hy + 20);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke();
    // 금 배지
    ellipse(ctx, -34, -118, 7, 7); ink(ctx, '#fbbf24', 3);
  };

  // ---------- 굽기 ----------
  const cache = {};
  function bake(key) {
    const draw = ART[key];
    if (!draw) return null;
    const isBoss = key.startsWith('boss_');
    const box = isBoss ? BOX.boss : BOX.mob;
    const S = 1; // 원본 1:1 (표시할 때 축소)
    const make = (f, attack, flip) => {
      const c = document.createElement('canvas');
      c.width = box.w * S; c.height = box.h * S;
      const g = c.getContext('2d');
      g.scale(S, S);
      g.translate(box.fx, box.fy);
      if (flip) g.scale(-1, 1);
      mirror = flip ? -1 : 1;
      try { draw(g, f, attack); } finally { mirror = 1; }
      // 흰 실루엣 (피격 플래시)
      const w = document.createElement('canvas');
      w.width = c.width; w.height = c.height;
      const wg = w.getContext('2d');
      wg.drawImage(c, 0, 0);
      wg.globalCompositeOperation = 'source-in';
      wg.fillStyle = '#ffffff';
      wg.fillRect(0, 0, w.width, w.height);
      return { img: c, white: w };
    };
    // 발 위치가 가운데가 되도록 fx 는 상자 중앙 (좌우 반전해도 발이 같은 자리)
    const set = { box, isBoss, walk: [], walkFlip: [], attack: null, attackFlip: null };
    for (let f = 0; f < FRAMES; f++) {
      set.walk.push(make(f, false, false));
      set.walkFlip.push(make(f, false, true));
    }
    if (isBoss) {
      set.attack = make(1, true, false);
      set.attackFlip = make(1, true, true);
    }
    return set;
  }

  const MonsterArt = {
    FRAMES,
    has(key) { return !!ART[key]; },
    get(key) {
      if (!(key in cache)) {
        try { cache[key] = bake(key); } catch (e) { console.warn('monster art failed', key, e); cache[key] = null; }
      }
      return cache[key];
    },
    // height: 화면에 보일 몸 높이(px). 원점 = 발
    draw(ctx, key, frame, height, opts = {}) {
      const set = this.get(key);
      if (!set) return false;
      const i = ((frame % FRAMES) + FRAMES) % FRAMES;
      const fr = opts.attack && set.attack ? (opts.flip ? set.attackFlip : set.attack) : (opts.flip ? set.walkFlip : set.walk)[i];
      const k = height / set.box.body;
      const w = set.box.w * k, h = set.box.h * k;
      ctx.save();
      if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
      const x = -set.box.fx * k, y = -set.box.fy * k;
      ctx.drawImage(fr.img, x, y, w, h);
      if (opts.flash) {
        ctx.globalAlpha *= opts.flash;
        ctx.drawImage(fr.white, x, y, w, h);
      }
      ctx.restore();
      return true;
    },
    // 도감 · 목록용 아이콘 (<img>)
    iconHtml(key, size = 34) {
      const set = this.get(key);
      if (!set) return '';
      if (!set.icon) {
        const src = set.walk[0].img;
        const pad = 6;
        const c = document.createElement('canvas');
        const side = Math.max(set.box.w, set.box.h) + pad * 2;
        c.width = c.height = side;
        c.getContext('2d').drawImage(src, (side - set.box.w) / 2, (side - set.box.h) / 2);
        set.icon = c.toDataURL('image/png');
      }
      return `<img class="mon-art-icon" src="${set.icon}" width="${size}" height="${size}" alt="" draggable="false">`;
    }
  };

  window.MonsterArt = MonsterArt;
})();
