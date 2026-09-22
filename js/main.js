(function () {
  "use strict";

  function showError(e) {
    const t = document.getElementById("toast");
    if (t) {
      t.textContent = "Başlatma hatası: " + (e && e.message ? e.message : e);
      t.className = "toast is-show is-error";
    }
  }

  function boot() {
    if (!window.SSA || !window.SSA.App) {
      console.error("SSA yüklenemedi");
      return;
    }
    Promise.resolve()
      .then(function () {
        return window.SSA.App.init();
      })
      .catch(function (e) {
        console.error(e);
        showError(e);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
