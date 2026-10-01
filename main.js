// نقطة الدخول: تحميل الحفظ، تهيئة الوحدات، حلقة الرسم والمنطق.
import * as St from "./state.js";
import * as E from "./economy.js";
import * as Engine from "./engine.js";
import * as R from "./render.js";
import * as UI from "./ui.js";
import * as Audio from "./audio.js";
import * as Analytics from "./analytics.js";
import * as Ads from "./ads.js";
import * as M from "./missions.js";
import {toast} from "./uicore.js";
import {renderPanel} from "./panels.js";
import {iconify} from "./icons.js";

function boot(){
  iconify(document.body);
  const {S, source, notice} = St.load();
  St.G.S = S;
  Engine.init(S);
  M.check(S);
  Analytics.init();
  Audio.init();
  UI.init();
  renderPanel();
  if(notice) toast(notice, 4500);
  Engine.startAutosave();

  // الغياب: يُفحص مرة عند الإقلاع وعند كل عودة للتبويب
  Engine.checkAway();
  document.addEventListener("visibilitychange", () => {
    if(document.hidden) Engine.saveNow();
    else { last = performance.now(); Engine.checkAway(); }
  });
  addEventListener("pagehide", () => Engine.saveNow());
  addEventListener("error", e => Analytics.track("js_error", {msg: String(e.message).slice(0, 120)}));

  let last = performance.now();
  const loop = t => {
    const dt = (t - last) / 1000; last = t;
    Engine.frame(dt);
    R.frame(t);
    UI.update(t);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // نافذة تصحيح للمطور والاختبارات
  window.KE = {St, E, Engine, R, UI, Ads, M, Analytics, source};

  if("serviceWorker" in navigator && location.protocol.startsWith("http")){
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
