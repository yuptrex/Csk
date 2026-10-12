/* ============ SHARED DATA ============ */
const MW=4800,MH=3200,R=18,TICK=1/60,WIN=15,RESP=5;
const WP={pistol:{n:'Pistol',rate:.28,dmg:22,spd:760,pel:1,spr:.02,mag:12,rel:1.1,life:1.7,len:16},
smg:{n:'SMG',rate:.065,dmg:14,spd:900,pel:1,spr:.07,mag:40,rel:1.2,life:1.6,len:20},
shotgun:{n:'Shotgun',rate:.8,dmg:13,spd:700,pel:7,spr:.26,mag:6,rel:1.9,life:.8,len:22},
rifle:{n:'Rifle',rate:.55,dmg:60,spd:1300,pel:1,spr:0,mag:5,rel:2,life:1.7,len:28},
blaster:{n:'Blaster',rate:.22,dmg:66,spd:900,pel:1,spr:.015,mag:18,rel:1,life:1.7,len:24}}; // player-only starter: about 3x a pistol
const BASE1=[[1050,650,300,40],[1050,910,300,40],[400,300,40,360],[400,1000,40,300],[1960,300,40,360],[1960,940,40,360],[700,200,300,40],[1400,1360,300,40],[700,1360,300,40],[1400,200,300,40],[250,760,160,80],[1990,760,160,80],[1150,300,100,100],[1150,1200,100,100]];
const BASE2=[[300,260,380,40],[300,260,40,300],[900,200,40,300],[1100,500,300,40],[700,800,300,40],[1300,800,40,300],[600,1200,300,40],[1000,1250,40,250],[1700,400,260,40],[1700,400,40,260],[1700,1100,300,40],[1900,700,40,300],[250,1000,100,100],[1500,1350,100,100],[1500,150,200,40]];
const PKB1=[[1200,800],[300,200],[2100,200],[300,1400],[2100,1400],[1200,150],[1200,1450],[700,800],[1700,800]],CHB1=[[600,450],[1800,1200],[900,1250]];
const PKB2=[[500,450],[1000,350],[1500,600],[800,1000],[1200,1300],[300,1400],[1800,900],[1950,300],[600,700]],CHB2=[[1000,700],[1500,1000],[400,900]];
const WALLS=[],PKP=[],CHP=[],PKTY=[],DEC=[],PAT=[],CSP=[],ZN=[];let LV=0,SEED=1337;
const SWR=38,RV0=54,PS=.72; // RV0 = starting reserve rounds, PS = pickup draw scale // a gun pad can be used from R+SWR away
const BL={pistol:.1,smg:.035,shotgun:0,rifle:.35,blaster:.1},TC=60; // BL = spread bloom per shot, TC = coin cost of a sentry turret
const PKT=['hp','hp','shield','speed','smg','shotgun','rifle'];
const PKC={ammo:'#ffe066',hp:'#5fd37a',shield:'#59b8ff',speed:'#ffd24a',smg:'#ff9a4a',shotgun:'#ff5d4a',rifle:'#c58bff',kit:'#4ae0c0'};
const BOT_DMG=.25; // bot damage multiplier (1 = same as players)
const UC=[15,30,50,75,105],newUp=()=>Object.fromEntries(Object.keys(WP).map(k=>[k,[0,0,0,0]]));
const eff=p=>{const W=WP[p.w],u=p.up[p.w];return{dmg:W.dmg*(1+.2*u[0]),rate:W.rate*(1-.09*u[1]),mag:W.mag+Math.round(W.mag*.3*u[2]),rel:W.rel*(1-.12*u[3])}};
const rnd=a=>a[Math.random()*a.length|0],cl=(v,a,b)=>Math.max(a,Math.min(b,v));
function push(p){for(const[x,y,w,h]of WALLS){const cx=cl(p.x,x,x+w),cy=cl(p.y,y,y+h),dx=p.x-cx,dy=p.y-cy,d=Math.hypot(dx,dy);
 if(d<R){if(!d)p.x+=R;else{p.x=cx+dx/d*R;p.y=cy+dy/d*R}}}p.x=cl(p.x,R,MW-R);p.y=cl(p.y,R,MH-R)}
const inWall=(x,y)=>WALLS.some(([a,b,w,h])=>x>a&&x<a+w&&y>b&&y<b+h);
const rng=()=>{SEED=SEED+0x6D2B79F5|0;let t=Math.imul(SEED^SEED>>>15,1|SEED);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
function setLevel(n){LV=n;SEED=n==1?1337:9001;for(const a of[WALLS,PKP,CHP,PKTY,DEC,PAT,CSP,ZN])a.length=0;
 const BS=n==2?BASE2:BASE1,PB=n==2?PKB2:PKB1,CB=n==2?CHB2:CHB1;
 for(const qx of[0,1])for(const qy of[0,1])for(const[x,y,w,h]of BS)WALLS.push([qx?4800-x-w:x,qy?3200-y-h:y,w,h]);
 if(n==2)WALLS.push([2100,1300,240,40],[2460,1300,240,40],[2100,1860,240,40],[2460,1860,240,40],[2100,1340,40,200],[2100,1660,40,200],[2660,1340,40,200],[2660,1660,40,200]);
 else WALLS.push([2200,1450,170,30],[2430,1450,170,30],[2200,1720,170,30],[2430,1720,170,30],[2200,1450,30,110],[2200,1640,30,110],[2570,1450,30,110],[2570,1640,30,110]);
 CHP.push([2400,1600]);
 for(const qx of[0,1])for(const qy of[0,1]){for(const[x,y]of PB)PKP.push([qx?4800-x:x,qy?3200-y:y]);for(const[x,y]of CB)CHP.push([qx?4800-x:x,qy?3200-y:y])}
 ZN.push(...(n==2?[['OUTER RING',1200,800],['SALT FLATS',3600,800],['BONE YARD',1200,2400],['IRON GATE',3600,2400],['THE KEEP',2400,1250]]:[['DUST BOWL',1200,800],['GREEN ROW',3600,800],['STEEL YARD',1200,2400],['THE PIT',3600,2400],['PLAZA',2400,1100]]));
 for(let i=0;i<650;i++){const x=rng()*MW,y=rng()*MH,k=rng()*6|0,r=rng()*6.28,sc=.7+rng()*.8;if(!inWall(x,y))DEC.push({x,y,k,r,s:sc})}
 for(let i=0;i<70;i++)PAT.push({x:rng()*MW,y:rng()*MH,r:220+rng()*380,k:rng()*3|0});
 PKP.forEach((_,i)=>PKTY.push(['hp','smg','shield','shotgun','speed','rifle','hp','shield','smg'][i%9]));
 for(let i=0;i<30;i++){const ax=150+rng()*(MW-300),ay=150+rng()*(MH-300);for(let j=0;j<6;j++){const x=ax+(rng()-.5)*120,y=ay+(rng()-.5)*120;if(!inWall(x,y))CSP.push([x|0,y|0,1+(rng()*2|0)])}}
 for(let i=0;i<50;i++){const x=100+rng()*(MW-200),y=100+rng()*(MH-200);if(!inWall(x,y))CSP.push([x|0,y|0,i%9==0?10:1+(rng()*2|0)])}}
setLevel(1);

/* ============ SIMULATION (runs only on the host / solo player) ============ */
class Sim{
 constructor(onEv){this.p={};this.b=[];this.bid=0;this.fb=0;this.win=null;this.wt=0;this.onEv=onEv;this.cn=[];this.cid=0;this.ct=0;this.tr=[];this.bm=[];this.bmid=0;this.tid=0;this.ch=[];
  this.cs=CSP.map(()=>0);CSP.forEach(([x,y,v],i)=>this.cn.push({id:++this.cid,x,y,v,l:1e9,fx:i}));
  this.pk=PKP.map(([x,y],i)=>({i,x,y,t:PKTY[i],t0:PKTY[i],on:1,rt:0}));this.cr=[];this.crid=0;this.cuid=0}
 add(id,name,hue,bot){const p={id,name,hue,bot,x:0,y:0,vx:0,vy:0,hp:100,sh:0,w:'pistol',am:12,rel:0,cd:0,dc:0,dt:0,sp:0,inv:0,al:1,rs:0,k:0,d:0,ks:0,c:0,
  in:{dx:0,dy:0,a:0,f:0,d:0,r:0},ai:{t:0,s:1,px:0,py:0,sk:0,un:0,ud:0},dn:2,dg:0,bl:0,kt:0,td:0,rv:0,aq:{},at:2};this.p[id]=p;this.spawn(p)}
 spawn(p){for(let i=0;i<40;i++){p.x=R+Math.random()*(MW-2*R);p.y=R+Math.random()*(MH-2*R);
  if(inWall(p.x,p.y))continue;const q={x:p.x,y:p.y};push(q);if(Math.hypot(q.x-p.x,q.y-p.y)>1)continue;
  if(!Object.values(this.p).some(o=>o!==p&&o.al&&Math.hypot(o.x-p.x,o.y-p.y)<350))break}
  Object.assign(p,{rv:p.bot?0:RV0,hp:100,sh:0,w:p.bot?'pistol':'blaster',am:p.bot?12:18,rel:0,cd:0,sp:0,inv:1.5,al:1,vx:0,vy:0,up:newUp(),kb:'',kw:'',dn:2,dc:0,dg:0,bl:0,kt:0,td:0,mk:0,mc:0});this.ev({k:'spawn',x:p.x,y:p.y,h:p.hue,id:p.id})}
 ev(e){this.onEv(e)}
 flushAcc(p){const a=p.aq;if(!a)return;let any=0;for(const g in a)if(a[g][0]||a[g][1])any=1;if(!any)return;p.aq={};this.ev({k:'acc',id:p.id,a})}
 spawnAmmo(){if(this.pk.filter(k=>k.t=='ammo').length>=16)return;const hs=Object.values(this.p).filter(q=>q.al&&!q.bot);
  for(let n=0;n<30;n++){let x,y;if(hs.length&&Math.random()<.5){const q=rnd(hs),a=Math.random()*6.283,r=280+Math.random()*620;x=q.x+Math.cos(a)*r;y=q.y+Math.sin(a)*r}else{x=Math.random()*MW;y=Math.random()*MH}
   x=cl(x,60,MW-60);y=cl(y,60,MH-60);if(inWall(x,y))continue;this.pk.push({i:-1,x,y,t:'ammo',on:1,rt:0,d:1,l:40});return}}
 los(a,b){for(let i=1;i<14;i++){const t=i/14;if(inWall(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return 0}return 1}
 // ---- loot choice: score every pickup by how much THIS bot needs it, divided into distance ----
 lootFor(p){let bt=null,bs=1e9;
  const need=k=>k.t=='ammo'?0:k.t=='hp'?(p.hp<70?1.8:0):k.t=='shield'?(p.sh<25?1.3:0):k.t=='kit'?(p.kt<2?1.3:0):k.t=='speed'?.5:k.t==p.w?0:(p.w=='pistol'||p.w=='blaster')?1.5:k.t=='rifle'?1:.2;
  for(const k of this.pk){if(!k.on)continue;const n=need(k);if(n<=0)continue;const d=Math.hypot(k.x-p.x,k.y-p.y)/n;if(d<bs){bs=d;bt=k}}
  for(const q of this.ch)if(q.on){const d=Math.hypot(q.x-p.x,q.y-p.y)/1.3;if(d<bs){bs=d;bt=q}}
  for(const q of this.cr){let n=0;for(const k of q.it)n=Math.max(n,k.t=='coin'?1.2:need(k));if(n<=0)continue;const d=Math.hypot(q.x-p.x,q.y-p.y)/n;if(d<bs){bs=d;bt=q}}
  for(const q of this.cn){const d=Math.hypot(q.x-p.x,q.y-p.y)/(q.v>=10?2:.9)-60;if(d<bs){bs=d;bt=q}}
  return bt}
 ai(p,dt){const a=p.ai,i=p.in,P=Object.values(this.p);let tg=null,bs=1e9;
  for(const o of P){if(o===p||!o.al)continue;const s=Math.hypot(o.x-p.x,o.y-p.y)*(o.hp+o.sh<35?.75:1);if(s<bs){bs=s;tg=o}}
  {let tb=tg?Math.hypot(tg.x-p.x,tg.y-p.y):1e9;for(const t of this.tr){if(t.o==p.id)continue;const d=Math.hypot(t.x-p.x,t.y-p.y);if(d<Math.min(tb,520)&&this.los(p,t)){tb=d;tg={x:t.x,y:t.y,vx:0,vy:0,hp:t.hp,sh:0,al:1}}}}
  i.f=0;i.d=0;i.r=0;i.t=0;i.u=Math.random()<.03?(Math.random()*4|0)+1:0;a.t-=dt;if(a.t<=0){a.t=.4+Math.random();a.s=Math.random()<.5?1:-1}
  // anti-stuck: if it tried to move but barely did for half a second, break off in a random direction
  a.sk-=dt;if(a.sk<=0){a.sk=.5;if(Math.hypot(p.x-a.px,p.y-a.py)<14&&Math.abs(i.dx)+Math.abs(i.dy)>0){a.un=.7;a.ud=Math.random()*6.28}a.px=p.x;a.py=p.y}
  const E=WP[p.w];let th=0;for(const o of P)if(o!==p&&o.al&&Math.hypot(o.x-p.x,o.y-p.y)<520&&this.los(p,o))th++;
  const bd=tg?Math.hypot(tg.x-p.x,tg.y-p.y):1e9,vis=tg&&this.los(p,tg),low=p.hp+p.sh*.6<42||(th>=3&&p.hp<70);let mx=0,my=0;
  // aim: lead the target by bullet travel time; sloppier at range
  if(tg){const sp=E.spd;let tt=bd/sp;tt=Math.hypot(tg.x+tg.vx*tt-p.x,tg.y+tg.vy*tt-p.y)/sp;i.a=Math.atan2(tg.y+tg.vy*tt*.85-p.y,tg.x+tg.vx*tt*.85-p.x)+(Math.random()-.5)*(.09+bd/4500)}
  const ang=tg?Math.atan2(tg.y-p.y,tg.x-p.x):0,cs=Math.cos(ang),sn=Math.sin(ang);
  if(low&&tg){ // ESCAPE: head for the nearest medkit/shield, else run away strafing; dash out of fire, drop a turret as a rear guard
   const k=this.pk.filter(q=>q.on&&(q.t=='hp'||q.t=='shield')).sort((u,v)=>Math.hypot(u.x-p.x,u.y-p.y)-Math.hypot(v.x-p.x,v.y-p.y))[0];
   if(k&&Math.hypot(k.x-p.x,k.y-p.y)<1100){const g=Math.atan2(k.y-p.y,k.x-p.x);mx=Math.cos(g);my=Math.sin(g)}else{mx=-cs-sn*a.s*.6;my=-sn+cs*a.s*.6}
   if(vis&&bd<420&&p.dn>0&&Math.random()<.06)i.d=1;
   if(vis&&bd<480&&(p.kt>0||p.c>=TC)&&p.td<=0&&Math.random()<.05)i.t=1}
  else if(tg&&bd<900){ // FIGHT
   if(bd<260){mx=-cs;my=-sn}else if(bd>(p.w=='shotgun'?340:560)){mx=cs;my=sn}
   mx-=sn*a.s*.8;my+=cs*a.s*.8;
   if(vis&&bd<560&&p.td<=0&&(p.kt>0||p.c>=TC+30)&&Math.random()<.004)i.t=1;
   if(vis&&bd<500&&p.dn>1&&Math.random()<.004)i.d=1}
  else{const t=this.lootFor(p);if(t){const g=Math.atan2(t.y-p.y,t.x-p.x);mx=Math.cos(g);my=Math.sin(g)}else if(tg){mx=cs;my=sn}}
  if(a.un>0){a.un-=dt;mx=Math.cos(a.ud);my=Math.sin(a.ud)}
  const l0=Math.hypot(mx,my);if(l0){mx/=l0;my/=l0;if(inWall(p.x+mx*54,p.y+my*54)){const sd=a.s;for(const r of[.8*sd,-.8*sd,1.57*sd,-1.57*sd,2.4*sd,-2.4*sd]){const c=Math.cos(r),s=Math.sin(r),rx=mx*c-my*s,ry=mx*s+my*c;if(!inWall(p.x+rx*54,p.y+ry*54)){mx=rx;my=ry;break}}}}
  i.dx=mx;i.dy=my;if(!tg)return;
  i.f=vis&&bd<(p.w=='rifle'?1100:p.w=='shotgun'?450:800)?1:0;
  if(!vis||bd>700)i.r=p.am<E.mag*.5?1:0}
 // ---- DEFENCE: sentry turrets. Auto-target enemies (never the owner) with line of sight, lead their movement, can be shot down ----
 deploy(p){if(p.td>0||(p.kt<1&&p.c<TC))return;const mine=this.tr.filter(t=>t.o==p.id);if(mine.length>=2)this.tr.splice(this.tr.indexOf(mine[0]),1);
  let x=p.x+Math.cos(p.in.a)*52,y=p.y+Math.sin(p.in.a)*52;if(inWall(x,y)||x<20||y<20||x>MW-20||y>MH-20){x=p.x;y=p.y}
  if(p.kt>0)p.kt--;else p.c-=TC;p.td=6;this.tr.push({id:++this.tid,o:p.id,x,y,a:p.in.a,hp:120,mh:120,l:30,cd:.4,h:p.hue});this.ev({k:'tdep',x,y,h:p.hue,id:p.id})}
 ropeAct(p){if(!p.al)return;if(p.rp){p.rp=null;p.rc=1.2;return}if(p.rc>0)return;p.rp={x:p.x,y:p.y,a:p.in.a,st:0,d:0,t:0,tg:null};this.ev({k:'rope',x:p.x,y:p.y,h:p.hue,id:p.id})}
 ropeEnd(p,cd){p.rp=null;p.rc=cd}
 ropes(dt){for(const p of Object.values(this.p)){p.rc=Math.max(0,(p.rc||0)-dt);const r=p.rp;if(!r)continue;if(!p.al){p.rp=null;continue}r.t+=dt;
  if(r.st==0){const n=Math.ceil(1700*dt/16),sl=1700*dt/n;
   for(let i=0;i<n&&r.st==0;i++){r.x+=Math.cos(r.a)*sl;r.y+=Math.sin(r.a)*sl;r.d+=sl;
    if(r.x<0||r.y<0||r.x>MW||r.y>MH||inWall(r.x,r.y)){r.st=1;r.t=0;r.x=cl(r.x,0,MW);r.y=cl(r.y,0,MH);this.ev({k:'rhit',x:r.x,y:r.y,h:p.hue});break}
    for(const q of Object.values(this.p)){if(!q.al||q.id==p.id||Math.hypot(q.x-r.x,q.y-r.y)>R+6)continue;r.st=2;r.t=0;r.tg=q.id;this.hurt(q,20,p);this.ev({k:'rhit',x:q.x,y:q.y,h:q.hue});break}
    if(r.st==0)for(const t of this.tr){if(t.o==p.id||Math.hypot(t.x-r.x,t.y-r.y)>26)continue;t.hp-=30;t.lb=p.id;r.st=3;r.t=0;this.ev({k:'rhit',x:t.x,y:t.y,h:p.hue});break}
    if(r.st==0&&r.d>=560){r.st=3;r.t=0}}}
  else if(r.st==1){const dx=r.x-p.x,dy=r.y-p.y,d=Math.hypot(dx,dy);if(d<R+8||r.t>1.2){this.ropeEnd(p,1.5);continue}
   const s=Math.min(d,950*dt),ox=p.x,oy=p.y;p.x+=dx/d*s;p.y+=dy/d*s;push(p);if(Math.hypot(p.x-ox,p.y-oy)<s*.25)this.ropeEnd(p,1.5)}
  else if(r.st==2){const q=this.p[r.tg];if(!q||!q.al||r.t>1.2){this.ropeEnd(p,1.5);continue}
   const dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy);if(d<2*R+4){this.ropeEnd(p,1.5);continue}
   const s=Math.min(d,800*dt);q.x+=dx/d*s;q.y+=dy/d*s;push(q);r.x=q.x;r.y=q.y}
  else{const dx=p.x-r.x,dy=p.y-r.y,d=Math.hypot(dx,dy);if(d<20||r.t>.5){this.ropeEnd(p,.8);continue}const s=Math.min(d,2500*dt);r.x+=dx/d*s;r.y+=dy/d*s}}}
 bombAct(p){if(!p.al)return;const m=this.bm.find(b=>b.o==p.id&&b.st==0);if(m){this.boom(m,p);return}
  this.bm.push({id:++this.bmid,o:p.id,x:p.x,y:p.y,st:0,l:0,h:p.hue});this.ev({k:'bplace',x:p.x,y:p.y,h:p.hue,id:p.id})}
 boom(b,by){const i=this.bm.indexOf(b);if(i>=0)this.bm.splice(i,1);const RB=150;
  for(const q of Object.values(this.p)){if(!q.al)continue;const d=Math.hypot(q.x-b.x,q.y-b.y);if(d>=RB||!this.los(b,q))continue;this.hurt(q,Math.max(1,Math.round(90*(1-d/RB)*(q.id==b.o?.5:1))),by)}
  for(const t of this.tr){const d=Math.hypot(t.x-b.x,t.y-b.y);if(d<RB&&this.los(b,t)){t.hp-=Math.round(120*(1-d/RB*.5));t.lb=b.o}}
  this.ev({k:'boom',x:b.x,y:b.y,h:b.h,id:b.o})}
 bombs(dt){for(const b of this.bm.slice()){if(b.st){b.l-=dt;if(b.l<=0)this.bm.splice(this.bm.indexOf(b),1);continue}
  const p=this.p[b.o],n=p&&p.in||{},vx=n.vx||520,vy=n.vy||320,kx=n.kx!=null?n.kx:p&&p.x,ky=n.ky!=null?n.ky:p&&p.y;
  if(!p||!p.al||Math.abs(b.x-kx)>vx||Math.abs(b.y-ky)>vy){b.st=1;b.l=4;this.ev({k:'bdud',x:b.x,y:b.y,id:b.o})}}}
 turrets(dt){for(const t of this.tr){t.l-=dt;t.cd-=dt;let tg=null,bd=700;
   for(const o of Object.values(this.p)){if(!o.al||o.id==t.o||o.inv>0)continue;const d=Math.hypot(o.x-t.x,o.y-t.y);if(d<bd&&this.los(t,o)){bd=d;tg=o}}
   if(tg){const sp=820,tt=bd/sp,ta=Math.atan2(tg.y+tg.vy*tt-t.y,tg.x+tg.vx*tt-t.x),df=((ta-t.a+Math.PI)%6.2832+6.2832)%6.2832-Math.PI;t.a+=cl(df,-6*dt,6*dt);
    if(t.cd<=0&&Math.abs(df)<.12){t.cd=.17;const a=t.a+(Math.random()-.5)*.06,ow=this.p[t.o];this.b.push({id:++this.bid,x:t.x+Math.cos(a)*26,y:t.y+Math.sin(a)*26,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,o:t.o,d:9*(ow&&ow.bot?.5:1),l:1.05,h:t.h,tr:1});this.ev({k:'tshot',x:t.x,y:t.y,a,h:t.h})}}
   else t.a+=dt*.8}
  this.tr=this.tr.filter(t=>{if(t.l>0&&t.hp>0)return 1;const k=this.p[t.lb];if(t.hp<=0&&k){k.c+=15;this.ev({k:'coin',id:k.id,x:k.x,y:k.y,v:15})}this.ev({k:'tdie',x:t.x,y:t.y,h:t.h});return 0})}
 // ---- LOOT: a dead player drops their gun, some coins, and maybe a medkit / shield / turret kit ----
 drop(p){const lose=Math.min(60,p.c*.15|0);p.c-=lose;const it=[],U=()=>++this.cuid;
  if(lose>=10)it.push({u:U(),t:'coin',v:lose});
  if(p.w=='smg'||p.w=='shotgun'||p.w=='rifle'){const o={u:U(),t:p.w};if(!p.bot){o.am=p.am;o.rv=p.rv}it.push(o)}
  if(Math.random()<.6)it.push({u:U(),t:'ammo'});
  if(Math.random()<.35)it.push({u:U(),t:'hp'});if(Math.random()<.3)it.push({u:U(),t:'kit'});if(Math.random()<.2)it.push({u:U(),t:'shield'});
  if(!it.length)return;if(this.cr.length>=24)this.cr.shift();this.cr.push({id:++this.crid,x:p.x,y:p.y,l:50,it})}
 // ---- CRATES: items stay hidden inside; a player in contact opens it and takes one item at a time ----
 takeCr(p,o){if(!p.al||!o)return;const c=this.cr.find(q=>q.id==o.c);if(!c||Math.hypot(c.x-p.x,c.y-p.y)>R+SWR+30)return;const k=c.it.find(q=>q.u==o.j);if(!k)return;
  if(this.crGive(p,c,k)&&!c.it.length)c.l=Math.min(c.l,.6)}
 crGive(p,c,k){const rm=()=>{const i=c.it.indexOf(k);if(i>=0)c.it.splice(i,1)},pk=(t,n,sw)=>this.ev({k:'pick',x:c.x,y:c.y,t,id:p.id,n:n||0,sw}),t=k.t,isG=w=>w=='smg'||w=='shotgun'||w=='rifle';
  if(t=='coin'){p.c+=k.v;this.ev({k:'coin',id:p.id,x:p.x,y:p.y,v:k.v});rm();return 1}
  if(t=='hp'){if(p.hp>=100){if(p.bot||(p.mk|0)>=3)return 0;p.mk=(p.mk|0)+1;this.ev({k:'pick',x:c.x,y:c.y,t:'hp',id:p.id,st:1});rm();return 1}p.hp=Math.min(100,p.hp+40)}
  else if(t=='shield'){if(p.sh>=50)return 0;p.sh=Math.min(50,p.sh+50)}
  else if(t=='kit'){if(p.kt>=3)return 0;p.kt++}
  else if(t=='ammo'){if(p.bot)return 0;const mg=eff(p).mag,n=Math.min(Math.round(mg*1.2),mg*4-p.rv);if(n<=0)return 0;p.rv+=n;pk(t,n);rm();return 1}
  else{
   if(p.bot){if(p.w==t)return 0;p.w=t;p.am=eff(p).mag;p.rel=0;pk(t);rm();return 1}
   const w0=p.w,a0=p.am,r0=p.rv;p.w=t;const mg=eff(p).mag,ka=k.am==null?mg:k.am,kr=k.rv==null?mg*2:k.rv;
   if(w0==t&&ka+kr<=a0+r0){p.w=w0;return 0}
   p.am=Math.min(ka,mg);p.rv=kr;p.rel=0;
   if(isG(w0)){k.t=w0;k.am=a0;k.rv=r0;pk(t,0,w0)}else{pk(t);rm()}return 1}
  pk(t);rm();return 1}
 crStep(dt){this.cr=this.cr.filter(c=>c.it.length>0&&(c.l-=dt)>0);
  for(const p of Object.values(this.p)){if(!p.bot||!p.al)continue;for(const c of this.cr){if(Math.hypot(c.x-p.x,c.y-p.y)>R+26)continue;for(const k of c.it.slice())this.crGive(p,c,k)}}}
 hurt(p,d,by){if(!p.al||p.inv>0||this.win)return;const s=Math.min(p.sh,d);p.sh-=s;p.hp-=d-s;this.ev({k:'hit',x:p.x,y:p.y,h:p.hue,id:p.id,by:by.id,d:Math.round(d)});
  if(p.hp<=0){const ps=p.ks;p.al=0;p.rs=RESP;p.kb=by.id;p.kw=by.w;p.d++;p.ks=0;let fb=0;if(by!==p){by.k++;by.ks++;if(!this.fb){this.fb=1;fb=1}}
   this.drop(p);this.flushAcc(p);for(let n=0;n<4;n++)this.cn.push({id:++this.cid,x:cl(p.x+(Math.random()-.5)*60,30,MW-30),y:cl(p.y+(Math.random()-.5)*60,30,MH-30),v:3+Math.min(by.ks,3),l:25});
   this.ev({k:'kill',x:p.x,y:p.y,h:p.hue,ah:by.hue,a:by.name,b:p.name,w:by.w,ai:by.id,bi:p.id,ks:by.ks,ps:ps,fb:fb,mp:by!==p&&by.k==WIN-1?1:0});
   if(by.k>=WIN&&!this.win){this.win={name:by.name,hue:by.hue,id:by.id};this.wt=5;for(const q of Object.values(this.p))this.flushAcc(q);this.ev({k:'win',id:by.id})}}}
 step(dt){
  if(this.win)return;
  for(const p of Object.values(this.p)){
   if(!p.al){p.rs-=dt;if(p.rs<=0)this.spawn(p);continue}
   if(p.bot)this.ai(p,dt);const i=p.in,W=WP[p.w],E=eff(p);
   if(i.u){const s=i.u-1,u=p.up[p.w];if(s>=0&&s<4&&u[s]<5&&p.c>=UC[u[s]]){p.c-=UC[u[s]];u[s]++;if(s==2)p.am=eff(p).mag;this.ev({k:'upg',id:p.id,x:p.x,y:p.y,s,l:u[s]})}i.u=0}
   if(i.o&&i.o.length){const oq=i.o;i.o=[];for(const o of oq)this.takeCr(p,o)}
   if(!p.bot){p.at-=dt;if(p.at<=0){p.at=3;this.flushAcc(p)}}p.inv-=dt;p.sp-=dt;p.td-=dt;p.cd-=dt;p.dg-=dt;p.bl=Math.max(0,p.bl-dt*1.8);if(p.dn<2){p.dc-=dt;if(p.dc<=0){p.dn++;p.dc=1.6}}if(i.t){i.t=0;this.deploy(p)}if(i.b){i.b=0;this.bombAct(p)}if(i.q){i.q=0;this.ropeAct(p)}
   if(i.d&&p.dn>0&&p.dg<=0){if(p.dn==2)p.dc=1.6;p.dn--;p.dg=.25;p.inv=Math.max(p.inv,.18);p.dt=.14;const l=Math.hypot(i.dx,i.dy),ux=l?i.dx/l:Math.cos(i.a),uy=l?i.dy/l:Math.sin(i.a);p.vx=ux*820;p.vy=uy*820;this.ev({k:'dash',x:p.x,y:p.y,h:p.hue,id:p.id})}
   if(p.dt>0)p.dt-=dt;else{const sp=250*(p.sp>0?1.4:1)*(p.hp<30?1.15:1),f=Math.min(1,12*dt);p.vx+=(i.dx*sp-p.vx)*f;p.vy+=(i.dy*sp-p.vy)*f}
   p.x+=p.vx*dt;p.y+=p.vy*dt;push(p);
   if(p.rel>0){p.rel-=dt;if(p.rel<=0){if(p.bot)p.am=E.mag;else{const n=Math.max(0,Math.min(E.mag-p.am,p.rv));p.am+=n;p.rv-=n}}}
   else if((p.bot||p.rv>0)&&((i.r&&p.am<E.mag)||p.am<=0)){p.rel=E.rel;this.ev({k:'rel',x:p.x,y:p.y,id:p.id,w:p.w,r:E.rel})}
   if(i.f&&p.cd<=0&&p.am>0&&p.rel<=0){p.cd=E.rate;p.am--;const shT=p.bot?null:{g:p.w,h:0};if(shT)(p.aq[p.w]||(p.aq[p.w]=[0,0]))[0]++;
    const SPR=W.spr*(1+p.bl*1.5)*(Math.hypot(p.vx,p.vy)<40?.6:1);for(let n=0;n<W.pel;n++){const a=i.a+(Math.random()-.5)*SPR*2;this.b.push({id:++this.bid,x:p.x+Math.cos(i.a)*(R+W.len),y:p.y+Math.sin(i.a)*(R+W.len),vx:Math.cos(a)*W.spd,vy:Math.sin(a)*W.spd,o:p.id,d:E.dmg*(p.bot?(LV==2?.4:BOT_DMG):1),l:W.life,h:p.hue,sh:shT})}
    p.bl=Math.min(1,p.bl+(BL[p.w]||.08));p.vx-=Math.cos(i.a)*60;p.vy-=Math.sin(i.a)*60;this.ev({k:'shot',id:p.id,x:p.x,y:p.y,a:i.a,w:p.w,h:p.hue})}
   if(!p.bot&&p.al&&(p.mk|0)>0){p.mc=(p.mc||0)-dt;if(p.hp<=30&&p.mc<=0){p.mk--;p.mc=.7;p.hp=Math.min(100,p.hp+40);this.ev({k:'pick',x:p.x,y:p.y,t:'hp',id:p.id,au:1})}}const gw=!p.bot&&i.g&&!p.gl;p.gl=i.g?1:0;let sw=null;
   if(gw){let bd=1e9;for(const k of this.pk){if(!k.on||!(k.t=='smg'||k.t=='shotgun'||k.t=='rifle'))continue;const d=Math.hypot(k.x-p.x,k.y-p.y);if(d<=R+SWR&&d<bd){bd=d;sw=k}}}
   for(const k of this.pk){if(!k.on)continue;let old='',en=0,oa=0,orv=0,stp=0;
    if(!p.bot&&(k.t=='smg'||k.t=='shotgun'||k.t=='rifle')){if(k!==sw)continue}else if(Math.hypot(k.x-p.x,k.y-p.y)>R+14)continue;
    if(k.t=='hp'){if(p.hp>=100){if(p.bot||(p.mk|0)>=3)continue;p.mk=(p.mk|0)+1;stp=1}else p.hp=Math.min(100,p.hp+(k.d?40:100))}else if(k.t=='shield'){if(p.sh>=50)continue;p.sh=Math.min(50,p.sh+50)}else if(k.t=='kit'){if(p.kt>=3)continue;p.kt++}
    else if(k.t=='ammo'){if(p.bot)continue;const mg=eff(p).mag,n=Math.min(Math.round(mg*1.2),mg*4-p.rv);if(n<=0)continue;p.rv+=n;en=n}
    else if(k.t=='speed')p.sp=8;else if(p.bot){if(p.w==k.t&&p.am>=eff(p).mag*.8&&!k.d)continue;p.w=k.t;p.am=eff(p).mag;p.rel=0}
    else{const w0=p.w,a0=p.am,r0=p.rv;p.w=k.t;const mg=eff(p).mag,ka=k.am==null?mg:k.am,kr=k.rv==null?mg*2:k.rv;if(w0==k.t&&ka+kr<=a0+r0){continue}old=w0;oa=a0;orv=r0;p.am=Math.min(ka,mg);p.rv=kr;p.rel=0}
    if(!p.bot&&(old=='smg'||old=='shotgun'||old=='rifle')){const nt=k.t;k.t=old;k.am=oa;k.rv=orv;if(k.d)k.l=Math.max(k.l,20);this.ev({k:'pick',x:k.x,y:k.y,t:nt,id:p.id,sw:old});continue}
    if(k.d)k.l=0;else k.rt=14;k.on=0;this.ev({k:'pick',x:k.x,y:k.y,t:k.t,id:p.id,n:en,st:stp})}}
  this.crStep(dt);
  this.amT=(this.amT||0)-dt;if(this.amT<=0){this.amT=2.5+Math.random()*2;this.spawnAmmo()}
  for(const k of this.pk){if(k.d){k.l-=dt;continue}if(!k.on){k.rt-=dt;if(k.rt<=0){k.on=1;if(k.t0)k.t=k.t0;k.am=k.rv=null}}}this.pk=this.pk.filter(k=>!k.d||k.l>0);
  this.cs.forEach((t,i)=>{if(t>0){this.cs[i]-=dt;if(this.cs[i]<=0)this.cn.push({id:++this.cid,x:CSP[i][0],y:CSP[i][1],v:CSP[i][2],l:1e9,fx:i})}});
  for(const c of this.ch){if(!c.on){c.rt-=dt;if(c.rt<=0)c.on=1;continue}for(const p of Object.values(this.p)){if(!p.al||Math.hypot(p.x-c.x,p.y-c.y)>R+24)continue;const v=25+(Math.random()*20|0);p.c+=v;c.on=0;c.rt=40;if(!p.bot)p.rv=Math.min(eff(p).mag*4,p.rv+Math.round(eff(p).mag*.8));if(Math.random()<.5)p.sh=Math.min(50,p.sh+25);if(Math.random()<.35&&p.kt<3)p.kt++;this.ev({k:'chest',id:p.id,x:c.x,y:c.y,v});
   for(let n=0;n<5;n++)this.cn.push({id:++this.cid,x:c.x+(Math.random()-.5)*90,y:c.y+(Math.random()-.5)*90,v:2,l:20});break}}
  this.cn=this.cn.filter(c=>{c.l-=dt;if(c.l<=0)return 0;let t=null,bd=110;for(const p of Object.values(this.p))if(p.al){const d=Math.hypot(p.x-c.x,p.y-c.y);if(d<bd){bd=d;t=p}}
   if(t){if(bd<R+8){if(c.fx!=null)this.cs[c.fx]=45;t.c+=c.v;this.ev({k:'coin',id:t.id,x:t.x,y:t.y,v:c.v});return 0}const q=320*dt/bd;c.x+=(t.x-c.x)*q;c.y+=(t.y-c.y)*q}return 1});
  this.turrets(dt);this.bombs(dt);this.ropes(dt);this.b=this.b.filter(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;
   if(b.l<=0||b.x<0||b.y<0||b.x>MW||b.y>MH||inWall(b.x,b.y)){if(b.l>0)this.ev({k:'spark',x:b.x,y:b.y,h:b.h});return 0}
   for(const t of this.tr){if(t.o==b.o||t.hp<=0)continue;const sx=b.x-b.vx*dt,sy=b.y-b.vy*dt,ex=b.x-sx,ey=b.y-sy,L=ex*ex+ey*ey||1,u=cl(((t.x-sx)*ex+(t.y-sy)*ey)/L,0,1);if(Math.hypot(sx+ex*u-t.x,sy+ey*u-t.y)>24)continue;t.hp-=b.d;t.lb=b.o;this.ev({k:'thit',x:t.x,y:t.y,h:b.h,by:b.o});return 0}for(const p of Object.values(this.p)){if(!p.al||p.id==b.o||Math.hypot(p.x-b.x,p.y-b.y)>R+3)continue;if(b.sh&&!b.sh.h){b.sh.h=1;const o=this.p[b.o];if(o&&o.aq)(o.aq[b.sh.g]||(o.aq[b.sh.g]=[0,0]))[1]++}this.hurt(p,b.d,this.p[b.o]||p);return 0}return 1})}
 snap(){return{p:Object.values(this.p).map(p=>({id:p.id,name:p.name,hue:p.hue,x:p.x|0,y:p.y|0,vx:p.vx|0,vy:p.vy|0,hp:p.hp,sh:p.sh,w:p.w,am:p.am,rel:p.rel,dc:p.dc,dt:p.dt,sp:p.sp,inv:p.inv,al:p.al,k:p.k,d:p.d,c:p.c,ul:p.up[p.w],rs:Math.ceil(Math.max(0,p.rs)),rf:+Math.max(0,p.rs).toFixed(2),kb:p.kb||'',kw:p.kw||'',a:p.in.a,dn:p.dn,bl:+p.bl.toFixed(2),kt:p.kt,mk:p.mk|0,td:Math.max(0,+p.td.toFixed(1)),rc:+(p.rc||0).toFixed(1),rv:p.rv|0,sq:p.sq|0,ia:p.sat?Math.min(999,Math.round(performance.now()-p.sat)):0,pg:p.pg|0})),
  b:this.b.map(b=>({x:b.x|0,y:b.y|0,vx:b.vx|0,vy:b.vy|0,h:b.h,i:b.id,o:b.o,r:b.tr?1:0})),k:this.pk.map(k=>({x:k.x,y:k.y,t:k.t,on:k.on,am:k.am,rv:k.rv})),h:this.ch.map(c=>({x:c.x,y:c.y,on:c.on})),cr:this.cr.map(c=>({id:c.id,x:c.x|0,y:c.y|0,it:c.it.map(i=>({u:i.u,t:i.t,am:i.am,rv:i.rv,v:i.v}))})),n:this.cn.map(c=>({x:c.x|0,y:c.y|0,v:c.v,id:c.id})),w:this.win?{...this.win,t:Math.max(0,this.wt)}:null,t:this.tr.map(t=>({id:t.id,x:t.x|0,y:t.y|0,a:+t.a.toFixed(2),hp:t.hp,mh:t.mh,h:t.h,o:t.o,l:t.l})),rp:Object.values(this.p).filter(p=>p.rp).map(p=>({o:p.id,x:p.rp.x|0,y:p.rp.y|0,s:p.rp.st,h:p.hue,g:p.rp.tg||''})),bm:this.bm.map(b=>({id:b.id,x:b.x|0,y:b.y|0,o:b.o,st:b.st,l:+b.l.toFixed(1),h:b.h})),lv:LV}}
}

