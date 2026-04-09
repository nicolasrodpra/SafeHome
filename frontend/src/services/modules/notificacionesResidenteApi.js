import { apiGet, apiPut } from "../apiClient";

export const getNotificacionesResidente = async (residentId) =>
  apiGet(
    `/residentes/${residentId}/notificaciones`,
    "No se pudieron cargar las notificaciones del residente."
  );

export const marcarNotificacionesResidenteComoVistas = async (residentId) =>
  apiPut(
    `/residentes/${residentId}/notificaciones/marcar-vistas`,
    {},
    "No se pudieron actualizar las notificaciones del residente."
  );
