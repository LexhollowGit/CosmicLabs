// ================= GAME STATE =================
let state = {
  resources: {
    wood: 0, stone: 0, iron: 0, oil: 0, electricity: 0,
    coal: 0, uranium: 0
  },
  generators: {
    lumberjack: 0, miner: 0, mine: 0, pump: 0, plant: 0,
    coalRig: 0, uraniumDrill: 0
  },
  storage: {
    wood: 100, stone: 100, iron: 100, oil: 100, electricity: 100,
    coal: 100, uranium: 100
  },
  upgrades: {
    woodStorage: 0, stoneStorage: 0, ironStorage: 0, oilStorage: 0,
    elecStorage: 0, coalStorage: 0, uraniumStorage: 0
  },
  unlockedDeep: false
};

// ================= CONSTANTS =================
const GENERATOR_BASE_OUTPUT = {
  lumberjack: 1, miner: 1, mine: 1, pump: 1, plant: 1,
  coalRig: 1, uraniumDrill: 1
};
const STORAGE_BASE = 100;
const STORAGE_INCREMENT = 50;
const DEEP_REQ_LEVEL = 5;

// ================= DOM REFERENCES =================
const panels = document.querySelectorAll(".upgrade-panel");
const rows = document.querySelectorAll(".resource-row");
const panelTitle = document.getElementById("panelTitle");
const deepList = document.getElementById("deepList");
const deepHint = document.getElementById("deepHint");
const digBtn = document.getElementById("digDeeperBtn");
const digStatus = document.getElementById("digStatus");

// Settings menu
const settingsBtn = document.getElementById("settingsBtn");
const settingsDropdown = document.getElementById("settingsDropdown");
const exportSaveBtn = document.getElementById("exportSave");
const importSaveBtn = document.getElementById("importSave");
const resetGameBtn = document.getElementById("resetGame");
const saveText = document.getElementById("saveText");

// ================= FUNCTIONS =================
function updateUI() {
  for (let key in state.resources) {
    let el = document.getElementById(key);
    if (el) {
      el.textContent = Math.floor(state.resources[key]);
    }
  }
  for (let g in state.generators) {
    let btn = document.getElementById("buy" + capitalize(g));
    if (btn) btn.textContent = formatGeneratorName(g) + " (Lv " + state.generators[g] + ")";
  }
  for (let s in state.upgrades) {
    let btn = document.getElementById("buy" + capitalize(s));
    if (btn) btn.textContent = "Upgrade Storage (Lv " + state.upgrades[s] + ")";
  }
  updateStats();
}

function updateStats() {
  for (let res in state.resources) {
    let line = document.getElementById("stat-" + res);
    if (line) {
      let genKey = generatorKey(res);
      let output = genKey ? GENERATOR_BASE_OUTPUT[genKey] * state.generators[genKey] : 0;
      line.textContent = `Stored: ${state.resources[res]} / ${state.storage[res]} — Per tick: +${output}`;
    }
  }
}

function generatorKey(resource) {
  switch (resource) {
    case "wood": return "lumberjack";
    case "stone": return "miner";
    case "iron": return "mine";
    case "oil": return "pump";
    case "electricity": return "plant";
    case "coal": return "coalRig";
    case "uranium": return "uraniumDrill";
    default: return null;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatGeneratorName(key) {
  switch (key) {
    case "lumberjack": return "Hire Lumberjack";
    case "miner": return "Hire Miner";
    case "mine": return "Build Iron Mine";
    case "pump": return "Build Oil Pump";
    case "plant": return "Build Power Plant";
    case "coalRig": return "Build Coal Rig";
    case "uraniumDrill": return "Build Uranium Drill";
    default: return key;
  }
}

// Error shake effect
function bumpErrorVisual(btnId) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.add("shake");
    setTimeout(() => btn.classList.remove("shake"), 500);
  }
}

// Check cost even if > storage
function canAfford(cost) {
  for (let r in cost) {
    if (state.resources[r] < cost[r]) return false;
  }
  return true;
}
function payCost(cost) {
  for (let r in cost) {
    state.resources[r] -= cost[r];
  }
}

// ================= DIG DEEPER =================
function tryUnlockDeep() {
  if (state.unlockedDeep) return;
  let surface = ["lumberjack","miner","mine","pump","plant"];
  let allReq = surface.every(g => state.generators[g] >= DEEP_REQ_LEVEL);
  if (allReq || (
    state.resources.wood >= 500 &&
    state.resources.stone >= 500 &&
    state.resources.iron >= 300 &&
    state.resources.oil >= 200 &&
    state.resources.electricity >= 200
  )) {
    revealDeepUI();
    state.unlockedDeep = true;
  }
}
function revealDeepUI() {
  deepList.classList.remove("hidden");
  deepHint.classList.add("hidden");
  digStatus.textContent = "You dug deeper! New resources unlocked.";
  document.body.classList.add("deepUnlocked");
}

// ================= SAVE / LOAD =================
function saveGame() {
  localStorage.setItem("earthIdleSave", JSON.stringify(state));
}
function loadGame() {
  let data = localStorage.getItem("earthIdleSave");
  if (data) {
    state = JSON.parse(data);
    updateUI();
    if (state.unlockedDeep) revealDeepUI();
  }
}
function resetGame() {
  if (!confirm("Are you sure you want to reset everything?")) return;
  localStorage.removeItem("earthIdleSave");
  location.reload();
}

// ================= EVENTS =================
rows.forEach(row => {
  row.addEventListener("click", () => {
    rows.forEach(r => r.classList.remove("active"));
    row.classList.add("active");
    let res = row.dataset.select;
    panels.forEach(p => p.classList.add("hidden"));
    document.getElementById("panel-" + res).classList.remove("hidden");
    panelTitle.textContent = "Upgrades — " + capitalize(res);
  });
});

settingsBtn.addEventListener("click", () => {
  settingsDropdown.classList.toggle("hidden");
});
exportSaveBtn.addEventListener("click", () => {
  saveText.value = JSON.stringify(state);
});
importSaveBtn.addEventListener("click", () => {
  try {
    let obj = JSON.parse(saveText.value);
    state = obj;
    updateUI();
    if (state.unlockedDeep) revealDeepUI();
    saveGame();
    alert("Save imported!");
  } catch (e) {
    alert("Invalid save.");
  }
});
resetGameBtn.addEventListener("click", resetGame);

digBtn.addEventListener("click", tryUnlockDeep);

// ================= TICK LOOP =================
function tick() {
  for (let g in state.generators) {
    let res = Object.keys(state.resources).find(r => generatorKey(r) === g);
    if (res) {
      let gain = GENERATOR_BASE_OUTPUT[g] * state.generators[g];
      state.resources[res] = Math.min(state.resources[res] + gain, state.storage[res]);
    }
  }
  updateUI();
  saveGame();
}
setInterval(tick, 1000);

// ================= INIT =================
loadGame();
updateUI();
