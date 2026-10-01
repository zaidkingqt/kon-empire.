// أدوات مشتركة: تنسيق الأرقام والوقت وبناء عناصر DOM بدون innerHTML.
const SUF = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

export function fmt(n){
  n = Number(n);
  if(!Number.isFinite(n) || n <= 0) return "0";
  if(n < 1000) return String(Math.floor(n));
  let i = 0;
  while(n >= 1000 && i < SUF.length - 1){ n /= 1000; i++; }
  if(n >= 1000) return n.toExponential(1).replace("+", "");
  return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0)) + SUF[i];
}
// للمعدلات الصغيرة (دخل/ثانية) نُظهر كسرًا عشريًا
export function fmtRate(n){
  n = Number(n);
  if(!Number.isFinite(n) || n <= 0) return "0";
  if(n < 10) return n.toFixed(1);
  return fmt(n);
}
export function fmtTime(sec){
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  if(h > 0) return h + "س " + m + "د";
  if(m > 0) return m + "د " + (s < 10 ? "0" : "") + s + "ث";
  return s + "ث";
}
export const clamp = (x, a, b) => x < a ? a : x > b ? b : x;

import {rich, needsRich} from "./icons.js";

// h("button", {class:"row", onclick: fn}, child1, "نص") — لا يستخدم innerHTML أبدًا
export function h(tag, props, ...kids){
  const el = document.createElement(tag);
  if(props){
    for(const k of Object.keys(props)){
      const v = props[k];
      if(v === null || v === undefined || v === false) continue;
      if(k === "class") el.className = v;
      else if(k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if(k === "text") el.textContent = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
  }
  for(const kid of kids.flat()){
    if(kid === null || kid === undefined || kid === false) continue;
    el.append(kid.nodeType ? kid : rich(kid));
  }
  return el;
}
export const $ = id => document.getElementById(id);

// يحدّث نص عنصر فقط إذا تغيّر (يمنع إعادة التخطيط بلا داعٍ)
export function setText(el, text){
  if(el && el._t !== text){ el._t = text; if(needsRich(text)) el.replaceChildren(rich(text)); else el.textContent = text; }
}
