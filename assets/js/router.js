/* ============================================================
   ROUTER — Navegación por perfiles (hash routing) + layout
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const el = id => document.getElementById(id);

  function parse() {
    const h = (location.hash || "").replace(/^#\/?/, "");
    const [path, query] = h.split("?");
    const parts = path.split("/").filter(Boolean);
    const params = {};
    (query || "").split("&").forEach(kv => { const [k, v] = kv.split("="); if (k) params[k] = decodeURIComponent(v || ""); });
    return { parts, params, raw: path };
  }

  function go(hash) { location.hash = hash; }

  function render() {
    const { parts } = parse();
    const root = el("app");
    const session = U.auth.current();

    // Ruta de acceso (sin sesión activa o solicitada explícitamente)
    if (!parts.length || parts[0] === "acceso" || !session) {
      U.auth.logout && (parts[0] === "acceso") && U.auth.logout();
      root.innerHTML = U.views.access();
      U.views.accessBind && U.views.accessBind(root);
      window.scrollTo(0, 0);
      return;
    }

    const portal = parts[0]; // "coord" | "ref"
    // Guarda de rol
    if (portal === "coord" && session.rol !== "coordinador") return go("#/ref/inicio");
    if (portal === "ref" && session.rol !== "referente") return go("#/coord/home");

    const config = portal === "coord" ? U.coord : U.ref;
    if (!config) { root.innerHTML = "<p>Portal no disponible.</p>"; return; }

    const viewKey = parts[1] || config.default;
    const view = config.views[viewKey];
    const mainHTML = view ? view(parse().params) : U.ui.empty("Sección en construcción", "Esta sección estará disponible próximamente.", "🛠️");

    root.innerHTML = layout(portal, config, viewKey, session, mainHTML);
    bindLayout(portal, config, session);
    // Transición de entrada solo al cambiar de módulo/vista (no en refrescos de la misma vista)
    const routeKey = portal + "/" + viewKey;
    if (routeKey !== _lastRoute) {
      const m = el("view-main");
      if (m) m.classList.add("view-enter");
    }
    _lastRoute = routeKey;
    if (view && config.binders && config.binders[viewKey]) config.binders[viewKey](el("view-main"), parse().params);
    window.scrollTo(0, 0);
  }
  let _lastRoute = null;

  /* ---------- Layout del portal ---------- */
  function layout(portal, config, activeKey, user, mainHTML) {
    const ui = U.ui;
    const rol = portal === "coord" ? "coordinador" : "referente";
    const unread = U.notif.unread(rol).length;
    const sideClass = portal === "ref" ? "app__side ref" : "app__side";

    const nav = config.nav.map(group => `
      <div class="nav-group">
        ${group.label ? `<div class="nav-group__label">${ui.esc(group.label)}</div>` : ""}
        ${group.items.map(it => {
          const badge = it.badgeFn ? it.badgeFn() : 0;
          return `<a class="nav-item ${it.key === activeKey ? "active" : ""}" href="#/${portal}/${it.key}">
            <span class="nav-item__ico">${it.ico}</span><span>${ui.esc(it.label)}</span>
            ${badge ? `<span class="nav-item__badge">${badge}</span>` : ""}
          </a>`;
        }).join("")}
      </div>`).join("");

    let pinned = false; try { pinned = localStorage.getItem("ubpc:sidePinned") === "1"; } catch (e) {}
    return `
    <div class="app${pinned ? " side-pinned" : ""}">
      <header class="app__header no-print">
        <button class="btn-icon menu-toggle" id="menuToggle" aria-label="Menú">☰</button>
        <div class="brand-mini">
          <div class="brand-mini__logo">HUAP</div>
          <div class="brand-mini__txt">
            <strong>Portal de Gestión Operativa</strong>
            <span>Unidad de Buenas Prácticas Clínicas – UBPC</span>
          </div>
        </div>
        <div class="header__spacer"></div>
        <button class="theme-switch" id="themeToggle" role="switch" aria-checked="false" title="Cambiar modo claro / oscuro" aria-label="Cambiar modo claro u oscuro">
          <span class="theme-switch__ico theme-switch__ico--sun" aria-hidden="true">☀️</span>
          <span class="theme-switch__ico theme-switch__ico--moon" aria-hidden="true">🌙</span>
          <span class="theme-switch__knob" aria-hidden="true">
            <span class="ts-day">☀️</span><span class="ts-night">🌙</span>
          </span>
        </button>
        <div class="bell">
          <button class="btn-icon" id="bellBtn" aria-label="Notificaciones">🔔${unread ? `<span class="bell__count">${unread}</span>` : ""}</button>
        </div>
        <div class="header__user">
          <div class="avatar">${user.foto ? `<img src="${ui.esc(user.foto)}" alt="">` : ui.initials(user.nombre)}</div>
          <div class="header__user-txt">
            <strong>${ui.esc(user.nombre)}</strong>
            <span>${ui.esc(user.cargo)}</span>
          </div>
        </div>
        <button class="btn btn--ghost btn--sm" id="logoutBtn" title="Cambiar de perfil">Salir</button>
      </header>
      <aside class="${sideClass}" id="sidebar">
        <button class="side-pin no-print" id="sidePin" title="Fijar / recoger menú" aria-label="Fijar menú" aria-pressed="${pinned}">
          <span class="side-pin__ico">📌</span></button>
        <div class="side-nav">${nav}</div>
        <div class="side-foot">
          <span class="side-foot__band" aria-hidden="true"></span>
          <div class="side-foot__slogan">Seguridad · Evidencia · Cuidado</div>
        </div>
      </aside>
      <div class="side-overlay no-print" id="sideOverlay" aria-hidden="true"></div>
      <main class="app__main" id="view-main">${mainHTML}</main>
    </div>`;
  }

  function bindLayout(portal, config, user) {
    const rol = portal === "coord" ? "coordinador" : "referente";
    const logout = el("logoutBtn");
    if (logout) logout.onclick = () => { U.auth.logout(); go("#/acceso"); };
    const toggle = el("menuToggle");
    const closeSide = () => { el("sidebar").classList.remove("open"); const o = el("sideOverlay"); if (o) o.classList.remove("show"); };
    if (toggle) toggle.onclick = () => {
      const open = el("sidebar").classList.toggle("open");
      const o = el("sideOverlay"); if (o) o.classList.toggle("show", open);
    };
    const overlay = el("sideOverlay");
    if (overlay) overlay.onclick = closeSide;
    // Cerrar sidebar al navegar en móvil
    document.querySelectorAll(".nav-item").forEach(a => a.addEventListener("click", closeSide));

    // Fijar / recoger el rail lateral (escritorio)
    const pin = el("sidePin");
    if (pin) {
      const app = document.querySelector(".app");
      const setPin = (on) => { if (app) app.classList.toggle("side-pinned", on);
        pin.classList.toggle("active", on); pin.setAttribute("aria-pressed", on ? "true" : "false"); };
      let cur = false; try { cur = localStorage.getItem("ubpc:sidePinned") === "1"; } catch (e) {}
      setPin(cur);
      pin.onclick = () => { cur = !cur; setPin(cur); try { localStorage.setItem("ubpc:sidePinned", cur ? "1" : "0"); } catch (e) {} };
    }

    const bell = el("bellBtn");
    if (bell) bell.onclick = e => { e.stopPropagation(); toggleNotifPanel(rol); };

    const tt = el("themeToggle");
    if (tt) {
      tt.setAttribute("aria-checked", document.body.classList.contains("night") ? "true" : "false");
      tt.onclick = () => {
        const night = document.body.classList.toggle("night");
        try { localStorage.setItem("ubpc:theme", night ? "night" : "day"); } catch (e) {}
        tt.setAttribute("aria-checked", night ? "true" : "false");
      };
    }
  }

  /* ---------- Panel de notificaciones ---------- */
  function toggleNotifPanel(rol) {
    const ui = U.ui;
    let existing = document.querySelector(".notif-panel");
    if (existing) { existing.remove(); return; }
    const list = U.notif.forRole(rol);
    const panel = document.createElement("div");
    panel.className = "notif-panel";
    panel.innerHTML = `
      <div class="notif-panel__head">
        <strong>Notificaciones</strong>
        <button class="btn btn--ghost btn--sm" data-readall>Marcar todas como leídas</button>
      </div>
      <div class="notif-list">
        ${list.length ? list.slice(0, 40).map(n => `
          <div class="notif-item ${n.leida ? "" : "notif-item--unread"} ${n.prioridad === "alta" ? "notif-item--alta" : ""}" data-nid="${n.id}" ${n.ref ? `data-ref="${ui.esc(n.ref)}"` : ""}>
            <span class="notif-item__dot"></span>
            <div>
              <div class="notif-item__title">${ui.esc(n.titulo)}</div>
              <div class="notif-item__meta">${ui.esc(n.modulo || "")} · ${ui.fechaHoraCL(n.fecha)} ${n.prioridad === "alta" ? "· <strong style='color:#c62f3b'>Prioritaria</strong>" : ""}</div>
            </div>
          </div>`).join("")
        : `<div style="padding:1.4rem 1rem">${ui.empty("No existen notificaciones.", "", "🔔")}</div>`}
      </div>`;
    const bell = document.querySelector(".bell");
    bell.appendChild(panel);
    panel.querySelector("[data-readall]").onclick = () => { U.notif.markAllRead(rol); panel.remove(); render(); };
    panel.querySelectorAll(".notif-item").forEach(item => {
      item.onclick = () => {
        U.notif.markRead(item.dataset.nid);
        const ref = item.dataset.ref;
        panel.remove();
        if (ref) go(ref); else render();
      };
    });
    setTimeout(() => document.addEventListener("click", function close(ev) {
      if (!panel.contains(ev.target)) { panel.remove(); document.removeEventListener("click", close); }
    }), 0);
  }

  window.UBPC.router = { render, go, parse };
})();
