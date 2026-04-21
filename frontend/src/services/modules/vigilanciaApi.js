// Módulo de vigilancia del frontend.
// Agrupa las operaciones de resumen, vehículos, correspondencia y visitantes.
import { apiDelete, apiGet, apiPost, apiPut } from "../apiClient";

export const getResumenVigilancia = async () =>
  apiGet("/resumen-vigilancia", "No se pudo cargar el resumen de vigilancia.");

export const getAlertasPanico = async () =>
  apiGet("/alertas-panico", "No se pudieron cargar las alertas de panico.");

export const resolveAlertaPanico = async (id, payload) =>
  apiPut(`/alertas-panico/${id}/resolver`, payload, "No se pudo marcar la alerta como atendida.");

export const getVehiculos = async () =>
  apiGet("/vehiculos", "No se pudo cargar el registro de vehículos.");

export const createVehiculo = async (payload) => {
  const data = await apiPost("/vehiculos", payload, "No se pudo registrar el vehículo.");
  return data.vehiculo;
};

export const updateVehiculo = async (id, payload) => {
  const data = await apiPut(`/vehiculos/${id}`, payload, "No se pudo actualizar el vehículo.");
  return data.vehiculo;
};

export const registerVehiculoSalida = async (id, payload) =>
  apiPost(`/vehiculos/${id}/salida`, payload, "No se pudo registrar la salida del vehículo.");

export const deleteVehiculo = async (id) =>
  apiDelete(`/vehiculos/${id}`, "No se pudo eliminar el vehículo.");

export const getCorrespondencia = async () =>
  apiGet("/correspondencia", "No se pudo cargar la correspondencia.");

export const createCorrespondencia = async (payload) => {
  const data = await apiPost(
    "/correspondencia",
    payload,
    "No se pudo registrar la correspondencia."
  );

  return data.correspondencia;
};

export const updateCorrespondencia = async (id, payload) => {
  const data = await apiPut(
    `/correspondencia/${id}`,
    payload,
    "No se pudo actualizar la correspondencia."
  );

  return data.correspondencia;
};

export const markCorrespondenciaEntregada = async (id, payload) =>
  apiPost(
    `/correspondencia/${id}/entregar`,
    payload,
    "No se pudo registrar la entrega de la correspondencia."
  );

export const deleteCorrespondencia = async (id) =>
  apiDelete(`/correspondencia/${id}`, "No se pudo eliminar la correspondencia.");

export const getVisitantes = async () =>
  apiGet("/visitantes", "No se pudo cargar el registro de visitantes.");

export const createVisitante = async (payload) => {
  const data = await apiPost("/visitantes", payload, "No se pudo registrar el visitante.");
  return data.visitante;
};

export const updateVisitante = async (id, payload) => {
  const data = await apiPut(`/visitantes/${id}`, payload, "No se pudo actualizar el visitante.");
  return data.visitante;
};

export const deleteVisitante = async (id) =>
  apiDelete(`/visitantes/${id}`, "No se pudo eliminar el visitante.");
