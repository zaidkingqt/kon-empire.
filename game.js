"use strict";
/* إمبراطورية بائع الكون — لعبة تايكون 2.5D */

const KEY = "kon-empire-v2";
const N = 4;            // شبكة المدينة N×N
const MAXLV = 75;

/* ---------- البيانات ---------- */
// المباني: cost = سعر البناء، g = نمو سعر الترقية، inc = دخل/ثانية عند المستوى 1
const TYPES = [
  {name:"كشك ماء",          em:"💧", col:"#3aa8ff", cost:15,      g:1.13, inc:0.4,  unlock:0},
  {name:"مزرعة الدجاج",     em:"🐔", col:"#e8743a", cost:150,     g:1.14, inc:3,    unlock:100},
  {name:"مقهى القطط",       em:"🐱", col:"#f06fb0", cost:1600,    g:1.15, inc:22,   unlock:1200},
  {name:"مصنع الأحلام",     em:"💤", col:"#8a7dff", cost:18000,   g:1.16, inc:150,  unlock:12000},
  {name:"مختبر الفيروس",    em:"🧪", col:"#4fd06a", cost:220000,  g:1.17, inc:1100, unlock:150000},
  {name:"مصنع الثقب الأسود",em:"🕳️", col:"#4a3a8a", cost:3000000, g:1.18, inc:9000, unlock:1500000}
];

// سلّم البيع: v = سعر البيعة، need = عدد البيعات، req = أرباح مكتسبة مطلوبة لفتحه
const ITEMS = [
  {n:"كوب ماء",  e:"💧", v:1,      need:12, req:0},
  {n:"ليموناضة", e:"🍋", v:3,      need:12, req:60},
  {n:"كرسي",     e:"🪑", v:10,     need:15, req:400},
  {n:"سيارة",    e:"🚗", v:35,     need:15, req:3e3},
  {n:"بيت",      e:"🏠", v:120,    need:15, req:2e4},
  {n:"شارع",     e:"🛣️", v:400,    need:20, req:1.5e5},
  {n:"مدينة",    e:"🏙️", v:1500,   need:20, req:1.2e6},
  {n:"دولة",     e:"🗺️", v:5000,   need:20, req:1e7},
  {n:"القمر",    e:"🌙", v:20000,  need:25, req:8e7},
  {n:"الشمس",    e:"☀️", v:80000,  need:25, req:6e8},
  {n:"الكون",    e:"🌌", v:300000, need:1,  req:4e9}
];

// مساعدون يبيعون تلقائيًا
const AS = [
  {n:"قطة بائعة",   e:"🐱",   cost:50,    g:1.15, sps:0.5},
  {n:"موظف مبيعات", e:"🧑‍💼", cost:2500,  g:1.15, sps:8},
  {n:"روبوت تاجر",  e:"🤖",   cost:90000, g:1.15, sps:120}
];

/* ---------- الحالة ---------- */
const $ = id => document.getElementById(id);

function fresh(){
  return {coins:0,total:0,tier:0,sold:0,click:0,as:[0,0,0],mkt:0,
          plots:Array(N*N).fill(null),shards:0,t:Date.now(),sound:true};
}
function load(){
  try{
    const d = JSON.parse(localStorage.getItem(KEY));
    if(!d) return fresh();
    const f = Object.assign(fresh(), d);
    if(!Array.isArray(f.plots) || f.plots.length !== N*N) f.plots = Array(N*N).fill(null);
    return f;
  }catch(e){ return fresh(); }
}
function save(){
  S.t = Date.now();
  try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){}
}

let S = load();
let ended = false;
let selected = null;
let tab = "city";
let updaters = [];

/* ---------- الحسابات ---------- */
const ms = l => (l>=10?2:1) * (l>=25?2:1) * (l>=50?2:1);
const gm = () => (1 + .5*S.shards) * (1 + .25*S.tier) * Math.pow(1.5, S.mkt);
const incOf = p => p ? TYPES[p.t].inc * p.l * ms(p.l) : 0;
const income = () => S.plots.reduce((a,p)=>a+incOf(p),0) * gm();
const perClick = () => 1 + S.click;
const buildCost = t => Math.floor(TYPES[t].cost * Math.pow(1.6, S.plots.filter(p=>p&&p.t===t).length));
const lvCostN = (p,n) => { let s=0; for(let i=0;i<n;i++) s += Math.floor(TYPES[p.t].cost * Math.pow(TYPES[p.t].g, p.l+i)); return s; };
const cClick = () => Math.floor(25 * Math.pow(1.7, S.click));
const cMkt = () => Math.floor(800 * Math.pow(4, S.mkt));
const cAs = i => Math.floor(AS[i].cost * Math.pow(AS[i].g, S.as[i]));
const salesPerSec = () => AS.reduce((a,x,i)=>a+S.as[i]*x.sps,0);
const prog = () => Math.min(1, (S.tier + S.sold/ITEMS[S.tier].need) / ITEMS.length);

function fmt(n){
  if(n < 1000) return String(Math.floor(n));
  const u = ["","K","M","B","T","Qa","Qi"]; let i = 0;
  while(n >= 1000 && i < u.length-1){ n /= 1000; i++; }
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + u[i];
}
function earn(x){ S.coins += x; S.total += x; return x; }

/* ---------- الصوت ---------- */
let ac = null;
document.addEventListener("pointerdown", ()=>{
  if(!ac){ try{ ac = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(ac && ac.state === "suspended") ac.resume();
});
function beep(f,d=.08,type="sine",v=.05,when=0){
  if(!S.sound || !ac) return;
  const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t+d);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+d);
}
function sfx(k){
  if(k==="tap") beep(520+Math.random()*260,.05,"sine",.04);
  else if(k==="build"){ beep(440,.1,"triangle"); beep(660,.14,"triangle",.05,.09); }
  else if(k==="gone") beep(110,.6,"sawtooth",.05);
  else if(k==="bonus"){ [523,659,784,1047].forEach((f,i)=>beep(f,.15,"triangle",.05,i*.07)); }
  else if(k==="end"){ beep(70,1.6,"sawtooth",.08); beep(55,2,"sine",.08,.2); }
}

/* ---------- البيع ---------- */
function advance(){
  if(S.tier === ITEMS.length-1){ finish(); return true; }
  if(S.total < ITEMS[S.tier+1].req) return false;
  const gone = ITEMS[S.tier];
  S.tier++; S.sold = 0;
  toast("اختفى «" + gone.n + "» من الكون... ولم يلاحظ أحد 🕳️");
  sfx("gone");
  return true;
}
function finish(){
  ended = true; sfx("end");
  $("end").classList.add("on");
  save();
}
function sell(n){
  let got = 0, guard = 0;
  while(n > 0 && !ended && guard++ < 60){
    const it = ITEMS[S.tier], free = it.need - S.sold;
    if(free <= 0){
      if(!advance()){ got += earn(n * it.v * gm()); return got; }
      continue;
    }
    const k = Math.min(n, free);
    got += earn(k * it.v * gm());
    S.sold += k; n -= k;
    if(S.sold >= it.need) advance();
  }
  return got;
}

/* ---------- الواجهة ---------- */
let toastT;
function toast(t){
  const e = $("toast"); e.textContent = t; e.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(()=>e.classList.remove("on"), 2800);
}
function pop(x,y,t){
  const e = document.createElement("div");
  e.className = "pop"; e.textContent = t; e.style.left = x+"px"; e.style.top = y+"px";
  document.body.appendChild(e); setTimeout(()=>e.remove(), 850);
}

function hud(){
  $("coins").textContent = fmt(S.coins);
  $("inc").textContent = fmt(income());
  $("shardTag").textContent = S.shards ? "🌑 ×" + (1+.5*S.shards).toFixed(1) : "";
  $("snd").textContent = S.sound ? "🔊" : "🔇";
}
function dock(){
  const it = ITEMS[S.tier], last = S.tier === ITEMS.length-1;
  $("emoji").textContent = it.e;
  $("iname").textContent = "بع " + it.n;
  $("price").textContent = "+" + fmt(it.v * gm() * perClick()) + " 🪙 للضغطة";
  $("fill").style.width = Math.min(100, S.sold/it.need*100) + "%";
  let msg;
  if(last) msg = "آخر شيء بقي. هل تجرؤ؟";
  else if(S.sold >= it.need) msg = "اكسب " + fmt(ITEMS[S.tier+1].req - S.total) + " 🪙 أخرى لتفتح «" + ITEMS[S.tier+1].n + "»";
  else msg = S.sold + "/" + it.need + " ثم تختفي هذه الفئة";
  $("left").textContent = msg;
}
function refresh(){ updaters.forEach(f=>f()); hud(); dock(); }

// صف زر في اللوحة
function row(parent, o){
  const b = document.createElement("button");
  b.className = "row";
  b.innerHTML = '<span class="ic">'+o.ic+'</span><span class="tx"><b>'+o.name+'</b><span class="d"></span></span><span class="cost"></span>';
  const d = b.querySelector(".d"), c = b.querySelector(".cost");
  const upd = ()=>{
    d.textContent = o.desc();
    const cs = o.cost(); c.textContent = typeof cs === "number" ? fmt(cs) + " 🪙" : cs;
    b.disabled = !o.ok();
  };
  b.addEventListener("click", ()=>{ if(!b.disabled){ o.act(); refresh(); } });
  upd(); updaters.push(upd); parent.appendChild(b); return b;
}
function head(parent, html){
  const h = document.createElement("div"); h.className = "head"; h.innerHTML = html; parent.appendChild(h); return h;
}

function tabCity(el){
  if(selected === null){
    head(el, "اضغط على قطعة أرض في المدينة لتبني عليها. كل مبنى يزيد <b>دخلك في الثانية</b> وكلما ارتفع مستواه ارتفع في المشهد.");
    return;
  }
  const p = S.plots[selected];
  if(!p){
    head(el, "قطعة فارغة. اختر ما تبنيه:");
    TYPES.forEach((T,i)=>row(el,{
      ic:T.em, name:T.name,
      desc:()=> S.total < T.unlock ? "يفتح عند " + fmt(T.unlock) + " 🪙 مكتسبة" : "يدرّ " + fmt(T.inc*gm()) + " 🪙 في الثانية",
      cost:()=> S.total < T.unlock ? "🔒" : buildCost(i),
      ok:()=> S.total >= T.unlock && S.coins >= buildCost(i),
      act:()=>{ S.coins -= buildCost(i); S.plots[selected] = {t:i,l:1}; sfx("build"); renderPanel(); }
    }));
    return;
  }
  const T = TYPES[p.t];
  const h = head(el, "");
  const upd0 = ()=>{
    const next = [10,25,50].find(x=>x>p.l);
    h.innerHTML = "<b>" + T.em + " " + T.name + "</b> · مستوى " + p.l + "<br>يدرّ " + fmt(incOf(p)*gm()) + " 🪙/ث" +
      (next ? " · يتضاعف الدخل عند المستوى " + next : " · وصل لكل المضاعفات");
  };
  upd0(); updaters.push(upd0);
  [1,10].forEach(n=>row(el,{
    ic:"⬆️", name: n===1 ? "ترقية" : "ترقية ×10",
    desc:()=> p.l >= MAXLV ? "أقصى مستوى" : "إلى المستوى " + Math.min(MAXLV, p.l+n),
    cost:()=> p.l >= MAXLV ? "—" : lvCostN(p, Math.min(n, MAXLV-p.l)),
    ok:()=> p.l < MAXLV && S.coins >= lvCostN(p, Math.min(n, MAXLV-p.l)),
    act:()=>{ const k = Math.min(n, MAXLV-p.l); S.coins -= lvCostN(p,k); p.l += k; sfx("build"); }
  }));
}

function tabUp(el){
  row(el,{ic:"👆", name:"يد أسرع",
    desc:()=>"كل ضغطة تبيع " + (perClick()+1) + " بدل " + perClick(),
    cost:cClick, ok:()=>S.coins>=cClick(),
    act:()=>{ S.coins -= cClick(); S.click++; sfx("build"); }});
  AS.forEach((a,i)=>row(el,{ic:a.e, name:a.n,
    desc:()=>"+" + a.sps + " بيعة/ث · لديك " + S.as[i],
    cost:()=>cAs(i), ok:()=>S.coins>=cAs(i),
    act:()=>{ S.coins -= cAs(i); S.as[i]++; sfx("build"); }}));
  row(el,{ic:"📣", name:"حملة تسويق",
    desc:()=>"كل أرباحك ×1.5 · المستوى " + S.mkt,
    cost:()=> S.mkt >= 12 ? "—" : cMkt(), ok:()=> S.mkt < 12 && S.coins >= cMkt(),
    act:()=>{ S.coins -= cMkt(); S.mkt++; sfx("bonus"); }});
}

function tabUni(el){
  head(el, "الثقب الأسود ابتلع <b id='pct'>0%</b> من الكون.<br>كل فئة تبيعها ترفع أرباحك 25%. شظايا الثقب: <b>" + S.shards + "</b>");
  const pctUpd = ()=>{ const e=$("pct"); if(e) e.textContent = Math.round(prog()*100) + "%"; };
  updaters.push(pctUpd);
  ITEMS.forEach((it,i)=>{
    const d = document.createElement("div"); d.className = "row static";
    d.innerHTML = '<span class="ic">'+it.e+'</span><span class="tx"><b>'+it.n+'</b><span class="d"></span></span><span class="cost"></span>';
    const dd = d.querySelector(".d"), cc = d.querySelector(".cost");
    const upd = ()=>{
      d.classList.toggle("now", i === S.tier);
      if(i < S.tier){ dd.textContent = "اختفى من الكون"; cc.textContent = "✔️"; }
      else if(i === S.tier){ dd.textContent = "تبيعه الآن"; cc.textContent = S.sold + "/" + it.need; }
      else { dd.textContent = S.total >= it.req ? "جاهز للفتح" : "يفتح عند " + fmt(it.req) + " 🪙 مكتسبة"; cc.textContent = S.total >= it.req ? "🔓" : "🔒"; }
    };
    upd(); updaters.push(upd); el.appendChild(d);
  });
}

function renderPanel(){
  updaters = [];
  const el = $("panel"); el.innerHTML = "";
  ({city:tabCity, up:tabUp, uni:tabUni})[tab](el);
  refresh();
}
document.querySelectorAll("#tabs button").forEach(b=>b.addEventListener("click", ()=>{
  tab = b.dataset.tab;
  document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on", x===b));
  renderPanel();
}));
function setTab(t){ document.querySelector('#tabs button[data-tab="'+t+'"]').click(); }

/* ---------- أزرار التحكم ---------- */
const sellBtn = $("sell");
let holdT = null;
function tap(e){
  const got = sell(perClick());
  const r = sellBtn.getBoundingClientRect();
  const x = (e && e.clientX) ? e.clientX : r.left + r.width/2, y = (e && e.clientY) ? e.clientY : r.top;
  if(got > 0) pop(x, y - 10, "+" + fmt(got));
  sfx("tap"); hud(); dock();
}
sellBtn.addEventListener("pointerdown", e=>{
  e.preventDefault(); tap(e);
  clearInterval(holdT); holdT = setInterval(()=>tap(e), 140);
});
["pointerup","pointerleave","pointercancel"].forEach(ev=>sellBtn.addEventListener(ev, ()=>clearInterval(holdT)));
sellBtn.addEventListener("click", e=>{ if(e.detail === 0) tap(null); });   // لوحة المفاتيح

$("snd").addEventListener("click", ()=>{ S.sound = !S.sound; hud(); save(); });

function restart(shards){
  S = fresh(); S.shards = shards;
  ended = false; selected = null; meteor = null;
  $("end").classList.remove("on");
  renderPanel(); save();
}
$("again").addEventListener("click", ()=>restart(S.shards + 1));
$("rst").addEventListener("click", ()=>{
  if(confirm("مسح كل التقدم بما فيه الشظايا؟")){
    try{ localStorage.removeItem(KEY); }catch(e){}
    restart(0);
  }
});

/* ---------- المشهد الإيزومتري ---------- */
const cv = $("scene"), cx = cv.getContext("2d");
let W = 0, H = 0, tw = 0, th = 0, ox = 0, oy = 0, slab = 0;
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

function layout(){
  const r = cv.parentElement.getBoundingClientRect(), d = Math.min(window.devicePixelRatio||1, 2);
  W = r.width; H = r.height;
  cv.width = Math.max(1,W*d); cv.height = Math.max(1,H*d);
  cx.setTransform(d,0,0,d,0,0);
  tw = Math.min(W*.94/N, H/3.5); th = tw/2; slab = tw*.14;
  ox = W/2; oy = H - N*th - slab - 6;
}
addEventListener("resize", layout);
addEventListener("orientationchange", ()=>setTimeout(layout,250));

const P = (gx,gy) => [ox + (gx-gy)*tw/2, oy + (gx+gy)*th/2];

function shade(hex,f){
  const n = parseInt(hex.slice(1),16);
  const r = Math.min(255,Math.round(((n>>16)&255)*f)), g = Math.min(255,Math.round(((n>>8)&255)*f)), b = Math.min(255,Math.round((n&255)*f));
  return "rgb("+r+","+g+","+b+")";
}
function poly(pts,fill,stroke,lw){
  cx.beginPath(); cx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) cx.lineTo(pts[i][0],pts[i][1]);
  cx.closePath();
  if(fill){ cx.fillStyle = fill; cx.fill(); }
  if(stroke){ cx.strokeStyle = stroke; cx.lineWidth = lw||1; cx.stroke(); }
}
function geo(gx,gy,p){
  const c = P(gx+.5, gy+.5);
  return {x:c[0], y:c[1], hw:tw*.34, hh:th*.34, h: p ? tw*(.16 + Math.min(p.l,60)*.013) : 0};
}

const stars = Array.from({length:240}, ()=>({x:Math.random(), y:Math.random()*.9, r:Math.random()*1.3+.3, p:Math.random()*6.28}));
const parts = [];
let meteor = null, meteorTimer = 25 + Math.random()*25, frameDt = .016;

function burst(x,y){
  for(let i=0;i<18;i++){
    const a = Math.random()*6.283, v = 40 + Math.random()*110;
    parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,r:2+Math.random()*2,c:"#ffb938"});
  }
}
function drawSky(t){
  const g = cx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#05030d"); g.addColorStop(1,"#1a0f38");
  cx.fillStyle = g; cx.fillRect(0,0,W,H);
  const p = prog(), vis = Math.floor(stars.length*(1-p));
  cx.fillStyle = "#fff";
  for(let i=0;i<vis;i++){
    const s = stars[i];
    cx.globalAlpha = still ? .7 : .3 + .7*Math.abs(Math.sin(t/900 + s.p));
    cx.beginPath(); cx.arc(s.x*W, s.y*H, s.r, 0, 6.283); cx.fill();
  }
  cx.globalAlpha = 1;
  const x = W/2, y = H*.3, R = 8 + p*Math.min(W,H)*.42;
  const gr = cx.createRadialGradient(x,y,R*.92,x,y,R*2.1);
  gr.addColorStop(0,"rgba(255,120,50,.85)"); gr.addColorStop(.35,"rgba(255,90,54,.22)"); gr.addColorStop(1,"rgba(255,90,54,0)");
  cx.fillStyle = gr; cx.beginPath(); cx.arc(x,y,R*2.1,0,6.283); cx.fill();
  cx.fillStyle = "#000"; cx.beginPath(); cx.arc(x,y,R,0,6.283); cx.fill();
}
function drawGround(t){
  const T = P(0,0), R = P(N,0), B = P(N,N), L = P(0,N);
  poly([L,B,[B[0],B[1]+slab],[L[0],L[1]+slab]], "#150d2b");
  poly([B,R,[R[0],R[1]+slab],[B[0],B[1]+slab]], "#0e081e");
  poly([T,R,B,L], "#211741");
  for(let gy=0;gy<N;gy++) for(let gx=0;gx<N;gx++){
    const i = gx + gy*N, pts = [P(gx,gy),P(gx+1,gy),P(gx+1,gy+1),P(gx,gy+1)];
    poly(pts, (gx+gy)%2 ? "#2a1f4d" : "#251b46", "rgba(120,100,200,.18)");
    if(!S.plots[i]){
      const c = P(gx+.5,gy+.5);
      cx.fillStyle = "rgba(255,185,56," + (still ? .5 : .35 + .25*Math.sin(t/600+i)) + ")";
      cx.font = "700 " + Math.round(tw*.3) + "px sans-serif";
      cx.textAlign = "center"; cx.textBaseline = "middle";
      cx.fillText("+", c[0], c[1]);
    }
    if(selected === i){
      poly(pts, "rgba(255,185,56,.13)", "#ffb938", 2.5);
    }
  }
}
function drawBuilding(p,gx,gy,t){
  const T = TYPES[p.t], g = geo(gx,gy,p), x = g.x, y = g.y, hw = g.hw, hh = g.hh, h = g.h;
  // ظل
  cx.fillStyle = "rgba(0,0,0,.35)";
  cx.beginPath(); cx.ellipse(x+hw*.25, y+hh*.4, hw*1.05, hh*1.05, 0, 0, 6.283); cx.fill();
  // الوجوه
  poly([[x-hw,y],[x,y+hh],[x,y+hh-h],[x-hw,y-h]], shade(T.col,.72));
  poly([[x+hw,y],[x,y+hh],[x,y+hh-h],[x+hw,y-h]], shade(T.col,.5));
  // النوافذ
  const rows = Math.min(5, 1 + Math.floor(p.l/4));
  for(let side=-1; side<=1; side+=2){
    cx.fillStyle = side<0 ? "rgba(255,225,130,.9)" : "rgba(255,225,130,.55)";
    for(let r=0;r<rows;r++){
      const v0 = .1 + r*(.8/rows), v1 = v0 + (.8/rows)*.55;
      [[.15,.4],[.6,.85]].forEach(c=>{
        const pt = (u,v)=>[x + side*hw*(1-u), y + hh*u - h*v];
        poly([pt(c[0],v0),pt(c[1],v0),pt(c[1],v1),pt(c[0],v1)], cx.fillStyle);
      });
    }
  }
  // السقف
  poly([[x,y-hh-h],[x+hw,y-h],[x,y+hh-h],[x-hw,y-h]], shade(T.col,1.14), "rgba(255,255,255,.28)");
  // الرمز
  const bob = still ? 0 : Math.sin(t/520 + gx*2 + gy)*2;
  cx.font = Math.round(tw*.34) + "px " + EMOJI_FONT;
  cx.textAlign = "center"; cx.textBaseline = "middle";
  cx.fillText(T.em, x, y-h-hh*.15+bob);
  // شارة المستوى
  const fs = Math.max(9, Math.round(tw*.11));
  cx.font = "700 " + fs + "px sans-serif";
  const label = "Lv " + p.l, w = cx.measureText(label).width + 8;
  cx.fillStyle = "rgba(0,0,0,.65)";
  cx.beginPath(); cx.roundRect ? cx.roundRect(x-w/2, y+hh+2, w, fs+5, 6) : cx.rect(x-w/2, y+hh+2, w, fs+5); cx.fill();
  cx.fillStyle = "#ffb938"; cx.fillText(label, x, y+hh+2+(fs+5)/2);
  // شرارات الدخل
  if(!still && parts.length < 260 && Math.random() < frameDt*(.25 + p.l*.012))
    parts.push({x:x+(Math.random()-.5)*hw, y:y-h-hh, vx:0, vy:-32, life:1, r:2, c:"#ffb938"});
}
function drawParts(){
  for(let i=parts.length-1;i>=0;i--){
    const q = parts[i];
    q.life -= frameDt; if(q.life <= 0){ parts.splice(i,1); continue; }
    q.x += q.vx*frameDt; q.y += q.vy*frameDt;
    cx.globalAlpha = Math.min(1,q.life); cx.fillStyle = q.c;
    cx.beginPath(); cx.arc(q.x,q.y,q.r,0,6.283); cx.fill();
  }
  cx.globalAlpha = 1;
}
function drawMeteor(){
  if(!meteor) return;
  const g = cx.createRadialGradient(meteor.x,meteor.y,2,meteor.x,meteor.y,38);
  g.addColorStop(0,"rgba(255,200,80,.85)"); g.addColorStop(1,"rgba(255,200,80,0)");
  cx.fillStyle = g; cx.beginPath(); cx.arc(meteor.x,meteor.y,38,0,6.283); cx.fill();
  cx.font = "34px " + EMOJI_FONT; cx.textAlign = "center"; cx.textBaseline = "middle";
  cx.fillText("☄️", meteor.x, meteor.y);
}

let lastT = 0;
function frame(t){
  frameDt = Math.min(.05, (t-lastT)/1000 || .016); lastT = t;
  drawSky(t);
  drawGround(t);
  for(let s=0; s<=2*N-2; s++){
    for(let gx=0; gx<N; gx++){
      const gy = s-gx; if(gy<0 || gy>=N) continue;
      const p = S.plots[gx + gy*N];
      if(p) drawBuilding(p,gx,gy,t);
    }
  }
  drawParts(); drawMeteor();
  requestAnimationFrame(frame);
}

/* اختيار القطع بالضغط */
function hitPlot(x,y){
  for(let s=2*N-2; s>=0; s--){
    for(let gx=N-1; gx>=0; gx--){
      const gy = s-gx; if(gy<0 || gy>=N) continue;
      const p = S.plots[gx + gy*N], g = geo(gx,gy,p);
      if(p){
        if(x>=g.x-g.hw && x<=g.x+g.hw && y>=g.y-g.hh-g.h-tw*.22 && y<=g.y+g.hh) return gx + gy*N;
      }else if(Math.abs(x-g.x)/(tw/2) + Math.abs(y-g.y)/(th/2) <= 1) return gx + gy*N;
    }
  }
  return -1;
}
cv.addEventListener("pointerdown", e=>{
  const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if(meteor && Math.hypot(x-meteor.x, y-meteor.y) < 42){
    const b = Math.max(300, income()*45);
    earn(b); toast("شهاب ذهبي! +" + fmt(b) + " 🪙"); sfx("bonus"); burst(meteor.x, meteor.y); meteor = null; hud();
    return;
  }
  const i = hitPlot(x,y);
  if(i >= 0){ selected = i; setTab("city"); }
});

/* ---------- الحلقة الرئيسية ---------- */
let last = performance.now(), acc = 0, uiT = 0;
setInterval(()=>{
  const now = performance.now(), dt = Math.min((now-last)/1000, 1); last = now;
  if(ended) return;
  earn(income()*dt);
  acc += salesPerSec()*dt;
  const n = Math.floor(acc);
  if(n > 0){ acc -= n; sell(n); }
  if(!ended && S.tier < ITEMS.length-1 && S.sold >= ITEMS[S.tier].need) advance();
  // الشهاب الذهبي
  if(!meteor){
    meteorTimer -= dt;
    if(meteorTimer <= 0 && W > 0){
      const dir = Math.random()<.5 ? 1 : -1;
      meteor = {x: dir>0 ? -30 : W+30, y: H*(.08+Math.random()*.2), vx: dir*W/7, vy: H*.02};
      meteorTimer = 45 + Math.random()*50;
    }
  }else{
    meteor.x += meteor.vx*dt; meteor.y += meteor.vy*dt;
    if(meteor.x < -60 || meteor.x > W+60) meteor = null;
  }
  uiT += dt; if(uiT >= .2){ uiT = 0; refresh(); } else { hud(); dock(); }
}, 100);
setInterval(save, 5000);
document.addEventListener("visibilitychange", ()=>{ if(document.hidden) save(); });
addEventListener("pagehide", save);

/* ---------- الإقلاع ---------- */
layout();
{
  const away = Math.min((Date.now() - S.t)/1000, 4*3600), inc = income();
  if(away > 60 && inc > 0){
    const g = earn(inc*away*.5);
    toast("أثناء غيابك ربحت " + fmt(g) + " 🪙");
  }
}
renderPanel();
requestAnimationFrame(frame);
