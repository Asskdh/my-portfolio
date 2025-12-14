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
})();
