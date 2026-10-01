// الحالة والحفظ: إنشاء، تعقيم، ترحيل من النسخ القديمة، حفظ آمن بنسخة احتياطية.
import {SAVE_VERSION, PLOTS, MAX_LEVEL, ZONES, TYPES, AS, TECHS, TREE, OPEN_START} from "./data.js";

export const KEY = "kon-empire-v3";
export const BAK = "kon-empire-v3-bak";
const LEGACY = ["kon-empire-v2"];

// مرجع مشترك للحالة الحالية (تُستبدل عند الاستيراد أو إعادة الضبط)
export const G = {S: null};

let store = (typeof localStorage !== "undefined") ? localStorage : null;
export function setStorage(s){ store = s; }

/* ---------- أدوات التحقق ---------- */
export function num(x, min = 0, max = 1e300, def = 0){
  x = Number(x);
  if(!Number.isFinite(x)) return def;
  return x < min ? min : x > max ? max : x;
}
export function int(x, min = 0, max = 1e9, def = 0){
  return Math.floor(num(x, min, max, def));
}
const str = (x, max = 40) => typeof x === "string" ? x.slice(0, max) : "";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function hash(s){                       // FNV-1a 32bit للكشف عن التلف
  let h = 0x811c9dc5;
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}

/* ---------- الإنشاء ---------- */
export function newZones(){
  return ZONES.map((z, i) => ({
    unlocked: i === 0,
    open: Array.from({length: PLOTS}, (_, k) => i === 0 && OPEN_START.includes(k)),
    plots: Array(PLOTS).fill(null)
  }));
}

// calc/tmp خصائص غير قابلة للعد: لا تدخل في JSON ولا في الحفظ
function finalize(S){
  Object.defineProperty(S, "calc", {value: null, writable: true, enumerable: false, configurable: true});
  Object.defineProperty(S, "tmp",  {value: {acc: 0, rpAcc: 0}, writable: true, enumerable: false, configurable: true});
  return S;
}

export function fresh(now = Date.now()){
  return finalize({
    v: SAVE_VERSION,
    coins: 0, total: 0, tier: 0, sold: 0, universeSold: false,
    click: 0, as: AS.map(() => 0), mkt: 0, rp: 0, techs: {},
    zone: 0, zones: newZones(),
    shards: 0, shardsLife: 0, prestiges: 0, tree: {},
    qi: 0, ach: {},
    daily: {key: "", list: []}, weekly: {key: "", list: []},
    login: {last: "", streak: 0},
    set: {music: true, sfx: true, vol: 0.8, vm: 0.5, vs: 0.8, reduce: false, quality: "high"},
    stats: {taps: 0, sales: 0, upgrades: 0, builds: 0, meteors: 0, ads: 0, earned: 0, sessions: 0},
    boost: 0, clockMax: now, savedAt: now
  });
}

/* ---------- التعقيم: أي بيانات تالفة تتحول إلى قيم صالحة ---------- */
function cleanMissions(raw){
  const out = {key: str(raw && raw.key, 20), list: []};
  if(raw && Array.isArray(raw.list)){
    for(const m of raw.list.slice(0, 6)){
      if(!m || typeof m !== "object") continue;
      out.list.push({id: str(m.id, 20), stat: str(m.stat, 20), target: num(m.target, 1, 1e300, 1),
                     base: num(m.base), claimed: !!m.claimed, rew: num(m.rew), rewRp: num(m.rewRp), rewSh: int(m.rewSh, 0, 100)});
    }
  }
  return out;
}

export function sanitize(raw, now = Date.now()){
  if(!raw || typeof raw !== "object") return null;
  const S = fresh(now);
  S.coins = num(raw.coins); S.total = num(raw.total);
  S.tier = int(raw.tier, 0, 10);
  S.sold = int(raw.sold, 0, 1000);
  S.universeSold = !!raw.universeSold;
  S.click = int(raw.click, 0, 1e6);
  S.mkt = int(raw.mkt, 0, 12);
  S.rp = num(raw.rp);
  S.shards = int(raw.shards, 0, 1e9);
  S.shardsLife = int(raw.shardsLife, 0, 1e9);
  S.prestiges = int(raw.prestiges, 0, 1e6);
  S.qi = int(raw.qi, 0, 1000);
  S.boost = num(raw.boost, 0, 3600);
  S.zone = int(raw.zone, 0, ZONES.length - 1);
  S.as = AS.map((_, i) => int(raw.as && raw.as[i], 0, 1e6));
  for(const t of TECHS)  S.techs[t.id] = int(raw.techs && raw.techs[t.id], 0, t.max);
  for(const n of TREE)   S.tree[n.id]  = int(raw.tree && raw.tree[n.id], 0, n.max);

  // المناطق
  ZONES.forEach((_, zi) => {
    const rz = raw.zones && raw.zones[zi], Z = S.zones[zi];
    Z.unlocked = zi === 0 || !!(rz && rz.unlocked);
    if(!Z.unlocked) return;
    Z.open = Array.from({length: PLOTS}, (_, k) => !!(rz && rz.open && rz.open[k]));
    Z.plots = Array.from({length: PLOTS}, (_, k) => {
      const p = rz && rz.plots && rz.plots[k];
      if(!p || typeof p !== "object") return null;
      const t = Math.floor(Number(p.t));
      if(!(t >= 0 && t < TYPES.length)) return null;
      Z.open[k] = true;
      return {t, l: int(p.l, 1, MAX_LEVEL, 1), s: num(p.s)};
    });
    if(!Z.open.some(Boolean)) OPEN_START.forEach(k => Z.open[k] = true);
  });
  if(!S.zones[S.zone].unlocked) S.zone = 0;

  if(raw.ach && typeof raw.ach === "object"){
    let n = 0;
    for(const k of Object.keys(raw.ach)){ if(n++ > 300) break; if(raw.ach[k] === true) S.ach[str(k, 30)] = true; }
  }
  S.daily = cleanMissions(raw.daily);
  S.weekly = cleanMissions(raw.weekly);
  if(raw.login){
    S.login.last = DATE_RE.test(raw.login.last) ? raw.login.last : "";
    S.login.streak = int(raw.login.streak, 0, 10000);
  }
  if(raw.set){
    S.set.music = raw.set.music !== false; S.set.sfx = raw.set.sfx !== false;
    S.set.vol = num(raw.set.vol, 0, 1, 0.8); S.set.vm = num(raw.set.vm, 0, 1, 0.5); S.set.vs = num(raw.set.vs, 0, 1, 0.8);
    S.set.reduce = !!raw.set.reduce;
    S.set.quality = ["low", "medium", "high"].includes(raw.set.quality) ? raw.set.quality : "high";
  }
  if(raw.stats) for(const k of Object.keys(S.stats)) S.stats[k] = num(raw.stats[k]);
  S.stats.earned = Math.max(S.stats.earned, S.total);
  S.savedAt = num(raw.savedAt, 0, 8.64e15, now);
  S.clockMax = Math.max(num(raw.clockMax, 0, 8.64e15, now), S.savedAt);
  return S;
}

/* ---------- الترحيل من النسخ القديمة ---------- */
export function migrate(raw, now = Date.now()){
  if(!raw || typeof raw !== "object") return null;
  if(raw.v === SAVE_VERSION) return sanitize(raw, now);
  if(raw.v > SAVE_VERSION) return null;            // حفظ من نسخة أحدث: لا نلمسه
  // v2 القديمة: لا تحمل رقم نسخة. مصفوفة plots مسطحة (16 عنصرًا) داخل المدينة.
  if(typeof raw.coins === "number" && Array.isArray(raw.plots)){
    const zones = [{unlocked: true, open: Array(PLOTS).fill(true),
      plots: raw.plots.slice(0, PLOTS).map(p => p && typeof p === "object" ? {t: p.t, l: p.l, s: 0} : null)}];
    return sanitize({
      coins: raw.coins, total: raw.total, tier: raw.tier, sold: raw.sold, click: raw.click,
      as: raw.as, mkt: raw.mkt, shards: raw.shards, shardsLife: raw.shards,
      zones, set: {sound: raw.sound}, savedAt: raw.t, stats: {earned: raw.total}
    }, now);
  }
  return null;
}

/* ---------- التغليف والحفظ ---------- */
export function pack(S){
  const d = JSON.stringify(S);
  return JSON.stringify({v: SAVE_VERSION, c: hash(d), d});
}
export function unpack(text, now = Date.now()){
  let outer;
  try{ outer = JSON.parse(text); }catch(e){ return null; }
  if(!outer || typeof outer !== "object") return null;
  if(typeof outer.d === "string"){
    if(hash(outer.d) !== outer.c) return null;      // تالف
    let inner;
    try{ inner = JSON.parse(outer.d); }catch(e){ return null; }
    return migrate(inner, now);
  }
  return migrate(outer, now);                        // حفظ قديم غير مغلّف
}

let lastBackup = 0;
export function save(S, now = Date.now()){
  if(!store) return false;
  S.savedAt = now;
  try{
    const text = pack(S);
    if(now - lastBackup > 60000){
      const cur = store.getItem(KEY);
      if(cur){ store.setItem(BAK, cur); lastBackup = now; }
    }
    store.setItem(KEY, text);
    return true;
  }catch(e){ return false; }
}

// يعيد {S, source, notice}. source: main | backup | legacy | new
export function load(now = Date.now()){
  if(!store) return {S: fresh(now), source: "new", notice: ""};
  let corrupted = false;
  for(const [key, label] of [[KEY, "main"], [BAK, "backup"]]){
    let text = null;
    try{ text = store.getItem(key); }catch(e){}
    if(!text) continue;
    const S = unpack(text, now);
    if(S) return {S, source: label, notice: label === "backup" ? "استُعيد التقدم من النسخة الاحتياطية." : ""};
    corrupted = true;
  }
  for(const key of LEGACY){
    let text = null;
    try{ text = store.getItem(key); }catch(e){}
    if(!text) continue;
    const S = unpack(text, now);
    if(S) return {S, source: "legacy", notice: "تم ترقية حفظك القديم إلى النسخة الجديدة."};
  }
  return {S: fresh(now), source: "new", notice: corrupted ? "تعذّر قراءة الحفظ التالف. بدأنا لعبة جديدة." : ""};
}

/* ---------- التصدير والاستيراد ---------- */
export function exportCode(S){
  return btoa(unescape(encodeURIComponent(pack(S))));
}
export function importCode(code, now = Date.now()){
  try{
    const text = decodeURIComponent(escape(atob(String(code).trim())));
    return unpack(text, now);
  }catch(e){ return null; }
}

export function hardReset(){
  if(!store) return;
  try{ store.removeItem(KEY); store.removeItem(BAK); LEGACY.forEach(k => store.removeItem(k)); }catch(e){}
  lastBackup = 0;
}
