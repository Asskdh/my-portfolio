// ===== Bolt AI Assistant =====

(function () {
  const routes = [
    { keywords: ["home"], action: () => (location.href = "index.html") },
    {
      keywords: ["calculator", "calc"],
      action: () => (location.href = "calc.html"),
    },
    { keywords: ["notes"], action: () => (location.href = "notes.html") },
    {
      keywords: ["typing test"],
      action: () => (location.href = "typing-test.html"),
    },
    {
      keywords: ["typing level"],
      action: () => (location.href = "typing-level.html"),
    },
    { keywords: ["resume"], action: () => window.open("resume.pdf", "_blank") },
    {
      keywords: ["route", "Search City", "route finder", "finder"],
      action: () => (location.href = "route.html"),
    },
  ];

  // Create launcher
  const launcher = document.createElement("div");
  launcher.id = "bolt-launcher";
  launcher.innerHTML = `
  <span class="bolt-robot">🤖</span>
  <span class="bolt-tooltip">Click for assistant</span>`;

  // Welcome bubble
  const bubble = document.createElement("div");
  bubble.id = "bolt-bubble";
  bubble.innerHTML =
    "Hi! I’m <b>Bolt</b>. I can guide you through this website. Ask me anything.";

  // Chat window
  const chat = document.createElement("div");
  chat.id = "bolt-chat";
  chat.innerHTML = `
    <header>
      <span>Bolt Assistant</span>
      <span id="bolt-close">✕</span>
    </header>
    <div id="bolt-messages"></div>
    <div id="bolt-input">
      <input type="text" placeholder="Type a message..." />
      <button>Send</button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(bubble);
  document.body.appendChild(chat);

  // Show welcome every time, then auto-hide after 4 seconds
  setTimeout(() => {
    bubble.style.display = "block";

    setTimeout(() => {
      bubble.style.display = "none";
    }, 4000);
  }, 1000);

  launcher.onclick = () => {
    bubble.style.display = "none";
    chat.style.display = "flex";
  };

  document.getElementById("bolt-close").onclick = () => {
    chat.style.display = "none";
  };

  const input = chat.querySelector("input");
  const btn = chat.querySelector("button");
  const messages = document.getElementById("bolt-messages");

  function addMsg(text, cls) {
    const div = document.createElement("div");
    div.className = `bolt-msg ${cls}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function handleMessage(text) {
    const lower = text.toLowerCase();

    for (const r of routes) {
      if (r.keywords.some((k) => lower.includes(k))) {
        addMsg("Opening that for you…", "bolt-ai");
        setTimeout(r.action, 600);
        return;
      }
    }

    addMsg(
      "I can help you navigate. Try: home, calculator, notes, typing test, resume.",
      "bolt-ai"
    );
  }

  btn.onclick = () => {
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, "bolt-user");
    input.value = "";
    handleMessage(text);
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btn.click();
  });
  // --- Draggable launcher (persists across pages) ---
  let isDragging = false;
  let moved = false;
  let startX = 0,
    startY = 0;
  let startLeft = 0,
    startTop = 0;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  launcher.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    launcher.setPointerCapture(e.pointerId);

    const rect = launcher.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    isDragging = true;
    moved = false;
    launcher.classList.add("bolt-dragging");
  });

  launcher.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // If they moved a bit, treat as drag (prevents accidental click-open)
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;

    const size = launcher.getBoundingClientRect();
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;

    const newLeft = clamp(startLeft + dx, 0, maxX);
    const newTop = clamp(startTop + dy, 0, maxY);

    launcher.style.position = "fixed";
    launcher.style.left = newLeft + "px";
    launcher.style.top = newTop + "px";
    launcher.style.right = "auto"; // disable original right positioning

    // keep bubble near launcher while dragging
    bubble.style.left = "auto";
    bubble.style.top = newTop + size.height + 10 + "px";
    bubble.style.right = "auto";
    bubble.style.left = newLeft + "px";
  });

  launcher.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    launcher.classList.remove("bolt-dragging");

    const rect = launcher.getBoundingClientRect();

    // If it was a drag, don't treat it like a click to open chat
    if (moved) {
      e.stopPropagation();
    }
  });

  // Override click behavior: only open chat if it wasn't a drag
  const oldOnClick = launcher.onclick;
  launcher.onclick = (e) => {
    if (moved) return; // dragged, don't open
    oldOnClick?.(e);
  };
})();
// --- Draggable launcher (persists across pages) ---
const POS_KEY = "bolt_launcher_pos";

// restore saved position
try {
  const saved = JSON.parse(localStorage.getItem(POS_KEY) || "null");
  if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
    launcher.style.left = saved.x + "px";
    launcher.style.top = saved.y + "px";
    launcher.style.right = "auto";
    launcher.style.position = "fixed";
  }
} catch (_) {}

let isDragging = false;
let moved = false;
let startX = 0,
  startY = 0;
let startLeft = 0,
  startTop = 0;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

launcher.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  launcher.setPointerCapture(e.pointerId);

  const rect = launcher.getBoundingClientRect();
  startX = e.clientX;
  startY = e.clientY;
  startLeft = rect.left;
  startTop = rect.top;

  isDragging = true;
  moved = false;
  launcher.classList.add("bolt-dragging");
});

launcher.addEventListener("pointermove", (e) => {
  if (!isDragging) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  // If they moved a bit, treat as drag (prevents accidental click-open)
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;

  const size = launcher.getBoundingClientRect();
  const maxX = window.innerWidth - size.width;
  const maxY = window.innerHeight - size.height;

  const newLeft = clamp(startLeft + dx, 0, maxX);
  const newTop = clamp(startTop + dy, 0, maxY);

  launcher.style.position = "fixed";
  launcher.style.left = newLeft + "px";
  launcher.style.top = newTop + "px";
  launcher.style.right = "auto"; // disable original right positioning

  // keep bubble near launcher while dragging
  bubble.style.left = "auto";
  bubble.style.top = newTop + size.height + 10 + "px";
  bubble.style.right = "auto";
  bubble.style.left = newLeft + "px";
});

launcher.addEventListener("pointerup", (e) => {
  if (!isDragging) return;
  isDragging = false;
  launcher.classList.remove("bolt-dragging");

  const rect = launcher.getBoundingClientRect();
  localStorage.setItem(POS_KEY, JSON.stringify({ x: rect.left, y: rect.top }));

  // If it was a drag, don't treat it like a click to open chat
  if (moved) {
    e.stopPropagation();
  }
});

// Override click behavior: only open chat if it wasn't a drag
const oldOnClick = launcher.onclick;
launcher.onclick = (e) => {
  if (moved) return; // dragged, don't open
  oldOnClick?.(e);
};
