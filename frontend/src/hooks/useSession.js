import { useEffect, useState } from "react";
import { getSession, SESSION_UPDATED_EVENT } from "../services/sessionService";

// Este hook mantiene sincronizada la sesión del usuario con localStorage.
// Así cualquier cambio en login, logout o perfil se refleja en toda la app.
export default function useSession() {
  const [session, setSession] = useState(getSession());

  useEffect(() => {
    const syncSession = () => {
      setSession(getSession());
    };

    window.addEventListener(SESSION_UPDATED_EVENT, syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener(SESSION_UPDATED_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  return session;
}
