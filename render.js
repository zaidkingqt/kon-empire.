// محرك الرسم: بيئة 2.5D تجارية بطابع Tycoon — مدينة حية، طرق، حدائق، حركة وواجهات مبانٍ واضحة.
import {GRID, PLOTS, TYPES, ZONES, RARE, ITEMS} from "./data.js";
import {G} from "./state.js";
import {msCount} from "./economy.js";
import {iconImage, iconName} from "./icons.js";

export const view = {zone:0, sel:-1, hint:-1, fade:0};

const Q = {
  low:{dpr:1,parts:28,fps:30,bob:false,shadow:false},
  medium:{dpr:1.5,parts:70,fps:60,bob:true,shadow:true},
  high:{dpr:2,parts:130,fps:60,bob:true,shadow:true}
};
let cv,cx,W=0,H=0,dpr=1,tw=0,th=0,ox=0,oy=0,slab=0;
let quality=Q.high,reduce=false,lastDraw=0,lastT=0;
let meteor=null,stars=[],clouds=[],decor=[],people=[];
const pool=Array.from({length:150},()=>({a:false,x:0,y:0,vx:0,vy:0,life:0,max:1,r:2,c:"#fff"}));

const palettes=[
  {top:"#b8e9ff",mid:"#f2fcff",ground:"#9dd9b4",road:"#d8d5c8",roadEdge:"#b6b4a9",accent:"#29a6d9",sun:"#fff0a8"},
  {top:"#aeead9",mid:"#effff7",ground:"#8fcea8",road:"#d5d8c8",roadEdge:"#a8b8a8",accent:"#25aa91",sun:"#fff1a9"},
  {top:"#ffd1a6",mid:"#fff4df",ground:"#d4ad78",road:"#d6c8b4",roadEdge:"#ae9b82",accent:"#f47f4d",sun:"#fff0ad"},
  {top:"#c9c1ff",mid:"#f1eeff",ground:"#aaa0d4",road:"#d0c9df",roadEdge:"#aaa1c1",accent:"#765ddd",sun:"#fff0aa"}
];
const pal=()=>palettes[view.zone]||palettes[0];
const P=(gx,gy)=>[ox+(gx-gy)*tw/2,oy+(gx+gy)*th/2];

function seeded(n){const x=Math.sin(n*12.9898+view.zone*78.233)*43758.5453;return x-Math.floor(x);}
function geo(pi,p){
  const gx=pi%GRID,gy=Math.floor(pi/GRID),c=P(gx+.5,gy+.5);
  const big=p&&TYPES[p.t]?.role==="storage"?1.08:1;
  return {gx,gy,x:c[0],y:c[1],hw:tw*.34*big,hh:th*.34*big,h:p?tw*(.13+Math.min(p.l,60)*.012):0};
}
function poly(pts,fill,stroke,lw=1){
  cx.beginPath();cx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)cx.lineTo(pts[i][0],pts[i][1]);cx.closePath();
  if(fill){cx.fillStyle=fill;cx.fill();}if(stroke){cx.strokeStyle=stroke;cx.lineWidth=lw;cx.stroke();}
}
function shade(hex,f){
  const n=parseInt(String(hex).replace("#",""),16),c=k=>Math.max(0,Math.min(255,Math.round(((n>>k)&255)*f)));
  return "rgb("+c(16)+","+c(8)+","+c(0)+")";
}
function icon(name,color,x,y,s){const im=iconImage(name,color);if(im)cx.drawImage(im,x-s/2,y-s/2,s,s);return !!im;}

export function init(canvas){
  cv=canvas;cx=cv.getContext("2d",{alpha:false});
  stars=Array.from({length:180},()=>({x:Math.random(),y:Math.random()*.7,r:.35+Math.random()*1.4,p:Math.random()*6.28}));
  clouds=Array.from({length:8},()=>({x:Math.random(),y:.08+Math.random()*.25,s:.55+Math.random()*.85,v:.0015+Math.random()*.003}));
  buildDecor();
  resize();
}
export function setQuality(name,reduceMotion){quality=Q[name]||Q.high;reduce=!!reduceMotion;resize();}
export function resize(){
  if(!cv)return;
  const r=cv.parentElement.getBoundingClientRect();
  dpr=Math.min(devicePixelRatio||1,quality.dpr);W=Math.max(1,r.width);H=Math.max(1,r.height);
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cx.setTransform(dpr,0,0,dpr,0,0);
  tw=Math.min(W*.88/GRID,H*.86/3.45);th=tw*.5;slab=tw*.13;
  ox=W/2;oy=H-GRID*th-slab-tw*.17;
  buildDecor();
}
function buildDecor(){
  decor=[];
  for(let i=0;i<34;i++) decor.push({type:"tree",x:.08+seeded(i*4+1)*.84,y:.48+seeded(i*4+2)*.38,s:.65+seeded(i*4+3)*.65,phase:seeded(i*4+4)*6.28});
  for(let i=0;i<10;i++) decor.push({type:"lamp",x:.13+seeded(i*9+20)*.74,y:.49+seeded(i*9+21)*.34,s:.75+seeded(i*9+22)*.45});
  people=Array.from({length:9},(_,i)=>({lane:i%3,x:seeded(i*17+3),speed:.000025+seeded(i*17+4)*.000025,phase:seeded(i*17+5)*6.28}));
}

export function burst(x,y,n=14,color="#ffd166"){
  if(reduce)n=Math.min(4,n);
  for(let i=0;i<n;i++){const a=Math.random()*6.283,v=35+Math.random()*100;spawn(x,y,Math.cos(a)*v,Math.sin(a)*v,.55+Math.random()*.5,1.5+Math.random()*2,color);}
}
function spawn(x,y,vx,vy,life,r,c){
  const cap=Math.min(pool.length,quality.parts);
  for(let i=0;i<cap;i++){const q=pool[i];if(!q.a){Object.assign(q,{a:true,x,y,vx,vy,life,max:life,r,c});return;}}
}
export function burstPlot(pi,n=16,color){
  const g=geo(pi,G.S.zones[view.zone].plots[pi]);burst(g.x,g.y-g.h,n,color||"#7ee8fa");
}
export function spawnMeteor(){const d=Math.random()<.5?1:-1;meteor={x:d>0?-50:W+50,y:H*(.12+Math.random()*.2),vx:d*W/5.8,vy:H*.015,life:9};}
export const meteorOn=()=>!!meteor;
export const clearMeteor=()=>{meteor=null;};

function drawSky(S,t){
  const p=pal(),g=cx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,p.top);g.addColorStop(.55,p.mid);g.addColorStop(1,"#dff1e9");cx.fillStyle=g;cx.fillRect(0,0,W,H);
  const sx=W*.15,sy=H*.14,sr=Math.min(W,H)*.06;
  const glow=cx.createRadialGradient(sx,sy,0,sx,sy,sr*3);glow.addColorStop(0,"rgba(255,235,145,.52)");glow.addColorStop(1,"rgba(255,235,145,0)");
  cx.fillStyle=glow;cx.beginPath();cx.arc(sx,sy,sr*3,0,6.283);cx.fill();
  cx.fillStyle=p.sun;cx.beginPath();cx.arc(sx,sy,sr,0,6.283);cx.fill();
  if(view.zone<3){
    for(const c of clouds){
      c.x=(c.x+c.v*.016)%1;
      const x=c.x*W,y=c.y*H,s=tw*c.s;
      cx.fillStyle="rgba(255,255,255,.42)";
      for(const [dx,dy,r] of [[0,0,.34],[.28,-.04,.27],[-.25,.03,.23],[.08,.06,.3]]){
        cx.beginPath();cx.ellipse(x+dx*s,y+dy*s,r*s,r*.58*s,0,0,6.283);cx.fill();
      }
    }
  }else{
    cx.fillStyle="#fff";
    for(let i=0;i<Math.min(stars.length,quality.parts+30);i++){const s=stars[i];cx.globalAlpha=.16+.34*Math.abs(Math.sin(t/1100+s.p));cx.beginPath();cx.arc(s.x*W,s.y*H,s.r,0,6.283);cx.fill();}
    cx.globalAlpha=1;
  }
  // أفق بعيد يعطي إحساسًا بحجم المدينة.
  cx.fillStyle=view.zone===2?"rgba(128,80,48,.15)":"rgba(61,124,118,.11)";
  cx.beginPath();cx.moveTo(0,H*.5);for(let x=0;x<=W;x+=W/9)cx.lineTo(x,H*(.43+Math.sin(x/W*7)*.035));cx.lineTo(W,H);cx.lineTo(0,H);cx.fill();
}

function drawRoads(){
  const p=pal();
  // طرق رئيسية تحت شبكة الأراضي.
  cx.save();cx.lineCap="round";
  cx.strokeStyle="rgba(95,104,101,.14)";cx.lineWidth=tw*.24;
  const a=P(-.35,-.15),b=P(GRID+.35,GRID+.15);cx.beginPath();cx.moveTo(...a);cx.lineTo(...b);cx.stroke();
  const c=P(GRID+.15,-.2),d=P(-.2,GRID+.15);cx.beginPath();cx.moveTo(...c);cx.lineTo(...d);cx.stroke();
  cx.strokeStyle=p.road;cx.lineWidth=tw*.19;
  cx.beginPath();cx.moveTo(...a);cx.lineTo(...b);cx.moveTo(...c);cx.lineTo(...d);cx.stroke();
  cx.strokeStyle="rgba(255,255,255,.6)";cx.lineWidth=Math.max(1,tw*.012);
  cx.setLineDash([tw*.07,tw*.07]);
  cx.beginPath();cx.moveTo(...a);cx.lineTo(...b);cx.moveTo(...c);cx.lineTo(...d);cx.stroke();
  cx.restore();
}

function drawTree(x,y,s,phase,t){
  const sway=reduce?0:Math.sin(t/900+phase)*s*1.5;
  cx.fillStyle="rgba(35,78,57,.16)";cx.beginPath();cx.ellipse(x+s*.05,y+s*.2,s*.34,s*.12,0,0,6.283);cx.fill();
  cx.fillStyle="#8b633f";cx.fillRect(x-s*.035,y-s*.02,s*.07,s*.22);
  for(const [dx,dy,r] of [[0,-.14,.2],[-.12,-.04,.16],[.12,-.03,.17],[0,.06,.18]]){
    cx.fillStyle=shade(view.zone===2?"#6ca46c":"#4fa66d",.92+dy);
    cx.beginPath();cx.arc(x+dx*s+sway,y+dy*s,r*s,0,6.283);cx.fill();
  }
}
function drawLamp(x,y,s){
  cx.strokeStyle="rgba(57,72,69,.65)";cx.lineWidth=Math.max(1,tw*.014);cx.beginPath();cx.moveTo(x,y);cx.lineTo(x,y-s*.26);cx.stroke();
  cx.fillStyle="#fff4bd";cx.beginPath();cx.arc(x,y-s*.28,s*.045,0,6.283);cx.fill();
}
function drawDecor(t){
  // الزينة تبقى خارج مساحة البناء قدر الإمكان وتُرسم قبل المباني.
  for(const d of decor){
    const x=d.x*W,y=d.y*H;
    if(d.type==="tree")drawTree(x,y,tw*.22*d.s,d.phase,t);
    else drawLamp(x,y,tw*.7*d.s);
  }
}

function drawGround(S,t){
  const Z=S.zones[view.zone],p=pal(),T0=P(0,0),R=P(GRID,0),B=P(GRID,GRID),L=P(0,GRID);
  // حافة مرتفعة مثل ألعاب التايكون التجارية.
  poly([L,B,[B[0],B[1]+slab],[L[0],L[1]+slab]],shade(p.ground,.72),"rgba(65,100,82,.2)");
  poly([B,R,[R[0],R[1]+slab],[B[0],B[1]+slab]],shade(p.ground,.58),"rgba(65,100,82,.2)");
  poly([T0,R,B,L],p.ground,"rgba(55,120,100,.28)",1);
  drawRoads();
  // مربعات الأراضي + حدائق صغيرة بين القطع.
  for(let pi=0;pi<PLOTS;pi++){
    const gx=pi%GRID,gy=Math.floor(pi/GRID),pts=[P(gx,gy),P(gx+1,gy),P(gx+1,gy+1),P(gx,gy+1)],open=Z.open[pi],bld=Z.plots[pi];
    poly(pts,open?(gx+gy)%2?"rgba(255,255,255,.10)":"rgba(255,255,255,.17)":"rgba(70,100,105,.13)","rgba(255,255,255,.3)");
    if(open&&!bld){
      const c=P(gx+.5,gy+.5);
      cx.fillStyle="rgba(255,255,255,.82)";cx.beginPath();cx.arc(c[0],c[1],tw*.035,0,6.283);cx.fill();
      cx.fillStyle="rgba(255,255,255,.62)";cx.font="900 "+Math.round(tw*.2)+"px sans-serif";cx.textAlign="center";cx.fillText("+",c[0],c[1]+th*.1);
    }
    if(!bld&&!open){const c=P(gx+.5,gy+.5);cx.fillStyle="rgba(255,255,255,.38)";icon("lock","#58777a",c[0],c[1],tw*.19);}
    if((RARE[view.zone]||[]).includes(pi))poly(pts,"rgba(255,211,76,.13)","rgba(255,184,63,.85)",2);
    if(view.sel===pi)poly(pts,"rgba(255,224,120,.24)","#ffb93f",3);
    if(view.hint===pi){const k=.5+.5*Math.sin(t/250);poly(pts,"rgba(63,213,229,"+(.08+.12*k)+")","#45d7e5",3);}
  }
}

function drawWaterFeature(t){
  if(view.zone!==0&&view.zone!==1)return;
  const y=H*.53+Math.sin(t/1800)*2;
  cx.save();cx.globalAlpha=.72;
  cx.fillStyle=view.zone===0?"#72cfe0":"#69c7b0";
  cx.beginPath();cx.moveTo(W*.02,y);cx.bezierCurveTo(W*.25,y-18,W*.48,y+15,W*.72,y-8);cx.bezierCurveTo(W*.86,y-18,W*.95,y-5,W, y-12);cx.lineTo(W,y+22);cx.bezierCurveTo(W*.7,y+30,W*.35,y+8,W*.02,y+28);cx.closePath();cx.fill();
  cx.strokeStyle="rgba(255,255,255,.5)";cx.lineWidth=2;
  for(let i=0;i<5;i++){const xx=W*(.1+i*.19);cx.beginPath();cx.moveTo(xx,y+5);cx.quadraticCurveTo(xx+25,y-2,xx+50,y+4);cx.stroke();}
  cx.restore();
}

function drawLandmarks(t){
  const x=W*.82,y=H*.47,s=tw*.32;
  if(view.zone===0){
    // برج إداري بعيد.
    cx.fillStyle="rgba(255,255,255,.46)";cx.fillRect(x-s*.18,y-s*.8,s*.36,s*.8);
    cx.fillStyle="rgba(80,155,170,.35)";for(let i=0;i<4;i++)cx.fillRect(x-s*.11,y-s*.68+i*s*.16,s*.22,s*.055);
    cx.fillStyle="rgba(255,255,255,.7)";cx.beginPath();cx.arc(x,y-s*.9,s*.06,0,6.283);cx.fill();
  }else if(view.zone===1){
    cx.fillStyle="rgba(255,255,255,.34)";cx.beginPath();cx.arc(x,y-s*.35,s*.42,Math.PI,0);cx.fill();
    cx.fillStyle="rgba(65,100,105,.25)";cx.fillRect(x-s*.42,y-s*.35,s*.84,s*.42);
  }else if(view.zone===2){
    cx.fillStyle="rgba(255,202,120,.28)";cx.beginPath();cx.arc(x,y-s*.25,s*.5,0,6.283);cx.fill();
    cx.strokeStyle="rgba(255,150,65,.45)";cx.lineWidth=tw*.035;cx.beginPath();cx.arc(x,y-s*.25,s*.62,0,6.283);cx.stroke();
  }else{
    cx.fillStyle="rgba(160,120,255,.22)";cx.beginPath();cx.arc(x,y-s*.3,s*.55,0,6.283);cx.fill();
    cx.strokeStyle="rgba(255,255,255,.25)";cx.lineWidth=2;cx.beginPath();cx.arc(x,y-s*.3,s*.72,t/2500,t/2500+4.7);cx.stroke();
  }
}


function drawPerson(p,t){
  const u=(p.x+t*p.speed)%1, lane=p.lane, gx=.25+u*(GRID-.5), gy=.65+((lane+1)*.72)%Math.max(1,GRID-1);
  const q=P(gx,Math.min(GRID-.3,gy)),s=tw*.18,bob=reduce?0:Math.sin(t/320+p.phase)*1.5;
  cx.save();cx.translate(q[0],q[1]-s*.45+bob);
  cx.fillStyle="rgba(30,55,58,.18)";cx.beginPath();cx.ellipse(0,s*.55,s*.22,s*.08,0,0,6.283);cx.fill();
  cx.fillStyle="#f2c9aa";cx.beginPath();cx.arc(0,-s*.18,s*.11,0,6.283);cx.fill();
  cx.fillStyle=["#5e718c","#d47b65","#6aa27e","#8a75b5"][lane%4];cx.beginPath();cx.roundRect(-s*.11,-s*.03,s*.22,s*.32,s*.05);cx.fill();
  cx.fillStyle="#334d58";cx.fillRect(-s*.09,s*.27,s*.07,s*.2);cx.fillRect(s*.02,s*.27,s*.07,s*.2);cx.restore();
}
function drawPeople(t){if(reduce)return;for(const p of people)drawPerson(p,t);}

function drawVehicle(t){
  if(reduce)return;
  const u=(t%9000)/9000;
  const a=P(-.2,-.1),b=P(GRID+.2,GRID+.1),x=a[0]+(b[0]-a[0])*u,y=a[1]+(b[1]-a[1])*u;
  cx.save();cx.translate(x,y);cx.rotate(Math.atan2(b[1]-a[1],b[0]-a[0]));
  cx.fillStyle="rgba(35,80,85,.2)";cx.fillRect(-tw*.09,-tw*.035,tw*.18,tw*.07);
  cx.fillStyle=view.zone===2?"#f28a55":"#ffffff";cx.fillRect(-tw*.07,-tw*.045,tw*.14,tw*.07);
  cx.fillStyle="#6e9bb0";cx.fillRect(-tw*.03,-tw*.037,tw*.06,tw*.025);cx.restore();
}

function drawBuilding(S,pi,p,t,dt){
  const ty=TYPES[p.t],g=geo(pi,p),x=g.x,y=g.y,hw=g.hw,hh=g.hh,h=g.h;
  if(!ty)return;
  if(quality.shadow){cx.fillStyle="rgba(36,72,70,.18)";cx.beginPath();cx.ellipse(x+hw*.25,y+hh*.42,hw*1.08,hh*.8,0,0,6.283);cx.fill();}
  const left=cx.createLinearGradient(x-hw,y-h,x,y+hh),right=cx.createLinearGradient(x,y-h,x+hw,y+hh);
  left.addColorStop(0,shade(ty.col,1.18));left.addColorStop(1,shade(ty.col,.62));
  right.addColorStop(0,shade(ty.col,.96));right.addColorStop(1,shade(ty.col,.5));
  poly([[x-hw,y],[x,y+hh],[x,y+hh-h],[x-hw,y-h]],left,"rgba(255,255,255,.18)");
  poly([[x+hw,y],[x,y+hh],[x,y+hh-h],[x+hw,y-h]],right,"rgba(255,255,255,.14)");
  poly([[x,y-h-hh],[x+hw,y-h],[x,y+hh-h],[x-hw,y-h]],shade(ty.col,1.28),"rgba(255,255,255,.58)");
  const rows=Math.min(5,1+Math.floor(p.l/5));
  for(let r=0;r<rows;r++)for(const side of [-1,1]){
    const yy=y-h+hh*.13+r*(hh*.68/Math.max(1,rows));
    cx.fillStyle=r%2?"rgba(255,248,190,.78)":"rgba(255,255,255,.55)";
    cx.fillRect(x+side*hw*.38,yy,hw*.12,Math.max(2,hh*.09));
  }
  // تفاصيل سقف تختلف حسب نوع المبنى.
  if(ty.role==="production"){
    cx.fillStyle="rgba(255,255,255,.18)";cx.fillRect(x-hw*.25,y-h-hh*.38,hw*.5,Math.max(2,tw*.018));
  }else if(ty.role==="trade"){
    cx.fillStyle="#fff0a6";cx.beginPath();cx.arc(x,y-h-hh*.25,tw*.07,0,6.283);cx.fill();
  }else if(ty.role==="automation"){
    cx.strokeStyle="rgba(255,255,255,.72)";cx.lineWidth=Math.max(1,tw*.018);cx.beginPath();cx.arc(x,y-h-hh*.2,tw*.08,t/700,t/700+4.7);cx.stroke();
  }
  const lit=msCount(p.l),bob=reduce||!quality.bob?0:Math.sin(t/520+pi)*1.7,by=y-h-hh*.04+bob,br=tw*.17;
  cx.fillStyle="rgba(255,255,255,.95)";cx.beginPath();cx.arc(x,by,br,0,6.283);cx.fill();cx.strokeStyle=ty.col;cx.lineWidth=2;cx.stroke();
  icon(iconName(ty.em)||"building",ty.col,x,by,br*1.28);
  const fs=Math.max(9,Math.round(tw*.105)),label="Lv "+p.l;
  cx.font="800 "+fs+"px Cairo,sans-serif";cx.textAlign="center";cx.textBaseline="middle";
  const w=cx.measureText(label).width+12;cx.fillStyle="rgba(255,255,255,.94)";
  if(cx.roundRect){cx.beginPath();cx.roundRect(x-w/2,y+hh+3,w,fs+7,8);cx.fill();}else cx.fillRect(x-w/2,y+hh+3,w,fs+7);
  cx.fillStyle=ty.col;cx.fillText(label,x,y+hh+3+(fs+7)/2);
  if(!reduce&&ty.role==="production"&&Math.random()<dt*(.1+p.l*.004))spawn(x+(Math.random()-.5)*hw,y-h-hh,0,-25,.8,2,"rgba(255,224,120,.9)");
  if(lit>=3){cx.strokeStyle="rgba(255,211,100,.5)";cx.lineWidth=2;cx.beginPath();cx.arc(x,y-h-hh,br*1.4,0,6.283);cx.stroke();}
}

function drawParticles(dt){
  for(const q of pool){if(!q.a)continue;q.life-=dt;if(q.life<=0){q.a=false;continue;}q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.985;cx.globalAlpha=Math.min(1,q.life/q.max*1.4);cx.fillStyle=q.c;cx.beginPath();cx.arc(q.x,q.y,q.r,0,6.283);cx.fill();}cx.globalAlpha=1;
}
function drawMeteor(dt){
  if(!meteor)return;meteor.x+=meteor.vx*dt;meteor.y+=meteor.vy*dt;meteor.life-=dt;
  if(meteor.x<-90||meteor.x>W+90||meteor.life<=0){meteor=null;return;}
  cx.save();cx.translate(meteor.x,meteor.y);cx.rotate(Math.atan2(meteor.vy,meteor.vx));
  const gr=cx.createLinearGradient(-80,0,15,0);gr.addColorStop(0,"rgba(255,180,70,0)");gr.addColorStop(1,"rgba(255,155,45,.72)");cx.strokeStyle=gr;cx.lineWidth=11;cx.beginPath();cx.moveTo(-80,0);cx.lineTo(0,0);cx.stroke();cx.restore();
  icon("comet","#ffb94e",meteor.x,meteor.y,44);
}

export function frame(t){
  const S=G.S;if(!S||!cx)return false;const minGap=1000/quality.fps-2;if(t-lastDraw<minGap)return false;
  const dt=Math.min(.05,(t-(lastT||t))/1000);lastT=t;lastDraw=t;
  drawSky(S,t);drawGround(S,t);drawWaterFeature(t);drawLandmarks(t);drawDecor(t);drawVehicle(t);
  const Z=S.zones[view.zone];
  for(let s=0;s<=2*GRID-2;s++)for(let gx=0;gx<GRID;gx++){const gy=s-gx;if(gy<0||gy>=GRID)continue;const pi=gx+gy*GRID;if(Z.plots[pi])drawBuilding(S,pi,Z.plots[pi],t,dt);}
  drawParticles(dt);drawMeteor(dt);
  if(view.fade>0){cx.fillStyle="rgba(255,255,255,"+Math.min(1,view.fade)+")";cx.fillRect(0,0,W,H);view.fade=Math.max(0,view.fade-dt*4);}
  return true;
}
export function pick(x,y){
  if(meteor&&Math.hypot(x-meteor.x,y-meteor.y)<50)return{type:"meteor"};
  const Z=G.S.zones[view.zone];
  for(let s=2*GRID-2;s>=0;s--)for(let gx=GRID-1;gx>=0;gx--){const gy=s-gx;if(gy<0||gy>=GRID)continue;const pi=gx+gy*GRID,p=Z.plots[pi],g=geo(pi,p);
    if(p){if(x>=g.x-g.hw&&x<=g.x+g.hw&&y>=g.y-g.hh-g.h-tw*.22&&y<=g.y+g.hh)return{type:"plot",pi};}
    else if(Math.abs(x-g.x)/(tw/2)+Math.abs(y-g.y)/(th/2)<=1)return{type:"plot",pi};
  }
  return null;
}
export function plotScreen(pi){const g=geo(pi,G.S.zones[view.zone].plots[pi]);return{x:g.x,y:g.y-g.h};}
export function size(){return{W,H,tw};}
