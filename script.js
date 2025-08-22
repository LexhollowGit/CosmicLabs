// ----------------- State -----------------
let resources = {
  wood: 0,
  stone: 0,
  iron: 0,
  oil: 0,
  electricity: 0,
};

let storage = {
  wood: 50,
  stone: 50,
  iron: 50,
  oil: 50,
  electricity: 50,
};

let upgrades = {
  lumberjack: { level: 0, baseCost: { wood: 10 }, cost: { wood: 10 } },
  miner:      { level: 0, baseCost: { stone: 10 }, cost: { stone: 10 } },
  mine:       { level: 0, baseCost: { iron: 20, wood: 10 }, cost: { iron: 20, wood: 10 } },
  pump:       { level: 0, baseCost: { oil: 30, iron: 20 }, cost: { oil: 30, iron: 20 } },
  plant:      { level: 0, baseCost: { electricity: 50, iron: 20, oil: 10 }, cost: { electricity: 50, iron: 20, oil: 10 } },

  woodStorage: { level: 0, baseCost: { wood: 20 }, cost: { wood: 20 } },
  stoneStorage: { level: 0, baseCost: { stone: 20 }, cost: { stone: 20 } },
  ironStorage: { level: 0, baseCost: { iron: 30 }, cost: { iron: 30 } },
  oilStorage: { level: 0, baseCost: { oil: 40 }, cost: { oil: 40 } },
  elecStorage: { level: 0, baseCost: { electricity: 50 }, cost: { electricity: 50 } },
};

let prodPerSec = { wood: 0, stone: 0, iron: 0, oil: 0, electricity: 0 };
let accum = { wood: 0, stone: 0, iron: 0, oil: 0, electricity: 0 };
let selected = "wood";

const $ = (id) => document.getElementById(id);

// ----------------- Helpers -----------------
function formatCost(costObj){
  return Object.keys(costObj).map(k => `${costObj[k]} ${k}`).join(", ");
}
function canAfford(costObj){
  for (const k in costObj){ if (resources[k] < costObj[k]) return false; }
  return true;
}
function payCost(costObj){ for (const k in costObj){ resources[k] -= costObj[k]; } }
function rescaleCost(u){
  const lvl = u.level;
  const base = u.baseCost;
  const next = {};
  for (const k in base){ next[k] = Math.floor(base[k] * Math.pow(1.8, lvl)); }
  u.cost = next;
}
function recomputeProd(){
  prodPerSec.wood = upgrades.lumberjack.level;
  prodPerSec.stone = upgrades.miner.level;
  prodPerSec.iron = upgrades.mine.level;
  prodPerSec.oil = upgrades.pump.level;
  prodPerSec.electricity = upgrades.plant.level;
}
function recomputeStorage(){
  storage.wood = 50 + upgrades.woodStorage.level * 50;
  storage.stone = 50 + upgrades.stoneStorage.level * 50;
  storage.iron = 50 + upgrades.ironStorage.level * 50;
  storage.oil = 50 + upgrades.oilStorage.level * 50;
  storage.electricity = 50 + upgrades.elecStorage.level * 50;
}

// ----------------- Folder UI -----------------
function setSelected(res){
  selected = res;
  document.querySelectorAll(".resource-row").forEach(r=>{
    r.classList.toggle("active", r.dataset.select === res);
  });
  $("panelTitle").textContent = `Upgrades — ${res[0].toUpperCase()+res.slice(1)}`;
  ["wood","stone","iron","oil","electricity"].forEach(name=>{
    $("panel-" + name).classList.toggle("hidden", name !== res);
  });
}

// ----------------- Upgrade buying -----------------
function tryBuy(upgradeKey, btnEl){
  const u = upgrades[upgradeKey];
  if (!canAfford(u.cost)){
    btnEl.classList.add("shake");
    setTimeout(()=>btnEl.classList.remove("shake"), 400);
    return;
  }
  payCost(u.cost);
  u.level++;
  rescaleCost(u);
  recomputeProd();
  recomputeStorage();
  updateDisplay();
  saveGame();
}

// ----------------- Resource management -----------------
function addResource(type, amount){
  if (resources[type] + amount <= storage[type]){
    resources[type] += amount;
  }
  updateDisplay();
  saveGame();
}

// ----------------- DOM bindings -----------------
document.querySelectorAll(".resource-row").forEach(row=>{
  row.addEventListener("click",()=>setSelected(row.dataset.select));
});
$("gatherWood").addEventListener("click", ()=>addResource("wood",1));
$("gatherStone").addEventListener("click", ()=>addResource("stone",1));
$("gatherIron").addEventListener("click", ()=>addResource("iron",1));
$("gatherOil").addEventListener("click", ()=>addResource("oil",1));
$("generatePower").addEventListener("click", ()=>addResource("electricity",1));

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

// ----------------- Production loop -----------------
let last = performance.now();
function tick(){
  const now = performance.now();
  const dt = (now - last) / 1000;
  last = now;

  for (const res of ["wood","stone","iron","oil","electricity"]){
    accum[res] += prodPerSec[res] * dt;
    while (accum[res] >= 1){
      addResource(res, 1);
      accum[res] -= 1;
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ----------------- Display -----------------
function updateDisplay(){
  $("wood").textContent = Math.floor(resources.wood) + " / " + storage.wood;
  $("stone").textContent = Math.floor(resources.stone) + " / " + storage.stone;
  $("iron").textContent = Math.floor(resources.iron) + " / " + storage.iron;
  $("oil").textContent = Math.floor(resources.oil) + " / " + storage.oil;
  $("electricity").textContent = Math.floor(resources.electricity) + " / " + storage.electricity;

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

  $("buyWoodStorage").textContent = `Upgrade Storage (Lv ${upgrades.woodStorage.level})`;
  $("cost-woodStorage").textContent = `Cost: ${formatCost(upgrades.woodStorage.cost)}`;
  $("buyStoneStorage").textContent = `Upgrade Storage (Lv ${upgrades.stoneStorage.level})`;
  $("cost-stoneStorage").textContent = `Cost: ${formatCost(upgrades.stoneStorage.cost)}`;
  $("buyIronStorage").textContent = `Upgrade Storage (Lv ${upgrades.ironStorage.level})`;
  $("cost-ironStorage").textContent = `Cost: ${formatCost(upgrades.ironStorage.cost)}`;
  $("buyOilStorage").textContent = `Upgrade Storage (Lv ${upgrades.oilStorage.level})`;
  $("cost-oilStorage").textContent = `Cost: ${formatCost(upgrades.oilStorage.cost)}`;
  $("buyElecStorage").textContent = `Upgrade Storage (Lv ${upgrades.elecStorage.level})`;
  $("cost-elecStorage").textContent = `Cost: ${formatCost(upgrades.elecStorage.cost)}`;
}

// ----------------- Save / Load -----------------
function saveGame(){
  const save = { resources, upgrades };
  localStorage.setItem("earthIdleSave_v3", JSON.stringify(save));
}
function loadGame(){
  const raw = localStorage.getItem("earthIdleSave_v3");
  if (!raw) return;
  try{
    const save = JSON.parse(raw);
    resources = save.resources || resources;
    upgrades = save.upgrades || upgrades;
    recomputeProd();
    recomputeStorage();
  }catch(e){ console.warn("Save corrupted"); }
}
function resetGame(){
  localStorage.removeItem("earthIdleSave_v3");
  location.reload();
}

// Export / Import
$("settingsBtn").addEventListener("click",()=>{
  $("settingsDropdown").classList.toggle("hidden");
});
$("exportSave").addEventListener("click",()=>{
  $("saveText").value = localStorage.getItem("earthIdleSave_v3") || "";
});
$("importSave").addEvent

