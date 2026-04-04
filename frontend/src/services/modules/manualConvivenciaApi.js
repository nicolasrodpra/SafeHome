import { apiDelete, apiGet, apiPost } from "../apiClient";

// Este módulo reúne las acciones del manual en un solo lugar:
// consultar el PDF, publicarlo y eliminarlo.
export const getManualConvivencia = async () =>
  apiGet("/manual-convivencia", "No se pudo cargar el manual de convivencia.");

export const uploadManualConvivencia = async (payload) =>
  apiPost("/manual-convivencia", payload, "No se pudo subir el PDF.");

export const deleteManualConvivencia = async () =>
  apiDelete("/manual-convivencia", "No se pudo eliminar el manual.");
