import { readApiResponse } from "../utils/readApiResponse";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const REQUEST_TIMEOUT_MS = 12000;

// Esta función arma la URL final del endpoint usando la base del backend
// y la ruta específica que necesita cada módulo.
const buildUrl = (path) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

// Esta es la función central para hablar con el backend.
// Todas las peticiones pasan por aquí para compartir la misma configuración.
const request = async (path, options = {}, fallbackMessage) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    return await readApiResponse(response, fallbackMessage);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("El servidor tardó demasiado en responder. Inténtalo de nuevo.");
    }

    if (error instanceof TypeError) {
      throw new Error("No se pudo conectar con el backend. Verifica que el servidor esté encendido.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const apiGet = (path, fallbackMessage) => request(path, { method: "GET" }, fallbackMessage);

export const apiPost = (path, body, fallbackMessage) =>
  request(
    path,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    fallbackMessage
  );

export const apiPut = (path, body, fallbackMessage) =>
  request(
    path,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
    fallbackMessage
  );

export const apiDelete = (path, fallbackMessage) =>
  request(path, { method: "DELETE" }, fallbackMessage);

export const getApiUrl = (path) => buildUrl(path);
