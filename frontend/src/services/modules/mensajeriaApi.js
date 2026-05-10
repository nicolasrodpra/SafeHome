// Módulo de mensajería del frontend.
// Reúne llamadas al backend y utilidades de orden y agrupación
// para que las vistas solo se concentren en mostrar datos.
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
    description: "Registros que administración puede aceptar, responder o rechazar.",
  },
];

export const MENSAJERIA_SORT_OPTIONS_ADMIN = [DEFAULT_SORT, "Estado"];
export const MENSAJERIA_SORT_OPTIONS_RESIDENT = [DEFAULT_SORT, "Estado"];

const normalizeText = (value) => String(value || "").trim();

const normalizeComparable = (value) =>
  normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const STATUS_LABELS = {
  pendiente: "Pendiente",
  respondida: "Respondida",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  registrada: "Pendiente",
};

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

export const isAuthorizationMessage = (type) =>
  normalizeComparable(type) === normalizeComparable("Autorización");

export const normalizeMessageStatus = (status) => {
  const normalizedStatus = normalizeComparable(status);
  return STATUS_LABELS[normalizedStatus] || normalizeText(status) || "Pendiente";
};

export const isPendingMessageStatus = (status) =>
  normalizeComparable(normalizeMessageStatus(status)) === normalizeComparable("Pendiente");

export const isMessageRespondable = () => true;

export const getMessageActivityTimestamp = (item) =>
  new Date(item?.updatedAtIso || item?.respondedAtIso || item?.createdAtIso || 0).getTime() || 0;

export const hasAdministrativeMessageUpdate = (item) =>
  !isPendingMessageStatus(item?.status) || Boolean(normalizeText(item?.response));

export const countResidentMessagingUpdates = (messages, residentId, lastSeenAt = 0) =>
  messages.filter(
    (item) =>
      item.residentId === residentId &&
      hasAdministrativeMessageUpdate(item) &&
      getMessageActivityTimestamp(item) > lastSeenAt
  ).length;

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
    normalizeComparable(normalizeMessageStatus(firstItem.status)).localeCompare(
      normalizeComparable(normalizeMessageStatus(secondItem.status))
    ),
  Asunto: (firstItem, secondItem) =>
    normalizeComparable(firstItem.subject).localeCompare(normalizeComparable(secondItem.subject)),
};

export const sortMessages = (messages, sortValue = DEFAULT_SORT) => {
  const sorter = sortStrategies[sortValue] || sortStrategies[DEFAULT_SORT];
  return [...messages].sort(sorter);
};

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
  const data = await apiPost("/mensajeria", payload, "No se pudo guardar el mensaje.");
  return data.mensajeria;
};

export const manageMensaje = async (id, payload) => {
  const data = await apiPut(
    `/mensajeria/${id}/gestion`,
    payload,
    "No se pudo gestionar el mensaje."
  );

  return data.mensajeria;
};

export const respondToMensaje = async (id, payload) =>
  manageMensaje(id, { ...payload, action: payload?.action || "responder" });
