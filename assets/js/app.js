/* ============================================================
   APP — Arranque del Portal UBPC
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;

  /* ---------- Paletas seleccionables (motor de temas) ---------- */
  const PALETTES = [
    { key: "turquesa", label: "Turquesa", sw: "linear-gradient(135deg,#12b5a5,#0d8175)" },
    { key: "oceano",   label: "Océano",   sw: "linear-gradient(135deg,#1e9fe0,#1554b8)" },
    { key: "lavanda",  label: "Lavanda",  sw: "linear-gradient(135deg,#8a5cd8,#5b34b0)" },
    { key: "menta",    label: "Menta",    sw: "linear-gradient(135deg,#5fc9a8,#33a37e)" },
    { key: "coral",    label: "Coral",    sw: "linear-gradient(135deg,#e0538a,#f07f2e)" }
  ];
  const Theme = {
    palettes: PALETTES,
    getPalette() { try { return localStorage.getItem("ubpc:palette") || "turquesa"; } catch (e) { return "turquesa"; } },
    setPalette(key) {
      if (!PALETTES.some(p => p.key === key)) key = "turquesa";
      if (key === "turquesa") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", key);
      try { localStorage.setItem("ubpc:palette", key); } catch (e) {}
    },
    isNight() { return document.body.classList.contains("night"); },
    setNight(on) {
      document.body.classList.toggle("night", !!on);
      try { localStorage.setItem("ubpc:theme", on ? "night" : "day"); } catch (e) {}
    },
    toggleNight() { const n = !Theme.isNight(); Theme.setNight(n); return n; },
    apply() {
      Theme.setPalette(Theme.getPalette());
      let night = false; try { night = localStorage.getItem("ubpc:theme") === "night"; } catch (e) {}
      document.body.classList.toggle("night", night);
    },
    /* Selector reutilizable (Configuración). Devuelve HTML; enlaza con bindPicker. */
    pickerHTML() {
      const cur = Theme.getPalette(), night = Theme.isNight();
      return `<div class="pk" id="themePicker">
        <div class="pk__swatches">
          ${PALETTES.map(p => `<button class="pk__swatch ${p.key === cur ? "is-on" : ""}" data-palette="${p.key}" style="background:${p.sw}" title="${p.label}">
            <span class="pk__name">${p.label}</span></button>`).join("")}
        </div>
        <button class="pk__mode" id="pkMode">${night ? "🌙 Modo oscuro" : "☀️ Modo claro"}</button>
      </div>`;
    },
    bindPicker(root) {
      root = root || document;
      const box = root.querySelector("#themePicker"); if (!box) return;
      box.querySelectorAll("[data-palette]").forEach(sw => sw.onclick = () => {
        Theme.setPalette(sw.dataset.palette);
        box.querySelectorAll("[data-palette]").forEach(s => s.classList.toggle("is-on", s === sw));
      });
      const mb = box.querySelector("#pkMode");
      if (mb) mb.onclick = () => { const n = Theme.toggleNight(); mb.textContent = n ? "🌙 Modo oscuro" : "☀️ Modo claro"; };
    }
  };
  U.theme = Theme;

  function boot() {
    Theme.apply();
    U.data.seedIfEmpty();
    window.addEventListener("hashchange", U.router.render);
    U.router.render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
