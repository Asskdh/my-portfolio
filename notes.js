// ===== DOM elements =====
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("note-title");
const bodyInput = document.getElementById("note-body");
const charCounter = document.getElementById("char-counter");

const composerModeLabel = document.getElementById("composer-mode-label");
const composerHint = document.getElementById("composer-hint");
const saveBtn = document.getElementById("save-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const notesList = document.getElementById("notes-list");
const emptyState = document.getElementById("empty-state");
const notesCount = document.getElementById("notes-count");

const searchInput = document.getElementById("search-input");
const themeToggleBtn = document.getElementById("theme-toggle");

// ===== Storage keys =====
const STORAGE_KEY_NOTES = "notesBoard.notes";
const STORAGE_KEY_THEME = "notesBoard.theme";

// ===== State =====
let notes = [];
let currentEditId = null;
let searchTerm = "";

// ===== Helpers =====
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const datePart = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timePart = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

function updateCharCounter() {
  const len = bodyInput.value.length;
  const max = bodyInput.maxLength || 2000;
  charCounter.textContent = `${len} / ${max}`;
}

function loadNotesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      notes = parsed;
    }
  } catch (err) {
    console.error("Failed to load notes:", err);
  }
}

function saveNotesToStorage() {
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
}

// ===== Editor mode =====
function setCreateMode() {
  currentEditId = null;
  composerModeLabel.textContent = "New note";
  composerHint.textContent = "Type a note and hit Save. Click a card to edit.";
  saveBtn.textContent = "Save note";
  cancelEditBtn.classList.add("hidden");
  noteForm.reset();
  updateCharCounter();
}

function setEditMode(note) {
  currentEditId = note.id;
  composerModeLabel.textContent = "Editing";
  composerHint.textContent =
    "You are editing a note. Update text and hit Save.";
  saveBtn.textContent = "Update note";
  cancelEditBtn.classList.remove("hidden");

  titleInput.value = note.title;
  bodyInput.value = note.body;
  updateCharCounter();
}

// ===== Filtering & rendering =====
function getFilteredNotes() {
  if (!searchTerm.trim()) return notes;
  const q = searchTerm.toLowerCase();
  return notes.filter(
    (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
  );
}

function renderNotes() {
  const visibleNotes = getFilteredNotes()
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt);

  notesList.innerHTML = "";

  if (visibleNotes.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  notesCount.textContent =
    visibleNotes.length === 1 ? "1 note" : `${visibleNotes.length} notes`;

  visibleNotes.forEach((note) => {
    const li = document.createElement("li");
    li.className = "note";
    li.dataset.id = note.id;

    li.innerHTML = `
      <div class="note-header">
        <div class="note-title">${escapeHtml(note.title || "(No title)")}</div>
        <div class="note-meta">${formatDate(note.updatedAt)}</div>
      </div>
      <div class="note-body">${escapeHtml(note.body || "")}</div>
      <div class="note-footer">
        <button class="note-btn edit" data-action="edit">Edit</button>
        <button class="note-btn delete" data-action="delete">Delete</button>
      </div>
    `;

    notesList.appendChild(li);
  });
}

// ===== Events =====

// Submit form: create or update note
noteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title && !body) {
    // Ignore completely empty note
    return;
  }

  const now = Date.now();

  if (currentEditId) {
    // Update existing
    const idx = notes.findIndex((n) => n.id === currentEditId);
    if (idx !== -1) {
      notes[idx] = {
        ...notes[idx],
        title,
        body,
        updatedAt: now,
      };
    }
  } else {
    // New note
    const newNote = {
      id: String(Date.now()) + Math.random().toString(16).slice(2),
      title,
      body,
      createdAt: now,
      updatedAt: now,
    };
    notes.push(newNote);
  }

  saveNotesToStorage();
  setCreateMode();
  renderNotes();
});

// Cancel edit
cancelEditBtn.addEventListener("click", () => {
  setCreateMode();
});

// Char counter
bodyInput.addEventListener("input", updateCharCounter);

// Search
searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value || "";
  renderNotes();
});

// Clicks on notes (edit/delete) - event delegation
notesList.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  if (!action) return;

  const li = e.target.closest(".note");
  if (!li) return;
  const id = li.dataset.id;
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  if (action === "edit") {
    setEditMode(note);
    // Scroll to composer on small screens
    document
      .querySelector(".composer")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (action === "delete") {
    const ok = confirm("Delete this note?");
    if (!ok) return;
    notes = notes.filter((n) => n.id !== id);
    if (currentEditId === id) {
      setCreateMode();
    }
    saveNotesToStorage();
    renderNotes();
  }
});

// ===== Theme handling =====
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "dark") {
    themeToggleBtn.textContent = "☀️ Light";
  } else {
    themeToggleBtn.textContent = "🌙 Dark";
  }
}

function loadTheme() {
  const stored = localStorage.getItem(STORAGE_KEY_THEME);
  if (stored === "light" || stored === "dark") {
    applyTheme(stored);
  } else {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }
}

function toggleTheme() {
  const current =
    document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY_THEME, next);
}

themeToggleBtn.addEventListener("click", toggleTheme);

// ===== Init =====
function init() {
  loadTheme();
  loadNotesFromStorage();
  updateCharCounter();
  setCreateMode();
  renderNotes();
}

document.addEventListener("DOMContentLoaded", init);
