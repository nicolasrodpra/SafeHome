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
    throw new Error("El asistente no devolvio una respuesta valida.");
  }

  return data.answer;
};
