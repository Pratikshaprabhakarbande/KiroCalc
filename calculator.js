(function () {
  "use strict";

  const currentEl = document.getElementById("current");
  const historyEl = document.getElementById("history");
  const keysEl = document.querySelector(".keys");

  const opSymbols = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  const state = {
    current: "0",      // string shown on the display
    previous: null,    // stored operand (number) or null
    operator: null,    // pending operator or null
    overwrite: true,   // next digit should replace the display
  };

  // --- Rendering -----------------------------------------------------------

  function formatNumber(numStr) {
    if (numStr === "Error") return numStr;
    const negative = numStr.startsWith("-");
    let body = negative ? numStr.slice(1) : numStr;
    let [intPart, decPart] = body.split(".");

    // Group integer part with thousands separators.
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    let result = intPart;
    if (decPart !== undefined) result += "." + decPart;
    if (body.endsWith(".") && decPart === undefined) result += ".";
    return (negative ? "-" : "") + result;
  }

  function render() {
    currentEl.textContent = formatNumber(state.current);
    if (state.operator && state.previous !== null) {
      historyEl.textContent =
        formatNumber(String(state.previous)) + " " + opSymbols[state.operator];
    } else {
      historyEl.textContent = "";
    }
  }

  // --- Core operations -----------------------------------------------------

  function compute(a, b, operator) {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? null : a / b; // null => error
      default: return b;
    }
  }

  function toDisplayString(num) {
    if (!isFinite(num)) return "Error";
    // Round to avoid floating point noise, keep up to 12 significant digits.
    let str = parseFloat(num.toPrecision(12)).toString();
    return str;
  }

  function inputDigit(digit) {
    if (state.current === "Error") clearAll();
    if (state.overwrite) {
      state.current = digit;
      state.overwrite = false;
    } else {
      if (state.current === "0") state.current = digit;
      else state.current += digit;
    }
    render();
  }

  function inputDecimal() {
    if (state.current === "Error") clearAll();
    if (state.overwrite) {
      state.current = "0.";
      state.overwrite = false;
    } else if (!state.current.includes(".")) {
      state.current += ".";
    }
    render();
  }

  function chooseOperator(nextOperator) {
    if (state.current === "Error") return;
    const inputValue = parseFloat(state.current);

    if (state.operator && !state.overwrite && state.previous !== null) {
      // Chain: evaluate the pending operation first.
      const result = compute(state.previous, inputValue, state.operator);
      if (result === null) return setError();
      state.previous = result;
      state.current = toDisplayString(result);
    } else {
      state.previous = inputValue;
    }

    state.operator = nextOperator;
    state.overwrite = true;
    render();
  }

  function equals() {
    if (state.operator === null || state.previous === null) return;
    if (state.current === "Error") return;
    const inputValue = parseFloat(state.current);
    const result = compute(state.previous, inputValue, state.operator);
    if (result === null) return setError();

    historyEl.textContent =
      formatNumber(String(state.previous)) + " " +
      opSymbols[state.operator] + " " +
      formatNumber(state.current) + " =";

    state.current = toDisplayString(result);
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
    currentEl.textContent = formatNumber(state.current);
  }

  function clearAll() {
    state.current = "0";
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
    render();
  }

  function toggleSign() {
    if (state.current === "Error" || state.current === "0") return;
    state.current = state.current.startsWith("-")
      ? state.current.slice(1)
      : "-" + state.current;
    render();
  }

  function percent() {
    if (state.current === "Error") return;
    const value = parseFloat(state.current) / 100;
    state.current = toDisplayString(value);
    state.overwrite = true;
    render();
  }

  function setError() {
    state.current = "Error";
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
    render();
  }

  // --- Event handling ------------------------------------------------------

  function clearActiveOperator() {
    document.querySelectorAll(".key--op.active")
      .forEach((el) => el.classList.remove("active"));
  }

  function handleAction(btn) {
    const action = btn.dataset.action;
    switch (action) {
      case "digit": inputDigit(btn.dataset.digit); clearActiveOperator(); break;
      case "decimal": inputDecimal(); clearActiveOperator(); break;
      case "operator":
        chooseOperator(btn.dataset.op);
        clearActiveOperator();
        btn.classList.add("active");
        break;
      case "equals": equals(); clearActiveOperator(); break;
      case "clear": clearAll(); clearActiveOperator(); break;
      case "sign": toggleSign(); break;
      case "percent": percent(); break;
    }
  }

  keysEl.addEventListener("click", function (e) {
    const btn = e.target.closest("button.key");
    if (btn) handleAction(btn);
  });

  // Keyboard support.
  document.addEventListener("keydown", function (e) {
    const key = e.key;
    if (key >= "0" && key <= "9") {
      inputDigit(key); clearActiveOperator();
    } else if (key === ".") {
      inputDecimal(); clearActiveOperator();
    } else if (["+", "-", "*", "/"].includes(key)) {
      chooseOperator(key);
      clearActiveOperator();
      const opBtn = document.querySelector(`.key--op[data-op="${key}"]`);
      if (opBtn) opBtn.classList.add("active");
    } else if (key === "Enter" || key === "=") {
      e.preventDefault();
      equals(); clearActiveOperator();
    } else if (key === "Escape") {
      clearAll(); clearActiveOperator();
    } else if (key === "Backspace") {
      backspace();
    } else if (key === "%") {
      percent();
    }
  });

  function backspace() {
    if (state.current === "Error" || state.overwrite) return;
    state.current = state.current.length > 1
      ? state.current.slice(0, -1)
      : "0";
    if (state.current === "-" ) state.current = "0";
    render();
  }

  render();
})();
