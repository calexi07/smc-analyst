// ── HEARTBEAT PAGE ─────────────────────────────────────────
var heartbeatDate = new Date().toISOString().slice(0,10); // today
var heartbeatTF = 'all';
var heartbeatCandles = [];

async function loadCandles(){
  // Convert selected date (GMT+3 Bucharest) to UTC range for DB query
  // 26/05 00:00 GMT+3 = 25/05 21:00 UTC
  var startLocal = new Date(heartbeatDate + 'T00:00:00+03:00');
  var endLocal   = new Date(heartbeatDate + 'T23:59:59+03:00');
  var startD = startLocal.toISOString();
  var endD   = endLocal.toISOString();
  var query  = sb.from('smc_candles').select('*')
    .eq('pair', currentPair)
    .gte('candle_time', startD)
    .lte('candle_time', endD)
    .order('candle_time', {ascending: true});
  if(heartbeatTF !== 'all') query = query.eq('tf', heartbeatTF);
  var {data, error} = await query;
  if(error) { console.error('Candles load error:', error); heartbeatCandles = []; }
  else heartbeatCandles = data || [];
  renderAll();
}

function setHeartbeatDate(d){ heartbeatDate = d; loadCandles(); }
function setHeartbeatTF(t){ heartbeatTF = t; loadCandles(); }

function exportCandlesCSV(){
  if(heartbeatCandles.length === 0){ showToast('⚠ Nicio candela de exportat'); return; }
  var header = 'Pair,TF,Time,Open,High,Low,Close\n';
  var rows = heartbeatCandles.map(function(c){
    var time = c.candle_time ? new Date(c.candle_time).toLocaleString('en-GB',{hour12:false}) : c.ts||'';
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

  var html = '<div class="analysis-page">' +
    '<div class="analysis-toolbar">' +
      '<label>📅 DATA</label>' +
      '<input type="date" value="' + heartbeatDate + '" onchange="setHeartbeatDate(this.value)" style="width:160px;font-weight:700;padding:7px 10px;border:2px solid var(--border2);border-radius:8px;">' +
      '<label style="margin-left:10px;">TF</label>' +
      '<div class="mode-toggle">' + tfBtns + '</div>' +
      '<div style="flex:1;"></div>' +
      '<span style="font-size:12px;color:var(--text2);font-weight:600;">' + heartbeatCandles.length + ' candele</span>' +
      '<button class="btn btn-green btn-sm" onclick="exportCandlesCSV()">⬇ Export CSV</button>' +
    '</div>';

  if(heartbeatCandles.length === 0){
    html += '<div class="analysis-import-zone">' +
      '<div class="ai-icon">🕯️</div>' +
      '<div class="ai-text">Nicio candela pentru ' + heartbeatDate + '</div>' +
      '<div class="ai-sub">Pine Script-ul trebuie sa trimita PRICE heartbeat cu OHLC. Candelele se salveaza automat in smc_candles.</div>' +
    '</div>';
  } else {
    html += '<div style="overflow-x:auto;">' +
      '<table class="journal-table">' +
      '<tr><th>Ora</th><th>TF</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Range (pips)</th><th>Tip</th></tr>';
    heartbeatCandles.forEach(function(c){
      var time = c.candle_time ? new Date(c.candle_time).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false}) : '';
      var o = parseFloat(c.open)||0, h = parseFloat(c.high)||0, l = parseFloat(c.low)||0, cl = parseFloat(c.close)||0;
      var range = Math.round((h - l) * 100000) / 10;
      var isBull = cl >= o;
      var tipCls = isBull ? 'journal-win' : 'journal-loss';
      var tipTxt = isBull ? '🟢 Bull' : '🔴 Bear';
      html += '<tr>' +
        '<td style="font-family:JetBrains Mono,monospace;font-weight:600;">' + time + '</td>' +
        '<td><span class="tf-badge" style="font-size:9px;">' + (c.tf||'').toUpperCase() + '</span></td>' +
        '<td style="font-family:JetBrains Mono,monospace;">' + o.toFixed(5) + '</td>' +
        '<td style="font-family:JetBrains Mono,monospace;color:var(--bull);font-weight:600;">' + h.toFixed(5) + '</td>' +
        '<td style="font-family:JetBrains Mono,monospace;color:var(--bear);font-weight:600;">' + l.toFixed(5) + '</td>' +
        '<td style="font-family:JetBrains Mono,monospace;font-weight:700;">' + cl.toFixed(5) + '</td>' +
        '<td style="font-weight:600;">' + range.toFixed(1) + 'p</td>' +
        '<td class="' + tipCls + '" style="font-weight:700;">' + tipTxt + '</td>' +
      '</tr>';
    });
    html += '</table></div>';

    // Summary stats
    var totalRange = 0, bulls = 0, bears = 0, highestH = 0, lowestL = 999;
    heartbeatCandles.forEach(function(c){
      var o = parseFloat(c.open)||0, h = parseFloat(c.high)||0, l = parseFloat(c.low)||0, cl = parseFloat(c.close)||0;
      totalRange += (h - l);
      if(cl >= o) bulls++; else bears++;
      if(h > highestH) highestH = h;
      if(l < lowestL && l > 0) lowestL = l;
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
