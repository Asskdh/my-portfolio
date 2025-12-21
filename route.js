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
  const tempAlists = Array.from({ length: 1000 }, () => []);
  const lines = text.split(/\r?\n/);
  let fromCity = "";

  for (let rawLine of lines) {
    let line = trim(rawLine);
    if (!line) continue;

    if (line.indexOf("From:") === 0) {
      fromCity = trim(line.substring(5));
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

      let fromIndex = -1,
        toIndex = -1;
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

function bfsShortestPath(start, target) {
  const size = cityNames.length;
  const parents = new Array(size).fill(-1);
  parents[start] = start;

  const q = [start];
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

function formatPath(pathIdx) {
  return pathIdx.map((i) => cityNames[i]).join(" --> ");
}

function prefixMatches(query) {
  const q = toLower(query);
  const results = [];
  for (let i = 0; i < cityNames.length; i++) {
    const nl = toLower(cityNames[i]);
    if (nl.startsWith(q)) results.push(i);
  }
  return results;
}

/* DOM */
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

/* Suggestions */
function showSuggestions(container, indices, onPick) {
  container.innerHTML = "";
  const slice = indices.slice(0, 12);
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

/* Map draw ONLY 2 points */
function drawTwoCityLine() {
  const line = document.getElementById("routeLineDynamic");
  if (!line) return;

  // fixed endpoints that match your two city marker locations
  const start = { x: 170, y: 410 };
  const end = { x: 1050, y: 160 };

  const d = `M ${start.x} ${start.y}
     C 360 320 720 260 ${end.x} ${end.y}`;

  line.setAttribute("d", d);
}

/* Animate planet -> map */
function showMap(fromCity, toCity) {
  document.getElementById("pinFromLabel").textContent = fromCity;
  document.getElementById("pinToLabel").textContent = toCity;

  drawTwoCityLine();

  stage.classList.remove("mapped");
  stage.classList.add("morphing");

  setTimeout(() => {
    stage.classList.remove("morphing");
    stage.classList.add("mapped");
  }, 950);
}

/* Run */
function runRoute() {
  const fromName = fromInput.value.trim();
  const toName = toInput.value.trim();

  if (!fromName || !toName) {
    routeSub.textContent = "Please type both From and To.";
    return;
  }

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

  const pathIdx = bfsShortestPath(fromIndex, toIndex);

  if (!pathIdx) {
    routeText.textContent = "No route found.";
    routeSub.textContent = "Graph had no path between those cities.";
    return;
  }

  // Still prints full BFS path (even if >2)
  routeText.textContent = formatPath(pathIdx);
  routeSub.textContent = `Hops: ${Math.max(0, pathIdx.length - 1)} (BFS)`;

  // BUT the map always shows ONLY 2 cities + 1 line
  showMap(cityNames[fromIndex], cityNames[toIndex]);
}

/* Events */
function wireUI() {
  fromInput.addEventListener("input", () => {
    const q = fromInput.value.trim();
    fromIndex = null;
    if (!q) {
      fromSug.classList.remove("show");
      return;
    }
    showSuggestions(fromSug, prefixMatches(q), setFrom);
  });

  toInput.addEventListener("input", () => {
    const q = toInput.value.trim();
    toIndex = null;
    if (!q) {
      toSug.classList.remove("show");
      return;
    }
    showSuggestions(toSug, prefixMatches(q), setTo);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".field")) hideSuggestions();
  });

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

/* Load connections */
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
      "Could not load connections.txt. Use Live Server and keep the file in the same folder.";
  }
})();
