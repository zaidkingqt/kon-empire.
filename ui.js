// الواجهة الرئيسية: HUD، زر البيع، شريط المهمة، المناطق، الإعدادات، النوافذ.
import {G, exportCode, importCode, hardReset, fresh} from "./state.js";
import {ZONES, ITEMS, VERSION, CONST} from "./data.js";
import * as E from "./economy.js";
import * as Engine from "./engine.js";
import * as R from "./render.js";
import * as M from "./missions.js";
import * as Ads from "./ads.js";
import * as Audio from "./audio.js";
import {on} from "./bus.js";
import {h, $, fmt, fmtRate, fmtTime, setText} from "./util.js";
import {ui, toast, sfx, pop, modal, closeModal, initModalKeys, confirmDialog} from "./uicore.js";
import {initPanels, renderPanel, updatePanel, hooks} from "./panels.js";

let zoneEls = [], lastUi = 0, hold = 0, installEvt = null;
const hintState = {sell: false, tab: "", zone: -1, plot: -2};

/* ====================== الإقلاع ====================== */
export function init(){
  initModalKeys();
  initPanels($("panel"));
  R.init($("scene"));
  applyVisual();
  buildZoneChips();

  document.querySelectorAll("#tabs button").forEach(b => b.addEventListener("click", () => { sfx("click"); setTab(b.dataset.tab); }));
  $("btnSettings").addEventListener("click", () => { sfx("click"); openSettings(); });
  document.addEventListener("pointerdown", () => Audio.unlock());
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; });

  const sell = $("sell");
  sell.addEventListener("pointerdown", e => {
    e.preventDefault();
    doTap(e);
    clearInterval(hold); hold = setInterval(() => doTap(e), 140);
  });
  for(const ev of ["pointerup", "pointercancel", "pointerleave"]) sell.addEventListener(ev, () => clearInterval(hold));
  sell.addEventListener("click", e => { if(e.detail === 0) doTap(null); });        // لوحة المفاتيح فقط

  $("scene").addEventListener("pointerdown", e => {
    const r = $("scene").getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const hit = R.pick(x, y);
    if(!hit) return;
    if(hit.type === "meteor"){
      const b = Engine.catchMeteor();
      if(b > 0){ R.burst(x, y, 24); R.clearMeteor(); pop(e.clientX, e.clientY - 10, "+" + fmt(b)); }
    }else selectPlot(hit.pi);
  });
  new ResizeObserver(() => R.resize()).observe($("stage"));

  $("qClaim").addEventListener("click", () => {
    const r = M.claimQuest(G.S);
    if(r){ toast("+" + fmt(r) + " 🪙 مكافأة المهمة"); updateHud(); renderPanel(); update(performance.now(), true); }
  });

  hooks.hud = updateHud;
  hooks.prestige = runPrestige;
  hooks.selectZone = selectZone;
  hooks.afterBuild = (pi, built = true) => { R.burstPlot(pi, built ? 22 : 12, built ? "#ffb938" : "#8bd0ff"); };

  Ads.setMockUI(mockAd);
  bind();
  selectZone(G.S.zone, true);
  update(performance.now(), true);
}

function bind(){
  on("away", showAway);
  on("meteor-spawn", () => R.spawnMeteor());
  on("meteor", d => toast("☄️ شهاب ذهبي! +" + fmt(d.bonus) + " 🪙"));
  on("achievement", a => { toast("🏆 إنجاز: " + a.name + " (+1%)"); });
  on("tier", d => { toast("🕳️ اختفت فئة من الكون! أرباحك +20%"); if(!G.S.set.reduce) R.view.fade = 0.5; });
  on("quest-ready", () => toast("🎯 أنهيت المهمة! اضغط «استلم»"));
  on("event", () => toast("✨ ساعة الذهب: ×2 للدخل لمدة 90 ثانية"));
  on("toast", m => toast(m));
  on("zone", d => { R.burst(R.size().W / 2, R.size().H / 2, 40, "#8bd0ff"); toast("🌍 فتحت منطقة جديدة: " + ZONES[d.zi].name); });
  on("universe", () => toast("🌌 بعت الكون! افتح تبويب 🌌 لتبدأ جولة جديدة"));
  on("repair", () => toast("تم إصلاح قيمة تالفة في الحفظ."));
  on("state-replaced", () => { selectZone(G.S.zone, true); renderPanel(); update(performance.now(), true); });
}

/* ====================== الإجراءات ====================== */
function doTap(e){
  const got = Engine.tap();
  if(got < 0) return;
  if(e && got > 0) pop(e.clientX, e.clientY - 14, "+" + fmt(got));
  updateDock(); updateHud();
}

export function setTab(t){
  ui.tab = t;
  document.querySelectorAll("#tabs button").forEach(b => { const on = b.dataset.tab === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
  renderPanel();
}
function selectPlot(pi){
  sfx("click");
  ui.sel = pi; ui.zonePreview = -1; R.view.sel = pi;
  setTab("city");
}
function selectZone(zi, silent){
  const S = G.S;
  if(!S.zones[zi].unlocked) zi = 0;
  S.zone = zi; ui.zonePreview = -1; ui.sel = -1;
  R.view.zone = zi; R.view.sel = -1;
  if(!silent && !S.set.reduce) R.view.fade = 0.8;
  if(!silent) sfx("click");
  if(ui.tab === "city") renderPanel();
}
function buildZoneChips(){
  const box = $("zones");
  box.replaceChildren();
  zoneEls = ZONES.map((z, i) => {
    const b = h("button", {class: "zchip", type: "button", "aria-label": z.name, title: z.name}, z.em);
    b.addEventListener("click", () => {
      sfx("click");
      const S = G.S;
      if(S.zones[i].unlocked){ selectZone(i); if(ui.tab !== "city") setTab("city"); }
      else { ui.zonePreview = i; ui.sel = -1; R.view.sel = -1; setTab("city"); }
    });
    box.append(b);
    return b;
  });
}

function applyVisual(){
  const s = G.S.set;
  document.body.classList.toggle("reduce", !!s.reduce);
  R.setQuality(s.quality, s.reduce);
}

/* ====================== التحديث الدوري ====================== */
function updateHud(){
  const S = G.S, c = S.calc;
  setText($("coins"), fmt(S.coins));
  setText($("inc"), fmtRate(c.inc));
  setText($("rpv"), c.lv[10] > 0 || S.rp > 0 ? "🔬 " + fmt(S.rp) : "");
  const boost = $("boostChip");
  boost.hidden = S.boost <= 0;
  if(S.boost > 0) setText($("boostT"), fmtTime(S.boost));
  const sh = $("shardChip");
  sh.hidden = S.shards <= 0 && S.shardsLife <= 0;
  setText($("shards"), String(S.shards));
}

function updateDock(){
  const S = G.S, it = ITEMS[S.tier], last = S.tier === E.LAST_TIER;
  setText($("emoji"), it.e);
  setText($("iname"), (last ? "بع " : "بع ") + it.n);
  setText($("price"), "+" + fmt(it.v * S.calc.sm * S.calc.click) + " 🪙 للضغطة");
  $("fill").style.width = Math.min(100, S.sold / it.need * 100) + "%";
  let msg;
  if(S.universeSold) msg = "الكون بيع! افتح تبويب 🌌 لجولة جديدة";
  else if(last) msg = "بيعة واحدة وينتهي الكون";
  else if(S.sold >= it.need) msg = "اكسب " + fmt(ITEMS[S.tier + 1].req - S.total) + " 🪙 أخرى لتفتح «" + ITEMS[S.tier + 1].n + "»";
  else msg = S.sold + "/" + it.need + " ثم تختفي هذه الفئة";
  setText($("left"), msg);
}

function updateQuest(){
  const c = M.currentQuest(G.S), box = $("quest");
  if(!c){ box.hidden = true; return; }
  box.hidden = false;
  setText($("qText"), c.q.text);
  setText($("qProg"), fmt(c.cur) + "/" + fmt(c.target));
  $("qFill").style.width = (c.cur / c.target * 100) + "%";
  $("qClaim").hidden = !c.done;
  box.classList.toggle("done", c.done);
}

function updateZones(){
  const S = G.S;
  zoneEls.forEach((b, i) => {
    const un = S.zones[i].unlocked, ready = !un && E.zoneReady(S, i) && S.coins >= (E.ZONE_COST ? 0 : 0);
    b.classList.toggle("on", un && S.zone === i && ui.zonePreview < 0);
    b.classList.toggle("lock", !un);
    b.classList.toggle("ready", !un && E.zoneReady(S, i));
    b.setAttribute("aria-pressed", un && S.zone === i ? "true" : "false");
    setText(b, un ? ZONES[i].em : "🔒");
  });
}

function updateHints(){
  const S = G.S, c = M.currentQuest(S), hint = c && !c.done ? c.q.hint : "none";
  const sellOn = hint === "sell";
  if(sellOn !== hintState.sell){ hintState.sell = sellOn; $("sell").classList.toggle("pulse", sellOn); }
  const tab = hint.startsWith("tab:") ? hint.slice(4) : "";
  if(tab !== hintState.tab){
    hintState.tab = tab;
    document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("pulse", b.dataset.tab === tab && ui.tab !== tab));
  }
  const zone = hint === "zone" ? 1 : -1;
  if(zone !== hintState.zone){ hintState.zone = zone; zoneEls.forEach((b, i) => b.classList.toggle("pulse", i === zone)); }
  let plot = -1;
  if(hint === "plot"){
    const Z = S.zones[S.zone];
    for(const k of [5, 6, 9, 10, 1, 2, 4, 7, 8, 11, 13, 14]) if(Z.open[k] && !Z.plots[k]){ plot = k; break; }
    if(plot < 0) for(let k = 0; k < Z.open.length; k++) if(Z.open[k] && !Z.plots[k]){ plot = k; break; }
  }
  R.view.hint = plot;
  // نقاط التنبيه على التبويبات
  const claimable = (c && c.done) || M.loginInfo(S).can || [...S.daily.list.map((m, i) => [S.daily, m]), ...S.weekly.list.map(m => [S.weekly, m])]
    .some(([, m]) => !m.claimed && M.missionProgress(S, m).done);
  $("tabQ").classList.toggle("dot", !!claimable);
  $("tabU").classList.toggle("dot", !!S.universeSold);
}

// يُستدعى كل إطار لكن العمل الفعلي 5 مرات في الثانية
export function update(t, force){
  if(!force && t - lastUi < 200) return;
  lastUi = t;
  if(!G.S) return;
  updateHud(); updateDock(); updateQuest(); updateZones(); updateHints(); updatePanel();
}

/* ====================== Prestige ====================== */
function runPrestige(){
  const gain = Engine.doPrestige();
  if(!(gain > 0)) return;
  const cine = $("cine"), fast = G.S.set.reduce;
  cine.replaceChildren(h("div", {class: "cine-in"}, h("h1", null, "بعت الكون 🌌"), h("p", null, "+" + gain + " 🌑 شظايا"), h("p", {class: "d"}, "إمبراطورية جديدة تبدأ الآن")));
  cine.hidden = false; cine.classList.add("on");
  selectZone(0, true);
  setTimeout(() => { cine.classList.remove("on"); setTimeout(() => { cine.hidden = true; }, 500); renderPanel(); update(performance.now(), true); }, fast ? 900 : 3200);
}

/* ====================== نافذة الغياب ====================== */
function showAway(info){
  const {gap, g} = info, val = h("div", {class: "big"}, "0 🪙");
  const body = h("div", null, h("p", null, "إمبراطوريتك ربحت أثناء غيابك (" + fmtTime(gap) + (gap > E.awayGain(G.S, gap).sec ? ": حتى السقف" : "") + ")"), val,
                 g.rp > 0 ? h("p", {class: "d"}, "+ " + fmt(g.rp) + " 🔬 نقاط بحث") : null);
  const t0 = performance.now(), fast = G.S.set.reduce;
  const tick = now => {
    const k = fast ? 1 : Math.min(1, (now - t0) / 1200);
    setText(val, fmt(g.coins * k) + " 🪙");
    if(k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const buttons = [{text: "استلم", cls: "primary", onclick: () => { Engine.claimAway(1); updateHud(); }}];
  if(Ads.isReady("offline")){
    buttons.unshift({text: "🎬 ×2 بإعلان", cls: "gold", onclick: async () => {
      const ok = await Ads.rewarded("offline");
      if(ok){ Engine.claimAway(2); updateHud(); return; }
      toast("لم يكتمل الإعلان. يمكنك استلام الأرباح العادية."); return "keep";
    }});
  }
  modal({title: "مرحبًا بعودتك", body, buttons, dismissable: false});
}

/* ====================== إعلان تجريبي ====================== */
function mockAd(placement, seconds){
  return new Promise(resolve => {
    let left = seconds, done = false;
    const label = h("div", {class: "big"}, String(left));
    const finish = ok => { if(done) return; done = true; clearInterval(iv); closeModal(true); resolve(ok); };
    const iv = setInterval(() => { left--; label.textContent = String(Math.max(0, left)); if(left <= 0) finish(true); }, 1000);
    modal({title: "إعلان تجريبي", dismissable: false,
      body: h("div", null, h("p", {class: "d"}, "هذا بديل مؤقت لإعلان حقيقي. اربط مزوّد الإعلانات من ads.js."), label),
      buttons: [{text: "إغلاق (بدون مكافأة)", cls: "ghost", onclick: () => { finish(false); return "keep"; }}]});
  });
}

/* ====================== الإعدادات ====================== */
function toggle(label, get, set){
  const b = h("button", {class: "btn small", type: "button"});
  const sync = () => { b.textContent = label + ": " + (get() ? "تشغيل" : "إيقاف"); b.setAttribute("aria-pressed", get() ? "true" : "false"); };
  b.addEventListener("click", () => { set(!get()); sync(); sfx("click"); });
  sync(); return b;
}
function slider(label, key){
  const inp = h("input", {type: "range", min: "0", max: "100", step: "5", value: String(Math.round(G.S.set[key] * 100)), "aria-label": label});
  inp.addEventListener("input", () => { G.S.set[key] = Number(inp.value) / 100; Audio.unlock(); Audio.applyVolumes(); });
  inp.addEventListener("change", () => Engine.requestSave());
  return h("label", {class: "slider"}, h("span", null, label), inp);
}

function openSettings(){
  const S = G.S, set = S.set;
  const q = name => { const b = h("button", {class: "btn small", type: "button", "aria-pressed": set.quality === name ? "true" : "false"}, {low: "منخفضة", medium: "متوسطة", high: "عالية"}[name]);
    b.addEventListener("click", () => { set.quality = name; applyVisual(); Engine.requestSave(); box.querySelectorAll(".qbtn").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false")); }); b.classList.add("qbtn"); return b; };
  const box = h("div", {class: "settings"},
    h("div", {class: "sec"}, "🔊 الصوت"),
    toggle("الموسيقى", () => set.music, v => { set.music = v; Audio.unlock(); Audio.applyVolumes(); Engine.requestSave(); }),
    slider("مستوى الموسيقى", "vm"),
    toggle("المؤثرات", () => set.sfx, v => { set.sfx = v; Audio.unlock(); Audio.applyVolumes(); Engine.requestSave(); }),
    slider("مستوى المؤثرات", "vs"),
    slider("الصوت العام", "vol"),
    h("div", {class: "sec"}, "🎨 العرض"),
    toggle("تقليل الحركة", () => set.reduce, v => { set.reduce = v; applyVisual(); Engine.requestSave(); }),
    h("div", {class: "line"}, h("span", null, "جودة الرسم"), q("low"), q("medium"), q("high")),
    h("div", {class: "sec"}, "💾 الحفظ"),
    h("div", {class: "line"},
      h("button", {class: "btn small", type: "button", onclick: () => openExport()}, "تصدير"),
      h("button", {class: "btn small", type: "button", onclick: () => openImport()}, "استيراد"),
      h("button", {class: "btn small danger", type: "button", onclick: () => confirmDialog("مسح كل التقدم؟", "سيُحذف الحفظ والنسخة الاحتياطية نهائيًا ولا يمكن التراجع.", "امسح كل شيء", () => { hardReset(); Engine.replaceState(fresh()); toast("بدأت لعبة جديدة"); }, true)}, "إعادة ضبط")),
    installEvt ? h("button", {class: "btn small", type: "button", onclick: async () => { installEvt.prompt(); installEvt = null; closeModal(); }}, "📲 ثبّت اللعبة كتطبيق") : null,
    h("div", {class: "sec"}, "ℹ️ حول"),
    h("p", {class: "d"}, "إمبراطورية بائع الكون · الإصدار " + VERSION + ". الحفظ محلي على جهازك. لا حسابات ولا خوادم."));
  modal({title: "الإعدادات", body: box, buttons: [{text: "تم", cls: "primary"}], dismissable: true});
}
function openExport(){
  Engine.saveNow();
  const code = exportCode(G.S);
  const ta = h("textarea", {readonly: true, rows: "5", "aria-label": "رمز الحفظ", dir: "ltr"}, code);
  modal({title: "تصدير الحفظ", dismissable: true,
    body: h("div", null, h("p", {class: "d"}, "انسخ الرمز واحفظه في مكان آمن. تستطيع استعادته من «استيراد» على أي جهاز."), ta),
    buttons: [
      {text: "نسخ", cls: "primary", keep: true, onclick: async () => { try{ await navigator.clipboard.writeText(code); toast("تم النسخ"); }catch(e){ ta.select(); toast("حدّد الرمز وانسخه يدويًا"); } }},
      {text: "إغلاق", cls: "ghost"}]});
}
function openImport(){
  const ta = h("textarea", {rows: "5", placeholder: "الصق رمز الحفظ هنا", "aria-label": "رمز الاستيراد", dir: "ltr"});
  modal({title: "استيراد الحفظ", dismissable: true,
    body: h("div", null, h("p", {class: "d"}, "سيستبدل هذا حفظك الحالي. صدّر حفظك أولًا إن أردت الاحتفاظ به."), ta),
    buttons: [
      {text: "استيراد", cls: "danger", onclick: () => {
        const S = importCode(ta.value);
        if(!S){ toast("الرمز غير صالح أو تالف"); return "keep"; }
        Engine.replaceState(S); applyVisual(); toast("تم استيراد الحفظ");
      }},
      {text: "إلغاء", cls: "ghost"}]});
}
