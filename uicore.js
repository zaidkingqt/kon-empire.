// أساسيات الواجهة: حالة العرض، الإشعارات، النوافذ، الأرقام الطائرة.
import {h, $, setText} from "./util.js";
import {emit} from "./bus.js";

export const ui = {tab: "city", sel: -1, zonePreview: -1};
export const sfx = name => emit("ui", name);

/* ---------- الإشعارات ---------- */
export function toast(msg, ms = 2800){
  const box = $("toasts");
  if(!box) return;
  while(box.children.length >= 3) box.firstChild.remove();
  const el = h("div", {class: "toast"}, msg);
  box.append(el);
  requestAnimationFrame(() => el.classList.add("on"));
  setTimeout(() => { el.classList.remove("on"); setTimeout(() => el.remove(), 350); }, ms);
}

/* ---------- الأرقام الطائرة (مجموعة ثابتة من العناصر) ---------- */
const pops = [];
let popIdx = 0;
export function pop(x, y, text){
  if(!pops.length){
    for(let i = 0; i < 10; i++){ const el = h("div", {class: "pop", "aria-hidden": "true"}); document.body.append(el); pops.push(el); }
  }
  const el = pops[popIdx++ % pops.length];
  el.textContent = text; el.style.left = x + "px"; el.style.top = y + "px";
  el.classList.remove("go"); void el.offsetWidth; el.classList.add("go");
}

/* ---------- النوافذ ---------- */
let current = null, lastFocus = null;

// opts: {title, body: Node|string, buttons: [{text, cls, onclick, keep}], dismissable}
export function modal(opts){
  closeModal(true);
  const root = $("modal"), sheet = root.querySelector(".sheet");
  const body = $("mBody"), btns = $("mBtns");
  setText($("mTitle"), opts.title || "");
  body.replaceChildren(typeof opts.body === "string" ? h("p", null, opts.body) : (opts.body || ""));
  btns.replaceChildren();
  const api = {close: () => closeModal()};
  for(const b of opts.buttons || []){
    const btn = h("button", {class: "btn " + (b.cls || ""), type: "button"}, b.text);
    btn.addEventListener("click", async () => {
      sfx("click");
      let keep = b.keep;
      if(b.onclick){ const r = await b.onclick(api, btn); if(r === "keep") keep = true; }
      if(!keep) closeModal();
    });
    btns.append(btn);
  }
  lastFocus = document.activeElement;
  root.hidden = false;
  current = {opts, api};
  const first = btns.querySelector("button") || sheet;
  setTimeout(() => first.focus && first.focus(), 30);
  return api;
}
export function closeModal(silent){
  const root = $("modal");
  if(!root || root.hidden) return;
  root.hidden = true;
  const c = current; current = null;
  if(!silent && c && c.opts.onclose) c.opts.onclose();
  if(lastFocus && lastFocus.focus) try{ lastFocus.focus(); }catch(e){}
}
export const modalOpen = () => !!current;

export function confirmDialog(title, text, okText, onOk, danger){
  modal({title, body: text, dismissable: true, buttons: [
    {text: okText, cls: danger ? "danger" : "primary", onclick: () => onOk()},
    {text: "إلغاء", cls: "ghost"}
  ]});
}

// Esc يغلق النافذة، وTab يبقى داخلها
export function initModalKeys(){
  document.addEventListener("keydown", e => {
    if(!current) return;
    if(e.key === "Escape" && current.opts.dismissable !== false){ closeModal(); return; }
    if(e.key === "Tab"){
      const f = [...$("modal").querySelectorAll("button,input,textarea,select")].filter(x => !x.disabled);
      if(!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });
  $("modal").addEventListener("pointerdown", e => {
    if(e.target === $("modal") && current && current.opts.dismissable !== false) closeModal();
  });
}
