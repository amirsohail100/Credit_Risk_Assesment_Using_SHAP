(() => {
  const form = document.getElementById("riskForm");
  const submitBtn = document.getElementById("submitBtn");
  const errorNote = document.getElementById("errorNote");
  const verdict = document.getElementById("verdict");

  const incomeInput = document.getElementById("person_income");
  const amountInput = document.getElementById("loan_amnt");
  const percentInput = document.getElementById("loan_percent_income");

  const gaugeFill = document.getElementById("gaugeFill");
  const gaugeThreshold = document.getElementById("gaugeThreshold");
  const probNumber = document.getElementById("probNumber");
  const stampBadge = document.getElementById("stampBadge");
  const stampText = document.getElementById("stampText");

  const factProb = document.getElementById("factProb");
  const factThreshold = document.getElementById("factThreshold");
  const factResult = document.getElementById("factResult");

  const resetBtn = document.getElementById("resetBtn");
  const copyBtn = document.getElementById("copyBtn");
  const editBtn = document.getElementById("editBtn");
  const factMargin = document.getElementById("factMargin");
  const verdictSummary = document.getElementById("verdictSummary");
  const verdictTime = document.getElementById("verdictTime");
  const meterFill = document.getElementById("meterFill");
  const meterTick = document.getElementById("meterTick");
  const meterTickLabel = document.getElementById("meterTickLabel");

  const apiDot = document.getElementById("apiDot");
  const apiStatusText = document.getElementById("apiStatusText");

  const GAUGE_CIRCUMFERENCE = 540.35; // 2 * PI * 86, matches CSS

  // ---------- Auto-calculate loan-to-income ratio ----------
  function recalcPercent() {
    const income = parseFloat(incomeInput.value);
    const amount = parseFloat(amountInput.value);
    if (income > 0 && amount >= 0) {
      percentInput.value = (amount / income).toFixed(2);
    }
  }
  incomeInput.addEventListener("input", recalcPercent);
  amountInput.addEventListener("input", recalcPercent);
  recalcPercent();


  // ---------- UI enhancements (additive; native inputs stay the source of truth) ----------
  function fireInput(el, type) { el.dispatchEvent(new Event(type, { bubbles: true })); }

  // Compact Indian-style amount, e.g. 600000 -> "₹6.00 Lakh"
  function inrWords(n) {
    if (!isFinite(n) || n <= 0) return "";
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Crore`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} Lakh`;
    return `₹${n.toLocaleString("en-IN")}`;
  }

  // Number steppers (− / +)
  form.querySelectorAll('input[type="number"]').forEach((input) => {
    const wrap = document.createElement("div");
    wrap.className = "stepper";
    const mk = (sign, label) => {
      const b = document.createElement("button");
      b.type = "button";
      b.tabIndex = -1;
      b.textContent = sign;
      b.setAttribute("aria-label", `${label} ${input.name.replace(/_/g, " ")}`);
      b.addEventListener("click", () => {
        const step = parseFloat(input.step) || 1;
        const min = input.min !== "" ? parseFloat(input.min) : -Infinity;
        const max = input.max !== "" ? parseFloat(input.max) : Infinity;
        const cur = parseFloat(input.value) || 0;
        const dp = (String(step).split(".")[1] || "").length;
        const next = Math.min(max, Math.max(min, cur + (sign === "+" ? step : -step)));
        input.value = next.toFixed(dp);
        fireInput(input, "input");
      });
      return b;
    };
    wrap.append(mk("−", "Decrease"), mk("+", "Increase"));
    input.closest(".field").appendChild(wrap);
    input.addEventListener("input", () => input.closest(".field").classList.remove("is-invalid"));
  });

  // Amount-in-words helper under income / loan amount
  form.querySelectorAll("input[data-words]").forEach((input) => {
    const sub = document.createElement("div");
    sub.className = "sub";
    input.closest(".row").appendChild(sub);
    const upd = () => (sub.textContent = inrWords(parseFloat(input.value)));
    input.addEventListener("input", upd);
    form.addEventListener("reset", () => setTimeout(upd));
    upd();
  });
  // keep the ratio field in sync after programmatic stepper clicks too
  recalcPercent();

  // Custom dropdowns
  const ddSyncers = [];
  form.querySelectorAll(".field select").forEach((select) => {
    const field = select.closest(".field");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dd__btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<span class="dd__label"></span><svg class="dd__chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4"/></svg>';
    const list = document.createElement("ul");
    list.className = "dd__list";
    list.setAttribute("role", "listbox");
    list.tabIndex = -1;
    const label = btn.querySelector(".dd__label");
    let active = select.selectedIndex;

    Array.from(select.options).forEach((o, i) => {
      const li = document.createElement("li");
      li.className = "dd__opt";
      li.setAttribute("role", "option");
      li.textContent = o.textContent;
      li.addEventListener("mousedown", (e) => e.preventDefault());
      li.addEventListener("click", () => choose(i));
      li.addEventListener("mousemove", () => setActive(i));
      list.appendChild(li);
    });
    const items = Array.from(list.children);

    function sync() {
      label.textContent = select.options[select.selectedIndex].textContent;
      items.forEach((li, i) => li.setAttribute("aria-selected", String(i === select.selectedIndex)));
    }
    function setActive(i) {
      active = (i + items.length) % items.length;
      items.forEach((li, k) => li.classList.toggle("is-active", k === active));
      items[active].scrollIntoView({ block: "nearest" });
    }
    function open() {
      field.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      setActive(select.selectedIndex);
    }
    function close() {
      field.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
    function choose(i) {
      select.selectedIndex = i;
      sync();
      close();
      fireInput(select, "change");
      btn.focus();
    }
    btn.addEventListener("click", () => (field.classList.contains("is-open") ? close() : open()));
    btn.addEventListener("blur", close);
    btn.addEventListener("keydown", (e) => {
      const isOpen = field.classList.contains("is-open");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) open();
        else setActive(active + (e.key === "ArrowDown" ? 1 : -1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        isOpen ? choose(active) : open();
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        close();
      } else if (e.key.length === 1) {
        const i = Array.from(select.options).findIndex((o) => o.textContent.toLowerCase().startsWith(e.key.toLowerCase()));
        if (i >= 0) (isOpen ? setActive(i) : choose(i));
      }
    });
    field.append(btn, list);
    ddSyncers.push(sync);
    sync();
  });

  // Reset
  resetBtn.addEventListener("click", () => {
    form.reset();
    setTimeout(() => {
      ddSyncers.forEach((s) => s());
      recalcPercent();
      form.querySelectorAll(".field.is-invalid").forEach((f) => f.classList.remove("is-invalid"));
      clearError();
      verdict.hidden = true;
    });
  });

  // Pre-submit validation (uses each input's own min/max)
  function validateForm() {
    let first = null;
    form.querySelectorAll('input[type="number"]').forEach((input) => {
      const v = parseFloat(input.value);
      const bad =
        isNaN(v) ||
        (input.min !== "" && v < parseFloat(input.min)) ||
        (input.max !== "" && v > parseFloat(input.max));
      input.closest(".field").classList.toggle("is-invalid", bad);
      if (bad && !first) first = input;
    });
    if (first) {
      const name = first.closest(".row").querySelector("label").textContent;
      const range = [first.min !== "" ? `min ${first.min}` : "", first.max !== "" ? `max ${first.max}` : ""].filter(Boolean).join(", ");
      showError(`Please check "${name}"${range ? ` (${range})` : ""}.`);
      first.focus();
      return false;
    }
    return true;
  }

  // ---------- Service status check ----------
  fetch("/openapi.json", { method: "GET" })
    .then((res) => {
      if (res.ok) {
        apiDot.classList.add("ok");
        apiStatusText.textContent = "service ready";
      } else {
        throw new Error("bad status");
      }
    })
    .catch(() => {
      apiDot.classList.add("down");
      apiStatusText.textContent = "service unreachable";
    });

  // ---------- Helpers ----------
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("loading", isLoading);
    submitBtn.querySelector(".btn-label").textContent = isLoading
      ? "Reviewing file…"
      : "Assess risk";
  }

  function showError(message) {
    errorNote.textContent = message;
    errorNote.hidden = false;
  }

  function clearError() {
    errorNote.hidden = true;
    errorNote.textContent = "";
  }

  function animateNumber(el, from, to, duration) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (to - from) * eased;
      el.textContent = value.toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = to.toFixed(1);
    }
    requestAnimationFrame(tick);
  }

  let lastSummary = "";

  function renderVerdict(data) {
    const probabilityPct = data.default_probability * 100;
    const thresholdPct = data.threshold * 100;
    const isHighRisk = data.default_prediction === 1;

    verdict.hidden = false;
    verdict.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Gauge fill
    const offset = GAUGE_CIRCUMFERENCE * (1 - probabilityPct / 100);
    gaugeFill.style.stroke = isHighRisk ? "var(--risk-red)" : "var(--brass)";
    requestAnimationFrame(() => {
      gaugeFill.style.strokeDashoffset = offset;
    });

    // Threshold tick
    gaugeThreshold.style.transform = `rotate(${thresholdPct * 3.6}deg)`;

    // Number readout
    animateNumber(probNumber, 0, probabilityPct, 1000);

    // Stamp
    stampBadge.classList.remove("stamp--in", "risk-high");
    void stampBadge.offsetWidth; // restart animation
    if (isHighRisk) {
      stampBadge.classList.add("risk-high");
      stampText.textContent = "HIGH RISK";
    } else {
      stampText.textContent = "LOW RISK";
    }
    requestAnimationFrame(() => stampBadge.classList.add("stamp--in"));

    // Enhanced verdict: tone, summary, meter, margin, timestamp
    const margin = probabilityPct - thresholdPct;
    verdict.classList.toggle("is-high", isHighRisk);
    verdictSummary.textContent = isHighRisk
      ? `Estimated default probability is ${Math.abs(margin).toFixed(1)} points above the ${thresholdPct.toFixed(1)}% threshold — this file is flagged for closer review.`
      : `Estimated default probability is ${Math.abs(margin).toFixed(1)} points below the ${thresholdPct.toFixed(1)}% threshold — this file sits within the acceptable range.`;
    meterFill.style.width = "0%";
    requestAnimationFrame(() => (meterFill.style.width = `${Math.min(100, probabilityPct)}%`));
    meterTick.style.left = `${thresholdPct}%`;
    meterTickLabel.textContent = `▲ threshold ${thresholdPct.toFixed(1)}%`;
    factMargin.textContent = `${margin > 0 ? "+" : ""}${margin.toFixed(1)} pts`;
    verdictTime.textContent = `Assessed ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`;
    lastSummary = `Credit Ledger — ${isHighRisk ? "HIGH" : "LOW"} RISK\nDefault probability: ${probabilityPct.toFixed(1)}%\nDecision threshold: ${thresholdPct.toFixed(1)}%\nModel verdict: ${data.Result}\n${verdictTime.textContent}`;

    // Ledger facts
    factProb.textContent = `${probabilityPct.toFixed(1)}%`;
    factThreshold.textContent = `${thresholdPct.toFixed(1)}%`;
    factResult.textContent = data.Result;
  }

  // ---------- Submit ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    if (!validateForm()) return;
    setLoading(true);

    const payload = {
      person_age: parseInt(document.getElementById("person_age").value, 10),
      person_income: parseFloat(incomeInput.value),
      person_home_ownership: document.getElementById("person_home_ownership").value,
      person_emp_length: parseFloat(document.getElementById("person_emp_length").value),
      loan_intent: document.getElementById("loan_intent").value,
      loan_grade: document.getElementById("loan_grade").value,
      loan_amnt: parseFloat(amountInput.value),
      loan_int_rate: parseFloat(document.getElementById("loan_int_rate").value),
      loan_percent_income: parseFloat(percentInput.value),
      cb_person_default_on_file: document.getElementById("cb_person_default_on_file").value,
      cb_person_cred_hist_length: parseInt(document.getElementById("cb_person_cred_hist_length").value, 10),
    };

    try {
      const res = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = body && body.detail ? JSON.stringify(body.detail) : `HTTP ${res.status}`;
        throw new Error(detail);
      }

      const data = await res.json();
      renderVerdict(data);
    } catch (err) {
      showError(`Could not reach the ledger. ${err.message || "Check the service is running."}`);
    } finally {
      setLoading(false);
    }
  });

  // ---------- Verdict actions ----------
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(lastSummary);
      copyBtn.textContent = "Copied ✓";
    } catch (_) {
      copyBtn.textContent = "Copy failed";
    }
    setTimeout(() => (copyBtn.textContent = "Copy summary"), 1600);
  });
  editBtn.addEventListener("click", () => form.scrollIntoView({ behavior: "smooth", block: "start" }));
})();
