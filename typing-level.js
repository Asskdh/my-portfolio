// typing-level.js

// ------ LEVEL TEXTS ------
// Level 1: only lowercase + spaces, one long line (no enter)
const level1Text =
  "this is a simple typing exercise for beginners try to stay relaxed and focus on each letter do not rush just keep a steady rhythm and with practice your hands will move more smoothly across the keyboard";

// Level 2: still only lowercase + spaces, no capital letters, no enter
const level2Text =
  "this second level uses only lowercase letters and spaces for extra practice keep your hands relaxed and try not to look at the keyboard stay focused on the screen and let your fingers remember where the keys are";

// Level 3: punctuation + real line breaks
const level3Text =
  "Accuracy is important: small mistakes can change meaning.\n" +
  "Slow down, breathe, and fix errors before they spread.\n" +
  "It's normal to struggle, but don't give up, keep going.\n" +
  "With time, you'll type faster, smoother, and more confidently.";

// Level 4: numbers + punctuation + new lines
const level4Text =
  "Level 4 includes numbers like 123, 45, and 89, plus symbols.\n" +
  "Good habits now will save you 100s of hours in the future.\n" +
  "Stay focused, avoid looking at the keyboard (even if it's hard).\n" +
  "Remember: progress > perfection! Keep going, you're doing great.";

// Level 5: mixed text + new lines
const level5Text =
  "This final level mixes everything: numbers, commas, and quotes.\n" +
  'Typing "clean code" is like writing clear sentences for others.\n' +
  "When you're tired, pause for a minute; don't force mistakes.\n" +
  "You've come far already finish strong and trust your training!";

const levelsTexts = [
  level1Text,
  level2Text,
  level3Text,
  level4Text,
  level5Text,
];
const totalLevels = levelsTexts.length;

// ------ SHARED PROGRESS HELPERS ------
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

// ------ GET LEVEL INDEX FROM URL ------
const params = new URLSearchParams(window.location.search);
let levelIndex = parseInt(params.get("level") || "1", 10) - 1;

if (isNaN(levelIndex) || levelIndex < 0 || levelIndex >= totalLevels) {
  levelIndex = 0;
}

// ------ DOM ELEMENTS ------
const levelTitleEl = document.getElementById("level-title");
const targetTextEl = document.getElementById("target-text");
const typingInputEl = document.getElementById("typing-input");

const timeSecondsEl = document.getElementById("time-seconds");
const mistakesEl = document.getElementById("mistakes-count");
const accuracyEl = document.getElementById("accuracy");
const wpmEl = document.getElementById("wpm");

const feedbackMessageEl = document.getElementById("feedback-message");

const resultOverlayEl = document.getElementById("result-overlay");
const resultTitleEl = document.getElementById("result-title");
const resultDetailsEl = document.getElementById("result-details");
const nextLevelBtn = document.getElementById("next-level-btn");

// ------ STATE ------
const targetText = levelsTexts[levelIndex];
let currentIndex = 0; // current position in target text
let typedState = []; // array of { char, correct }
let wrongAttempts = []; // wrongAttempts[i] = wrong presses at i
let startTime = null;
let finished = false;
let correctChars = 0;
let mistakesCount = 0;

// ------ INIT ------
levelTitleEl.textContent = `Typing Level ${levelIndex + 1}`;
renderTargetText();
renderTypedText();
updateLiveStats();
typingInputEl.focus();

// Block mouse placing caret inside
typingInputEl.addEventListener("mousedown", (e) => {
  e.preventDefault();
  typingInputEl.focus();
});

// Main key handler
typingInputEl.addEventListener("keydown", (e) => {
  if (finished) {
    e.preventDefault();
    return;
  }

  const key = e.key;

  // Block moving back / editing
  const blockedKeys = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "PageUp",
    "PageDown",
    "Tab",
  ];
  if (blockedKeys.includes(key)) {
    e.preventDefault();
    return;
  }

  // For levels 1 & 2: completely block Enter
  if ((levelIndex === 0 || levelIndex === 1) && key === "Enter") {
    e.preventDefault();
    return;
  }

  const isChar = key.length === 1 || key === "Enter";
  if (!isChar) {
    // Ignore Shift, Ctrl, etc.
    return;
  }

  e.preventDefault();

  if (!startTime) {
    startTime = performance.now();
  }

  if (currentIndex >= targetText.length) {
    finishTest();
    return;
  }

  const expectedChar = targetText[currentIndex];
  const pressedChar = key === "Enter" ? "\n" : key;

  // ------ CORRECT KEY ------
  if (pressedChar === expectedChar) {
    if (!typedState[currentIndex]) {
      typedState[currentIndex] = { char: pressedChar, correct: true };
    } else {
      typedState[currentIndex].char = pressedChar;
      typedState[currentIndex].correct = true;
    }

    correctChars++;
    currentIndex++;
    feedbackMessageEl.textContent = "\u00A0"; // clear

    renderTargetText();
    renderTypedText();
    updateLiveStats();

    if (currentIndex >= targetText.length) {
      finishTest();
    }
    return;
  }

  // ------ WRONG KEY ------
  mistakesCount++; // every wrong press counts

  wrongAttempts[currentIndex] = (wrongAttempts[currentIndex] || 0) + 1;

  // Allow first two wrong attempts to appear,
  // block the third+ (still counts as mistake & shakes)
  if (wrongAttempts[currentIndex] <= 2) {
    if (!typedState[currentIndex]) {
      typedState[currentIndex] = { char: pressedChar, correct: false };
    } else {
      typedState[currentIndex].char = pressedChar;
      typedState[currentIndex].correct = false;
    }
    renderTypedText();
  }

  renderTargetText();
  updateLiveStats();
  showWrongFeedback();
});

// ------ RENDER TARGET TEXT ------
function renderTargetText() {
  targetTextEl.innerHTML = "";

  for (let i = 0; i < targetText.length; i++) {
    const ch = targetText[i];

    if (ch === "\n") {
      const arrowSpan = document.createElement("span");
      arrowSpan.textContent = "↵";
      arrowSpan.classList.add("target-char");

      if (i < currentIndex) {
        arrowSpan.classList.add("target-char-done");
      } else if (i === currentIndex) {
        arrowSpan.classList.add("target-char-current");
      }

      targetTextEl.appendChild(arrowSpan);
      targetTextEl.appendChild(document.createElement("br"));
      continue;
    }

    const span = document.createElement("span");
    span.textContent = ch;
    span.classList.add("target-char");

    if (i < currentIndex) {
      span.classList.add("target-char-done");
    } else if (i === currentIndex) {
      span.classList.add("target-char-current");
    }

    targetTextEl.appendChild(span);
  }
}

// ------ RENDER TYPED TEXT ------
function renderTypedText() {
  typingInputEl.innerHTML = "";

  for (let i = 0; i < targetText.length; i++) {
    const targetCh = targetText[i];
    const typed = typedState[i];

    if (targetCh === "\n") {
      if (typed && typed.correct) {
        typingInputEl.appendChild(document.createElement("br"));
      }
      continue;
    }

    const span = document.createElement("span");
    span.classList.add("typed-char");

    if (!typed) {
      span.textContent = "";
    } else {
      span.textContent = typed.char;
      if (typed.correct) {
        span.classList.add("typed-correct");
      } else {
        span.classList.add("typed-wrong");
      }
    }

    typingInputEl.appendChild(span);
  }
}

// ------ UPDATE LIVE STATS ------
function updateLiveStats() {
  const totalChars = targetText.length;

  let elapsedSeconds = 0;
  if (startTime) {
    const now = performance.now();
    elapsedSeconds = (now - startTime) / 1000;
  }

  // accuracy uses mistakes, not just final correctness
  let accuracy = 0;
  if (totalChars > 0) {
    const rawAccChars = totalChars - mistakesCount;
    accuracy = Math.max(0, rawAccChars) / totalChars;
  }

  let wpm = 0;
  if (elapsedSeconds > 0 && correctChars > 0) {
    const minutes = elapsedSeconds / 60;
    wpm = Math.round(correctChars / 5 / minutes);
  }

  timeSecondsEl.textContent = elapsedSeconds.toFixed(2);
  mistakesEl.textContent = mistakesCount.toString();
  accuracyEl.textContent = `${(accuracy * 100).toFixed(1)}%`;
  wpmEl.textContent = wpm.toString();
}

// ------ WRONG FEEDBACK ------
function showWrongFeedback() {
  feedbackMessageEl.textContent = "Wrong";
  typingInputEl.classList.remove("shake");
  void typingInputEl.offsetWidth; // restart animation
  typingInputEl.classList.add("shake");

  setTimeout(() => {
    typingInputEl.classList.remove("shake");
  }, 200);
}

// ------ FINISH TEST ------
function finishTest() {
  if (finished) return;
  finished = true;

  const endTime = performance.now();
  const elapsedSeconds = (endTime - startTime) / 1000;

  const totalChars = targetText.length;

  let accuracy = 0;
  if (totalChars > 0) {
    const rawAccChars = totalChars - mistakesCount;
    accuracy = Math.max(0, rawAccChars) / totalChars;
  }

  let wpm = 0;
  if (elapsedSeconds > 0 && correctChars > 0) {
    const minutes = elapsedSeconds / 60;
    wpm = Math.round(correctChars / 5 / minutes);
  }

  // Final update
  timeSecondsEl.textContent = elapsedSeconds.toFixed(2);
  mistakesEl.textContent = mistakesCount.toString();
  accuracyEl.textContent = `${(accuracy * 100).toFixed(1)}%`;
  wpmEl.textContent = wpm.toString();

  // Update global progress (also store total mistakes)
  const progress = getProgress();
  progress.totalChars += totalChars;
  progress.totalCorrect += correctChars;
  progress.totalTime += elapsedSeconds;
  progress.totalMistakes += mistakesCount;

  const nextLevelNumber = levelIndex + 2;
  if (nextLevelNumber <= totalLevels) {
    progress.currentLevel = nextLevelNumber;
  } else {
    progress.currentLevel = totalLevels;
  }

  saveProgress(progress);

  // Overall stats
  let overallAcc = 0;
  let overallWpm = 0;
  if (progress.totalChars > 0) {
    const rawAccChars = progress.totalChars - (progress.totalMistakes || 0);
    overallAcc = Math.max(0, rawAccChars) / progress.totalChars;
  }
  if (progress.totalTime > 0 && progress.totalCorrect > 0) {
    const minutesOverall = progress.totalTime / 60;
    overallWpm = Math.round(progress.totalCorrect / 5 / minutesOverall);
  }

  const placement = getPlacementLabel(accuracy, wpm);
  const levelNumber = levelIndex + 1;

  resultTitleEl.textContent = `Level ${levelNumber} Finished!`;

  resultDetailsEl.textContent =
    `You just completed Level ${levelNumber}. ` +
    `For this level, you made ${mistakesCount} mistakes, your accuracy was ` +
    `${(accuracy * 100).toFixed(
      1
    )}%, and your speed was around ${wpm} words per minute. ` +
    `Based on your performance on this level, you are currently at ${placement} typing level. ` +
    `Overall so far, you are typing at about ${overallWpm} WPM with ` +
    `${(overallAcc * 100).toFixed(1)}% accuracy. Keep going!`;

  // Disable typing
  typingInputEl.setAttribute("contenteditable", "false");

  // Next level button
  if (levelNumber >= totalLevels) {
    nextLevelBtn.textContent = "Back to Typing Home";
    nextLevelBtn.onclick = () => {
      window.location.href = "typing-test.html";
    };
  } else {
    nextLevelBtn.textContent = "Next Level";
    nextLevelBtn.onclick = () => {
      window.location.href = `typing-level.html?level=${levelNumber + 1}`;
    };
  }

  resultOverlayEl.classList.remove("hidden");
}

function getPlacementLabel(accuracy, wpm) {
  const accPercent = accuracy * 100;

  if (accPercent >= 90 && wpm >= 40) {
    return "Advanced";
  } else if (accPercent >= 75 && wpm >= 25) {
    return "Intermediate";
  } else {
    return "Beginner";
  }
}
