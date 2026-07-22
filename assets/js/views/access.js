/* ============================================================
   VISTA — Pantalla de acceso (independiente del portal)
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;

  function profileCard(u) {
    const ui = U.ui;
    const isRef = u.rol === "referente";
    return `
    <div class="profile-card ${isRef ? "profile-card--ref" : ""}">
      <div class="profile-card__top">
        <div class="avatar avatar--lg" style="${isRef ? "background:var(--c-turquesa)" : ""}">
          ${u.foto ? `<img src="${ui.esc(u.foto)}" alt="">` : ui.initials(u.nombre)}
        </div>
        <div>
          <h3 class="profile-card__name">${ui.esc(u.nombre)}</h3>
          <div class="profile-card__role">${ui.esc(u.cargo)}</div>
          <div class="profile-card__unit">${ui.esc(u.unidad)}</div>
        </div>
      </div>
      <div class="btn-row" style="margin-top:auto">
        <button class="btn btn--primary btn--block" data-login="${u.id}">Ingresar</button>
        <button class="btn btn--ghost btn--sm" data-edit="${u.id}" title="Editar perfil">✏️ Editar</button>
      </div>
    </div>`;
  }

  function access() {
    const perfiles = U.auth.perfiles();
    const coord = perfiles.filter(p => p.rol === "coordinador");
    const ref = perfiles.filter(p => p.rol === "referente");
    const otros = perfiles.filter(p => p.rol !== "coordinador" && p.rol !== "referente");

    return `
    <div class="access">
      <div class="franja"></div>
      <div class="access__main">
        <div class="access__stage">
          <div class="access__brand">
            <div class="access__logo"><img src="assets/img/huap-logo.png" alt="Hospital de Urgencia Asistencia Pública"></div>
            <div>
              <div class="access__eyebrow">Centro de Operaciones · HUAP</div>
              <h1 class="access__title">Unidad de Buenas Prácticas Clínicas</h1>
              <div class="access__sub">Hospital de Urgencia Asistencia Pública</div>
            </div>
          </div>

          <div class="access__panel">
            <div class="access__intro">
              <h2>Bienvenido/a al<br>Portal de Gestión Operativa</h2>
              <p class="narrativo">Registra, organiza, monitorea y respalda la gestión de la Unidad de Buenas
              Prácticas Clínicas, manteniendo trazabilidad de responsables, fechas, estados y resultados.</p>
              <div class="access__frase">"La evidencia cobra valor cuando transforma la práctica y mejora el cuidado."</div>
              <div class="pillars" style="margin:.2rem 0 .4rem">
                <span class="pillar"><span class="ic">🛡️</span>Seguridad</span>
                <span class="pillar ev"><span class="ic">🔬</span>Evidencia</span>
                <span class="pillar cu"><span class="ic">💙</span>Cuidado</span>
              </div>
              <img class="access__evi" src="assets/img/evi-full.png" alt="EVI, mascota de la UBPC">
            </div>
            <div class="access__profiles">
              <h3>Seleccione su perfil para ingresar</h3>
              <div class="profiles">
                ${coord.map(profileCard).join("")}
                ${ref.map(profileCard).join("")}
                ${otros.map(profileCard).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="franja"></div>
      <div class="access__foot">
        Portal de Gestión Operativa · UBPC · HUAP
      </div>
    </div>`;
  }

  function accessBind(root) {
    const ui = U.ui;
    root.querySelectorAll("[data-login]").forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.login;
        const u = U.auth.current && U.store.get("usuarios", id);
        U.auth.login(id);
        const user = U.store.get("usuarios", id);
        U.router.go(user.rol === "coordinador" ? "#/coord/home" : "#/ref/inicio");
      };
    });
    root.querySelectorAll("[data-edit]").forEach(btn => {
      btn.onclick = () => editPerfil(btn.dataset.edit);
    });
  }

  /* ---------- Editor de perfil (reflejado en acceso, header y perfil) ---------- */
  function editPerfil(id, onDone) {
    const ui = U.ui;
    const u = U.store.get("usuarios", id);
    if (!u) return;
    const fields = [
      { name: "nombre", label: "Nombre completo", required: true, full: true },
      { name: "cargo", label: "Cargo", required: true, full: true },
      { name: "unidad", label: "Unidad", full: true },
      { name: "foto", label: "URL de fotografía (opcional)", full: true, hint: "Si se deja vacío, se muestran las iniciales." }
    ];
    ui.modal({
      title: "Editar perfil",
      body: `<p class="card__hint">Los cambios se reflejan automáticamente en la pantalla de acceso, el encabezado y el perfil.</p>
             ${ui.formHTML(fields, u)}
             <div class="flex" style="margin-top:.4rem">
               <div class="avatar avatar--lg" id="prevAvatar">${u.foto ? `<img src="${ui.esc(u.foto)}">` : ui.initials(u.nombre)}</div>
               <div class="muted">Vista previa</div>
             </div>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button>
               <button class="btn btn--primary" data-save>Guardar cambios</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const data = ui.readForm(m);
          if (!data.nombre || !data.cargo) { ui.toast("Nombre y cargo son obligatorios", "danger"); return; }
          data.esPlaceholder = false;
          U.auth.updatePerfil(id, data);
          ui.closeModal();
          ui.toast("Perfil actualizado", "ok");
          if (onDone) onDone(); else U.router.render();
        };
      }
    });
  }

  U.views = U.views || {};
  U.views.access = access;
  U.views.accessBind = accessBind;
  U.views.editPerfil = editPerfil;
})();
