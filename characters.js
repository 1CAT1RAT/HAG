const ICON_FALLBACK = "icons/bloo_icon.png";
const RENDER_FALLBACK = "renders/placeholder_render.png";
const REFRESH_TOKEN = String(Date.now());
const CHARACTER_MUSIC = {
  evil_man: "music/EvilMan_Song.mp3",
  fnffan: "music/fnffan_song.mp3",
  queen_of_jesters: "music/Queen_Song.mp3",
  tea: "music/Tea_Song.mp3"
};

const ALIGNMENT_OVERRIDES = {
  gorgon: "good",
  chevy: "good",
  jp: "good",
  jeremy: "good",
  tea: "good",
  fnffan: "good",
  irish: "good",
  umbra: "good",
  rebecca: "good",
  chao: "good",
  bloo: "good",
  good_woman: "good",
  evil_man: "bad",
  pm73: "bad",
  killer_jeremy: "bad",
  pestilence: "bad",
  queen_of_jesters: "bad",
  green_guy: "good"
};

document.addEventListener("DOMContentLoaded", initCharactersPage);

async function initCharactersPage() {
  const state = {
    characters: [],
    detailViewOpen: false,
    currentAudio: null
  };

  const grid = document.getElementById("grid");
  const detailOverlay = document.getElementById("detailOverlay");
  const detailContainer = document.getElementById("detailContainer");
  const closeDetailBtn = document.getElementById("closeDetail");

  if (!grid || !detailOverlay || !detailContainer || !closeDetailBtn) {
    return;
  }

  state.characters = await loadCharacterData();
  renderCharacterGrid(state.characters, grid, showDetailView);

  closeDetailBtn.addEventListener("click", closeDetailView);
  detailOverlay.addEventListener("click", closeDetailView);
  detailContainer.addEventListener("click", (event) => event.stopPropagation());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.detailViewOpen) {
      closeDetailView();
    }
  });

  function closeDetailView() {
    state.detailViewOpen = false;
    stopCharacterMusic();
    detailOverlay.classList.remove("show");
    detailContainer.classList.remove("show");
    closeDetailBtn.classList.remove("show");
    grid.classList.remove("hidden");
    document.body.style.overflow = "";

    window.setTimeout(() => {
      if (!state.detailViewOpen) {
        detailContainer.innerHTML = "";
      }
    }, 450);
  }

  function showDetailView(character, index) {
    if (state.detailViewOpen) {
      return;
    }

    state.detailViewOpen = true;
    grid.classList.add("hidden");
    document.body.style.overflow = "hidden";

    const slug = slugifyCharacterName(character.name);
    const relationshipStats = calculateRelationshipStats(index);
    const alignment = getCharacterAlignment(character, index, relationshipStats);
    const sceneBackground = alignment === "bad" ? "renders/Bad_BG.png" : "renders/Good_BG.png";
    const renderBackdrop = alignment === "bad" ? "renders/Bad_Render_BG.png" : "renders/Good_Render_BG.png";
    const detailCardClass = alignment === "good" ? "char-detail-card char-detail-card--good" : "char-detail-card";
    const iconWrapperClass = alignment === "good" ? "char-detail-icon-wrapper char-detail-icon-wrapper--framed" : "char-detail-icon-wrapper";

    detailContainer.innerHTML = `
      <section
        class="detail-scene detail-scene--${alignment}"
        style="--accent:${character.color}; --scene-bg:url('${sceneBackground}'); --render-bg:url('${renderBackdrop}');"
      >
        <div class="detail-scene-bg" aria-hidden="true"></div>

        <div class="detail-content-grid">
          <article class="${detailCardClass}">
            <div class="${iconWrapperClass}">
              <img
                src="${buildIconSrc(slug)}"
                alt="${escapeHtml(character.name)} icon"
                class="char-detail-icon"
              >
            </div>
            <p class="detail-alignment-tag">${alignment === "bad" ? "Bad Presence" : "Good Presence"}</p>
            <h2 class="char-detail-name">${escapeHtml(character.name)}</h2>
            <p class="char-detail-role">${escapeHtml(character.role)}</p>
          </article>

          <section class="char-detail-stats">
            <h3>Character Stats</h3>
            ${buildStatRow("STR", character.stats.str, 10, "linear-gradient(90deg, #ff7a59, var(--accent))")}
            ${buildStatRow("DEF", character.stats.def, 10, "linear-gradient(90deg, #5dc7b5, var(--accent))")}
            ${buildStatRow("DEX", character.stats.dex, 10, "linear-gradient(90deg, #f4cf64, var(--accent))")}
            ${buildStatRow("INT", character.stats.int, 10, "linear-gradient(90deg, #95b8ff, var(--accent))")}
            ${buildStatRow("CHR", character.stats.chr, 10, "linear-gradient(90deg, #ff95b4, var(--accent))")}
            ${buildStatRow("SPD", character.stats.spd, 10, "linear-gradient(90deg, #7bd1ff, var(--accent))")}
          </section>

          <section class="char-detail-info">
            <div class="detail-section">
              <h3>About Them</h3>
              <p>${escapeHtml(character.aboutThem)}</p>
            </div>

            <div class="detail-section">
              <h3>Backstory</h3>
              <p class="backstory-text">${escapeHtml(character.backstory)}</p>
            </div>

            <div class="detail-section">
              <h3>Relationship Stats</h3>
              ${buildStatRow("Allies", relationshipStats.allies, relationshipStats.total, "linear-gradient(90deg, #6ee7b7, var(--accent))")}
              ${buildStatRow("Rivals", relationshipStats.rivals, relationshipStats.total, "linear-gradient(90deg, #ff6f61, #7a2c2c)")}
              ${buildStatRow("Neutral", relationshipStats.neutral, relationshipStats.total, "linear-gradient(90deg, #d4b483, #8b7355)")}
            </div>
          </section>
        </div>

        <aside class="char-detail-render">
          <div class="char-detail-render-bg" aria-hidden="true"></div>
          ${buildRenderMarkup(character, slug, alignment)}
        </aside>
      </section>
    `;

    const detailIcon = detailContainer.querySelector(".char-detail-icon");
    const detailRender = detailContainer.querySelector(".char-render");

    if (detailIcon) {
      detailIcon.onerror = () => {
        detailIcon.onerror = null;
        detailIcon.src = withAssetVersion(ICON_FALLBACK);
      };
    }

    if (detailRender) {
      detailRender.onerror = () => {
        detailRender.onerror = null;
        detailRender.src = withAssetVersion(RENDER_FALLBACK);
      };
    }

    detailOverlay.classList.add("show");
    closeDetailBtn.classList.add("show");
    playCharacterMusic(slug);

    requestAnimationFrame(() => {
      detailContainer.classList.add("show");
    });
  }

  function playCharacterMusic(slug) {
    stopCharacterMusic();

    const musicPath = CHARACTER_MUSIC[slug];
    if (!musicPath) {
      return;
    }

    const audio = new Audio(withAssetVersion(musicPath));
    audio.loop = true;
    audio.volume = 0.55;
    state.currentAudio = audio;
    audio.play().catch(() => {
      state.currentAudio = null;
    });
  }

  function stopCharacterMusic() {
    if (!state.currentAudio) {
      return;
    }

    state.currentAudio.pause();
    state.currentAudio.currentTime = 0;
    state.currentAudio = null;
  }
}

async function loadCharacterData() {
  try {
    const response = await fetch("characterData.json");
    if (!response.ok) {
      throw new Error(`Failed to load characterData.json (${response.status})`);
    }

    const data = await response.json();
    return Array.isArray(data.characters) ? data.characters : [];
  } catch (error) {
    console.error("Error loading character data:", error);
    console.warn("Falling back to embedded character data. Serve the site over HTTP to avoid local file CORS issues.");

    return [
      {
        name: "Fallback One",
        role: "Agent",
        color: "#808080",
        aboutThem: "Fallback character.",
        backstory: "put backstory here",
        stats: { str: 5, def: 5, dex: 5, int: 5, chr: 5, spd: 5 }
      },
      {
        name: "Fallback Two",
        role: "Rival",
        color: "#606060",
        aboutThem: "Fallback character two.",
        backstory: "put backstory here",
        stats: { str: 6, def: 4, dex: 5, int: 5, chr: 3, spd: 5 }
      },
      {
        name: "Fallback Three",
        role: "Neutral",
        color: "#909090",
        aboutThem: "Fallback character three.",
        backstory: "put backstory here",
        stats: { str: 4, def: 5, dex: 5, int: 6, chr: 5, spd: 5 }
      }
    ];
  }
}

function renderCharacterGrid(characters, grid, onSelect) {
  const fragment = document.createDocumentFragment();

  characters.forEach((character, index) => {
    const slug = slugifyCharacterName(character.name);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "char-card";
    card.dataset.index = String(index);
    card.style.setProperty("--color", character.color);

    card.innerHTML = `
      <div class="card-glow"></div>
      <div class="card-inner">
        <div class="card-icon-wrapper">
          <img src="${buildIconSrc(slug)}" alt="${escapeHtml(character.name)}" class="card-icon">
          <div class="icon-bg" style="background:${character.color}33;"></div>
        </div>
        <div class="card-info">
          <h3>${escapeHtml(character.name)}</h3>
          <p>${escapeHtml(character.role)}</p>
        </div>
      </div>
      <div class="card-shine"></div>
    `;

    const icon = card.querySelector(".card-icon");
    if (icon) {
      icon.onerror = () => {
        icon.onerror = null;
        icon.src = withAssetVersion(ICON_FALLBACK);
      };
    }

    card.addEventListener("click", () => onSelect(character, index));
    fragment.appendChild(card);
  });

  grid.innerHTML = "";
  grid.appendChild(fragment);
}

function calculateRelationshipStats(characterIndex) {
  if (typeof MATRIX_DATA === "undefined" || !Array.isArray(MATRIX_DATA[characterIndex])) {
    return { allies: 0, rivals: 0, neutral: 0, average: 0, total: 1 };
  }

  const row = MATRIX_DATA[characterIndex];
  let allies = 0;
  let rivals = 0;
  let neutral = 0;
  let sum = 0;
  let total = 0;

  for (let index = 0; index < row.length; index += 1) {
    if (index === characterIndex) {
      continue;
    }

    const value = row[index];
    sum += value;
    total += 1;

    if (value === 1) {
      allies += 1;
    } else if (value === 5) {
      rivals += 1;
    } else {
      neutral += 1;
    }
  }

  return {
    allies,
    rivals,
    neutral,
    average: total ? sum / total : 0,
    total: total || 1
  };
}

function getCharacterAlignment(character, index, relationshipStats) {
  const slug = slugifyCharacterName(character.name);
  if (ALIGNMENT_OVERRIDES[slug]) {
    return ALIGNMENT_OVERRIDES[slug];
  }

  return relationshipStats.average >= 3 ? "bad" : "good";
}

function buildStatRow(label, value, maxValue, fillBackground) {
  const safeMax = Math.max(maxValue || 1, 1);
  const safeValue = Math.max(0, Math.min(value, safeMax));
  const fillWidth = (safeValue / safeMax) * 100;

  return `
    <div class="stat-row">
      <span class="stat-label">${escapeHtml(label)}</span>
      <div class="stat-bar">
        <div class="stat-fill" style="width:${fillWidth}%; background:${fillBackground};"></div>
      </div>
      <span class="stat-value">${safeValue}${safeMax === 10 ? "/10" : ""}</span>
    </div>
  `;
}

function slugifyCharacterName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildIconSrc(slug) {
  return withAssetVersion(`icons/${slug}_icon.png`);
}

function buildRenderSrc(slug) {
  return withAssetVersion(`renders/${slug}_render.png`);
}

function buildRenderMarkup(character, slug, alignment) {
  if (slug === "green_guy" && alignment === "good") {
    return `
      <div
        class="char-render char-render--sheet char-render--green-guy"
        aria-label="${escapeHtml(character.name)} animated render"
        role="img"
        style="--sheet:url('${withAssetVersion("renders/green_guy_render_sheet.png")}');"
      ></div>
    `;
  }

  return `
    <img
      src="${buildRenderSrc(slug)}"
      alt="${escapeHtml(character.name)} render"
      class="char-render"
    >
  `;
}

function withAssetVersion(path) {
  return `${path}?v=${REFRESH_TOKEN}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
