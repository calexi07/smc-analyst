// ── EXPORT ─────────────────────────────────────────────────
function exportData(){
  var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=currentPair+'_smc_'+new Date().toISOString().slice(0,10)+'.json';a.click();
  showToast('✓ Exportat');
}

// ── IMPORT ZONES ───────────────────────────────────────────
function openImport(){document.getElementById('importModal').classList.add('active');}

function doImport(){
  var raw=document.getElementById('importData').value.trim();
  if(!raw){showToast('⚠ Paste JSON');return;}
  try{
    var d=JSON.parse(raw);
    TFS.forEach(function(tf){
      if(d[tf]){
        if(d[tf].bias)state[tf].bias=d[tf].bias;
        if(d[tf].notes)state[tf].notes=d[tf].notes;
        if(d[tf].obs)d[tf].obs.forEach(function(z){if(!z._id)z._id=zoneUid(currentPair,tf,'ob',z.type,z.top,z.btm);if(!z.tags)z.tags=[];if(!z.update_history)z.update_history=[];state[tf].obs.push(z);});
        if(d[tf].fvgs)d[tf].fvgs.forEach(function(z){if(!z._id)z._id=zoneUid(currentPair,tf,'fvg',z.type,z.entry,z.exit);if(!z.tags)z.tags=[];if(!z.update_history)z.update_history=[];state[tf].fvgs.push(z);});
        if(d[tf].events)d[tf].events.forEach(function(ev){if(!ev._id)ev._id=uid();state[tf].events.push(ev);});
        if(d[tf].eqh)state[tf].eqh=d[tf].eqh;
        if(d[tf].eql)state[tf].eql=d[tf].eql;
      }
    });
    closeModal('importModal');checkHasData();renderAll();syncToSupabase();showToast('✓ Import complet');
  }catch(e){showToast('⚠ JSON invalid: '+e.message);}
}

// ── ANALYSIS IMPORT ────────────────────────────────────────
function openAnalysisImportModalFor(type){
  document.getElementById('analysisImportType').value=type;
  document.getElementById('analysisImportLabel').textContent=
    type==='brief'?'🇬🇧 Import Brief London':type==='interim'?'🇺🇸 Import Brief New York':type==='debrief'?'🌙 Import Debrief':'📝 Import Trades JSON';
  document.getElementById('analysisImportModal').classList.add('active');
}

async function doAnalysisImport(){
  var type=document.getElementById('analysisImportType').value;
  var raw=document.getElementById('analysisImportData').value.trim();
  if(!raw){showToast('⚠ Paste JSON');return;}
  try{
    var d=JSON.parse(raw);
    if(type==='trades'){
      // Array of trades
      var trades=Array.isArray(d)?d:[d];
      var date=selectedDay||new Date().toLocaleDateString('en-GB');
      for(var i=0;i<trades.length;i++){
        var t=trades[i];
        if(!t.id)t.id=currentPair+'_trade_'+date.replace(/\//g,'-')+'_'+Date.now()+'_'+i;
        if(!t.pair)t.pair=currentPair;
        if(!t.date)t.date=date;
        await sb.from('smc_journal').upsert(t,{onConflict:'id'});
        journalTrades.push(t);
      }
    }else{
      // Brief or Debrief
      var date=d.date||selectedDay||new Date().toLocaleDateString('en-GB');
      var aId=currentPair+'_'+type+'_'+date.replace(/\//g,'-');
      var row={id:aId,pair:currentPair,type:type,date:date,data:d,created_at:new Date().toISOString()};
      await sb.from('smc_analyses').upsert(row,{onConflict:'id'});
      // Update local
      var idx=allAnalyses.findIndex(function(a){return a.id===aId;});
      if(idx>=0)allAnalyses[idx]=row;else allAnalyses.unshift(row);
      if(!selectedDay)selectedDay=date;
    }
    closeModal('analysisImportModal');
    document.getElementById('analysisImportData').value='';
    renderAll();showToast('✓ '+type.charAt(0).toUpperCase()+type.slice(1)+' importat');
  }catch(e){showToast('⚠ JSON invalid: '+e.message);}
}

async function deleteAnalysis(aId){
  if(!confirm('Sterge aceasta analiza?'))return;
  await sb.from('smc_analyses').delete().eq('id',aId);
  allAnalyses=allAnalyses.filter(function(a){return a.id!==aId;});
  renderAll();showToast('✓ Analiza stearsa');
}
