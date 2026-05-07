import { apiGet, apiPost, apiPut } from "../apiClient";

export const getActiveEmergencies = async () =>
  apiGet("/emergencias/activas", "No se pudieron cargar las emergencias activas.");

export const createEmergency = async (payload) => {
  const data = await apiPost("/emergencias", payload, "No se pudo activar la alerta de panico.");
  return data.emergencia;
};

export const attendEmergency = async (id, payload) =>
  apiPut(`/emergencias/${id}/atender`, payload, "No se pudo marcar la emergencia como atendida.");
