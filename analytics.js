// التحليلات: واجهة موحدة. لا تُرسل شيئًا لأي خدمة حتى تسجّل مزوّدًا بـ addProvider.
// مثال لاحقًا: addProvider((name, props) => gtag("event", name, props));
import {on} from "./bus.js";
import {G} from "./state.js";

const providers = [];
export const buffer = [];                    // آخر 200 حدث للتصحيح
const seen = new Set();

export function addProvider(fn){ if(typeof fn === "function") providers.push(fn); }
export function track(name, props = {}){
  buffer.push({t: Date.now(), name, props});
  if(buffer.length > 200) buffer.shift();
  for(const p of providers){ try{ p(name, props); }catch(e){} }
}
// حدث يُسجَّل مرة واحدة فقط لكل جلسة (first_*)
function once(name, props){ if(!seen.has(name)){ seen.add(name); track(name, props); } }

export function init(){
  const S = () => G.S;
  track("game_started", {sessions: S().stats.sessions, prestiges: S().prestiges});
  track("session_start");
  const t0 = Date.now();
  const end = () => track("session_end", {seconds: Math.round((Date.now() - t0) / 1000)});
  addEventListener("pagehide", end);

  on("build",    d => { if(S().stats.builds === 1) once("first_building", d); });
  on("upgrade",  d => { if(S().stats.upgrades === 1 || d.kind) once("first_upgrade", d); });
  on("tier",     d => { once("first_unlock", d); if(d.tier === 5 || d.tier === 10) track("tier_reached", d); });
  on("zone",     d => track("zone_unlocked", d));
  on("prestige", d => { once("first_prestige", d); track("prestige", {gain: d.gain, count: S().prestiges}); });
  on("achievement", a => track("achievement_unlocked", {id: a.id}));
  on("ad",       d => track("rewarded_ad", d));
  on("claim",    d => track("reward_claimed", {kind: d.kind}));
  on("meteor",   () => track("meteor_caught"));
  on("repair",   () => track("state_repaired"));
}
