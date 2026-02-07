// show loader, then build page (self-contained to avoid global name conflicts)
(function(){
  const _body = document.body;
  const loadingScreen = document.getElementById("loadingScreen");
  const progressBar = loadingScreen ? loadingScreen.querySelector("#progressBar div") : null;

  if (!loadingScreen || !progressBar) return;

  let width = 0;
  const interval = setInterval(() => {
    width += 2;
    progressBar.style.width = width + "%";
    if (width >= 100) {
      clearInterval(interval);
      loadingScreen.style.display = "none";
      _body.classList.add("loaded");
    }
  }, 50);
})();
