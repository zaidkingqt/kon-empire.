// تعريفات ثابتة للعبة. لا يوجد هنا أي منطق أو DOM.
export const VERSION = "3.0.0";
export const SAVE_VERSION = 3;
export const GRID = 4;
export const PLOTS = GRID * GRID;
export const MAX_LEVEL = 100;
export const MILESTONES = [10, 25, 50, 75, 100];   // عند كل مستوى يتضاعف إنتاج مباني الإنتاج

export const CONST = {
  AUTO_VALUE: 0.15,       // قيمة البيعة التلقائية مقارنة باليدوية
  RARE_BONUS: 1.3,        // مكافأة الأرض النادرة
  RARE_PLOT_COST: 3,
  BUILD_GROWTH: 1.6,      // ارتفاع سعر بناء مبنى إضافي من النوع نفسه
  PLOT_GROWTH: 2.1,
  OFFLINE_BASE_H: 2,      // ساعات الغياب الأساسية
  OFFLINE_EFF: 0.5,
  BOOST_MULT: 2,
  BOOST_SECONDS: 300,
  BOOST_MAX: 3600,
  METEOR_MIN: 45,
  METEOR_MAX: 95,
  START_COINS: 0
};

// المناطق: cm يضرب تكلفة المباني، prod يضرب إنتاجها داخل المنطقة
export const ZONES = [
  {id:"city",   name:"المدينة",       em:"🏙️", cm:1,      prod:1,     req:0,     plotBase:100,  sky:["#05030d","#1a0f38"], tint:"#251b46"},
  {id:"planet", name:"الكوكب",        em:"🪐", cm:12,     prod:7,     req:1e8,   plotBase:6e6,  sky:["#04101a","#0f2b3d"], tint:"#1c3346"},
  {id:"system", name:"النظام النجمي", em:"☀️", cm:180,    prod:108,   req:4e10,   plotBase:2e9,  sky:["#150806","#3b1608"], tint:"#3e2418"},
  {id:"galaxy", name:"المجرة",        em:"🌌", cm:3000,   prod:1800,  req:1.5e13,  plotBase:4e11, sky:["#0a0416","#2a0b45"], tint:"#33195a"}
];
// سعر فتح المنطقة بالعملات (بعد استيفاء req من الأرباح المكتسبة)
export const ZONE_COST = [0, 2e8, 7.5e10, 3e13];
export const OPEN_START = [5, 6, 9, 10];            // القطع المفتوحة عند بدء كل منطقة
export const RARE = [[3, 12], [0, 15], [3, 12], [0, 15, 3, 12]];   // قطع نادرة بمكافأة إنتاج

// أنواع المباني. role يحدد السلوك في economy.js
export const TYPES = [
  {id:"water",   name:"كشك ماء",           em:"💧",  role:"production", col:"#3aa8ff", cost:15,      g:1.21, inc:0.4,  unlock:0,     desc:"إنتاج أساسي رخيص."},
  {id:"chick",   name:"مزرعة الدجاج",      em:"🐔",  role:"production", col:"#e8743a", cost:150,     g:1.22, inc:3,    unlock:100,   desc:"إنتاج متوسط. يعزّز الماء."},
  {id:"cats",    name:"مقهى القطط",        em:"🐱",  role:"production", col:"#f06fb0", cost:1600,    g:1.23, inc:22,   unlock:1200,  desc:"إنتاج قوي. يعزّز الدجاج والماء."},
  {id:"dream",   name:"مصنع الأحلام",      em:"💤",  role:"production", col:"#8a7dff", cost:18000,   g:1.24, inc:150,  unlock:12000, desc:"إنتاج عالٍ. يعزّز القطط."},
  {id:"virus",   name:"مختبر الفيروس",     em:"🧪",  role:"production", col:"#4fd06a", cost:220000,  g:1.25, inc:1100, unlock:150000,desc:"إنتاج ضخم. يعزّز الأحلام."},
  {id:"hole",    name:"مصنع الثقب الأسود", em:"🕳️", role:"production", col:"#4a3a8a", cost:3e6,     g:1.26, inc:9000, unlock:1.5e6, desc:"أعلى إنتاج. يعزّز الفيروس."},
  {id:"storage", name:"مخزن الإمبراطورية", em:"📦",  role:"storage",    col:"#c79a5b", cost:5000,    g:1.2,  inc:0,    unlock:3000,  desc:"كل مستوى: +15 دقيقة لسقف الغياب و+0.4% كفاءة الغياب."},
  {id:"trade",   name:"سوق التجارة",       em:"🏪",  role:"trade",      col:"#e6c34a", cost:40000,   g:1.18, inc:0,    unlock:25000, desc:"كل مستوى: +2% لقيمة كل بيعة."},
  {id:"energy",  name:"محطة الطاقة",       em:"⚡",  role:"energy",     col:"#ffe14d", cost:4e5,     g:1.18, inc:0,    unlock:3e5,   desc:"كل مستوى: +1.5% لإنتاج كل المباني."},
  {id:"research",name:"مختبر الأبحاث",     em:"🔬",  role:"research",   col:"#4dd0e1", cost:2.5e6,   g:1.2,  inc:0,    unlock:2e6,   desc:"ينتج نقاط بحث لشراء التقنيات."},
  {id:"auto",    name:"مركز الأتمتة",      em:"🤖",  role:"automation", col:"#9aa7b8", cost:1.2e7,   g:1.18, inc:0,    unlock:1e7,   desc:"يبيع تلقائيًا ويتضاعف عند المستويات المفصلية."},
  {id:"reactor", name:"مفاعل الثقب",       em:"☢️", role:"reactor",    col:"#ff5a36", cost:1e8,     g:1.25, inc:0,    unlock:1.5e8, desc:"+1% للإنتاج لكل مستوى، وكل 10 مستويات = شظية إضافية عند Prestige."}
];
export const T = Object.fromEntries(TYPES.map((x, i) => [x.id, i]));

// تناغم: كل مستوى من from يرفع إنتاج to بنسبة pct
export const SYN = [
  {from:"chick", to:"water", pct:0.010},
  {from:"cats",  to:"chick", pct:0.010},
  {from:"cats",  to:"water", pct:0.005},
  {from:"dream", to:"cats",  pct:0.010},
  {from:"virus", to:"dream", pct:0.010},
  {from:"hole",  to:"virus", pct:0.010}
];

// سلّم البيع: v = سعر البيعة، need = عدد البيعات، req = أرباح هذه الجولة المطلوبة لفتح الفئة
export const ITEMS = [
  {n:"كوب ماء",  e:"💧", v:1,    need:12, req:0},
  {n:"ليموناضة", e:"🍋", v:2,    need:12, req:3e3},
  {n:"كرسي",     e:"🪑", v:4,    need:15, req:2e4},
  {n:"سيارة",    e:"🚗", v:8,   need:15, req:1.5e5},
  {n:"بيت",      e:"🏠", v:16,   need:15, req:1e6},
  {n:"شارع",     e:"🛣️", v:32,  need:20, req:7.5e6},
  {n:"مدينة",    e:"🏙️", v:64,  need:20, req:6e7},
  {n:"دولة",     e:"🗺️", v:128,  need:20, req:5e8},
  {n:"القمر",    e:"🌙", v:256, need:25, req:4e9},
  {n:"الشمس",    e:"☀️", v:512, need:25, req:3e10},
  {n:"الكون",    e:"🌌", v:1024, need:1,  req:1e12}
];

// مساعدون يبيعون تلقائيًا
export const AS = [
  {n:"قطة بائعة",   e:"🐱",   cost:50,    g:1.15, sps:0.5},
  {n:"موظف مبيعات", e:"🧑‍💼", cost:2500,  g:1.15, sps:5},
  {n:"روبوت تاجر",  e:"🤖",   cost:90000, g:1.15, sps:50}
];

// تقنيات بنقاط البحث (تُمسح مع كل Prestige)
export const TECHS = [
  {id:"cpu",   name:"معالج كمومي",   em:"🧠", max:10, base:5, g:2.2, desc:"+15% إنتاج لكل مستوى"},
  {id:"logi",  name:"لوجستيات",      em:"🚚", max:10, base:6, g:2.2, desc:"-2% من تكلفة البناء والترقية لكل مستوى"},
  {id:"auto",  name:"أتمتة ذكية",    em:"⚙️", max:10, base:5, g:2.2, desc:"+20% للمبيعات التلقائية لكل مستوى"},
  {id:"mkt",   name:"تسويق رقمي",    em:"📱", max:10, base:4, g:2.2, desc:"+15% لقيمة البيع لكل مستوى"},
  {id:"meteor",name:"حصاد الشهب",    em:"☄️", max:5,  base:8, g:2.6, desc:"+25% لمكافأة الشهب لكل مستوى"},
  {id:"cold",  name:"مخازن مبردة",   em:"🧊", max:5,  base:8, g:2.6, desc:"+30 دقيقة لسقف الغياب لكل مستوى"}
];

// شجرة الشظايا (دائمة عبر الجولات)
export const PATHS = [
  {id:"production", name:"مسار الإنتاج", em:"🏭"},
  {id:"automation", name:"مسار الأتمتة", em:"🤖"},
  {id:"trade",      name:"مسار التجارة", em:"🏪"},
  {id:"galaxy",     name:"مسار المجرة",  em:"🌌"}
];
export const TREE = [
  {id:"prod", path:"production", name:"طفرة الإنتاج",   em:"🏭", max:10, base:1, g:1.5, desc:"+20% إنتاج لكل مستوى"},
  {id:"syn",  path:"production", name:"تناغم أقوى",     em:"🔗", max:3,  base:2, g:2,   desc:"+50% لقوة روابط التناغم لكل مستوى"},
  {id:"start",path:"production", name:"بداية قوية",     em:"🚀", max:3,  base:2, g:2,   desc:"تبدأ كل جولة بكشك ماء بمستوى 5 × المستوى"},
  {id:"auto", path:"automation", name:"مساعدون مدربون", em:"🧑‍🏫", max:10, base:1, g:1.5, desc:"+30% للمبيعات التلقائية لكل مستوى"},
  {id:"keep", path:"automation", name:"ذاكرة الأتمتة",  em:"💾", max:4,  base:2, g:1.8, desc:"تحتفظ بـ 25% من المساعدين بعد Prestige لكل مستوى"},
  {id:"off",  path:"automation", name:"حراس الليل",     em:"🌙", max:5,  base:2, g:1.8, desc:"+10% كفاءة غياب و+1 ساعة سقف لكل مستوى"},
  {id:"sale", path:"trade",      name:"تجار أذكياء",    em:"💼", max:10, base:1, g:1.5, desc:"+25% لقيمة البيع لكل مستوى"},
  {id:"cap",  path:"trade",      name:"رأس مال",        em:"💰", max:5,  base:2, g:1.8, desc:"تبدأ كل جولة بعملات تتضاعف ×10 لكل مستوى"},
  {id:"disc", path:"trade",      name:"خصومات",         em:"🏷️", max:10, base:1, g:1.5, desc:"-3% من التكاليف لكل مستوى"},
  {id:"gain", path:"galaxy",     name:"حصاد الشظايا",   em:"✨", max:5,  base:3, g:1.8, desc:"+15% شظايا عند كل Prestige"},
  {id:"luck", path:"galaxy",     name:"صائد الشهب",     em:"☄️", max:5,  base:2, g:1.8, desc:"الشهب أكثر تكرارًا بـ 15% وأكبر بـ 15%"},
  {id:"zone", path:"galaxy",     name:"قفزة كونية",     em:"🪐", max:1,  base:5, g:1,   desc:"تبدأ كل جولة والكوكب مفتوح"}
];

export const RANKS = [
  {min:0,  name:"تاجر مبتدئ"},
  {min:1,  name:"مدير أسواق"},
  {min:4,  name:"حاكم مدينة"},
  {min:10, name:"سلطان كوكب"},
  {min:25, name:"إمبراطور"},
  {min:60, name:"إمبراطور كوني"}
];
