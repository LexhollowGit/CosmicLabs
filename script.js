// ======= State =======
let resources = {
  wood:0, stone:0, iron:0, oil:0, electricity:0,
  coal:0, uranium:0,            // deep
};

let storage = {
  wood:50, stone:50, iron:50, oil:50, electricity:50,
  coal:50, uranium:50,          // deep
};

let deepUnlocked = false;

// Upgrades (generators + storage). Infinite levels via exponential scaling.
let upgrades = {
  // surface generators
  lumberjack: { level:0, baseCost:{ wood:10 },                  cost:{ wood:10 } },
  miner:      { level:0, baseCost:{ stone:10 },                 cost:{ stone:10 } },
  mine:       { level:0, baseCost:{ iron:20, wood:10 },         cost:{ iron:20, wood:10 } },
  pump:       { level:0, baseCost:{ oil:30, iron:20 },          cost:{ oil:30, iron:20 } },
  plant:      { level:0, baseCost:{ electricity:50, iron:20, oil:10 }, cost:{ electricity:50, iron:20, oil:10 } },
  // surface storage
  woodStorage:{ level:0, baseCost:{ wood:20 },        cost:{ wood:20 } },
  stoneStorage:{ level:0, baseCost:{ stone:20 },      cost:{ stone:20 } },
  ironStorage:{ level:0, baseCost:{ iron:30 },        cost:{ iron:30 } },
  oilStorage: { level:0, baseCost:{ oil:40 },         cost:{ oil:40 } },
  elecStorage:{ level:0, baseCost:{ electricity:50 }, cost:{ electricity:50 } },
  // deep generators
  coalRig:       { level:0, baseCost:{ coal:100, iron:50 },             cost:{ coal:100, iron:50 } },
  uraniumDrill:  { level:0, baseCost:{ uranium:150, iron:100, electricity:200 }, cost:{ uranium:150, iron:100, electricity:200 } },
  // deep storage
  coalStorage:    { level:0, baseCost:{ coal:80 },     cost:{ coal:80 } },
  uraniumStorage: { level:0, baseCost:{ uranium:120 }, cost:{ uranium:120 } },
};

let prodPerSec = { wood:0, stone:0, iron:0, oil:0, electricity:0, coal:0, uranium:0 };
let accum      = { wood:0, stone:0, iron:0, oil:0, electricity:0, coal:0, uranium:0 };
let selected   = "wood";

const $ = (id)=>document.getElementById(id);
const clampNum = (n)=>Number.isFinite(n) ? n : 0;

// ======= Utils =======
function formatCost(obj){
  return Object.keys(obj).map(k=>`${obj[k]} ${k}`).join(", ");
}
function canAfford(obj){
  for (const k in obj) if (clampNum(resources[k]) < clampNum(obj[k])) return false;
  return true;
}
function payCost(obj){
  for (const k in obj) resources[k] = clampNum(resources[k]) - clampNum(obj[k]);
}
function rescaleCost(u){
  const lvl = clampNum(u.level);
  const next = {};
  for (const k in u.baseCost){
    next[k] = Math.floor(clampNum(u.baseCost[k]) * Math.pow(1.8, lvl));
  }
  u.cost = next;
}
function recomputeProd(){
  // each level = +1 per second (rendered as many +1 ticks)
  prodPerSec.wood        = clampNum(upgrades.lumberjack.level);
  prodPerSec.stone       = clampNum(upgrades.miner.level);
  prodPerSec.iron        = clampNum(upgrades.mine.level);
  prodPerSec.oil         = clampNum(upgrades.pump.level);
  prodPerSec.electricity = clampNum(upgrades.plant.level);
  prodPerSec.coal        = clampNum(upgrades.coalRig.level);
  prodPerSec.uranium     = clampNum(upgrades.uraniumDrill.level);
}
function recomputeStorage(){
  // base 50 + 50 per storage level
  storage.wood        = 50 + 50*clampNum(upgrades.woodStorage.level);
  storage.stone       = 50 + 50*clampNum(upgrades.stoneStorage.level);
  storage.iron        = 50 + 50*clampNum(upgrades.ironStorage.level);
  storage.oil         = 50 + 50*clampNum(upgrades.oilStorage.level);
  storage.electricity = 50 + 50*clampNum(upgrades.elecStorage.level);
  storage.coal        = 50 + 50*clampNum(upgrades.coalStorage.level);
  storage.uranium     = 50 + 50*clampNum(upgrades.uraniumStorage.level);
}
function sanitizeState(){
  for (const k in resources) resources[k] = clampNum(Number(resources[k]));
  for (const key in upgrades){
    const u = upgrades[key];
    u.level = clampNum(Number(u.level));
    rescaleCost(u);
  }
  recomputeProd();
  recomputeStorage();
}

// ======= Deep Unlock Logic =======
const DEEP_REQ_LEVEL = 5; // need Lv 5 on all surface generators
const DEEP_PAY_COST = { wood:500, stone:500, iron:300, oil:200, electricity:200 };

function meetsDeepReq(){
  return upgrades.lumberjack.level >= DEEP_REQ_LEVEL &&
         upgrades.miner.level      >= DEEP_REQ_LEVEL &&
         upgrades.mine.level       >= DEEP_REQ_LEVEL &&
         upgrades.pump.level       >= DEEP_REQ_LEVEL &&
         upgrades.plant.level      >= DEEP_REQ_LEVEL;
}
function revealDeepUI(){
  deepUnlocked = true;
  $("deepList").classList.remove("hidden");
  $("deepHint").classList.add("hidden");
  $("digStatus").textContent = "Deep resources unlocked!";
  $("digDeeperBtn").disabled = true;
  $("digReq").textContent = "Unlocked. Explore the new resource folders on the left!";
}
function tryUnlockDeep(){
  if (deepUnlocked) return;
  if (meetsDeepReq()) { revealDeepUI(); saveGame(); return; }
  if (canAfford(DEEP_PAY_COST)) {
    payCost(DEEP_PAY_COST);
    revealDeepUI();
    updateDisplay();
    saveGame();
  } else {
    bumpErrorVisual($("digDeeperBtn"));
  }
}

// ======= Folder UI =======
function setSelected(res){
  selected = res;
  document.querySelectorAll(".resource-row").forEach(r=>{
    r.classList.toggle("active", r.dataset.select === res);
  });
  $("panelTitle").textContent = `Upgrades — ${res[0].toUpperCase()+res.slice(1)}`;
  const panels = ["wood","stone","iron","oil","electricity","coal","uranium"];
  panels.forEach(name=>{
    const p = $("panel-"+name);
    if (p) p.classList.toggle("hidden", name !== res);
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

  payCost(u.cost);
  u.level = clampNum(u.level)+1;
  rescaleCost(u);

  // storage expansion
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
  saveGame();
}

// ======= Bindings =======
// left folders
document.querySelectorAll(".resource-row").forEach(row=>{
  row.addEventListener("click", ()=>setSelected(row.dataset.select));
});

// gather (surface)
$("gatherWood").addEventListener("click", ()=>addResource("wood",1));
$("gatherStone").addEventListener("click", ()=>addResource("stone",1));
$("gatherIron").addEventListener("click", ()=>addResource("iron",1));
$("gatherOil").addEventListener("click", ()=>addResource("oil",1));
$("generatePower").addEventListener("click", ()=>addResource("electricity",1));
// gather (deep)
$("gatherCoal").addEventListener("click", ()=>addResource("coal",1));
$("gatherUranium").addEventListener("click", ()=>addResource("uranium",1));

// buy (surface gens)
$("buyLumberjack").addEventListener("click", ()=>tryBuy("lumberjack", $("buyLumberjack")));
$("buyMiner").addEventListener("click",      ()=>tryBuy("miner", $("buyMiner")));
$("buyMine").addEventListener("click",       ()=>tryBuy("mine", $("buyMine")));
$("buyPump").addEventListener("click",       ()=>tryBuy("pump", $("buyPump")));
$("buyPlant").addEventListener("click",      ()=>tryBuy("plant", $("buyPlant")));
// buy (surface storage)
$("buyWoodStorage").addEventListener("click", ()=>tryBuy("woodStorage", $("buyWoodStorage")));
$("buyStoneStorage").addEventListener("click",()=>tryBuy("stoneStorage", $("buyStoneStorage")));
$("buyIronStorage").addEventListener("click", ()=>tryBuy("ironStorage", $("buyIronStorage")));
$("buyOilStorage").addEventListener("click",  ()=>tryBuy("oilStorage", $("buyOilStorage")));
$("buyElecStorage").addEventListener("click", ()=>tryBuy("elecStorage", $("buyElecStorage")));
// buy (deep)
$("buyCoalRig").addEventListener("click",        ()=>tryBuy("coalRig", $("buyCoalRig")));
$("buyCoalStorage").addEventListener("click",    ()=>tryBuy("coalStorage", $("buyCoalStorage")));
$("buyUraniumDrill").addEventListener("click",   ()=>tryBuy("uraniumDrill", $("buyUraniumDrill")));
$("buyUraniumStorage").addEventListener("click", ()=>tryBuy("uraniumStorage", $("buyUraniumStorage")));

// dig deeper control (inside Electricity panel)
$("digDeeperBtn").addEventListener("click", tryUnlockDeep);

// ======= Production loop (+1 ticks) =======
let last = performance.now();
function tick(){
  const now = performance.now();
  const dt = (now - last) / 1000; // seconds
  last = now;

  for (const res of ["wood","stone","iron","oil","electricity","coal","uranium"]){
    accum[res] += prodPerSec[res] * dt;
    while (accum[res] >= 1){
      const cap = storage[res];
      if (resources[res] < cap) resources[res] = Math.min(cap, resources[res] + 1);
      accum[res] -= 1;
    }
  }

  // live deep requirement status
  if (!deepUnlocked){
    const reqOK = meetsDeepReq();
    $("digDeeperBtn").disabled = false;
    $("digStatus").textContent = reqOK ? "Requirement met — you can dig now!" : "";
  }

  updateDisplay();
  if ((now|0) % 1000 < 20) saveGame(); // autosave about once/sec
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ======= Display =======
function statLine(resName, prod, cap){
  return `Production: ${prod}/s   |   Capacity: ${cap}`;
}
function updateDisplay(){
  // counts
  $("wood").textContent        = `${Math.floor(resources.wood)} / ${storage.wood}`;
  $("stone").textContent       = `${Math.floor(resources.stone)} / ${storage.stone}`;
  $("iron").textContent        = `${Math.floor(resources.iron)} / ${storage.iron}`;
  $("oil").textContent         = `${Math.floor(resources.oil)} / ${storage.oil}`;
  $("electricity").textContent = `${Math.floor(resources.electricity)} / ${storage.electricity}`;
  $("coal").textContent        = `${Math.floor(resources.coal)} / ${storage.coal}`;
  $("uranium").textContent     = `${Math.floor(resources.uranium)} / ${storage.uranium}`;

  // stat lines
  $("stat-wood").textContent        = statLine("wood",        prodPerSec.wood,        storage.wood);
  $("stat-stone").textContent       = statLine("stone",       prodPerSec.stone,       storage.stone);
  $("stat-iron").textContent        = statLine("iron",        prodPerSec.iron,        storage.iron);
  $("stat-oil").textContent         = statLine("oil",         prodPerSec.oil,         storage.oil);
  $("stat-electricity").textContent = statLine("electricity", prodPerSec.electricity, storage.electricity);
  $("stat-coal").textContent        = statLine("coal",        prodPerSec.coal,        storage.coal);
  $("stat-uranium").textContent     = statLine("uranium",     prodPerSec.uranium,     storage.uranium);

  // labels + costs (surface gens)
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

  // storage (surface)
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

  // deep labels + costs
  $("buyCoalRig").textContent = `Build Coal Rig (Lv ${upgrades.coalRig.level})`;
  $("cost-coalRig").textContent = `Cost: ${formatCost(upgrades.coalRig.cost)}`;

  $("buyCoalStorage").textContent = `Upgrade Storage (Lv ${upgrades.coalStorage.level})`;
  $("cost-coalStorage").textContent = `Cost: ${formatCost(upgrades.coalStorage.cost)}`;

  $("buyUraniumDrill").textContent = `Build Uranium Drill (Lv ${upgrades.uraniumDrill.level})`;
  $("cost-uraniumDrill").textContent = `Cost: ${formatCost(upgrades.uraniumDrill.cost)}`;

  $("buyUraniumStorage").textContent = `Upgrade Storage (Lv ${upgrades.uraniumStorage.level})`;
  $("cost-uraniumStorage").textContent = `Cost: ${formatCost(upgrades.uraniumStorage.cost)}`;

  // deep UI visibility
  if (deepUnlocked){
    $("deepList").classList.remove("hidden");
    $("deepHint").classList.add("hidden");
    $("digDeeperBtn").disabled = true;
    $("digReq").textContent = "Unlocked. Explore the new resource folders on the left!";
    $("digStatus").textContent = "Deep resources unlocked!";
  }else{
    $("digReq").innerHTML = `Requirement: reach Lv ${DEEP_REQ_LEVEL} in all surface generators
      <br>— or pay: ${formatCost(DEEP_PAY_COST)}`;
  }
}

// ======= Save / Load / Reset / Import / Export / Settings =======
const SAVE_KEY = "earthIdleSave_v5";

function saveGame(){
  const save = { resources, upgrades, storage, deepUnlocked };
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
function loadGame(){
  // migrate from v4 if present
  const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem("earthIdleSave_v4");
  if (!raw){ sanitizeState(); return; }
  try{
    const save = JSON.parse(raw);

    if (save.resources){
      for (const k in resources){
        resources[k] = clampNum(Number(save.resources[k] ?? resources[k]));
      }
    }
    if (save.upgrades){
      for (const key in upgrades){
        const src = save.upgrades[key] || {};
        upgrades[key].level = clampNum(Number(src.level ?? 0));
        rescaleCost(upgrades[key]);
      }
    }
    if (save.storage){
      for (const k in storage){
        storage[k] = clampNum(Number(save.storage[k] ?? storage[k]));
      }
    }
    if (typeof save.deepUnlocked === "boolean") deepUnlocked = save.deepUnlocked;

  }catch(e){
    console.warn("Corrupted save, starting fresh.", e);
  }
  sanitizeState();
  // if already meets req but not marked, unlock
  if (!deepUnlocked && meetsDeepReq()) revealDeepUI();
}
function resetGame(){
  localStorage.removeItem(SAVE_KEY);
  resources = { wood:0, stone:0, iron:0, oil:0, electricity:0, coal:0, uranium:0 };
  for (const key in upgrades){ upgrades[key].level = 0; rescaleCost(upgrades[key]); }
  deepUnlocked = false;
  sanitizeState();
  setSelected("wood");
  updateDisplay();
}

// settings dropdown behavior
$("settingsBtn").addEventListener("click", (e)=>{
  e.stopPropagation();
  $("settingsDropdown").classList.toggle("hidden");
});
document.addEventListener("click", (e)=>{
  const dd = $("settingsDropdown");
  if (!dd.classList.contains("hidden")){
    const within = dd.contains(e.target) || $("settingsBtn").contains(e.target);
    if (!within) dd.classList.add("hidden");
  }
});
document.addEventListener("keydown", (e)=>{
  if (e.key === "Escape") $("settingsDropdown").classList.add("hidden");
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
