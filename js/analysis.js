// ── ANALYSIS HELPERS ───────────────────────────────────────
function getUniqueDays(){
  var days={};
  allAnalyses.forEach(function(a){if(!days[a.date])days[a.date]={brief:null,interim:null,debrief:null};days[a.date][a.type]=a;});
  journalTrades.forEach(function(t){if(t.date && !days[t.date])days[t.date]={brief:null,interim:null,debrief:null};});
  var sorted=Object.keys(days).sort(function(a,b){
    var da=a.split('/').reverse().join(''),db=b.split('/').reverse().join('');return db.localeCompare(da);
  });
  return{days:days,sorted:sorted};
}

function selectDay(d){selectedDay=d||null;renderAll();}
function setAnalysisTab(t){activeAnalysisTab=t;renderAll();}
function toggleSetup(id){var b=document.getElementById('sbody-'+id),c=document.getElementById('schv-'+id);if(b)b.classList.toggle('open');if(c)c.classList.toggle('open');}
function fromInputDate(d){if(!d)return '';var p=d.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:'';}

// ── ANALYSIS PAGE ──────────────────────────────────────────
function renderAnalysisPage(){
  var info=getUniqueDays();var days=info.days,sorted=info.sorted;

  // Convert selectedDay (DD/MM/YYYY) to YYYY-MM-DD for input[type=date]
  function toInputDate(d){
    if(!d)return '';
    var p=d.split('/');return p.length===3?p[2]+'-'+p[1]+'-'+p[0]:'';
  }
  // Convert YYYY-MM-DD back to DD/MM/YYYY
  function fromInputDate(d){
    if(!d)return '';
    var p=d.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:'';
  }

  // Prev / Next day navigation among days that have data
  var currentIdx=sorted.indexOf(selectedDay);
  var prevDay=currentIdx>0?sorted[currentIdx-1]:null;
  var nextDay=currentIdx>=0&&currentIdx<sorted.length-1?sorted[currentIdx+1]:null;

  // Badges for selected day
  var badge='';
  if(selectedDay&&days[selectedDay]){
    var dd=days[selectedDay];
    if(dd.brief)badge+='<span class="analysis-type-badge brief" style="font-size:9px;">🇬🇧</span> ';
    if(dd.interim)badge+='<span class="analysis-type-badge" style="background:#fff7ed;color:#c2410c;font-size:9px;">🇺🇸</span> ';
    if(dd.debrief)badge+='<span class="analysis-type-badge debrief" style="font-size:9px;">🌙</span> ';
    if(journalTrades.filter(function(t){return t.date===selectedDay;}).length>0)badge+='<span class="analysis-type-badge" style="background:var(--neutral-bg);color:var(--neutral);font-size:9px;">📝</span>';
  }

  var html='<div class="analysis-page"><div class="analysis-toolbar" style="flex-wrap:wrap;gap:8px;">'+
    '<div style="display:flex;align-items:center;gap:6px;">'+
      '<button class="btn btn-ghost btn-sm" '+(prevDay?'onclick="selectDay(\''+prevDay+'\')"':'disabled')+' style="padding:5px 8px;">←</button>'+
      '<input type="date" id="analysisDatePicker" value="'+toInputDate(selectedDay)+'" '+
        'onchange="selectDay(fromInputDate(this.value))" '+
        'style="font-weight:700;padding:6px 10px;border:2px solid var(--border2);border-radius:8px;font-size:13px;cursor:pointer;background:var(--bg2);color:var(--text);">'+
      '<button class="btn btn-ghost btn-sm" '+(nextDay?'onclick="selectDay(\''+nextDay+'\')"':'disabled')+' style="padding:5px 8px;">→</button>'+
      (badge?'<span style="display:flex;gap:3px;align-items:center;">'+badge+'</span>':'')+
    '</div>'+
    '<div class="analysis-tabs">'+
      '<button class="atab brief-tab'+(activeAnalysisTab==='brief'?' active':'')+'" onclick="setAnalysisTab(\'brief\')">🇬🇧 Brief London</button>'+
      '<button class="atab interim-tab'+(activeAnalysisTab==='interim'?' active':'')+'" onclick="setAnalysisTab(\'interim\')">🇺🇸 Brief New York</button>'+
      '<button class="atab debrief-tab'+(activeAnalysisTab==='debrief'?' active':'')+'" onclick="setAnalysisTab(\'debrief\')">🌙 Debrief</button>'+
      '<button class="atab trades-tab'+(activeAnalysisTab==='trades'?' active':'')+'" onclick="setAnalysisTab(\'trades\')">📝 Trades</button>'+
    '</div>'+
    '<button class="btn btn-green btn-sm" onclick="openAnalysisImportModalFor(activeAnalysisTab===\'trades\'?\'trades\':activeAnalysisTab)">⬆ Import</button>'+
  '</div>';

  if(!selectedDay){
    html+='<div class="analysis-import-zone"><div class="ai-icon">📊</div><div class="ai-text">Selecteaza o zi</div><div class="ai-sub">Alege o zi din dropdown sau importa o analiza noua.</div></div></div>';
    return html;
  }
  if(activeAnalysisTab==='brief'){
    var briefA=days[selectedDay]&&days[selectedDay].brief;
    html+=briefA?renderBriefContent(briefA):'<div class="analysis-import-zone"><div class="ai-icon">🇬🇧</div><div class="ai-text">Niciun Brief London pentru '+selectedDay+'</div><div class="ai-sub">Importa JSON-ul de brief pentru sesiunea London.</div><button class="btn btn-green" onclick="openAnalysisImportModalFor(\'brief\')">⬆ Import Brief London</button></div>';
  }else if(activeAnalysisTab==='interim'){
    var interimA=days[selectedDay]&&days[selectedDay].interim;
    html+=interimA?renderInterimContent(interimA):'<div class="analysis-import-zone"><div class="ai-icon">🇺🇸</div><div class="ai-text">Niciun Brief New York pentru '+selectedDay+'</div><div class="ai-sub">Importa JSON-ul de brief adaptat pentru sesiunea New York.</div><button class="btn btn-green" onclick="openAnalysisImportModalFor(\'interim\')">⬆ Import Brief NY</button></div>';
  }else if(activeAnalysisTab==='debrief'){
    var debriefA=days[selectedDay]&&days[selectedDay].debrief;
    html+=debriefA?renderDebriefContent(debriefA):'<div class="analysis-import-zone"><div class="ai-icon">🌙</div><div class="ai-text">Niciun Debrief pentru '+selectedDay+'</div><div class="ai-sub">Importa la final de zi cu toate candelele printate.</div><button class="btn btn-green" onclick="openAnalysisImportModalFor(\'debrief\')">⬆ Import Debrief</button></div>';
  }else{
    html+=renderTradesTab();
  }
  html+='</div>';return html;
}

// ── BRIEF ──────────────────────────────────────────────────
function renderBriefContent(aObj){
  var a=aObj.data||aObj;
  var bDirs={bull:'↑ BULL',bear:'↓ BEAR',neutral:'— RANGE'};
  var biasRows='';if(a.bias){biasRows=[{tf:'WEEKLY',d:a.bias.weekly},{tf:'DAILY',d:a.bias.daily},{tf:'H4',d:a.bias.h4}].map(function(r){if(!r.d)return'';return '<tr><td><b>'+r.tf+'</b></td><td><span class="bias-dir '+(r.d.direction||'')+'">'+(bDirs[r.d.direction]||r.d.direction||'')+'</span></td><td style="color:var(--text2)">'+(r.d.summary||'')+'</td></tr>';}).join('');}
  var levelRows=(a.key_levels||[]).map(function(l){return '<div class="level-row '+l.type+'"><span class="level-price">'+l.price+'</span><span class="level-label">'+l.label+'</span>'+(l.tf?'<span class="level-tf '+l.tf+'">'+l.tf.toUpperCase()+'</span>':'')+'</div>';}).join('');

  function rSetup(s,pfx){
    var tgts=(s.targets||[]).map(function(t){return '<div class="target-row '+t.tp.toLowerCase()+'"><span class="target-label">'+t.tp+'</span><span class="target-price">'+t.price+'</span><span class="target-pips">'+t.pips+'p</span><span class="target-rr">'+t.rr+'</span><span class="target-size">'+(t.size_pct||'')+'%</span></div>';}).join('');

    // Activation checklist
    var checklistHTML='';
    if(s.activation_steps && s.activation_steps.length>0){
      checklistHTML='<div style="margin-top:12px;border:1px solid var(--border);border-radius:8px;overflow:hidden;">' +
        '<div style="background:var(--bg3);padding:6px 12px;font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text3);text-transform:uppercase;border-bottom:1px solid var(--border);">✅ Checklist Activare</div>' +
        '<div style="padding:8px 12px;">';
      s.activation_steps.forEach(function(step, i){
        var isLast = i === s.activation_steps.length-1;
        var stepColor = step.type === 'entry' ? 'var(--bull)' : step.type === 'exit' ? 'var(--bear)' : step.type === 'manage' ? 'var(--neutral)' : 'var(--text2)';
        var icon = step.type === 'entry' ? '🎯' : step.type === 'exit' ? '🚪' : step.type === 'manage' ? '📋' : step.type === 'watch' ? '👀' : step.type === 'confirm' ? '✔' : '→';
        checklistHTML += '<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;'+(isLast?'':'border-bottom:1px solid var(--border)+')+'">' +
          '<span style="font-size:11px;min-width:18px;text-align:center;flex-shrink:0;margin-top:1px;">'+icon+'</span>' +
          '<span style="font-size:11px;color:'+stepColor+';font-weight:'+(step.type==='entry'||step.type==='exit'?'700':'400')+';line-height:1.4;">'+step.text+'</span>' +
        '</div>';
      });
      checklistHTML += '</div></div>';
    }

    return '<div class="setup-card '+(s.priority||'secondary')+'"><div class="setup-hdr" onclick="toggleSetup(\''+pfx+'-'+s.id+'\')"><span class="setup-id '+pfx+'">'+s.id+'</span><span class="setup-title">'+(s.label||'')+'</span><span class="setup-dir '+(s.direction||'')+'">'+(s.direction==='short'?'↓ SHORT':'↑ LONG')+'</span><span class="setup-chevron" id="schv-'+pfx+'-'+s.id+'">▶</span></div><div class="setup-body" id="sbody-'+pfx+'-'+s.id+'"><div class="setup-logic">'+(s.logic||'')+'</div><div class="setup-condition"><strong>Conditie:</strong> '+(s.condition||'')+'</div>'+(s.warning?'<div class="setup-warning">⚠ '+s.warning+'</div>':'')+'<div class="setup-params"><div class="setup-param"><div class="setup-param-lbl">ENTRY</div><div class="setup-param-val">'+(s.entry||'')+'</div></div><div class="setup-param"><div class="setup-param-lbl">STOP LOSS</div><div class="setup-param-val red">'+(s.sl||'')+'</div></div><div class="setup-param"><div class="setup-param-lbl">RISC</div><div class="setup-param-val">'+(s.risk_pips||'')+' pips</div></div>'+(s.session?'<div class="setup-param"><div class="setup-param-lbl">SESIUNE</div><div class="setup-param-val" style="font-size:10px">'+s.session+'</div></div>':'')+'</div><div class="setup-targets">'+tgts+'</div>'+(s.management?'<div class="setup-management">📋 '+s.management+'</div>':'')+(s.invalidation?'<div class="setup-condition" style="margin-top:8px;border-left:3px solid var(--bear)"><strong>Invalidare:</strong> '+s.invalidation+'</div>':'')+checklistHTML+'</div></div>';
  }
  var dtHTML=(a.day_trades||[]).map(function(s){return rSetup(s,'dt');}).join('');
  var swHTML=(a.swing_trades||[]).map(function(s){return rSetup(s,'sw');}).join('');
  var avoidHTML=(a.avoid||[]).map(function(x){return '<li>'+x+'</li>';}).join('');
  var scenHTML=(a.scenarios||[]).map(function(s){return '<div class="scenario-row"><span class="scenario-cond">'+s.condition+'</span><span class="scenario-arrow">→</span><span class="scenario-action">'+s.action+'</span></div>';}).join('');

  return '<div class="analysis-header"><div class="analysis-header-top"><div class="analysis-title"><span class="analysis-type-badge brief">🇬🇧 BRIEF LONDON</span> '+(a.pair||currentPair)+' — '+(a.day||'')+' '+(a.date||'')+'</div><div class="analysis-meta"><span class="analysis-meta-badge">📍 '+(a.current_price||'N/A')+'</span><button class="btn btn-red btn-sm" onclick="deleteAnalysis(\''+aObj.id+'\')">🗑 Sterge</button></div></div>'+(a.session_note?'<div class="session-note">⚠ '+a.session_note+'</div>':'')+'</div><div class="analysis-grid">'+(a.bias?'<div class="analysis-card"><div class="analysis-card-title">Bias Multi-TF</div><table class="bias-table"><tr><th>TF</th><th>Bias</th><th>Motiv</th></tr>'+biasRows+'</table><div class="bias-conclusion">'+(a.bias.conclusion||'')+'</div></div>':'')+(levelRows?'<div class="analysis-card"><div class="analysis-card-title">Nivele Cheie</div><div class="levels-list">'+levelRows+'</div></div>':'')+(a.critical_observation?'<div class="analysis-card full"><div class="analysis-card-title">⚠ Observatie critica</div><div class="setup-warning"><strong>'+a.critical_observation.title+'</strong><br>'+a.critical_observation.text+'</div></div>':'')+(dtHTML?'<div class="analysis-card"><div class="analysis-card-title">🎯 Day Trade</div><div class="setups-grid">'+dtHTML+'</div></div>':'')+(swHTML?'<div class="analysis-card"><div class="analysis-card-title">📈 Swing Trade</div><div class="setups-grid">'+swHTML+'</div></div>':'')+(avoidHTML?'<div class="analysis-card"><div class="analysis-card-title">✕ Zone de evitat</div><ul class="avoid-list">'+avoidHTML+'</ul></div>':'')+(scenHTML?'<div class="analysis-card"><div class="analysis-card-title">🔑 Scenariile zilei</div>'+scenHTML+'</div>':'')+'</div>';
}

// ── DEBRIEF ────────────────────────────────────────────────
function renderDebriefContent(aObj){
  var a=aObj.data||aObj;
  var html='<div class="analysis-header"><div class="analysis-header-top"><div class="analysis-title"><span class="analysis-type-badge debrief">🌙 DEBRIEF</span> '+(a.pair||currentPair)+' — '+(a.date||'')+'</div><div class="analysis-meta"><button class="btn btn-red btn-sm" onclick="deleteAnalysis(\''+aObj.id+'\')">🗑 Sterge</button></div></div></div>';
  if(a.sessions && a.sessions.length>0){
    html+='<div class="analysis-card full"><div class="analysis-card-title">🗺️ Narativa pe Sesiuni</div>';
    a.sessions.forEach(function(s){html+='<div class="debrief-session"><div class="debrief-session-name">'+s.name+'</div><div class="debrief-narrative">'+s.narrative+'</div>'+(s.candles&&s.candles.length>0?'<div style="margin-top:6px;">'+s.candles.map(function(c){return '<span class="debrief-candle">'+c+'</span>';}).join(' ')+'</div>':'')+'</div>';});
    html+='</div>';
  }
  if(a.zones_touched && a.zones_touched.length>0){
    html+='<div class="analysis-card full"><div class="analysis-card-title">📍 Zone Atinse</div>';
    a.zones_touched.forEach(function(zt){
      html+='<div class="debrief-session"><div class="debrief-session-name">'+zt.zone+'</div>';
      if(zt.trade){var t=zt.trade;html+='<div class="setup-params" style="margin-top:8px;"><div class="setup-param"><div class="setup-param-lbl">ENTRY</div><div class="setup-param-val">'+(t.entry||'')+'</div></div><div class="setup-param"><div class="setup-param-lbl">SL</div><div class="setup-param-val red">'+(t.sl||'')+'</div></div><div class="setup-param"><div class="setup-param-lbl">TP1</div><div class="setup-param-val green">'+(t.tp1||'')+'</div></div>'+(t.tp2?'<div class="setup-param"><div class="setup-param-lbl">TP2</div><div class="setup-param-val green">'+t.tp2+'</div></div>':'')+'<div class="setup-param"><div class="setup-param-lbl">RISK</div><div class="setup-param-val">'+(t.risk_pips||'')+'p</div></div><div class="setup-param"><div class="setup-param-lbl">RESULT</div><div class="setup-param-val '+(t.result&&t.result.indexOf('TP')>=0?'green':'red')+'">'+(t.result||'')+'</div></div></div>';}
      if(zt.notes)html+='<div style="font-size:11px;color:var(--text2);margin-top:6px;">'+zt.notes+'</div>';
      html+='</div>';
    });
    html+='</div>';
  }
  if(a.predictions && a.predictions.length>0){
    html+='<div class="analysis-card full"><div class="analysis-card-title">✅ Predictii vs Realitate</div><table class="pred-table"><tr><th>Predictie</th><th>Realitate</th><th>Verdict</th></tr>';
    a.predictions.forEach(function(p){html+='<tr><td>'+p.prediction+'</td><td>'+p.reality+'</td><td class="'+(p.correct?'pred-correct':'pred-wrong')+'">'+(p.verdict||'')+'</td></tr>';});
    html+='</table></div>';
  }
  if(a.potential_trades && a.potential_trades.length>0){
    html+='<div class="analysis-card full"><div class="analysis-card-title">💡 Trade-uri Potentiale ale Zilei</div>';
    a.potential_trades.forEach(function(t){
      var isBull=t.direction==='long';
      var resColor=t.result==='TP1'||t.result==='TP2'||t.result==='TP3'?'var(--bull)':t.result==='SL'?'var(--bear)':'var(--sweep)';
      var dirBadge='<span class="setup-dir '+(isBull?'long':'short')+'" style="font-size:11px;padding:2px 8px;">'+(isBull?'↑ LONG':'↓ SHORT')+'</span>';
      var activated=t.activated!==false;
      html+='<div class="debrief-session" style="border-left:4px solid '+(activated?(isBull?'var(--bull)':'var(--bear)'):'var(--border2)')+';opacity:'+(activated?'1':'0.6')+';">';
      html+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">'+dirBadge+'<span class="debrief-session-name" style="margin:0;">'+t.label+'</span>'+(t.session?'<span class="analysis-meta-badge" style="font-size:10px;">'+t.session+'</span>':'')+(activated?'':'<span style="font-size:10px;color:var(--text3);padding:2px 8px;background:var(--bg3);border-radius:10px;font-weight:600;">⊘ Nu s-a activat</span>')+'</div>';
      html+='<div style="font-size:12px;color:var(--text2);margin-bottom:8px;">'+t.logic+'</div>';
      if(activated){
        html+='<div class="setup-params">';
        if(t.entry)html+='<div class="setup-param"><div class="setup-param-lbl">ENTRY</div><div class="setup-param-val" style="font-family:JetBrains Mono,monospace;">'+t.entry+'</div></div>';
        if(t.sl)html+='<div class="setup-param"><div class="setup-param-lbl">SL</div><div class="setup-param-val red" style="font-family:JetBrains Mono,monospace;">'+t.sl+'</div></div>';
        if(t.tp1)html+='<div class="setup-param"><div class="setup-param-lbl">TP1</div><div class="setup-param-val green" style="font-family:JetBrains Mono,monospace;">'+t.tp1+'</div></div>';
        if(t.tp2)html+='<div class="setup-param"><div class="setup-param-lbl">TP2</div><div class="setup-param-val green" style="font-family:JetBrains Mono,monospace;">'+t.tp2+'</div></div>';
        if(t.risk_pips)html+='<div class="setup-param"><div class="setup-param-lbl">RISK</div><div class="setup-param-val">'+t.risk_pips+'p</div></div>';
        if(t.rr)html+='<div class="setup-param"><div class="setup-param-lbl">R:R</div><div class="setup-param-val">'+t.rr+'</div></div>';
        if(t.pnl)html+='<div class="setup-param"><div class="setup-param-lbl">PIPS</div><div class="setup-param-val" style="color:'+resColor+';font-weight:700;">'+t.pnl+'</div></div>';
        if(t.result)html+='<div class="setup-param"><div class="setup-param-lbl">RESULT</div><div class="setup-param-val" style="color:'+resColor+';font-weight:700;">'+t.result+'</div></div>';
        html+='</div>';
      }
      if(t.notes)html+='<div style="font-size:11px;color:var(--text2);margin-top:8px;padding:6px 10px;background:var(--bg3);border-radius:6px;">'+t.notes+'</div>';
      html+='</div>';
    });
    html+='</div>';
  }
  if(a.for_tomorrow && a.for_tomorrow.length>0){
    html+='<div class="analysis-card full"><div class="analysis-card-title">🔮 Pentru Maine</div><ul style="list-style:none;">';
    a.for_tomorrow.forEach(function(f){html+='<li style="padding:4px 0;font-size:12px;border-bottom:1px solid var(--border);">→ '+f+'</li>';});
    html+='</ul></div>';
  }
  return html;
}

// ── INTERIM ────────────────────────────────────────────────
function renderInterimContent(aObj){
  var a=aObj.data||aObj;
  var html='<div class="analysis-header"><div class="analysis-header-top"><div class="analysis-title"><span class="analysis-type-badge" style="background:#fff7ed;color:#c2410c;">🇺🇸 BRIEF NEW YORK</span> '+(a.pair||currentPair)+' — '+(a.date||'')+'</div><div class="analysis-meta">'+(a.timestamp?'<span class="analysis-meta-badge">🕐 '+a.timestamp+'</span>':'')+'<span class="analysis-meta-badge">📍 '+(a.pre_london_analysis&&a.pre_london_analysis.current_price||a.current_price||'')+'</span><button class="btn btn-red btn-sm" onclick="deleteAnalysis(\''+aObj.id+'\')">🗑 Sterge</button></div></div></div>';

  // Pre-London Analysis box
  var pla=a.pre_london_analysis;
  if(pla){
    html+='<div class="analysis-card full"><div class="analysis-card-title">📊 Analiza Pre-Sesiune</div><div class="setup-params"><div class="setup-param"><div class="setup-param-lbl">BIAS</div><div class="setup-param-val" style="font-size:10px;">'+(pla.bias||'')+'</div></div><div class="setup-param"><div class="setup-param-lbl">ASIAN HIGH</div><div class="setup-param-val green">'+(pla.asian_high||'')+'</div></div><div class="setup-param"><div class="setup-param-lbl">ASIAN LOW</div><div class="setup-param-val red">'+(pla.asian_low||'')+'</div></div><div class="setup-param"><div class="setup-param-lbl">RANGE</div><div class="setup-param-val">'+(pla.asian_range||'')+'</div></div></div>';
    if(pla.key_observations&&pla.key_observations.length>0){
      html+='<ul style="list-style:none;margin-top:10px;">';
      pla.key_observations.forEach(function(obs){html+='<li style="padding:5px 0;font-size:12px;border-bottom:1px solid var(--border);color:var(--text2);">⚡ '+obs+'</li>';});
      html+='</ul>';
    }
    html+='</div>';
  }

  // Sessions (reuse debrief session rendering)
  if(a.sessions && a.sessions.length>0){
    html+='<div class="analysis-card full"><div class="analysis-card-title">🗺️ Sesiuni</div>';
    a.sessions.forEach(function(s){html+='<div class="debrief-session"><div class="debrief-session-name">'+s.name+'</div><div class="debrief-narrative">'+s.narrative+'</div>'+(s.candles&&s.candles.length>0?'<div style="margin-top:6px;">'+s.candles.map(function(c){return '<span class="debrief-candle">'+c+'</span>';}).join(' ')+'</div>':'')+'</div>';});
    html+='</div>';
  }

  // Zones touched
  if(a.zones_touched && a.zones_touched.length>0){
    html+='<div class="analysis-card full"><div class="analysis-card-title">📍 Zone Atinse</div>';
    a.zones_touched.forEach(function(zt){
      html+='<div class="debrief-session"><div class="debrief-session-name">'+zt.zone+'</div>';
      if(zt.notes)html+='<div style="font-size:11px;color:var(--text2);margin-top:4px;">'+zt.notes+'</div>';
      html+='</div>';
    });
    html+='</div>';
  }

  // London Game Plan
  var gp=a.london_game_plan;
  if(gp){
    html+='<div class="analysis-card full"><div class="analysis-card-title">🎯 Game Plan London</div>';
    var scenarios=[gp.scenario_1,gp.scenario_2,gp.scenario_3].filter(function(s){return s;});
    scenarios.forEach(function(sc){
      var borderColor=sc.name&&sc.name.indexOf('LONG')>=0?'var(--bull)':sc.name&&sc.name.indexOf('SHORT')>=0?'var(--bear)':'var(--sweep)';
      html+='<div class="debrief-session" style="border-left:3px solid '+borderColor+';"><div class="debrief-session-name">'+sc.name+'</div><div style="font-size:12px;color:var(--text2);margin:6px 0;"><strong>Condiție:</strong> '+sc.condition+'</div>';
      if(sc.entry){
        html+='<div class="setup-params" style="margin-top:8px;"><div class="setup-param"><div class="setup-param-lbl">ENTRY</div><div class="setup-param-val">'+(sc.entry||'')+'</div></div><div class="setup-param"><div class="setup-param-lbl">SL</div><div class="setup-param-val red">'+(sc.sl||'')+'</div></div><div class="setup-param"><div class="setup-param-lbl">TP1</div><div class="setup-param-val green">'+(sc.tp1||'')+'</div></div>'+(sc.tp2?'<div class="setup-param"><div class="setup-param-lbl">TP2</div><div class="setup-param-val green">'+sc.tp2+'</div></div>':'')+'<div class="setup-param"><div class="setup-param-lbl">RISK</div><div class="setup-param-val">'+(sc.risk||'')+'</div></div><div class="setup-param"><div class="setup-param-lbl">R:R</div><div class="setup-param-val">'+(sc.rr||'')+'</div></div>'+(sc.confidence?'<div class="setup-param"><div class="setup-param-lbl">CONFIDENCE</div><div class="setup-param-val">'+sc.confidence+'</div></div>':'')+'</div>';
      }
      if(sc.action)html+='<div style="font-size:12px;color:var(--text2);margin-top:6px;">→ '+sc.action+'</div>';
      if(sc.warning)html+='<div class="setup-warning" style="margin-top:8px;">⚠ '+sc.warning+'</div>';
      html+='</div>';
    });
    html+='</div>';
  }

  // Watch levels
  if(a.watch_levels_london && a.watch_levels_london.length>0){
    html+='<div class="analysis-card full"><div class="analysis-card-title">👀 Nivele de Urmarit</div><ul style="list-style:none;">';
    a.watch_levels_london.forEach(function(l){html+='<li style="padding:5px 0;font-size:12px;border-bottom:1px solid var(--border);">📌 '+l+'</li>';});
    html+='</ul></div>';
  }

  // For tomorrow / next steps
  if(a.for_tomorrow && a.for_tomorrow.length>0){
    html+='<div class="analysis-card full"><div class="analysis-card-title">🔮 Pași Urmatori</div><ul style="list-style:none;">';
    a.for_tomorrow.forEach(function(f){html+='<li style="padding:4px 0;font-size:12px;border-bottom:1px solid var(--border);">→ '+f+'</li>';});
    html+='</ul></div>';
  }

  return html;
}

// ── TRADES TAB ─────────────────────────────────────────────
function renderTradesTab(){
  var dayTrades=journalTrades.filter(function(t){return t.date===selectedDay;});
  var wins=0,losses=0,totalPips=0,totalRR=0;
  dayTrades.forEach(function(t){if(t.result==='SL')losses++;else if(t.result&&t.result!=='BE'&&t.result!=='')wins++;totalPips+=parseFloat(t.pips)||0;totalRR+=parseFloat(t.rr_achieved)||0;});
  var wr=wins+losses>0?Math.round(wins/(wins+losses)*100):0;

  var html='<div class="journal-stats"><div class="journal-stat"><div class="journal-stat-lbl">TRADES</div><div class="journal-stat-val">'+dayTrades.length+'</div></div><div class="journal-stat"><div class="journal-stat-lbl">WIN RATE</div><div class="journal-stat-val" style="color:'+(wr>=50?'var(--bull)':'var(--bear)')+'">'+wr+'%</div></div><div class="journal-stat"><div class="journal-stat-lbl">TOTAL PIPS</div><div class="journal-stat-val" style="color:'+(totalPips>=0?'var(--bull)':'var(--bear)')+'">'+totalPips.toFixed(1)+'</div></div><div class="journal-stat"><div class="journal-stat-lbl">TOTAL R:R</div><div class="journal-stat-val">'+totalRR.toFixed(1)+'R</div></div></div>';
  html+='<div style="margin-bottom:12px;"><button class="btn btn-green btn-sm" onclick="openTradeModal()">+ Adauga Trade</button> <button class="btn btn-ghost btn-sm" onclick="openAnalysisImportModalFor(\'trades\')">⬆ Import Trades JSON</button></div>';

  if(dayTrades.length>0){
    html+='<div style="overflow-x:auto;"><table class="journal-table"><tr><th>Dir</th><th>Setup</th><th>Zona</th><th>Entry</th><th>SL</th><th>TP1</th><th>Result</th><th>Pips</th><th>R:R</th><th>Sesiune</th><th>Note</th><th></th></tr>';
    dayTrades.forEach(function(t){
      var dirCls=t.direction==='long'?'journal-win':'journal-loss';
      var resCls=(t.result&&t.result.indexOf('TP')>=0)?'journal-win':(t.result==='SL'?'journal-loss':'');
      html+='<tr><td class="'+dirCls+'" style="font-weight:700;">'+(t.direction==='long'?'↑':'↓')+'</td><td>'+(t.setup_id||'')+'</td><td>'+(t.zone_label||'')+'</td><td style="font-family:JetBrains Mono,monospace;font-size:11px;">'+(t.entry_price||'')+'</td><td style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--bear);">'+(t.sl_price||'')+'</td><td style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--bull);">'+(t.tp1_price||'')+'</td><td class="'+resCls+'">'+(t.result||'pending')+'</td><td style="font-weight:700;" class="'+resCls+'">'+(t.pips||'')+'</td><td>'+(t.rr_achieved||'')+'</td><td style="font-size:10px;">'+(t.session||'')+'</td><td style="font-size:10px;color:var(--text3);max-width:120px;overflow:hidden;text-overflow:ellipsis;">'+(t.notes||'')+'</td><td><button class="btn btn-red btn-sm" onclick="deleteTrade(\''+t.id+'\')">×</button></td></tr>';
    });
    html+='</table></div>';
  }else{
    html+='<div style="text-align:center;color:var(--text3);padding:30px;">Niciun trade inregistrat pentru '+selectedDay+'</div>';
  }
  return html;
}

function openTradeModal(){document.getElementById('tradeModal').classList.add('active');}

async function saveTrade(){
  var date=selectedDay||new Date().toLocaleDateString('en-GB');
  var tId=currentPair+'_trade_'+date.replace(/\//g,'-')+'_'+Date.now();
  var trade={id:tId,pair:currentPair,date:date,
    direction:document.getElementById('tm-dir').value,
    setup_id:document.getElementById('tm-setup').value,
    zone_label:document.getElementById('tm-zone').value,
    entry_price:parseFloat(document.getElementById('tm-entry').value)||null,
    sl_price:parseFloat(document.getElementById('tm-sl').value)||null,
    tp1_price:parseFloat(document.getElementById('tm-tp1').value)||null,
    tp2_price:parseFloat(document.getElementById('tm-tp2').value)||null,
    result:document.getElementById('tm-result').value||null,
    exit_price:parseFloat(document.getElementById('tm-exit').value)||null,
    pips:parseFloat(document.getElementById('tm-pips').value)||null,
    rr_achieved:parseFloat(document.getElementById('tm-rr').value)||null,
    session:document.getElementById('tm-session').value,
    notes:document.getElementById('tm-notes').value};
  await sb.from('smc_journal').upsert(trade,{onConflict:'id'});
  journalTrades.push(trade);closeModal('tradeModal');renderAll();showToast('✓ Trade salvat');
}

async function deleteTrade(tId){
  if(!confirm('Sterge acest trade?'))return;
  await sb.from('smc_journal').delete().eq('id',tId);
  journalTrades=journalTrades.filter(function(t){return t.id!==tId;});
  renderAll();showToast('✓ Trade sters');
}

// ── ARCHIVE PAGE ───────────────────────────────────────────
function renderArchivePage(){
  var html='<div style="max-width:1200px;margin:0 auto;padding:20px 16px;"><h2 style="font-size:16px;font-weight:700;margin-bottom:16px;">🗄 Arhiva Zone — '+currentPair+'</h2>';
  if(archivedZones.length===0){html+='<div class="empty-state" style="min-height:30vh;"><div class="ai-icon">🗄</div><div class="ai-text">Nicio zona arhivata</div></div>';}
  else{html+='<div class="zone-list">';archivedZones.forEach(function(z){
    var mitDate=z.mitigated_at?'<span class="mitigated-date">'+z.mitigated_at+'</span>':'';
    html+='<div class="zone-item '+(z.status==='mitigated'?'mitigated-item':'broken-item')+' '+z.direction+'-'+z.zone_type+'" style="opacity:.7;"><div class="zone-row-compact" onclick="toggleZone(\'arch-'+z.id+'\')"><span class="zone-compact-type">'+(z.direction==='bull'?'🟢':'🔴')+' '+(z.direction||'').toUpperCase()+' '+(z.zone_type||'').toUpperCase()+'</span><span class="zone-compact-label">['+(z.tf||'').toUpperCase()+']'+esc(z.label||'')+'</span><span class="zone-compact-prices">'+parseFloat(z.btm_price||0).toFixed(5)+' / '+parseFloat(z.top_price||0).toFixed(5)+'</span><span class="zone-compact-status"><span class="status-badge '+(z.status||'')+'">'+z.status+'</span></span>'+mitDate+'<span class="zone-chevron" id="chv-arch-'+z.id+'">▶</span></div><div class="zone-expand" id="ze-arch-'+z.id+'"><div class="form-row"><div class="form-col w100"><span class="field-lbl">STATUS</span><select onchange="restoreZone(\''+z.id+'\',this.value)"><option value="mitigated"'+(z.status==='mitigated'?' selected':'')+'>Mitigated</option><option value="broken"'+(z.status==='broken'?' selected':'')+'>Broken</option><option value="active">↩ Restore Active</option><option value="tested">↩ Restore Tested</option></select></div></div><div style="font-size:11px;color:var(--text2);">'+(z.context_note||'No context')+'</div></div></div>';
  });html+='</div>';}
  html+='</div>';return html;
}

async function restoreZone(zid,newStatus){
  if(newStatus==='active'||newStatus==='tested'){await sb.from('smc_zones').update({status:newStatus,mitigated_at:null}).eq('id',zid);}
  else{await sb.from('smc_zones').update({status:newStatus}).eq('id',zid);}
  showToast('✓ Status actualizat');loadFromSupabase(currentPair);
}
