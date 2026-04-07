// Servicio de almacenamiento de sesion.
// Guarda, lee, limpia y sincroniza la sesion del usuario en localStorage.
const SESSION_STORAGE_KEY = "safehome_session";
export const SESSION_UPDATED_EVENT = "safehome-session-updated";

const emitSessionUpdate = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
};

export const getSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    return JSON.parse(rawSession);
  } catch (error) {
    return null;
  }
};

// Esta función guarda la sesión solo si realmente cambió.
// Así evitamos ciclos de actualización entre los layouts y el almacenamiento local.
export const saveSession = (session) => {
  if (typeof window === "undefined") {
    return;
  }

  const nextSerializedSession = JSON.stringify(session);
  const currentSerializedSession = localStorage.getItem(SESSION_STORAGE_KEY);

  if (currentSerializedSession === nextSerializedSession) {
    return;
  }

  localStorage.setItem(SESSION_STORAGE_KEY, nextSerializedSession);
  emitSessionUpdate();
};

export const clearSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (!localStorage.getItem(SESSION_STORAGE_KEY)) {
    return;
  }

  localStorage.removeItem(SESSION_STORAGE_KEY);
  emitSessionUpdate();
};

export const updateSessionProfile = (profile) => {
  const currentSession = getSession();

  if (!currentSession) {
    return;
  }

  saveSession({
    ...currentSession,
    ...profile,
  });
};
