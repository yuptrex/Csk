/* CSuperKnights DEDICATED GAME SERVER - runs the match so no player's phone/PC has to be the host.
   Every player (including whoever created the room) is a client of this server, so everybody gets the same low ping
   (the round trip to this server) - the same model PUBG / BGMI use. Deploy it in your players' country (see SERVER-DEPLOY.md).
   Run:  copy game-server-package.json -> package.json, npm i, node game-server.js   (PORT env, default 8080)
   Env:  ALLOWED_ORIGINS=https://yourgame.web.app,https://yourgame.com  (optional)   SNAP_HZ=30 (snapshot rate, 20-60) */
const http=require('http'),vm=require('vm'),fs=require('fs'),path=require('path');
const {WebSocketServer}=require('ws');
const {performance}=require('perf_hooks');
const PORT=+process.env.PORT||8080,SNAP_HZ=Math.max(20,Math.min(60,+process.env.SNAP_HZ||30)),MAX_MSG=16*1024,BUF_MAX=64e3,EMPTY_MS=15000,PEND_MS=8000;
const ORIGINS=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
const ROOM_RE=/^[A-HJ-KM-NP-Z2-9]{5}$/,ID_RE=/^[A-Za-z0-9_-]{1,24}$/;
const SRC=fs.readFileSync(path.join(__dirname,'server-sim.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'server-room.js'),'utf8')+
 '\n;this.api={init,tick,hostIn,drop,wantWorld,humanCount,rtts};';
const rooms=new Map(),pending=new Map();   // code -> room ; code -> [{ws,id,t}]

function makeRoom(code,lv){
 const ctx=vm.createContext({performance,Math,JSON,console,Date,Object,Array,String,Number,isFinite,parseInt,parseFloat});
 vm.runInContext(SRC,ctx,{filename:'room-'+code});
 ctx.api.init(lv);
 const room={code,ctx,api:ctx.api,clients:new Map(),wd:null,last:performance.now(),emptyAt:0};
 room.out=(kind,s)=>{if(kind==='wd')room.wd=s;
  for(const c of room.clients.values()){if(c.readyState!==1)continue;
   if(kind==='st'&&c.bufferedAmount>BUF_MAX)continue;        /* a backed-up client gets the NEXT snapshot, never a queue of old ones (queued = lag) */
   try{c.send(s)}catch(e){}}};
 rooms.set(code,room);return room}
function attach(room,ws,id){
 const old=room.clients.get(id);if(old&&old!==ws)try{old.close(4001,'replaced')}catch(e){}
 room.clients.set(id,ws);room.emptyAt=0;room.api.wantWorld();
 if(room.wd)try{ws.send(room.wd)}catch(e){}
 ws.on('message',(d,bin)=>{
  if(bin)return;const s=d.toString();if(s.length>MAX_MSG)return;
  const now=performance.now();ws.cnt=(ws.cnt||0)+1;if(now-(ws.win||0)>1000){ws.win=now;ws.cnt=1}else if(ws.cnt>150)return;   /* flood guard */
  let m;try{m=JSON.parse(s)}catch(e){return}
  if(!m||typeof m!=='object')return;
  m.id=id;                                                    /* a player can only ever control their own id */
  try{if(m.t==='in')room.api.hostIn(m);else if(m.t==='bye'){room.api.drop(id);room.clients.delete(id)}}catch(e){console.error('msg',e&&e.message)}});
 ws.on('close',()=>{if(room.clients.get(id)===ws)room.clients.delete(id)});
 ws.send('{"t":"ka"}')}

const srv=http.createServer((q,r)=>{
 const h={'content-type':'text/plain','access-control-allow-origin':'*','cache-control':'no-store'};
 if(q.url==='/health'||q.url==='/ping'){r.writeHead(200,h);r.end('ok '+rooms.size+' rooms');return}
 r.writeHead(404,h);r.end()});
const wss=new WebSocketServer({server:srv,perMessageDeflate:false,maxPayload:MAX_MSG,
 verifyClient:({origin},cb)=>{if(ORIGINS.length&&origin&&!ORIGINS.includes(origin))cb(false,403,'origin');else cb(true)}});
wss.on('connection',(ws,req)=>{
 try{req.socket.setNoDelay(true)}catch(e){}
 const u=new URL(req.url,'http://x'),code=(u.searchParams.get('room')||'').toUpperCase(),id=u.searchParams.get('id')||'',isHost=u.searchParams.get('host')==='1',lv=+u.searchParams.get('lv')===2?2:1;
 if(!ROOM_RE.test(code)||!ID_RE.test(id)){ws.close(4000,'bad request');return}
 ws.isAlive=true;ws.on('pong',()=>{ws.isAlive=true});ws.on('error',()=>{});
 let room=rooms.get(code);
 if(!room&&isHost){room=makeRoom(code,lv);const w=pending.get(code)||[];pending.delete(code);for(const p of w)if(p.ws.readyState===1)attach(room,p.ws,p.id)}
 if(room){if(room.clients.size>=8&&!room.clients.has(id)){ws.close(4004,'full');return}attach(room,ws,id);return}
 /* joiner arrived a moment before the room creator: wait for the room to appear */
 const list=pending.get(code)||[];list.push({ws,id});pending.set(code,list);
 setTimeout(()=>{const l=pending.get(code);if(!l)return;const i=l.findIndex(p=>p.ws===ws);if(i<0)return;l.splice(i,1);if(!l.length)pending.delete(code);try{ws.close(4003,'no such room')}catch(e){}},PEND_MS)});

/* game loop for every room (own clock per room, fixed-step inside) */
setInterval(()=>{
 const now=performance.now();
 for(const [code,room] of rooms){
  const dt=(now-room.last)/1000;room.last=now;
  try{room.api.tick(dt,SNAP_HZ,room.out)}catch(e){console.error('tick',code,e&&e.stack)}
  if(!room.clients.size&&!room.api.humanCount()){if(!room.emptyAt)room.emptyAt=now;else if(now-room.emptyAt>EMPTY_MS)rooms.delete(code)}
  else if(room.clients.size)room.emptyAt=0}},4);
setInterval(()=>{for(const room of rooms.values())for(const c of room.clients.values())if(c.readyState===1)try{c.send('{"t":"ka"}')}catch(e){}},500);
setInterval(()=>{for(const ws of wss.clients){if(ws.isAlive===false){ws.terminate();continue}ws.isAlive=false;try{ws.ping()}catch(e){}}},20000);
srv.listen(PORT,()=>console.log('CSK game server on :'+PORT+'  snapshots '+SNAP_HZ+' Hz'));
