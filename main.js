// keep the year up to date
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// small JS to support touch devices: tap to open dropdown
const dropdown = document.getElementById("worksDropdown");
if (dropdown) {
  const trigger = dropdown.querySelector("a");

  const addTapLogic = () => {
    const narrow = window.matchMedia("(max-width: 900px)").matches;
    if (!narrow) return;
    const onClick = (e) => {
      e.preventDefault();
      dropdown.classList.toggle("open");
      const expanded = dropdown.classList.contains("open");
      trigger.setAttribute("aria-expanded", expanded);
    };
    // avoid double-binding
    trigger.removeEventListener("click", onClick);
    trigger.addEventListener("click", onClick);

    // close when clicking outside
    const outside = (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    };
    document.removeEventListener("click", outside);
    document.addEventListener("click", outside);
  };

  addTapLogic();
  window.addEventListener("resize", () => {
    // re-evaluate on resize once
    addTapLogic();
  });
}

// Flip card on click
const calcCard = document.getElementById("calcCard");
if (calcCard) {
  calcCard.addEventListener("click", () => {
    calcCard.classList.toggle("flipped");
  });
}
const notesCard = document.getElementById("notesCard");
if (notesCard) {
  notesCard.addEventListener("click", () => {
    notesCard.classList.toggle("flipped");
  });
}
const dictCard = document.getElementById("dictCard");
if (dictCard) {
  dictCard.addEventListener("click", () => {
    dictCard.classList.toggle("flipped");
  });
}
// ---- Dark mode toggle with persistence ----------------------------
(function () {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  const setIcon = () => {
    const dark = document.body.classList.contains("dark");
    btn.textContent = dark ? "☀️" : "🌙";
    btn.setAttribute("aria-pressed", String(dark));
  };

  // Load saved theme or system preference
  const saved = localStorage.getItem("theme"); // 'dark' | 'light' | null
  if (saved) {
    document.body.classList.toggle("dark", saved === "dark");
  } else {
    // default to system preference if nothing saved
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    document.body.classList.toggle("dark", prefersDark);
  }
  setIcon();

  // Toggle on click and save
  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark") ? "dark" : "light"
    );
    setIcon();
  });
})();
