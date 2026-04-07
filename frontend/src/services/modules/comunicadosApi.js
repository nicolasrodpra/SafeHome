// Modulo de comunicados del frontend.
// Expone operaciones CRUD simples para no repetir rutas HTTP en las paginas.
import { apiDelete, apiGet, apiPost, apiPut } from "../apiClient";

// Todas estas funciones son envoltorios pequeños del backend.
// Las separamos para que las páginas no repitan rutas ni mensajes.
export const getComunicados = async () =>
  apiGet("/comunicados", "No se pudieron cargar los comunicados.");

export const createComunicado = async (payload) => {
  const data = await apiPost(
    "/comunicados",
    payload,
    "No se pudo guardar el comunicado."
  );

  return data.comunicado;
};

export const updateComunicado = async (id, payload) => {
  const data = await apiPut(
    `/comunicados/${id}`,
    payload,
    "No se pudo actualizar el comunicado."
  );

  return data.comunicado;
};

export const deleteComunicado = async (id) =>
  apiDelete(`/comunicados/${id}`, "No se pudo eliminar el comunicado.");
