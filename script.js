// ===== State =====
let resources = {
  wood:0, stone:0, iron:0, oil:0, electricity:0,
  coal:0, uranium:0, gold:0, diamond:0, lava:0, plasma:0
};

let storage = {
  wood:50, stone:50, iron:50, oil:50, electricity:50,
  coal:50, uranium:50, gold:50, diamond:50, lava:50, plasma:50
};

let prodPerSec = {};

// ===== Upgrades =====
let upgrades = {
  woodGenerator:{ level:0, baseCost:{ wood:20 }, cost:{ wood:20 } },
  woodStorage:{ level:0, baseCost:{ wood:50 }, cost:{ wood:50 } },
  stoneGenerator:{ level:0, baseCost:{ stone:20 }, cost:{ stone:20 } },
  stoneStorage:{ level:0, baseCost:{ stone:50 }, cost:{ stone:50 } },
  ironGenerator:{ level:0, baseCost:{ iron:20 }, cost:{ iron:20 } },
  ironStorage:{ level:0, baseCost:{ iron:50 }, cost:{ iron:50 } },
  oilPump:{ level:0, baseCost:{ oil:30 }, cost:{ oil:30 } },
  oilStorage:{ level:0, baseCost:{ oil:50 }, cost:{ oil:50 } },
  coalRig:{ level:0, baseCost:{ coal:50 }, cost:{ coal:50 } },
  coalStorage:{ level:0, baseCost:{ coal:50 }, cost:{ coal:50 } },
  uraniumDrill:{ level:0, baseCost:{ uranium:70 }, cost:{ uranium:70 } },
  uraniumStorage:{ level:0, baseCost:{ uranium:70 }, cost:{ uranium:70 } },

  goldMine:{ level:0, baseCost:{ gold:200, iron:150 }, cost:{ gold:200, iron:150 } },
  goldStorage:{ level:0, baseCost:{ gold:150 }, cost:{ gold:150 } },
  diamondExtractor:{ level:0, baseCost:{ diamond:300, iron:200, gold:150 }, cost:{ diamond:300, iron:200, gold:150 } },
  diamondStorage:{ level:0, baseCost:{ diamond:200 }, cost:{ diamond:200 } },
  lavaPump:{ level:0, baseCost:{ lava:500, uranium:300 }, cost:{ lava:500, uranium:300 } },
  lavaStorage:{ level:0, baseCost:{ lava:250 }, cost:{ lava:250 } },
  plasmaReactor:{ level:0, baseCost:{ plasma:800, uranium:500, lava:400 }, cost:{ plasma:800, uranium:500, lava:400 } },
  plasmaStorage:{ level:0, baseCost:{ plasma:400 }, cost:{ plasma:400 } },
};

// ===== Helpers =====
function $(id){ return document.getElementById(id); }

function clampNum(n){ return Math.max(0,n); }

// ===== Production =====
function recomputeProd(){
  prodPerSec.wood = clampNum(upgrades.woodGenerator.level);
  prodPerSec.stone = clampNum(upgrades.stoneGenerator.level);
  prodPerSec.iron = clampNum(upgrades.ironGenerator.level);
  prodPerSec.oil = clampNum(upgrades.oilPump.level);
  prodPerSec.coal = clampNum(upgrades.coalRig.level);
  prodPerSec.uranium = clampNum(upgrades.uraniumDrill.level);

  prodPerSec.gold = clampNum(upgrades.goldMine.level);
  prodPerSec.diamond = clampNum(upgrades.diamondExtractor.level);
  prodPerSec.lava = clampNum(upgrades.lavaPump.level);
  prodPerSec.plasma = clampNum(upgrades.plasmaReactor.level);
}

function recomputeStorage(){
  storage.wood = 50 + 50*upgrades.woodStorage.level;
  storage.stone = 50 + 50*upgrades.stoneStorage.level;
  storage.iron = 50 + 50*upgrades.ironStorage.level;
  storage.oil = 50 + 50*upgrades.oilStorage.level;
  storage.coal = 50 + 50*upgrades.coalStorage.level;
  storage.uranium = 50 + 50*upgrades.uraniumStorage.level;

  storage.gold = 50 + 50*upgrades.goldStorage.level;
  storage.diamond = 50 + 50*upgrades.diamondStorage.level;
  storage.lava = 50 + 50*upgrades.lavaStorage.level;
  storage.plasma = 50 + 50*upgrades.plasmaStorage.level;
}

// ===== Game Logic =====
function addResource(res, amt){
  resources[res] = Math.min(storage[res], resources[res] + amt);
  updateDisplay();
}

function tryBuy(upgradeKey, btn){
  let up = upgrades[upgradeKey];
  for (let [res,cost] of Object.entries(up.cost)){
    if (resources[res] < cost){
      btn.classList.add("shake");
      setTimeout(()=>btn.classList.remove("shake"),400);
      return;
    }
  }
  for (let [res,cost] of Object.entries(up.cost)){
    resources[res] -= cost;
  }
  up.level++;
  for (let res in up.baseCost){ up.cost[res] = Math.floor(up.baseCost[res] * Math.pow(1.5, up.level)); }
  recomputeProd();
  recomputeStorage();
  updateDisplay();
}

function updateDisplay(){
  for (let res in resources){
    $(res).textContent = resources[res];
    $(res+"Storage").textContent = storage[res];
  }
  updateBackground();
}

function tick(){
  for (let res in prodPerSec){
    addResource(res, prodPerSec[res]);
  }
}

function updateBackground(){
  let depth = 0;
  if (upgrades.coalRig.level > 0 || upgrades.uraniumDrill.level > 0) depth = 1;
  if (upgrades.goldMine.level > 0 || upgrades.diamondExtractor.level > 0) depth = 2;
  if (upgrades.lavaPump.level > 0) depth = 3;
  if (upgrades.plasmaReactor.level > 0) depth = 4;
  document.body.className = ["skyLayer","rockLayer","crystalLayer","lavaLayer","voidLayer"][depth];
}

// ===== Events =====
$("gatherWood").onclick = ()=>addResource("wood",1);
$("gatherStone").onclick = ()=>addResource("stone",1);
$("gatherIron").onclick = ()=>addResource("iron",1);
$("gatherOil").onclick = ()=>addResource("oil",1);
$("gatherCoal").onclick = ()=>addResource("coal",1);
$("gatherUranium").onclick = ()=>addResource("uranium",1);
$("gatherGold").onclick = ()=>addResource("gold",1);
$("gatherDiamond").onclick = ()=>addResource("diamond",1);
$("gatherLava").onclick = ()=>addResource("lava",1);
$("gatherPlasma").onclick = ()=>addResource("plasma",1);

$("buyWoodGenerator").onclick = ()=>tryBuy("woodGenerator",$("buyWoodGenerator"));
$("buyWoodStorage").onclick = ()=>tryBuy("woodStorage",$("buyWoodStorage"));
$("buyStoneGenerator").onclick = ()=>tryBuy("stoneGenerator",$("buyStoneGenerator"));
$("buyStoneStorage").onclick = ()=>tryBuy("stoneStorage",$("buyStoneStorage"));
$("buyIronGenerator").onclick = ()=>tryBuy("ironGenerator",$("buyIronGenerator"));
$("buyIronStorage").onclick = ()=>tryBuy("ironStorage",$("buyIronStorage"));
$("buyOilPump").onclick = ()=>tryBuy("oilPump",$("buyOilPump"));
$("buyOilStorage").onclick = ()=>tryBuy("oilStorage",$("buyOilStorage"));
$("buyCoalRig").onclick = ()=>tryBuy("coalRig",$("buyCoalRig"));
$("buyCoalStorage").onclick = ()=>tryBuy("coalStorage",$("buyCoalStorage"));
$("buyUraniumDrill").onclick = ()=>tryBuy("uraniumDrill",$("buyUraniumDrill"));
$("buyUraniumStorage").onclick = ()=>tryBuy("uraniumStorage",$("buyUraniumStorage"));
$("buyGoldMine").onclick = ()=>tryBuy("goldMine",$("buyGoldMine"));
$("buyGoldStorage").onclick = ()=>tryBuy("goldStorage",$("buyGoldStorage"));
$("buyDiamondExtractor").onclick = ()=>tryBuy("diamondExtractor",$("buyDiamondExtractor"));
$("buyDiamondStorage").onclick = ()=>tryBuy("diamondStorage",$("buyDiamondStorage"));
$("buyLavaPump").onclick = ()=>tryBuy("lavaPump",$("buyLavaPump"));
$("buyLavaStorage").onclick = ()=>tryBuy("lavaStorage",$("buyLavaStorage"));
$("buyPlasmaReactor").onclick = ()=>tryBuy("plasmaReactor",$("buyPlasmaReactor"));
$("buyPlasmaStorage").onclick = ()=>tryBuy("plasmaStorage",$("buyPlasmaStorage"));

// ===== Settings menu =====
$("menuBtn").onclick = ()=>{
  $("settingsDropdown").classList.toggle("hidden");
};

$("resetGame").onclick = ()=>{
  if (confirm("Reset game?")){
    localStorage.clear();
    location.reload();
  }
};

$("exportSave").onclick = ()=>{
  let data = JSON.stringify({resources,upgrades});
  navigator.clipboard.writeText(data);
  alert("Save copied to clipboard!");
};

$("importSave").onclick = ()=>{
  let raw = prompt("Paste your save:");
  try {
    let save = JSON.parse(raw);
    resources = save.resources;
    upgrades = save.upgrades;
    recomputeProd(); recomputeStorage(); updateDisplay();
  } catch(e){ alert("Invalid save"); }
};

// ===== Init =====
recomputeProd();
recomputeStorage();
setInterval(tick,1000);
updateDisplay();
