import { apiDelete, apiGet, apiPost } from "../apiClient";

// Aquí dejamos las operaciones de reservas juntas para reutilizarlas
// desde el calendario sin mezclar la lógica de red con la interfaz.
export const getReservas = async () =>
  apiGet("/reservas", "No se pudieron cargar las reservas.");

export const createReserva = async (payload) => {
  const data = await apiPost("/reservas", payload, "No se pudo crear la reserva.");
  return data.reserva;
};

export const deleteReserva = async (id) =>
  apiDelete(`/reservas/${id}`, "No se pudo cancelar la reserva.");
