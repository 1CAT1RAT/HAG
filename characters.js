// Character selection page functionality
window.onload = async () => {
  console.log('characters.js: window.onload fired');
  let charactersData = [];
  let detailViewOpen = false;

  // Function to calculate relationship stats from matrix data
  function calculateRelationshipStats(characterIndex) {
    if (typeof MATRIX_DATA === 'undefined' || !MATRIX_DATA[characterIndex]) {
      return { allies: 0, rivals: 0, neutral: 0 };
    }
    
    const row = MATRIX_DATA[characterIndex];
    let allies = 0, rivals = 0, neutral = 0;
    
    for (let i = 0; i < row.length; i++) {
      if (i === characterIndex) continue; // skip self
      const value = row[i];
      
      if (value === 1) {
        allies++;
      } else if (value === 5) {
        rivals++;
      } else {
        neutral++;
      }
    }
    
    return { allies, rivals, neutral };
  }

  // Load character data from JSON file
  try {
    const response = await fetch('characterData.json');
    charactersData = await response.json();
  } catch (error) {
    console.error('Error loading character data:', error);
    console.warn('Falling back to embedded character data. To fix CORS when opening files locally, serve the site over http (e.g. Live Server or a static server).');
    // Fallback data (used when fetch fails, e.g., file:// CORS)
    charactersData = {
      characters: [
        { name: 'Fallback One', role: 'Agent', color: '#808080', aboutThem: 'Fallback character.', backstory: 'put backstory here', stats: { str: 5, def: 5, dex: 5, int: 5, chr: 5, spd: 5 } },
        { name: 'Fallback Two', role: 'Rival', color: '#606060', aboutThem: 'Fallback character two.', backstory: 'put backstory here', stats: { str: 6, def: 4, dex: 5, int: 5, chr: 3, spd: 5 } },
        { name: 'Fallback Three', role: 'Neutral', color: '#909090', aboutThem: 'Fallback character three.', backstory: 'put backstory here', stats: { str: 4, def: 5, dex: 5, int: 6, chr: 5, spd: 5 } }
      ]
    };
  }

  const characters = charactersData.characters;
  const grid = document.getElementById("grid");
  const detailOverlay = document.getElementById("detailOverlay");
  const detailContainer = document.getElementById("detailContainer");
  const closeDetailBtn = document.getElementById("closeDetail");

  // Generate character cards
  characters.forEach((char, index) => {
    const card = document.createElement("div");
    card.className = "char-card";
    card.dataset.index = index;
    
    const iconName = char.name.toLowerCase().replaceAll(" ", "_");
    
    card.innerHTML = `
      <div class="card-glow"></div>
      <div class="card-inner">
          <div class="card-icon-wrapper">
            <img src="icons/${iconName}_icon.png" alt="${char.name}" class="card-icon" onerror="this.onerror=null;this.src='icons/bloo_icon.png'">
            <div class="icon-bg" style="background: ${char.color}30;"></div>
          </div>
        <div class="card-info">
          <h3>${char.name}</h3>
          <p>${char.role}</p>
        </div>
      </div>
      <div class="card-shine"></div>
    `;

    card.addEventListener("click", () => showDetailView(char, index));
    card.addEventListener("mouseenter", () => {
      card.style.setProperty("--color", char.color);
    });

    grid.appendChild(card);
  });

  // Add fallback for any icon that fails to load (use existing bloo_icon.png)
  setTimeout(() => {
    document.querySelectorAll('.card-icon').forEach(img => {
      img.onerror = () => { img.onerror = null; img.src = 'icons/bloo_icon.png'; };
    });
  }, 50);

  // Runtime validation: try alternate icon filenames if the original 404s (helps on case-sensitive hosts)
  function tryAlternateIcons(imgEl, baseName) {
    const candidates = [
      `icons/${baseName}_icon.png`,
      `icons/${baseName}.png`,
      `icons/${baseName}_icon.PNG`,
      `icons/${baseName}_icon.jpg`,
      `icons/${baseName}_icon.jpeg`,
      `icons/${baseName.charAt(0).toUpperCase() + baseName.slice(1)}_icon.png`
    ];

    let idx = 0;
    const tryNext = () => {
      if (idx >= candidates.length) {
        console.warn(`characters.js: all icon attempts failed for ${baseName}, using default`);
        imgEl.src = 'icons/green_guy_icon.png';
        return;
      }
      const url = candidates[idx++];
      const tester = new Image();
      tester.onload = () => {
        console.log(`characters.js: found icon for ${baseName}: ${url}`);
        imgEl.src = url;
      };
      tester.onerror = () => {
        // try next candidate
        tryNext();
      };
      tester.src = url;
    };
    tryNext();
  }

  // Run checks for each card icon (log the attempted srcs)
  setTimeout(() => {
    document.querySelectorAll('.char-card').forEach(card => {
      const img = card.querySelector('.card-icon');
      if (!img) return;
      const src = img.getAttribute('src') || '';
      console.log('characters.js: card icon initial src ->', src);
      // If image currently failed (naturalWidth === 0) or the path looks likely missing, try alternates
      if (img.naturalWidth === 0) {
        const nameMatch = src.match(/icons\/(.*?)(?:_icon)?\.(png|jpg|jpeg|PNG)/);
        const base = nameMatch ? nameMatch[1].replace(/\.(png|jpg|jpeg)$/i, '') : null;
        if (base) tryAlternateIcons(img, base);
      }
    });
  }, 200);

  // Debug: report how many cards were appended
  setTimeout(() => {
    const count = grid.querySelectorAll('.char-card').length;
    console.log(`characters.js: appended ${count} char-card elements to #grid`);
    if (!count) console.warn('characters.js: no cards found in grid — check if #grid exists and characters.json loaded');
  }, 100);

  function closeDetailView() {
    detailViewOpen = false;
    detailOverlay.classList.remove("show");
    detailContainer.classList.remove("show");
    closeDetailBtn.classList.remove("show");
    grid.classList.remove("hidden");
    document.body.style.overflow = "";
    
    setTimeout(() => {
      detailContainer.innerHTML = "";
    }, 1000);
  }

  function showDetailView(char, index) {
    // Prevent opening if detail view is already open (cooldown)
    if (detailViewOpen) {
      return;
    }
    detailViewOpen = true;

    // Hide grid
    grid.classList.add("hidden");
    document.body.style.overflow = "hidden";

    const iconName = char.name.toLowerCase().replaceAll(" ", "_");
    const renderName = char.name.toLowerCase().replaceAll(" ", "_");

    // Calculate relationship stats from matrix
    const relationshipStats = calculateRelationshipStats(index);
    char.allies = relationshipStats.allies;
    char.rivals = relationshipStats.rivals;
    char.neutral = relationshipStats.neutral;

    // Create detail view
    detailContainer.innerHTML = `
      <div class="char-detail-card">
        <div class="char-detail-icon-wrapper">
          <img src="icons/${iconName}_icon.png" alt="${char.name}" class="char-detail-icon" onerror="this.onerror=null;this.src='icons/bloo_icon.png'">
        </div>
        <h2 class="char-detail-name" style="color: ${char.color}">${char.name}</h2>
        <p class="char-detail-role">${char.role}</p>
      </div>

      <div class="char-detail-stats">
        <h3>Character Stats</h3>
        <div class="stat-row">
          <span class="stat-label">STR</span>
          <div class="stat-bar">
            <div class="stat-fill" style="width: ${(char.stats.str / 10) * 100}%; background: linear-gradient(90deg, #ff6b6b, rgba(124, 58, 237, 0.8));"></div>
          </div>
          <span class="stat-value">${char.stats.str}/10</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">DEF</span>
          <div class="stat-bar">
            <div class="stat-fill" style="width: ${(char.stats.def / 10) * 100}%; background: linear-gradient(90deg, #4ecdc4, rgba(124, 58, 237, 0.8));"></div>
          </div>
          <span class="stat-value">${char.stats.def}/10</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">DEX</span>
          <div class="stat-bar">
            <div class="stat-fill" style="width: ${(char.stats.dex / 10) * 100}%; background: linear-gradient(90deg, #ffe66d, rgba(124, 58, 237, 0.8));"></div>
          </div>
          <span class="stat-value">${char.stats.dex}/10</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">INT</span>
          <div class="stat-bar">
            <div class="stat-fill" style="width: ${(char.stats.int / 10) * 100}%; background: linear-gradient(90deg, #a29bfe, rgba(124, 58, 237, 0.8));"></div>
          </div>
          <span class="stat-value">${char.stats.int}/10</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">CHR</span>
          <div class="stat-bar">
            <div class="stat-fill" style="width: ${(char.stats.chr / 10) * 100}%; background: linear-gradient(90deg, #fd79a8, rgba(124, 58, 237, 0.8));"></div>
          </div>
          <span class="stat-value">${char.stats.chr}/10</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">SPD</span>
          <div class="stat-bar">
            <div class="stat-fill" style="width: ${(char.stats.spd / 10) * 100}%; background: linear-gradient(90deg, #74b9ff, rgba(124, 58, 237, 0.8));"></div>
          </div>
          <span class="stat-value">${char.stats.spd}/10</span>
        </div>
      </div>

      <div class="char-detail-info">
        <div class="detail-section">
          <h3>About Them</h3>
          <p>${char.aboutThem}</p>
        </div>

        <div class="detail-section">
          <h3>Backstory</h3>
          <p class="backstory-text">${char.backstory}</p>
        </div>

        <div class="detail-section">
          <h3>Relationship Stats</h3>
          <div class="stat-row">
            <span class="stat-label">Allies</span>
            <div class="stat-bar">
              <div class="stat-fill" style="width: ${(char.allies / 18) * 100}%; background: linear-gradient(90deg, ${char.color}, rgba(124, 58, 237, 0.8));"></div>
            </div>
            <span class="stat-value">${char.allies}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Rivals</span>
            <div class="stat-bar">
              <div class="stat-fill" style="width: ${(char.rivals / 18) * 100}%; background: linear-gradient(90deg, #ef4444, rgba(124, 58, 237, 0.8));"></div>
            </div>
            <span class="stat-value">${char.rivals}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Neutral</span>
            <div class="stat-bar">
              <div class="stat-fill" style="width: ${(char.neutral / 18) * 100}%; background: linear-gradient(90deg, #8b7355, rgba(124, 58, 237, 0.8));"></div>
            </div>
            <span class="stat-value">${char.neutral}</span>
          </div>
        </div>
      </div>

      <div class="char-detail-render">
        <img src="renders/${renderName}_render.png" alt="${char.name} Render" class="char-render" onerror="this.onerror=null;this.src='renders/placeholder_render.png'">
      </div>
    `;

    // Show overlay and detail view
    detailOverlay.classList.add("show");
    detailContainer.classList.add("show");
    closeDetailBtn.classList.add("show");

    // Ensure detail icon has a fallback too
    setTimeout(() => {
      const dimg = detailContainer.querySelector('.char-detail-icon');
      if (dimg) dimg.onerror = () => { dimg.onerror = null; dimg.src = 'icons/green_guy_icon.png'; };
      const rimg = detailContainer.querySelector('.char-render');
      if (rimg) rimg.onerror = () => { rimg.onerror = null; rimg.src = 'renders/placeholder_render.png'; };
    }, 40);
  }

  // Close detail view
  closeDetailBtn.addEventListener("click", closeDetailView);
  detailOverlay.addEventListener("click", closeDetailView);

  // Prevent closing when clicking on detail content
  detailContainer.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Menu toggle
  const menuBtn = document.querySelector(".menuBtn");
  const menu = document.querySelector(".menu");
  
  if (menuBtn) {
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle("open");
    };
  }

  // Close menu on nav click
  document.querySelectorAll(".menu a").forEach(link => {
    link.onclick = () => {
      menu.classList.remove("open");
    };
  });
};
