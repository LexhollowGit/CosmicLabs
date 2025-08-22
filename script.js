// ======= State =======
let resources = { wood:0, stone:0, iron:0, oil:0, electricity:0 };

let storage   = { wood:50, stone:50, iron:50, oil:50, electricity:50 };

let upgrades = {
  // generators
  lumberjack: { level:0, baseCost:{ wood:10 },                  cost:{ wood:10 } },
  miner:      { level:0, baseCost:{ stone:10 },                 cost:{ stone:10 } },
  mine:       { level:0, baseCost:{ iron:20, wood:10 },         cost:{ iron:20, wood:10 } },
  pump:       { level:0, baseCost:{ oil:30, iron:20 },          cost:{ oil:30, iron:20 } },
  plant:      { level:0, baseCost:{ electricity:50, iron:20, oil:10 }, cost:{ electricity:50, iron:20, oil:10 } },
  // storage
  woodStorage:{ level:0, baseCost:{ wood:20 },        cost:{ wood:20 } },
  stoneStorage:{ level:0, baseCost:{ stone:20 },      cost:{ stone:20 } },
  ironStorage:{ level:0, baseCost:{ iron:30 },        cost:{ iron:30 } },
  oilStorage: { level:0, baseCost:{ oil:40 },         cost:{ oil:40 } },
  elecStorage:{ level:0, baseCost:{ electricity:60 }, cost:{ electricity:60 } },
};

let prodPerSec = { wood:0, stone:0, iron:0, oil:0, electricity:0 };
let accum      = { wood:0, stone:0, iron:0, oil:0, electricity:0 };
let selected   = "wood";

const $ = (id)=>document.getElementById(id);
const clampNum = (n)=>Number.isFinite(n) ? n : 0;

// ======= Utils =======
function formatCost(obj){ return Object.keys(obj).map(k=>`${obj[k]} ${k}`).join(", "); }

function canAfford(obj){
  for (const k in obj) if (clampNum(resources[k]) < clampNum(obj[k])) return false;
  return true;
}
function payCost(obj){ for (const k in obj) resources[k] = clampNum(resources[k]) - clampNum(obj[k]); }

function rescaleCost(u){
  const lvl = clampNum(u.level);
  const next = {};
  for (const k in u.baseCost){
    next[k] = Math.floor(clampNum(u.baseCost[k]) * Math.pow(1.8, lvl));
  }
  u.cost = next;
}
function recomputeProd(){
  prodPerSec.wood        = clampNum(upgrades.lumberjack.level);
  prodPerSec.stone       = clampNum(upgrades.miner.level);
  prodPerSec.iron        = clampNum(upgrades.mine.level);
  prodPerSec.oil         = clampNum(upgrades.pump.level);
  prodPerSec.electricity = clampNum(upgrades.plant.level);
}
function recomputeStorage(){
  storage.wood        = 50 + 50*clampNum(upgrades.woodStorage.level);
  storage.stone       = 50 + 50*clampNum(upgrades.stoneStorage.level);
  storage.iron        = 50 + 50*clampNum(upgrades.ironStorage.level);
  storage.oil         = 50 + 50*clampNum(upgrades.oilStorage.level);
  storage.electricity = 50 + 50*clampNum(upgrades.elecStorage.level);
}

function sanitizeState(){
  // numbers only
  for (const k in resources) resources[k] = clampNum(Number(resources[k]));
  for (const key in upgrades){
    const u = upgrades[key];
    u.level = clampNum(Number(u.level));
    // rebuild cost from level to avoid NaN from old saves
    rescaleCost(u);
  }
  recomputeProd();
  recomputeStorage();
}

// ======= Folder UI =======
function setSelected(res){
  selected = res;
  document.querySelectorAll(".resource-row").forEach(r=>{
    r.classList.toggle("active", r.dataset.select === res);
  });
  $("panelTitle").textContent = `Upgrades — ${res[0].toUpperCase()+res.slice(1)}`;
  ["wood","stone","iron","oil","electricity"].forEach(name=>{
    $("panel-"+name).classList.toggle("hidden", name !== res);
  });
}

// ======= Buying =======
function bumpErrorVisual(btn){
  btn.classList.add("shake","btn-error");
  $("leftPanel").classList.add("shake");
  $("rightPanel").classList.add("shake");
  setTimeout(()=>{
    btn.classList.remove("shake","btn-error");
    $("leftPanel").classList.remove("shake");
    $("rightPanel").classList.remove("shake");
  },350);
}

function tryBuy(upgradeKey, btnEl){
  const u = upgrades[upgradeKey];
  if (!canAfford(u.cost)){ bumpErrorVisual(btnEl); return; }

  // pay & level
  payCost(u.cost);
  u.level = clampNum(u.level)+1;
  rescaleCost(u);

  // storage growth if storage upgrade
  if (upgradeKey.endsWith("Storage")) recomputeStorage();

  recomputeProd();
  updateDisplay();
  saveGame();
}

// ======= Manual gather =======
function addResource(type, amount){
  const cap = storage[type];
  resources[type] = Math.min(cap, clampNum(resources[type]) + clampNum(amount));
  updateDisplay();
  // (autosave is handled in tick too; cheap to save here as well)
  saveGame();
}

// ======= Bindings =======
document.querySelectorAll(".resource-row").forEach(row=>{
  row.addEventListener("click", ()=>setSelected(row.dataset.select));
});

// gather
$("gatherWood").addEventListener("click", ()=>addResource("wood",1));
$("gatherStone").addEventListener("click", ()=>addResource("stone",1));
$("gatherIron").addEventListener("click", ()=>addResource("iron",1));
$("gatherOil").addEventListener("click", ()=>addResource("oil",1));
$("generatePower").addEventListener("click", ()=>addResource("electricity",1));

// buy
$("buyLumberjack").addEventListener("click", ()=>tryBuy("lumberjack", $("buyLumberjack")));
$("buyMiner").addEventListener("click", ()=>tryBuy("miner", $("buyMiner")));
$("buyMine").addEventListener("click", ()=>tryBuy("mine", $("buyMine")));
$("buyPump").addEventListener("click", ()=>tryBuy("pump", $("buyPump")));
$("buyPlant").addEventListener("click", ()=>tryBuy("plant", $("buyPlant")));

$("buyWoodStorage").addEventListener("click", ()=>tryBuy("woodStorage", $("buyWoodStorage")));
$("buyStoneStorage").addEventListener("click", ()=>tryBuy("stoneStorage", $("buyStoneStorage")));
$("buyIronStorage").addEventListener("click", ()=>tryBuy("ironStorage", $("buyIronStorage")));
$("buyOilStorage").addEventListener("click", ()=>tryBuy("oilStorage", $("buyOilStorage")));
$("buyElecStorage").addEventListener("click", ()=>tryBuy("elecStorage", $("buyElecStorage")));

// ======= Production loop (+1 ticks) =======
let last = performance.now();
function tick(){
  const now = performance.now();
  const dt = (now - last) / 1000; // seconds
  last = now;

  for (const res of ["wood","stone","iron","oil","electricity"]){
    accum[res] += prodPerSec[res] * dt;
    while (accum[res] >= 1){
      // +1 steps look nicer
      const cap = storage[res];
      if (resources[res] < cap) resources[res] = Math.min(cap, resources[res] + 1);
      accum[res] -= 1;
    }
  }

  updateDisplay();
  // autosave roughly once a second
  if ((now|0) % 1000 < 20) saveGame();

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ======= Display =======
function updateDisplay(){
  $("wood").textContent        = `${Math.floor(resources.wood)} / ${storage.wood}`;
  $("stone").textContent       = `${Math.floor(resources.stone)} / ${storage.stone}`;
  $("iron").textContent        = `${Math.floor(resources.iron)} / ${storage.iron}`;
  $("oil").textContent         = `${Math.floor(resources.oil)} / ${storage.oil}`;
  $("electricity").textContent = `${Math.floor(resources.electricity)} / ${storage.electricity}`;

  $("buyLumberjack").textContent = `Hire Lumberjack (Lv ${upgrades.lumberjack.level})`;
  $("cost-lumberjack").textContent = `Cost: ${formatCost(upgrades.lumberjack.cost)}`;

  $("buyMiner").textContent = `Hire Miner (Lv ${upgrades.miner.level})`;
  $("cost-miner").textContent = `Cost: ${formatCost(upgrades.miner.cost)}`;

  $("buyMine").textContent = `Build Iron Mine (Lv ${upgrades.mine.level})`;
  $("cost-mine").textContent = `Cost: ${formatCost(upgrades.mine.cost)}`;

  $("buyPump").textContent = `Build Oil Pump (Lv ${upgrades.pump.level})`;
  $("cost-pump").textContent = `Cost: ${formatCost(upgrades.pump.cost)}`;

  $("buyPlant").textContent = `Build Power Plant (Lv ${upgrades.plant.level})`;
  $("cost-plant").textContent = `Cost: ${formatCost(upgrades.plant.cost)}`;

  $("buyWoodStorage").textContent  = `Upgrade Storage (Lv ${upgrades.woodStorage.level})`;
  $("cost-woodStorage").textContent = `Cost: ${formatCost(upgrades.woodStorage.cost)}`;

  $("buyStoneStorage").textContent  = `Upgrade Storage (Lv ${upgrades.stoneStorage.level})`;
  $("cost-stoneStorage").textContent = `Cost: ${formatCost(upgrades.stoneStorage.cost)}`;

  $("buyIronStorage").textContent  = `Upgrade Storage (Lv ${upgrades.ironStorage.level})`;
  $("cost-ironStorage").textContent = `Cost: ${formatCost(upgrades.ironStorage.cost)}`;

  $("buyOilStorage").textContent  = `Upgrade Storage (Lv ${upgrades.oilStorage.level})`;
  $("cost-oilStorage").textContent = `Cost: ${formatCost(upgrades.oilStorage.cost)}`;

  $("buyElecStorage").textContent  = `Upgrade Storage (Lv ${upgrades.elecStorage.level})`;
  $("cost-elecStorage").textContent = `Cost: ${formatCost(upgrades.elecStorage.cost)}`;
}

// ======= Save / Load / Reset / Import / Export =======
const SAVE_KEY = "earthIdleSave_v4";

function saveGame(){
  const save = { resources, upgrades };
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function loadGame(){
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw){ sanitizeState(); return; }
  try{
    const save = JSON.parse(raw);
    if (save.resources) for (const k in resources) resources[k] = clampNum(Number(save.resources[k] ?? 0));
    if (save.upgrades){
      // merge levels then rebuild costs from base
      for (const key in upgrades){
        const src = save.upgrades[key] || {};
        upgrades[key].level = clampNum(Number(src.level ?? 0));
        rescaleCost(upgrades[key]);
      }
    }
  }catch(e){
    console.warn("Corrupted save, starting fresh.", e);
  }
  sanitizeState();
}

function resetGame(){
  localStorage.removeItem(SAVE_KEY);
  // hard reset memory, then refresh UI
  resources = { wood:0, stone:0, iron:0, oil:0, electricity:0 };
  for (const key in upgrades){
    upgrades[key].level = 0;
    rescaleCost(upgrades[key]);
  }
  sanitizeState();
  setSelected("wood");
  updateDisplay();
}

// settings menu
$("settingsBtn").addEventListener("click", ()=>{
  $("settingsDropdown").classList.toggle("hidden");
});

// export/import
$("exportSave").addEventListener("click", ()=>{
  saveGame();
  $("saveText").value = localStorage.getItem(SAVE_KEY) || "";
});
$("importSave").addEventListener("click", ()=>{
  try{
    const txt = $("saveText").value.trim();
    if (!txt) return;
    localStorage.setItem(SAVE_KEY, txt);
    loadGame();
    setSelected(selected);
    updateDisplay();
    $("settingsDropdown").classList.add("hidden");
  }catch(e){
    alert("Invalid save data.");
  }
});
$("resetGame").addEventListener("click", ()=>{
  if (confirm("Reset everything?")) resetGame();
});

// ======= Boot =======
loadGame();
setSelected("wood");
updateDisplay();
