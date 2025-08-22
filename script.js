// Resources
let resources = {
  wood: 0,
  stone: 0,
  iron: 0,
  oil: 0,
  electricity: 0
};

// Upgrade data (scaling)
let upgrades = {
  lumberjack: { level: 0, baseCost: 10, cost: 10, resource: "wood", rate: 1 },
  miner: { level: 0, baseCost: 10, cost: 10, resource: "stone", rate: 1 },
  mine: { level: 0, baseCost: 20, cost: 20, resource: "iron", rate: 1 },
  pump: { level: 0, baseCost: 30, cost: 30, resource: "oil", rate: 1 },
  plant: { level: 0, baseCost: 50, cost: 50, resource: "electricity", rate: 1 }
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

// Upgrade purchase logic with scaling
function buyUpgrade(name) {
  let u = upgrades[name];
  if (resources[u.resource] >= u.cost) {
    resources[u.resource] -= u.cost;
    u.level++;
    u.cost = Math.floor(u.baseCost * Math.pow(1.5, u.level)); // cost grows ×1.5
    updateDisplay();
    saveGame();
  }
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

  document.getElementById("buyLumberjack").textContent = `Hire Lumberjack (Cost: ${upgrades.lumberjack.cost} wood)`;
  document.getElementById("buyMiner").textContent = `Hire Miner (Cost: ${upgrades.miner.cost} stone)`;
  document.getElementById("buyMine").textContent = `Build Iron Mine (Cost: ${upgrades.mine.cost} iron)`;
  document.getElementById("buyPump").textContent = `Build Oil Pump (Cost: ${upgrades.pump.cost} oil)`;
  document.getElementById("buyPlant").textContent = `Build Power Plant (Cost: ${upgrades.plant.cost} electricity)`;
}

// Save + Load
function saveGame() {
  localStorage.setItem("earthIdleSave", JSON.stringify({ resources, upgrades }));
}

function loadGame() {
  const save = JSON.parse(localStorage.getItem("earthIdleSave"));
  if (save) {
    resources = save.resources || resources;
    // merge upgrades properly
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
