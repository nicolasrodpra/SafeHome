export async function readApiResponse(res, fallbackMessage) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.mensaje || fallbackMessage);
    }

    return data;
  }

  const rawText = await res.text();

  if (!res.ok) {
    if (rawText.includes("<!DOCTYPE") || rawText.includes("<html")) {
      throw new Error(
        "El backend no reconoce esta ruta. Reinicia el servidor para cargar los cambios nuevos."
      );
    }

    throw new Error(rawText || fallbackMessage);
  }

  return {};
}
