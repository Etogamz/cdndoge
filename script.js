// script.js
const STATUS_MAP = {
  online: { text: "Online", cls: "online" },
  idle: { text: "Idle", cls: "idle" },
  dnd: { text: "Do Not Disturb", cls: "dnd" },
  invisible: { text: "Offline", cls: "offline" },
  offline: { text: "Offline", cls: "offline" }
};

async function fetchDiscordData() {
  try {
    const res = await fetch("/api/discord", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const usernameEl = document.getElementById("username");
    const avatarEl = document.getElementById("avatar");
    const faviconEl = document.getElementById("favicon");
    const statusTextEl = document.getElementById("status-text");
    const statusDotEl = document.getElementById("status-dot");

    if (data.username) usernameEl.textContent = data.username;
    if (data.avatar) {
      avatarEl.src = data.avatar;
      faviconEl.href = data.avatar;
    }

    let raw = data.discord_status ||
              (data.presence && data.presence.status) ||
              data.status ||
              data.presenceStatus ||
              data.online_status ||
              "offline";

    raw = String(raw).toLowerCase();
    if (["invisible","unknown"].includes(raw)) raw = "offline";
    if (!STATUS_MAP[raw]) raw = "offline";

    const mapped = STATUS_MAP[raw];
    statusDotEl.className = "status-dot " + mapped.cls;
    statusTextEl.textContent = mapped.text;

  } catch(err) {
    console.error("fetchDiscordData error:", err);
    const statusTextEl = document.getElementById("status-text");
    const statusDotEl = document.getElementById("status-dot");
    statusDotEl.className = "status-dot offline";
    statusTextEl.textContent = "Offline";
  }
}

fetchDiscordData();
setInterval(fetchDiscordData, 5000);

window.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("enter-screen");
  const mainContent = document.getElementById("main-content");
  const music = document.getElementById("bg-music");

  let enteredSite = false;
  let wasPlayingBeforeHide = false;

  // Audio setup
  music.loop = true;
  music.volume = 0;

  function fadeAudio(targetVol, duration = 1000) {
    const startVol = music.volume;
    const stepTime = 50;
    const steps = duration / stepTime;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      music.volume = startVol + (targetVol - startVol) * (currentStep / steps);
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        music.volume = targetVol;
        if (targetVol === 0) music.pause();
      }
    }, stepTime);
  }

  // Overlay click to enter
  overlay.addEventListener("click", () => {
    enteredSite = true;
    overlay.classList.add("hidden");
    setTimeout(() => {
      overlay.style.display = "none";
      mainContent.classList.remove("hidden");
    }, 1500);

    music.play().then(() => fadeAudio(0.1, 1500)).catch(() => {});
  });

  // Visibility handling
  document.addEventListener("visibilitychange", () => {
    if (!enteredSite) return;

    if (document.hidden) {
      wasPlayingBeforeHide = !music.paused;
      fadeAudio(0, 1000); // fade out and pause
    } else {
      if (wasPlayingBeforeHide) {
        music.play().then(() => fadeAudio(0.1, 1000)).catch(() => {});
      }
    }
  });

  // === Particle setup (same as before) ===
  const canvas = document.createElement("canvas");
  canvas.id = "cursor-particles-canvas";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  window.addEventListener("mousemove", e => {
    particles.push(new Particle(e.clientX, e.clientY));
  });

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 4 + 2;
      this.speedX = (Math.random() - 0.5) * 1.5;
      this.speedY = (Math.random() - 0.5) * 1.5;
      this.color = "rgba(255,255,255," + (Math.random()*0.5+0.3) + ")";
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.size *= 0.96;
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function handleParticles() {
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].size < 0.5) { particles.splice(i,1); i--; }
    }
  }

  function animateParticles() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    handleParticles();
    requestAnimationFrame(animateParticles);
  }
  animateParticles();
});