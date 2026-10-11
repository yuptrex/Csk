/* ============ ROOM LOBBY ============
 Purely additive layer, loaded after game.js. Create Room / Join Room no longer drop the
 player straight into a live match — they land here first. The match itself still starts
 by calling the game's own start(mode, room) exactly as before; nothing about gameplay,
 netcode or the wire protocol is touched.

 Firebase layout (new nodes only, alongside the ones game.js already owns):
  rooms/<CODE>/lobby/<id>   { name, photo, seat (0-19), ready (0/1), host (0/1), t }
  rooms/<CODE>/lstart       epoch ms written once by the host; clients watch it to begin
                            their own 15s "match starting" countdown in lockstep.

 Seats: 20 are shown, but only MAXH (8) can ever be occupied by a real player — the match's
 own netcode has no room for more. Seats beyond MAXH are shown locked, not joinable. */
(function(){
const $=id=>document.getElementById(id);
const SEATS=20;
let lobRoot=null,lobRef=null,startRef=null,mySeat=-1,myReady=0,amHost=0,code='',roster={},
    countdownT=null,enteredMatch=0;

function myAccount(){
 const a=(window.ARA&&ARA.account&&ARA.account())||null;
 return a||{uid:myId,name:(($('nm')&&$('nm').value)||'Player').trim().slice(0,12)||'Player',photo:''};
}

/* ---------- avatar ---------- */
function initials(n){return String(n||'?').trim().slice(0,1).toUpperCase()||'?'}
function avatarHTML(p){
 if(p.photo)return '<img src="'+p.photo.replace(/"/g,'&quot;')+'" alt="" referrerpolicy="no-referrer">';
 return '<i class="lob-ini">'+initials(p.name)+'</i>'}

/* ---------- rendering ---------- */
/* painted seat frames in the artwork (px in the 1983x793 image): 5 columns x 4 rows, numbered 1-20 */
const SX=[472,689,902,1115,1325],SW=[194,191,190,188,189],SY=[148,279,412,545],SH=[109,111,111,111];
const ICON_LOCK='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const ICON_CHECK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const allReady=()=>{const l=Object.values(roster);return l.length>0&&l.every(p=>p.ready||p.host)}; /* the host's START press is their "ready" */
function render(){
 const wrap=$('lob-seats');if(!wrap)return;
 const occ=Object.keys(roster).length;
 $('lob-cnt').textContent=occ+' / '+MAXH+' PLAYERS';
 const frag=document.createDocumentFragment();
 for(let i=0;i<SEATS;i++){
  const locked=i>=MAXH;
  const pid=Object.keys(roster).find(k=>roster[k].seat===i);
  const p=pid?roster[pid]:null;
  const el=document.createElement('div');
  el.className='lob-seat'+(locked?' lob-locked':p?' lob-filled':' lob-open')+(p&&p.ready?' lob-rdy':'')+(pid===myId?' lob-me':'');
  const c=i%5,r=(i/5)|0;
  el.style.cssText='--x:'+SX[c]+';--y:'+SY[r]+';--w:'+SW[c]+';--h:'+SH[r];
  if(locked){
   el.innerHTML='<div class="lob-veil">'+ICON_LOCK+'</div><div class="lob-pill">LOCKED</div>';
  }else if(p){
   el.innerHTML='<div class="lob-glow"></div><div class="lob-av">'+avatarHTML(p)+'</div>'
    +(p.host?'<div class="lob-host-tag">HOST</div>':'')
    +(p.ready||p.host?'<div class="lob-ck">'+ICON_CHECK+'</div>':'')
    +'<div class="lob-pill">'+escapeHtml(p.name||'Player')+(pid===myId?'<small>(you)</small>':'')+'</div>';
  }else{
   el.innerHTML='<div class="lob-glow"></div><div class="lob-pill">OPEN SEAT</div>';
   el.setAttribute('role','button');el.tabIndex=0;
   el.onclick=()=>takeSeat(i);
   el.onkeydown=e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();takeSeat(i)}};
  }
  frag.appendChild(el)}
 wrap.innerHTML='';wrap.appendChild(frag);
 /* READY (players) / START (host) share the big gold button */
 const rb=$('lob-ready'),sb=$('lob-start');
 if(rb){
  rb.hidden=amHost;
  const lab=rb.querySelector('.lab');
  rb.disabled=mySeat<0;
  if(lab)lab.textContent=mySeat<0?'PICK A SEAT':(myReady?'NOT READY':'READY UP');
  rb.classList.toggle('on',!!myReady&&mySeat>=0)}
 if(sb){sb.hidden=!amHost;sb.disabled=!allReady()}
 const hint=$('lob-hint');
 if(hint){
  if(amHost)hint.textContent=allReady()?(occ>1?'ALL READY':'READY WHEN YOU ARE'):'WAITING FOR PLAYERS';
  else hint.textContent=mySeat<0?'PICK A SEAT':(myReady?'WAITING FOR HOST':'PRESS READY')}}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

/* ---------- Firebase wiring ---------- */
function writeMe(patch){
 if(!lobRef)return;
 const me=Object.assign({name:myAccount().name,photo:myAccount().photo||'',seat:mySeat,ready:myReady,host:amHost?1:0,t:Date.now()},patch||{});
 lobRef.set(me).catch(()=>{})}
function takeSeat(i){
 if(mySeat===i)return;
 const taken=Object.values(roster).some(p=>p.seat===i);
 if(taken)return;
 mySeat=i;myReady=0;writeMe({seat:i,ready:0});render()}
function toggleReady(){
 if(mySeat<0)return;
 myReady=myReady?0:1;writeMe({ready:myReady});render()}

function attachRoom(roomCode,isHost){
 code=roomCode;amHost=!!isHost;
 lobRoot=FBdb.ref('rooms/'+code+'/lobby');
 lobRef=lobRoot.child(myId);
 startRef=FBdb.ref('rooms/'+code+'/lstart');
 try{lobRef.onDisconnect().remove()}catch(e){}
 lobRoot.on('value',s=>{
  const v=s.val()||{};
  if(!amHost&&!s.exists()&&Object.keys(roster).length){
   /* the room vanished from under us (host left/closed it) while we still had a roster: bounce home */
   detachRoom();hideLobby();netNote('The host left the room.',1);return}
  roster={};for(const k in v)roster[k]=v[k];
  render()},()=>{});
 startRef.on('value',s=>{
  const v=s.val();
  if(v&&!countdownT&&!enteredMatch)beginCountdown()},()=>{});
 mySeat=amHost?0:-1;myReady=0;
 writeMe({});
 showLobby()}

function detachRoom(){
 try{if(lobRoot)lobRoot.off()}catch(e){}
 try{if(startRef)startRef.off()}catch(e){}
 if(amHost){
  /* the host leaving closes the room for everyone, same as the host disconnecting mid-match elsewhere */
  try{FBdb.ref('rooms/'+code).remove()}catch(e){}
 }else{
  try{if(lobRef)lobRef.remove()}catch(e){}
 }
 lobRoot=lobRef=startRef=null;roster={};mySeat=-1;myReady=0;amHost=0;code='';
 clearInterval(countdownT);countdownT=null;
 const cnt=$('lob-count');if(cnt)cnt.hidden=true}

/* ---------- show / hide ---------- */
function showLobby(){
 const lob=$('lob');if(!lob)return;
 lob.hidden=false;
 const codeEl=$('lob-code');if(codeEl)codeEl.querySelector('b').textContent=code;
 render()}
function hideLobby(){const lob=$('lob');if(lob)lob.hidden=true}

/* ---------- countdown + handoff to the real match ---------- */
function beginCountdown(){
 const cnt=$('lob-count'),n=$('lob-count-n');
 if(!cnt||!n)return;
 cnt.hidden=false;
 let left=15;n.textContent=left;
 clearInterval(countdownT);
 countdownT=setInterval(()=>{
  left--;
  if(left<=0){clearInterval(countdownT);countdownT=null;enterMatch();return}
  n.textContent=left},1000)}
function enterMatch(){
 if(enteredMatch)return;enteredMatch=1;
 hideLobby();
 const cnt=$('lob-count');if(cnt)cnt.hidden=true;
 try{if(lobRoot)lobRoot.off()}catch(e){}
 try{if(startRef)startRef.off()}catch(e){}
 try{if(lobRef)lobRef.remove()}catch(e){}
 start(amHost?'host':'join',code)}

/* ---------- login gate + wiring the home buttons ---------- */
function requireLogin(){
 if(window.ARA&&ARA.hint())return true;
 netNote('Sign in with Google to create a room.',1);
 return false}

function goOnlineLobby(mode){
 audioInit();
 if(!fbInit()){netNote('Could not load Firebase. Check your internet connection and reload.',1);return}
 const busyUI=b=>{$('host').disabled=b;$('join').disabled=b};
 if(mode=='host'){
  if(!requireLogin())return;
  busyUI(1);$('msg').textContent='';
  waitUp(9000).then(()=>withTimeout(createRoomCode(),9000)).then(c=>{
   busyUI(0);enteredMatch=0;attachRoom(c,true)
  }).catch(e=>{busyUI(0);netNote(netErr(e),1)});
  return}
 const rc=cleanRoom($('rm').value);
 if(!ROOM_RE.test(rc)){netNote(rc.length<5?'Enter the 5-character room code from the host.':'Room codes never contain I, L, O, 0 or 1 \u2014 check the code and try again.',1);$('rm').focus();return}
 busyUI(1);
 waitUp(9000).then(()=>withTimeout(checkRoom(rc),9000)).then(r=>{
  busyUI(0);
  if(r=='none')netNote('Room '+rc+' was not found. Check the code, or ask the host to create the room first.',1);
  else if(r=='full')netNote('Room '+rc+' is full ('+MAXH+' players).',1);
  else{enteredMatch=0;attachRoom(rc,false)}
 }).catch(e=>{busyUI(0);netNote(netErr(e),1)})}

function leaveLobby(){
 detachRoom();hideLobby();
 $('msg').textContent=''}

function syncHostLock(){
 const h=$('host'),acc=$('acc');if(!h||!acc)return;
 const signed=acc.dataset.s==='in';
 h.classList.toggle('lob-locked-btn',!signed);
 h.title=signed?'':'Sign in with Google to create a room'}

function wire(){
 const h=$('host'),j=$('join');
 if(h)h.onclick=()=>goOnlineLobby('host');
 if(j)j.onclick=()=>goOnlineLobby('join');
 const acc=$('acc');
 if(acc&&window.MutationObserver){
  new MutationObserver(syncHostLock).observe(acc,{attributes:true,attributeFilter:['data-s']});
  syncHostLock()}
 const lv=$('lob-leave');if(lv)lv.onclick=()=>{sfx&&sfx('ui',{j:0});leaveLobby()};
 const rb=$('lob-ready');if(rb)rb.onclick=()=>{sfx&&sfx('ui',{j:0});toggleReady()};
 const sb=$('lob-start');if(sb)sb.onclick=()=>{if(sb.disabled)return;sfx&&sfx('ui',{j:0});if(startRef)startRef.set(Date.now()).catch(()=>{})};
 const ce=$('lob-code');if(ce)ce.onclick=()=>{
  const u=/^https?:/.test(location.protocol)?location.origin+location.pathname+'?room='+code:'',t=u||code;
  try{navigator.clipboard.writeText(t)}catch(e){}};
}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();
