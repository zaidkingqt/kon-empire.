// نظام الأيقونات: أيقونات SVG خطية بتعبئة شفافة (Duotone) بدل الإيموجي.
// البيانات والنصوص تبقى بالرموز القديمة، وهنا تُحوَّل تلقائيًا إلى أيقونات (DOM وCanvas).
// الأيقونات ثوابت داخلية فقط، لا تُبنى أبدًا من مدخلات اللاعب.
const P = {
  coin: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><path d="M12 9.5v5"/>',
  shard: '<circle class="f" cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="5.5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.4" transform="rotate(-24 12 12)"/>',
  flask: '<path class="f" d="M7.6 15h8.8l2 3.6a1.4 1.4 0 0 1-1.4 1.9H7a1.4 1.4 0 0 1-1.4-1.9z"/><path d="M9 3h6M10 3v6l-5.2 9.2A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-2.8L14 9V3M8 15h8"/>',
  atom: '<circle class="f" cx="12" cy="12" r="1.8"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  bolt: '<path class="f" d="M13 2 4 14h7l-1 8 9-12h-7z"/><path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  gear: '<circle class="f" cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.6"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  lock: '<rect class="f" x="5" y="10.5" width="14" height="10" rx="2.5"/><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5V17"/>',
  unlock: '<rect class="f" x="5" y="10.5" width="14" height="10" rx="2.5"/><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 7.6-1.7M12 14.5V17"/>',
  check: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8 5.4-5.6"/>',
  star: '<path class="f" d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"/><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"/>',
  sparkle: '<path class="f" d="M11 3c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7z"/><path d="M11 3c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7zM19 16v4M17 18h4"/>',
  play: '<rect class="f" x="3" y="5" width="18" height="14" rx="4"/><rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10.5 9.5 4 2.5-4 2.5z"/>',
  megaphone: '<path class="f" d="M4 10v4h3l8 4V6L7 10z"/><path d="M4 10v4h3l8 4V6L7 10zM18 9a4 4 0 0 1 0 6M7 14l1 5h2.5l-1-4.5"/>',
  tap: '<path class="f" d="M8 4v11l2.8-2.3 2 4.6 2.3-1-2-4.5 3.4-.3z"/><path d="M8 4v11l2.8-2.3 2 4.6 2.3-1-2-4.5 3.4-.3zM4.5 7.5h2M5.8 3.5l1.4 1.4"/>',
  trash: '<path class="f" d="M6.5 7l1 13h9l1-13z"/><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',
  chevups: '<path d="m6 11 6-6 6 6M6 19l6-6 6 6"/>',
  arrowup: '<path d="M12 20V5M6 11l6-6 6 6"/>',
  map: '<path class="f" d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
  box: '<path class="f" d="m3 7.5 9-4.5 9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9-4.5 9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle class="f" cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="1"/>',
  calendar: '<rect class="f" x="3.5" y="5" width="17" height="15.5" rx="3"/><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  sun: '<circle class="f" cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>',
  trophy: '<path class="f" d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v3.5M8.5 20.5h7M9.5 17.5h5"/>',
  tree: '<path class="f" d="M12 3 5.5 13h4L6 19h12l-3.5-6h4z"/><path d="M12 3 5.5 13h4L6 19h12l-3.5-6h4zM12 19v2.5"/>',
  galaxy: '<circle class="f" cx="12" cy="12" r="2"/><path d="M12 12c0-3.5 3-5.5 6-4.5M12 12c0 3.5-3 5.5-6 4.5M12 12c3.5 0 5.5 3 4.5 6M12 12c-3.5 0-5.5-3-4.5-6"/><circle cx="12" cy="12" r="9.5" stroke-opacity=".45"/>',
  info: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.7v.1"/>',
  volume: '<path class="f" d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z"/><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  palette: '<path class="f" d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2.2-.6-1.4.2-2.8 1.8-2.8H18a3 3 0 0 0 3-3c0-5-4-10-9-10z"/><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2.2-.6-1.4.2-2.8 1.8-2.8H18a3 3 0 0 0 3-3c0-5-4-10-9-10z"/><circle cx="7.5" cy="11" r=".9"/><circle cx="10.5" cy="7" r=".9"/><circle cx="15.5" cy="7.5" r=".9"/>',
  save: '<path class="f" d="M4 4h13l3 3v13H4z"/><path d="M4 4h13l3 3v13H4zM8 4v5h7V4M8 20v-6h8v6"/>',
  install: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  building: '<rect class="f" x="5" y="3" width="14" height="18" rx="2"/><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7.5h2M13 7.5h2M9 11.5h2M13 11.5h2M10 21v-4h4v4"/>',
  drop: '<path class="f" d="M12 3C8 8 5.5 11 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 11 16 8 12 3z"/><path d="M12 3C8 8 5.5 11 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 11 16 8 12 3zM9 15a3 3 0 0 0 3 3"/>',
  barn: '<path class="f" d="M3.5 10.5 12 4l8.5 6.5V20h-17z"/><path d="M3.5 10.5 12 4l8.5 6.5V20h-17zM9 20v-6h6v6M9 14l6 6M15 14l-6 6"/>',
  cat: '<path class="f" d="M5 9 4.5 3.5 9 6.2a8 8 0 0 1 6 0l4.5-2.7L19 9c1 1.2 1.5 2.6 1.5 4.2 0 4-3.6 7-8.5 7s-8.5-3-8.5-7C3.5 11.6 4 10.2 5 9z"/><path d="M5 9 4.5 3.5 9 6.2a8 8 0 0 1 6 0l4.5-2.7L19 9c1 1.2 1.5 2.6 1.5 4.2 0 4-3.6 7-8.5 7s-8.5-3-8.5-7C3.5 11.6 4 10.2 5 9zM9 13v.2M15 13v.2M11 16.2l1 .8 1-.8"/>',
  moon: '<path class="f" d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  blackhole: '<circle class="f" cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(-18 12 12)"/><path d="M5 5.5a9 9 0 0 1 6-2.4" stroke-opacity=".5"/>',
  shop: '<path class="f" d="M4 9.5 5.5 4h13L20 9.5z"/><path d="M4 9.5 5.5 4h13L20 9.5a2.8 2.8 0 0 1-5.3 0 2.8 2.8 0 0 1-5.4 0A2.8 2.8 0 0 1 4 9.5zM5.5 12v8h13v-8M10 20v-4.5h4V20"/>',
  robot: '<rect class="f" x="5" y="8" width="14" height="11" rx="3"/><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4.5M2.5 13v2M21.5 13v2M9 13v1M15 13v1M9.5 17h5"/><circle cx="12" cy="4" r="1"/>',
  radiation: '<circle cx="12" cy="12" r="9.5" stroke-opacity=".45"/><circle class="f" cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><path d="M12 10V4M13.7 13l5.2 3M10.3 13l-5.2 3"/>',
  comet: '<circle class="f" cx="16.5" cy="7.5" r="4"/><circle cx="16.5" cy="7.5" r="4"/><path d="M13.5 10.5 4 20M12 7.5 4 10M16.5 12 14 20"/>',
  planet: '<circle class="f" cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="5.5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.6" transform="rotate(-22 12 12)"/>',
  citrus: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="M12 6v12M6 12h12M7.8 7.8l8.4 8.4M16.2 7.8l-8.4 8.4"/>',
  chair: '<path class="f" d="M7 3.5h10v8H7z"/><path d="M7 3.5h10v8H7zM5.5 11.5h13v3h-13zM7 14.5V21M17 14.5V21"/>',
  car: '<path class="f" d="M3 14.5 5 9.5a2 2 0 0 1 1.8-1.2h10.4A2 2 0 0 1 19 9.5l2 5V18H3z"/><path d="M3 14.5 5 9.5a2 2 0 0 1 1.8-1.2h10.4A2 2 0 0 1 19 9.5l2 5V18H3zM3 14.5h18"/><circle cx="7.5" cy="18" r="1.8"/><circle cx="16.5" cy="18" r="1.8"/>',
  house: '<path class="f" d="M4 11 12 4l8 7v9H4z"/><path d="M4 11 12 4l8 7v9H4zM10 20v-6h4v6"/>',
  road: '<path class="f" d="M8 3 4 21h16L16 3z"/><path d="M8 3 4 21M16 3l4 18M12 5v3M12 11v3M12 17v3"/>',
  city: '<rect class="f" x="3" y="9" width="7" height="12" rx="1"/><rect x="3" y="9" width="7" height="12" rx="1"/><rect class="f" x="10" y="3" width="8" height="18" rx="1"/><rect x="10" y="3" width="8" height="18" rx="1"/><path d="M18 12h3v9M6 13h1M6 17h1M13 7h2M13 11h2M13 15h2"/>',
  truck: '<path class="f" d="M2.5 6h11v10h-11z"/><path d="M2.5 6h11v10h-11zM13.5 9h4l3 3.5V16h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  chip: '<rect class="f" x="6" y="6" width="12" height="12" rx="2.5"/><rect x="6" y="6" width="12" height="12" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  phone: '<rect class="f" x="7" y="2.5" width="10" height="19" rx="2.5"/><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  snow: '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M9.5 4.2 12 6.5l2.5-2.3M9.5 19.8 12 17.5l2.5 2.3"/>',
  factory: '<path class="f" d="M3 20V10l6 3.5V10l6 3.5V5h6v15z"/><path d="M3 20V10l6 3.5V10l6 3.5V5h6v15zM7 17h2M12 17h2M17 17h1"/>',
  rocket: '<path class="f" d="M12 2.5c3.5 2.5 5 6 4.5 10.5h-9C7 8.5 8.5 5 12 2.5z"/><path d="M12 2.5c3.5 2.5 5 6 4.5 10.5h-9C7 8.5 8.5 5 12 2.5zM7.5 13l-3 3v3l3.5-1.5M16.5 13l3 3v3L16 17.5M10 17.5l2 4 2-4"/><circle cx="12" cy="9" r="1.6"/>',
  users: '<circle class="f" cx="9" cy="8" r="3.5"/><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  briefcase: '<rect class="f" x="3" y="7.5" width="18" height="12.5" rx="2.5"/><rect x="3" y="7.5" width="18" height="12.5" rx="2.5"/><path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M3 13h18"/>',
  moneybag: '<path class="f" d="M8 8.5 6 4h12l-2 4.5c3 2 4.5 5 4.5 8 0 3-2.5 4.5-8.5 4.5S3.5 19.5 3.5 16.5c0-3 1.5-6 4.5-8z"/><path d="M8 8.5 6 4h12l-2 4.5c3 2 4.5 5 4.5 8 0 3-2.5 4.5-8.5 4.5S3.5 19.5 3.5 16.5c0-3 1.5-6 4.5-8zM8 8.5h8M12 12.5v5"/>',
  tag: '<path class="f" d="M3 12V4h8l10 10-8 8z"/><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
  crown: '<path class="f" d="M3.5 18.5 2.5 7l5.5 4.5L12 4l4 7.5L21.5 7l-1 11.5z"/><path d="M3.5 18.5 2.5 7l5.5 4.5L12 4l4 7.5L21.5 7l-1 11.5zM3.5 21h17"/>',
  gem: '<path class="f" d="M7 4h10l4 5.5-9 11-9-11z"/><path d="M7 4h10l4 5.5-9 11-9-11zM3 9.5h18M9.5 4 8 9.5l4 11 4-11L14.5 4"/>',
  bank: '<path class="f" d="M3 9.5 12 4l9 5.5z"/><path d="M3 9.5 12 4l9 5.5zM5.5 12v6M10 12v6M14 12v6M18.5 12v6M3 20.5h18"/>',
  crane: '<path d="M4 21h16M7 21V8l6-4v17M13 8h6v13M3.5 8h9"/>',
  puzzle: '<path class="f" d="M5 8h4a2.5 2.5 0 1 1 5 0h4v4a2.5 2.5 0 1 0 0 5v3H5z"/><path d="M5 8h4a2.5 2.5 0 1 1 5 0h4v4a2.5 2.5 0 1 0 0 5v3H5z"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.5L20 15M20 20v-5h-5"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h13M16 2.5 20 6l-4 3.5M20 13v2a3 3 0 0 1-3 3H4M8 14.5 4 18l4 3.5"/>',
  infinity: '<path d="M12 12c-2-3-3.5-4.5-6-4.5a4.5 4.5 0 0 0 0 9c2.5 0 4-1.5 6-4.5s3.5-4.5 6-4.5a4.5 4.5 0 0 1 0 9c-2.5 0-4-1.5-6-4.5z"/>'
};

const MAP = {
  "ℹ": "info", "⏫": "chevups", "☀": "sun", "☄": "comet", "☢": "radiation", "♾": "infinity", "⚙": "gear", "⚡": "bolt",
  "✅": "check", "✔": "check", "✨": "sparkle", "⬆": "arrowup", "⭐": "star", "🌌": "galaxy", "🌍": "planet", "🌑": "shard",
  "🌙": "moon", "🌟": "star", "🌠": "comet", "🌳": "tree", "🍋": "citrus", "🎨": "palette", "🎬": "play", "🎯": "target",
  "🏆": "trophy", "🏗": "crane", "🏘": "house", "🏙": "city", "🏠": "house", "🏢": "building", "🏦": "bank", "🏪": "shop",
  "🏭": "factory", "🏷": "tag", "🐔": "barn", "🐱": "cat", "👆": "tap", "👋": "sparkle", "👑": "crown", "💎": "gem",
  "💤": "moon", "💧": "drop", "💪": "bolt", "💰": "moneybag", "💼": "briefcase", "💾": "save", "📅": "calendar",
  "📣": "megaphone", "📦": "box", "📱": "phone", "📲": "install", "🔁": "repeat", "🔄": "refresh", "🔊": "volume",
  "🔒": "lock", "🔓": "unlock", "🔗": "link", "🔬": "atom", "🕳": "blackhole", "🖐": "tap", "🗓": "calendar", "🗺": "map",
  "🚀": "rocket", "🚗": "car", "🚚": "truck", "🛣": "road", "🤖": "robot", "🧊": "snow", "🧑\u200d🏫": "users",
  "🧑\u200d💼": "users", "🧠": "chip", "🧩": "puzzle", "🧪": "flask", "🧹": "trash", "🪐": "planet", "🪑": "chair", "🪙": "coin"
};
const RE = new RegExp("(" + Object.keys(MAP).sort((a, b) => b.length - a.length).join("|") + ")\\uFE0F?", "gu");
const QUICK = /[\u2100-\uFFFF\u{1F000}-\u{1FFFF}]/u;           // فحص سريع: النص العربي العادي لا يمر من هنا

export const iconName = e => MAP[String(e).replace(/\uFE0F/g, "")] || null;
export const hasIcons = name => !!P[name];

const wrap = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + P[name] + "</svg>";

export function iconEl(name){
  const s = document.createElement("span");
  s.className = "ico ico-" + name;
  s.setAttribute("aria-hidden", "true");
  s.innerHTML = wrap(name);          // ثابت داخلي من الجدول أعلاه
  return s;
}

// نص فيه رموز قديمة -> عقدة فيها أيقونات
export function rich(text){
  text = String(text);
  const frag = document.createDocumentFragment();
  if(!QUICK.test(text)){ frag.append(document.createTextNode(text)); return frag; }
  let last = 0, m;
  RE.lastIndex = 0;
  while((m = RE.exec(text))){
    if(m.index > last) frag.append(document.createTextNode(text.slice(last, m.index)));
    frag.append(iconEl(MAP[m[1]]));
    last = m.index + m[0].length;
  }
  if(last < text.length) frag.append(document.createTextNode(text.slice(last)));
  return frag;
}
export const needsRich = text => QUICK.test(text) && (RE.lastIndex = 0, RE.test(text));

// يحوّل نصوص الصفحة الثابتة (HTML) مرة واحدة عند الإقلاع
export function iconify(root){
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const list = [];
  while(walker.nextNode()) if(needsRich(walker.currentNode.nodeValue)) list.push(walker.currentNode);
  for(const n of list) n.replaceWith(rich(n.nodeValue));
}

/* ---------- Canvas: أيقونة كصورة بلون محدد ---------- */
const cache = new Map();
export function iconImage(name, color){
  if(!P[name]) return null;
  const key = name + "|" + color;
  let rec = cache.get(key);
  if(!rec){
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="' + color +
      '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><style>.f{fill:' + color + ';fill-opacity:.22;stroke:none}</style>' + P[name] + "</svg>";
    const img = new Image();
    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    rec = img; cache.set(key, rec);
  }
  return rec.complete && rec.naturalWidth ? rec : null;
}
