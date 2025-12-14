// ==============================
// Main JS (dropdown + flip cards + dark mode)
// ==============================

// keep the year up to date
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ------------------------------
// Dropdown (touch support)
// ------------------------------
const dropdown = document.getElementById("worksDropdown");

if (dropdown) {
  const trigger = dropdown.querySelector("a");

  const enableTapDropdown = () => {
    const narrow = window.matchMedia("(max-width: 900px)").matches;

    // On wide screens: rely on CSS hover, and ensure "open" class is removed.
    if (!narrow) {
      dropdown.classList.remove("open");
      trigger?.setAttribute("aria-expanded", "false");
      return;
    }

    // On narrow screens: tap to toggle dropdown.
    const onTriggerClick = (e) => {
      e.preventDefault();
      dropdown.classList.toggle("open");
      const expanded = dropdown.classList.contains("open");
      trigger.setAttribute("aria-expanded", String(expanded));
    };

    trigger?.addEventListener("click", onTriggerClick);

    // Close dropdown when tapping outside.
    const onOutsideClick = (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("open");
        trigger?.setAttribute("aria-expanded", "false");
      }
    };

    document.addEventListener("click", onOutsideClick);
  };

  enableTapDropdown();
  window.addEventListener("resize", enableTapDropdown);
}

// ------------------------------
// Flip cards (works for ALL cards)
// ------------------------------
document.querySelectorAll(".flip-card").forEach((card) => {
  card.addEventListener("click", () => {
    card.classList.toggle("flipped");
  });
});

// Optional: prevent the link click from also re-flipping the card
// (So clicking "Go to ..." just navigates cleanly.)
document.querySelectorAll(".flip-card a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.stopPropagation();
  });
});

// ------------------------------
// Dark mode toggle (with persistence)
// ------------------------------
(() => {
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
