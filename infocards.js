const INFOCARD_ICON_FALLBACK = "icons/bloo_icon.png";
const INFOCARD_ASSET_VERSION = String(Date.now());

document.addEventListener("DOMContentLoaded", initInfoCardsPage);

async function initInfoCardsPage() {
  const deck = document.getElementById("cardDeck");
  const prevButton = document.getElementById("prevCard");
  const nextButton = document.getElementById("nextCard");
  const readout = document.getElementById("hudReadout");

  if (!deck || !prevButton || !nextButton || !readout) {
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
    activeIndex: 0
  };

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
      const depth = Math.max(0, 10 - absOffset);
      const opacity = absOffset > 4 ? 0 : 1 - absOffset * 0.18;
      const scale = absOffset === 0 ? 1 : Math.max(0.74, 1 - absOffset * 0.08);
      const translateX = offset * 118;
      const translateY = absOffset === 0 ? 0 : absOffset * 14;
      const rotateY = offset * -19;
      const rotateZ = offset * -2.6;

      const card = document.createElement("article");
      card.className = `hud-card ${absOffset === 0 ? "is-active" : absOffset === 1 ? "is-near" : "is-far"}`;
      card.style.setProperty("--card-accent", `${character.color}22`);
      card.style.opacity = String(opacity);
      card.style.zIndex = String(100 + depth);
      card.style.transform = [
        `translate3d(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px), ${depth * 22}px)`,
        "rotateX(66deg)",
        `rotateY(${rotateY}deg)`,
        `rotateZ(${rotateZ}deg)`,
        `scale(${scale})`
      ].join(" ");
      card.setAttribute("aria-hidden", absOffset === 0 ? "false" : "true");

      card.innerHTML = `
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
