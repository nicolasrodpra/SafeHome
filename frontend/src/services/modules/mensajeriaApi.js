import { apiGet, apiPost, apiPut } from "../apiClient";

const DEFAULT_SORT = "Fecha de creación";

export const MENSAJERIA_SECTION_TYPES = [
  {
    value: "Queja",
    label: "Quejas",
    description: "Mensajes de convivencia o situaciones que requieren seguimiento.",
  },
  {
    value: "Solicitud",
    label: "Solicitudes",
    description: "Peticiones dirigidas a administración para su revisión y respuesta.",
  },
  {
    value: "Autorización",
    label: "Autorizaciones",
    description: "Registros informativos que quedan disponibles para consulta administrativa.",
  },
];

export const MENSAJERIA_SORT_OPTIONS_ADMIN = [DEFAULT_SORT, "Nombre", "Estado", "Asunto"];
export const MENSAJERIA_SORT_OPTIONS_RESIDENT = [DEFAULT_SORT, "Estado", "Asunto"];

const normalizeText = (value) => String(value || "").trim();

const normalizeComparable = (value) =>
  normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const getMessageTypeLabel = (type) => {
  const normalizedType = normalizeComparable(type);

  if (normalizedType === "queja") {
    return "Queja";
  }

  if (normalizedType === "solicitud") {
    return "Solicitud";
  }

  if (normalizedType === "autorizacion") {
    return "Autorización";
  }

  return normalizeText(type);
};

export const isMessageRespondable = (type) =>
  normalizeComparable(type) !== normalizeComparable("Autorización");

const sortByCreatedAt = (firstItem, secondItem) => {
  const firstDate = new Date(firstItem.createdAtIso || 0).getTime() || 0;
  const secondDate = new Date(secondItem.createdAtIso || 0).getTime() || 0;

  return secondDate - firstDate;
};

const sortStrategies = {
  [DEFAULT_SORT]: sortByCreatedAt,
  Nombre: (firstItem, secondItem) =>
    normalizeComparable(firstItem.residentName).localeCompare(
      normalizeComparable(secondItem.residentName)
    ),
  Estado: (firstItem, secondItem) =>
    normalizeComparable(firstItem.status).localeCompare(normalizeComparable(secondItem.status)),
  Asunto: (firstItem, secondItem) =>
    normalizeComparable(firstItem.subject).localeCompare(normalizeComparable(secondItem.subject)),
};

export const sortMessages = (messages, sortValue = DEFAULT_SORT) => {
  const sorter = sortStrategies[sortValue] || sortStrategies[DEFAULT_SORT];
  return [...messages].sort(sorter);
};

// Aquí armamos una bandeja por tipo para que la vista no tenga que repetir
// filtros y ordenamientos en cada sección del módulo.
export const groupMessagesByType = (messages, sortValue = DEFAULT_SORT) =>
  MENSAJERIA_SECTION_TYPES.reduce((groups, section) => {
    groups[section.value] = sortMessages(
      messages.filter(
        (item) => normalizeComparable(item.type) === normalizeComparable(section.value)
      ),
      sortValue
    );

    return groups;
  }, {});

export const getMensajeria = async () =>
  apiGet("/mensajeria", "No se pudo cargar la mensajería.");

export const createMensaje = async (payload) => {
  const data = await apiPost(
    "/mensajeria",
    payload,
    "No se pudo guardar el mensaje."
  );

  return data.mensajeria;
};

export const respondToMensaje = async (id, payload) =>
  apiPut(
    `/mensajeria/${id}/respuesta`,
    payload,
    "No se pudo guardar la respuesta."
  );
