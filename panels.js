// محتوى التبويبات السفلية. كل صف يعرض حالته بالنص والأيقونة وليس باللون وحده.
import {ZONES, ZONE_COST, TYPES, SYN, ITEMS, AS, TECHS, TREE, PATHS, MAX_LEVEL, MILESTONES, CONST, RARE, T} from "./data.js";
import * as E from "./economy.js";
import {G} from "./state.js";
import * as Ads from "./ads.js";
import * as M from "./missions.js";
import {h, fmt, fmtRate, fmtTime, setText} from "./util.js";
import {ui, toast, sfx, confirmDialog} from "./uicore.js";

export const hooks = {hud(){}, prestige(){}, selectZone(){}, afterBuild(){}};
const ROLE = {production: "إنتاج", storage: "تخزين", trade: "تجارة", energy: "طاقة", research: "أبحاث", automation: "أتمتة", reactor: "ثقب"};

let panel = null, updaters = [];
export const initPanels = el => { panel = el; };

export function renderPanel(){
  updaters = [];
  panel.replaceChildren();
  ({city: cityTab, up: upTab, quests: questsTab, uni: uniTab}[ui.tab] || cityTab)(panel);
  updatePanel();
}
export function updatePanel(){ for(const f of updaters) f(); }
const watch = f => { updaters.push(f); f(); };

/* ---------- لبنات مشتركة ---------- */
const section = (parent, text) => parent.append(h("div", {class: "sec"}, text));
const note = (parent, text) => { const d = h("div", {class: "head"}, text); parent.append(d); return d; };
function bar(){ const i = h("i"); return {el: h("div", {class: "bar"}, i), set: p => { i.style.width = Math.max(0, Math.min(100, p * 100)) + "%"; }}; }

// o: {ic, name, desc(), cost(), cur, ok(), act(), lock(), max(), danger}
function row(parent, o){
  const ic = h("span", {class: "ic"}, o.ic), nm = h("b", null, o.name), d = h("span", {class: "d"}), cost = h("span", {class: "cost"});
  const b = h("button", {class: "row" + (o.danger ? " danger" : ""), type: "button"}, ic, h("span", {class: "tx"}, nm, d), cost);
  if(o.col) ic.style.setProperty("--c", o.col);
  let enabled = false;
  watch(() => {
    const lock = o.lock ? o.lock() : "", max = o.max ? o.max() : false;
    setText(d, lock || o.desc());
    const c = o.cost ? o.cost() : "";
    setText(cost, max ? "✅ الأقصى" : lock ? "🔒" : typeof c === "number" ? fmt(c) + " " + (o.cur || "🪙") : c);
    enabled = !lock && !max && o.ok();
    b.setAttribute("aria-disabled", enabled ? "false" : "true");
    b.classList.toggle("locked", !!lock); b.classList.toggle("maxed", max);
  });
  b.addEventListener("click", async () => {
    if(!enabled){ sfx("no"); return; }
    const r = await o.act();
    if(r === false){ sfx("no"); return; }
    if(o.rebuild) renderPanel(); else updatePanel();
    hooks.hud();
  });
  parent.append(b);
  return b;
}

/* ====================== المدينة ====================== */
function cityTab(el){
  const S = G.S;
  if(ui.zonePreview >= 0) return zoneCard(el, ui.zonePreview);
  const zi = S.zone, Z = S.zones[zi], pi = ui.sel;
  if(pi < 0) return citySummary(el, zi);
  if(!Z.open[pi]) return closedPlot(el, zi, pi);
  if(!Z.plots[pi]) return emptyPlot(el, zi, pi);
  return buildingPanel(el, zi, pi);
}

function citySummary(el, zi){
  const head = note(el, "");
  watch(() => {
    const S = G.S, c = S.calc;
    setText(head, ZONES[zi].em + " " + ZONES[zi].name + " · " + c.built + " مبنى · الدخل " + fmtRate(c.inc) + " 🪙/ث. اضغط أي قطعة لتبني أو ترقّي.");
  });
  section(el, "🔗 التناغم بين المباني (كل مستوى يرفع إنتاج مبنى آخر)");
  for(const s of SYN){
    const a = TYPES[T[s.from]], b = TYPES[T[s.to]];
    const d = h("div", {class: "row static"}, h("span", {class: "ic"}, a.em + b.em), h("span", {class: "tx"}, h("b", null, a.name + " ← " + b.name), h("span", {class: "d"})), h("span", {class: "cost"}));
    const dd = d.querySelector(".d"), cc = d.querySelector(".cost");
    watch(() => {
      const lv = G.S.calc.lv[T[s.from]];
      setText(dd, "كل مستوى من " + a.name + " يرفع " + b.name + " بـ " + (s.pct * 100 * (1 + 0.5 * (G.S.tree.syn | 0))).toFixed(1) + "%");
      setText(cc, "+" + (lv * s.pct * (1 + 0.5 * (G.S.tree.syn | 0)) * 100).toFixed(0) + "%");
    });
    el.append(d);
  }
  section(el, "🏢 أدوار المباني");
  for(const t of TYPES.filter(x => x.role !== "production")){
    el.append(h("div", {class: "row static"}, h("span", {class: "ic"}, t.em), h("span", {class: "tx"}, h("b", null, t.name), h("span", {class: "d"}, t.desc))));
  }
}

function rareNote(zi, pi){ return RARE[zi].includes(pi) ? "⭐ أرض نادرة: إنتاج المباني عليها ×" + CONST.RARE_BONUS + " وفتحها أغلى." : ""; }

function closedPlot(el, zi, pi){
  note(el, "🔒 قطعة مقفلة. " + rareNote(zi, pi));
  row(el, {ic: "🗺️", name: "افتح القطعة",
    desc: () => "تتيح لك البناء عليها",
    cost: () => E.plotCost(G.S, zi, pi), ok: () => G.S.coins >= E.plotCost(G.S, zi, pi),
    act: () => { if(!E.buyPlot(G.S, zi, pi)) return false; hooks.afterBuild(pi); }, rebuild: true});
}

function emptyPlot(el, zi, pi){
  const r = rareNote(zi, pi);
  note(el, "قطعة فارغة. اختر ما تبنيه." + (r ? " " + r : ""));
  TYPES.forEach((ty, t) => row(el, {
    ic: ty.em, name: ty.name, col: ty.col,
    desc: () => "[" + ROLE[ty.role] + "] " + (ty.role === "production"
      ? "يدرّ " + fmtRate(ty.inc * G.S.calc.syn[t] * ZONES[zi].prod * (RARE[zi].includes(pi) ? CONST.RARE_BONUS : 1) * G.S.calc.gp) + "/ث"
      : E.effectText(G.S, t, 1)),
    lock: () => E.typeUnlocked(G.S, t) ? "" : "يفتح عند " + fmt(ty.unlock) + " 🪙 مكتسبة",
    cost: () => E.buildCost(G.S, zi, t),
    ok: () => G.S.coins >= E.buildCost(G.S, zi, t),
    act: () => { if(!E.buildAt(G.S, zi, pi, t)) return false; hooks.afterBuild(pi); }, rebuild: true
  }));
}

function buildingPanel(el, zi, pi){
  const P = () => G.S.zones[zi].plots[pi];
  const p0 = P(), ty = TYPES[p0.t];
  const title = h("div", {class: "head"}), info = h("div", {class: "head sub"}), syn = h("div", {class: "head sub"});
  el.append(title, info, syn);
  watch(() => {
    const p = P();
    if(!p){ ui.sel = -1; renderPanel(); return; }
    const S = G.S, nextMs = MILESTONES.find(m => m > p.l);
    setText(title, ty.em + " " + ty.name + " · المستوى " + p.l + "/" + MAX_LEVEL);
    const eff = ty.role === "production"
      ? "يدرّ " + fmtRate(E.plotIncome(S, zi, pi)) + " 🪙/ث" + (RARE[zi].includes(pi) ? " (أرض نادرة ⭐)" : "")
      : E.effectText(S, p.t, p.l);
    setText(info, eff + (nextMs ? " · عند المستوى " + nextMs + " يتضاعف الإنتاج ×2" : " · وصل لكل المضاعفات"));
    const src = SYN.filter(s => T[s.to] === p.t).map(s => TYPES[T[s.from]].em + " " + S.calc.lv[T[s.from]] + " مستوى");
    setText(syn, ty.role === "production" ? (src.length ? "تناغم: ×" + S.calc.syn[p.t].toFixed(2) + " من " + src.join(" + ") : "لا تناغم لهذا المبنى. هو أساس السلسلة.") : ty.desc);
  });
  for(const n of [1, 10]){
    row(el, {ic: "⬆️", name: n === 1 ? "ترقية" : "ترقية ×10",
      desc: () => { const p = P(); return p ? "إلى المستوى " + Math.min(MAX_LEVEL, p.l + n) : ""; },
      cost: () => { const p = P(); return p ? E.upgradeCost(G.S, zi, p, n) : 0; },
      max: () => { const p = P(); return !p || p.l >= MAX_LEVEL; },
      ok: () => { const p = P(); return !!p && G.S.coins >= E.upgradeCost(G.S, zi, p, n); },
      act: () => { if(!E.upgradeAt(G.S, zi, pi, n)) return false; hooks.afterBuild(pi, false); }});
  }
  row(el, {ic: "⏫", name: "ترقية للأقصى المتاح",
    desc: () => { const p = P(); return p ? "+" + E.maxAffordable(G.S, zi, p).k + " مستوى بما تملك" : ""; },
    cost: () => { const p = P(); return p ? E.maxAffordable(G.S, zi, p).cost : 0; },
    max: () => { const p = P(); return !p || p.l >= MAX_LEVEL; },
    ok: () => { const p = P(); return !!p && E.maxAffordable(G.S, zi, p).k > 0; },
    act: () => { if(!E.upgradeMax(G.S, zi, pi)) return false; hooks.afterBuild(pi, false); }});
  row(el, {ic: "🧹", name: "هدم المبنى", danger: true,
    desc: () => { const p = P(); return p ? "يسترد نصف ما أنفقته عليه" : ""; },
    cost: () => { const p = P(); return p ? "+" + fmt(Math.floor(p.s * 0.5)) + " 🪙" : ""; },
    ok: () => !!P(),
    act: () => { confirmDialog("هدم المبنى؟", "سيُهدم المبنى ويُسترد نصف ما أنفقته عليه. تعيد بناءه لاحقًا بسعر البناء الحالي.", "اهدم", () => { E.demolish(G.S, zi, pi); ui.sel = -1; renderPanel(); hooks.hud(); }, true); return false; }});
}

function zoneCard(el, zi){
  const Z = ZONES[zi];
  note(el, Z.em + " " + Z.name + ": منطقة جديدة بإنتاج ×" + Z.prod + " وتكلفة ×" + Z.cm + ". تحتاج " + fmt(Z.req) + " 🪙 مكتسبة في هذه الجولة.");
  row(el, {ic: Z.em, name: "افتح " + Z.name,
    desc: () => { const S = G.S; return !S.zones[zi - 1].unlocked ? "افتح المنطقة السابقة أولًا" : S.stats.earned >= Z.req ? "جاهزة للفتح" : "اكسب " + fmt(Z.req - S.stats.earned) + " 🪙 أخرى"; },
    lock: () => (G.S.zones[zi].unlocked ? "" : (!G.S.zones[zi - 1].unlocked || G.S.stats.earned < Z.req) ? "غير متاحة بعد" : ""),
    cost: () => ZONE_COST[zi], max: () => G.S.zones[zi].unlocked,
    ok: () => E.zoneReady(G.S, zi) && G.S.coins >= ZONE_COST[zi],
    act: () => { if(!E.unlockZone(G.S, zi)) return false; ui.zonePreview = -1; hooks.selectZone(zi); }, rebuild: true});
}

/* ====================== الترقيات ====================== */
function upTab(el){
  section(el, "💰 المبيعات");
  row(el, {ic: "👆", name: "يد أسرع", desc: () => "كل ضغطة تبيع " + (G.S.click + 2) + " بدل " + (G.S.click + 1),
    cost: () => E.cClick(G.S), ok: () => G.S.coins >= E.cClick(G.S), act: () => E.buyClick(G.S)});
  AS.forEach((a, i) => row(el, {ic: a.e, name: a.n,
    desc: () => "+" + a.sps + " بيعة/ث · لديك " + G.S.as[i],
    cost: () => E.cAs(G.S, i), ok: () => G.S.coins >= E.cAs(G.S, i), act: () => E.buyAssist(G.S, i)}));
  row(el, {ic: "📣", name: "حملة تسويق", desc: () => "كل إنتاجك وبيعك ×1.5 · المستوى " + G.S.mkt + "/12",
    cost: () => E.cMkt(G.S), max: () => G.S.mkt >= 12, ok: () => G.S.coins >= E.cMkt(G.S), act: () => E.buyMkt(G.S)});

  section(el, "🔬 الأبحاث (تُمسح مع كل Prestige)");
  const rpInfo = note(el, "");
  watch(() => setText(rpInfo, G.S.calc.lv[T.research] > 0
    ? "نقاط البحث: " + fmt(G.S.rp) + " (+" + fmtRate(G.S.calc.rps) + "/ث)"
    : "ابنِ مختبر الأبحاث 🔬 لتنتج نقاط البحث، ثم اشترِ التقنيات هنا."));
  for(const tc of TECHS){
    row(el, {ic: tc.em, name: tc.name, cur: "🔬",
      desc: () => tc.desc + " · " + (G.S.techs[tc.id] | 0) + "/" + tc.max,
      cost: () => E.cTech(G.S, tc.id), max: () => (G.S.techs[tc.id] | 0) >= tc.max,
      ok: () => G.S.rp >= E.cTech(G.S, tc.id), act: () => E.buyTech(G.S, tc.id)});
  }

  if(Ads.enabled()){
    section(el, "⚡ تعزيز");
    row(el, {ic: "🎬", name: "×2 للدخل لمدة 5 دقائق",
      desc: () => G.S.boost > 0 ? "نشط: باقي " + fmtTime(G.S.boost) : "شاهد إعلانًا قصيرًا (تُجمع المدة حتى ساعة)",
      cost: () => Ads.isReady("boost") ? "مجانًا" : (Ads.cooldownLeft() > 0 ? "بعد " + Ads.cooldownLeft() + "ث" : "غير متاح"),
      ok: () => Ads.isReady("boost"),
      act: async () => { const ok = await Ads.rewarded("boost"); if(!ok) return false; E.activateBoost(G.S); toast("⚡ تعزيز ×2 لمدة 5 دقائق"); }});
  }
}

/* ====================== المهام والإنجازات ====================== */
function claimBtn(label, onclick){ return h("button", {class: "btn primary small", type: "button", onclick}, label); }

function questsTab(el){
  section(el, "🎯 المهمة الحالية");
  const qCard = h("div", {class: "card"});
  el.append(qCard);
  const qText = h("b"), qBar = bar(), qSub = h("span", {class: "d"}), qBtn = claimBtn("استلم", () => { const r = M.claimQuest(G.S); if(r){ toast("+" + fmt(r) + " 🪙 مكافأة المهمة"); hooks.hud(); renderPanel(); } });
  qCard.append(qText, qBar.el, h("div", {class: "line"}, qSub, qBtn));
  watch(() => {
    const c = M.currentQuest(G.S);
    if(!c){ setText(qText, "أنهيت كل المهام الإرشادية. تابع اليوميات والأسبوعيات."); qBar.set(1); setText(qSub, ""); qBtn.hidden = true; return; }
    setText(qText, c.q.text); qBar.set(c.cur / c.target);
    setText(qSub, fmt(c.cur) + " / " + fmt(c.target) + " · المكافأة " + fmt(c.reward) + " 🪙");
    qBtn.hidden = !c.done;
  });

  section(el, "📅 مكافأة الدخول (7 أيام)");
  const lCard = h("div", {class: "card"}), dots = h("div", {class: "dots"});
  const lSub = h("span", {class: "d"}), lBtn = claimBtn("استلم", () => {
    const r = M.claimLogin(G.S, E.activateBoost);
    if(r){ toast("مكافأة اليوم " + (((r.streak - 1) % 7) + 1) + ": +" + fmt(r.coins) + " 🪙" + (r.shard ? " +1 🌑" : "") + (r.boost ? " + تعزيز" : "")); hooks.hud(); updatePanel(); }
  });
  const dayEls = Array.from({length: 7}, (_, i) => h("span", {class: "dot"}, String(i + 1)));
  dots.append(...dayEls);
  lCard.append(dots, h("div", {class: "line"}, lSub, lBtn));
  el.append(lCard);
  watch(() => {
    const L = M.loginInfo(G.S);
    dayEls.forEach((d, i) => { d.classList.toggle("done", i < (L.can ? L.day : (L.streak - 1) % 7 + 1) && !(L.can && i >= L.day)); d.classList.toggle("now", L.can && i === L.day); });
    setText(lSub, L.can ? "اليوم " + (L.day + 1) + ": " + fmt(L.coins) + " 🪙" + (L.shard ? " + شظية" : "") + (L.boost ? " + تعزيز" : "") : "استلمت مكافأة اليوم · السلسلة " + G.S.login.streak + " يوم");
    lBtn.hidden = !L.can;
  });

  for(const [kind, title] of [["daily", "☀️ مهام اليوم"], ["weekly", "🗓️ مهام الأسبوع"]]){
    section(el, title);
    const set = () => G.S[kind].list;
    G.S[kind].list.forEach((_, idx) => {
      const c = h("div", {class: "card"}), t = h("b"), b = bar(), sub = h("span", {class: "d"});
      const btn = claimBtn("استلم", () => { if(M.claimMission(G.S, kind, idx)){ hooks.hud(); updatePanel(); } });
      c.append(t, b.el, h("div", {class: "line"}, sub, btn)); el.append(c);
      watch(() => {
        const m = set()[idx]; if(!m) return;
        const pr = M.missionProgress(G.S, m);
        setText(t, M.missionText(m)); b.set(pr.cur / pr.target);
        setText(sub, m.claimed ? "✅ تم الاستلام" : fmt(pr.cur) + " / " + fmt(pr.target) + " · " + fmt(m.rew) + " 🪙" + (m.rewRp ? " + " + fmt(m.rewRp) + " 🔬" : "") + (m.rewSh ? " + " + m.rewSh + " 🌑" : ""));
        btn.hidden = m.claimed || !pr.done;
      });
    });
  }

  section(el, "🏆 الإنجازات (كل إنجاز +1% للدخل والبيع)");
  const sumEl = note(el, "");
  watch(() => setText(sumEl, Object.keys(G.S.ach).length + " / " + M.ACH.length + " · المكافأة الحالية +" + Object.keys(G.S.ach).length + "%"));
  for(const a of M.ACH){
    const dd = h("span", {class: "d"}, a.desc), cc = h("span", {class: "cost"}), box = h("div", {class: "row static"}, h("span", {class: "ic"}, a.em), h("span", {class: "tx"}, h("b", null, a.name), dd), cc);
    el.append(box);
    watch(() => { const got = !!G.S.ach[a.id]; setText(cc, got ? "✔️ +1%" : "🔒"); box.classList.toggle("maxed", got); });
  }
}

/* ====================== الكون ====================== */
function uniTab(el){
  const S0 = G.S;
  const top = note(el, "");
  watch(() => { const S = G.S; setText(top, "الرتبة: " + E.rankOf(S) + " · شظايا متاحة: " + S.shards + " 🌑 · مدى الحياة: " + S.shardsLife + " (+" + (S.shardsLife * 10) + "% لكل أرباحك)"); });

  section(el, "🌑 بيع الكون (Prestige)");
  const pc = h("div", {class: "card"}), pt = h("b"), ps = h("span", {class: "d"});
  const pb = h("button", {class: "btn primary", type: "button", onclick: () => askPrestige()}, "بع الكون");
  pc.append(pt, ps, h("div", {class: "line"}, h("span"), pb)); el.append(pc);
  watch(() => {
    const S = G.S, last = E.LAST_TIER;
    if(S.universeSold){
      setText(pt, "الكون بيع! جاهز للجولة الجديدة"); setText(ps, "ستحصل على +" + E.prestigeGain(S) + " 🌑. كلما كبرت أرباح الجولة قبل البيع زادت الشظايا."); pb.hidden = false;
    }else if(S.tier === last){
      setText(pt, "بقيت بيعة واحدة"); setText(ps, "اضغط زر البيع لتبيع الكون نفسه. بعدها تختار متى تبدأ من جديد."); pb.hidden = true;
    }else{
      setText(pt, "اختفِ " + (last - S.tier) + " فئات أخرى"); setText(ps, "كل فئة تفتح بعد أرباح كافية في الجولة. الفئة الأخيرة هي الكون."); pb.hidden = true;
    }
  });

  section(el, "📦 سلّم البيع");
  ITEMS.forEach((it, i) => {
    const dd = h("span", {class: "d"}), cc = h("span", {class: "cost"}), box = h("div", {class: "row static"}, h("span", {class: "ic"}, it.e), h("span", {class: "tx"}, h("b", null, it.n), dd), cc);
    el.append(box);
    watch(() => {
      const S = G.S;
      box.classList.toggle("now", i === S.tier); box.classList.toggle("maxed", i < S.tier);
      if(i < S.tier){ setText(dd, "اختفى من الكون"); setText(cc, "✔️"); }
      else if(i === S.tier){ setText(dd, "تبيعه الآن"); setText(cc, S.sold + "/" + it.need); }
      else { const ok = S.total >= it.req; setText(dd, ok ? "جاهز للفتح" : "يفتح عند " + fmt(it.req) + " 🪙 في الجولة"); setText(cc, ok ? "🔓" : "🔒"); }
    });
  });

  section(el, "🌳 شجرة الشظايا (دائمة)");
  for(const path of PATHS){
    section(el, path.em + " " + path.name);
    for(const n of TREE.filter(x => x.path === path.id)){
      row(el, {ic: n.em, name: n.name, cur: "🌑",
        desc: () => n.desc + " · " + (G.S.tree[n.id] | 0) + "/" + n.max,
        cost: () => E.cTree(G.S, n.id), max: () => (G.S.tree[n.id] | 0) >= n.max,
        ok: () => G.S.shards >= E.cTree(G.S, n.id), act: () => E.buyTree(G.S, n.id)});
    }
  }
}

function askPrestige(){
  const S = G.S;
  if(!S.universeSold) return;
  const gain = E.prestigeGain(S);
  const body = h("div", null,
    h("p", null, "ستحصل على +" + gain + " 🌑 شظايا."),
    h("p", {class: "d"}, "تُمسح: العملات والمباني والأراضي والأبحاث والتسويق والمساعدون (جزء منهم يبقى حسب شجرتك)."),
    h("p", {class: "d"}, "تبقى: الشظايا والشجرة والإنجازات والمهام. كل شظية +10% دائمة لكل أرباحك."));
  confirmDialog("بيع الكون وبدء جولة جديدة؟", body, "بع الكون 🌌", () => hooks.prestige());
}
