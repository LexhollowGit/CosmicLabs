// Resources
let resources = {
  wood: 0,
  stone: 0,
  iron: 0,
  oil: 0,
  electricity: 0
};

// Upgrades (auto-generation per second)
let upgrades = {
  lumberjack: 0,
  miner: 0,
  mine: 0,
  pump: 0,
  plant: 0
};

// DOM elements
const woodEl = document.getElementById("wood");
const stoneEl = document.getElementById("stone");
const ironEl = document.getElementById("iron");
const oilEl = document.getElementById("oil");
const electricityEl = document.getElementById("electricity");

// Buttons
document.getElementById("gatherWood").addEventListener("click", () => {
  resources.wood++;
  updateDisplay();
  saveGame();
});

document.getElementById("gatherStone").addEventListener("click", () => {
  resources.stone++;
  updateDisplay();
  saveGame();
});

document.getElementById("gatherIron").addEventListener("click", () => {
  resources.iron++;
  updateDisplay();
  saveGame();
});

document.getElementById("gatherOil").addEventListener("click", () => {
  resources.oil++;
  updateDisplay();
  saveGame();
});

document.getElementById("generatePower").addEventListener("click", () => {
  resources.electricity++;
  updateDisplay();
  saveGame();
});

// Buy upgrades
document.getElementById("buyLumberjack").addEventListener("click", () => {
  if (resources.wood >= 50) {
    resources.wood -= 50;
    upgrades.lumberjack++;
    updateDisplay();
  }
});

document.getElementById("buyMiner").addEventListener("click", () => {
  if (resources.stone >= 50) {
    resources.stone -= 50;
    upgrades.miner++;
    updateDisplay();
  }
});

document.getElementById("buyMine").addEventListener("click", () => {
  if (resources.iron >= 100 && resources.wood >= 50) {
    resources.iron -= 100;
    resources.wood -= 50;
    upgrades.mine++;
    updateDisplay();
  }
});

document.getElementById("buyPump").addEventListener("click", () => {
  if (resources.oil >= 200 && resources.iron >= 100) {
    resources.oil -= 200;
    resources.iron -= 100;
    upgrades.pump++;
    updateDisplay();
  }
});

document.getElementById("buyPlant").addEventListener("click", () => {
  if (resources.electricity >= 500 && resources.iron >= 200 && resources.oil >= 100) {
    resources.electricity -= 500;
    resources.iron -= 200;
    resources.oil -= 100;
    upgrades.plant++;
    updateDisplay();
  }
});

// Auto-generation loop
setInterval(() => {
  resources.wood += upgrades.lumberjack;
  resources.stone += upgrades.miner;
  resources.iron += upgrades.mine;
  resources.oil += upgrades.pump;
  resources.electricity += upgrades.plant;
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
}

// Save + Load
function saveGame() {
  localStorage.setItem("earthIdleSave", JSON.stringify({ resources, upgrades }));
}

function loadGame() {
  const save = JSON.parse(localStorage.getItem("earthIdleSave"));
  if (save) {
    resources = save.resources || resources;
    upgrades = save.upgrades || upgrades;
  }
  updateDisplay();
}

loadGame();
