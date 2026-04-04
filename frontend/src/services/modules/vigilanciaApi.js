import { apiDelete, apiGet, apiPost, apiPut } from "../apiClient";

// Este archivo concentra todas las llamadas del módulo de vigilancia.
// Así cada pantalla solo importa la operación que necesita.
export const getResumenVigilancia = async () =>
  apiGet("/resumen-vigilancia", "No se pudo cargar el resumen de vigilancia.");

export const getVehiculos = async () =>
  apiGet("/vehiculos", "No se pudo cargar el registro de vehículos.");

export const createVehiculo = async (payload) => {
  const data = await apiPost("/vehiculos", payload, "No se pudo registrar el vehículo.");
  return data.vehiculo;
};

export const updateVehiculo = async (id, payload) => {
  const data = await apiPut(
    `/vehiculos/${id}`,
    payload,
    "No se pudo actualizar el vehículo."
  );

  return data.vehiculo;
};

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

export const deleteCorrespondencia = async (id) =>
  apiDelete(`/correspondencia/${id}`, "No se pudo eliminar la correspondencia.");

export const getVisitantes = async () =>
  apiGet("/visitantes", "No se pudo cargar el registro de visitantes.");

export const createVisitante = async (payload) => {
  const data = await apiPost("/visitantes", payload, "No se pudo registrar el visitante.");
  return data.visitante;
};

export const updateVisitante = async (id, payload) => {
  const data = await apiPut(
    `/visitantes/${id}`,
    payload,
    "No se pudo actualizar el visitante."
  );

  return data.visitante;
};

export const deleteVisitante = async (id) =>
  apiDelete(`/visitantes/${id}`, "No se pudo eliminar el visitante.");
