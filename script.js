// File: script.js

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function round(n, decimals = 0) {
  const p = Math.pow(10, decimals);
  return Math.round(n * p) / p;
}

/**
 * Calories burned walking uphill (estimate)
 * ACSM walking equation:
 * VO2 (ml/kg/min) = 0.1*speed(m/min) + 1.8*speed(m/min)*grade + 3.5
 * kcal/min ≈ (VO2 * weightKg / 1000) * 5
 */
function calcCaloriesUphill({ weightKg, speedKmh, gradePercent, durationMin }) {
  const speedMmin = (speedKmh * 1000) / 60; // km/h -> m/min
  const grade = gradePercent / 100; // % -> fraction

  const vo2 = (0.1 * speedMmin) + (1.8 * speedMmin * grade) + 3.5; // ml/kg/min
  const kcalPerMin = (vo2 * weightKg / 1000) * 5;
  const totalKcal = kcalPerMin * durationMin;

  return { vo2, kcalPerMin, totalKcal };
}

function readNumber(id) {
  const el = document.getElementById(id);
  const v = Number(String(el?.value ?? "").replace(",", "."));
  return Number.isFinite(v) ? v : NaN;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = String(value);
}

function showResult(html) {
  const box = document.getElementById("result");
  if (box) box.innerHTML = html;
}

function showMethod() {
  document.getElementById("method")?.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("calcBtn");

  const run = () => {
    let weightKg = readNumber("weightKg");
    let speedKmh = readNumber("speedKmh");
    let gradePercent = readNumber("gradePercent");
    let durationMin = readNumber("durationMin");

    const errors = [];

    // Basic validation
    if (!Number.isFinite(weightKg) || weightKg <= 0) errors.push("Poids invalide.");
    if (!Number.isFinite(speedKmh) || speedKmh <= 0) errors.push("Vitesse invalide.");
    if (!Number.isFinite(gradePercent) || gradePercent < 0) errors.push("Inclinaison invalide.");
    if (!Number.isFinite(durationMin) || durationMin <= 0) errors.push("Durée invalide.");

    if (errors.length) {
      showResult(`<p><strong>Erreur :</strong> ${errors.join(" ")}</p>`);
      return;
    }

    // Guardrails (walking-only)
    weightKg = clamp(weightKg, 20, 250);
    speedKmh = clamp(speedKmh, 0.5, 9);       // walking speeds
    gradePercent = clamp(gradePercent, 0, 30); // realistic incline range
    durationMin = clamp(durationMin, 1, 600);

    // Reflect clamped values back into inputs (UI matches calculation)
    setValue("weightKg", round(weightKg, 1));
    setValue("speedKmh", round(speedKmh, 1));
    setValue("gradePercent", round(gradePercent, 1));
    setValue("durationMin", Math.round(durationMin));

    const { vo2, kcalPerMin, totalKcal } = calcCaloriesUphill({
      weightKg,
      speedKmh,
      gradePercent,
      durationMin
    });

    showResult(`
      <h3>Result (estimate)</h3>
      <p><strong>${round(totalKcal, 0)} kcal</strong> total burned</p>
      <p>${round(kcalPerMin, 1)} kcal / min</p>

      <details>
        <summary>Details</summary>
        <p>Estimated VO₂: ${round(vo2, 1)} ml/kg/min</p>
        <p>Assumptions: ACSM walking equation + 1 L O₂ ≈ 5 kcal.</p>
      </details>

      <div id="method" class="method">
        <details>
          <summary>How is this calculated?</summary>

          <p>
            This calculator uses the <strong>ACSM walking equation</strong>
            to estimate oxygen consumption (VO₂) during uphill walking.
          </p>

          <pre class="equation">VO₂ (ml/kg/min) =
0.1 × speed (m/min)
+ 1.8 × speed (m/min) × grade
+ 3.5</pre>

          <p>Calories burned per minute are then estimated with:</p>

          <pre class="equation">Calories / min =
(VO₂ × weight ÷ 1000) × 5</pre>

          <ul>
            <li><strong>Speed</strong> is converted from km/h to m/min</li>
            <li><strong>Grade</strong> is incline as a fraction (8% → 0.08)</li>
            <li><strong>Weight</strong> is in kilograms</li>
            <li><strong>5 kcal</strong> ≈ energy from 1 liter of oxygen</li>
          </ul>

          <p class="note">
            Note: This calculator is intended for <strong>walking speeds</strong>
            (up to ~9 km/h). Higher speeds are considered running and require
            a different equation.
          </p>
        </details>
      </div>
    `);
  };

  if (btn) btn.addEventListener("click", run);

  // Calculate on Enter in inputs
  ["weightKg", "speedKmh", "gradePercent", "durationMin"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") run();
      });
    }
  });
});
