const canvas = document.querySelector("#arena");
const ctx = canvas.getContext("2d");
const timerEl = document.querySelector("#timer");
const captionEl = document.querySelector("#timerCaption");
const timerPanel = document.querySelector(".timer-panel");
const bossHpEl = document.querySelector("#bossHp");
const hpReadout = document.querySelector("#hpReadout");
const modeLabel = document.querySelector("#modeLabel");
const toast = document.querySelector("#toast");
const streakEl = document.querySelector("#streak");
const questInput = document.querySelector("#questInput");
const questLabel = document.querySelector("#questLabel");
const questHint = document.querySelector("#questHint");
const phaseLabel = document.querySelector("#phaseLabel");
const focusCheck = document.querySelector("#focusCheck");
const focusCheckQuest = document.querySelector("#focusCheckQuest");
const focusCheckButton = document.querySelector("#focusCheckButton");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const resetButton = document.querySelector("#resetButton");

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const hero = { x: 210, y: 330 };
const boss = { x: 700, y: 260 };

let mode = "idle";
let remaining = FOCUS_SECONDS;
let bossHp = 100;
let streak = Number(localStorage.getItem("codexArenaStreak") || 0);
let lastSecond = performance.now();
let lastAutoShot = 0;
let nextFocusCheckAt = FOCUS_SECONDS - 5 * 60;
let focusCheckOpen = false;
let specialStrike = 0;
let bossHit = 0;
let shake = 0;
let heroShots = [];
let particles = [];

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function setToast(message) {
  toast.textContent = message;
}

function getPhase() {
  if (mode === "break") return "cooldown";
  if (mode === "paused") return "paused";
  if (mode === "idle") return "ready";
  if (remaining <= 5 * 60) return "final push";
  if (remaining <= 12 * 60) return "deep work";
  if (remaining <= 20 * 60) return "execute";
  return "opening";
}

function updateHud() {
  const timerBase = mode === "break" ? BREAK_SECONDS : FOCUS_SECONDS;
  const timerProgress = Math.max(0, Math.min(1, remaining / timerBase));
  const phase = getPhase();
  timerEl.textContent = formatTime(remaining);
  timerPanel.style.setProperty("--time-progress", `${timerProgress * 360}deg`);
  bossHpEl.style.width = `${Math.max(0, bossHp)}%`;
  hpReadout.textContent = `${Math.ceil(bossHp)}%`;
  streakEl.textContent = String(streak);
  questLabel.textContent = getQuest() || "unset";
  phaseLabel.textContent = phase;
  questHint.textContent = getQuest() ? "Editable while you focus" : "Write your focus task here";
  if (modeLabel) {
    modeLabel.textContent = mode === "break" ? "Break mode" : mode === "running" ? "Focus battle" : "Arena idle";
  }
  if (mode === "break") {
    captionEl.textContent = "recharge phase";
  } else if (mode === "paused") {
    captionEl.textContent = "paused - boss frozen";
  } else if (bossHp <= 0) {
    captionEl.textContent = "session cleared";
  } else {
    captionEl.textContent = mode === "running" ? phase : "25m boss fight";
  }
}

function getQuest() {
  return questInput.value.trim();
}

function showFocusCheck() {
  if (focusCheckOpen || mode !== "running") return;
  focusCheckOpen = true;
  focusCheckQuest.textContent = getQuest() ? `Quest: ${getQuest()}` : "Stay on the current quest.";
  focusCheck.classList.add("is-visible");
  setToast("Focus check: confirm you are still building");
}

function hideFocusCheck() {
  focusCheckOpen = false;
  focusCheck.classList.remove("is-visible");
}

function start() {
  if (mode === "break") return;
  if (!getQuest()) {
    questInput.focus();
    setToast("Write your task first");
    updateHud();
    return;
  }
  mode = "running";
  setToast("Timer active: Codex is attacking Claude");
  lastSecond = performance.now();
  updateHud();
}

function pause() {
  if (mode !== "running") return;
  mode = "paused";
  setToast("Paused: attacks stopped");
  updateHud();
}

function reset() {
  mode = "idle";
  remaining = FOCUS_SECONDS;
  bossHp = 100;
  nextFocusCheckAt = FOCUS_SECONDS - 5 * 60;
  specialStrike = 0;
  bossHit = 0;
  shake = 0;
  heroShots = [];
  particles = [];
  hideFocusCheck();
  setToast("Press Start to enter the arena");
  updateHud();
}

function completeFocus() {
  mode = "break";
  remaining = BREAK_SECONDS;
  bossHp = 0;
  heroShots = [];
  hideFocusCheck();
  streak += 1;
  localStorage.setItem("codexArenaStreak", String(streak));
  burst(boss.x, boss.y, "#75e089", 44);
  setToast("Focus session cleared. Break mode unlocked.");
  updateHud();
}

function fireFocusBolt(now = performance.now(), manual = false, special = false) {
  if (mode !== "running") return;
  heroShots.push({
    x: hero.x + 86,
    y: hero.y - 52 + (Math.random() - 0.5) * 18,
    vx: special ? 12 : manual ? 10.5 : 7.6,
    manual,
    special,
    life: 100,
  });
  burst(hero.x + 88, hero.y - 52, special ? "#ffd166" : "#75e089", special ? 14 : manual ? 5 : 2);
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5.5,
      vy: (Math.random() - 0.8) * 5.5,
      life: 28 + Math.random() * 20,
      color,
    });
  }
}

function tick(now) {
  if (now - lastSecond >= 1000) {
    lastSecond = now;

    if (mode === "running") {
      remaining = Math.max(0, remaining - 1);
      bossHp = Math.max(0, (remaining / FOCUS_SECONDS) * 100);
      if (remaining === nextFocusCheckAt && remaining > 0) {
        showFocusCheck();
        nextFocusCheckAt -= 5 * 60;
      }
      if (remaining === 0) completeFocus();
      updateHud();
    }

    if (mode === "break") {
      remaining = Math.max(0, remaining - 1);
      if (remaining === 0) reset();
      updateHud();
    }
  }

  if (mode === "running" && now - lastAutoShot > 2600) {
    lastAutoShot = now;
    fireFocusBolt(now);
  }
}

function updateProjectiles() {
  heroShots.forEach((shot) => {
    shot.x += shot.vx;
    shot.life -= 1;

    if (Math.abs(shot.x - boss.x) < 70 && Math.abs(shot.y - boss.y) < 88) {
      shot.life = 0;
      bossHit = 10;
      shake = 3;
      burst(shot.x, shot.y, shot.special ? "#ffd166" : shot.manual ? "#75e089" : "#8b5cff", shot.special ? 24 : shot.manual ? 12 : 8);
      updateHud();
    }
  });

  heroShots = heroShots.filter((shot) => shot.life > 0 && shot.x < canvas.width + 40);
}

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawPixelBackground(t) {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#111827");
  g.addColorStop(1, "#070913");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 24) {
    for (let x = 0; x < canvas.width; x += 24) {
      const pulse = Math.sin((x + y + t * 0.045) * 0.08) > 0.72;
      rect(x, y, 3, 3, pulse ? "rgba(117,224,137,.34)" : "rgba(244,247,255,.12)");
    }
  }

  rect(0, 400, canvas.width, 140, "#0d1324");
  for (let x = 0; x < canvas.width; x += 48) {
    rect(x, 400, 46, 4, "#25304f");
    rect(x + 12, 440, 36, 3, "#1b2540");
    rect(x + 4, 492, 42, 3, "#1b2540");
  }

  rect(455, 276, 56, 5, "rgba(244,247,255,.16)");
  rect(448, 292, 70, 5, "rgba(244,247,255,.12)");
}

function drawHero(t) {
  const bob = Math.sin(t * 0.008) * 5;
  const step = mode === "running" && Math.sin(t * 0.018) > 0 ? 1 : -1;
  const x = hero.x;
  const y = hero.y + bob;

  rect(x - 30, y + 96, 98, 12, "rgba(0,0,0,.28)");
  rect(x, y + 28, 72, 58, "#f5f7ff");
  rect(x + 15, y + 45, 13, 13, "#75e089");
  rect(x + 42, y + 50, 28, 7, "#3158ff");
  rect(x + 4, y + 84, 14, 36 + step * 5, "#dfe6ff");
  rect(x + 52, y + 84, 14, 36 - step * 5, "#dfe6ff");
  rect(x - 12, y + 42 + step * 5, 28, 12, "#3158ff");
  rect(x + 64, y + 36 - step * 5, 48, 12, "#3158ff");
  rect(x + 105, y + 32 - step * 5, 22, 8, mode === "running" ? "#75e089" : "#98a6c7");
  if (specialStrike > 0) {
    rect(x + 112, y + 22 - step * 5, 34, 28, "rgba(255,209,102,.72)");
  }

  rect(x - 8, y - 56, 92, 62, "#3158ff");
  rect(x - 18, y - 34, 30, 34, "#3158ff");
  rect(x + 64, y - 42, 32, 38, "#3158ff");
  rect(x + 18, y - 74, 44, 36, "#8b5cff");
  rect(x + 2, y - 48, 72, 18, "rgba(255,255,255,.24)");
  rect(x + 24, y - 31, 16, 18, "#fff");
  rect(x + 40, y - 22, 34, 7, "#fff");
}

function drawClaudeBoss(t) {
  const hit = bossHit > 0 ? 14 : 0;
  const bob = Math.sin(t * 0.006) * 7;
  const x = boss.x + hit;
  const y = boss.y + bob;
  const orange = "#df825d";
  const dark = "#0a0706";

  rect(x - 76, y + 142, 152, 16, "rgba(0,0,0,.32)");
  rect(x - 48, y - 48, 96, 86, orange);
  rect(x - 66, y - 14, 28, 36, orange);
  rect(x + 38, y - 14, 28, 36, orange);
  rect(x - 32, y + 34, 22, 54, orange);
  rect(x + 10, y + 34, 22, 54, orange);
  rect(x - 24, y - 14, 12, 28, dark);
  rect(x + 14, y - 14, 12, 28, dark);

  rect(x - 78, y + 20, 26, 12, "#b95f43");
  rect(x + 52, y + 20, 26, 12, "#b95f43");
  rect(x - 38, y + 92, 24, 18, "#b95f43");
  rect(x + 14, y + 92, 24, 18, "#b95f43");

  if (mode === "running") {
    rect(x - 28, y - 26, 20, 5, "#6b2d21");
    rect(x + 8, y - 26, 20, 5, "#6b2d21");
  }

  if (bossHit > 0) {
    rect(x - 70, y - 62, 140, 134, "rgba(117,224,137,.16)");
  }
}

function drawProjectiles() {
  heroShots.forEach((shot) => {
    rect(shot.x - 10, shot.y - 3, shot.special ? 56 : 34, shot.special ? 9 : 6, shot.special ? "#ffd166" : "#75e089");
    rect(shot.x + 18, shot.y - 9, 12, 18, shot.special ? "#fff2a8" : "#8b5cff");
  });
}

function drawParticles() {
  particles = particles.filter((p) => p.life > 0);
  particles.forEach((p) => {
    rect(p.x, p.y, 5, 5, p.color);
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= 1;
  });
}

function render(now) {
  tick(now);
  updateProjectiles();
  const dx = shake ? (Math.random() - 0.5) * shake : 0;
  const dy = shake ? (Math.random() - 0.5) * shake : 0;

  ctx.save();
  ctx.translate(dx, dy);
  drawPixelBackground(now);
  drawHero(now);
  drawClaudeBoss(now);
  drawProjectiles();
  drawParticles();
  ctx.restore();

  bossHit = Math.max(0, bossHit - 1);
  specialStrike = Math.max(0, specialStrike - 1);
  shake = Math.max(0, shake - 0.6);
  requestAnimationFrame(render);
}

startButton.addEventListener("click", start);
pauseButton.addEventListener("click", pause);
resetButton.addEventListener("click", reset);
canvas.addEventListener("click", () => fireFocusBolt(performance.now(), true));
questInput.addEventListener("input", updateHud);
focusCheckButton.addEventListener("click", () => {
  hideFocusCheck();
  specialStrike = 38;
  shake = 5;
  for (let i = 0; i < 5; i += 1) {
    window.setTimeout(() => fireFocusBolt(performance.now(), true, true), i * 90);
  }
  setToast("Focus confirmed. Special strike charged.");
});
window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    fireFocusBolt(performance.now(), true);
  }
});

updateHud();
requestAnimationFrame(render);
