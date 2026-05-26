// ── HEARTBEAT PAGE ─────────────────────────────────────────
var heartbeatDate = new Date().toISOString().slice(0,10);
var heartbeatTF = 'all';
var heartbeatCandles = [];
var heartbeatPage = 0;
var heartbeatPageSize = 200;

async function loadCandles(){
  var startLocal = new Date(heartbeatDate + 'T00:00:00+03:00');
  var endLocal   = new Date(heartbeatDate + 'T23:59:59+03:00');
  var startD = startLocal.toISOString();
  var endD   = endLocal.toISOString();
  // Fetch all — Supabase default limit is 1000, use range to get everything
  var allRows = [];
  var from = 0;
  var batchSize = 1000;
  while(true){
    var query = sb.from('smc_candles').select('*', {count: 'exact'})
      .eq('pair', currentPair)
      .gte('candle_time', startD)
      .lte('candle_time', endD)
      .order('candle_time', {ascending: true})
      .range(from, from + batchSize - 1);
    if(heartbeatTF !== 'all') query = query.eq('tf', heartbeatTF);
    var {data, error, count} = await query;
    if(error){ console.error('Candles load error:', error); break; }
    if(!data || data.length === 0) break;
    allRows = allRows.concat(data);
    console.log('Fetched batch:', from, '-', from+data.length, '| Total so far:', allRows.length, '| DB count:', count);
    if(data.length < batchSize) break;
    from += batchSize;
  }
  heartbeatCandles = allRows;
  heartbeatPage = 0;
  renderAll();
}

function setHeartbeatDate(d){ heartbeatDate = d; loadCandles(); }
function setHeartbeatTF(t){ heartbeatTF = t; loadCandles(); }
function setHeartbeatPage(p){
  var maxPage = Math.ceil(heartbeatCandles.length / heartbeatPageSize) - 1;
  heartbeatPage = Math.max(0, Math.min(p, maxPage));
  renderAll();
}

function exportCandlesCSV(){
  if(heartbeatCandles.length === 0){ showToast('⚠ Nicio candela de exportat'); return; }
  var header = 'Pair,TF,Time,Open,High,Low,Close\n';
  var rows = heartbeatCandles.map(function(c){
    var time = c.candle_time ? new Date(c.candle_time).toLocaleString('en-GB',{hour12:false,timeZone:'Europe/Bucharest'}) : c.ts||'';
    return [c.pair, c.tf, time, c.open, c.high, c.low, c.close].join(',');
  }).join('\n');
  var blob = new Blob([header + rows], {type:'text/csv'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = currentPair + '_candles_' + heartbeatDate + '.csv';
  a.click();
  showToast('✓ CSV exportat — ' + heartbeatCandles.length + ' candele');
}

function renderHeartbeatPage(){
  var tfBtns = ['all','m1','m15','h1','h4','daily','weekly'].map(function(t){
    var lbl = t === 'all' ? 'ALL' : t.toUpperCase();
    var cls = heartbeatTF === t ? ' active' : '';
    return '<button class="mode-btn' + cls + '" onclick="setHeartbeatTF(\'' + t + '\')">' + lbl + '</button>';
  }).join('');

  var totalPages = Math.ceil(heartbeatCandles.length / heartbeatPageSize) || 1;
  var currentPage = heartbeatPage;

  // Pagination controls
  var pageInfo = '<span style="font-size:12px;color:var(--text2);font-weight:600;">Pagina ' + (currentPage+1) + ' / ' + totalPages + '</span>';
  var prevBtn = '<button class="btn btn-ghost btn-sm" onclick="setHeartbeatPage(' + (currentPage-1) + ')" ' + (currentPage===0?'disabled':'') + '>← Prev</button>';
  var nextBtn = '<button class="btn btn-ghost btn-sm" onclick="setHeartbeatPage(' + (currentPage+1) + ')" ' + (currentPage>=totalPages-1?'disabled':'') + '>Next →</button>';
  var firstBtn = '<button class="btn btn-ghost btn-sm" onclick="setHeartbeatPage(0)" ' + (currentPage===0?'disabled':'') + '>⟨⟨ First</button>';
  var lastBtn = '<button class="btn btn-ghost btn-sm" onclick="setHeartbeatPage(' + (totalPages-1) + ')" ' + (currentPage>=totalPages-1?'disabled':'') + '>Last ⟩⟩</button>';

  var html = '<div class="analysis-page">' +
    '<div class="analysis-toolbar">' +
      '<label>📅 DATA</label>' +
      '<input type="date" value="' + heartbeatDate + '" onchange="setHeartbeatDate(this.value)" style="width:160px;font-weight:700;padding:7px 10px;border:2px solid var(--border2);border-radius:8px;">' +
      '<label style="margin-left:10px;">TF</label>' +
      '<div class="mode-toggle">' + tfBtns + '</div>' +
      '<div style="flex:1;"></div>' +
      '<span style="font-size:12px;color:var(--text2);font-weight:600;">' + heartbeatCandles.length + ' candele totale</span>' +
      '<button class="btn btn-green btn-sm" onclick="exportCandlesCSV()">⬇ Export CSV</button>' +
    '</div>';

  if(heartbeatCandles.length === 0){
    html += '<div class="analysis-import-zone">' +
      '<div class="ai-icon">🕯️</div>' +
      '<div class="ai-text">Nicio candela pentru ' + heartbeatDate + '</div>' +
      '<div class="ai-sub">Pine Script-ul trebuie sa trimita PRICE heartbeat cu OHLC.</div>' +
    '</div>';
  } else {
    // Slice for current page
    var start = currentPage * heartbeatPageSize;
    var end = Math.min(start + heartbeatPageSize, heartbeatCandles.length);
    var pageCandles = heartbeatCandles.slice(start, end);

    // Pagination bar top
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">' +
      firstBtn + prevBtn + pageInfo + nextBtn + lastBtn +
      '<span style="font-size:11px;color:var(--text3);">— afișând ' + (start+1) + '–' + end + ' din ' + heartbeatCandles.length + '</span>' +
    '</div>';

    html += '<div style="overflow-x:auto;">' +
      '<table class="journal-table">' +
      '<tr><th>Ora</th><th>TF</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Range (pips)</th><th>Tip</th></tr>';
    pageCandles.forEach(function(c){
      var time = c.candle_time
        ? new Date(c.candle_time).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/Bucharest'})
        : '';
      var o = parseFloat(c.open)||0, h = parseFloat(c.high)||0, l = parseFloat(c.low)||0, cl = parseFloat(c.close)||0;
      var range = Math.round((h - l) * 100000) / 10;
      var isBull = cl >= o;
      var tipCls = isBull ? 'journal-win' : 'journal-loss';
      var tipTxt = isBull ? '🟢 Bull' : '🔴 Bear';
      html += '<tr>' +
        '<td style="font-family:JetBrains Mono,monospace;font-weight:600;">' + time + '</td>' +
        '<td><span class="tf-badge" style="font-size:9px;">' + (c.tf||'').toUpperCase() + '</span></td>' +
        '<td style="font-family:JetBrains Mono,monospace;">' + (o||'').toFixed(5) + '</td>' +
        '<td style="font-family:JetBrains Mono,monospace;color:var(--bull);font-weight:600;">' + (h||'').toFixed(5) + '</td>' +
        '<td style="font-family:JetBrains Mono,monospace;color:var(--bear);font-weight:600;">' + (l||'').toFixed(5) + '</td>' +
        '<td style="font-family:JetBrains Mono,monospace;font-weight:700;">' + (cl||'').toFixed(5) + '</td>' +
        '<td style="font-weight:600;">' + range.toFixed(1) + 'p</td>' +
        '<td class="' + tipCls + '" style="font-weight:700;">' + tipTxt + '</td>' +
      '</tr>';
    });
    html += '</table></div>';

    // Pagination bar bottom
    html += '<div style="display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap;">' +
      firstBtn + prevBtn + pageInfo + nextBtn + lastBtn +
    '</div>';

    // Summary stats (all candles, not just page)
    var totalRange = 0, bulls = 0, bears = 0, highestH = 0, lowestL = 999;
    heartbeatCandles.forEach(function(c){
      var h2 = parseFloat(c.high)||0, l2 = parseFloat(c.low)||0, o2 = parseFloat(c.open)||0, cl2 = parseFloat(c.close)||0;
      totalRange += (h2 - l2);
      if(cl2 >= o2) bulls++; else bears++;
      if(h2 > highestH) highestH = h2;
      if(l2 < lowestL && l2 > 0) lowestL = l2;
    });
    var avgRange = heartbeatCandles.length > 0 ? Math.round((totalRange / heartbeatCandles.length) * 100000) / 10 : 0;
    var dayRange = Math.round((highestH - lowestL) * 100000) / 10;

    html += '<div class="journal-stats" style="margin-top:16px;">' +
      '<div class="journal-stat"><div class="journal-stat-lbl">DAY RANGE</div><div class="journal-stat-val">' + dayRange.toFixed(1) + 'p</div></div>' +
      '<div class="journal-stat"><div class="journal-stat-lbl">AVG CANDLE</div><div class="journal-stat-val">' + avgRange.toFixed(1) + 'p</div></div>' +
      '<div class="journal-stat"><div class="journal-stat-lbl">BULL</div><div class="journal-stat-val" style="color:var(--bull)">' + bulls + '</div></div>' +
      '<div class="journal-stat"><div class="journal-stat-lbl">BEAR</div><div class="journal-stat-val" style="color:var(--bear)">' + bears + '</div></div>' +
      '<div class="journal-stat"><div class="journal-stat-lbl">HIGH</div><div class="journal-stat-val" style="color:var(--bull)">' + highestH.toFixed(5) + '</div></div>' +
      '<div class="journal-stat"><div class="journal-stat-lbl">LOW</div><div class="journal-stat-val" style="color:var(--bear)">' + (lowestL < 999 ? lowestL.toFixed(5) : '—') + '</div></div>' +
    '</div>';
  }

  html += '</div>';
  return html;
}
