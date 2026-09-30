// 야근 탈출 계정 · 클라우드 저장 API (Cloudflare Pages Functions + D1)
//   POST /api/signup  { username, password }  → { token, username }
//   POST /api/login   { username, password }  → { token, username }
//   POST /api/logout                           (Bearer)
//   GET  /api/me                               (Bearer) → { username }
//   GET  /api/save                             (Bearer) → { data, updatedAt }
//   PUT  /api/save    { data, updatedAt }      (Bearer) → { ok, updatedAt }

const SESSION_DAYS = 30;
const PBKDF2_ITER = 100000;
const MAX_SAVE_BYTES = 256 * 1024;
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;
const USERNAME_RE = /^[A-Za-z0-9_가-힣]{3,16}$/;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});
const fail = (status, error) => json({ error }, status);

const enc = new TextEncoder();
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const fromHex = hex => new Uint8Array(hex.match(/../g).map(h => parseInt(h, 16)));
const randomHex = n => toHex(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async text => toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)));

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: PBKDF2_ITER }, key, 256);
  return toHex(bits);
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// 테이블이 없으면 만든다 (db/schema.sql 과 같은 내용, 인스턴스당 1회)
let schemaReady = null;
function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = db.batch([
      db.prepare('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE COLLATE NOCASE, pw_hash TEXT NOT NULL, pw_salt TEXT NOT NULL, created_at INTEGER NOT NULL)'),
      db.prepare('CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)'),
      db.prepare('CREATE TABLE IF NOT EXISTS saves (user_id INTEGER PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL)'),
      db.prepare('CREATE TABLE IF NOT EXISTS login_fails (key TEXT NOT NULL, at INTEGER NOT NULL)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_login_fails ON login_fails(key, at)')
    ]).catch(e => { schemaReady = null; throw e; });
  }
  return schemaReady;
}

async function readBody(request) {
  try { return await request.json(); } catch (e) { return null; }
}

async function tooManyFails(db, keys) {
  const since = Date.now() - FAIL_WINDOW_MS;
  for (const key of keys) {
    const row = await db.prepare('SELECT COUNT(*) AS n FROM login_fails WHERE key = ? AND at > ?').bind(key, since).first();
    if (row && row.n >= MAX_FAILS) return true;
  }
  return false;
}

async function recordFail(db, keys) {
  const now = Date.now();
  await db.batch([
    ...keys.map(key => db.prepare('INSERT INTO login_fails (key, at) VALUES (?, ?)').bind(key, now)),
    db.prepare('DELETE FROM login_fails WHERE at < ?').bind(now - FAIL_WINDOW_MS)
  ]);
}

async function createSession(db, userId) {
  const token = randomHex(32);
  const now = Date.now();
  await db.batch([
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), userId, now + SESSION_DAYS * 86400000),
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now)
  ]);
  return token;
}

async function authUser(db, request) {
  const m = (request.headers.get('Authorization') || '').match(/^Bearer ([0-9a-f]{64})$/);
  if (!m) return null;
  const tokenHash = await sha256(m[1]);
  const row = await db.prepare(
    'SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  ).bind(tokenHash, Date.now()).first();
  return row ? { ...row, tokenHash } : null;
}

function readCredentials(body) {
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!USERNAME_RE.test(username)) return { error: '아이디는 3~16자 한글·영문·숫자·_ 만 쓸 수 있어요.' };
  if (password.length < 6 || password.length > 64) return { error: '비밀번호는 6~64자로 정해 주세요.' };
  return { username, password };
}

async function signup(db, request, ip) {
  const cred = readCredentials(await readBody(request));
  if (cred.error) return fail(400, cred.error);
  const ipKey = 'signup:' + ip;
  if (await tooManyFails(db, [ipKey])) return fail(429, '가입 시도가 너무 많아요. 잠시 후 다시 해 주세요.');
  const exists = await db.prepare('SELECT id FROM users WHERE username = ?').bind(cred.username).first();
  if (exists) return fail(409, '이미 쓰고 있는 아이디예요.');
  const salt = randomHex(16);
  const hash = await hashPassword(cred.password, salt);
  const res = await db.prepare('INSERT INTO users (username, pw_hash, pw_salt, created_at) VALUES (?, ?, ?, ?)')
    .bind(cred.username, hash, salt, Date.now()).run();
  await recordFail(db, [ipKey]); // 가입 횟수도 같은 창에서 제한
  const token = await createSession(db, res.meta.last_row_id);
  return json({ token, username: cred.username });
}

async function login(db, request, ip) {
  const cred = readCredentials(await readBody(request));
  if (cred.error) return fail(400, '아이디 또는 비밀번호가 맞지 않아요.');
  const keys = ['user:' + cred.username.toLowerCase(), 'ip:' + ip];
  if (await tooManyFails(db, keys)) return fail(429, '로그인 실패가 너무 많아요. 15분 뒤에 다시 해 주세요.');
  const user = await db.prepare('SELECT id, username, pw_hash, pw_salt FROM users WHERE username = ?').bind(cred.username).first();
  const hash = await hashPassword(cred.password, user ? user.pw_salt : '00'.repeat(16));
  if (!user || !safeEqual(hash, user.pw_hash)) {
    await recordFail(db, keys);
    return fail(401, '아이디 또는 비밀번호가 맞지 않아요.');
  }
  const token = await createSession(db, user.id);
  return json({ token, username: user.username });
}

async function putSave(db, request, user) {
  const body = await readBody(request);
  if (!body || typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) return fail(400, '저장 데이터 형식이 올바르지 않아요.');
  const text = JSON.stringify(body.data);
  if (text.length > MAX_SAVE_BYTES) return fail(413, '저장 데이터가 너무 커요.');
  const updatedAt = Number.isFinite(body.updatedAt) ? Math.floor(body.updatedAt) : Date.now();
  await db.prepare(
    'INSERT INTO saves (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at'
  ).bind(user.id, text, updatedAt).run();
  return json({ ok: true, updatedAt });
}

export async function onRequest({ request, env, params }) {
  const db = env.DB;
  if (!db) return fail(503, '서버 저장소가 연결되지 않았어요.');
  const route = (params.path || []).join('/');
  const method = request.method;
  const ip = request.headers.get('CF-Connecting-IP') || 'local';

  try {
    await ensureSchema(db);
    if (route === 'signup' && method === 'POST') return await signup(db, request, ip);
    if (route === 'login' && method === 'POST') return await login(db, request, ip);

    const user = await authUser(db, request);
    if (['logout', 'me', 'save'].includes(route) && !user) return fail(401, '로그인이 필요해요.');

    if (route === 'logout' && method === 'POST') {
      await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(user.tokenHash).run();
      return json({ ok: true });
    }
    if (route === 'me' && method === 'GET') return json({ username: user.username });
    if (route === 'save' && method === 'GET') {
      const row = await db.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?').bind(user.id).first();
      return json(row ? { data: JSON.parse(row.data), updatedAt: row.updated_at } : { data: null, updatedAt: 0 });
    }
    if (route === 'save' && method === 'PUT') return await putSave(db, request, user);
    return fail(404, '없는 주소예요.');
  } catch (e) {
    return fail(500, '서버 오류가 났어요. 잠시 후 다시 해 주세요.');
  }
}
