/* ============================================================
   AUTH — Perfiles, sesión y notificaciones
   Los cambios de nombre/cargo/foto se reflejan en acceso,
   encabezado y perfil automáticamente (una sola fuente: store).
   ============================================================ */
(function () {
  "use strict";
  const store = () => window.UBPC.store;
  const SESSION_KEY = "ubpc:session";

  const Auth = {
    perfiles() { return store().all("usuarios"); },

    coordinador() { return store().all("usuarios").find(u => u.rol === "coordinador"); },
    referente() { return store().all("usuarios").find(u => u.rol === "referente"); },

    current() {
      const id = sessionStorage.getItem(SESSION_KEY);
      if (!id) return null;
      return store().get("usuarios", id);
    },
    login(userId) { sessionStorage.setItem(SESSION_KEY, userId); },
    logout() { sessionStorage.removeItem(SESSION_KEY); },
    isCoordinador() { const u = Auth.current(); return u && u.rol === "coordinador"; },
    isReferente() { const u = Auth.current(); return u && u.rol === "referente"; },

    updatePerfil(id, patch) { return store().update("usuarios", id, patch); }
  };

  /* ---------- Notificaciones ---------- */
  const Notif = {
    all() {
      return store().all("notificaciones").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    },
    forRole(rol) { return Notif.all().filter(n => n.destinatario === rol || n.destinatario === "todos"); },
    unread(rol) { return Notif.forRole(rol).filter(n => !n.leida); },

    push({ titulo, modulo, prioridad, destinatario, ref }) {
      return store().insert("notificaciones", {
        titulo, modulo, prioridad: prioridad || "normal",
        destinatario: destinatario || "todos", ref: ref || null, leida: false,
        fecha: new Date().toISOString()
      }, { silent: true });
    },
    markRead(id) { store().update("notificaciones", id, { leida: true }); },
    markAllRead(rol) { Notif.unread(rol).forEach(n => Notif.markRead(n.id)); }
  };

  window.UBPC = window.UBPC || {};
  window.UBPC.auth = Auth;
  window.UBPC.notif = Notif;
})();
