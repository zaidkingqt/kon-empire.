// الرسم فقط: لا يغيّر حالة اللعبة. يقرأ G.S ويرسم مدينة إيزومترية 2.5D.
import {GRID, PLOTS, TYPES, ZONES, RARE, ITEMS} from "./data.js";
import {G} from "./state.js";
import {msCount} from "./economy.js";
import {iconImage, iconName} from "./icons.js";

export const view = {zone: 0, sel: -1, hint: -1, fade: 0};

const Q = {
  low:    {dpr: 1,   stars: 70,  parts: 40,  fps: 30, bob: false, shadow: false, lockIcon: false},
  medium: {dpr: 1.5, stars: 140, parts: 120, fps: 60, bob: true,  shadow: true,  lockIcon: true},
  high:   {dpr: 2,   stars: 240, parts: 260, fps: 60, bob: true,  shadow: true,  lockIcon: true}
};
const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

let cv, cx, W = 0, H = 0, dpr = 1, tw = 0, th = 0, ox = 0, oy = 0, slab = 0;
let quality = Q.high, reduce = false, lastDraw = 0, lastT = 0;
let skyGrad = null, nebA = null, nebB = null, skyKey = "", glowKey = -1, glowGrad = null;
const tint = (hex, t) => { const n = parseInt(hex.slice(1), 16), c = k => Math.round(((n >> k) & 255) * (1 - t) + 255 * t); return "rgb(" + c(16) + "," + c(8) + "," + c(0) + ")"; };
function icon(name, color, x, y, s){ const im = iconImage(name, color); if(im) cx.drawImage(im, x - s / 2, y - s / 2, s, s); return !!im; }
let stars = [], meteor = null;
const pool = Array.from({length: 260}, () => ({a: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, r: 2, c: "#ffb938"}));

export function init(canvas){
  cv = canvas;
  cx = cv.getContext("2d");
  stars = Array.from({length: 240}, () => ({x: Math.random(), y: Math.random() * 0.92, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.28}));
  resize();
}
export function setQuality(name, reduceMotion){
  quality = Q[name] || Q.high;
  reduce = !!reduceMotion;
  resize();
}

export function resize(){
  if(!cv) return;
  const r = cv.parentElement.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, quality.dpr);
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  tw = Math.min(W * 0.94 / GRID, H * 0.96 / 3.45);
  th = tw / 2; slab = tw * 0.14;
  ox = W / 2; oy = H - GRID * th - slab - tw * 0.22;
  skyKey = ""; glowKey = -1;
}

const P = (gx, gy) => [ox + (gx - gy) * tw / 2, oy + (gx + gy) * th / 2];
function geo(pi, p){
  const gx = pi % GRID, gy = Math.floor(pi / GRID), c = P(gx + 0.5, gy + 0.5);
  const big = p && TYPES[p.t].role === "storage" ? 1.1 : 1;
  return {gx, gy, x: c[0], y: c[1], hw: tw * 0.34 * big, hh: th * 0.34 * big, h: p ? tw * (0.16 + Math.min(p.l, 60) * 0.012) : 0};
}

function shade(hex, f){
  const n = parseInt(hex.slice(1), 16);
  const c = k => Math.min(255, Math.round(((n >> k) & 255) * f));
  return "rgb(" + c(16) + "," + c(8) + "," + c(0) + ")";
}
function poly(pts, fill, stroke, lw){
  cx.beginPath(); cx.moveTo(pts[0][0], pts[0][1]);
  for(let i = 1; i < pts.length; i++) cx.lineTo(pts[i][0], pts[i][1]);
  cx.closePath();
  if(fill){ cx.fillStyle = fill; cx.fill(); }
  if(stroke){ cx.strokeStyle = stroke; cx.lineWidth = lw || 1; cx.stroke(); }
}

/* ---------- الجسيمات ---------- */
function spawn(x, y, vx, vy, life, r, c){
  const cap = Math.min(pool.length, quality.parts);
  for(let i = 0; i < cap; i++){
    const q = pool[i];
    if(!q.a){ q.a = true; q.x = x; q.y = y; q.vx = vx; q.vy = vy; q.life = life; q.max = life; q.r = r; q.c = c; return; }
  }
}
export function burst(x, y, n = 16, color = "#ffb938"){
  if(reduce) n = Math.min(n, 4);
  for(let i = 0; i < n; i++){
    const a = Math.random() * 6.283, v = 40 + Math.random() * 120;
    spawn(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.7 + Math.random() * 0.5, 2 + Math.random() * 2, color);
  }
}
export function burstPlot(pi, n = 18, color){
  const g = geo(pi, G.S.zones[view.zone].plots[pi]);
  burst(g.x, g.y - g.h, n, color || "#ffb938");
}
export function spawnMeteor(){
  const dir = Math.random() < 0.5 ? 1 : -1;
  meteor = {x: dir > 0 ? -30 : W + 30, y: H * (0.1 + Math.random() * 0.2), vx: dir * W / 6.5, vy: H * 0.02, life: 10};
}
export const meteorOn = () => !!meteor;
export const clearMeteor = () => { meteor = null; };

/* ---------- السماء والثقب الأسود ---------- */
const progress = S => Math.min(1, (S.tier + S.sold / ITEMS[S.tier].need) / ITEMS.length);

function drawSky(S, t){
  const Z = ZONES[view.zone], key = view.zone + ":" + W + ":" + H;
  if(key !== skyKey){
    skyGrad = cx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, Z.sky[0]); skyGrad.addColorStop(1, Z.sky[1]);
    nebA = cx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, W * 0.75);
    nebA.addColorStop(0, "rgba(124,92,255,.22)"); nebA.addColorStop(1, "rgba(124,92,255,0)");
    nebB = cx.createRadialGradient(W * 0.88, H * 0.12, 0, W * 0.88, H * 0.12, W * 0.6);
    nebB.addColorStop(0, "rgba(39,211,243,.14)"); nebB.addColorStop(1, "rgba(39,211,243,0)");
    skyKey = key;
  }
  cx.fillStyle = skyGrad; cx.fillRect(0, 0, W, H);
  cx.fillStyle = nebA; cx.fillRect(0, 0, W, H);
  cx.fillStyle = nebB; cx.fillRect(0, 0, W, H);

  const p = progress(S), vis = Math.floor(Math.min(stars.length, quality.stars) * (1 - p));
  cx.fillStyle = "#fff";
  for(let i = 0; i < vis; i++){
    const s = stars[i];
    cx.globalAlpha = reduce ? 0.7 : 0.3 + 0.7 * Math.abs(Math.sin(t / 900 + s.p));
    cx.fillRect(s.x * W, s.y * H, s.r, s.r);
  }
  cx.globalAlpha = 1;

  const x = W / 2, y = H * 0.24, R = 6 + p * Math.min(W, H) * 0.36, rk = Math.round(R);
  if(rk !== glowKey){
    glowKey = rk;
    glowGrad = cx.createRadialGradient(x, y, R * 0.92, x, y, R * 2.1);
    glowGrad.addColorStop(0, "rgba(255,120,50,.85)");
    glowGrad.addColorStop(0.35, "rgba(255,90,54,.22)");
    glowGrad.addColorStop(1, "rgba(255,90,54,0)");
  }
  cx.fillStyle = glowGrad; cx.beginPath(); cx.arc(x, y, R * 2.1, 0, 6.283); cx.fill();
  cx.fillStyle = "#000"; cx.beginPath(); cx.arc(x, y, R, 0, 6.283); cx.fill();
}

/* ---------- الأرض ---------- */
function drawGround(S, t){
  const Z = S.zones[view.zone], zd = ZONES[view.zone];
  const T0 = P(0, 0), R = P(GRID, 0), B = P(GRID, GRID), L = P(0, GRID);
  poly([L, B, [B[0], B[1] + slab], [L[0], L[1] + slab]], shade(zd.tint, 0.55));
  poly([B, R, [R[0], R[1] + slab], [B[0], B[1] + slab]], shade(zd.tint, 0.38));
  poly([T0, R, B, L], shade(zd.tint, 0.8));
  const rare = RARE[view.zone];
  for(let pi = 0; pi < PLOTS; pi++){
    const gx = pi % GRID, gy = Math.floor(pi / GRID);
    const pts = [P(gx, gy), P(gx + 1, gy), P(gx + 1, gy + 1), P(gx, gy + 1)];
    const open = Z.open[pi];
    poly(pts, open ? shade(zd.tint, (gx + gy) % 2 ? 1.12 : 1) : shade(zd.tint, 0.62), "rgba(150,130,230," + (open ? 0.2 : 0.1) + ")");
    const c = P(gx + 0.5, gy + 0.5);
    if(rare.includes(pi)){
      poly(pts, "rgba(255,185,56," + (0.1 + (reduce ? 0.05 : 0.05 * Math.sin(t / 500 + pi))) + ")", "rgba(255,185,56,.55)", 1.5);
      if(!Z.plots[pi]) icon("star", "#ffd166", c[0], c[1] + th * 0.3, tw * 0.2);
    }
    if(!Z.plots[pi]){
      cx.textAlign = "center"; cx.textBaseline = "middle";
      if(!open){
        cx.globalAlpha = 0.55;
        if(!(quality.lockIcon && icon("lock", "#b9b0ee", c[0], c[1], tw * 0.26))){ cx.fillStyle = "#fff"; cx.fillRect(c[0] - 2, c[1] - 2, 4, 4); }
        cx.globalAlpha = 1;
      }else{
        cx.fillStyle = "rgba(255,185,56," + (reduce ? 0.5 : 0.35 + 0.25 * Math.sin(t / 600 + pi)) + ")";
        cx.font = "700 " + Math.round(tw * 0.3) + "px sans-serif";
        cx.fillText("+", c[0], c[1]);
      }
    }
    if(view.sel === pi) poly(pts, "rgba(255,185,56,.14)", "#ffb938", 2.5);
    else if(view.hint === pi){
      const k = reduce ? 0.7 : 0.5 + 0.5 * Math.sin(t / 280);
      poly(pts, "rgba(255,255,255," + (0.06 + 0.12 * k) + ")", "rgba(255,255,255," + (0.4 + 0.5 * k) + ")", 3);
    }
  }
}

/* ---------- المباني ---------- */
function drawBuilding(S, pi, p, t, dt){
  const ty = TYPES[p.t], g = geo(pi, p), x = g.x, y = g.y, hw = g.hw, hh = g.hh, h = g.h;
  if(quality.shadow){
    cx.fillStyle = "rgba(0,0,0,.33)";
    cx.beginPath(); cx.ellipse(x + hw * 0.25, y + hh * 0.4, hw * 1.05, hh * 1.05, 0, 0, 6.283); cx.fill();
  }
  const gl = cx.createLinearGradient(0, y - h, 0, y + hh); gl.addColorStop(0, shade(ty.col, 0.95)); gl.addColorStop(1, shade(ty.col, 0.48));
  const gr = cx.createLinearGradient(0, y - h, 0, y + hh); gr.addColorStop(0, shade(ty.col, 0.6)); gr.addColorStop(1, shade(ty.col, 0.28));
  poly([[x - hw, y], [x, y + hh], [x, y + hh - h], [x - hw, y - h]], gl);
  poly([[x + hw, y], [x, y + hh], [x, y + hh - h], [x + hw, y - h]], gr);

  const rows = Math.min(5, 1 + Math.floor(p.l / 4));
  for(let side = -1; side <= 1; side += 2){
    const fill = side < 0 ? "rgba(255,225,130,.9)" : "rgba(255,225,130,.5)";
    for(let r = 0; r < rows; r++){
      const v0 = 0.1 + r * (0.8 / rows), v1 = v0 + (0.8 / rows) * 0.55;
      for(const c of [[0.15, 0.4], [0.6, 0.85]]){
        const pt = (u, v) => [x + side * hw * (1 - u), y + hh * u - h * v];
        poly([pt(c[0], v0), pt(c[1], v0), pt(c[1], v1), pt(c[0], v1)], fill);
      }
    }
  }
  const lit = msCount(p.l);                          // كل مضاعف مفصلي يضيف حافة مضيئة
  poly([[x, y - hh - h], [x + hw, y - h], [x, y + hh - h], [x - hw, y - h]], shade(ty.col, 1.14),
       lit ? "rgba(255,215,90," + (0.35 + 0.12 * lit) + ")" : "rgba(255,255,255,.25)", lit ? 1.5 + lit * 0.5 : 1);

  const bob = (reduce || !quality.bob) ? 0 : Math.sin(t / 520 + pi) * 2;
  const by = y - h - hh * 0.05 + bob, br = tw * 0.17;
  cx.beginPath(); cx.arc(x, by, br, 0, 6.283); cx.fillStyle = "rgba(9,6,22,.88)"; cx.fill();
  cx.lineWidth = 1.5; cx.strokeStyle = tint(ty.col, 0.35); cx.stroke();
  icon(iconName(ty.em) || "building", tint(ty.col, 0.6), x, by, br * 1.3);
  cx.textAlign = "center"; cx.textBaseline = "middle";

  const fs = Math.max(9, Math.round(tw * 0.11));
  cx.font = "700 " + fs + "px sans-serif";
  const label = "Lv " + p.l, w = cx.measureText(label).width + 8;
  cx.fillStyle = "rgba(0,0,0,.65)";
  if(cx.roundRect){ cx.beginPath(); cx.roundRect(x - w / 2, y + hh + 2, w, fs + 5, 6); cx.fill(); } else cx.fillRect(x - w / 2, y + hh + 2, w, fs + 5);
  cx.fillStyle = "#ffb938"; cx.fillText(label, x, y + hh + 2 + (fs + 5) / 2);

  if(!reduce && ty.role === "production" && Math.random() < dt * (0.2 + p.l * 0.01))
    spawn(x + (Math.random() - 0.5) * hw, y - h - hh, 0, -32, 1, 2, "#ffb938");
}

function drawParticles(dt){
  for(const q of pool){
    if(!q.a) continue;
    q.life -= dt;
    if(q.life <= 0){ q.a = false; continue; }
    q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.98;
    cx.globalAlpha = Math.min(1, q.life / q.max * 1.5);
    cx.fillStyle = q.c; cx.beginPath(); cx.arc(q.x, q.y, q.r, 0, 6.283); cx.fill();
  }
  cx.globalAlpha = 1;
}
function drawMeteor(dt){
  if(!meteor) return;
  meteor.x += meteor.vx * dt; meteor.y += meteor.vy * dt; meteor.life -= dt;
  if(meteor.x < -70 || meteor.x > W + 70 || meteor.life <= 0){ meteor = null; return; }
  const g = cx.createRadialGradient(meteor.x, meteor.y, 2, meteor.x, meteor.y, 38);
  g.addColorStop(0, "rgba(255,200,80,.85)"); g.addColorStop(1, "rgba(255,200,80,0)");
  cx.fillStyle = g; cx.beginPath(); cx.arc(meteor.x, meteor.y, 38, 0, 6.283); cx.fill();
  icon("comet", "#ffe08a", meteor.x, meteor.y, 40);
  if(!reduce) spawn(meteor.x, meteor.y, -meteor.vx * 0.1, 0, 0.5, 2.5, "#ffd36b");
}

/* ---------- الإطار ---------- */
export function frame(t){
  const S = G.S;
  if(!S || !cx) return false;
  const minGap = 1000 / quality.fps - 2;
  if(t - lastDraw < minGap) return false;                // حد الإطارات: يخفف الحمل على شاشات 120Hz
  const dt = Math.min(0.05, (t - (lastT || t)) / 1000); lastT = t; lastDraw = t;

  drawSky(S, t);
  drawGround(S, t);
  const Z = S.zones[view.zone];
  for(let s = 0; s <= 2 * GRID - 2; s++){                // من الخلف إلى الأمام
    for(let gx = 0; gx < GRID; gx++){
      const gy = s - gx; if(gy < 0 || gy >= GRID) continue;
      const pi = gx + gy * GRID, p = Z.plots[pi];
      if(p) drawBuilding(S, pi, p, t, dt);
    }
  }
  drawParticles(dt);
  drawMeteor(dt);
  if(view.fade > 0){
    cx.fillStyle = "rgba(5,3,13," + Math.min(1, view.fade) + ")"; cx.fillRect(0, 0, W, H);
    view.fade = Math.max(0, view.fade - dt * 4);
  }
  return true;
}

/* ---------- اختيار القطع واللمس ---------- */
export function pick(x, y){
  if(meteor && Math.hypot(x - meteor.x, y - meteor.y) < 46) return {type: "meteor"};
  const Z = G.S.zones[view.zone];
  for(let s = 2 * GRID - 2; s >= 0; s--){
    for(let gx = GRID - 1; gx >= 0; gx--){
      const gy = s - gx; if(gy < 0 || gy >= GRID) continue;
      const pi = gx + gy * GRID, p = Z.plots[pi], g = geo(pi, p);
      if(p){
        if(x >= g.x - g.hw && x <= g.x + g.hw && y >= g.y - g.hh - g.h - tw * 0.22 && y <= g.y + g.hh) return {type: "plot", pi};
      }else if(Math.abs(x - g.x) / (tw / 2) + Math.abs(y - g.y) / (th / 2) <= 1) return {type: "plot", pi};
    }
  }
  return null;
}
export function plotScreen(pi){ const g = geo(pi, G.S.zones[view.zone].plots[pi]); return {x: g.x, y: g.y - g.h}; }
export function size(){ return {W, H, tw}; }
