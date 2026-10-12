/* ===========================================================
   CSK victory/defeat results panel — presentation only.
   Reads match-end data it's handed (winner + player list) and the
   window it's shown/hidden from (js/game.js, at the `snap.w` state
   change). Never reads or writes any netcode/Firebase state itself;
   player photos are looked up read-only via window.CSKLobby.roster()
   (exported by lobby.js) and window.ARA.account() (exported by
   game.js) — both already-existing, already-synced data.
   =========================================================== */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const TAGS=['THE CHAMPION','SHADOW','ASSASSIN','BLAZING','SNIPER','WARRIOR','RANGER','HUNTER','LEGEND','SURVIVOR'];
const TAG_COLORS=['#ffb02e','#3b82f6','#a855f7','#ef4444','#22c55e','#d97706','#06b6d4','#8b5cf6','#eab308','#64748b'];
const PROVERBS_WIN=[
 "GREAT KNIGHTS DON'T JUST FIGHT… THEY MAKE HISTORY.",
 "VICTORY FAVORS THE KNIGHT WHO NEVER STOPS MOVING.",
 "A CROWN IS EARNED ONE BATTLE AT A TIME.",
 "THE ARENA REMEMBERS EVERY CHAMPION.",
 "FORTUNE SIDES WITH THE BOLD KNIGHT.",
 "LEGENDS AREN'T BORN. THEY'RE FORGED IN BATTLE."
];
const PROVERBS_LOSE=[
 "EVERY DEFEAT IS A LESSON IN ARMOR.",
 "THE BEST KNIGHTS RISE AFTER THE FALL.",
 "NO CHAMPION WAS UNDEFEATED FOREVER.",
 "SHARPEN YOUR BLADE. THE NEXT ROUND AWAITS.",
 "DEFEAT TODAY. STRATEGY TOMORROW."
];

let pvTimer=null,pvIdx=0,pvList=PROVERBS_WIN;

function initials(name){
 name=(name||'').trim();if(!name)return '?';
 const parts=name.split(/\s+/).slice(0,2);
 return parts.map(p=>p[0]).join('').toUpperCase();
}
function avatarInnerHTML(photo,name,size){
 if(photo)return '<img src="'+String(photo).replace(/"/g,'&quot;')+'" alt="" referrerpolicy="no-referrer" loading="lazy">';
 return '<span style="font-size:'+(size||13)+'px">'+esc(initials(name))+'</span>';
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

/* Resolve a player's photo without touching netcode: prefer the local
   account's own photo for `myId`, otherwise look up the last-synced
   room roster (Gmail photo already carried there by lobby.js). Bots
   and solo opponents simply have none, so they render initials. */
function photoFor(p){
 try{
  if(typeof myId!=='undefined'&&p.id===myId&&window.ARA&&ARA.account){
   const a=ARA.account();if(a&&a.photo)return a.photo;
  }
  if(window.CSKLobby&&CSKLobby.roster){
   const r=CSKLobby.roster()||{};
   if(r[p.id]&&r[p.id].photo)return r[p.id].photo;
  }
 }catch(e){}
 return '';
}

function buildRows(winner,players){
 const rows=[...players].sort((a,b)=>(b.id===winner.id)-(a.id===winner.id)||(b.k||0)-(a.k||0)||(a.d||0)-(b.d||0));
 const tbl=$('vic-table');tbl.innerHTML='';
 const myId_=typeof myId!=='undefined'?myId:null;
 rows.forEach((p,i)=>{
  const rk=i+1,isWin=p.id===winner.id,isMe=p.id===myId_;
  const row=document.createElement('div');
  row.className='vic-row'+(isWin?' vic-row-win':'')+(isMe&&!isWin?' vic-row-me':'');
  const tag=TAGS[i%TAGS.length],tagC=TAG_COLORS[i%TAG_COLORS.length];
  const pillCls=rk===1?'r1':rk===2?'r2':rk===3?'r3':'';
  row.innerHTML=
   '<div class="vic-rank"><div class="vic-rank-pill '+pillCls+'">'+rk+'</div></div>'+
   '<div class="vic-name-wrap"><div class="vic-avatar">'+avatarInnerHTML(photoFor(p),p.name,10)+'</div>'+
   '<span class="vic-name">'+esc(p.name||'Player')+'</span>'+
   '<span class="vic-tag" style="background:'+tagC+'">'+tag+'</span></div>'+
   '<div class="vic-kills"><svg viewBox="0 0 24 24"><path d="M12 2C7 2 4 5.5 4 10c0 2.6 1.3 4.5 2.6 5.8L5 22h3l1-3.3c.9.2 1.9.3 3 .3s2.1-.1 3-.3L16 22h3l-1.6-6.2C18.7 14.5 20 12.6 20 10c0-4.5-3-8-8-8z"/></svg>'+(p.k||0)+'</div>';
  tbl.appendChild(row);
  requestAnimationFrame(()=>setTimeout(()=>row.classList.add('vic-row-in'),40+i*55));
 });
 return rows;
}

function startProverb(won){
 pvList=won?PROVERBS_WIN:PROVERBS_LOSE;pvIdx=Math.random()*pvList.length|0;
 const el=$('vic-proverb');el.textContent=pvList[pvIdx];
 clearInterval(pvTimer);
 pvTimer=setInterval(()=>{
  el.classList.add('vic-pv-fade');
  setTimeout(()=>{pvIdx=(pvIdx+1)%pvList.length;el.textContent=pvList[pvIdx];el.classList.remove('vic-pv-fade')},420);
 },5000);
}
function stopProverb(){clearInterval(pvTimer);pvTimer=null}

function wireHomeButton(){
 const hb=$('home');if(!hb||hb.dataset.vicWired)return;hb.dataset.vicWired='1';
 hb.addEventListener('click',e=>{
  // visual press feedback only — the button's own onclick (set by game.js)
  // still owns navigation/exit logic and is left completely untouched.
  hb.classList.add('vic-pressed');setTimeout(()=>hb.classList.remove('vic-pressed'),150);
  const r=hb.getBoundingClientRect(),rip=document.createElement('span');
  const size=Math.max(r.width,r.height)*1.1,x=(e.clientX||r.left+r.width/2)-r.left-size/2,y=(e.clientY||r.top+r.height/2)-r.top-size/2;
  rip.className='vic-ripple';rip.style.cssText='width:'+size+'px;height:'+size+'px;left:'+x+'px;top:'+y+'px';
  hb.style.position='relative';hb.style.overflow='hidden';hb.appendChild(rip);
  setTimeout(()=>rip.remove(),600);
 });
}

function show(winner,players,won){
 if(!winner||!players||!players.length)return;
 const panel=$('csk-vic');if(!panel)return;
 panel.classList.toggle('vic-lose',!won);
 $('vic-title').textContent=won?'VICTORY':'DEFEAT';
 $('vic-sub').textContent=won?'YOU ARE THE LAST KNIGHT STANDING!':(winner.name||'A rival knight')+' TOOK THE CROWN THIS TIME.';
 $('vic-champ-name').textContent=winner.name||'Player';
 $('vic-champ-tag').textContent=won?'THE CHAMPION':'ROUND WINNER';
 $('vic-champ-kills-n').textContent=winner.k||0;
 $('vic-champ-photo').innerHTML=avatarInnerHTML(photoFor(winner),winner.name,28);
 buildRows(winner,players);
 startProverb(won);
 // relocate the game's own #home button into the panel (same element,
 // same onclick from game.js — only its position/visibility changes)
 const hb=$('home'),slot=$('vic-home-slot');
 if(hb&&slot&&hb.parentNode!==slot)slot.appendChild(hb);
 if(hb){hb.hidden=false;hb.textContent=(won&&typeof sim!=='undefined'&&sim&&typeof net!=='undefined'&&!net&&typeof LV!=='undefined'&&LV<2)?'NEXT LEVEL':'BACK TO HOME';}
 wireHomeButton();
 panel.hidden=false;panel.setAttribute('aria-hidden','false');
 requestAnimationFrame(()=>panel.classList.add('vic-show'));
}

function hide(){
 const panel=$('csk-vic');if(!panel||panel.hidden)return;
 panel.classList.remove('vic-show');stopProverb();
 setTimeout(()=>{panel.hidden=true;panel.setAttribute('aria-hidden','true')},300);
}

window.CSKVictory={show,hide};
})();
