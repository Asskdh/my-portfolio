function toLower(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 65 && code <= 90) out += String.fromCharCode(code + 32);
    else out += s[i];
  }
  return out;
}

function trim(s) {
  let start = 0;
  while (start < s.length && s[start] === " ") start++;
  let end = s.length - 1;
  while (end >= 0 && s[end] === " ") end--;
  if (start > end) return "";
  return s.substring(start, end + 1);
}

let cityNames = [];
let alists = [];

function buildGraphFromConnectionsText(text) {
  cityNames = [];
  let tempAlists = Array.from({ length: 1000 }, () => []);

  const lines = text.split(/\r?\n/);
  let fromCity = "";

  for (let rawLine of lines) {
    let line = trim(rawLine);
    if (!line) continue;

    if (line.indexOf("From:") === 0) {
      fromCity = trim(line.substring(5));

      // if city not already in list, add it (same as your C++)
      let found = false;
      for (let i = 0; i < cityNames.length; i++) {
        if (cityNames[i] === fromCity) {
          found = true;
          break;
        }
      }
      if (!found) cityNames.push(fromCity);
    } else {
      let toCity = "";
      const colon = line.indexOf(":");
      if (colon !== -1) toCity = trim(line.substring(colon + 1));
      else toCity = trim(line);

      let fromIndex = -1;
      let toIndex = -1;

      for (let i = 0; i < cityNames.length; i++) {
        if (cityNames[i] === fromCity) fromIndex = i;
        if (cityNames[i] === toCity) toIndex = i;
      }

      if (fromIndex === -1) {
        cityNames.push(fromCity);
        fromIndex = cityNames.length - 1;
      }

      if (toIndex === -1) {
        cityNames.push(toCity);
        toIndex = cityNames.length - 1;
      }

      tempAlists[fromIndex].push(toIndex);
    }
  }

  const size = cityNames.length;
  alists = tempAlists.slice(0, size);
}

/* -------------------------
   BFS (same parents logic)
------------------------- */
function bfsShortestPath(start, target) {
  const size = cityNames.length;
  const parents = new Array(size).fill(-1);

  parents[start] = start;
  const q = [];
  q.push(start);

  let found = false;

  while (q.length > 0 && !found) {
    const v = q.shift();

    for (let i = 0; i < alists[v].length; i++) {
      const w = alists[v][i];
      if (parents[w] === -1) {
        parents[w] = v;
        q.push(w);
        if (w === target) {
          found = true;
          break;
        }
      }
    }
  }

  if (parents[target] === -1) return null;

  // reconstruct path like printPath recursion
  const path = [];
  let cur = target;
  while (true) {
    path.push(cur);
    if (cur === start) break;
    cur = parents[cur];
  }
  path.reverse();
  return path;
}

function formatPath(pathIndices) {
  return pathIndices.map((i) => cityNames[i]).join(" --> ");
}

/* -------------------------
   Prefix matching (your UI requirement)
------------------------- */
function prefixMatches(query) {
  const q = toLower(query);
  const results = [];
  for (let i = 0; i < cityNames.length; i++) {
    const nameLower = toLower(cityNames[i]);
    if (nameLower.startsWith(q)) results.push(i);
  }
  return results;
}

/* -------------------------
   DOM
------------------------- */
const fromInput = document.getElementById("fromInput");
const toInput = document.getElementById("toInput");
const fromSug = document.getElementById("fromSug");
const toSug = document.getElementById("toSug");
const enterBtn = document.getElementById("enterBtn");

const stage = document.getElementById("stage");
const routeText = document.getElementById("routeText");
const routeSub = document.getElementById("routeSub");

let fromIndex = null;
let toIndex = null;

/* -------------------------
   Suggestions UI
------------------------- */
function showSuggestions(container, indices, onPick) {
  container.innerHTML = "";

  const maxShow = 12;
  const slice = indices.slice(0, maxShow);

  for (const idx of slice) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = cityNames[idx];
    btn.addEventListener("click", () => onPick(idx));
    container.appendChild(btn);
  }

  if (slice.length > 0) container.classList.add("show");
  else container.classList.remove("show");
}

function hideSuggestions() {
  fromSug.classList.remove("show");
  toSug.classList.remove("show");
}

function setFrom(idx) {
  fromIndex = idx;
  fromInput.value = cityNames[idx];
  hideSuggestions();
}

function setTo(idx) {
  toIndex = idx;
  toInput.value = cityNames[idx];
  hideSuggestions();
}

/* -------------------------
   Planet -> Stylized Map animation
------------------------- */
function showStylizedMap(fromCity, toCity) {
  document.getElementById("pinFromLabel").textContent = fromCity;
  document.getElementById("pinToLabel").textContent = toCity;

  stage.classList.remove("mapped");
  stage.classList.add("morphing");

  setTimeout(() => {
    stage.classList.remove("morphing");
    stage.classList.add("mapped");
  }, 950);
}

/* -------------------------
   Run route (on Enter/Search)
------------------------- */
function runRoute() {
  const fromName = fromInput.value.trim();
  const toName = toInput.value.trim();

  if (!fromName || !toName) {
    routeSub.textContent = "Please type both From and To.";
    return;
  }

  // If user didn't click suggestion, try exact match
  if (fromIndex === null) fromIndex = cityNames.indexOf(fromName);
  if (toIndex === null) toIndex = cityNames.indexOf(toName);

  if (
    fromIndex === -1 ||
    toIndex === -1 ||
    fromIndex === null ||
    toIndex === null
  ) {
    routeSub.textContent =
      "Pick cities from the suggestion list so names match the file exactly.";
    return;
  }

  const path = bfsShortestPath(fromIndex, toIndex);

  if (!path) {
    routeText.textContent = "No route found.";
    routeSub.textContent = "Graph had no path between those cities.";
  } else {
    routeText.textContent = formatPath(path);
    routeSub.textContent = `Hops: ${Math.max(0, path.length - 1)} (BFS)`;
  }

  // Trigger morph to stylized map
  showStylizedMap(cityNames[fromIndex], cityNames[toIndex]);
}

/* -------------------------
   Wire events
------------------------- */
function wireUI() {
  fromInput.addEventListener("input", () => {
    const q = fromInput.value.trim();
    fromIndex = null;

    if (!q) {
      fromSug.classList.remove("show");
      return;
    }

    const matches = prefixMatches(q);
    showSuggestions(fromSug, matches, setFrom);
  });

  toInput.addEventListener("input", () => {
    const q = toInput.value.trim();
    toIndex = null;

    if (!q) {
      toSug.classList.remove("show");
      return;
    }

    const matches = prefixMatches(q);
    showSuggestions(toSug, matches, setTo);
  });

  // Click outside closes suggestions
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".field")) hideSuggestions();
  });

  // Enter key triggers search
  [fromInput, toInput].forEach((el) => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runRoute();
      }
    });
  });

  enterBtn.addEventListener("click", runRoute);
}

async function loadConnections() {
  const res = await fetch("connections.txt");
  if (!res.ok) throw new Error("Failed to load connections.txt");
  const text = await res.text();
  buildGraphFromConnectionsText(text);
}

(async function init() {
  try {
    routeSub.textContent = "Loading connections.txt...";
    await loadConnections();
    routeSub.textContent = `Loaded ${cityNames.length} cities. Start typing.`;
    wireUI();
  } catch (err) {
    console.error(err);
    routeSub.textContent =
      "Could not load connections.txt. Make sure you're running a local server (Live Server) and the file is in the same folder.";
  }
})();
