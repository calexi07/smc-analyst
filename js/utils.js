// ── UTILITIES ──────────────────────────────────────────────
function uid(){return'z'+Date.now()+Math.random().toString(36).slice(2,6);}

function zoneUid(pair,tf,ztype,dir,top,btm){
  var topR=parseFloat(top||0).toFixed(5);var btmR=parseFloat(btm||0).toFixed(5);
  var raw=pair+'_'+tf+'_'+ztype+'_'+dir+'_'+topR+'_'+btmR;
  var hash=0;for(var i=0;i<raw.length;i++){hash=((hash<<5)-hash)+raw.charCodeAt(i);hash|=0;}
  return'z'+Math.abs(hash).toString(36)+raw.length.toString(36);
}

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function showToast(msg){
  var t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(function(){t.classList.remove('show');},2200);
}

function closeModal(id){document.getElementById(id).classList.remove('active');}

function updateDate(){
  var n=new Date();
  document.getElementById('dateDisp').textContent=
    n.toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short'})+' '+
    n.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});
}

function zoneAge(fd,ft){
  if(!fd)return'';
  var ds=fd+(ft?'T'+ft:'T00:00');var f=new Date(ds);
  if(isNaN(f.getTime()))return'';
  var dH=Math.floor((new Date()-f)/36e5);var dD=Math.floor(dH/24);
  var dW=Math.floor(dD/7);var dM=Math.floor(dD/30);
  var cls=dD<7?'fresh':dD<30?'old':'ancient';
  var txt=dH<24?(dH+'h'):dD<7?(dD+'d'):dW<8?(dW+'w'):(dM+'mo');
  return'<span class="zone-age '+cls+'">'+txt+' ago</span>';
}

function isNewZone(z){return z.tags && z.tags.indexOf('new')>=0;}

// ── PRICE / DISTANCE ───────────────────────────────────────
function getPrice(){return livePrice||null;}

function calcDist(top,btm){
  var price=getPrice();if(!price||!top||!btm)return null;
  var rTop=Math.max(+top,+btm),rBtm=Math.min(+top,+btm);
  if(price>=rBtm&&price<=rTop)return{type:'inside',pips:0};
  if(price>rTop)return{type:'below',pips:Math.round((price-rTop)*10000)};
  return{type:'above',pips:Math.round((rBtm-price)*10000)};
}

function distHTML(top,btm){
  var d=calcDist(top,btm);if(!d)return'';
  if(d.type==='inside')return'<span class="dist-badge inside">● IN ZONE</span>';
  var cls=d.pips<=NEAR?'near':d.type;
  return'<span class="dist-badge '+cls+'">'+(d.type==='above'?'▲':'▼')+' '+d.pips+'p</span>';
}

function zoneExCls(top,btm){
  var d=calcDist(top,btm);if(!d)return'';
  return d.type==='inside'?'inside':d.pips<=NEAR?'near':'';
}

// ── SYNC STATUS ────────────────────────────────────────────
function setSyncStatus(s){
  var el=document.getElementById('syncIndicator');if(!el)return;
  if(s==='syncing'){el.className='sync-indicator syncing';el.textContent='⟳ Saving...';}
  else if(s==='synced'){el.className='sync-indicator synced';el.textContent='✓ Synced';}
  else{el.className='sync-indicator error';el.textContent='⚠ Error';}
}
