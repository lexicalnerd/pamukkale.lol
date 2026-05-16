const field = document.querySelector(".ascii-field");
const stage = document.querySelector(".stage");
const replayButton = document.querySelector(".replay-button");
const navLinks = document.querySelectorAll("[data-route]");
const pages = document.querySelectorAll("[data-page]");

const glyphs = [
  ";",
  ")",
  "(",
  "=",
  "+",
  "*",
  "/",
  "\\",
  "{",
  "}",
  "[",
  "]",
  "<",
  ">",
  "_",
  ".",
  ":",
];

let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let ascii = [];
let ambient = [];
let isTouching = false;
let hasPointer = false;
let hasPointerPosition = false;
let currentPage = "home";
const startupTime = performance.now();
let startupComplete = false;

function isMobilePointer() {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

function randomGlyph() {
  return glyphs[Math.floor(Math.random() * glyphs.length)];
}

function buildField() {
  field.replaceChildren();

  const density = window.innerWidth < 700 ? 22 : 18;
  const columns = Math.ceil(window.innerWidth / density) + 2;
  const rows = Math.ceil(window.innerHeight / density) + 2;

  ascii = [];
  ambient = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const el = document.createElement("span");
      const x = column * density - density;
      const y = row * density - density;

      el.className = "glyph";
      el.textContent = randomGlyph();
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
      el.style.setProperty("--size", `${window.innerWidth < 700 ? 11 : 13}px`);
      field.appendChild(el);
      ascii.push({
        el,
        x,
        y,
        phase: Math.random() * Math.PI * 2,
        warp: 0.72 + Math.random() * 0.58,
      });
    }
  }

  buildAmbientGlyphs();
}

function edgePoint(inset) {
  const side = Math.floor(Math.random() * 4);

  if (side === 0) {
    return {
      x: Math.random() * window.innerWidth,
      y: inset + Math.random() * 90,
    };
  }

  if (side === 1) {
    return {
      x: window.innerWidth - inset - Math.random() * 90,
      y: Math.random() * window.innerHeight,
    };
  }

  if (side === 2) {
    return {
      x: Math.random() * window.innerWidth,
      y: window.innerHeight - inset - Math.random() * 90,
    };
  }

  return {
    x: inset + Math.random() * 90,
    y: Math.random() * window.innerHeight,
  };
}

function buildAmbientGlyphs() {
  const count = window.innerWidth < 700 ? 18 : 34;
  const inset = window.innerWidth < 700 ? 18 : 30;

  for (let i = 0; i < count; i += 1) {
    const el = document.createElement("span");
    const point = edgePoint(inset);

    el.className = "ambient-glyph";
    el.textContent = randomGlyph();
    el.style.setProperty("--x", `${point.x}px`);
    el.style.setProperty("--y", `${point.y}px`);
    el.style.setProperty("--speed", `${2.6 + Math.random() * 4.8}s`);
    el.style.setProperty("--delay", `${Math.random() * -6}s`);
    field.appendChild(el);
    ambient.push(el);
  }
}

function onPointerMove(event) {
  const movement = Math.hypot(event.movementX || 0, event.movementY || 0);
  const isSettled = performance.now() - startupTime > 120;

  if (!hasPointerPosition) {
    pointerX = event.clientX;
    pointerY = event.clientY;
    hasPointerPosition = true;
    hasPointer = startupComplete && isSettled;
    return;
  }

  pointerX = event.clientX;
  pointerY = event.clientY;
  hasPointer = hasPointer || (isSettled && movement > 0);
}

function onPointerDown(event) {
  pointerX = event.clientX;
  pointerY = event.clientY;
  hasPointerPosition = true;
  hasPointer = true;
  isTouching = true;
}

function onPointerUp() {
  isTouching = false;
}

function onPointerLeave() {
  hasPointer = false;
  hasPointerPosition = false;
}

function revealField() {
  const radius = Math.min(62, Math.max(38, window.innerWidth * 0.04));
  const canReveal =
    startupComplete && hasPointer && (!isMobilePointer() || isTouching);

  ascii.forEach(({ el, x, y, phase, warp }) => {
    const dx = pointerX - x;
    const dy = pointerY - y;
    const angle = Math.atan2(dy, dx);
    const jag =
      Math.sin(angle * 3 + phase) * 8 +
      Math.cos(angle * 7 - phase * 0.6) * 5 +
      Math.sin((x + y) * 0.035) * 4;
    const distance = Math.hypot(dx * warp, dy / warp);

    if (canReveal && distance < radius + jag) {
      el.classList.add("revealed");
    } else {
      el.classList.remove("revealed");
    }
  });

  requestAnimationFrame(revealField);
}

function routeFromHash() {
  const route = window.location.hash.replace("#", "");
  return [...pages].some((page) => page.dataset.page === route) ? route : "home";
}

function setPage(nextPage) {
  if (nextPage === currentPage) {
    return;
  }

  const outgoing = document.querySelector(`[data-page="${currentPage}"]`);
  const incoming = document.querySelector(`[data-page="${nextPage}"]`);

  if (!incoming) {
    return;
  }

  if (outgoing) {
    outgoing.classList.add("exiting");
    outgoing.classList.remove("active");
  }

  incoming.classList.remove("exiting");
  incoming.classList.add("active");

  navLinks.forEach((link) => {
    const isActive = link.dataset.route === nextPage;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  window.setTimeout(() => outgoing?.classList.remove("exiting"), 190);
  currentPage = nextPage;
}

function navigate(route) {
  if (route === currentPage) {
    return;
  }

  history.pushState({ route }, "", route === "home" ? "#" : `#${route}`);
  setPage(route);
}

function replayIntro() {
  stage.classList.add("replaying");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      stage.classList.remove("replaying");
    });
  });
}

window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("pointerdown", onPointerDown, { passive: true });
window.addEventListener("pointerup", onPointerUp, { passive: true });
window.addEventListener("pointercancel", onPointerUp, { passive: true });
window.addEventListener("pointerleave", onPointerLeave, { passive: true });
window.addEventListener("resize", buildField);
window.addEventListener("popstate", () => setPage(routeFromHash()));
replayButton.addEventListener("click", replayIntro);

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate(link.dataset.route);
  });
});

buildField();
setPage(routeFromHash());
window.setTimeout(() => {
  startupComplete = true;
  hasPointer = false;
  hasPointerPosition = false;
}, 140);
requestAnimationFrame(revealField);
