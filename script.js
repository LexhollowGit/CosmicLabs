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

// Each upgrade boosts that resource's production per second.
// Costs scale exponentially; levels are infinite.
let upgrades = {
  lumberjack: { level: 0, baseCost: { wood: 10 }, cost: { wood: 10 } },
  miner:      { level: 0, baseCost: { stone: 10 }, cost: { stone: 10 } },
  mine:       { level: 0, baseCost: { iron: 20, wood: 10 }, cost: { iron: 20, wood: 10 } },
  pump:       { level: 0, baseCost: { oil: 30, iron: 20 }, cost: { oil: 30, iron: 20 } },
  plant:      { level: 0, baseCost: { electricity: 50, iron: 20, oil: 10 }, cost: { electricity: 50, iron: 20, oil: 10 } },

  // Storage upgrades
  woodStorage:        { level: 0, baseCost: { wood: 25 }, cost: { wood: 25 } },
  stoneStorage:       { level: 0, baseCost: { stone: 25 }, cost: { stone: 25 } },
  ironStorage:        { level: 0, baseCost: { iron: 50 }, cost: { iron: 50 } },
  oilStorage:         { level: 0, baseCost: { oil: 75 }, cost: { oil: 75 } },
  electricityStorage: { level: 0, baseCost: { electricity: 100 }, cost: { electricity: 100 } },
};

// Production model
let prodPerSec = { wood: 0, stone: 0, iron: 0, oil: 0, electricity: 0 };
let accum = { wood: 0, stone: 0, iron: 0, oil: 0, electricity: 0 };

let selected = "wood"; // Which resource’s upgrades are shown

// ----------------- Helpers -----------------
const $ = (id) => document.getElementById(id);
const clampNum = (n) => (Number.isFinite(n) ? n : 0);

function formatCost(costObj){
  return Object.keys(costObj)
    .map(k => `${costObj[k]} ${k}`)
    .join(", ");
}

function canAfford(costObj){
  for (const k in costObj){
    if (clampNum(resources[k]) < clampNum(costObj[k])) return false;
  }
  return true;
}
function payCost(costObj){
  for (const k in costObj){
    resources[k] = clampNum(resources[k]) - clampNum(costObj[k]);
  }
}

// Exponential scaling
function rescaleCost(u){
  const lvl = clampNum(u.level);
  const base = u.baseCost;
  const next = {};
  for (const k in base){
    next[k] = Math.floor(clampNum(base[k]) * Math.pow(1.8, lvl));
  }
  u.cost = next;
}

// Recompute production per second
function recomputeProd(){
  prodPerSec.wood        = clampNum(upgrades.lumberjack.level);
  prodPerSec.stone       = clampNum(upgrades.miner.level);
  prodPerSec.iron        = clampNum(upgrades.mine.level);
  prodPerSec.oil         = clampNum(upgrades.pump.level);
  prodPerSec.electricity = clampNum(upgrades.plant.level);
}

// ----------------- UI Selection -----------------
function setSelected(res){
  selected = res;
  document.querySelectorAll(".resource-row").forEach(r=>{
    r.classList.toggle("active", r.dataset.select === res);
  });
  $("panelTitle").textContent = `Upgrades — ${res[0].toUpperCase()+res.slice(1)}`;
  ["wood","stone","iron","oil","electricity"].forEach(name=>{
    const panel = $("panel-" + name);
    panel.classList.toggle("hidden", name !== res);
  });
}

// ----------------- Buying -----------------
function tryBuy(upgradeKey, btnEl){
  const u = upgrades[upgradeKey];
  if (!canAfford(u.cost)){
    btnEl.classList.add("shake","btn-error");
    setTimeout(()=>btnEl.classList.remove("shake","btn-error"), 350);
    return;
  }
  payCost(u.cost);
  u.level = clampNum(u.level) + 1;
  rescaleCost(u);

  // If it's a storage upgrade, expand cap
  if (upgradeKey.includes("Storage")){
    const resName = upgradeKey.replace("Storage","");
    storage[resName] += 50; // each storage upgrade adds +50 capacity
  }

  recomputeProd();
  updateDisplay();
  saveGame();
}

// ----------------- Manual gathering -----------------
function addResource(type, amount){
  resources[type] = Math.min(storage[type], clampNum(resources[type]) + clampNum(amount));
  updateDisplay();
  saveGame();
}

$("gatherWood").addEventListener("click",  ()=> addResource("wood",1));
$("gatherStone").addEventListener("click", ()=> addResource("stone",1));
$("gatherIron").addEventListener("click",  ()=> addResource("iron",1));
$("gatherOil").addEventListener("click",   ()=> addResource("oil",1));
$("generatePower").addEventListener("click",()=> addResource("electricity",1));

// ----------------- Production loop -----------------
let last = performance.now();
function tick(){
  const now = performance.now();
  const dt = (now - last) / 1000;
  last = now;

  for (const res of ["wood","stone","iron","oil","electricity"]){
    accum[res] += clampNum(prodPerSec[res]) * dt;
    while (accum[res] >= 1){
      resources[res] = Math.min(storage[res], clampNum(resources[res]) + 1);
      accum[res] -= 1;
    }
  }

  updateDisplay();
  if (now % 1000 < 16) saveGame();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ----------------- Display -----------------
function updateDisplay(){
  for (const res of ["wood","stone","iron","oil","electricity"]){
    $(res).textContent = `${Math.floor(clampNum(resources[res]))} / ${storage[res]}`;
  }

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

  // Storage buttons
  $("buyWoodStorage").textContent = `Upgrade Wood Storage (Lv ${upgrades.woodStorage.level})`;
  $("cost-woodStorage").textContent = `Cost: ${formatCost(upgrades.woodStorage.cost)}`;

  $("buyStoneStorage").textContent = `Upgrade Stone Storage (Lv ${upgrades.stoneStorage.level})`;
  $("cost-stoneStorage").textContent = `Cost: ${formatCost(upgrades.stoneStorage.cost)}`;

  $("buyIronStorage").textContent = `Upgrade Iron Storage (Lv ${upgrades.ironStorage.level})`;
  $("cost-ironStorage").textContent = `Cost: ${formatCost(upgrades.ironStorage.cost)}`;

  $("buyOilStorage").textContent = `Upgrade Oil Storage (Lv ${upgrades.oilStorage.level})`;
  $("cost-oilStorage").textContent = `Cost: ${formatCost(upgrades.oilStorage.cost)}`;

  $("buyElectricityStorage").textContent = `Upgrade Power Storage (Lv ${upgrades.electricityStorage.level})`;
  $("cost-electricityStorage").textContent = `Cost: ${formatCost(upgrades.electricityStorage.cost)}`;
}

// ----------------- Save / Load -----------------
function saveGame(){
  const save = { resources, upgrades, storage };
  localStorage.setItem("earthIdleSave_v3", JSON.stringify(save));
}

function loadGame(){
  const raw = localStorage.getItem("earthIdleSave_v3");
  if (!raw){ sanitizeState(); setSelected(selected); updateDisplay(); return; }
  try{
    const save = JSON.parse(raw);
    if (save.resources){
      for (const k in resources){
        resources[k] = clampNum(Number(save.resources[k] ?? 0));
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
        storage[k] = clampNum(Number(save.storage[k] ?? 50));
      }
    }
  }catch(e){
    console.warn("Bad save, resetting", e);
  }
  recomputeProd();
  setSelected(selected);
  updateDisplay();
}
loadGame();
