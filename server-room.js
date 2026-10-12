/* server-room.js - the host-side game logic of ONE room, running on the dedicated server (loaded after server-sim.js
   inside a private vm context, so every room has its own level/walls/state).
   It is the same code that used to run inside the host player's browser (hostTick / hostIn / sendDyn / sendWorld in game.js),
   minus the local player: nobody's phone is the host any more, every player is a client with identical latency. */
const MAXH=8,CHEAP={spark:1,shot:1,tshot:1,hit:1,thit:1,rel:1,dash:1,coin:1},
 PF=['id','x','y','vx','vy','a','hp','sh','w','am','rel','dc','dt','sp','inv','al','k','d','c','ul','rf','kb','kw','dn','bl','kt','td','rc','sq','ia','pg','le','rv','mk'];
const nz=v=>v>0?Math.round(v*100)/100:0,nr1=v=>Math.round(v*10)/10,nr3=v=>Math.round(v*1000)/1000;
let evq=[],evc=[],evSeq=0,qSeq=0,wdLast='',wdAt=-1e9,hSend=0,hAcc=0,snap=null,sim=null,resendWd=1;
function packP(p){return[p.id,nr1(p.x),nr1(p.y),Math.round(p.vx||0),Math.round(p.vy||0),nr3(p.a||0),nr1(p.hp),nr1(p.sh),p.w,p.am,nz(p.rel),nz(p.dc),nz(p.dt),nz(p.sp),nz(p.inv),p.al,p.k,p.d,p.c,p.ul,p.rf,p.kb,p.kw,p.dn,p.bl,p.kt,p.td,p.rc,p.sq|0,p.ia|0,p.pg|0,p.le|0,p.rv|0,p.mk|0]}
function onEv(e){e._t=Math.round(performance.now());if(CHEAP[e.k])evc.push(e);else{e._i=++evSeq;evq.push(e)}}
function init(lv){setLevel(lv===2?2:1);sim=new Sim(onEv);snap=sim.snap()}
function humanCount(){return Object.keys(sim.p).length}
function drop(id){if(sim&&sim.p[id])delete sim.p[id]}
function hostIn(m){
 if(!m.id||typeof m.id!='string'||m.id.length>24)return;
 let p=sim.p[m.id];
 if(!p){if(humanCount()>=MAXH)return;sim.add(m.id,String(m.name||'Player').slice(0,12),(+m.hue||0)%360,0);p=sim.p[m.id];p.lastE=0;p.sq=0;p.ea=0}
 const n=m.n|0;if(n&&n<=(p.sq|0))return;
 const prev=p.in||{},ip=m.inp||{},c=(v,a,b)=>Math.max(a,Math.min(b,+v||0));
 let eb=0,eq=0,eu=0;const eo=[];
 if(Array.isArray(m.ed))for(const e of m.ed){if(e&&e.i>(p.lastE|0)){p.lastE=e.i;if(e.k=='b')eb=1;else if(e.k=='q')eq=1;else if(e.k=='u')eu=e.v|0;else if(e.k=='o')eo.push({c:e.c|0,j:e.j|0})}}
 p.in={dx:c(ip.dx,-1,1),dy:c(ip.dy,-1,1),a:+ip.a||0,f:ip.f?1:0,d:ip.d?1:0,r:ip.r?1:0,t:ip.t?1:0,g:ip.g?1:0,
  b:(prev.b||eb)?1:0,q:(prev.q||eq)?1:0,u:prev.u||eu||0,o:(prev.o||[]).concat(eo).slice(-8),vx:+ip.vx>0?c(ip.vx,200,2400):520,vy:+ip.vy>0?c(ip.vy,150,1400):320,kx:isFinite(+ip.kx)&&ip.kx!=null?+ip.kx:p.x,ky:isFinite(+ip.ky)&&ip.ky!=null?+ip.ky:p.y};
 const now=performance.now();p.seen=now;p.sat=now;p.sq=n;p.pg=m.ct|0;p.ea=m.ea|0;p.rtt=Math.max(0,Math.min(5000,+m.rt||0));if(m.name)p.name=String(m.name).slice(0,12)}
function sendDyn(now,out){
 let minAck=1e15;for(const id in sim.p){const e=sim.p[id].ea|0;if(e<minAck)minAck=e}
 evq=evq.filter(e=>now-e._t<2500&&e._i>minAck);if(evq.length>60)evq=evq.slice(-60);
 if(evc.length>60)evc=evc.slice(-60);
 const s=snap;for(const p of s.p){const q=sim.p[p.id];p.le=q&&q.lastE|0}
 out('st',JSON.stringify({t:'st',q:qSeq++,T:Math.round(now),ei:evSeq,lv:LV,P:s.p.map(packP),B:s.b.map(b=>[b.i,nr1(b.x),nr1(b.y),Math.round(b.vx),Math.round(b.vy),b.h,b.o,b.r]),tr:s.t,rp:s.rp,bm:s.bm,w:s.w,E:evq,C:evc}));
 evc=[]}
function sendWorld(now,force,out){
 const s=snap,R={};for(const id in sim.p){const p=sim.p[id];R[id]=[p.name,p.hue,p.bot?1:0]}
 const j=JSON.stringify({t:'wd',lv:LV,K:s.k.map(k=>[k.x,k.y,k.t,k.on,k.am,k.rv]),H:s.h.map(c=>[c.x,c.y,c.on]),N:s.n.map(c=>[c.id,c.x,c.y,c.v]),C:(s.cr||[]).map(c=>[c.id,c.x,c.y,c.it.map(i=>[i.u,i.t,i.am,i.rv,i.v])]),R});
 if(j===wdLast&&!force)return;wdLast=j;wdAt=now;out('wd',j)}
/* one server step: fixed 60 Hz simulation, snapshots at snapHz, world data when it changes (or when someone new joined) */
function tick(dt,snapHz,out){
 if(dt>.25)dt=.25;
 const now=performance.now();let n=0;
 hAcc+=dt;
 while(hAcc>=TICK&&n<15){sim.step(TICK);hAcc-=TICK;n++}
 if(n>=15)hAcc=0;
 for(const id in sim.p){const p=sim.p[id];
  if(p.seen&&now-p.seen>5000){delete sim.p[id];continue}
  if(p.seen&&now-p.seen>600){const i=p.in;i.dx=i.dy=0;i.f=0;i.d=0}}
 const dueS=(hSend+=dt)>=1/snapHz,dueW=now-wdAt>=350||resendWd;
 if(dueS||dueW||!snap)snap=sim.snap();     /* built right before sending so the per-player input age (ia) stays exact */
 if(dueS){hSend=Math.min(hSend-1/snapHz,1/snapHz);sendDyn(now,out)}
 if(dueW){sendWorld(now,!!resendWd,out);resendWd=0}}
function wantWorld(){resendWd=1}
function rtts(){const a=[];for(const id in sim.p)a.push(sim.p[id].rtt|0);return a}
