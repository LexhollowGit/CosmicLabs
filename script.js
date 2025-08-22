// ----------------- State -----------------
let resources = {
  wood: 0,
  stone: 0,
  iron: 0,
  oil: 0,
  electricity: 0,
};

// Each upgrade boosts that resource's production per second.
// Costs scale exponentially; levels are infinite.
let upgrades = {
  lumberjack: { level: 0, baseCost: { wood: 10 }, cost: { wood: 10 } },
  miner:      { level: 0, baseCost: { stone: 10 }, cost: { stone: 10 } },
  mine:       { level: 0, baseCost: { iron: 20, wood: 10 }, cost: { iron: 20, wood: 10 } },
  pump:       { level: 0, baseCost: { oil: 30, iron: 20 }, cost: { oil: 30, iron: 20 } },
  plant:      { level: 0, baseCost: { electricity: 50, iron: 20, oil: 10 }, cost: { electricity: 50, iron: 20, oil: 10 } },
};

// Production model: keep +1 increments, just make them happen more often.
// prodPerSec[res] = upgradesForThatRes.level
// accumulators turn fractional production into repeated +1s
let prodPerSec = {
  wood: 0, stone: 0, iron: 0, oil: 0, electricity: 0
};
let accum = { wood: 0, stone: 0, iron: 0, oil: 0, electricity: 0 };

// Which resource’s upgrades are shown on the right
let selected = "wood";

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

// Apply exponential scaling safely
function rescaleCost(u){
  const lvl = clampNum(u.level);
  const base = u.baseCost;
  const next = {};
  for (const k in base){
    next[k] = Math.floor(clampNum(base[k]) * Math.pow(1.8, lvl));
  }
  u.cost = next;
}

// Recompute production per second from levels
function recomputeProd(){
  prodPerSec.wood        = clampNum(upgrades.lumberjack.level);
  prodPerSec.stone       = clampNum(upgrades.miner.level);
  prodPerSec.iron        = clampNum(upgrades.mine.level);
  prodPerSec.oil         = clampNum(upgrades.pump.level);
  prodPerSec.electricity = clampNum(upgrades.plant.level);
}

// Sanitize any old/invalid saves that could cause NaN
function sanitizeState(){
  // resources
  for (const k in resources){
    resources[k] = clampNum(Number(resources[k]));
  }
  // upgrades
  for (const key in upgrades){
    const u = upgrades[key];
    u.level = clampNum(Number(u.level));
    // ensure cost has all base keys
    const fixedCost = {};
    for (const res in u.baseCost){
      const saved = u.cost?.[res];
      fixedCost[res] = clampNum(Number(saved ?? u.baseCost[res]));
    }
    u.cost = fixedCost;
    rescaleCost(u); // ensure consistent with level
  }
  recomputeProd();
}

// ----------------- UI: left/right panels -----------------
function setSelected(res){
  selected = res;
  // left highlight
  document.querySelectorAll(".resource-row").forEach(r=>{
    r.classList.toggle("active", r.dataset.select === res);
  });
  // right panel title
  $("panelTitle").textContent = `Upgrades — ${res[0].toUpperCase()+res.slice(1)}`;
  // show correct upgrades panel
  ["wood","stone","iron","oil","electricity"].forEach(name=>{
    const panel = $("panel-" + name);
    panel.classList.toggle("hidden", name !== res);
  });
}

// ----------------- Upgrade buying -----------------
function tryBuy(upgradeKey, btnEl){
  const u = upgrades[upgradeKey];
  if (!canAfford(u.cost)){
    // error feedback
    btnEl.classList.add("shake","btn-error");
    setTimeout(()=>btnEl.classList.remove("shake","btn-error"), 350);
    return;
  }
  // pay + level up + rescale
  payCost(u.cost);
  u.level = clampNum(u.level) + 1;
  rescaleCost(u);
  recomputeProd();
  updateDisplay();
  saveGame();
}

// ----------------- DOM bindings -----------------
$("gatherWood").addEventListener("click",  ()=> addResource("wood",1));
$("gatherStone").addEventListener("click", ()=> addResource("stone",1));
$("gatherIron").addEventListener("click",  ()=> addResource("iron",1));
$("gatherOil").addEventListener("click",   ()=> addResource("oil",1));
$("generatePower").addEventListener("click",()=> addResource("electricity",1));

function addResource(type, amount){
  resources[type] = clampNum(resources[type]) + clampNum(amount);
  updateDisplay();
  saveGame();
}

// Click left rows to switch folder
document.querySelectorAll(".resource-row").forEach(row=>{
  row.addEventListener("click",(e)=>{
    setSelected(row.dataset.select);
  });
});

// Upgrade buttons
$("buyLumberjack").addEventListener("click",()=>tryBuy("lumberjack", $("buyLumberjack")));
$("buyMiner").addEventListener("click",     ()=>tryBuy("miner", $("buyMiner")));
$("buyMine").addEventListener("click",      ()=>tryBuy("mine", $("buyMine")));
$("buyPump").addEventListener("click",      ()=>tryBuy("pump", $("buyPump")));
$("buyPlant").addEventListener("click",     ()=>tryBuy("plant", $("buyPlant")));

// ----------------- Production loop (+1 steps) -----------------
// Runs with variable dt; converts per-second rates into repeated +1’s.
let last = performance.now();
function tick(){
  const now = performance.now();
  const dt = (now - last) / 1000; // seconds
  last = now;

  // accumulate fractional production
  for (const res of ["wood","stone","iron","oil","electricity"]){
    accum[res] += clampNum(prodPerSec[res]) * dt;
    // turn whole parts into +1 steps
    while (accum[res] >= 1){
      resources[res] = clampNum(resources[res]) + 1;
      accum[res] -= 1;
    }
  }

  updateDisplay();
  // save occasionally (not every frame)
  if (now % 1000 < 16) saveGame();

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ----------------- Display -----------------
function updateDisplay(){
  $("wood").textContent = Math.floor(clampNum(resources.wood));
  $("stone").textContent = Math.floor(clampNum(resources.stone));
  $("iron").textContent = Math.floor(clampNum(resources.iron));
  $("oil").textContent = Math.floor(clampNum(resources.oil));
  $("electricity").textContent = Math.floor(clampNum(resources.electricity));

  // Button labels + costs
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
}

// ----------------- Save / Load -----------------
function saveGame(){
  const save = { resources, upgrades };
  localStorage.setItem("earthIdleSave_v2", JSON.stringify(save));
}

function loadGame(){
  const raw = localStorage.getItem("earthIdleSave_v2")
           || localStorage.getItem("earthIdleSave"); // migrate older key
  if (!raw){ sanitizeState(); setSelected(selected); updateDisplay(); return; }
  try{
    const save = JSON.parse(raw);
    // merge safely
    if (save.resources){
      for (const k in resources){
        resources[k] = clampNum(Number(save.resources[k] ?? 0));
      }
    }
    if (save.upgrades){
      for (const key in upgrades){
        const src = save.upgrades[key] || {};
        upgrades[key].level = clampNum(Number(src.level ?? 0));
        // rebuild cost from level to avoid NaN from old saves
        rescaleCost(upgrades[key]);
      }
    }
  }catch(e){
    // corrupted save, reset
    console.warn("Bad save, resetting", e);
  }
  sanitizeState();
  setSelected(selected);
  updateDisplay();
}
loadGame();
