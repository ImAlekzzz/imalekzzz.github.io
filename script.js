/* ------------------------------------------------------------------ *
 * MISSING IMAGES
 * Any image that fails to load (or is left blank) shows
 * Assets/Pictures/asset_missing.png
 * ------------------------------------------------------------------ */
const MISSING_IMG_URL = new URL("Assets/Pictures/asset_missing.png", document.currentScript.src).href;

const swapInMissing = (img) => {
  if (img.dataset.missing) { img.style.visibility = "hidden"; return; } // asset_missing.png itself is missing: stop
  img.dataset.missing = "1";
  img.classList.remove("cut"); // no squircle / glass on the placeholder
  if (img.parentElement) img.parentElement.querySelectorAll(".icon-glass").forEach((g) => g.remove());
  img.src = MISSING_IMG_URL;
};
document.addEventListener("error", (e) => {
  if (e.target instanceof HTMLImageElement) swapInMissing(e.target);
}, true);
// images that had already failed before this script ran (SVGs are skipped: they can report width 0 while fine)
const checkBrokenImages = () => document.querySelectorAll("img").forEach((img) => {
  const src = img.getAttribute("src");
  if (src && !/\.svg(\?|$)/i.test(src) && img.complete && img.naturalWidth === 0 && !img.dataset.missing) swapInMissing(img);
});
checkBrokenImages();
window.addEventListener("load", checkBrokenImages);

let styleSheet = null;

const SPARK_ELEMENT_WIDTH = 30;
const DISTANCE = 40;
const RANDOMNESS_ON = true;
const NAVIGATE_DELAY = 450; // ms, lets the sparks play before the page changes

/**
 * Util for creating sequences of css transform steps cleanly
 */
function createTransformSteps(...inputSteps) {
  if (inputSteps.length === 0) {
    throw new Error("arguments to createTransformSteps should never be empty!");
  }
  const outputSteps = [inputSteps.shift()];
  inputSteps.forEach((step, i) => {
    outputSteps.push(`${outputSteps[i]} ${step}`);
  });
  return outputSteps;
}


/**
 * Creates a new keyframe rule with a specific spark rotation
 */
const dynamicAnimation = (name, rotation) => {
  if (!styleSheet) {
    styleSheet = document.createElement("style");
    document.head.appendChild(styleSheet);
  }

  const randomDist = RANDOMNESS_ON
    ? Math.floor((Math.random() - 0.5) * DISTANCE * 0.7)
    : 0;

  const [s1, s2, s3] = createTransformSteps(
    `translate(-50%, -50%) rotate(${rotation}deg) translate(10px, 0px)`,
    `translate(${DISTANCE + randomDist}px, 0px) scale(0.5, 0.5)`,
    `translate(${SPARK_ELEMENT_WIDTH / 2}px, 0) scale(0, 0)`
  );

  styleSheet.sheet.insertRule(
    `@keyframes ${name} {
       0%   { transform: ${s1}; }
       70%  { transform: ${s2}; }
       100% { transform: ${s3}; }
     }`,
    styleSheet.sheet.cssRules.length
  );
};

const makeSpark = (center, rotation) => {
  const div = document.createElement("div");
  const aniName = `disappear_${rotation}_${Math.random().toString(36).slice(2, 7)}`;
  dynamicAnimation(aniName, rotation);

  div.classList.add("spark");
  div.style.left = `${center.x}px`;
  div.style.top = `${center.y}px`;
  div.style.animation = `${aniName} 500ms ease-out both`;
  document.body.append(div);
  setTimeout(() => div.remove(), 1000);
};

const makeBurst = (center) => {
  for (let i = 0; i < 8; i++) {
    const randomSpace = RANDOMNESS_ON ? Math.floor(-17 + Math.random() * 34) : 0;
    makeSpark(center, 45 * i + randomSpace);
  }
};

/**
 * One listener on the container handles every button, including ones
 * you add later
 */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");

  // clientX/Y are 0 for keyboard "clicks", so fall back to the button's center
  let center = { x: e.clientX, y: e.clientY };
  if (btn && !e.detail) {
    const r = btn.getBoundingClientRect();
    center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  makeBurst(center);


  const href = btn && btn.dataset.href;
  if (href) {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) {
      window.open(url.href, "_blank", "noopener"); // <- if it opens an external site it opens a new tab since i mostly close them and thats how i like it
    } else {
      setTimeout(() => (window.location.href = href), NAVIGATE_DELAY); // why would you open another tab for the same page?
    }
  }
});

/* ------------------------------------------------------------------ *
 * TEXT SCRAMBLE
 *  - Buttons scramble when hovered (or focused / tapped).
 *  - Any element with data-scramble scrambles when it scrolls into view.
 *      <p data-scramble>Plays once</p>
 *      <p data-scramble="repeat">Plays every time it enters the screen</p>
 * ------------------------------------------------------------------ */

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const escapeHTML = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

class TextScramble {
  constructor(el) {
    this.el = el;
    // all English letters, digits and symbols
    this.chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" +
      "!<>-_\\/[]{}—=+*^?#%&@$~|:;";
    this.running = false;
    this.update = this.update.bind(this);
  }

  // Two sweeps, both left to right:
  //   1. every letter turns into random characters, one after another
  //   2. once fully scrambled, letters settle into the new text, one after another
  // opts.stagger: frames between one letter and the next
  // opts.hold: frames to stay fully scrambled before settling begins
  // opts.maxSweep: cap on frames for one sweep, so long text doesn't take forever
  setText(newText, { stagger = 2, hold = 6, maxSweep = 50 } = {}) {
    const oldText = this.el.textContent;
    const length = Math.max(oldText.length, newText.length);
    const step = Math.min(stagger, maxSweep / Math.max(length, 1));
    const fullyScrambled = (length - 1) * step;
    const promise = new Promise((resolve) => (this.resolve = resolve));
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = i * step; // starts scrambling
      const end = fullyScrambled + hold + i * step;
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.running = true;
    this.update();
    return promise;
  }

  update() {
    let output = "";
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += escapeHTML(to);
      } else if (to === " " || to === "\n") {
        output += " "; 
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="dud">${escapeHTML(char)}</span>`;
      } else {
        output += escapeHTML(from);
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.running = false;
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

const scramblers = new WeakMap();
const getScrambler = (el) => {
  if (!scramblers.has(el)) scramblers.set(el, new TextScramble(el));
  return scramblers.get(el);
};
const cleanText = (el) => el.textContent.replace(/\s+/g, " ").trim();

/* ---- Buttons: scramble on hover (works for buttons added later too) ---- */
const BUTTON_SCRAMBLE = { stagger: 2, hold: 4, maxSweep: 24 }; // short, like u

const scrambleEl = (el) => {
  if (REDUCED_MOTION || "noScramble" in el.dataset) return;
  if (!el.dataset.text) {
    const text = cleanText(el);
    if (!text) return; // icon-only buttons have no text, shocking, aint i right?
    el.dataset.text = text;
  }
  const fx = getScrambler(el);
  if (fx.running) return;
  fx.setText(el.dataset.text, BUTTON_SCRAMBLE);
};

// Buttons: hover the button.
// Cards: put data-hover-scramble on the card and data-hover-text on the text inside it.
document.addEventListener("mouseover", (e) => {
  const btn = e.target.closest("button");
  if (btn && !btn.contains(e.relatedTarget)) scrambleEl(btn);

  const card = e.target.closest("[data-hover-scramble]");
  if (card && !card.contains(e.relatedTarget)) {
    card.querySelectorAll("[data-hover-text]").forEach(scrambleEl);
  }
});

/* Text: scramble in when it enters the screen                                                */
// Safe to call again after adding new [data-scramble] elements (e.g. cards loaded later)
// (only text-only elements: a paragraph that holds a link would lose the link when scrambled)

const initInViewText = () => {
  const targets = [...document.querySelectorAll("[data-scramble]:not([data-text])")].filter((el) => !el.children.length);
  if (!targets.length || REDUCED_MOTION || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting) {
          const fx = getScrambler(el);
          if (!fx.running) {
            el.textContent = ""; // build up from nothing
            fx.setText(el.dataset.text);
          }
          if (el.dataset.scramble !== "repeat") observer.unobserve(el);
        } else if (el.dataset.scramble === "repeat" && !getScrambler(el).running) {
          el.textContent = ""; // reset so it can play again
        }
      });
    },
    { threshold: 0.4 }
  );

  targets.forEach((el) => {
    el.dataset.text = cleanText(el);
    el.style.minHeight = `${el.offsetHeight}px`;
    el.textContent = "";
    observer.observe(el);
  });
};

document.addEventListener("DOMContentLoaded", initInViewText);

/* ------------------------------------------------------------------ *
 * INTRO (home page, desktop only)
 * Click anywhere or press Enter to zoom into the video and continue. Plays on every visit and
 * refresh; skipped when coming back from another page.
 * ------------------------------------------------------------------ */
(() => {
  const intro = document.getElementById("intro");
  if (!intro) return;
  const root = document.documentElement;

  if (root.classList.contains("started")) {
    intro.remove(); // phone, or already seen this session
    return;
  }

  // --- tweak these if forking ---
  const INTRO_ZOOM = 5;       // 1 = 100%
  const INTRO_ZOOM_MS = 3000; // how long the zoom takes (1000ms = 1s, pay attention in school people)
  const INTRO_FADE_MS = 600;  // overlay fade at the end; buttons drop in as it starts (^)
  const INTRO_EASING = "ease-in"; // i dont know what that does but it works so fine by my standards
  const INTRO_ORIGIN = "50% 47%"; // zoom target: x y of the video, if the video isnt fully centered

  const video = intro.querySelector("video");
  if (video) video.style.transformOrigin = INTRO_ORIGIN;

  const start = () => {
    document.removeEventListener("keydown", onKey);
    intro.removeEventListener("click", start);

    const zoomMs = REDUCED_MOTION ? 0 : INTRO_ZOOM_MS;
    intro.classList.add("zooming");
    intro.style.transitionDuration = `${INTRO_FADE_MS}ms`;
    if (video && zoomMs) {
      video.style.transition = `transform ${zoomMs}ms ${INTRO_EASING}`;
      void video.offsetWidth; // make sure the transition starts from the current size
      video.style.transform = `scale(${INTRO_ZOOM})`;
    }

    // near the end of the zoom: fade the overlay out and let the buttons drop in
    setTimeout(() => {
      intro.classList.add("leaving");
      root.classList.add("started");
    }, Math.max(0, zoomMs - INTRO_FADE_MS));
    setTimeout(() => intro.remove(), Math.max(zoomMs, INTRO_FADE_MS) + 100);
  };
  const onKey = (e) => { if (e.key === "Enter" && !e.repeat) start(); };

  intro.addEventListener("click", start);
  document.addEventListener("keydown", onKey);
})();

/* ------------------------------------------------------------------ *
 * SOLAR SYSTEM (desktop home)
 * Draws tilted orbits around "Hi" and places each home button on one.
 * Button N sits at ORBITS[N]. To add a button: add its <button> in
 * index.html AND one more entry in ORBITS. Entries with the same rx/ry
 * share one orbit line (keep rx <= ~720 so it fits).
 * Units: the stage is 1600 x 900 and scales with the window.
 * ------------------------------------------------------------------ */
(() => {
  const svg = document.getElementById("solar");
  const box = document.getElementById("box");
  if (!svg || !box) return;

  // --- tweak these ---
  const BTN_W = 200, BTN_H = 68, BTN_R = 16; // button size and corner radius
  const GAP = 14;      // blank space between a button and the orbit line
  const TILT = -18;    // degrees; negative tilts the right side up
  const ORBITS = [     // angle = where the button sits on its orbit (0 = right, 90 = bottom)
    { rx: 270, ry: 115, angle: 215 }, // About
    { rx: 420, ry: 180, angle: 320 }, // Projects
    { rx: 570, ry: 245, angle: 130 }, // Links
    { rx: 720, ry: 310, angle: 30 },  // Socials
    { rx: 720, ry: 310, angle: 70 },  // Attributions (Same orbit as Socials)
    { rx: 570, ry: 245, angle: 258 }, // Games (Same orbit as Links)
  ];
  // -------------------

  const W = 1600, H = 900, CX = W / 2, CY = H / 2;
  const NS = "http://www.w3.org/2000/svg";
  const make = (name, attrs, parent) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.append(n);
    return n;
  };

  // button size relies here 
  box.style.setProperty("--btn-w", BTN_W);
  box.style.setProperty("--btn-h", BTN_H);
  box.style.setProperty("--btn-r", BTN_R);

  const tilt = (TILT * Math.PI) / 180;
  const spot = ({ rx, ry, angle }) => {
    const t = (angle * Math.PI) / 180;
    const x = rx * Math.cos(t), y = ry * Math.sin(t);
    return {
      x: CX + x * Math.cos(tilt) - y * Math.sin(tilt),
      y: CY + x * Math.sin(tilt) + y * Math.cos(tilt),
    };
  };

  const buttons = [...box.querySelectorAll("button")];
  const spots = buttons.map((_, i) => (ORBITS[i] ? spot(ORBITS[i]) : null));

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  // mask around buttons so it's more asthetically pleasing (idk if you dont like it i do)
  const defs = make("defs", {}, svg);
  const mask = make("mask", { id: "orbit-gaps", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: W, height: H }, defs);
  make("rect", { x: 0, y: 0, width: W, height: H, fill: "white" }, mask);
  spots.forEach((p) => {
    if (!p) return;
    make("rect", {
      x: p.x - BTN_W / 2 - GAP, y: p.y - BTN_H / 2 - GAP,
      width: BTN_W + GAP * 2, height: BTN_H + GAP * 2,
      rx: BTN_R + GAP, fill: "black",
    }, mask);
  });

  const lines = make("g", {
    mask: "url(#orbit-gaps)", fill: "none",
    stroke: "white", "stroke-opacity": 0.55, "stroke-width": 1.5,
  }, svg);
  const drawn = new Set();
  ORBITS.forEach((o) => {
    const key = `${o.rx}x${o.ry}`;
    if (drawn.has(key)) return; // one line per orbit, even if two buttons share it
    drawn.add(key);
    make("ellipse", { cx: CX, cy: CY, rx: o.rx, ry: o.ry, transform: `rotate(${TILT} ${CX} ${CY})` }, lines);
  });

  buttons.forEach((btn, i) => {
    const p = spots[i];
    if (!p) { console.warn(`Button "${btn.textContent.trim()}" has no ORBITS entry`); return; }
    btn.style.left = `${(p.x / W) * 100}%`; // ignored on phones (buttons aren't positioned there)
    btn.style.top = `${(p.y / H) * 100}%`;
  });
})();

/* ------------------------------------------------------------------ *
 * "Hi" (desktop home): scrambles once, as soon as it is shown
 * (after the intro, or straight away if the intro is skipped).
 * ------------------------------------------------------------------ */
(() => {
  const hi = document.querySelector(".solar-hi");
  if (!hi || !matchMedia("(min-width: 900px)").matches) return;
  const root = document.documentElement;

  const play = () => {
    if (REDUCED_MOTION) return;
    getScrambler(hi).setText(hi.textContent.trim(), { stagger: 4, hold: 8, maxSweep: 24 });
  };

  if (root.classList.contains("started")) {
    play();
  } else {
    new MutationObserver((_, obs) => {
      if (root.classList.contains("started")) { obs.disconnect(); play(); }
    }).observe(root, { attributes: true, attributeFilter: ["class"] });
  }
})();

/* simple <a href="exapmle.com"></a> will become the style i like them */

const fancyEl = (tag, className) => {
  const n = document.createElement(tag);
  n.className = className;
  return n;
};

const initFancyLinks = (scope = document) => {
  scope.querySelectorAll("a:not(.fancy-link):not(.no-fancy):not(.ver-btn)").forEach((a) => {
    if (a.children.length) return; // holds an image or other markup
    const text = a.textContent.replace(/\s+/g, " ").trim();
    if (!text) return;

    const letters = (className) => {
      const wrap = fancyEl("span", className);
      wrap.setAttribute("aria-hidden", "true");
      [...text].forEach((ch) => {
        const l = fancyEl("span", "fancy-letter");
        l.textContent = ch === " " ? "\u00a0" : ch;
        wrap.append(l);
      });
      return wrap;
    };

    a.textContent = "";
    a.classList.add("fancy-link");
    a.setAttribute("aria-label", text);
    a.append(
      letters("fancy-letters"),
      fancyEl("span", "fancy-stripe fancy-stripe--a"),
      fancyEl("span", "fancy-stripe fancy-stripe--b"),
      fancyEl("span", "fancy-stripe fancy-stripe--c"),
      letters("fancy-letters-top")
    );

    // other websites: separate tab, because its annoying not to
    if (/^https?:$/.test(a.protocol) && a.origin !== location.origin && !a.target) {
      a.target = "_blank";
      a.rel = "noopener";
    }
  });
};

document.addEventListener("DOMContentLoaded", () => initFancyLinks());

/* ------------------------------------------------------------------ *
 * SEARCH BAR (Games, Projects)
 * Typing hides every [data-search] element whose text doesn't contain the query.
 * Cards set data-search themselves (see each page's script.js).
 * ------------------------------------------------------------------ */
const applySearch = () => {
  const input = document.getElementById("search-input");
  if (!input) return;
  const query = input.value.trim().toLowerCase();
  let total = 0, shown = 0;
  document.querySelectorAll("[data-search]").forEach((el) => {
    total++;
    const hit = !query || el.dataset.search.includes(query);
    el.hidden = !hit;
    if (hit) shown++;
  });
  const empty = document.getElementById("search-empty");
  if (empty) empty.hidden = !(query && total && shown === 0);
};

(() => {
  const box = document.getElementById("search");
  const toggle = document.getElementById("search-toggle");
  const input = document.getElementById("search-input");
  if (!box || !toggle || !input) return;

  const setOpen = (open) => {
    box.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close search" : "Open search");
    input.tabIndex = open ? 0 : -1;
    if (open) {
      input.focus({ preventScroll: true });
    } else {
      input.value = ""; // closing clears the search and shows everything again
      input.blur();
      applySearch();
    }
  };

  toggle.addEventListener("click", () => setOpen(!box.classList.contains("open")));
  input.addEventListener("input", applySearch);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { setOpen(false); toggle.focus(); }
  });
})();
