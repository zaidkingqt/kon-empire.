// المحرك: حلقة المنطق، الغياب، الشهب، الأحداث، الحفظ. لا يرسم ولا يعدّل DOM.
import {G, save as saveState, num} from "./state.js";
import * as E from "./economy.js";
import {emit, on} from "./bus.js";
import {check as checkMissions} from "./missions.js";

const STEP = 0.1;               // خطوة المنطق الثابتة بالثواني
const TAP_LIMIT = 12;           // أقصى ضغطات مقبولة بالثانية (حماية من النقر الآلي)
const SAVE_EVERY = 15000;
const METEOR_LIFE = 10;

const tapLog = [];
let acc = 0, slowAcc = 0;
let meteorIn = 60, meteorAlive = 0, eventIn = 1500;
let paused = false, saveTimer = 0, lastSaveOk = true, awayState = null;

export const state = () => G.S;
export const isPaused = () => paused;
export const pause = v => { paused = !!v; };

export function init(S){
  G.S = S;
  E.recalc(S);
  meteorIn = E.meteorDelay(S);
  eventIn = 1500 + Math.random() * 900;
  S.stats.sessions++;
  const now = Date.now();
  S.clockMax = Math.max(S.clockMax, now);
  acc = 0; slowAcc = 0; meteorAlive = 0;
  for(const ev of ["build", "upgrade", "demolish", "plot", "zone", "tech", "tree", "tier", "prestige", "claim"]) on(ev, requestSave);
}

export function replaceState(S){
  G.S = S;
  E.recalc(S);
  S.savedAt = Date.now(); S.clockMax = Math.max(S.clockMax, S.savedAt);
  meteorAlive = 0;
  saveNow();
  emit("state-replaced");
}

/* ---------- الضغط: يرجع القيمة المكتسبة أو -1 إذا رُفض ---------- */
export function tap(now = performance.now()){
  const S = G.S;
  if(paused) return -1;
  while(tapLog.length && now - tapLog[0] > 1000) tapLog.shift();
  if(tapLog.length >= TAP_LIMIT) return -1;
  tapLog.push(now);
  const got = E.tap(S);
  emit("tap", {got});
  return got;
}

/* ---------- الشهاب ---------- */
export const meteorActive = () => meteorAlive > 0;
export function catchMeteor(){
  const S = G.S;
  if(meteorAlive <= 0) return 0;
  meteorAlive = 0;
  const bonus = E.earn(S, E.meteorBonus(S));
  S.stats.meteors++;
  emit("meteor", {bonus});
  return bonus;
}

/* ---------- الغياب ---------- */
// يُستدعى عند الإقلاع وعند العودة للتبويب. يعيد معلومات الغياب أو null.
export function checkAway(now = Date.now()){
  const S = G.S;
  const gap = E.elapsedSince(S, now);
  S.savedAt = now;
  S.clockMax = Math.max(S.clockMax, now);
  if(gap < 3) return null;
  if(gap < 60){ advance(gap); return null; }
  const g = E.awayGain(S, gap);
  if(g.coins <= 0 && g.rp <= 0) return null;
  awayState = {gap, g};
  paused = true;
  emit("away", awayState);
  return awayState;
}
export function claimAway(mult = 1){
  if(!awayState) return 0;
  const {g} = awayState;
  E.applyAway(G.S, g, mult);
  awayState = null; paused = false;
  emit("claim", {kind: "away", mult});
  return g.coins * mult;
}

/* ---------- التقدم ---------- */
function advance(seconds){
  const S = G.S;
  let left = Math.min(seconds, 120), guard = 0;
  while(left > 0 && guard++ < 400){
    const dt = Math.min(1, left);
    E.tick(S, dt); left -= dt;
  }
}

function slowTick(){
  const S = G.S;
  sanity(S);
  if(S.stats.earned > 2000){
    meteorIn -= 1;
    if(meteorIn <= 0){ meteorAlive = METEOR_LIFE; meteorIn = E.meteorDelay(S); emit("meteor-spawn"); }
  }
  if(meteorAlive > 0) meteorAlive = Math.max(0, meteorAlive - 1);
  if(S.total > 1e4){
    eventIn -= 1;
    if(eventIn <= 0){
      eventIn = 1500 + Math.random() * 900;
      E.activateBoost(S, 90);
      emit("event", {name: "golden"});
    }
  }
  checkMissions(S);
}

// أي قيمة غير منتهية أو سالبة تُصلح فورًا حتى لا تكسر الاقتصاد
function sanity(S){
  let bad = false;
  for(const k of ["coins", "total", "rp", "boost"]){
    if(!Number.isFinite(S[k]) || S[k] < 0){ S[k] = 0; bad = true; }
  }
  if(S.coins > S.total && S.total === 0) S.total = S.coins;
  if(!S.calc || !Number.isFinite(S.calc.inc) || !Number.isFinite(S.calc.sps)){ bad = true; }
  if(bad){ E.recalc(S); emit("repair"); }
}

// يُستدعى كل إطار. dt بالثواني من ساعة الأداء (لا تتأثر بتغيير ساعة الهاتف)
export function frame(dt){
  const S = G.S;
  if(paused || !S) return;
  dt = num(dt, 0, 5);
  const now = Date.now();
  if(dt > 3){ checkAway(now); if(paused) return; }
  S.savedAt = now;
  if(now > S.clockMax) S.clockMax = now;
  acc += Math.min(dt, 1);
  let n = 0;
  while(acc >= STEP && n++ < 20){ E.tick(S, STEP); acc -= STEP; }
  slowAcc += dt;
  while(slowAcc >= 1){ slowAcc -= 1; slowTick(); }
}

/* ---------- الحفظ ---------- */
export function saveNow(){
  const S = G.S;
  if(!S) return false;
  clearTimeout(saveTimer); saveTimer = 0;
  const ok = saveState(S, Date.now());
  if(!ok && lastSaveOk) emit("toast", "تعذّر حفظ التقدم على هذا المتصفح. صدّر النسخة من الإعدادات.");
  lastSaveOk = ok;
  return ok;
}
export function requestSave(){
  if(saveTimer) return;
  saveTimer = setTimeout(saveNow, 1500);
}
export function startAutosave(){
  setInterval(() => { if(!paused) saveNow(); }, SAVE_EVERY);
}

/* ---------- Prestige ---------- */
export function doPrestige(){
  const S = G.S;
  const gain = E.prestige(S);
  if(gain > 0) saveNow();
  return gain;
}
