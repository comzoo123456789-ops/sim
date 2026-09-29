// Office Escape Survivor - Sprite Asset Loader & Tint Cache (Kenney.nl CC0 assets)
// 모든 스프라이트는 로드 전/실패 시 기존 벡터 렌더링으로 폴백합니다.

class AssetManager {
  constructor() {
    this.base = 'assets/kenney/';
    this.images = {};
    this.tintCache = {};

    const frames = (dir, n) => Array.from({ length: n }, (_, i) => [`${dir}${i}`, `${dir}/${i}.png`]);
    const named = (dir, names) => names.map(n => [`${dir}_${n}`, `${dir}/${n}.png`]);

    this.load([
      ...named('fx', ['spark', 'burst', 'ring', 'ring_soft', 'glow', 'magic', 'slash', 'trace', 'twirl', 'smoke', 'muzzle', 'scorch', 'flare', 'spark_bolt']),
      ...frames('explosion', 9),
      ...frames('puff', 9),
      ...frames('splat', 8),
      ...named('emote', ['anger', 'exclamation', 'exclamations', 'heart', 'star', 'stars', 'cash', 'faceAngry', 'swirl', 'drops', 'alert']),
      ...named('item', ['aid_kit', 'receipt', 'briefcase', 'tumbler', 'mug', 'keyboard', 'monitor', 'monitor_wide', 'pc_tower', 'document', 'memo', 'id_card', 'headphone', 'lanyard', 'wallet', 'pointer', 'cash', 'folder', 'pill'])
    ]);

    // 오피스 소품 + 캐릭터 아틀라스 (assets/sprites/office_atlas.js 에서 프레임 정보 로드)
    this.atlasMeta = window.OFFICE_ATLAS || { frames: {} };
    this.atlasUrl = 'assets/sprites/office_atlas.png';
    this.atlas = new Image();
    this.atlas.src = this.atlasUrl;
  }

  atlasReady() {
    return this.atlas.complete && this.atlas.naturalWidth > 0;
  }

  hasSprite(key) {
    return !!this.atlasMeta.frames[key];
  }

  // 아틀라스 스프라이트를 앵커(발/바닥 접점) 기준으로 그림. 성공 시 true
  drawSprite(ctx, key, x, y, scale = 1, opts = {}) {
    const f = this.atlasMeta.frames[key];
    if (!f || !this.atlasReady()) return false;
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
    ctx.translate(x, y);
    if (opts.rot) ctx.rotate(opts.rot);
    ctx.scale(opts.flip ? -scale : scale, scale * (opts.squash || 1));
    ctx.drawImage(this.atlas, f.x, f.y, f.w, f.h, -f.ax, -f.ay, f.w, f.h);
    if (opts.flash) {
      // 피격 백색 플래시: 같은 스프라이트를 밝게 한 번 더
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha *= opts.flash;
      ctx.drawImage(this.atlas, f.x, f.y, f.w, f.h, -f.ax, -f.ay, f.w, f.h);
    }
    ctx.restore();
    return true;
  }

  // UI(HTML)용 스프라이트: CSS 배경으로 아틀라스 일부를 표시. crop: 'head'(상단) | 'full'
  spriteHtml(key, box = 64, crop = 'full', extraClass = '') {
    const f = this.atlasMeta.frames[key];
    if (!f) return '';
    const cropH = crop === 'head' ? f.h * 0.62 : f.h;
    const s = box / Math.max(f.w, cropH);
    const W = this.atlasMeta.width * s;
    const H = this.atlasMeta.height * s;
    const offY = crop === 'head' ? f.h * 0.02 : 0;
    return `<span class="sprite-ui ${extraClass}" style="width:${(f.w * s).toFixed(1)}px;height:${(cropH * s).toFixed(1)}px;` +
      `background-image:url(${this.atlasUrl});background-size:${W.toFixed(1)}px ${H.toFixed(1)}px;` +
      `background-position:${(-f.x * s).toFixed(1)}px ${(-(f.y + offY) * s).toFixed(1)}px"></span>`;
  }

  load(entries) {
    entries.forEach(([key, file]) => {
      const img = new Image();
      img.src = this.base + file;
      this.images[key] = img;
    });
  }

  // 로드 완료된 이미지만 반환 (미로드 시 null → 호출부에서 벡터 폴백)
  get(key) {
    const img = this.images[key];
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  }

  url(key) {
    const img = this.images[key];
    return img ? img.src : '';
  }

  // 흑백 파티클을 지정 색으로 틴트한 오프스크린 캔버스 (그라데이션 유지)
  tinted(key, color) {
    const img = this.get(key);
    if (!img) return null;
    if (!color) return img;
    const cacheKey = key + '|' + color;
    if (this.tintCache[cacheKey]) return this.tintCache[cacheKey];

    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(img, 0, 0);
    this.tintCache[cacheKey] = c;
    return c;
  }

  // 중심 기준 스프라이트 그리기. 성공 시 true (폴백 판단용)
  draw(ctx, key, x, y, w, h, opts = {}) {
    const src = opts.color ? this.tinted(key, opts.color) : this.get(key);
    if (!src) return false;
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha *= Math.max(0, Math.min(1, opts.alpha));
    if (opts.blend) ctx.globalCompositeOperation = opts.blend;
    ctx.translate(x, y);
    if (opts.rot) ctx.rotate(opts.rot);
    ctx.drawImage(src, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  // UI(HTML)용 아이템 아이콘 태그
  iconHtml(key, extraClass = '') {
    return `<img src="${this.base}item/${key}.png" class="svg-icon item-icon ${extraClass}" alt="" draggable="false">`;
  }
}

window.assets = new AssetManager();
