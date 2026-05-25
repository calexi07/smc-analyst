// ── PRICE HEARTBEAT ────────────────────────────────────────
async function fetchLivePrice(){
  try{
    var {data}=await sb.from('smc_prices').select('*').eq('pair',currentPair).maybeSingle();
    if(data && data.price){
      livePrice=parseFloat(data.price);
      livePriceTs=data.updated_at?new Date(data.updated_at):new Date(data.ts||Date.now());
      state.current_price=livePrice.toString();
      updatePriceDisplay();
    }
  }catch(e){console.log('Price fetch err:',e);}
}

function updatePriceDisplay(){
  var el=document.getElementById('priceDisplay');
  var agoEl=document.getElementById('priceAgo');
  if(el && livePrice){
    el.textContent=livePrice.toFixed(5);
    if(livePriceTs && agoEl){
      var sec=Math.floor((Date.now()-livePriceTs.getTime())/1000);
      agoEl.textContent=sec<60?sec+'s ago':Math.floor(sec/60)+'m ago';
    }
  }
}

// Poll every 15s, update ago every 5s
setInterval(fetchLivePrice,15000);
setInterval(updatePriceDisplay,5000);
