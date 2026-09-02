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
    logout() { sessionStorage.removeItem(SESSION_KEY); try { sessionStorage.removeItem("ubpc:portalAuthed"); localStorage.removeItem("ubpc:portalAuthed"); } catch (e) {} },
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
    markRead(id) { if (id && String(id).indexOf("live-") === 0) return; store().update("notificaciones", id, { leida: true }); },
    markAllRead(rol) { Notif.unread(rol).forEach(n => Notif.markRead(n.id)); },

    // Notificaciones "vivas": lo vencido y lo próximo, calculado desde la Agenda.
    attention(rol) {
      const items = [];
      if (rol !== "coordinador") return items;
      try {
        const U = window.UBPC;
        if (!U.agenda || !U.agenda.buildEvents) return items;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const in3 = new Date(today); in3.setDate(in3.getDate() + 3);
        U.agenda.buildEvents().forEach(e => {
          if (e.done || !e.d) return;
          if (e.deadline && e.d < today) {
            items.push({ id: "live-v-" + e.tipo + "-" + (e.rid || e.iso), live: true, titulo: "Vencido · " + e.titulo,
              modulo: "Agenda", prioridad: "alta", ref: "#/coord/guia?tab=agenda&focus=vencidos", fecha: e.d.toISOString() });
          } else if (e.d >= today && e.d <= in3) {
            const dias = Math.round((e.d - today) / 86400000);
            const cuando = dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : "En " + dias + " días";
            items.push({ id: "live-p-" + e.tipo + "-" + (e.rid || e.iso), live: true, titulo: cuando + " · " + e.titulo,
              modulo: "Agenda", prioridad: dias === 0 ? "media" : "normal", ref: "#/coord/guia?tab=agenda", fecha: e.d.toISOString() });
          }
        });
        const rank = p => p === "alta" ? 0 : p === "media" ? 1 : 2;
        items.sort((a, b) => rank(a.prioridad) - rank(b.prioridad) || new Date(a.fecha) - new Date(b.fecha));
      } catch (e) {}
      return items;
    },
    // Contador de la campana: vencidos + hoy + notificaciones no leídas
    badgeCount(rol) {
      const urgent = Notif.attention(rol).filter(n => n.prioridad === "alta" || n.prioridad === "media").length;
      return urgent + Notif.unread(rol).length;
    }
  };

  window.UBPC = window.UBPC || {};
  window.UBPC.auth = Auth;
  window.UBPC.notif = Notif;
})();
