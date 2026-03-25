const INFOCARD_ICON_FALLBACK = "icons/bloo_icon.png";
const INFOCARD_ASSET_VERSION = String(Date.now());

document.addEventListener("DOMContentLoaded", initInfoCardsPage);

async function initInfoCardsPage() {
  const deck = document.getElementById("cardDeck");
  const prevButton = document.getElementById("prevCard");
  const nextButton = document.getElementById("nextCard");
  const readout = document.getElementById("hudReadout");
  const hudFrame = document.getElementById("hudFrame");

  if (!deck || !prevButton || !nextButton || !readout || !hudFrame) {
    return;
  }

  const characters = await loadInfoCardCharacters();
  if (!characters.length) {
    readout.querySelector(".readout-name").textContent = "No Characters";
    readout.querySelector(".readout-role").textContent = "characterData.json could not be loaded";
    return;
  }

  const state = {
    characters,
    activeIndex: 0,
    pointerX: 0,
    pointerY: 0,
    targetX: 0,
    targetY: 0,
    idleTime: 0
  };

  bindCameraMotion();
  renderDeck();
  syncReadout();

  prevButton.addEventListener("click", () => stepDeck(-1));
  nextButton.addEventListener("click", () => stepDeck(1));

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepDeck(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepDeck(1);
    }
  });

  function bindCameraMotion() {
    hudFrame.addEventListener("pointermove", (event) => {
      const rect = hudFrame.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      state.targetX = (x - 0.5) * 2;
      state.targetY = (y - 0.5) * 2;
      state.idleTime = 0;
    });

    hudFrame.addEventListener("pointerleave", () => {
      state.targetX = 0;
      state.targetY = 0;
    });

    animateCamera();
  }

  function animateCamera() {
    state.idleTime += 0.016;
    const idleX = Math.sin(state.idleTime * 0.9) * 0.14;
    const idleY = Math.cos(state.idleTime * 0.7) * 0.08;
    const desiredX = Math.abs(state.targetX) > 0.001 ? state.targetX : idleX;
    const desiredY = Math.abs(state.targetY) > 0.001 ? state.targetY : idleY;

    state.pointerX += (desiredX - state.pointerX) * 0.08;
    state.pointerY += (desiredY - state.pointerY) * 0.08;

    hudFrame.style.setProperty("--camera-rotate-x", `${-state.pointerY * 6}deg`);
    hudFrame.style.setProperty("--camera-rotate-y", `${state.pointerX * 10}deg`);
    hudFrame.style.setProperty("--camera-shift-x", `${state.pointerX * 10}px`);
    hudFrame.style.setProperty("--camera-shift-y", `${state.pointerY * 8}px`);

    requestAnimationFrame(animateCamera);
  }

  function stepDeck(direction) {
    const total = state.characters.length;
    state.activeIndex = (state.activeIndex + direction + total) % total;
    renderDeck();
    syncReadout();
  }

  function renderDeck() {
    const fragment = document.createDocumentFragment();
    const total = state.characters.length;

    state.characters.forEach((character, index) => {
      const offset = getCircularOffset(index, state.activeIndex, total);
      const absOffset = Math.abs(offset);
      const slug = slugifyInfoCardName(character.name);
      const opacity = absOffset > 5 ? 0 : 1 - absOffset * 0.17;
      const scale = absOffset === 0 ? 1.06 : Math.max(0.68, 1 - absOffset * 0.09);
      const spread = 156;
      const arcLift = absOffset * absOffset * 14;
      const translateX = offset * spread;
      const translateY = 22 + arcLift;
      const translateZ = 300 - absOffset * 140;
      const rotateX = 72 - absOffset * 2;
      const rotateY = offset * -28;
      const rotateZ = offset * -7.5;
      const shimmerX = state.pointerX * (absOffset === 0 ? 10 : 4);
      const shimmerY = state.pointerY * (absOffset === 0 ? 10 : 4);
      const zIndex = 100 + Math.max(0, 12 - absOffset);

      const card = document.createElement("article");
      card.className = `hud-card ${absOffset === 0 ? "is-active" : absOffset === 1 ? "is-near" : "is-far"}`;
      card.style.setProperty("--card-accent", `${character.color}22`);
      card.style.opacity = String(opacity);
      card.style.zIndex = String(zIndex);
      card.style.transform = [
        `translate3d(calc(-50% + ${translateX + shimmerX}px), calc(-50% + ${translateY + shimmerY}px), ${translateZ}px)`,
        `rotateX(${rotateX}deg)`,
        `rotateY(${rotateY}deg)`,
        `rotateZ(${rotateZ}deg)`,
        `scale(${scale})`
      ].join(" ");
      card.setAttribute("aria-hidden", absOffset === 0 ? "false" : "true");

      card.innerHTML = `
        <div class="hud-card-shell" aria-hidden="true">
          <div class="hud-card-back"></div>
          <div class="hud-card-edge"></div>
        </div>
        <div class="hud-card-inner">
          <div class="hud-card-head">
            <span>Character Card</span>
            <span class="hud-card-index">${String(index + 1).padStart(2, "0")}</span>
          </div>
          <div class="hud-card-portrait">
            <img src="${buildInfoCardRenderSrc(slug)}" alt="${escapeInfoCardHtml(character.name)} render">
          </div>
          <div class="hud-card-copy">
            <h2>${escapeInfoCardHtml(character.name)}</h2>
            <p class="hud-card-role">${escapeInfoCardHtml(character.role)}</p>
            <p class="hud-card-about">${escapeInfoCardHtml(character.aboutThem)}</p>
          </div>
        </div>
      `;

      const image = card.querySelector("img");
      if (image) {
        image.onerror = () => {
          image.onerror = null;
          image.src = buildInfoCardIconSrc(slug);
          image.onerror = () => {
            image.onerror = null;
            image.src = withInfoCardVersion(INFOCARD_ICON_FALLBACK);
          };
        };
      }

      fragment.appendChild(card);
    });

    deck.innerHTML = "";
    deck.appendChild(fragment);
  }

  function syncReadout() {
    const character = state.characters[state.activeIndex];
    readout.querySelector(".readout-name").textContent = character.name;
    readout.querySelector(".readout-role").textContent = `${character.role} / ${state.activeIndex + 1} of ${state.characters.length}`;
    readout.style.borderColor = `${character.color}55`;
    readout.style.boxShadow = `0 14px 32px rgba(0,0,0,0.08), 0 0 0 1px ${character.color}22 inset`;
  }
}

async function loadInfoCardCharacters() {
  try {
    const response = await fetch("characterData.json");
    if (!response.ok) {
      throw new Error(`Failed to load characterData.json (${response.status})`);
    }

    const data = await response.json();
    return Array.isArray(data.characters) ? data.characters : [];
  } catch (error) {
    console.error("Failed to load InfoCards data:", error);
    return [];
  }
}

function getCircularOffset(index, activeIndex, total) {
  let delta = index - activeIndex;

  if (delta > total / 2) {
    delta -= total;
  } else if (delta < -total / 2) {
    delta += total;
  }

  return delta;
}

function slugifyInfoCardName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildInfoCardRenderSrc(slug) {
  return withInfoCardVersion(`renders/${slug}_render.png`);
}

function buildInfoCardIconSrc(slug) {
  return withInfoCardVersion(`icons/${slug}_icon.png`);
}

function withInfoCardVersion(path) {
  return `${path}?v=${INFOCARD_ASSET_VERSION}`;
}

function escapeInfoCardHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
