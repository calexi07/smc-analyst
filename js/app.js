// ── RENDER ─────────────────────────────────────────────────
function renderAll(){
  updateBiasBar();
  var main=document.getElementById('mainContent');
  if(appMode==='zones'){
    if(!hasData){main.innerHTML=renderEmptyState();return;}
    main.innerHTML='<div class="tf-grid">'+TFS.map(function(tf){return renderTFHTML(tf);}).join('')+'</div>';
  }else if(appMode==='analysis'){
    main.innerHTML=renderAnalysisPage();
  }else if(appMode==='archive'){
    main.innerHTML=renderArchivePage();
  }else if(appMode==='heartbeat'){
    main.innerHTML=renderHeartbeatPage();
  }else{
    main.innerHTML=renderEmptyState();
  }
}

function renderTF(tf){
  // Re-render single TF panel in place
  var panels=document.querySelectorAll('.tf-panel.'+tf);
  if(panels.length>0){
    var tmp=document.createElement('div');tmp.innerHTML=renderTFHTML(tf);
    panels[0].replaceWith(tmp.firstChild);
  }
  updateBiasBar();
}

function renderEmptyState(){
  return '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">SMC Analyst — '+currentPair+'</div><div class="empty-sub">Importa zone din TradingView sau adauga manual. Datele se sincronizeaza automat cu Supabase.</div><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;"><button class="btn btn-green" onclick="setMode(\'zones\')">📋 Zones View</button><button class="btn btn-ghost" onclick="openImport()">⬆ Import JSON</button></div></div>';
}

// ── MODE SWITCH ────────────────────────────────────────────
function setMode(m){
  appMode=m;
  document.querySelectorAll('.mode-btn').forEach(function(b){
    b.classList.toggle('active',b.dataset.mode===m);
  });
  if(m==='heartbeat') loadCandles();
  else renderAll();
}

function checkHasData(){
  hasData=false;
  TFS.forEach(function(tf){
    if(state[tf].obs.length>0||state[tf].fvgs.length>0||state[tf].events.length>0||state[tf].bias)hasData=true;
  });
  if(!hasData && appMode==='zones')appMode='empty';
  else if(hasData && appMode==='empty')appMode='zones';
}

// ── PAIR SWITCH ────────────────────────────────────────────
function switchPair(p){
  currentPair=p;
  state=pairStates[p];
  livePrice=null;livePriceTs=null;
  selectedDay=null;activeAnalysisTab='brief';
  allAnalyses=[];archivedZones=[];journalTrades=[];
  loadFromSupabase(p);
}

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){
  updateDate();setInterval(updateDate,60000);
  loadFromSupabase(currentPair);
});
