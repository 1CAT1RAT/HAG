// Character selection page functionality
window.onload = async () => {
  console.log('characters.js: window.onload fired');
  let charactersData = [];

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
        { name: 'Fallback One', role: 'Agent', color: '#808080', backstory: 'Fallback character.', strength: 6, connectionScore: 20 },
        { name: 'Fallback Two', role: 'Rival', color: '#606060', backstory: 'Fallback character two.', strength: 5, connectionScore: 15 },
        { name: 'Fallback Three', role: 'Neutral', color: '#909090', backstory: 'Fallback character three.', strength: 4, connectionScore: 10 }
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

  // Debug: report how many cards were appended
  setTimeout(() => {
    const count = grid.querySelectorAll('.char-card').length;
    console.log(`characters.js: appended ${count} char-card elements to #grid`);
    if (!count) console.warn('characters.js: no cards found in grid — check if #grid exists and characters.json loaded');
  }, 100);

  function closeDetailView() {
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
    // Hide grid
    grid.classList.add("hidden");
    document.body.style.overflow = "hidden";

    const iconName = char.name.toLowerCase().replaceAll(" ", "_");

    // Create detail view
    detailContainer.innerHTML = `
      <div class="char-detail-card">
        <div class="char-detail-icon-wrapper">
          <img src="icons/${iconName}_icon.png" alt="${char.name}" class="char-detail-icon" onerror="this.onerror=null;this.src='icons/bloo_icon.png'">
        </div>
        <h2 class="char-detail-name" style="color: ${char.color}">${char.name}</h2>
        <p class="char-detail-role">${char.role}</p>
      </div>

      <div class="char-detail-content">
        <div class="detail-section">
          <h3>Backstory</h3>
          <p>${char.backstory}</p>
        </div>

        <div class="detail-section">
          <h3>Relationship Stats</h3>
          <div class="stat-row">
            <span class="stat-label">Allies</span>
            <div class="stat-bar">
              <div class="stat-fill" style="width: 65%; background: linear-gradient(90deg, ${char.color}, rgba(124, 58, 237, 0.8));"></div>
            </div>
            <span class="stat-value">13</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Rivals</span>
            <div class="stat-bar">
              <div class="stat-fill" style="width: 45%; background: linear-gradient(90deg, #ef4444, rgba(124, 58, 237, 0.8));"></div>
            </div>
            <span class="stat-value">9</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Neutral</span>
            <div class="stat-bar">
              <div class="stat-fill" style="width: 35%; background: linear-gradient(90deg, #8b7355, rgba(124, 58, 237, 0.8));"></div>
            </div>
            <span class="stat-value">7</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Overall Strength</h3>
          <div class="stat-row">
            <span class="stat-label">Power Level</span>
            <div class="stat-bar">
              <div class="stat-fill" style="width: ${char.strength * 12.5}%; background: linear-gradient(90deg, ${char.color}, rgba(124, 58, 237, 0.8));"></div>
            </div>
            <span class="stat-value">${char.strength}/10</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Connection Score</span>
            <div class="stat-bar">
              <div class="stat-fill" style="width: ${(char.connectionScore / 50) * 100}%; background: linear-gradient(90deg, #7c3aed, #a78bfa);"></div>
            </div>
            <span class="stat-value">${char.connectionScore}/50</span>
          </div>
        </div>
      </div>
    `;

    // Show overlay and detail view
    detailOverlay.classList.add("show");
    detailContainer.classList.add("show");
    closeDetailBtn.classList.add("show");

    // Ensure detail icon has a fallback too
    setTimeout(() => {
      const dimg = detailContainer.querySelector('.char-detail-icon');
      if (dimg) dimg.onerror = () => { dimg.onerror = null; dimg.src = 'icons/bloo_icon.png'; };
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
