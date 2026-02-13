// ================= Bolt Assistant (HTML + JS in ONE file) =================

const BACKEND_URL = "https://bolt-backend-lake.vercel.app/api/chat";

const routes = [
  { k: ["home"], u: "index.html" },
  { k: ["calculator", "calc"], u: "calc.html" },
  { k: ["typing test"], u: "typing-test.html" },
  {
    k: ["route", "route finder", "flight", "bfs", "shortest"],
    u: "route.html",
  },
];

// 1️⃣ Inject HTML automatically
function injectAssistantHTML() {
  if (document.getElementById("bolt-launcher")) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div id="bolt-launcher" title="Click for assistant">
      <span class="bolt-robot">🤖</span>
      <span class="bolt-tooltip">Click for assistant</span>
    </div>

    <div id="bolt-bubble">
      Hi! I’m <b>Bolt</b>. I can guide you through this website.
    </div>

    <div id="bolt-chat">
      <header>
        <span>Bolt Assistant</span>
        <span id="bolt-close">✕</span>
      </header>

      <div id="bolt-messages"></div>

      <div id="bolt-input">
        <input id="bolt-text" placeholder="Type a message..." />
        <button id="bolt-send">Send</button>
      </div>
    </div>
  `
  );
}

const $ = (id) => document.getElementById(id);

function addMsg(text, cls) {
  const box = $("bolt-messages");
  const div = document.createElement("div");
  div.className = `bolt-msg ${cls}`;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function matchRoute(text) {
  text = text.toLowerCase();
  for (const r of routes) {
    if (r.k.some((k) => text.includes(k))) return r.u;
  }
  return null;
}

async function sendToBackend(message) {
  const r = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await r.json();
  return data.reply;
}

// Welcome message every refresh
function setupWelcome() {
  setTimeout(() => {
    $("bolt-bubble").style.display = "block";
    setTimeout(() => {
      $("bolt-bubble").style.display = "none";
    }, 4000);
  }, 2000);
}

// Drag + open logic
function setupLauncher() {
  const launcher = $("bolt-launcher");
  const bubble = $("bolt-bubble");

  let dragging = false;
  let moved = false;
  let sx, sy, sl, st;

  launcher.onpointerdown = (e) => {
    launcher.setPointerCapture(e.pointerId);
    const r = launcher.getBoundingClientRect();
    sx = e.clientX;
    sy = e.clientY;
    sl = r.left;
    st = r.top;
    dragging = true;
    moved = false;
  };

  launcher.onpointermove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;

    launcher.style.left = sl + dx + "px";
    launcher.style.top = st + dy + "px";
    launcher.style.right = "auto";

    bubble.style.left = sl + dx + "px";
    bubble.style.top = st + dy + 66 + "px";
  };

  launcher.onpointerup = () => (dragging = false);

  launcher.onclick = () => {
    if (moved) return;
    $("bolt-chat").style.display = "flex";
    $("bolt-text").focus();
    bubble.style.display = "none";
  };
}

function setupChat() {
  $("bolt-close").onclick = () => {
    $("bolt-chat").style.display = "none";
  };

  async function send() {
    const input = $("bolt-text");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";

    addMsg(text, "bolt-user");

    const route = matchRoute(text);
    if (route) {
      addMsg("Opening that for you…", "bolt-ai");
      setTimeout(() => (location.href = route), 500);
      return;
    }

    addMsg("Thinking…", "bolt-ai");
    try {
      const reply = await sendToBackend(text);
      addMsg(reply, "bolt-ai");
    } catch {
      addMsg("Server error.", "bolt-ai");
    }
  }

  $("bolt-send").onclick = send;
  $("bolt-text").onkeydown = (e) => {
    if (e.key === "Enter") send();
  };
}

// BOOT
document.addEventListener("DOMContentLoaded", () => {
  injectAssistantHTML();
  setupWelcome();
  setupLauncher();
  setupChat();
});
