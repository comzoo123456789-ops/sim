// Office Escape Survivor - 계정 · 클라우드 저장 (functions/api 와 통신)
// 로그인하면 진행(SaveManager.data)이 바뀔 때마다 몇 초 뒤 서버에 올리고,
// 다른 기기에서 접속하면 더 최근 저장을 받아온다.

class AccountManager {
  constructor(saveMgr) {
    this.saveMgr = saveMgr;
    this.STORAGE_KEY = 'office_survivor_account';
    this.OWNER_KEY = 'office_survivor_owner'; // 이 기기의 로컬 진행이 어느 계정 것인지
    this.token = null;
    this.username = null;
    this.status = 'guest'; // guest | syncing | synced | pending | offline | error
    this.lastSyncAt = 0;
    this.uploadTimer = null;
    this.pendingChoice = null;
    this.mode = 'login';

    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || 'null');
      if (saved && saved.token) {
        this.token = saved.token;
        this.username = saved.username;
      }
    } catch (e) { /* 손상된 값은 무시 */ }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush(true);
    });
  }

  get loggedIn() { return !!this.token; }

  // ---------- 서버 통신 ----------
  async api(method, path, body, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = 'Bearer ' + this.token;
    let res;
    try {
      res = await fetch('/api/' + path, { method, headers, body: body ? JSON.stringify(body) : undefined, keepalive: !!opts.keepalive });
    } catch (e) {
      const err = new Error('서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.');
      err.offline = true;
      throw err;
    }
    let data = {};
    try { data = await res.json(); } catch (e) { /* 빈 응답 */ }
    if (!res.ok) {
      const err = new Error(data.error || `요청 실패 (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  persist() {
    try {
      if (this.token) localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ token: this.token, username: this.username }));
      else localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) { /* 저장소 막힘 */ }
  }

  owner() {
    try { return localStorage.getItem(this.OWNER_KEY); } catch (e) { return null; }
  }

  setOwner(name) {
    try {
      if (name) localStorage.setItem(this.OWNER_KEY, name);
      else localStorage.removeItem(this.OWNER_KEY);
    } catch (e) { /* 저장소 막힘 */ }
  }

  // ---------- 시작 시 동기화 ----------
  async start() {
    this.bindUi();
    this.renderBadge();
    if (!this.loggedIn) return;
    this.setStatus('syncing');
    try {
      const cloud = await this.api('GET', 'save');
      const local = this.saveMgr.data;
      if (!cloud.data) {
        await this.upload();
      } else if ((cloud.updatedAt || 0) > (local.updatedAt || 0)) {
        this.adopt(cloud.data, cloud.updatedAt);
      } else if ((local.updatedAt || 0) > (cloud.updatedAt || 0)) {
        await this.upload();
      } else {
        this.lastSyncAt = Date.now();
        this.setStatus('synced');
      }
    } catch (e) {
      if (e.status === 401) this.dropSession();
      else this.setStatus(e.offline ? 'offline' : 'error');
    }
  }

  // ---------- 가입 · 로그인 · 로그아웃 ----------
  async signIn(mode, username, password) {
    const data = await this.api('POST', mode === 'signup' ? 'signup' : 'login', { username, password });
    this.token = data.token;
    this.username = data.username;
    this.persist();
    this.setStatus('syncing');
    return this.afterSignIn();
  }

  // 로그인 직후: 계정 저장과 이 기기 진행 중 무엇을 쓸지 결정
  async afterSignIn() {
    const cloud = await this.api('GET', 'save');
    const local = this.saveMgr.data;
    const owner = this.owner();
    const localIsMine = owner && owner.toLowerCase() === this.username.toLowerCase();
    const localIsGuest = !owner;

    if (!cloud.data) {
      // 새 계정: 손님으로 하던 진행은 계정으로 옮기고, 다른 계정 진행이면 새로 시작
      if (localIsGuest || localIsMine) await this.upload();
      else { this.adopt(JSON.parse(JSON.stringify(this.saveMgr.defaults)), Date.now()); await this.upload(); }
      return 'uploaded';
    }
    if (localIsMine) {
      if ((cloud.updatedAt || 0) >= (local.updatedAt || 0)) this.adopt(cloud.data, cloud.updatedAt);
      else await this.upload();
      return 'synced';
    }
    if (localIsGuest && SaveManager.hasProgress(local)) {
      // 손님 진행도 있고 계정 저장도 있으면 사용자에게 고르게 한다
      this.pendingChoice = cloud;
      return 'choose';
    }
    this.adopt(cloud.data, cloud.updatedAt);
    return 'loaded';
  }

  async resolveChoice(useCloud) {
    const cloud = this.pendingChoice;
    this.pendingChoice = null;
    if (!cloud) return;
    if (useCloud) this.adopt(cloud.data, cloud.updatedAt);
    else await this.upload();
  }

  async logout() {
    await this.flush();
    try { await this.api('POST', 'logout'); } catch (e) { /* 이미 만료돼도 로컬은 정리 */ }
    this.dropSession();
  }

  dropSession() {
    clearTimeout(this.uploadTimer);
    this.token = null;
    this.username = null;
    this.persist();
    this.setStatus('guest');
  }

  // ---------- 저장 올리기 · 받기 ----------
  scheduleUpload() {
    if (!this.loggedIn || this.pendingChoice) return;
    this.setStatus('pending');
    clearTimeout(this.uploadTimer);
    this.uploadTimer = setTimeout(() => this.upload().catch(() => {}), 2500);
  }

  async flush(keepalive = false) {
    if (!this.loggedIn || this.status !== 'pending') return;
    clearTimeout(this.uploadTimer);
    try { await this.upload(keepalive); } catch (e) { /* 다음 저장 때 다시 시도 */ }
  }

  async upload(keepalive = false) {
    if (!this.loggedIn) return;
    clearTimeout(this.uploadTimer);
    const data = this.saveMgr.data;
    if (!data.updatedAt) data.updatedAt = Date.now();
    this.setStatus('syncing');
    try {
      await this.api('PUT', 'save', { data, updatedAt: data.updatedAt }, { keepalive });
      this.setOwner(this.username);
      this.lastSyncAt = Date.now();
      this.setStatus('synced');
    } catch (e) {
      if (e.status === 401) this.dropSession();
      else this.setStatus(e.offline ? 'offline' : 'error');
      throw e;
    }
  }

  adopt(data, updatedAt) {
    this.saveMgr.applyData({ ...data, updatedAt: updatedAt || data.updatedAt || 0 });
    this.saveMgr.applyTestUnlock();
    this.saveMgr.save(false);
    this.setOwner(this.username);
    this.lastSyncAt = Date.now();
    this.setStatus('synced');
    if (window.game && typeof window.game.refreshLobby === 'function') window.game.refreshLobby();
  }

  // ---------- 화면 ----------
  setStatus(status) {
    this.status = status;
    this.renderBadge();
    if (this.el('accountModal') && this.el('accountModal').classList.contains('active')) this.renderPanel();
  }

  el(id) { return document.getElementById(id); }

  statusText() {
    switch (this.status) {
      case 'syncing': return '저장 중…';
      case 'pending': return '곧 저장돼요';
      case 'synced': return '클라우드에 저장됨';
      case 'offline': return '오프라인 · 연결되면 저장돼요';
      case 'error': return '저장 실패 · 다시 시도해 주세요';
      default: return '손님으로 플레이 중';
    }
  }

  renderBadge() {
    const btn = this.el('btnAccount');
    if (!btn) return;
    btn.dataset.status = this.loggedIn ? this.status : 'guest';
    this.el('accountBadgeName').textContent = this.loggedIn ? this.username : '로그인';
    btn.title = this.loggedIn ? `${this.username} · ${this.statusText()}` : '로그인하고 진행을 클라우드에 저장';
  }

  open() {
    this.renderPanel();
    this.el('accountModal').classList.add('active');
  }

  close() {
    this.el('accountModal').classList.remove('active');
  }

  renderPanel() {
    const guest = this.el('accountGuestView');
    const user = this.el('accountUserView');
    const choose = this.el('accountChooseView');
    guest.hidden = this.loggedIn;
    user.hidden = !this.loggedIn || !!this.pendingChoice;
    choose.hidden = !this.pendingChoice;
    if (!this.loggedIn) {
      guest.hidden = false;
      const signup = this.mode === 'signup';
      this.el('accountTabLogin').classList.toggle('active', !signup);
      this.el('accountTabSignup').classList.toggle('active', signup);
      this.el('accountPassword2Row').hidden = !signup;
      this.el('accountPassword').autocomplete = signup ? 'new-password' : 'current-password';
      this.el('btnAccountSubmit').textContent = signup ? '가입하고 저장 시작' : '로그인';
      return;
    }
    if (this.pendingChoice) {
      this.el('accountChooseLocal').innerHTML = this.summaryHtml(this.saveMgr.data);
      this.el('accountChooseCloud').innerHTML = this.summaryHtml(this.pendingChoice.data, this.pendingChoice.updatedAt);
      return;
    }
    this.el('accountUserName').textContent = this.username;
    const st = this.el('accountSyncStatus');
    st.textContent = this.statusText();
    st.dataset.status = this.status;
    const s = SaveManager.summary(this.saveMgr.data);
    this.el('accountUserSummary').innerHTML = this.summaryHtml(this.saveMgr.data, s.updatedAt);
  }

  summaryHtml(data, updatedAt) {
    const s = SaveManager.summary(data);
    const when = updatedAt || s.updatedAt;
    const time = when ? new Date(when).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '기록 없음';
    return `<div class="acc-sum-row"><span>클리어</span><b>${s.cleared}스테이지 · ★${s.stars}</b></div>`
      + `<div class="acc-sum-row"><span>보유 코인</span><b>${s.gold.toLocaleString()}</b></div>`
      + `<div class="acc-sum-row"><span>출근 횟수</span><b>${s.runs}회</b></div>`
      + `<div class="acc-sum-row"><span>마지막 저장</span><b>${time}</b></div>`;
  }

  showError(msg) {
    const e = this.el('accountError');
    e.textContent = msg || '';
    e.hidden = !msg;
  }

  async submit() {
    const username = this.el('accountUsername').value.trim();
    const password = this.el('accountPassword').value;
    if (this.mode === 'signup' && password !== this.el('accountPassword2').value) {
      this.showError('비밀번호가 서로 달라요.');
      return;
    }
    const btn = this.el('btnAccountSubmit');
    btn.disabled = true;
    this.showError('');
    try {
      const result = await this.signIn(this.mode, username, password);
      this.el('accountPassword').value = '';
      this.el('accountPassword2').value = '';
      this.renderPanel();
      if (result !== 'choose') this.toast(this.mode === 'signup' ? '가입 완료! 이제 진행이 자동 저장돼요.' : `${this.username}님, 저장을 불러왔어요.`);
    } catch (e) {
      if (this.token && !this.username) this.dropSession();
      this.showError(e.message);
    } finally {
      btn.disabled = false;
    }
  }

  toast(msg) {
    const t = this.el('accountToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  bindUi() {
    if (this.bound) return;
    this.bound = true;
    const on = (id, fn) => { const n = this.el(id); if (n) n.addEventListener('click', fn); };
    on('btnAccount', () => this.open());
    on('btnAccountClose', () => this.close());
    on('btnAccountClose2', () => this.close());
    on('accountTabLogin', () => { this.mode = 'login'; this.showError(''); this.renderPanel(); });
    on('accountTabSignup', () => { this.mode = 'signup'; this.showError(''); this.renderPanel(); });
    on('btnAccountSyncNow', async () => {
      try { await this.upload(); this.toast('저장했어요.'); } catch (e) { this.toast(e.message); }
    });
    on('btnAccountLogout', async () => { await this.logout(); this.renderPanel(); this.toast('로그아웃했어요. 이 기기 진행은 그대로 남아요.'); });
    on('btnAccountUseCloud', async () => { await this.resolveChoice(true); this.renderPanel(); this.toast('계정 저장을 불러왔어요.'); });
    on('btnAccountUseLocal', async () => {
      try { await this.resolveChoice(false); this.toast('이 기기 진행을 계정에 저장했어요.'); } catch (e) { this.toast(e.message); }
      this.renderPanel();
    });
    const form = this.el('accountForm');
    if (form) form.addEventListener('submit', e => { e.preventDefault(); this.submit(); });
    const overlay = this.el('accountModal');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay && !this.pendingChoice) this.close(); });
  }
}

window.AccountManager = AccountManager;
window.account = new AccountManager(window.saveMgr);
