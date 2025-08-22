// Resources
let resources = {
  wood: 0,
  stone: 0,
  iron: 0,
  oil: 0,
  electricity: 0
};

// Upgrade data (with multiple costs + scaling)
let upgrades = {
  lumberjack: { 
    level: 0, 
    baseCost: { wood: 10 }, 
    cost: { wood: 10 }, 
    rate: 1 
  },
  miner: { 
    level: 0, 
    baseCost: { stone: 10 }, 
    cost: { stone: 10 }, 
    rate: 1 
  },
  mine: { 
    level: 0, 
    baseCost: { iron: 20, wood: 10 }, 
    cost: { iron: 20, wood: 10 }, 
    rate: 1 
  },
  pump: { 
    level: 0, 
    baseCost: { oil: 30, iron: 20 }, 
    cost: { oil: 30, iron: 20 }, 
    rate: 1 
  },
  plant: { 
    level: 0, 
    baseCost: { electricity: 50, iron: 20, oil: 10 }, 
    cost: { electricity: 50, iron: 20, oil: 10 }, 
    rate: 1 
  }
};

// DOM elements
const woodEl = document.getElementById("wood");
const stoneEl = document.getElementById("stone");
const ironEl = document.getElementById("iron");
const oilEl = document.getElementById("oil");
const electricityEl = document.getElementById("electricity");

// Click buttons
document.getElementById("gatherWood").addEventListener("click", () => addResource("wood", 1));
document.getElementById("gatherStone").addEventListener("click", () => addResource("stone", 1));
document.getElementById("gatherIron").addEventListener("click", () => addResource("iron", 1));
document.getElementById("gatherOil").addEventListener("click", () => addResource("oil", 1));
document.getElementById("generatePower").addEventListener("click", () => addResource("electricity", 1));

function addResource(type, amount) {
  resources[type] += amount;
  updateDisplay();
  saveGame();
}

// Upgrade purchase logic with multi-costs + scaling + shake effect
function buyUpgrade(name) {
  let u = upgrades[name];
  let canAfford = true;

  // check affordability
  for (let res in u.cost) {
    if (resources[res] < u.cost[res]) {
      canAfford = false;
      break;
    }
  }

  if (!canAfford) {
    // ❌ Trigger shake + red effect
    const btn = document.getElementById("buy" + capitalize(name));
    btn.classList.add("shake");
    document.body.classList.add("flash-red");

    // remove after animation
    setTimeout(() => {
      btn.classList.remove("shake");
      document.body.classList.remove("flash-red");
    }, 400);

    return; // stop here
  }

  // ✅ subtract costs
  for (let res in u.cost) {
    resources[res] -= u.cost[res];
  }

  u.level++;

  // scale costs: exponential (×1.8 per level, infinite scaling)
  for (let res in u.baseCost) {
    u.cost[res] = Math.floor(u.baseCost[res] * Math.pow(1.8, u.level));
  }

  updateDisplay();
  saveGame();
}

// Upgrade buttons
document.getElementById("buyLumberjack").addEventListener("click", () => buyUpgrade("lumberjack"));
document.getElementById("buyMiner").addEventListener("click", () => buyUpgrade("miner"));
document.getElementById("buyMine").addEventListener("click", () => buyUpgrade("mine"));
document.getElementById("buyPump").addEventListener("click", () => buyUpgrade("pump"));
document.getElementById("buyPlant").addEventListener("click", () => buyUpgrade("plant"));

// Auto-generation loop
setInterval(() => {
  resources.wood += upgrades.lumberjack.level * upgrades.lumberjack.rate;
  resources.stone += upgrades.miner.level * upgrades.miner.rate;
  resources.iron += upgrades.mine.level * upgrades.mine.rate;
  resources.oil += upgrades.pump.level * upgrades.pump.rate;
  resources.electricity += upgrades.plant.level * upgrades.plant.rate;
  updateDisplay();
  saveGame();
}, 1000);

// Update UI
function updateDisplay() {
  woodEl.textContent = resources.wood;
  stoneEl.textContent = resources.stone;
  ironEl.textContent = resources.iron;
  oilEl.textContent = resources.oil;
  electricityEl.textContent = resources.electricity;

  // show multi-costs dynamically
  document.getElementById("buyLumberjack").textContent = 
    `Hire Lumberjack (Cost: ${upgrades.lumberjack.cost.wood} wood, Level: ${upgrades.lumberjack.level})`;
  document.getElementById("buyMiner").textContent = 
    `Hire Miner (Cost: ${upgrades.miner.cost.stone} stone, Level: ${upgrades.miner.level})`;
  document.getElementById("buyMine").textContent = 
    `Build Iron Mine (Cost: ${upgrades.mine.cost.iron} iron, ${upgrades.mine.cost.wood} wood, Level: ${upgrades.mine.level})`;
  document.getElementById("buyPump").textContent = 
    `Build Oil Pump (Cost: ${upgrades.pump.cost.oil} oil, ${upgrades.pump.cost.iron} iron, Level: ${upgrades.pump.level})`;
  document.getElementById("buyPlant").textContent = 
    `Build Power Plant (Cost: ${upgrades.plant.cost.electricity} electricity, ${upgrades.plant.cost.iron} iron, ${upgrades.plant.cost.oil} oil, Level: ${upgrades.plant.level})`;
}

// Save + Load
function saveGame() {
  localStorage.setItem("earthIdleSave", JSON.stringify({ resources, upgrades }));
}

function loadGame() {
  const save = JSON.parse(localStorage.getItem("earthIdleSave"));
  if (save) {
    resources = save.resources || resources;
    for (let key in upgrades) {
      if (save.upgrades[key]) {
        upgrades[key].level = save.upgrades[key].level;
        upgrades[key].cost = save.upgrades[key].cost;
      }
    }
  }
  updateDisplay();
}

loadGame();

// helper
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
