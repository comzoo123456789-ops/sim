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
