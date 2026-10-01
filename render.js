// محرك الرسم: بيئة 2.5D مشرقة ونظيفة، مع مدينة حية ومناطق كونية متدرجة.
import {GRID, PLOTS, TYPES, ZONES, RARE, ITEMS} from "./data.js";
import {G} from "./state.js";
import {msCount} from "./economy.js";
import {iconImage, iconName} from "./icons.js";

export const view = {zone: 0, sel: -1, hint: -1, fade: 0};

const Q = {
  low:{dpr:1,parts:35,fps:30,bob:false,shadow:false},
  medium:{dpr:1.5,parts:90,fps:60,bob:true,shadow:true},
  high:{dpr:2,parts:180,fps:60,bob:true,shadow:true}
};
let cv,cx,W=0,H=0,dpr=1,tw=0,th=0,ox=0,oy=0,slab=0;
let quality=Q.high,reduce=false,lastDraw=0,lastT=0;
let meteor=null,stars=[],clouds=[];
const pool=Array.from({length:180},()=>({a:false,x:0,y:0,vx:0,vy:0,life:0,max:1,r:2,c:"#fff"}));

export function init(canvas){
  cv=canvas; cx=cv.getContext("2d",{alpha:false});
  stars=Array.from({length:220},()=>({x:Math.random(),y:Math.random()*.72,r:.4+Math.random()*1.5,p:Math.random()*6.28}));
  clouds=Array.from({length:9},()=>({x:Math.random(),y:.08+Math.random()*.28,s:.55+Math.random()*.8,v:.002+Math.random()*.004}));
  resize();
}
export function setQuality(name,reduceMotion){quality=Q[name]||Q.high;reduce=!!reduceMotion;resize();}
export function resize(){
  if(!cv)return;
  const r=cv.parentElement.getBoundingClientRect();
  dpr=Math.min(devicePixelRatio||1,quality.dpr); W=Math.max(1,r.width); H=Math.max(1,r.height);
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cx.setTransform(dpr,0,0,dpr,0,0);
  tw=Math.min(W*.9/GRID,H*.9/3.45);th=tw*.5;slab=tw*.13;
  ox=W/2;oy=H-GRID*th-slab-tw*.18;
}
const P=(gx,gy)=>[ox+(gx-gy)*tw/2,oy+(gx+gy)*th/2];
function geo(pi,p){
  const gx=pi%GRID,gy=Math.floor(pi/GRID),c=P(gx+.5,gy+.5);
  const big=p&&TYPES[p.t].role==="storage"?1.08:1;
  return {gx,gy,x:c[0],y:c[1],hw:tw*.34*big,hh:th*.34*big,h:p?tw*(.14+Math.min(p.l,60)*.012):0};
}
function poly(pts,fill,stroke,lw=1){
  cx.beginPath();cx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)cx.lineTo(pts[i][0],pts[i][1]);cx.closePath();
  if(fill){cx.fillStyle=fill;cx.fill();}if(stroke){cx.strokeStyle=stroke;cx.lineWidth=lw;cx.stroke();}
}
function shade(hex,f){
  const n=parseInt(hex.slice(1),16),c=k=>Math.max(0,Math.min(255,Math.round(((n>>k)&255)*f)));
  return "rgb("+c(16)+","+c(8)+","+c(0)+")";
}
function icon(name,color,x,y,s){const im=iconImage(name,color);if(im)cx.drawImage(im,x-s/2,y-s/2,s,s);return !!im;}

export function burst(x,y,n=14,color="#ffd166"){
  if(reduce)n=Math.min(4,n);
  for(let i=0;i<n;i++){const a=Math.random()*6.283,v=35+Math.random()*100;spawn(x,y,Math.cos(a)*v,Math.sin(a)*v,.65+Math.random()*.45,1.5+Math.random()*2,color);}
}
function spawn(x,y,vx,vy,life,r,c){
  const cap=Math.min(pool.length,quality.parts);
  for(let i=0;i<cap;i++){const q=pool[i];if(!q.a){Object.assign(q,{a:true,x,y,vx,vy,life,max:life,r,c});return;}}
}
export function burstPlot(pi,n=16,color){
  const g=geo(pi,G.S.zones[view.zone].plots[pi]);burst(g.x,g.y-g.h,n,color||"#7ee8fa");
}
export function spawnMeteor(){const d=Math.random()<.5?1:-1;meteor={x:d>0?-40:W+40,y:H*(.12+Math.random()*.22),vx:d*W/6,vy:H*.015,life:9};}
export const meteorOn=()=>!!meteor;
export const clearMeteor=()=>{meteor=null;};

const progress=S=>Math.min(1,(S.tier+S.sold/Math.max(1,ITEMS[S.tier].need))/ITEMS.length);
function palette(zi){
  return [
    {top:"#bfefff",mid:"#e9fbff",ground:"#a9ddc2",accent:"#42a9e8",sun:"#fff1a8"},
    {top:"#b9f1e6",mid:"#effff8",ground:"#9ed8b8",accent:"#44b6a0",sun:"#fff3bb"},
    {top:"#ffd7b0",mid:"#fff3d8",ground:"#d8b27f",accent:"#ff8c55",sun:"#fff4c2"},
    {top:"#cfc5ff",mid:"#f1edff",ground:"#b7a6df",accent:"#8065dc",sun:"#fff0b0"}
  ][zi]||null;
}
function drawSky(S,t){
  const pal=palette(view.zone),g=cx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,pal.top);g.addColorStop(.58,pal.mid);g.addColorStop(1,"#d9eee8");cx.fillStyle=g;cx.fillRect(0,0,W,H);
  // شمس ناعمة + هالة
  const sx=W*.16,sy=H*.16,sr=Math.min(W,H)*.075;
  const glow=cx.createRadialGradient(sx,sy,0,sx,sy,sr*2.7);glow.addColorStop(0,"rgba(255,238,158,.5)");glow.addColorStop(1,"rgba(255,238,158,0)");
  cx.fillStyle=glow;cx.beginPath();cx.arc(sx,sy,sr*2.7,0,6.283);cx.fill();
  cx.fillStyle=pal.sun;cx.beginPath();cx.arc(sx,sy,sr,0,6.283);cx.fill();
  // سحب خفيفة تتحرك ببطء
  if(view.zone<3){
    for(const c of clouds){
      c.x=(c.x+c.v*.016)%.1+((c.x+c.v*.016)%1+.9)%1;
      const x=((c.x%1)+1)%1*W,y=c.y*H,s=tw*c.s;
      cx.fillStyle="rgba(255,255,255,.45)";
      for(const [dx,dy,r] of [[0,0,.34],[.28,-.04,.27],[-.25,.03,.23],[.08,.06,.3]]){
        cx.beginPath();cx.ellipse(x+dx*s,y+dy*s,r*s,r*.58*s,0,0,6.283);cx.fill();
      }
    }
  } else {
    // نجوم هادئة في المناطق الكونية
    const count=Math.min(stars.length,quality.parts+40);
    cx.fillStyle="#fff";
    for(let i=0;i<count;i++){const s=stars[i];cx.globalAlpha=.2+.35*Math.abs(Math.sin(t/1100+s.p));cx.beginPath();cx.arc(s.x*W,s.y*H,s.r,0,6.283);cx.fill();}
    cx.globalAlpha=1;
  }
  // خلفية بعيدة: جبال/جزر سحابية
  cx.fillStyle= view.zone===2 ? "rgba(139,91,62,.16)" : "rgba(76,130,132,.12)";
  cx.beginPath();cx.moveTo(0,H*.52);for(let x=0;x<=W;x+=W/7)cx.lineTo(x,H*(.43+Math.sin(x/W*8)*.035));cx.lineTo(W,H);cx.lineTo(0,H);cx.fill();
}
function drawGround(S,t){
  const Z=S.zones[view.zone],pal=palette(view.zone),T0=P(0,0),R=P(GRID,0),B=P(GRID,GRID),L=P(0,GRID);
  poly([L,B,[B[0],B[1]+slab],[L[0],L[1]+slab]],shade(pal.ground,.72));
  poly([B,R,[R[0],R[1]+slab],[B[0],B[1]+slab]],shade(pal.ground,.58));
  poly([T0,R,B,L],pal.ground,"rgba(55,120,100,.25)",1);
  // شبكة ممرات
  for(let i=0;i<=GRID;i++){
    const a=P(i,0),b=P(i,GRID),c=P(0,i),d=P(GRID,i);
    cx.strokeStyle="rgba(255,255,255,.22)";cx.lineWidth=2;
    cx.beginPath();cx.moveTo(...a);cx.lineTo(...b);cx.moveTo(...c);cx.lineTo(...d);cx.stroke();
  }
  const rare=RARE[view.zone]||[];
  for(let pi=0;pi<PLOTS;pi++){
    const gx=pi%GRID,gy=Math.floor(pi/GRID),pts=[P(gx,gy),P(gx+1,gy),P(gx+1,gy+1),P(gx,gy+1)],open=Z.open[pi],p=Z.plots[pi];
    poly(pts,open?(gx+gy)%2?"rgba(255,255,255,.09)":"rgba(255,255,255,.16)":"rgba(80,110,120,.14)","rgba(255,255,255,.28)");
    if(rare.includes(pi))poly(pts,"rgba(255,213,92,.12)","rgba(255,190,70,.8)",2);
    const c=P(gx+.5,gy+.5);
    if(!p&&open){cx.fillStyle="rgba(255,255,255,.6)";cx.font="900 "+Math.round(tw*.28)+"px sans-serif";cx.textAlign="center";cx.fillText("+",c[0],c[1]+th*.1);}
    if(!p&&!open){cx.fillStyle="rgba(255,255,255,.35)";icon("lock","#6d8a96",c[0],c[1],tw*.2);}
    if(view.sel===pi)poly(pts,"rgba(255,220,120,.2)","#ffbf55",3);
    if(view.hint===pi){const k=.5+.5*Math.sin(t/250);poly(pts,"rgba(70,210,230,"+(.08+.1*k)+")","#5adbe8",3);}
  }
  // طرق صغيرة حول المدينة
  cx.strokeStyle="rgba(255,255,255,.42)";cx.lineWidth=Math.max(2,tw*.035);cx.lineCap="round";
  for(let i=0;i<3;i++){const a=P(.1+i*.15,0),b=P(3.9,3.9-i*.15);cx.beginPath();cx.moveTo(...a);cx.lineTo(...b);cx.stroke();}
}
function drawBuilding(S,pi,p,t,dt){
  const ty=TYPES[p.t],g=geo(pi,p),x=g.x,y=g.y,hw=g.hw,hh=g.hh,h=g.h;
  if(quality.shadow){cx.fillStyle="rgba(35,70,75,.16)";cx.beginPath();cx.ellipse(x+hw*.25,y+hh*.42,hw*1.08,hh*.8,0,0,6.283);cx.fill();}
  const left=cx.createLinearGradient(x-hw,y-h,x,y+hh);left.addColorStop(0,shade(ty.col,1.2));left.addColorStop(1,shade(ty.col,.65));
  const right=cx.createLinearGradient(x,y-h,x+hw,y+hh);right.addColorStop(0,shade(ty.col,.95));right.addColorStop(1,shade(ty.col,.52));
  poly([[x-hw,y],[x,y+hh],[x,y+hh-h],[x-hw,y-h]],left);
  poly([[x+hw,y],[x,y+hh],[x,y+hh-h],[x+hw,y-h]],right);
  poly([[x,y-h-hh],[x+hw,y-h],[x,y+hh-h],[x-hw,y-h]],shade(ty.col,1.28),"rgba(255,255,255,.5)",1);
  // نوافذ مضيئة
  const rows=Math.min(5,1+Math.floor(p.l/5));
  for(let r=0;r<rows;r++)for(const side of [-1,1]){
    const yy=y-h+hh*.15+r*(hh*.68/Math.max(1,rows));
    cx.fillStyle=r%2?"rgba(255,247,190,.72)":"rgba(255,255,255,.58)";
    cx.fillRect(x+side*hw*.38,yy,hw*.12,hh*.1);
  }
  const lit=msCount(p.l),bob=reduce||!quality.bob?0:Math.sin(t/520+pi)*2;
  const by=y-h-hh*.05+bob,br=tw*.17;
  cx.fillStyle="rgba(255,255,255,.92)";cx.beginPath();cx.arc(x,by,br,0,6.283);cx.fill();
  cx.strokeStyle=ty.col;cx.lineWidth=2;cx.stroke();icon(iconName(ty.em)||"building",ty.col,x,by,br*1.3);
  const fs=Math.max(9,Math.round(tw*.105)),label="Lv "+p.l,w=cx.measureText(label).width+10;
  cx.font="800 "+fs+"px Cairo,sans-serif";cx.textAlign="center";cx.textBaseline="middle";
  cx.fillStyle="rgba(255,255,255,.92)";cx.beginPath();if(cx.roundRect)cx.roundRect(x-w/2,y+hh+3,w,fs+7,8);else cx.rect(x-w/2,y+hh+3,w,fs+7);cx.fill();
  cx.fillStyle=ty.col;cx.fillText(label,x,y+hh+3+(fs+7)/2);
  if(!reduce&&ty.role==="production"&&Math.random()<dt*(.15+p.l*.008))spawn(x+(Math.random()-.5)*hw,y-h-hh,0,-28,.9,2,"rgba(255,224,120,.9)");
  if(lit>=3){cx.strokeStyle="rgba(255,213,100,.45)";cx.lineWidth=2;cx.beginPath();cx.arc(x,y-h-hh,br*1.4,0,6.283);cx.stroke();}
}
function drawParticles(dt){
  for(const q of pool){if(!q.a)continue;q.life-=dt;if(q.life<=0){q.a=false;continue;}q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.985;cx.globalAlpha=Math.min(1,q.life/q.max*1.4);cx.fillStyle=q.c;cx.beginPath();cx.arc(q.x,q.y,q.r,0,6.283);cx.fill();}
  cx.globalAlpha=1;
}
function drawMeteor(dt){
  if(!meteor)return;meteor.x+=meteor.vx*dt;meteor.y+=meteor.vy*dt;meteor.life-=dt;
  if(meteor.x<-80||meteor.x>W+80||meteor.life<=0){meteor=null;return;}
  cx.save();cx.translate(meteor.x,meteor.y);cx.rotate(Math.atan2(meteor.vy,meteor.vx));
  const gr=cx.createLinearGradient(-70,0,15,0);gr.addColorStop(0,"rgba(255,180,70,0)");gr.addColorStop(1,"rgba(255,175,55,.65)");
  cx.strokeStyle=gr;cx.lineWidth=10;cx.beginPath();cx.moveTo(-70,0);cx.lineTo(0,0);cx.stroke();cx.restore();
  icon("comet","#ffb94e",meteor.x,meteor.y,42);
}
export function frame(t){
  const S=G.S;if(!S||!cx)return false;const minGap=1000/quality.fps-2;if(t-lastDraw<minGap)return false;
  const dt=Math.min(.05,(t-(lastT||t))/1000);lastT=t;lastDraw=t;
  drawSky(S,t);drawGround(S,t);
  const Z=S.zones[view.zone];
  for(let s=0;s<=2*GRID-2;s++)for(let gx=0;gx<GRID;gx++){const gy=s-gx;if(gy<0||gy>=GRID)continue;const pi=gx+gy*GRID;if(Z.plots[pi])drawBuilding(S,pi,Z.plots[pi],t,dt);}
  drawParticles(dt);drawMeteor(dt);
  if(view.fade>0){cx.fillStyle="rgba(255,255,255,"+Math.min(1,view.fade)+")";cx.fillRect(0,0,W,H);view.fade=Math.max(0,view.fade-dt*4);}
  return true;
}
export function pick(x,y){
  if(meteor&&Math.hypot(x-meteor.x,y-meteor.y)<48)return{type:"meteor"};
  const Z=G.S.zones[view.zone];
  for(let s=2*GRID-2;s>=0;s--)for(let gx=GRID-1;gx>=0;gx--){const gy=s-gx;if(gy<0||gy>=GRID)continue;const pi=gx+gy*GRID,p=Z.plots[pi],g=geo(pi,p);
    if(p){if(x>=g.x-g.hw&&x<=g.x+g.hw&&y>=g.y-g.hh-g.h-tw*.22&&y<=g.y+g.hh)return{type:"plot",pi};}
    else if(Math.abs(x-g.x)/(tw/2)+Math.abs(y-g.y)/(th/2)<=1)return{type:"plot",pi};
  }
  return null;
}
export function plotScreen(pi){const g=geo(pi,G.S.zones[view.zone].plots[pi]);return{x:g.x,y:g.y-g.h};}
export function size(){return{W,H,tw};}
