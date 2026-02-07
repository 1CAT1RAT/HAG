const garageOverlay = document.getElementById("garageOverlay");
const garageImg = document.getElementById("garageImg");
let animationInProgress = false;

// OPEN GARAGE ANIMATION - door slides UP when page loads (opening upward)
function openGarage() {
    // Reset state to prevent animation conflicts
    animationInProgress = true;
    garageImg.style.transition = "none"; // Disable transition temporarily
    garageImg.style.top = "0"; // start at bottom
    garageOverlay.style.display = "flex";
    
    // Restore transition and start animation
    setTimeout(() => {
        garageImg.style.transition = "top 2s cubic-bezier(0.22, 1, 0.36, 1)";
        garageImg.style.top = "-100%"; // animate up off-screen
        
        // After animation completes, hide overlay to reveal page
        const handleAnimComplete = () => {
            garageOverlay.style.display = "none";
            garageImg.removeEventListener("transitionend", handleAnimComplete);
            animationInProgress = false;
        };
        
        garageImg.addEventListener("transitionend", handleAnimComplete);
                // Fallback: ensure overlay is hidden even if transitionend doesn't fire
                setTimeout(() => {
                    if (animationInProgress) {
                        garageOverlay.style.display = "none";
                        animationInProgress = false;
                    }
                }, 2300);
    }, 10);
}

// CLOSE GARAGE FOR NAVIGATION - door slides DOWN before navigating
function closeGarage(callback) {
    if (animationInProgress) return; // Prevent animation conflicts
    animationInProgress = true;
    
    garageOverlay.style.display = "flex";
    garageImg.style.top = "-100%"; // start off-screen at top
    
    // tiny delay to ensure transition applies
    setTimeout(() => {
        const imgHeight = garageImg.offsetHeight || window.innerHeight;
        const finalTop = window.innerHeight - imgHeight;
        garageImg.style.top = finalTop + "px"; // animate down to cover page
        
        const handleAnimComplete = () => {
            garageImg.removeEventListener("transitionend", handleAnimComplete);
            animationInProgress = false;
            if (callback) callback();
        };
        
        garageImg.addEventListener("transitionend", handleAnimComplete);
    }, 10);
}

// Get current page filename. If URL ends with a trailing slash (GitHub Pages root), treat as index.html
let currentPage = window.location.pathname.split("/").pop();
if (!currentPage) {
    // URL like /HAG/ -> no filename, treat as index.html
    currentPage = 'index.html';
}

// NAVIGATION LINKS - trigger garage close before navigation
document.querySelectorAll(".menu a").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const href = link.getAttribute("href");
        const targetPage = href.split("/").pop();
        
        // If clicking same page, just close menu
        if (targetPage === currentPage) {
            document.querySelector(".menu").classList.remove("open");
            return;
        }
        
        // Otherwise, close garage and navigate
        closeGarage(() => window.location.href = href);
    });
});

// MENU TOGGLE - works on all pages
document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.querySelector(".menuBtn");
    if (menuBtn) {
        menuBtn.onclick = e => {
            e.stopPropagation();
            document.querySelector(".menu").classList.toggle("open");
        };
    }
});

// Close menu when clicking elsewhere
document.addEventListener("click", e => {
    if (!e.target.closest(".menu") && !e.target.closest(".menuBtn")) {
        document.querySelector(".menu").classList.remove("open");
    }
});

// Trigger garage open on page load
document.addEventListener("DOMContentLoaded", openGarage);
