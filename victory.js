/* Victory screen: uses victory-bg.jpg as the artwork, overlays live data. VS.show(snap,myId) / VS.hide() */
(function(){
const PROV=["Great knights don't just fight... they make history.","Fortune favors the bold.","A calm sea never made a skilled sailor.","Victory belongs to the most persevering.","Fall seven times, stand up eight.","The sharpest sword is a steady heart.","Courage is not the absence of fear, but mastery of it.","Legends are forged in the heat of battle.","Every crown is earned, never given.","Strike with honor, stand with pride.","The best defense is a fearless spirit.","Only the last knight standing writes the story."];
const TAGS=[["THE CHAMPION","#ffc83a","#3a2400"],["SHADOW","#2a55d8","#fff"],["ASSASSIN","#8a1fc0","#fff"],["BLAZING","#c4211c","#fff"],["SNIPER","#1f9a3a","#fff"],["WARRIOR","#c4601c","#fff"],["RANGER","#1c9ab4","#fff"],["HUNTER","#4a22c4","#fff"],["LEGEND","#c9971c","#3a2400"],["SURVIVOR","#59616b","#fff"]];
const RK={1:"#e8a919",2:"#2f6fb8",3:"#b86a30"};
let root,st,on=0,pi=0,pt=0;
const el=(c,t,p)=>{const e=document.createElement(t||'div');if(c)e.className=c;(p||st).appendChild(e);return e};
function fit(){if(!root)return;const s=Math.min(innerWidth/1983,innerHeight/793);st.style.transform=`scale(${s}) translate(-50%,-50%)`;st.style.left='50%';st.style.top='50%';st.style.transformOrigin='0 0';
 st.style.marginLeft=(-1983*s/2+1983*s/2)+'px';
 st.style.left=(innerWidth/2)+'px';st.style.top=(innerHeight/2)+'px'}
function pic(e,url,name,hue){e.style.backgroundImage='';e.textContent='';e.style.background=`hsl(${hue||40} 60% 30%)`;e.textContent=(name||'?')[0].toUpperCase();
 if(!url)return;const im=new Image();im.referrerPolicy='no-referrer';im.onload=()=>{e.style.backgroundImage=`url("${url.replace(/"/g,'')}")`;e.style.backgroundSize='cover';e.textContent=''};im.src=url}
function photoOf(p,myId){return p.id==myId?((window.ARA&&ARA.account()||{}).photo||p.photo||''):(p.photo||'')}
function build(snap,myId){
 if(!root){root=el('', 'div',document.body);root.id='vs';st=document.createElement('div');st.id='vs-st';root.appendChild(st);addEventListener('resize',fit)}
 st.innerHTML='';
 const w=snap.w,rows=[...snap.p].sort((a,b)=>(b.id==w.id)-(a.id==w.id)||b.k-a.k||a.d-b.d).slice(0,10);
 rows.forEach((p,i)=>{const r=el('vr'+(i?'':' w')),y=241+i*41.4;r.style.top=y+'px';
  const rk=el('rk','span',r);rk.textContent=i+1;if(RK[i+1]){rk.style.color='#fff';rk.style.background=RK[i+1]+(i?'':'');rk.style.height='34px';rk.style.lineHeight='34px';rk.style.width='90px';rk.style.left='16px';rk.style.top='1px';rk.style.clipPath='polygon(10% 0,90% 0,100% 50%,90% 100%,10% 100%,0 50%)'}
  const av=el('av','span',r);pic(av,photoOf(p,myId),p.name,p.hue);
  const n=el('nm','span',r);n.textContent=p.name;if(p.id==myId)n.style.color='#ffe9a0';
  const t=TAGS[i],tg=el('tg','span',r);tg.textContent=t[0];tg.style.background=t[1];tg.style.color=t[2];
  const k=el('kl','span',r);k.textContent=p.k});
 const wp=rows[0]||{};pic(el('','div'),'',wp.name,wp.hue);
 const pc=el('', 'div');pc.id='vs-pic';pic(pc,photoOf(wp,myId),wp.name,wp.hue);
 el('','div').id='vs-pn';st.lastChild.textContent=wp.name||'';
 el('','div').id='vs-pk';st.lastChild.textContent=wp.k||0;
 const pv=el('','div');pv.id='vs-pv';pv.textContent=PROV[pi%PROV.length];
 const hb=el('','button');hb.id='vs-home';hb.type='button';hb.setAttribute('aria-label','Back to home');
 hb.onclick=e=>{const r=hb.getBoundingClientRect(),i=document.createElement('i'),d=Math.max(r.width,r.height)*2;
  i.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
  hb.appendChild(i);hb.disabled=true;
  setTimeout(()=>{const h=document.getElementById('home');if(h)h.click();else location.reload()},180)};
 fit()}
window.VS={
 show(snap,myId){if(!on){on=1;pi=0;build(snap,myId);root.classList.add('on');pt=setInterval(()=>{const pv=document.getElementById('vs-pv');if(!pv)return;pv.classList.add('f');setTimeout(()=>{pi=(pi+1)%PROV.length;pv.textContent=PROV[pi];pv.classList.remove('f')},600)},5000)}},
 hide(){if(!on)return;on=0;clearInterval(pt);root&&root.classList.remove('on')}};
})();
