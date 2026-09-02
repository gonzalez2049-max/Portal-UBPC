/* ============================================================
   VISTA — Pantalla de acceso (independiente del portal)
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;

  function profileCard(u) {
    const ui = U.ui;
    const isRef = u.rol === "referente";
    const chip = isRef ? "Referente Técnico" : (u.rol === "coordinador" ? "Coordinador/a" : (u.rol || ""));
    return `
    <div class="profile-card ${isRef ? "profile-card--ref" : ""}">
      <div class="profile-card__top">
        <div class="avatar avatar--lg" style="${isRef ? "background:var(--c-turquesa)" : ""}">
          ${u.foto ? `<img src="${ui.esc(u.foto)}" alt="">` : ui.initials(u.nombre)}
        </div>
        <div class="profile-card__id">
          ${chip ? `<span class="profile-card__chip">${ui.esc(chip)}</span>` : ""}
          <h3 class="profile-card__name">${ui.esc(u.nombre)}</h3>
          <div class="profile-card__role">${ui.esc(u.cargo)}</div>
          <div class="profile-card__unit">🏥 ${ui.esc(u.unidad)}</div>
        </div>
      </div>
      <div class="btn-row" style="margin-top:auto">
        <button class="btn btn--primary btn--block" data-login="${u.id}">Ingresar al portal →</button>
        <button class="btn btn--ghost btn--sm" data-edit="${u.id}" title="Editar perfil">✏️ Editar</button>
      </div>
    </div>`;
  }

  function themebarHTML() {
    const T = U.theme; if (!T) return "";
    const cur = T.getPalette();
    const night = T.isNight();
    return `<div class="access__theme" id="themeBar">
      <span class="access__theme-lbl">🎨 Tema</span>
      <div class="access__swatches">
        ${T.palettes.map(p => `<button class="access__swatch ${p.key === cur ? "is-on" : ""}" data-palette="${p.key}"
          style="background:${p.sw}" title="${p.label}" aria-label="Tema ${p.label}"></button>`).join("")}
      </div>
      <button class="access__mode" id="modeBtn" title="Modo claro / oscuro" aria-label="Modo claro u oscuro">${night ? "🌙" : "☀️"}<span>${night ? "Oscuro" : "Claro"}</span></button>
    </div>`;
  }

  // Gate de contraseña: se exige iniciar sesión (nube) al abrir el portal,
  // pero solo en equipos ya conectados a la nube (para no bloquear el acceso
  // en un equipo nuevo antes de configurarlo).
  const AUTH_FLAG = "ubpc:portalAuthed";
  // Se guarda en localStorage para que el "recordado" dure entre días (no se
  // pierde al cerrar el navegador). Solo se borra al usar «Salir».
  function portalAuthed() { try { return localStorage.getItem(AUTH_FLAG) === "1"; } catch (e) { return false; } }
  function setPortalAuthed(on) { try { on ? localStorage.setItem(AUTH_FLAG, "1") : localStorage.removeItem(AUTH_FLAG); } catch (e) {} }
  // Solo se pide contraseña al entrar si la usuaria lo activó (por defecto, no).
  function needsLogin() {
    return !!(U.cloud && U.cloud.configured() && U.store.getConfig("pedirClaveIngreso", false) && !portalAuthed());
  }

  function profilesInner(coord, ref, otros) {
    return `<h3>Seleccione su perfil para ingresar</h3>
      <div class="profiles">
        ${coord.map(profileCard).join("")}
        ${ref.map(profileCard).join("")}
        ${otros.map(profileCard).join("")}
      </div>`;
  }
  function loginInner() {
    const email = (U.cloud && U.cloud.email && U.cloud.email()) || "";
    return `<div class="access-login">
        <div class="access-login__ico">🔒</div>
        <h3>Ingresa para continuar</h3>
        <p class="access-login__hint">Escribe tu correo y contraseña para entrar al portal.</p>
        <form id="accLoginForm" class="access-login__form" autocomplete="on">
          <div class="field"><label for="accEmail">Correo</label>
            <input class="input" id="accEmail" type="email" autocomplete="username" value="${U.ui.esc(email)}" placeholder="correo@ejemplo.cl"></div>
          <div class="field"><label for="accPass">Contraseña</label>
            <input class="input" id="accPass" type="password" autocomplete="current-password" placeholder="••••••••"></div>
          <button class="btn btn--primary btn--block" id="accLoginBtn" type="submit">Entrar al portal →</button>
        </form>
        <div id="accLoginMsg" class="access-login__msg"></div>
      </div>`;
  }

  // Pantalla de entrada (portada) que se muestra antes de elegir el perfil.
  function hasEntered() { try { return sessionStorage.getItem("ubpc:entered") === "1"; } catch (e) { return false; } }
  function entranceScreen() {
    return `
    <div class="access access--entrance">
      <div class="franja"></div>
      <div class="access__main">
        <div class="access__stage">
          <div class="access__topbar">
            <div class="access__brand">
              <div class="access__logo"><img src="assets/img/huap-logo.png" alt="Hospital de Urgencia Asistencia Pública"></div>
              <div>
                <div class="access__eyebrow">Centro de Operaciones · HUAP</div>
                <h1 class="access__title">Unidad de Buenas Prácticas Clínicas</h1>
                <div class="access__sub">Hospital de Urgencia Asistencia Pública</div>
              </div>
            </div>
            ${themebarHTML()}
          </div>
          <div class="access__panel" style="justify-content:center">
            <div class="access__intro" style="text-align:center;max-width:660px;margin:0 auto">
              <h2>Bienvenido/a al<br>Portal de Gestión Operativa</h2>
              <p class="narrativo">Registra, organiza, monitorea y respalda la gestión de la Unidad de Buenas
              Prácticas Clínicas, manteniendo trazabilidad de responsables, fechas, estados y resultados.</p>
              <div class="access__frase">"La evidencia cobra valor cuando transforma la práctica y mejora el cuidado."</div>
              <div class="access__pillars" style="justify-content:center">
                <span class="access__pillar"><span class="ic">🛡️</span>Seguridad</span>
                <span class="access__pillar-sep"></span>
                <span class="access__pillar ev"><span class="ic">🔬</span>Evidencia</span>
                <span class="access__pillar-sep"></span>
                <span class="access__pillar cu"><span class="ic">💙</span>Cuidado</span>
              </div>
              <img class="access__evi" src="assets/img/evi-full.png" alt="EVI, mascota de la UBPC">
              <div style="margin-top:1.3rem">
                <button class="btn btn--primary" id="enterBtn" style="font-size:1.05rem;padding:.75rem 1.8rem;border-radius:12px">Ingresar al portal →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="franja"></div>
      <div class="access__foot">Portal de Gestión Operativa · UBPC · HUAP</div>
    </div>`;
  }

  function access() {
    if (!hasEntered()) return entranceScreen();
    const perfiles = U.auth.perfiles();
    const coord = perfiles.filter(p => p.rol === "coordinador");
    const ref = perfiles.filter(p => p.rol === "referente");
    const otros = perfiles.filter(p => p.rol !== "coordinador" && p.rol !== "referente");

    return `
    <div class="access">
      <div class="franja"></div>
      <div class="access__main">
        <div class="access__stage">
          <div class="access__topbar">
            <div class="access__brand">
              <div class="access__logo"><img src="assets/img/huap-logo.png" alt="Hospital de Urgencia Asistencia Pública"></div>
              <div>
                <div class="access__eyebrow">Centro de Operaciones · HUAP</div>
                <h1 class="access__title">Unidad de Buenas Prácticas Clínicas</h1>
                <div class="access__sub">Hospital de Urgencia Asistencia Pública</div>
              </div>
            </div>
            ${themebarHTML()}
          </div>

          <div class="access__panel">
            <div class="access__intro">
              <h2>Bienvenido/a al<br>Portal de Gestión Operativa</h2>
              <p class="narrativo">Registra, organiza, monitorea y respalda la gestión de la Unidad de Buenas
              Prácticas Clínicas, manteniendo trazabilidad de responsables, fechas, estados y resultados.</p>
              <div class="access__frase">"La evidencia cobra valor cuando transforma la práctica y mejora el cuidado."</div>
              <div class="access__pillars">
                <span class="access__pillar"><span class="ic">🛡️</span>Seguridad</span>
                <span class="access__pillar-sep"></span>
                <span class="access__pillar ev"><span class="ic">🔬</span>Evidencia</span>
                <span class="access__pillar-sep"></span>
                <span class="access__pillar cu"><span class="ic">💙</span>Cuidado</span>
              </div>
              <img class="access__evi" src="assets/img/evi-full.png" alt="EVI, mascota de la UBPC">
            </div>
            <div class="access__profiles">
              ${needsLogin() ? loginInner() : profilesInner(coord, ref, otros)}
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
    // Botón de la pantalla de entrada → muestra la selección de perfil.
    const enterBtn = root.querySelector("#enterBtn");
    if (enterBtn) enterBtn.onclick = () => { try { sessionStorage.setItem("ubpc:entered", "1"); } catch (e) {} U.router.render(); };
    // Gate de ingreso con correo y contraseña (nube)
    const form = root.querySelector("#accLoginForm");
    if (form) {
      const msg = root.querySelector("#accLoginMsg");
      const btn = root.querySelector("#accLoginBtn");
      form.onsubmit = async e => {
        e.preventDefault();
        const email = (root.querySelector("#accEmail").value || "").trim();
        const pass = root.querySelector("#accPass").value || "";
        if (!email || !pass) { msg.className = "access-login__msg is-err"; msg.textContent = "Escribe tu correo y contraseña."; return; }
        btn.disabled = true; btn.textContent = "Ingresando…"; msg.className = "access-login__msg"; msg.textContent = "";
        try {
          await U.cloud.signIn(email, pass);
          setPortalAuthed(true);
          try { await U.cloud.initialSync(); } catch (e) {}
          // Tras la clave, mostrar los perfiles para elegir con quién entrar
          // (así el Referente Técnico también puede elegir su perfil).
          U.router.render();
        } catch (err) {
          btn.disabled = false; btn.textContent = "Entrar al portal →";
          const m = err.message || "";
          const network = /fetch|network|failed|load|tunnel/i.test(m);
          const wrong = /invalid|credenciales|grant|password|400|email/i.test(m);
          const texto = wrong ? "Correo o contraseña incorrectos. Revísalos e intenta de nuevo."
            : network ? "No se pudo conectar a la nube (revisa tu internet)."
            : (m || "No se pudo iniciar sesión.");
          msg.className = "access-login__msg is-err";
          // Rescate: nunca dejar a la usuaria fuera de su portal.
          msg.innerHTML = `${U.ui.esc(texto)}<br><button type="button" class="linklike" id="accBypass" style="margin-top:.4rem">Entrar de todos modos →</button>`;
          const by = root.querySelector("#accBypass");
          if (by) by.onclick = () => enterPortal();
        }
      };
    }
    function enterPortal() {
      setPortalAuthed(true);
      const perfiles = U.auth.perfiles();
      const target = perfiles.find(p => p.rol === "coordinador") || perfiles[0];
      if (target) { U.auth.login(target.id); U.router.go(target.rol === "referente" ? "#/ref/inicio" : "#/coord/home"); }
      else U.router.render();
    }
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
    // Selector de tema (paleta + modo claro/oscuro)
    const T = U.theme;
    if (T) {
      root.querySelectorAll("[data-palette]").forEach(sw => sw.onclick = () => {
        T.setPalette(sw.dataset.palette);
        root.querySelectorAll("[data-palette]").forEach(s => s.classList.toggle("is-on", s === sw));
      });
      const modeBtn = root.querySelector("#modeBtn");
      if (modeBtn) modeBtn.onclick = () => {
        const night = T.toggleNight();
        modeBtn.innerHTML = (night ? "🌙" : "☀️") + `<span>${night ? "Oscuro" : "Claro"}</span>`;
      };
    }
  }

  /* Recorta al centro (cuadrado) y reduce a 256px para caber en el almacenamiento local */
  function fileToAvatar(file, cb) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 256, min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2, sy = (img.height - min) / 2;
        const cv = document.createElement("canvas"); cv.width = cv.height = SIZE;
        cv.getContext("2d").drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
        cb(cv.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => cb(null);
      img.src = e.target.result;
    };
    reader.onerror = () => cb(null);
    reader.readAsDataURL(file);
  }

  /* ---------- Editor de perfil (reflejado en acceso, header y perfil) ---------- */
  function editPerfil(id, onDone) {
    const ui = U.ui;
    const u = U.store.get("usuarios", id);
    if (!u) return;
    const fields = [
      { name: "nombre", label: "Nombre completo", required: true, full: true },
      { name: "cargo", label: "Cargo", required: true, full: true },
      { name: "unidad", label: "Unidad", full: true }
    ];
    ui.modal({
      title: "Editar perfil",
      body: `<p class="card__hint">Los cambios se reflejan automáticamente en la pantalla de acceso, el encabezado y el perfil.</p>
             <div class="pf-photo">
               <div class="avatar avatar--lg" id="prevAvatar">${u.foto ? `<img src="${ui.esc(u.foto)}">` : ui.initials(u.nombre)}</div>
               <div class="pf-photo__side">
                 <span class="pf-photo__lbl">Foto de perfil</span>
                 <div class="btn-row">
                   <label class="btn btn--ghost btn--sm pf-photo__up">📷 Subir foto<input type="file" id="pfFile" accept="image/*" hidden></label>
                   <button type="button" class="btn btn--ghost btn--sm" id="pfClear" ${u.foto ? "" : "hidden"}>🗑️ Quitar</button>
                 </div>
                 <span class="muted" style="font-size:.76rem">JPG o PNG. Se recorta a un cuadrado automáticamente.</span>
               </div>
             </div>
             <input type="hidden" name="foto" value="${ui.esc(u.foto || "")}">
             ${ui.formHTML(fields, u)}`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button>
               <button class="btn btn--primary" data-save>Guardar cambios</button>`,
      onMount(m) {
        const prev = m.querySelector("#prevAvatar");
        const hidden = m.querySelector("input[name=foto]");
        const clearBtn = m.querySelector("#pfClear");
        const nombreI = m.querySelector("input[name=nombre]");
        function paint() {
          const foto = (hidden.value || "").trim();
          prev.innerHTML = foto ? `<img src="${foto}">` : ui.initials(nombreI.value || u.nombre);
          clearBtn.hidden = !foto;
        }
        m.querySelector("#pfFile").onchange = ev => {
          const f = ev.target.files && ev.target.files[0];
          if (!f) return;
          if (!/^image\//.test(f.type)) { ui.toast("Selecciona una imagen (JPG o PNG)", "danger"); return; }
          fileToAvatar(f, dataURL => {
            if (!dataURL) { ui.toast("No se pudo procesar la imagen", "danger"); return; }
            hidden.value = dataURL; paint();
          });
        };
        clearBtn.onclick = () => { hidden.value = ""; paint(); };
        nombreI.addEventListener("input", paint);
        m.querySelector("[data-save]").onclick = () => {
          const data = ui.readForm(m);
          if (!data.nombre || !data.cargo) { ui.toast("Nombre y cargo son obligatorios", "danger"); return; }
          data.esPlaceholder = false;
          try {
            U.auth.updatePerfil(id, data);
          } catch (e) {
            ui.toast("La imagen es muy pesada para guardarse localmente. Prueba con otra más liviana.", "danger");
            return;
          }
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
