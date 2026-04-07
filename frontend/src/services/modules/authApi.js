// Modulo de autenticacion del frontend.
// Traduce la pantalla de login a una llamada concreta contra /api/login.
import { apiPost } from "../apiClient";

// Algunos controladores devuelven la sesión dentro de `session`
// y otros la dejan plana. Esta función acepta ambos formatos.
const buildSessionFromLoginResponse = (data) => {
  if (data?.session && typeof data.session === "object") {
    return data.session;
  }

  if (data?.uid && data?.rol) {
    return data;
  }

  return null;
};

// Esta función centraliza el login para que la página solo tenga que
// enviar correo y contraseña y reciba una sesión válida.
export const loginUser = async (payload) => {
  const data = await apiPost("/login", payload, "No se pudo iniciar sesión.");
  const session = buildSessionFromLoginResponse(data);

  if (!session?.uid || !session?.rol) {
    throw new Error(
      "La respuesta del inicio de sesión está incompleta. Reinicia el backend e inténtalo de nuevo."
    );
  }

  return session;
};
