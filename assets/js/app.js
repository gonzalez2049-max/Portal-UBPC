/* ============================================================
   APP — Arranque del Portal UBPC
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;

  function boot() {
    try { if (localStorage.getItem("ubpc:theme") === "night") document.body.classList.add("night"); } catch (e) {}
    U.data.seedIfEmpty();
    window.addEventListener("hashchange", U.router.render);
    U.router.render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
