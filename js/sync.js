// ── SYNC TIMER ─────────────────────────────────────────────
var syncTimer=null;
function schedulSync(){clearTimeout(syncTimer);syncTimer=setTimeout(function(){syncToSupabase();},2000);}

// ── SAVE TO SUPABASE ───────────────────────────────────────
async function syncToSupabase(){
  setSyncStatus('syncing');
  try{
    var pair=currentPair;
    var ctx={pair:pair,weekly_bias:state.weekly.bias,daily_bias:state.daily.bias,h4_bias:state.h4.bias,h1_bias:state.h1.bias,
      weekly_notes:state.weekly.notes,daily_notes:state.daily.notes,h4_notes:state.h4.notes,h1_notes:state.h1.notes,
      h4_eqh:state.h4.eqh,h4_eql:state.h4.eql,h1_eqh:state.h1.eqh,h1_eql:state.h1.eql,
      h1_entry:state.h1.entry,h1_sl:state.h1.sl,h1_tp1:state.h1.tp1,h1_tp2:state.h1.tp2,h1_direction:state.h1.direction,
      updated_at:new Date().toISOString()};
    await sb.from('smc_context').upsert(ctx,{onConflict:'pair'});

    await sb.from('smc_zones').delete().eq('pair',pair).in('status',['active','tested']);
    var zones=[];
    TFS.forEach(function(tf){
      state[tf].obs.forEach(function(z){if(z.status==='active'||z.status==='tested'){
        zones.push({id:z._id,pair:pair,tf:tf,zone_type:'ob',direction:z.type,top_price:z.top,btm_price:z.btm,
          label:z.label,status:z.status,formed_date:z.formed_date||null,formed_time:z.formed_time||null,
          context_note:z.ob_note||'',tags:z.tags||[],update_history:z.update_history||[],mitigated_at:z.mitigated_at||null});}});
      state[tf].fvgs.forEach(function(z){if(z.status==='active'||z.status==='tested'){
        zones.push({id:z._id,pair:pair,tf:tf,zone_type:'fvg',direction:z.type,top_price:z.entry,btm_price:z.exit,
          label:z.label,status:z.status,formed_date:z.formed_date||null,formed_time:z.formed_time||null,
          context_note:z.fvg_note||'',tags:z.tags||[],update_history:z.update_history||[],mitigated_at:z.mitigated_at||null});}});
    });
    if(zones.length>0)await sb.from('smc_zones').upsert(zones,{onConflict:'id'});

    await sb.from('smc_events').delete().eq('pair',pair);
    var events=[];
    TFS.forEach(function(tf){
      state[tf].events.forEach(function(ev){
        events.push({id:ev._id,pair:pair,tf:tf,event_type:ev.type,direction:ev.dir,price:ev.price||null,
          event_date:ev.date||null,event_time:ev.time||null});});
    });
    if(events.length>0)await sb.from('smc_events').insert(events);

    setSyncStatus('synced');
  }catch(e){console.error('Sync error:',e);setSyncStatus('error');}
}

// ── LOAD FROM SUPABASE ─────────────────────────────────────
async function loadFromSupabase(pair){
  pair=pair||currentPair;
  try{
    var {data:priceData}=await sb.from('smc_prices').select('*').eq('pair',pair).maybeSingle();
    if(priceData && priceData.price){
      livePrice=parseFloat(priceData.price);
      livePriceTs=priceData.updated_at?new Date(priceData.updated_at):new Date(priceData.ts||Date.now());
      state.current_price=livePrice.toString();
      updatePriceDisplay();
    }

    var {data:ctx}=await sb.from('smc_context').select('*').eq('pair',pair).maybeSingle();
    if(ctx){
      state.weekly.bias=ctx.weekly_bias||'';state.daily.bias=ctx.daily_bias||'';
      state.h4.bias=ctx.h4_bias||'';state.h1.bias=ctx.h1_bias||'';
      state.weekly.notes=ctx.weekly_notes||'';state.daily.notes=ctx.daily_notes||'';
      state.h4.notes=ctx.h4_notes||'';state.h1.notes=ctx.h1_notes||'';
      state.h4.eqh=ctx.h4_eqh||'';state.h4.eql=ctx.h4_eql||'';
      state.h1.eqh=ctx.h1_eqh||'';state.h1.eql=ctx.h1_eql||'';
      state.h1.entry=ctx.h1_entry||'';state.h1.sl=ctx.h1_sl||'';
      state.h1.tp1=ctx.h1_tp1||'';state.h1.tp2=ctx.h1_tp2||'';
      state.h1.direction=ctx.h1_direction||'';
    }

    // Map DB tf values (Pine: '1','4','D','W') to dashboard keys
    var tfMap={'1':'h1','60':'h1','H1':'h1','h1':'h1','4':'h4','240':'h4','H4':'h4','h4':'h4','D':'daily','1D':'daily','daily':'daily','W':'weekly','1W':'weekly','weekly':'weekly'};
    function mapTF(raw){return tfMap[raw]||null;}

    var {data:zoneRows}=await sb.from('smc_zones').select('*').eq('pair',pair).in('status',['active','tested']);
    TFS.forEach(function(tf){state[tf].obs=[];state[tf].fvgs=[];});
    (zoneRows||[]).forEach(function(r){
      var tf=mapTF(r.tf);if(!tf)return;
      var isOB=r.zone_type==='ob';
      // Sanitize formed_time: if ISO string, extract HH:mm
      var ft=r.formed_time||'';
      if(ft.indexOf('T')>=0) ft=ft.slice(ft.indexOf('T')+1,ft.indexOf('T')+6);
      if(ft.length>5) ft=ft.slice(0,5);
      var z={_id:r.id,type:r.direction,status:r.status,label:r.label||'',
        formed_date:r.formed_date||'',formed_time:ft,
        tags:r.tags||[],update_history:r.update_history||[],mitigated_at:r.mitigated_at||null};
      if(isOB){z.top=r.top_price;z.btm=r.btm_price;z.ob_note=r.context_note||'';}
      else{z.entry=r.top_price;z.exit=r.btm_price;z.fvg_note=r.context_note||'';}
      state[tf][isOB?'obs':'fvgs'].push(z);
    });

    var {data:archRows}=await sb.from('smc_zones').select('*').eq('pair',pair).in('status',['mitigated','broken']);
    archivedZones=archRows||[];

    var {data:evRows}=await sb.from('smc_events').select('*').eq('pair',pair);
    TFS.forEach(function(tf){state[tf].events=[];});
    (evRows||[]).forEach(function(r){
      var tf=mapTF(r.tf);if(!tf)return;
      state[tf].events.push({_id:r.id,type:r.event_type,dir:r.direction,price:r.price||'',date:r.event_date||'',time:r.event_time||''});
    });

    var {data:anRows}=await sb.from('smc_analyses').select('*').eq('pair',pair).order('created_at',{ascending:false});
    allAnalyses=anRows||[];

    var {data:jRows}=await sb.from('smc_journal').select('*').eq('pair',pair).order('date',{ascending:false});
    journalTrades=jRows||[];

    checkHasData();
    renderAll();
  }catch(e){console.error('Load error:',e);}
}
