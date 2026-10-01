// الصوت: كله مُولَّد برمجيًا عبر Web Audio (بلا ملفات). مؤثرات + موسيقى محيطة هادئة.
import {on} from "./bus.js";
import {G} from "./state.js";
import {MILESTONES} from "./data.js";

let ctx = null, master = null, musicBus = null, sfxBus = null, padFilter = null;
let musicOn = false, musicTimer = 0, chordIdx = 0, lastTap = 0;

const set = () => (G.S && G.S.set) || {music: true, sfx: true, vol: 0.8, vm: 0.5, vs: 0.8};
const hz = n => 440 * Math.pow(2, (n - 69) / 12);          // رقم نغمة MIDI إلى تردد

// يُستدعى عند أول لمسة (سياسة المتصفحات تمنع الصوت قبلها)
export function unlock(){
  if(!ctx){
    try{ ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return; }
    master = ctx.createGain(); musicBus = ctx.createGain(); sfxBus = ctx.createGain();
    padFilter = ctx.createBiquadFilter(); padFilter.type = "lowpass"; padFilter.frequency.value = 900;
    padFilter.connect(musicBus); musicBus.connect(master); sfxBus.connect(master); master.connect(ctx.destination);
    applyVolumes();
  }
  if(ctx.state === "suspended") ctx.resume();
  applyVolumes();
}

export function applyVolumes(){
  if(!ctx) return;
  const s = set();
  master.gain.value = s.vol;
  musicBus.gain.value = s.music ? s.vm * 0.35 : 0;
  sfxBus.gain.value = s.sfx ? s.vs : 0;
  if(s.music && s.vm > 0.001) startMusic(); else stopMusic();
}

function tone(f, dur, type = "sine", vol = 0.12, delay = 0, bus = sfxBus, slideTo = 0){
  if(!ctx || !bus) return;
  const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}

/* ---------- المؤثرات ---------- */
const SFX = {
  tap:   () => tone(520 + Math.random() * 240, 0.06, "sine", 0.07),
  click: () => tone(660, 0.05, "triangle", 0.06),
  no:    () => tone(140, 0.14, "sawtooth", 0.07, 0, sfxBus, 90),
  build: () => { tone(392, 0.12, "triangle", 0.12); tone(587, 0.18, "triangle", 0.12, 0.09); },
  up:    () => { tone(523, 0.09, "triangle", 0.1); tone(659, 0.09, "triangle", 0.1, 0.07); tone(784, 0.14, "triangle", 0.1, 0.14); },
  milestone: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, "triangle", 0.11, i * 0.07)),
  unlock: () => { tone(110, 0.7, "sawtooth", 0.07, 0, sfxBus, 55); [392, 523, 659].forEach((f, i) => tone(f, 0.3, "sine", 0.1, 0.15 + i * 0.1)); },
  ach:   () => [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.2, "triangle", 0.11, i * 0.08)),
  meteor: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.14, "sine", 0.09, i * 0.05)),
  spawn: () => tone(1500, 0.5, "sine", 0.05, 0, sfxBus, 700),
  prestige: () => { tone(60, 2.2, "sawtooth", 0.14, 0, sfxBus, 30); tone(45, 2.6, "sine", 0.16);
                    [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.9, "sine", 0.08, 0.4 + i * 0.15)); },
  claim: () => { tone(784, 0.1, "triangle", 0.1); tone(1047, 0.2, "triangle", 0.1, 0.08); }
};
export function play(name){
  const s = set();
  if(!ctx || !s.sfx || !SFX[name]) return;
  if(name === "tap"){ const n = performance.now(); if(n - lastTap < 45) return; lastTap = n; }
  SFX[name]();
}

/* ---------- الموسيقى المحيطة: أوتار هادئة ونغمات متفرقة ---------- */
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]];     // Am F C G
const SCALE = [69, 72, 74, 76, 79, 81];

function pad(notes){
  const t = ctx.currentTime;
  for(const n of notes){
    for(const detune of [-6, 6]){
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = hz(n); o.detune.value = detune;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05, t + 2.5);
      g.gain.linearRampToValueAtTime(0.0001, t + 8);
      o.connect(g); g.connect(padFilter); o.start(t); o.stop(t + 8.2);
    }
  }
}
function musicLoop(){
  if(!musicOn || !ctx) return;
  if(chordIdx % 1 === 0) pad(CHORDS[chordIdx % CHORDS.length]);
  chordIdx++;
  const pluck = n => tone(hz(SCALE[Math.floor(Math.random() * SCALE.length)] + (n > 2 ? 12 : 0)), 1.4, "sine", 0.05, n * 1.4 + Math.random(), musicBus);
  for(let i = 0; i < 4; i++) if(Math.random() < 0.6) pluck(i);
  musicTimer = setTimeout(musicLoop, 7000);
}
function startMusic(){
  if(musicOn || !ctx) return;
  musicOn = true; musicLoop();
}
function stopMusic(){ musicOn = false; clearTimeout(musicTimer); }

export function init(){
  document.addEventListener("visibilitychange", () => {
    if(!ctx) return;
    if(document.hidden){ stopMusic(); ctx.suspend(); }
    else { ctx.resume(); applyVolumes(); }
  });
  on("tap", () => play("tap"));
  on("build", () => play("build"));
  on("upgrade", d => {
    if(d.level && MILESTONES.some(m => d.level >= m && d.level - (d.n || 1) < m)) play("milestone");
    else play("up");
  });
  on("plot", () => play("build"));
  on("tier", () => play("unlock"));
  on("zone", () => play("unlock"));
  on("tech", () => play("up"));
  on("tree", () => play("up"));
  on("prestige", () => play("prestige"));
  on("achievement", () => play("ach"));
  on("meteor", () => play("meteor"));
  on("meteor-spawn", () => play("spawn"));
  on("claim", () => play("claim"));
  on("event", () => play("unlock"));
  on("boost", () => play("claim"));
  on("ui", name => play(name));
}
