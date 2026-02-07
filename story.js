// Story page menu setup
window.addEventListener("DOMContentLoaded", () => {
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
});
