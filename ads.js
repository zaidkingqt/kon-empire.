// طبقة الإعلانات: منطق اللعبة لا يعرف أي مزوّد. يستدعي فقط rewarded(placement).
//
// للربط مع مزوّد حقيقي لاحقًا:
//   import * as Ads from "./ads.js";
//   Ads.register({ isReady: p => sdk.canShow(), show: p => sdk.showRewarded().then(r => !!r.completed) });
// وللإيقاف الكامل: Ads.config.mode = "off".
//
// الوضع الافتراضي "mock": إعلان تجريبي بعدّاد 5 ثوانٍ لتجربة التصميم قبل ربط مزوّد حقيقي.
import {emit} from "./bus.js";
import {G} from "./state.js";

export const config = {mode: "mock", cooldownMs: 45000, mockSeconds: 5};

let provider = null, mockUI = null, lastAt = 0, busy = false;

export function register(p){
  if(p && typeof p.show === "function" && typeof p.isReady === "function"){ provider = p; config.mode = "custom"; }
}
// الواجهة تسجّل نافذة العدّاد التجريبي هنا
export function setMockUI(fn){ mockUI = fn; }

export function cooldownLeft(){ return Math.max(0, Math.ceil((config.cooldownMs - (Date.now() - lastAt)) / 1000)); }
export function enabled(){ return config.mode !== "off" && (config.mode === "custom" ? !!provider : !!mockUI); }
export function isReady(placement){
  if(!enabled() || busy || cooldownLeft() > 0) return false;
  return config.mode === "custom" ? !!provider.isReady(placement) : true;
}

// يعيد Promise<boolean>: true فقط إذا اكتمل الإعلان واستحق اللاعب المكافأة
export async function rewarded(placement){
  if(!isReady(placement)) return false;
  busy = true;
  emit("ad-start", {placement});
  let granted = false;
  try{
    granted = config.mode === "custom" ? !!(await provider.show(placement)) : !!(await mockUI(placement, config.mockSeconds));
  }catch(e){ granted = false; }
  busy = false;
  lastAt = Date.now();
  if(granted && G.S) G.S.stats.ads++;
  emit("ad", {placement, granted});
  emit("ad-end", {placement, granted});
  return granted;
}
