// Resource
let energy = 0;

// Get elements
const energyDisplay = document.getElementById("energy");
const collectBtn = document.getElementById("collect");

// Collect energy when clicking
collectBtn.addEventListener("click", () => {
  energy += 1;
  updateDisplay();
  saveGame();
});

// Update resource display
function updateDisplay() {
  energyDisplay.textContent = energy;
}

// Save to localStorage
function saveGame() {
  localStorage.setItem("cosmicLabsSave", JSON.stringify({ energy }));
}

// Load saved game
function loadGame() {
  const save = JSON.parse(localStorage.getItem("cosmicLabsSave"));
  if (save) {
    energy = save.energy || 0;
  }
  updateDisplay();
}

// Auto-gain energy every second
setInterval(() => {
  energy += 1; // gain 1 energy per second
  updateDisplay();
  saveGame();
}, 1000); // 1000 ms = 1 second

loadGame();
