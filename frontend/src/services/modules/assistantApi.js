// Módulo del asistente virtual.
// Envía la pregunta y la sesión actual al backend para obtener
// una respuesta contextual según el rol del usuario.
import { apiPost } from "../apiClient";

export const askAssistant = async ({ message, history, session }) => {
  const data = await apiPost(
    "/assistant/chat",
    {
      message,
      history,
      session,
    },
    "No se pudo consultar el asistente virtual."
  );

  if (!data?.answer) {
    throw new Error("El asistente no devolvió una respuesta válida.");
  }

  return data.answer;
};
