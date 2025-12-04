// typing-test.js

const totalLevels = 5;

function getProgress() {
  const base = {
    currentLevel: 1,
    totalChars: 0,
    totalCorrect: 0,
    totalTime: 0,
    totalMistakes: 0,
  };

  const saved = localStorage.getItem("typingProgress");
  if (!saved) return base;

  try {
    const p = JSON.parse(saved);
    return {
      currentLevel: typeof p.currentLevel === "number" ? p.currentLevel : 1,
      totalChars: typeof p.totalChars === "number" ? p.totalChars : 0,
      totalCorrect: typeof p.totalCorrect === "number" ? p.totalCorrect : 0,
      totalTime: typeof p.totalTime === "number" ? p.totalTime : 0,
      totalMistakes: typeof p.totalMistakes === "number" ? p.totalMistakes : 0,
    };
  } catch {
    return base;
  }
}

function saveProgress(progress) {
  localStorage.setItem("typingProgress", JSON.stringify(progress));
}

// DOM
const currentLevelEl = document.getElementById("current-level");
const overallAccuracyHomeEl = document.getElementById("overall-accuracy-home");
const overallWpmHomeEl = document.getElementById("overall-wpm-home");
const startLevelBtn = document.getElementById("start-level-btn");
const resetProgressBtn = document.getElementById("reset-progress-btn");

// Init UI
function updateHomeUI() {
  const progress = getProgress();

  if (progress.currentLevel > totalLevels) {
    progress.currentLevel = totalLevels;
    saveProgress(progress);
  }

  currentLevelEl.textContent = progress.currentLevel;

  let overallAcc = 0;
  let overallWpm = 0;

  if (progress.totalChars > 0) {
    const rawAccChars = progress.totalChars - (progress.totalMistakes || 0);
    overallAcc = Math.max(0, rawAccChars) / progress.totalChars;
  }

  if (progress.totalTime > 0 && progress.totalCorrect > 0) {
    const minutes = progress.totalTime / 60;
    overallWpm = Math.round(progress.totalCorrect / 5 / minutes);
  }

  overallAccuracyHomeEl.textContent = `${(overallAcc * 100).toFixed(1)}%`;
  overallWpmHomeEl.textContent = overallWpm.toString();
}

startLevelBtn.addEventListener("click", () => {
  const progress = getProgress();
  const levelToStart = progress.currentLevel || 1;
  window.location.href = `typing-level.html?level=${levelToStart}`;
});

resetProgressBtn.addEventListener("click", () => {
  if (confirm("Reset all typing progress?")) {
    const fresh = {
      currentLevel: 1,
      totalChars: 0,
      totalCorrect: 0,
      totalTime: 0,
      totalMistakes: 0,
    };
    saveProgress(fresh);
    updateHomeUI();
  }
});

updateHomeUI();
