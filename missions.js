// المهام: سلسلة إرشادية (هي نفسها الـ Tutorial)، يوميات، أسبوعيات، مكافأة الدخول، الإنجازات.
import {TYPES, T, ZONES, ITEMS, TECHS, TREE} from "./data.js";
import {emit} from "./bus.js";
import {recalc} from "./economy.js";
import {fmt} from "./util.js";

const BIG = 1e300;
const sum = a => a.reduce((x, y) => x + y, 0);
const maxLevel = S => { let m = 0; for(const Z of S.zones) for(const p of Z.plots) if(p && p.l > m) m = p.l; return m; };
const openPlots = S => sum(S.zones.map(Z => Z.open.filter(Boolean).length));
const techLevels = S => sum(Object.values(S.techs));
const treeLevels = S => sum(Object.values(S.tree));

// المكافآت تُضاف للرصيد فقط ولا تُحسب من الأرباح (لا تفتح فئات ولا ترفع الشظايا)
export function grant(S, coins, rp = 0, shards = 0){
  S.coins = Math.min(BIG, S.coins + Math.max(0, coins || 0));
  S.rp = Math.min(BIG, S.rp + Math.max(0, rp || 0));
  if(shards > 0){ S.shards += shards; S.shardsLife += shards; recalc(S); }
}
const incSecs = (S, secs, min) => Math.ceil(Math.max(min, (S.calc ? S.calc.inc : 0) * secs));

/* ---------- المهام الإرشادية ---------- */
// hint: sell | plot | tab:up | tab:city | tab:uni | zone | none  (تلميح بصري نابض)
const q = (id, text, hint, cur, target, secs, min) => ({id, text, hint, cur, target, secs, min});
export const QUESTS = [
  q("tap",    "بع 10 مرات: اضغط زر البيع",                  "sell",     S => S.stats.taps, 10, 0, 15),
  q("build",  "ابنِ كشك ماء: اضغط قطعة فارغة ثم ابنِ",      "plot",     S => S.calc.built, 1, 0, 25),
  q("lv3",    "ارفع مبناك إلى المستوى 3",                   "tab:city", S => maxLevel(S), 3, 0, 40),
  q("click",  "اشترِ «يد أسرع» من تبويب ترقيات",            "tab:up",   S => S.click, 1, 0, 80),
  q("assist", "وظّف مساعدًا ليبيع عنك تلقائيًا",             "tab:up",   S => sum(S.as), 1, 0, 120),
  q("e200",   "اكسب 200 🪙 لتفتح مزرعة الدجاج",              "none",     S => S.stats.earned, 200, 0, 0),
  q("chick",  "ابنِ مزرعة الدجاج: تعزّز الماء بالتناغم",     "plot",     S => S.calc.lv[T.chick], 1, 20, 150),
  q("lv10",   "ارفع مبنى إلى المستوى 10: ينتج ×2",           "tab:city", S => maxLevel(S), 10, 60, 300),
  q("b4",     "املأ 4 قطع بمبانٍ",                           "plot",     S => S.calc.built, 4, 90, 500),
  q("e5k",    "اكسب 5K 🪙",                                  "none",     S => S.stats.earned, 5000, 0, 0),
  q("cats",   "ابنِ مقهى القطط",                             "plot",     S => S.calc.lv[T.cats], 1, 120, 800),
  q("storage","ابنِ مخزن الإمبراطورية: أول مبنى مساند",      "plot",     S => S.calc.lv[T.storage], 1, 150, 1500),
  q("lv25",   "ارفع مبنى إلى المستوى 25",                    "tab:city", S => maxLevel(S), 25, 240, 3000),
  q("plot",   "افتح قطعة أرض جديدة (اضغط قطعة مقفلة)",       "none",     S => openPlots(S), 5, 200, 4000),
  q("tier3",  "بع حتى تختفي 3 فئات من الكون",                "tab:uni",  S => S.tier, 3, 300, 5000),
  q("lab",    "ابنِ مختبر الأبحاث لتنتج نقاط بحث",           "plot",     S => S.calc.lv[T.research], 1, 300, 20000),
  q("tech",   "اشترِ أول تقنية بنقاط البحث",                 "tab:up",   S => techLevels(S), 1, 400, 50000),
  q("mkt3",   "ارفع التسويق إلى المستوى 3",                  "tab:up",   S => S.mkt, 3, 500, 100000),
  q("tier6",  "اجعل 6 فئات تختفي من الكون",                  "tab:uni",  S => S.tier, 6, 600, 400000),
  q("planet", "افتح الكوكب: اضغط 🪐 فوق المدينة",             "zone",     S => S.zones[1].unlocked ? 1 : 0, 1, 900, 1e6),
  q("tier10", "صِل إلى فئة «الكون» وبعها",                    "tab:uni",  S => S.tier >= ITEMS.length - 1 && S.sold >= 1 ? 1 : 0, 1, 1200, 1e7),
  q("pres",   "نفّذ أول Prestige: بع الكون",                 "tab:uni",  S => S.prestiges, 1, 1800, 1e7),
  q("tree",   "اشترِ أول تطوير من شجرة الشظايا",             "tab:uni",  S => treeLevels(S), 1, 1800, 1e7)
];

export function currentQuest(S){
  const qq = QUESTS[S.qi];
  if(!qq) return null;
  const cur = Math.max(0, qq.cur(S)), done = cur >= qq.target;
  return {q: qq, cur: Math.min(cur, qq.target), target: qq.target, done, reward: incSecs(S, qq.secs, qq.min)};
}
export function claimQuest(S){
  const c = currentQuest(S);
  if(!c || !c.done) return 0;
  grant(S, c.reward);
  S.qi++;
  emit("claim", {kind: "quest", reward: c.reward, id: c.q.id});
  return c.reward;
}

/* ---------- التاريخ: يُحسب من ساعة لا ترجع للخلف ---------- */
const pad = n => (n < 10 ? "0" : "") + n;
export const dayKey = ms => { const d = new Date(ms); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const dayNum = key => { const [y, m, d] = key.split("-").map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 86400000); };
const nowMs = S => Math.max(Date.now(), S.clockMax || 0);
const weekKey = key => "W" + Math.floor((dayNum(key) + 3) / 7);

function rng(seed){                     // mulberry32: نفس اليوم = نفس المهام
  let a = 0;
  for(let i = 0; i < seed.length; i++) a = (Math.imul(a, 31) + seed.charCodeAt(i)) | 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const DAILY = [
  {stat: "taps",     text: n => "اضغط البيع " + n + " مرة",        target: S => 120},
  {stat: "sales",    text: n => "أتمّ " + n + " عملية بيع",         target: S => 250},
  {stat: "upgrades", text: n => "نفّذ " + n + " ترقية",             target: S => 15},
  {stat: "builds",   text: n => "ابنِ " + n + " مبانٍ",             target: S => 2},
  {stat: "meteors",  text: n => "اصطد " + n + " شهابًا ذهبيًا",     target: S => 1},
  {stat: "earned",   text: n => "اكسب " + fmt(n) + " 🪙",            target: S => Math.max(3000, S.calc.inc * 900)}
];
const WEEKLY = [
  {stat: "earned",   text: n => "اكسب " + fmt(n) + " 🪙 هذا الأسبوع", target: S => Math.max(2e5, S.calc.inc * 3 * 3600), shards: 1},
  {stat: "upgrades", text: n => "نفّذ " + n + " ترقية هذا الأسبوع",    target: S => 150, shards: 0}
];
export const missionText = m => {
  const def = [...DAILY, ...WEEKLY].find(d => d.stat === m.stat);
  return def ? def.text(Math.floor(m.target)) : m.stat;
};
export const missionProgress = (S, m) => {
  const cur = Math.max(0, (S.stats[m.stat] || 0) - m.base);
  return {cur: Math.min(cur, m.target), target: m.target, done: cur >= m.target};
};

function genDaily(S, key){
  const r = rng(key), pool = DAILY.slice();
  const list = [];
  for(let i = 0; i < 3; i++){
    const d = pool.splice(Math.floor(r() * pool.length), 1)[0];
    list.push({id: d.stat + i, stat: d.stat, target: Math.floor(d.target(S)), base: S.stats[d.stat] || 0, claimed: false,
               rew: incSecs(S, 400, 300), rewRp: i === 2 ? incSecs({calc: {inc: S.calc.rps}}, 300, 0) : 0, rewSh: 0});
  }
  return {key, list};
}
function genWeekly(S, key){
  return {key, list: WEEKLY.map((w, i) => ({id: "w" + i, stat: w.stat, target: Math.floor(w.target(S)), base: S.stats[w.stat] || 0,
            claimed: false, rew: incSecs(S, 1800, 2000), rewRp: 0, rewSh: w.shards}))};
}

export function claimMission(S, kind, idx){
  const set = kind === "weekly" ? S.weekly : S.daily;
  const m = set.list[idx];
  if(!m || m.claimed || !missionProgress(S, m).done) return false;
  m.claimed = true;
  grant(S, m.rew, m.rewRp, m.rewSh);
  emit("claim", {kind, id: m.id});
  return true;
}

/* ---------- مكافأة الدخول اليومي (7 أيام) ---------- */
const LOGIN_SECS = [300, 600, 900, 1500, 2400, 3600, 5400];
const LOGIN_BOOST = [0, 0, 300, 0, 0, 600, 900];
export function loginInfo(S){
  const today = dayKey(nowMs(S)), last = S.login.last;
  let can = last !== today, streak = S.login.streak;
  if(can){
    if(last && dayNum(today) < dayNum(last)) can = false;             // الساعة رجعت للخلف
    else streak = last && dayNum(today) - dayNum(last) === 1 ? streak + 1 : 1;
  }
  const i = ((can ? streak : S.login.streak) - 1 + 7) % 7;
  return {can, streak: can ? streak : S.login.streak, day: Math.max(0, i), coins: incSecs(S, LOGIN_SECS[Math.max(0, i)], 200 * (i + 1)),
          boost: LOGIN_BOOST[Math.max(0, i)], shard: i === 6 ? 1 : 0, today};
}
export function claimLogin(S, activateBoost){
  const L = loginInfo(S);
  if(!L.can) return false;
  S.login.last = L.today; S.login.streak = L.streak;
  grant(S, L.coins, 0, L.shard);
  if(L.boost > 0 && activateBoost) activateBoost(S, L.boost);
  emit("claim", {kind: "login", streak: L.streak});
  return L;
}

/* ---------- الإنجازات: كل إنجاز +1% للدخل والبيع ---------- */
const a = (id, em, name, desc, test) => ({id, em, name, desc, test});
export const ACH = [
  a("b1",    "🏗️", "أول مبنى",          "ابنِ أول مبنى",                    S => S.stats.builds >= 1),
  a("b10",   "🏘️", "مطوّر عقاري",       "ابنِ 10 مبانٍ",                    S => S.stats.builds >= 10),
  a("b50",   "🏙️", "مهندس مدن",         "ابنِ 50 مبنى",                     S => S.stats.builds >= 50),
  a("t100",  "👆", "بائع نشيط",         "اضغط 100 مرة",                     S => S.stats.taps >= 100),
  a("t1k",   "🖐️", "يد من ذهب",         "اضغط 1000 مرة",                    S => S.stats.taps >= 1000),
  a("t10k",  "💪", "أسطورة النقر",      "اضغط 10000 مرة",                   S => S.stats.taps >= 10000),
  a("e1k",   "🪙", "أول ألف",           "اكسب 1K 🪙",                       S => S.stats.earned >= 1e3),
  a("e1m",   "💰", "مليونير",           "اكسب مليون 🪙",                    S => S.stats.earned >= 1e6),
  a("e1b",   "🏦", "ملياردير",          "اكسب مليار 🪙",                    S => S.stats.earned >= 1e9),
  a("e1t",   "💎", "تريليونير",         "اكسب تريليون 🪙",                  S => S.stats.earned >= 1e12),
  a("l10",   "⭐", "مستوى 10",          "ارفع مبنى إلى المستوى 10",         S => maxLevel(S) >= 10),
  a("l25",   "🌟", "مستوى 25",          "ارفع مبنى إلى المستوى 25",         S => maxLevel(S) >= 25),
  a("l50",   "✨", "مستوى 50",          "ارفع مبنى إلى المستوى 50",         S => maxLevel(S) >= 50),
  a("l100",  "👑", "الحد الأقصى",       "ارفع مبنى إلى المستوى 100",        S => maxLevel(S) >= 100),
  a("all",   "🧩", "كل الأنواع",        "امتلك كل أنواع المباني معًا",      S => TYPES.every((_, i) => S.calc.lv[i] > 0)),
  a("zp",    "🪐", "مستعمر كواكب",      "افتح الكوكب",                      S => S.zones[1].unlocked),
  a("zs",    "☀️", "سيد النظام",        "افتح النظام النجمي",               S => S.zones[2].unlocked),
  a("zg",    "🌌", "حاكم المجرة",       "افتح المجرة",                      S => S.zones[3].unlocked),
  a("tr5",   "🕳️", "ثقب يكبر",          "اجعل 5 فئات تختفي",               S => S.tier >= 5),
  a("tr10",  "🌑", "آخر شيء",           "صِل إلى فئة الكون",                S => S.tier >= ITEMS.length - 1),
  a("p1",    "🔄", "أول Prestige",      "بع الكون مرة",                     S => S.prestiges >= 1),
  a("p5",    "🔁", "دورة كونية",        "نفّذ 5 مرات Prestige",             S => S.prestiges >= 5),
  a("p10",   "♾️", "إمبراطور خالد",     "نفّذ 10 مرات Prestige",            S => S.prestiges >= 10),
  a("m1",    "☄️", "صائد شهب",          "اصطد شهابًا ذهبيًا",               S => S.stats.meteors >= 1),
  a("m25",   "🌠", "مطر الشهب",         "اصطد 25 شهابًا",                   S => S.stats.meteors >= 25),
  a("tc5",   "🔬", "عالم",              "اشترِ 5 مستويات تقنيات",           S => techLevels(S) >= 5),
  a("tr20",  "🌳", "شجرة الإرث",        "اشترِ 15 مستوى في شجرة الشظايا",   S => treeLevels(S) >= 15),
  a("st7",   "📅", "مواظب",             "سجّل الدخول 7 أيام متتالية",       S => S.login.streak >= 7),
  a("i1m",   "⚡", "مليون بالثانية",    "ادخل 1M 🪙 في الثانية",            S => S.calc.inc >= 1e6),
  a("i1b",   "🚀", "مليار بالثانية",    "ادخل 1B 🪙 في الثانية",            S => S.calc.inc >= 1e9)
];

/* ---------- الفحص الدوري (مرة كل ثانية) ---------- */
let notifiedQuest = "";
export function check(S){
  const today = dayKey(nowMs(S));
  if(S.daily.key !== today){ S.daily = genDaily(S, today); emit("missions-new", {kind: "daily"}); }
  const wk = weekKey(today);
  if(S.weekly.key !== wk){ S.weekly = genWeekly(S, wk); emit("missions-new", {kind: "weekly"}); }
  let newAch = false;
  for(const x of ACH){
    if(!S.ach[x.id] && x.test(S)){
      S.ach[x.id] = true; newAch = true;
      emit("achievement", x);
    }
  }
  if(newAch) recalc(S);
  const c = currentQuest(S);
  if(c && c.done && notifiedQuest !== c.q.id){ notifiedQuest = c.q.id; emit("quest-ready", c); }
  else if(!c || !c.done) notifiedQuest = c ? "" : notifiedQuest;
}
