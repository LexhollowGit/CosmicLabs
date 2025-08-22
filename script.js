// Resources
let resources = {
  wood: 0,
  stone: 0,
  iron: 0,
  oil: 0,
  electricity: 0
};

// Upgrade data
let upgrades = {
  lumberjack: { level: 0, baseCost: { wood: 10 }, cost: { wood: 10 }, rate: 1 },
  miner: { level: 0, baseCost: { stone: 10 }, cost: { stone: 10 }, rate: 1 },
  mine: { level: 0, baseCost: { iron: 20, wood: 10 }, cost: { iron: 20, wood: 10 }, rate: 1 },
  pump: { level: 0, baseCost: { oil: 30, iron: 20 }, cost: { oil: 30, iron: 20 }, rate: 1 },
  plant: { level: 0, baseCost: { electricity: 50, iron: 20, oil: 10 }, cost: { electricity: 50, iron: 20, oil: 10 }, rate: 1 }
};

// DOM
const woodEl = document.getElementById("wood");
const stoneEl = document.getElementById("stone");
const ironEl = document.getElementById("iron");
const oilEl = document.getElementById("oil");
const electricityEl = document.getElementById("electricity");

// Toggle upgrade folder
function toggleUpgrades(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === "block" ? "none" : "block";
}

// Gather resources
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

// Buy upgrade
function buyUpgrade(name, btnId) {
  let u = upgrades[name];
  let affordable = true;

  for (let res in u.cost) {
    if (!resources[res] || resources[res] < u.cost[res]) {
      affordable = false;
      break;
    }
  }

  if (!affordable) {
    let btn = document.getElementById(btnId);
    btn.classList.add("shake", "flash-red");
    setTimeout(() => btn.classList.remove("shake", "flash-red"), 400);
    return;
  }

  for (let res in u.cost) {
    resources[res] -= u.cost[res];
  }

  u.level++;
  u.rate = 1 + u.level; // smooth +1 per tick, not big jumps

  for (let res in u.baseCost) {
    u.cost[res] = Math.floor(u.baseCost[res] * Math.pow(1.8, u.level));
  }

  updateDisplay();
  saveGame();
}

// Auto generation
setInterval(() => {
  resources.wood += upgrades.lumberjack.level * upgrades.lumberjack.rate;
  resources.stone += upgrades.miner.level * upgrades.miner.rate;
  resources.iron += upgrades.mine.level * upgrades.mine.rate;
  resources.oil += upgrades.pump.level * upgrades.pump.rate;
  resources.electricity += upgrades.plant.level * upgrades.plant.rate;
  updateDisplay();
  saveGame();
}, 1000);

// UI update
function updateDisplay() {
  woodEl.textContent = resources.wood;
  stoneEl.textContent = resources.stone;
  ironEl.textContent = resources.iron;
  oilEl.textContent = resources.oil;
  electricityEl.textContent = resources.electricity;

  document.getElementById("buyLumberjack").textContent =
    `Hire Lumberjack (Cost: ${upgrades.lumberjack.cost.wood} wood, Lv: ${upgrades.lumberjack.level})`;
  document.getElementById("buyMiner").textContent =
    `Hire Miner (Cost: ${upgrades.miner.cost.stone} stone, Lv: ${upgrades.miner.level})`;
  document.getElementById("buyMine").textContent =
    `Build Iron Mine (Cost: ${upgrades.mine.cost.iron} iron, ${upgrades.mine.cost.wood} wood, Lv: ${upgrades.mine.level})`;
  document.getElementById("buyPump").textContent =
    `Build Oil Pump (Cost: ${upgrades.pump.cost.oil} oil, ${upgrades.pump.cost.iron} iron, Lv: ${upgrades.pump.level})`;
  document.getElementById("buyPlant").textContent =
    `Build Power Plant (Cost: ${upgrades.plant.cost.electricity} elec, ${upgrades.plant.cost.iron} iron, ${upgrades.plant.cost.oil} oil, Lv: ${upgrades.plant.level})`;
}

// Save/load
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
        upgrades[key].rate = save.upgrades[key].rate;
      }
    }
  }
  updateDisplay();
}
loadGame();

// Buttons
document.getElementById("buyLumberjack").addEventListener("click", () => buyUpgrade("lumberjack", "buyLumberjack"));
document.getElementById("buyMiner").addEventListener("click", () => buyUpgrade("miner", "buyMiner"));
document.getElementById("buyMine").addEventListener("click", () => buyUpgrade("mine", "buyMine"));
document.getElementById("buyPump").addEventListener("click", () => buyUpgrade("pump", "buyPump"));
document.getElementById("buyPlant").addEventListener("click", () => buyUpgrade("plant", "buyPlant"));
