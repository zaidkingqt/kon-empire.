// منطق الاقتصاد الكامل للعبة: التكاليف، الإنتاج، البيع، الغياب، Prestige، والتقنيات.
// لا يعتمد هذا الملف على DOM؛ كل الدوال تعمل على كائن الحالة S مباشرة.
import {
  CONST, ZONES, ZONE_COST, OPEN_START, RARE, TYPES, AS, TECHS, TREE, T,
  ITEMS, MAX_LEVEL, MILESTONES
} from "./data.js";
import {emit} from "./bus.js";

export {ZONE_COST};
export const LAST_TIER = ITEMS.length - 1;

const BIG = 1e300;
const positive = (x, d = 0) => Number.isFinite(x) ? Math.max(d, x) : d;
const pow = (base, exp) => Math.pow(base, exp);
const sumLevels = (S, type) => {
  const ti = typeof type === "number" ? type : T[type];
  let n = 0;
  for(const Z of S.zones) for(const p of Z.plots) if(p && p.t === ti) n += p.l;
  return n;
};
const countPlots = (S, type) => {
  const ti = typeof type === "number" ? type : T[type];
  let n = 0;
  for(const Z of S.zones) for(const p of Z.plots) if(p && p.t === ti) n++;
  return n;
};
const achievementMult = S => 1 + Object.keys(S.ach || {}).length * 0.01;
const shardMult = S => 1 + positive(S.shardsLife) * 0.10;
const discountMult = S => {
  const tech = positive(S.techs?.logi) * 0.02;
  const tree = positive(S.tree?.disc) * 0.03;
  return Math.max(0.05, 1 - tech - tree);
};
const item = S => ITEMS[Math.min(LAST_TIER, Math.max(0, S.tier | 0))];
const saleBase = S => {
  const it = item(S);
  const mkt = 1 + positive(S.mkt) * 0.50;
  const trade = 1 + positive(S.calc?.lv?.[T.trade]) * 0.02;
  const tech = 1 + positive(S.techs?.mkt) * 0.15;
  const tree = 1 + positive(S.tree?.sale) * 0.25;
  return it.v * mkt * trade * tech * tree * achievementMult(S) * shardMult(S);
};
const productionMult = S => {
  const energy = 1 + positive(S.calc?.lv?.[T.energy]) * 0.015;
  const tech = 1 + positive(S.techs?.cpu) * 0.15;
  const tree = 1 + positive(S.tree?.prod) * 0.20;
  return energy * tech * tree * achievementMult(S) * shardMult(S) * (S.boost > 0 ? CONST.BOOST_MULT : 1);
};
const autoMult = S =>
  (1 + positive(S.techs?.auto) * 0.20) *
  (1 + positive(S.tree?.auto) * 0.30) *
  achievementMult(S) * shardMult(S) *
  (S.boost > 0 ? CONST.BOOST_MULT : 1);

const researchRate = S => {
  const lv = positive(S.calc?.lv?.[T.research]);
  if(!lv) return 0;
  return 0.10 * lv * (1 + positive(S.techs?.cpu) * 0.05);
};

export function msCount(level){
  let n = 0;
  for(const m of MILESTONES) if(level >= m) n++;
  return n;
}

export function typeUnlocked(S, ti){
  const ty = TYPES[ti];
  return !!ty && positive(S.stats?.earned) >= ty.unlock;
}

export function plotCost(S, zi, pi){
  if(!ZONES[zi] || !S.zones[zi] || S.zones[zi].open[pi]) return 0;
  const opened = S.zones[zi].open.filter(Boolean).length;
  const base = ZONES[zi].plotBase * pow(CONST.PLOT_GROWTH, Math.max(0, opened - OPEN_START.length));
  const rare = RARE[zi]?.includes(pi) ? CONST.RARE_PLOT_COST : 1;
  return Math.ceil(base * rare);
}

export function buyPlot(S, zi, pi){
  if(!S.zones[zi] || S.zones[zi].open[pi]) return false;
  if(zi > 0 && !S.zones[zi].unlocked) return false;
  const c = plotCost(S, zi, pi);
  if(!(c > 0) || S.coins < c) return false;
  S.coins -= c;
  S.zones[zi].open[pi] = true;
  emit("plot", {zi, pi, cost:c});
  return true;
}

const zoneCostMult = (S, zi) => ZONES[zi]?.cm || 1;
const sameTypeLevels = (S, zi, ti) => {
  let n = 0;
  const Z = S.zones[zi];
  if(!Z) return n;
  for(const p of Z.plots) if(p && p.t === ti) n += p.l;
  return n;
};

export function buildCost(S, zi, ti){
  const ty = TYPES[ti], Z = S.zones[zi];
  if(!ty || !Z || !Z.unlocked || !typeUnlocked(S, ti)) return Infinity;
  const lv = sameTypeLevels(S, zi, ti);
  return Math.ceil(ty.cost * pow(ty.g, lv) * zoneCostMult(S, zi) * discountMult(S));
}

export function buildAt(S, zi, pi, ti){
  const Z = S.zones[zi], ty = TYPES[ti];
  if(!Z || !Z.open[pi] || Z.plots[pi] || !ty || !typeUnlocked(S, ti)) return false;
  const c = buildCost(S, zi, ti);
  if(!Number.isFinite(c) || S.coins < c) return false;
  S.coins -= c;
  Z.plots[pi] = {t: ti, l: 1, s: c};
  S.stats.builds++;
  recalc(S);
  emit("build", {zi, pi, ti, cost:c});
  return true;
}

export function plotIncome(S, zi, pi){
  const Z = S.zones[zi], p = Z?.plots?.[pi];
  if(!p) return 0;
  const ty = TYPES[p.t];
  if(!ty || ty.role !== "production") return 0;
  const rare = RARE[zi]?.includes(pi) ? CONST.RARE_BONUS : 1;
  const milestone = pow(2, msCount(p.l));
  return ty.inc * milestone * ZONES[zi].prod * rare * (S.calc?.syn?.[p.t] || 1) * (S.calc?.gp || productionMult(S));
}

export function effectText(S, ti, level){
  const ty = TYPES[ti];
  if(!ty) return "";
  const n = Math.max(1, level | 0);
  switch(ty.role){
    case "storage": return "+" + (n * 15) + " دقيقة لسقف الغياب · +" + (n * 0.4).toFixed(1) + "% كفاءة";
    case "trade": return "+" + (n * 2) + "% لقيمة البيع";
    case "energy": return "+" + (n * 1.5).toFixed(1) + "% لإنتاج المباني";
    case "research": return "إنتاج " + fmtResearchRate(n) + " 🔬/ث";
    case "automation": return "بيع تلقائي · +مضاعفات عند مستويات 10/25/50/75/100";
    case "reactor": return "+" + n + "% إنتاج · +" + Math.floor(n / 10) + " شظايا محتملة عند Prestige";
    default: return ty.desc;
  }
}
const fmtResearchRate = n => (0.1 * n).toFixed(1);

export function upgradeCost(S, zi, p, n = 1){
  if(!p) return 0;
  const ty = TYPES[p.t], target = Math.min(MAX_LEVEL, p.l + Math.max(1, n | 0));
  if(!ty || target <= p.l) return 0;
  let c = 0;
  for(let lv = p.l; lv < target; lv++) c += ty.cost * pow(ty.g, lv) * zoneCostMult(S, zi) * discountMult(S);
  return Math.ceil(c);
}

export function upgradeAt(S, zi, pi, n = 1){
  const p = S.zones[zi]?.plots?.[pi];
  if(!p || p.l >= MAX_LEVEL) return false;
  const oldLevel = p.l;
  const target = Math.min(MAX_LEVEL, oldLevel + Math.max(1, n | 0));
  const levels = target - oldLevel;
  const c = upgradeCost(S, zi, p, levels);
  if(!(c > 0) || S.coins < c) return false;
  S.coins -= c;
  p.l = target;
  p.s += c;
  S.stats.upgrades += levels;
  recalc(S);
  emit("upgrade", {zi, pi, levels, cost:c});
  return true;
}

export function maxAffordable(S, zi, p){
  if(!p || p.l >= MAX_LEVEL) return {k:0, cost:0};
  let level = p.l, cost = 0, guard = 0;
  while(level < MAX_LEVEL && guard++ < MAX_LEVEL){
    const one = upgradeCost(S, zi, p, 1 + (level - p.l));
    if(cost + one > S.coins) break;
    cost += one; level++;
  }
  return {k:level - p.l, cost:Math.ceil(cost)};
}

export function upgradeMax(S, zi, pi){
  const p = S.zones[zi]?.plots?.[pi];
  const a = maxAffordable(S, zi, p);
  if(a.k <= 0) return false;
  return upgradeAt(S, zi, pi, a.k);
}

export function demolish(S, zi, pi){
  const Z = S.zones[zi], p = Z?.plots?.[pi];
  if(!p) return false;
  const refund = Math.floor(positive(p.s) * 0.5);
  S.coins = Math.min(BIG, S.coins + refund);
  Z.plots[pi] = null;
  recalc(S);
  emit("demolish", {zi, pi, refund});
  return true;
}

export function zoneReady(S, zi){
  if(zi <= 0 || zi >= ZONES.length || S.zones[zi].unlocked) return false;
  return !!S.zones[zi - 1]?.unlocked &&
    positive(S.stats?.earned) >= ZONES[zi].req &&
    positive(S.coins) >= ZONE_COST[zi];
}

export function unlockZone(S, zi){
  if(!zoneReady(S, zi)) return false;
  S.coins -= ZONE_COST[zi];
  S.zones[zi].unlocked = true;
  S.zones[zi].open = Array(S.zones[zi].open.length).fill(false);
  for(const pi of OPEN_START) if(pi < S.zones[zi].open.length) S.zones[zi].open[pi] = true;
  S.zone = zi;
  emit("zone", {zi});
  recalc(S);
  return true;
}

export function cClick(S){ return Math.ceil(30 * pow(1.55, positive(S.click))); }
export function buyClick(S){
  const c = cClick(S);
  if(S.coins < c) return false;
  S.coins -= c; S.click++;
  emit("upgrade", {kind:"click", level:S.click, cost:c});
  recalc(S);
  return true;
}

export function cAs(S, i){
  const a = AS[i]; return a ? Math.ceil(a.cost * pow(a.g, positive(S.as?.[i]))) : Infinity;
}
export function buyAssist(S, i){
  const a = AS[i], c = cAs(S, i);
  if(!a || S.coins < c) return false;
  S.coins -= c; S.as[i]++;
  emit("upgrade", {kind:"assistant", i, level:S.as[i], cost:c});
  recalc(S);
  return true;
}

export function cMkt(S){ return Math.ceil(2500 * pow(1.75, positive(S.mkt))); }
export function buyMkt(S){
  if(S.mkt >= 12) return false;
  const c = cMkt(S);
  if(S.coins < c) return false;
  S.coins -= c; S.mkt++;
  emit("upgrade", {kind:"market", level:S.mkt, cost:c});
  recalc(S);
  return true;
}

export function cTech(S, id){
  const tc = TECHS.find(x => x.id === id), lv = positive(S.techs?.[id]);
  return tc ? Math.ceil(tc.base * pow(tc.g, lv)) : Infinity;
}
export function buyTech(S, id){
  const tc = TECHS.find(x => x.id === id), lv = positive(S.techs?.[id]);
  if(!tc || lv >= tc.max) return false;
  const c = cTech(S, id);
  if(S.rp < c) return false;
  S.rp -= c; S.techs[id] = lv + 1;
  emit("tech", {id, level:S.techs[id], cost:c});
  recalc(S);
  return true;
}

export function activateBoost(S, seconds = CONST.BOOST_SECONDS){
  S.boost = Math.min(CONST.BOOST_MAX, positive(S.boost) + Math.max(0, seconds));
  recalc(S);
  emit("boost", {seconds});
  return S.boost;
}

export function elapsedSince(S, now = Date.now()){
  const last = positive(S.savedAt || S.clockMax, 0);
  return Math.max(0, Math.min(Math.max(0, now - last) / 1000, 30 * 24 * 3600));
}

const offlineHours = S =>
  CONST.OFFLINE_BASE_H +
  positive(S.calc?.lv?.[T.storage]) * 0.25 +
  positive(S.techs?.cold) * 0.5 +
  positive(S.tree?.off) * 1;

const offlineEfficiency = S =>
  Math.min(1,
    CONST.OFFLINE_EFF +
    positive(S.calc?.lv?.[T.storage]) * 0.004 +
    positive(S.tree?.off) * 0.10
  );

export function awayGain(S, gap){
  const sec = Math.min(Math.max(0, gap), offlineHours(S) * 3600);
  const coins = Math.min(BIG, positive(S.calc?.inc) * sec * offlineEfficiency(S));
  const rp = Math.min(BIG, positive(S.calc?.rps) * sec * offlineEfficiency(S));
  return {coins, rp, sec, efficiency:offlineEfficiency(S)};
}

export function applyAway(S, g, mult = 1){
  const m = Math.max(0, positive(mult, 1));
  S.coins = Math.min(BIG, S.coins + positive(g?.coins) * m);
  S.rp = Math.min(BIG, S.rp + positive(g?.rp) * m);
  emit("claim", {kind:"away", mult:m});
  return positive(g?.coins) * m;
}

export function meteorDelay(S){
  const luck = positive(S.tree?.luck);
  const factor = Math.pow(0.85, luck);
  const min = CONST.METEOR_MIN * factor, max = CONST.METEOR_MAX * factor;
  return min + Math.random() * Math.max(1, max - min);
}

export function meteorBonus(S){
  const luck = positive(S.tree?.luck);
  const tech = positive(S.techs?.meteor);
  return Math.max(1, positive(S.calc?.inc) * (4 + 0.5 * luck) * (1 + 0.25 * tech) * (1 + 0.15 * luck));
}

export function earn(S, amount){
  const n = Math.max(0, Number(amount) || 0);
  if(!n) return 0;
  S.coins = Math.min(BIG, S.coins + n);
  S.total = Math.min(BIG, S.total + n);
  S.stats.earned = Math.min(BIG, S.stats.earned + n);
  return n;
}

export function tap(S){
  const it = item(S);
  const got = it.v * positive(S.calc?.sm, 1) * positive(S.calc?.click, 1);
  const n = earn(S, got);
  S.sold++;
  S.stats.taps++;
  S.stats.sales++;
  checkTier(S);
  return n;
}

function autoSales(S, dt){
  const sales = positive(S.calc?.sps) * dt;
  if(sales <= 0) return 0;
  const n = earn(S, saleBase(S) * (1 + positive(S.techs?.auto) * 0.20 + positive(S.tree?.auto) * 0.30) * sales / Math.max(1, achievementMult(S) * shardMult(S)),);
  // saleBase already includes persistent multipliers; above expression avoids applying them twice.
  S.sold += sales;
  S.stats.sales += sales;
  checkTier(S);
  return n;
}

function checkTier(S){
  let changed = false;
  while(S.tier < LAST_TIER){
    const next = ITEMS[S.tier + 1];
    if(S.total < next.req) break;
    S.tier++;
    S.sold = 0;
    changed = true;
    emit("tier", {tier:S.tier});
  }
  if(S.tier === LAST_TIER && S.sold >= ITEMS[LAST_TIER].need && !S.universeSold){
    S.universeSold = true;
    emit("universe");
  }
  return changed;
}

export function recalc(S){
  if(!S) return null;
  const lv = Array(TYPES.length).fill(0);
  let built = 0, production = 0;
  for(let zi = 0; zi < S.zones.length; zi++){
    const Z = S.zones[zi];
    if(!Z?.unlocked) continue;
    for(let pi = 0; pi < Z.plots.length; pi++){
      const p = Z.plots[pi];
      if(!p) continue;
      lv[p.t] += positive(p.l);
      built++;
    }
  }

  const syn = Array(TYPES.length).fill(1);
  const synBoost = 1 + positive(S.tree?.syn) * 0.50;
  for(const link of (awaitlessSYN())){
    const from = T[link.from], to = T[link.to];
    syn[to] += lv[from] * link.pct * synBoost;
  }

  const gp = productionMult({...S, calc:{lv}});
  const mkt = 1 + positive(S.mkt) * 0.50;
  const trade = 1 + lv[T.trade] * 0.02;
  const techMkt = 1 + positive(S.techs?.mkt) * 0.15;
  const treeSale = 1 + positive(S.tree?.sale) * 0.25;
  const sm = mkt * trade * techMkt * treeSale * achievementMult(S) * shardMult(S) *
    (S.boost > 0 ? CONST.BOOST_MULT : 1);
  const click = 1 + positive(S.click);
  const sps = AS.reduce((n, a, i) => n + positive(S.as?.[i]) * a.sps, 0);
  const rps = researchRate({...S, calc:{lv}});
  const tmpCalc = {lv, syn, gp, sm, click, sps, rps, built, inc:0};
  for(let zi = 0; zi < S.zones.length; zi++){
    const Z = S.zones[zi];
    if(!Z?.unlocked) continue;
    for(let pi = 0; pi < Z.plots.length; pi++){
      if(Z.plots[pi]) production += plotIncome({...S, calc:tmpCalc}, zi, pi);
    }
  }
  const autoCoins = sps * (item(S).v * mkt * trade * techMkt * treeSale * achievementMult(S) * shardMult(S)) *
    (1 + positive(S.techs?.auto) * 0.20) * (1 + positive(S.tree?.auto) * 0.30) *
    (S.boost > 0 ? CONST.BOOST_MULT : 1);
  tmpCalc.inc = Math.min(BIG, production + autoCoins);
  S.calc = tmpCalc;
  return tmpCalc;
}

// kept local to avoid making data.js a dependency for the SYN list at module initialization.
let _syn = null;
function awaitlessSYN(){
  if(!_syn){
    _syn = [
      {from:"chick",to:"water",pct:0.010},
      {from:"cats",to:"chick",pct:0.010},
      {from:"cats",to:"water",pct:0.005},
      {from:"dream",to:"cats",pct:0.010},
      {from:"virus",to:"dream",pct:0.010},
      {from:"hole",to:"virus",pct:0.010}
    ];
  }
  return _syn;
}

export function tick(S, dt){
  if(!S || !(dt > 0)) return 0;
  if(!S.calc) recalc(S);
  const n = Math.min(5, Math.max(0, dt));
  const got = earn(S, S.calc.inc * n);
  const rp = positive(S.calc.rps) * n;
  S.rp = Math.min(BIG, S.rp + rp);
  S.boost = Math.max(0, positive(S.boost) - n);
  if(S.calc.sps > 0){
    const sales = S.calc.sps * n;
    S.sold += sales;
    S.stats.sales += sales;
  }
  checkTier(S);
  // Boost انتهاءه يغيّر الاقتصاد، لذلك نعيد الحساب فورًا.
  if((S.boost <= 0 && S.calc.gp > 1) || (S.boost > 0 && S.calc.gp <= 1)) recalc(S);
  return got;
}

export function prestigeGain(S){
  if(!S?.universeSold) return 0;
  const reactor = positive(S.calc?.lv?.[T.reactor]);
  const base = Math.max(1, Math.floor(Math.sqrt(Math.max(0, S.total) / 1e9)));
  const reactorBonus = Math.floor(reactor / 10);
  const gainTree = 1 + positive(S.tree?.gain) * 0.15;
  return Math.max(1, Math.floor((base + reactorBonus) * gainTree));
}

export function prestige(S){
  if(!S?.universeSold) return 0;
  const gain = prestigeGain(S);
  const keepAuto = Math.floor(sum(S.as) * Math.min(0.95, positive(S.tree?.keep) * 0.25));
  const keepZone = positive(S.tree?.zone) >= 1;
  const oldShards = positive(S.shards);
  const oldLife = positive(S.shardsLife);
  const oldPrestiges = positive(S.prestiges);
  const oldAch = S.ach;
  const oldTree = S.tree;
  const oldStats = S.stats;
  const oldLogin = S.login;
  const oldDaily = S.daily;
  const oldWeekly = S.weekly;
  const oldSessions = positive(S.stats.sessions);
  const oldSet = S.set;

  // إعادة الجولة مع الإبقاء على الإرث الدائم والإحصاءات التاريخية.
  const fresh = {
    v: S.v, coins: 0, total: 0, tier: 0, sold: 0, universeSold:false,
    click:0, as: AS.map(() => 0), mkt:0, rp:0, techs:{},
    zone:0, zones:S.zones.map((z,zi)=>({
      unlocked: zi === 0 || (keepZone && zi === 1),
      open: Array(z.open.length).fill(false),
      plots:Array(z.plots.length).fill(null)
    })),
    shards: oldShards + gain, shardsLife: oldLife + gain, prestiges: oldPrestiges + 1,
    tree:{...oldTree}, qi:S.qi, ach:{...oldAch},
    daily:{...oldDaily, list:(oldDaily.list||[]).map(m=>({...m}))},
    weekly:{...oldWeekly, list:(oldWeekly.list||[]).map(m=>({...m}))},
    login:{...oldLogin}, set:{...oldSet},
    stats:{...oldStats, sessions:oldSessions},
    boost:0, clockMax:Date.now(), savedAt:Date.now()
  };
  for(const zi of [0,1]){
    if(!fresh.zones[zi]?.unlocked) continue;
    for(const pi of OPEN_START) fresh.zones[zi].open[pi] = true;
  }
  for(let i=0;i<keepAuto;i++) fresh.as[i % fresh.as.length]++;
  if(positive(fresh.tree.start) > 0){
    const zi=0, pi=OPEN_START[0], lv=Math.min(MAX_LEVEL, 5 * positive(fresh.tree.start));
    const c=T.water;
    fresh.zones[zi].plots[pi]={t:c,l:lv,s:0};
    fresh.stats.builds++;
  }
  for(const k of Object.keys(fresh.techs)) fresh.techs[k]=0;
  for(const k of Object.keys(fresh.stats)) if(!Number.isFinite(fresh.stats[k])) fresh.stats[k]=0;
  Object.defineProperty(fresh,"calc",{value:null,writable:true,enumerable:false,configurable:true});
  Object.defineProperty(fresh,"tmp",{value:{acc:0,rpAcc:0},writable:true,enumerable:false,configurable:true});
  Object.assign(S, fresh);
  recalc(S);
  emit("prestige", {gain, count:S.prestiges});
  return gain;
}

export function rankOf(S){
  let name = "تاجر مبتدئ";
  for(const r of [
    {min:0,name:"تاجر مبتدئ"},{min:1,name:"مدير أسواق"},{min:4,name:"حاكم مدينة"},
    {min:10,name:"سلطان كوكب"},{min:25,name:"إمبراطور"},{min:60,name:"إمبراطور كوني"}
  ]) if(S.prestiges >= r.min) name = r.name;
  return name;
}

export function cTree(S, id){
  const n = TREE.find(x => x.id === id), lv = positive(S.tree?.[id]);
  return n ? Math.ceil(n.base * pow(n.g, lv)) : Infinity;
}
export function buyTree(S, id){
  const n = TREE.find(x => x.id === id), lv = positive(S.tree?.[id]);
  if(!n || lv >= n.max) return false;
  const c = cTree(S, id);
  if(S.shards < c) return false;
  S.shards -= c; S.tree[id] = lv + 1;
  recalc(S);
  emit("tree", {id, level:S.tree[id], cost:c});
  return true;
}
