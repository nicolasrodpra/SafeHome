// Modulo de reservas del frontend.
// Sirve como puente entre el calendario React y el backend de reservas.
import { apiDelete, apiGet, apiPost, apiPut } from "../apiClient";

// Aquí dejamos las operaciones de reservas juntas para reutilizarlas
// desde el calendario sin mezclar la lógica de red con la interfaz.
export const getReservas = async () =>
  apiGet("/reservas", "No se pudieron cargar las reservas.");

export const createReserva = async (payload) => {
  const data = await apiPost("/reservas", payload, "No se pudo crear la reserva.");
  return data.reserva;
};

export const updateReserva = async (id, payload) => {
  const data = await apiPut(`/reservas/${id}`, payload, "No se pudo actualizar la reserva.");
  return data.reserva;
};

export const deleteReserva = async (id) =>
  apiDelete(`/reservas/${id}`, "No se pudo cancelar la reserva.");
