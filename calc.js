// Must load BigNumber.js first in HTML:
// <script src="BigNumber.js"></script>
// <script src="calc.js"></script>

const screen = document.getElementById("screen");
const buttons = document.querySelectorAll(".buttons button");

let justEvaluated = false;

// ---------------- FONT SIZE ADJUST ----------------
function adjustFontSize() {
  const len = screen.value.length;
  let size = 32;

  if (len > 12 && len <= 20) size = 28;
  else if (len > 20 && len <= 30) size = 24;
  else if (len > 30 && len <= 50) size = 20;
  else if (len > 50 && len <= 80) size = 16;
  else if (len > 80) size = 12;

  screen.style.fontSize = size + "px";
}

// ---------------- HELPERS ----------------
function isOperator(ch) {
  return ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "^";
}

function evaluateExpression(expr) {
  expr = expr.replace(/\s+/g, "");

  if (!/[+\-*\/^]/.test(expr)) return expr;

  const match = expr.match(/^(-?\d+)([+\-*\/^])(-?\d+)$/);
  if (!match) throw new Error("Invalid expression");

  let A = new BigNumber(match[1]);
  let op = match[2];
  let B = new BigNumber(match[3]);

  switch (op) {
    case "+":
      return A.add(B).toString();
    case "-":
      return A.subtract(B).toString(); // NOW we use subtract()!
    case "*":
      return A.multiply(B).toString();
    case "/":
      if (match[3] === "0") throw new Error("Division by zero");
      return A.divide(B).toString();
    case "^":
      return A.pow(B).toString();
    default:
      throw new Error("Unknown operator");
  }
}

function factorialBigIntString(nStr) {
  let n = parseInt(nStr);
  if (isNaN(n) || n < 0) throw new Error("Invalid factorial");

  let result = new BigNumber("1");

  for (let i = 2; i <= n; i++) {
    result = result.multiply(new BigNumber(String(i)));
  }

  return result.toString();
}

// ---------------- MAIN BUTTON LOGIC ----------------
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.textContent.trim();

    // Clear
    if (value === "C") {
      screen.value = "";
      adjustFontSize();
      return;
    }

    // Backspace
    if (value === "←" || value === "<-" || value === "<—") {
      screen.value = screen.value.slice(0, -1);
      adjustFontSize();
      return;
    }

    // Factorial
    // Factorial button: just append "!" (DO NOT calculate now)
    if (value === "!") {
      // prevent double "!!"
      const last = screen.value.slice(-1);
      if (last === "!") return;

      screen.value += "!";
      adjustFontSize();
      return;
    }

    // =  → evaluate current expression
    if (value === "=") {
      // nothing on the screen → do nothing
      if (!screen.value) return;

      try {
        let expr = screen.value.trim();

        // Case 1: factorial, e.g. "1000!"
        if (expr.includes("!")) {
          // right now we support only simple "n!" (no 5+3! etc.)
          expr = expr.replace("!", ""); // remove the "!"
          const n = new BigNumber(expr); // make BigNumber from n
          const result = n.factorial(); // BigNumber factorial
          screen.value = result.toString();
        }
        // Case 2: normal expression with + - * / ^
        else {
          const result = evaluateExpression(expr); // uses BigNumber add/sub/mul/div/pow
          screen.value = result;
        }

        // mark that we just showed a result
        justEvaluated = true;
      } catch (err) {
        console.error(err);
        screen.value = "Error";
        justEvaluated = true; // still treat as "finished"
      }

      adjustFontSize();
      return;
    }

    // Prevent two operators in a row
    const cur = screen.value;
    const last = cur.slice(-1);
    if (isOperator(last) && isOperator(value)) {
      screen.value = cur.slice(0, -1) + value;
      adjustFontSize();
      return;
    }

    // Add to screen
    // If last was "=" and user presses a number, reset screen
    if (
      justEvaluated &&
      !isOperator(value) &&
      value !== "!" &&
      value !== "←" &&
      value !== "C"
    ) {
      screen.value = "";
    }
    justEvaluated = false; // now user is typing

    // append the clicked value
    screen.value += value;
    adjustFontSize();
  });
});

adjustFontSize();
