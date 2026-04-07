// Modulo de usuarios del frontend.
// Aqui se agrupan perfil, actualizacion y listado de residentes.
import { apiGet, apiPut } from "../apiClient";

// El backend puede devolver el perfil dentro de `profile`
// o plano, así que aquí lo normalizamos una sola vez.
const readProfilePayload = (data) => {
  if (data?.profile && typeof data.profile === "object") {
    return data.profile;
  }

  if (data?.uid || data?.rol || data?.nombre) {
    return data;
  }

  throw new Error("El backend devolvió un perfil incompleto.");
};

// Estas funciones aíslan el módulo de usuario para que el resto de la app
// no dependa del formato exacto de las respuestas HTTP.
export const getUserProfile = async (uid) => {
  const data = await apiGet(`/users/${uid}/profile`, "No se pudo cargar el perfil.");
  return readProfilePayload(data);
};

export const updateUserProfile = async (uid, payload) => {
  const data = await apiPut(
    `/users/${uid}/profile`,
    payload,
    "No se pudo actualizar el perfil."
  );

  return readProfilePayload(data);
};

export const getResidents = async () =>
  apiGet("/users/residentes", "No se pudo cargar la lista de residentes.");
