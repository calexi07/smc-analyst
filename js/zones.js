// ── BIAS ───────────────────────────────────────────────────
function setBias(tf,val){state[tf].bias=val;updateBiasBar();renderTF(tf);schedulSync();}

function updateBiasBar(){
  var map={bull:'↑',bear:'↓',neutral:'—','':'—'};
  var cls={bull:'bull',bear:'bear',neutral:'neutral','':'neutral'};
  TFS.forEach(function(tf){
    var el=document.getElementById('ba-'+tf);
    if(el){el.textContent=map[state[tf].bias]||'—';el.className='bias-arrow '+(cls[state[tf].bias]||'neutral');}
  });
}

// ── TF PANEL RENDER ────────────────────────────────────────
function renderTFHTML(tf){
  var d=state[tf],names={weekly:'Weekly',daily:'Daily',h4:'4H',h1:'1H'};
  var newCount=0;
  d.obs.forEach(function(z){if(isNewZone(z))newCount++;});
  d.fvgs.forEach(function(z){if(isNewZone(z))newCount++;});
  var newBadge=newCount>0?' <span class="new-tag">'+newCount+' NEW</span>':'';

  var biasOpts=['bull','bear','neutral'].map(function(v){
    var lbl=v==='bull'?'↑ Bull':v==='bear'?'↓ Bear':'— Range';
    return '<button class="bias-btn '+v+(d.bias===v?' active':'')+'" onclick="setBias(\''+tf+'\',\''+v+'\')">'+lbl+'</button>';
  }).join('');

  var sortedObs=d.obs.slice().sort(function(a,b){return(isNewZone(b)?1:0)-(isNewZone(a)?1:0);});
  var sortedFvgs=d.fvgs.slice().sort(function(a,b){return(isNewZone(b)?1:0)-(isNewZone(a)?1:0);});

  var eqHtml=(tf==='h4'||tf==='h1')?'<div class="section"><span class="sec-title">EQL / EQH</span><div class="entry-grid" style="margin-top:7px;"><div class="entry-item"><span class="field-lbl">EQH</span><input type="number" step="0.00001" value="'+(d.eqh||'')+'" onchange="state[\''+tf+'\'].eqh=this.value;schedulSync()"></div><div class="entry-item"><span class="field-lbl">EQL</span><input type="number" step="0.00001" value="'+(d.eql||'')+'" onchange="state[\''+tf+'\'].eql=this.value;schedulSync()"></div></div></div>':'';

  return '<div class="tf-panel '+tf+'"><div class="tf-hdr"><div class="tf-title"><span class="tf-badge">'+tf.toUpperCase()+'</span>'+names[tf]+' Structure'+newBadge+'</div><div class="bias-row">'+biasOpts+'</div></div><div class="tf-body">'+
    '<div class="section"><div class="sec-hdr"><span class="sec-title">Order Blocks <span class="sec-count">'+d.obs.length+'</span></span></div><div class="zone-list">'+sortedObs.map(function(z){return renderZoneHTML(tf,'ob',z);}).join('')+'</div>'+renderAddBtn(tf,'ob')+'</div>'+
    '<div class="section"><div class="sec-hdr"><span class="sec-title">Fair Value Gaps <span class="sec-count">'+d.fvgs.length+'</span></span></div><div class="zone-list">'+sortedFvgs.map(function(z){return renderZoneHTML(tf,'fvg',z);}).join('')+'</div>'+renderAddBtn(tf,'fvg')+'</div>'+
    '<div class="section"><div class="sec-hdr"><span class="sec-title">Sequence</span></div>'+d.events.map(function(ev){return renderEvHTML(tf,ev);}).join('')+'<button class="add-btn" onclick="addEvent(\''+tf+'\')">+ Add Event</button><div class="seq-preview">'+d.events.map(function(ev,i){return(i>0?'<span class="seq-arrow">→</span>':'')+' <span class="seq-chip '+ev.type+'">'+({choch:'CHoCH',bos:'BOS',sweep:'x',sfp:'SFP'}[ev.type]||ev.type)+'</span>';}).join('')+'</div></div>'+
    eqHtml+
    '<div class="section"><span class="sec-title">Notes</span><textarea class="notes-area" style="margin-top:7px;" onchange="state[\''+tf+'\'].notes=this.value;schedulSync()" placeholder="Context...">'+esc(d.notes||'')+'</textarea></div></div></div>';
}

// ── ZONE ITEM RENDER ───────────────────────────────────────
function renderZoneHTML(tf,ztype,zone){
  if(!zone._id)zone._id=uid();
  var id=zone._id,isOB=ztype==='ob';
  var top=isOB?zone.top:zone.entry,btm=isOB?zone.btm:zone.exit;
  var ex=zoneExCls(top,btm);var isN=isNewZone(zone);
  var cCls='zone-item '+zone.type+'-'+ztype+(ex?' '+ex:'')+(isN?' is-new':'');
  var lbl=zone.label||(isOB?'Unnamed OB':'Unnamed FVG');
  var stBadge='<span class="status-badge '+(zone.status||'active')+'">'+(zone.status||'active')+'</span>';
  var newTag=isN?'<span class="new-tag">NEW</span> ':'';
  var reviewBtn=isN?'<button class="btn btn-sm" style="background:var(--new);color:#fff;padding:2px 8px;font-size:10px;margin-left:4px;" onclick="event.stopPropagation();markZoneReviewed(\''+tf+'\',\''+ztype+'\',\''+id+'\')">✓ Reviewed</button>':'';

  return '<div class="'+cCls+'" id="zi-'+id+'"><div class="zone-row-compact" onclick="toggleZone(\''+id+'\')">'+newTag+'<span class="zone-compact-type">'+(zone.type==='bull'?'🟢':'🔴')+' '+zone.type.toUpperCase()+' '+ztype.toUpperCase()+'</span><span class="zone-compact-label">'+esc(lbl)+reviewBtn+'</span><span class="zone-compact-prices">'+parseFloat(top||0).toFixed(5)+' / '+parseFloat(btm||0).toFixed(5)+'</span><span class="zone-compact-dist">'+distHTML(top,btm)+'</span><span class="zone-compact-status">'+stBadge+'</span>'+zoneAge(zone.formed_date,zone.formed_time)+'<span class="zone-chevron" id="chv-'+id+'">▶</span></div><div class="zone-expand" id="ze-'+id+'">'+renderUpdateExp(tf,ztype,zone,id)+'</div></div>';
}

// ── ZONE EXPAND (edit form) ────────────────────────────────
function renderUpdateExp(tf,ztype,zone,id){
  var isOB=ztype==='ob';
  var top=isOB?zone.top:zone.entry,btm=isOB?zone.btm:zone.exit;
  var allSt=['active','tested','mitigated','broken','breaker'];
  var sOpts=allSt.map(function(s){return '<option value="'+s+'"'+(zone.status===s?' selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>';}).join('');
  var hist=zone.update_history||[];

  return '<div class="form-row"><div class="form-col w100"><span class="field-lbl">TYPE</span><select onchange="updateZF(\''+tf+'\',\''+ztype+'\',\''+id+'\',\'type\',this.value);renderTF(\''+tf+'\')"><option value="bull"'+(zone.type==='bull'?' selected':'')+'>🟢 Bull</option><option value="bear"'+(zone.type==='bear'?' selected':'')+'>🔴 Bear</option></select></div><div class="form-col w100"><span class="field-lbl">STATUS</span><select onchange="changeStatus(\''+tf+'\',\''+ztype+'\',\''+id+'\',this.value)">'+sOpts+'</select></div><div class="form-col w80"><span class="field-lbl">TOP</span><input type="number" step="0.00001" value="'+(top||'')+'" onchange="updateZP(\''+tf+'\',\''+ztype+'\',\''+id+'\',\'top\',this.value)"></div><div class="form-col w80"><span class="field-lbl">BOTTOM</span><input type="number" step="0.00001" value="'+(btm||'')+'" onchange="updateZP(\''+tf+'\',\''+ztype+'\',\''+id+'\',\'btm\',this.value)"></div></div>'+
  '<div class="form-row"><div class="form-col flex1"><span class="field-lbl">LABEL</span><input type="text" value="'+esc(zone.label||'')+'" onchange="updateZF(\''+tf+'\',\''+ztype+'\',\''+id+'\',\'label\',this.value);schedulSync()"></div></div>'+
  '<div class="form-row"><div class="form-col w120"><span class="field-lbl">DATE FORMED</span><input type="date" value="'+(zone.formed_date||'')+'" onchange="updateZF(\''+tf+'\',\''+ztype+'\',\''+id+'\',\'formed_date\',this.value);schedulSync()"></div><div class="form-col w80"><span class="field-lbl">TIME</span><input type="time" value="'+(zone.formed_time||'')+'" onchange="updateZF(\''+tf+'\',\''+ztype+'\',\''+id+'\',\'formed_time\',this.value);schedulSync()"></div><div class="form-col flex1"><span class="field-lbl">CONTEXT</span><input type="text" value="'+esc(isOB?(zone.ob_note||''):(zone.fvg_note||''))+'" onchange="updateZF(\''+tf+'\',\''+ztype+'\',\''+id+'\',\''+(isOB?'ob_note':'fvg_note')+'\',this.value);schedulSync()"></div></div>'+
  (zone.mitigated_at?'<div style="font-size:10px;color:var(--bear);margin-bottom:6px;">Mitigated: '+zone.mitigated_at+'</div>':'')+
  '<div class="form-col flex1" style="margin-bottom:8px;"><span class="field-lbl">UPDATE NOTE</span><div style="display:flex;gap:6px;margin-top:3px;"><input type="text" id="upd-'+id+'" placeholder="Ce s-a schimbat..."><button class="btn btn-green btn-sm" onclick="saveNote(\''+tf+'\',\''+ztype+'\',\''+id+'\')">Save</button></div></div>'+
  (hist.length>0?'<div class="update-history"><span class="field-lbl">HISTORY</span>'+hist.slice().reverse().map(function(h){return '<div class="update-entry"><div class="update-entry-date">'+h.date+' '+h.time+'</div><div class="update-entry-text">'+esc(h.note)+'</div></div>';}).join('')+'</div>':'')+
  '<div style="display:flex;justify-content:flex-end;margin-top:8px;"><button class="btn btn-red btn-sm" onclick="removeZone(\''+tf+'\',\''+ztype+'\',\''+id+'\')">🗑 Delete</button></div>';
}

// ── ADD ZONE FORM ──────────────────────────────────────────
function renderAddBtn(tf,ztype){
  return '<button class="add-btn" onclick="showAddForm(\''+tf+'\',\''+ztype+'\')">+ Add '+ztype.toUpperCase()+'</button><div class="add-zone-form" id="addform-'+tf+'-'+ztype+'"><div class="form-row"><div class="form-col w100"><span class="field-lbl">TYPE</span><select id="nf-type-'+tf+'-'+ztype+'"><option value="bear">🔴 Bear</option><option value="bull">🟢 Bull</option></select></div><div class="form-col w80"><span class="field-lbl">TOP</span><input type="number" step="0.00001" id="nf-top-'+tf+'-'+ztype+'"></div><div class="form-col w80"><span class="field-lbl">BOTTOM</span><input type="number" step="0.00001" id="nf-btm-'+tf+'-'+ztype+'"></div></div><div class="form-row"><div class="form-col flex1"><span class="field-lbl">LABEL</span><input type="text" id="nf-lbl-'+tf+'-'+ztype+'"></div></div><div class="form-row"><div class="form-col w120"><span class="field-lbl">DATE</span><input type="date" id="nf-date-'+tf+'-'+ztype+'"></div><div class="form-col w80"><span class="field-lbl">TIME</span><input type="time" id="nf-time-'+tf+'-'+ztype+'"></div></div><div style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px;"><button class="btn btn-red btn-sm" onclick="hideAddForm(\''+tf+'\',\''+ztype+'\')">Cancel</button><button class="btn btn-green btn-sm" onclick="commitAdd(\''+tf+'\',\''+ztype+'\')">Add</button></div></div>';
}

// ── EVENT RENDER ───────────────────────────────────────────
function renderEvHTML(tf,ev){
  if(!ev._id)ev._id=uid();var id=ev._id;
  var tOpts=['choch','bos','sweep','sfp'].map(function(t){return '<option value="'+t+'"'+(ev.type===t?' selected':'')+'>'+{choch:'CHoCH',bos:'BOS',sweep:'SWEEP',sfp:'SFP'}[t]+'</option>';}).join('');
  return '<div class="event-row '+ev.type+'"><select style="width:80px;flex-shrink:0;font-weight:600;" onchange="updateEF(\''+tf+'\',\''+id+'\',\'type\',this.value);renderTF(\''+tf+'\')">'+tOpts+'</select><select style="width:66px;flex-shrink:0;" onchange="updateEF(\''+tf+'\',\''+id+'\',\'dir\',this.value)"><option value="bull"'+(ev.dir==='bull'?' selected':'')+'>↑ Bull</option><option value="bear"'+(ev.dir==='bear'?' selected':'')+'>↓ Bear</option></select><input style="width:80px;flex-shrink:0;" type="number" step="0.00001" value="'+(ev.price||'')+'" placeholder="Price" onchange="updateEF(\''+tf+'\',\''+id+'\',\'price\',this.value)"><input style="width:100px;flex-shrink:0;" type="date" value="'+(ev.date||'')+'" onchange="updateEF(\''+tf+'\',\''+id+'\',\'date\',this.value)"><input style="width:66px;flex-shrink:0;" type="time" value="'+(ev.time||'')+'" onchange="updateEF(\''+tf+'\',\''+id+'\',\'time\',this.value)"><button class="btn btn-red btn-sm" onclick="removeEvent(\''+tf+'\',\''+id+'\')">×</button></div>';
}

// ── ZONE CRUD ──────────────────────────────────────────────
function toggleZone(id){var ze=document.getElementById('ze-'+id),chv=document.getElementById('chv-'+id);if(ze)ze.classList.toggle('open');if(chv)chv.classList.toggle('open');}
function showAddForm(tf,zt){document.getElementById('addform-'+tf+'-'+zt).classList.add('open');}
function hideAddForm(tf,zt){document.getElementById('addform-'+tf+'-'+zt).classList.remove('open');}

function commitAdd(tf,zt){
  var isOB=zt==='ob';
  var top=document.getElementById('nf-top-'+tf+'-'+zt).value;
  var btm=document.getElementById('nf-btm-'+tf+'-'+zt).value;
  if(!top||!btm){showToast('⚠ Completeaza Top si Bottom');return;}
  var dtype=document.getElementById('nf-type-'+tf+'-'+zt).value;
  var detId=zoneUid(currentPair,tf,zt,dtype,top,btm);
  var zone={_id:detId,type:dtype,status:'active',label:document.getElementById('nf-lbl-'+tf+'-'+zt).value,formed_date:document.getElementById('nf-date-'+tf+'-'+zt).value,formed_time:document.getElementById('nf-time-'+tf+'-'+zt).value,tags:[],update_history:[]};
  if(isOB){zone.top=top;zone.btm=btm;zone.ob_note='';}else{zone.entry=top;zone.exit=btm;zone.fvg_note='';}
  state[tf][isOB?'obs':'fvgs'].push(zone);renderTF(tf);schedulSync();showToast('✓ Zona adaugata');
}

function removeZone(tf,zt,id){var arr=state[tf][zt==='ob'?'obs':'fvgs'];var i=arr.findIndex(function(z){return z._id===id;});if(i>=0)arr.splice(i,1);sb.from('smc_zones').delete().eq('id',id);renderTF(tf);showToast('✓ Zona stearsa');}
function findZone(tf,zt,id){return state[tf][zt==='ob'?'obs':'fvgs'].find(function(z){return z._id===id;});}
function updateZF(tf,zt,id,f,v){var z=findZone(tf,zt,id);if(z)z[f]=v;}
function updateZP(tf,zt,id,side,v){var z=findZone(tf,zt,id);if(!z)return;if(zt==='ob'){if(side==='top')z.top=v;else z.btm=v;}else{if(side==='top')z.entry=v;else z.exit=v;}schedulSync();}

function changeStatus(tf,zt,id,newStatus){
  var z=findZone(tf,zt,id);if(!z)return;z.status=newStatus;
  if(newStatus==='mitigated'||newStatus==='broken'){var now=new Date();z.mitigated_at=now.toLocaleDateString('en-GB')+' '+now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});}
  renderTF(tf);schedulSync();
}

function saveNote(tf,zt,id){
  var inp=document.getElementById('upd-'+id);if(!inp||!inp.value.trim())return;
  var z=findZone(tf,zt,id);if(!z)return;if(!z.update_history)z.update_history=[];
  var n=new Date();z.update_history.push({date:n.toLocaleDateString('en-GB'),time:n.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false}),note:inp.value.trim()});
  inp.value='';renderTF(tf);schedulSync();showToast('✓ Nota salvata');
}

function markZoneReviewed(tf,zt,id){var z=findZone(tf,zt,id);if(!z)return;if(z.tags)z.tags=z.tags.filter(function(t){return t!=='new';});renderTF(tf);schedulSync();showToast('✓ Tag NEW removed');}

// ── EVENT CRUD ─────────────────────────────────────────────
function addEvent(tf){state[tf].events.push({_id:uid(),type:'choch',dir:'bear',price:'',date:'',time:''});renderTF(tf);schedulSync();}
function updateEF(tf,id,f,v){var ev=state[tf].events.find(function(e){return e._id===id;});if(ev)ev[f]=v;schedulSync();}
function removeEvent(tf,id){state[tf].events=state[tf].events.filter(function(e){return e._id!==id;});sb.from('smc_events').delete().eq('id',id);renderTF(tf);}
