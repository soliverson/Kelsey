// ======================================================
// FULL SCREEN
// ======================================================

function toggleFullScreen() {
  const el = document.documentElement;

  if (!document.fullscreenElement) {
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(err => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
    }
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener("fullscreenchange", () => {
  const button = document.getElementById("fullScreenBtn");

  if (document.fullscreenElement) {
    document.body.classList.add("tv-fullscreen");
    if (button) button.textContent = "Exit Full Screen";
  } else {
    document.body.classList.remove("tv-fullscreen");
    if (button) button.textContent = "Full Screen";
  }
});

// iPhones/iPads can't do full screen for web pages, so hide the
// Full Screen buttons there instead of showing a button that does nothing.
document.addEventListener("DOMContentLoaded", () => {
  if (!document.documentElement.requestFullscreen) {
    ["fullScreenBtn", "introFullScreenButton"].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.style.display = "none";
    });

    // Let the remaining two buttons share the row.
    const watch = document.getElementById("watchIntroBtn");
    if (watch) watch.style.gridColumn = "1 / -1";
  }
});


// ======================================================
// SCALE THE 1920 x 1080 GAME STAGE TO FIT THE WINDOW
// (desktop / laptop / TV only; phones use the stacked layout)
// ======================================================

(function () {
  const STAGE_WIDTH = 1920;
  const STAGE_HEIGHT = 1080;

  function fitStage() {
    const scale = Math.min(
      window.innerWidth / STAGE_WIDTH,
      window.innerHeight / STAGE_HEIGHT
    );

    document.documentElement.style.setProperty(
      "--stage-scale",
      scale.toFixed(4)
    );
  }

  window.addEventListener("resize", fitStage);
  window.addEventListener("orientationchange", fitStage);
  document.addEventListener("fullscreenchange", fitStage);

  fitStage();
})();
