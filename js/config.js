// ── SUPABASE ───────────────────────────────────────────────
var SUPABASE_URL='https://caenefhnwfyzhmneuyjb.supabase.co';
var SUPABASE_KEY='sb_publishable_0mIG5sSi6ueUNELew2G0iQ_7dozolX3';
var sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

// ── CONSTANTS ──────────────────────────────────────────────
var TFS=['weekly','daily','h4','h1'];
var PAIRS=['EURUSD','GBPUSD','USDJPY','USDCAD','AUDUSD','GBPJPY','AUDCHF','AUDNZD','XAUUSD','NAS100','GER40','EURAUD','GBPAUD','USDCHF'];
var NEAR=25;

// ── STATE ──────────────────────────────────────────────────
var appMode='empty';
var currentPair='EURUSD';
var hasData=false;
var livePrice=null;
var livePriceTs=null;
var selectedDay=null;
var activeAnalysisTab='brief';
var allAnalyses=[];
var archivedZones=[];
var journalTrades=[];

function emptyTF(){return{bias:'',obs:[],fvgs:[],events:[],notes:''};}
function emptyTFX(tf){var b=emptyTF();b.eqh='';b.eql='';if(tf==='h1'){b.entry='';b.sl='';b.tp1='';b.tp2='';b.direction='';}return b;}

var pairStates={};
PAIRS.forEach(function(p){pairStates[p]={current_price:'',weekly:emptyTF(),daily:emptyTF(),h4:emptyTFX('h4'),h1:emptyTFX('h1')};});
var state=pairStates['EURUSD'];
