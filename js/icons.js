// Office Escape Survivor - High-End Luxury SVG Vector Icon System

window.GAME_ICONS = {
  // 1. 메인 네비게이션 & 로비 탭
  tab_stage: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon tab-icon">
    <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" stroke-width="2"/>
    <path d="M7 8h10M7 12h7M7 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="17" cy="15" r="2.5" fill="#38bdf8" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  tab_char: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon tab-icon">
    <rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="9" r="3" stroke="currentColor" stroke-width="2" fill="rgba(56, 189, 248, 0.2)"/>
    <path d="M7 18c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M10 3h4" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,

  tab_shop: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon tab-icon">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
    <path d="M12 6v12M15 9.5c0-1.4-1.3-2-3-2s-3 .6-3 2 1.3 2 3 2.5 3 .9 3 2.5-1.3 2-3 2-3-.8-3-2" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  tab_ach: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon tab-icon">
    <path d="M8 4h8v7a4 4 0 01-8 0V4z" stroke="currentColor" stroke-width="2" fill="rgba(255, 215, 0, 0.15)"/>
    <path d="M8 6H5a2 2 0 00-2 2v1a3 3 0 003 3h2M16 6h3a2 2 0 012 2v1a3 3 0 01-3 3h-2M12 15v4M9 21h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  tab_bestiary: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon tab-icon">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" stroke-width="2"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" stroke-width="2" fill="rgba(168, 85, 247, 0.15)"/>
    <path d="M12 7l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5L12 7z" fill="#00f0ff"/>
  </svg>`,

  // 2. 인게임 HUD 아이콘
  gold_coin: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon pill-svg-icon">
    <circle cx="12" cy="12" r="9.5" fill="url(#goldGrad)" stroke="#eab308" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="7" stroke="#ca8a04" stroke-width="1" stroke-dasharray="2 2"/>
    <path d="M10 8v8M10 12h4.5M10 8h4a2 2 0 010 4M10 12l4.5 4" stroke="#78350f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <defs>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="24" y2="24">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#eab308"/>
        <stop offset="100%" stop-color="#ca8a04"/>
      </linearGradient>
    </defs>
  </svg>`,

  skull_kill: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon pill-svg-icon">
    <path d="M12 3a8 8 0 00-8 8c0 3.5 2.2 6.5 5.5 7.5V21h5v-2.5c3.3-1 5.5-4 5.5-7.5a8 8 0 00-8-8z" fill="rgba(239, 68, 68, 0.2)" stroke="#f43f5e" stroke-width="2"/>
    <circle cx="9" cy="11" r="1.5" fill="#f43f5e"/>
    <circle cx="15" cy="11" r="1.5" fill="#f43f5e"/>
    <path d="M10 18v2M12 18v2M14 18v2" stroke="#f43f5e" stroke-width="1.5"/>
  </svg>`,

  heart_hp: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon stat-svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#hpGrad)" stroke="#e11d48" stroke-width="1.5"/>
    <defs>
      <linearGradient id="hpGrad" x1="0" y1="0" x2="0" y2="24">
        <stop offset="0%" stop-color="#fb7185"/>
        <stop offset="100%" stop-color="#e11d48"/>
      </linearGradient>
    </defs>
  </svg>`,

  timer_clock: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon stat-svg">
    <circle cx="12" cy="13" r="8.5" stroke="#38bdf8" stroke-width="2" fill="rgba(56, 189, 248, 0.15)"/>
    <path d="M12 8.5v4.5l3 1.5" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
    <path d="M9 3h6M12 3v2" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  dash_wind: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon btn-svg-icon">
    <path d="M4 12h14M15 8l4 4-4 4" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 7h9M2 17h11" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  </svg>`,

  pause_btn: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon btn-svg-icon">
    <rect x="6" y="5" width="4" height="14" rx="1.5" fill="#38bdf8"/>
    <rect x="14" y="5" width="4" height="14" rx="1.5" fill="#38bdf8"/>
  </svg>`,

  star_gold: `<svg viewBox="0 0 24 24" fill="url(#starGrad)" stroke="#f59e0b" stroke-width="1.5" class="svg-icon star-svg">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    <defs>
      <linearGradient id="starGrad" x1="0" y1="0" x2="0" y2="24">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>
    </defs>
  </svg>`,

  star_empty: `<svg viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="1.5" class="svg-icon star-svg">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>`,

  // 3. 캐릭터 아바타 벡터 아이콘
  char_intern: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon char-avatar-svg">
    <circle cx="12" cy="12" r="10" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="12" cy="9" r="3.5" fill="#f8fafc"/>
    <path d="M6.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="#f8fafc"/>
    <rect x="10" y="14" width="4" height="2" rx="0.5" fill="#ffd700"/>
  </svg>`,

  char_planner: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon char-avatar-svg">
    <circle cx="12" cy="12" r="10" fill="#7c3aed" stroke="#c084fc" stroke-width="2"/>
    <circle cx="12" cy="9" r="3.5" fill="#fdf4ff"/>
    <path d="M6.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="#fdf4ff"/>
    <circle cx="12" cy="9" r="4.5" stroke="#e879f9" stroke-width="1" stroke-dasharray="2 2"/>
  </svg>`,

  char_deputy: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon char-avatar-svg">
    <circle cx="12" cy="12" r="10" fill="#0f766e" stroke="#2dd4bf" stroke-width="2"/>
    <circle cx="12" cy="9" r="3.5" fill="#f0fdfa"/>
    <path d="M6.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="#f0fdfa"/>
    <path d="M10 8h4" stroke="#0f766e" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  char_manager: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon char-avatar-svg">
    <circle cx="12" cy="12" r="10" fill="#be123c" stroke="#fb7185" stroke-width="2"/>
    <circle cx="12" cy="9" r="3.5" fill="#fff1f2"/>
    <path d="M6.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="#fff1f2"/>
    <polygon points="12,2 14,5 17,4 16,7 19,8 17,10 18,13 15,12 14,15 12,13 10,15 9,12 6,13 7,10 5,8 8,7 7,4 10,5" fill="#ffd700" transform="scale(0.35) translate(14, 2)"/>
  </svg>`,

  // 4. 무기 8종 및 초월 무기 8종 벡터 아이콘
  stapler: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg">
    <rect x="3" y="11" width="18" height="6" rx="2" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>
    <path d="M5 11V7a2 2 0 012-2h10a2 2 0 012 2v4" stroke="#38bdf8" stroke-width="2"/>
    <line x1="8" y1="14" x2="16" y2="14" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  super_stapler: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg super">
    <rect x="2" y="10" width="20" height="7" rx="2" fill="#ffd700" stroke="#b45309" stroke-width="1.5"/>
    <path d="M4 10V5a2 2 0 012-2h12a2 2 0 012 2v5" stroke="#ffd700" stroke-width="2.5"/>
    <path d="M12 2v4M7 2v4M17 2v4" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="13.5" r="2" fill="#ffffff"/>
  </svg>`,

  drink: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg">
    <rect x="7" y="5" width="10" height="15" rx="3" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
    <path d="M9 3h6v2H9z" fill="#d97706"/>
    <path d="M13 8l-3 4h4l-2 5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  super_drink: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg super">
    <rect x="6" y="4" width="12" height="17" rx="4" fill="#10b981" stroke="#047857" stroke-width="2"/>
    <path d="M14 7l-5 5h6l-3 6" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="3" r="2" fill="#34d399"/>
  </svg>`,

  keyboard: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg">
    <rect x="2" y="6" width="20" height="12" rx="3" fill="#6366f1" stroke="#4338ca" stroke-width="1.5"/>
    <rect x="5" y="9" width="3" height="2" rx="0.5" fill="#ffffff"/>
    <rect x="10.5" y="9" width="3" height="2" rx="0.5" fill="#ffffff"/>
    <rect x="16" y="9" width="3" height="2" rx="0.5" fill="#ffffff"/>
    <rect x="5" y="13" width="14" height="2" rx="0.5" fill="#38bdf8"/>
  </svg>`,

  super_keyboard: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg super">
    <rect x="2" y="5" width="20" height="14" rx="3" fill="#ec4899" stroke="#be185d" stroke-width="2"/>
    <path d="M5 9h14M5 12h14M7 15h10" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="12" cy="12" r="3" fill="#ffffff" opacity="0.3"/>
  </svg>`,

  card: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg">
    <rect x="3" y="5" width="18" height="14" rx="3" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>
    <rect x="3" y="9" width="18" height="3" fill="#0f172a"/>
    <rect x="6" y="14" width="4" height="2.5" rx="0.5" fill="#ffd700"/>
  </svg>`,

  super_card: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg super">
    <rect x="2" y="4" width="20" height="16" rx="3" fill="#0f172a" stroke="#ffd700" stroke-width="2"/>
    <circle cx="12" cy="12" r="5" stroke="#ffd700" stroke-width="1.5"/>
    <path d="M12 9v6M9.5 12h5" stroke="#ffd700" stroke-width="1.8"/>
  </svg>`,

  laser: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg">
    <rect x="8" y="3" width="8" height="14" rx="2" fill="#475569" stroke="#334155" stroke-width="1.5"/>
    <circle cx="12" cy="7" r="1.5" fill="#ef4444"/>
    <path d="M12 17v4M10 21h4" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  super_laser: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg super">
    <circle cx="12" cy="12" r="8" stroke="#ef4444" stroke-width="2" fill="rgba(239, 68, 68, 0.2)"/>
    <path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" stroke="#ef4444" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="3" fill="#ffffff"/>
  </svg>`,

  coffee_bomb: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg">
    <path d="M4 8h12v7a5 5 0 01-5 5H9a5 5 0 01-5-5V8z" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
    <path d="M16 10h2a2 2 0 012 2v1a2 2 0 01-2 2h-2" stroke="#78350f" stroke-width="2"/>
    <path d="M7 4c0 1.5 1.5 1.5 1.5 3M11 4c0 1.5 1.5 1.5 1.5 3M15 4c0 1.5 1.5 1.5 1.5 3" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  super_coffee: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg super">
    <path d="M5 8h14v8a6 6 0 01-6 6h-2a6 6 0 01-6-6V8z" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
    <path d="M12 2v4M8 3v3M16 3v3" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="14" r="3" fill="#ffffff"/>
  </svg>`,

  stamp: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg">
    <path d="M10 4h4a2 2 0 012 2v4a3 3 0 013 3v2H5v-2a3 3 0 013-3V6a2 2 0 012-2z" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
    <rect x="4" y="17" width="16" height="4" rx="1" fill="#475569"/>
  </svg>`,

  super_stamp: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg super">
    <path d="M9 3h6a2 2 0 012 2v4a4 4 0 014 4v3H3v-3a4 4 0 014-4V5a2 2 0 012-2z" fill="#dc2626" stroke="#ffd700" stroke-width="2"/>
    <rect x="3" y="18" width="18" height="4" rx="1.5" fill="#ffd700"/>
  </svg>`,

  shredder: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg">
    <rect x="3" y="4" width="18" height="8" rx="2" fill="#6366f1" stroke="#4f46e5" stroke-width="1.5"/>
    <path d="M6 12v8M10 12v6M14 12v8M18 12v5" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  super_shredder: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon weapon-svg super">
    <rect x="2" y="3" width="20" height="9" rx="2" fill="#a855f7" stroke="#7e22ce" stroke-width="2"/>
    <path d="M5 12v9M9 12v7M13 12v9M17 12v6M21 12v8" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // 5. 패시브 복지 10종 벡터 아이콘
  glasses: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon passive-svg">
    <circle cx="7" cy="13" r="4" stroke="#38bdf8" stroke-width="2" fill="rgba(56, 189, 248, 0.2)"/>
    <circle cx="17" cy="13" r="4" stroke="#38bdf8" stroke-width="2" fill="rgba(56, 189, 248, 0.2)"/>
    <path d="M11 13h2M3 12l2-4M21 12l-2-4" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  desk: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon passive-svg">
    <rect x="3" y="6" width="18" height="4" rx="1" fill="#64748b" stroke="#475569" stroke-width="1.5"/>
    <path d="M5 10v9M19 10v9M14 10v9" stroke="#64748b" stroke-width="2"/>
    <rect x="14" y="12" width="5" height="5" fill="#334155"/>
  </svg>`,

  eyedrop: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon passive-svg">
    <path d="M12 3C12 3 6 10.5 6 15a6 6 0 0012 0c0-4.5-6-12-6-12z" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
    <circle cx="10" cy="14" r="2" fill="#ffffff" opacity="0.6"/>
  </svg>`,

  bankbook: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon passive-svg">
    <rect x="4" y="5" width="16" height="14" rx="2" fill="#10b981" stroke="#059669" stroke-width="1.5"/>
    <path d="M4 9h16M8 14h8" stroke="#ffffff" stroke-width="1.5"/>
  </svg>`,

  headphone: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon passive-svg">
    <path d="M3 14v-3a9 9 0 0118 0v3" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/>
    <rect x="2" y="13" width="4" height="7" rx="2" fill="#f43f5e"/>
    <rect x="18" y="13" width="4" height="7" rx="2" fill="#f43f5e"/>
  </svg>`,

  leave: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon passive-svg">
    <rect x="3" y="4" width="18" height="16" rx="2" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4" stroke="#e11d48" stroke-width="2"/>
    <path d="M12 9v3l2 1" stroke="#e11d48" stroke-width="1.5"/>
  </svg>`,

  timer: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon passive-svg">
    <circle cx="12" cy="13" r="8" stroke="#06b6d4" stroke-width="2" fill="rgba(6, 182, 212, 0.15)"/>
    <path d="M12 9v4l3 2" stroke="#06b6d4" stroke-width="2" stroke-linecap="round"/>
    <path d="M10 2h4M12 2v3" stroke="#06b6d4" stroke-width="2"/>
  </svg>`,

  bonus: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon passive-svg">
    <rect x="3" y="6" width="18" height="12" rx="2" fill="#eab308" stroke="#ca8a04" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="3.5" fill="#fef08a" stroke="#ca8a04" stroke-width="1"/>
    <path d="M12 10.5v3M10.8 12h2.4" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  airpod: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon passive-svg">
    <circle cx="8" cy="8" r="4" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
    <path d="M8 12v7a2 2 0 002 2" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
    <circle cx="16" cy="8" r="4" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
    <path d="M16 12v7a2 2 0 01-2 2" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  badge: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon passive-svg">
    <rect x="4" y="3" width="16" height="18" rx="3" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/>
    <circle cx="12" cy="9" r="3" fill="#ffffff"/>
    <path d="M8 16h8M9 18h6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  // 6. 상점 영구 업그레이드 아이콘
  up_hp: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon shop-svg">
    <circle cx="12" cy="12" r="9" fill="rgba(244,63,94,0.2)" stroke="#f43f5e" stroke-width="2"/>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#f43f5e"/>
  </svg>`,

  up_speed: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon shop-svg">
    <circle cx="12" cy="12" r="9" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" stroke-width="2"/>
    <path d="M4 12h14M15 8l4 4-4 4" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  up_atk: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon shop-svg">
    <circle cx="12" cy="12" r="9" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" stroke-width="2"/>
    <path d="M14.5 4l5.5 5.5-9 9-4-1-1-4 8.5-9.5zM18 7.5L16.5 6" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  up_cd: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon shop-svg">
    <circle cx="12" cy="12" r="9" fill="rgba(168,85,247,0.2)" stroke="#a855f7" stroke-width="2"/>
    <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#a855f7"/>
  </svg>`,

  up_magnet: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon shop-svg">
    <circle cx="12" cy="12" r="9" fill="rgba(16,185,129,0.2)" stroke="#10b981" stroke-width="2"/>
    <path d="M7 6v6a5 5 0 0010 0V6" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,

  up_gold: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon shop-svg">
    <circle cx="12" cy="12" r="9" fill="rgba(234,179,8,0.2)" stroke="#eab308" stroke-width="2"/>
    <circle cx="12" cy="12" r="6" fill="#eab308"/>
    <path d="M10 9v6M10 12h3M10 9h3a1.5 1.5 0 010 3" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  // 7. 업적 아이콘 (Achievements)
  ach_first_clear: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon ach-svg">
    <path d="M8 4h8v7a4 4 0 01-8 0V4z" stroke="#eab308" stroke-width="2" fill="rgba(234, 179, 8, 0.2)"/>
    <path d="M8 6H5a2 2 0 00-2 2v1a3 3 0 003 3h2M16 6h3a2 2 0 012 2v1a3 3 0 01-3 3h-2M12 15v4M9 21h6" stroke="#eab308" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  ach_kills_500: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon ach-svg">
    <path d="M14.5 4l5.5 5.5-9 9-4-1-1-4 8.5-9.5z" stroke="#f43f5e" stroke-width="2" fill="rgba(244, 63, 94, 0.2)"/>
    <path d="M4 20l4-4" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  ach_kills_2000: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon ach-svg">
    <circle cx="12" cy="12" r="8" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" stroke-width="2"/>
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#ef4444" stroke-width="2"/>
  </svg>`,

  ach_gold_1000: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon ach-svg">
    <rect x="3" y="6" width="18" height="12" rx="2" fill="#10b981" stroke="#059669" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="3" fill="#ffffff"/>
  </svg>`,

  ach_gold_5000: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon ach-svg">
    <polygon points="12 2 22 8.5 18 21 6 21 2 8.5" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="12" cy="12" r="3" fill="#38bdf8"/>
  </svg>`,

  ach_super_weapon: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon ach-svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/>
  </svg>`,

  ach_props_20: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon ach-svg">
    <rect x="5" y="4" width="14" height="16" rx="2" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" stroke-width="2"/>
    <circle cx="12" cy="10" r="3" fill="#a855f7"/>
  </svg>`,

  ach_boss_manager: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon ach-svg">
    <circle cx="12" cy="12" r="9" stroke="#f97316" stroke-width="2" fill="rgba(249, 115, 22, 0.2)"/>
    <path d="M9 12h6M12 9v6" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  ach_boss_director: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon ach-svg">
    <rect x="4" y="6" width="16" height="13" rx="2" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" stroke-width="2"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="#ef4444" stroke-width="1.5"/>
  </svg>`,

  ach_boss_ceo: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon ach-svg">
    <polygon points="12,3 15,9 21,8 18,14 20,20 14,18 12,21 10,18 4,20 6,14 3,8 9,9" fill="#ffd700" stroke="#ca8a04" stroke-width="1.5"/>
  </svg>`,

  // 8. 몬스터 / 도감 벡터 아이콘 (Monsters / Bestiary)
  paper: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon monster-svg">
    <rect x="4" y="3" width="16" height="18" rx="2" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <line x1="8" y1="7" x2="16" y2="7" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="8" y1="11" x2="16" y2="11" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="8" y1="15" x2="13" y2="15" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  slime: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon monster-svg">
    <path d="M12 4C7 4 4 8 4 14c0 4 3 6 8 6s8-2 8-6c0-6-3-10-8-10z" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
    <circle cx="9" cy="12" r="1.5" fill="#ffffff"/>
    <circle cx="15" cy="12" r="1.5" fill="#ffffff"/>
  </svg>`,

  copier: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon monster-svg">
    <rect x="4" y="6" width="16" height="13" rx="2" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="7" y="3" width="10" height="3" rx="1" fill="#cbd5e1"/>
    <line x1="7" y1="15" x2="17" y2="15" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  slack: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon monster-svg">
    <rect x="3" y="4" width="18" height="14" rx="3" fill="#e11d48" stroke="#be123c" stroke-width="1.5"/>
    <path d="M8 18l-2 3v-3" stroke="#e11d48" stroke-width="2"/>
    <circle cx="9" cy="11" r="1.5" fill="#ffffff"/>
    <circle cx="15" cy="11" r="1.5" fill="#ffffff"/>
  </svg>`,

  thief: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon monster-svg">
    <circle cx="12" cy="12" r="8.5" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
    <circle cx="9" cy="10" r="1.5" fill="#ffffff"/>
    <circle cx="15" cy="10" r="1.5" fill="#ffffff"/>
    <path d="M8 15s1.5 2 4 2 4-2 4-2" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  boss_manager: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon monster-svg boss">
    <circle cx="12" cy="12" r="9" fill="#f97316" stroke="#c2410c" stroke-width="2"/>
    <circle cx="9" cy="10" r="2" fill="#ffffff"/>
    <circle cx="15" cy="10" r="2" fill="#ffffff"/>
    <path d="M8 15c2-1.5 6-1.5 8 0" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 12v3" stroke="#ffd700" stroke-width="2"/>
  </svg>`,

  boss_director: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon monster-svg boss">
    <circle cx="12" cy="12" r="9" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
    <circle cx="8.5" cy="9.5" r="2" fill="#ffffff"/>
    <circle cx="15.5" cy="9.5" r="2" fill="#ffffff"/>
    <path d="M7 16h10" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    <polygon points="12,2 14,5 10,5" fill="#ffd700"/>
  </svg>`,

  boss_ceo: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon monster-svg boss">
    <circle cx="12" cy="13" r="8.5" fill="#7c3aed" stroke="#5b21b6" stroke-width="2"/>
    <polygon points="12,2 15,7 20,6 18,11 20,15 15,14 12,17 9,14 4,15 6,11 4,6 9,7" fill="#ffd700" stroke="#b45309" stroke-width="1"/>
    <circle cx="9" cy="12" r="1.5" fill="#ffffff"/>
    <circle cx="15" cy="12" r="1.5" fill="#ffffff"/>
  </svg>`,

  // 9. 스테이지 테마 아이콘
  stage_pantry: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon stage-svg">
    <rect x="4" y="4" width="16" height="16" rx="3" fill="rgba(120, 53, 15, 0.2)" stroke="#b45309" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4" fill="#b45309"/>
  </svg>`,

  stage_open_office: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon stage-svg">
    <rect x="3" y="4" width="18" height="16" rx="3" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1.5"/>
    <rect x="6" y="8" width="12" height="8" rx="1.5" stroke="#38bdf8" stroke-width="1.5"/>
  </svg>`,

  stage_meeting_room: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon stage-svg">
    <rect x="3" y="4" width="18" height="16" rx="3" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4" stroke="#f43f5e" stroke-width="1.5"/>
  </svg>`,

  stage_server_room: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon stage-svg">
    <rect x="4" y="3" width="16" height="18" rx="2" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" stroke-width="1.5"/>
    <line x1="7" y1="8" x2="17" y2="8" stroke="#22c55e" stroke-width="2"/>
    <line x1="7" y1="13" x2="17" y2="13" stroke="#22c55e" stroke-width="2"/>
    <line x1="7" y1="18" x2="17" y2="18" stroke="#22c55e" stroke-width="2"/>
  </svg>`,

  stage_executive: `<svg viewBox="0 0 24 24" fill="none" class="svg-icon stage-svg">
    <rect x="3" y="4" width="18" height="16" rx="3" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" stroke-width="1.5"/>
    <polygon points="12,7 14,11 18,10 16,14 18,17 14,16 12,19 10,16 6,17 8,14 6,10 10,11" fill="#ffd700"/>
  </svg>`
};

window.getGameIcon = function(key) {
  if (window.GAME_ICONS && window.GAME_ICONS[key]) {
    return window.GAME_ICONS[key];
  }
  return `<span class="icon-fallback">${key}</span>`;
};
