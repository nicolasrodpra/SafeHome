// Modal reutilizable para ver el detalle de un mensaje.
// En administración también habilita la respuesta del caso
// y la gestión de autorizaciones.
import { useEffect } from "react";
import {
  getMessageTypeLabel,
  isAuthorizationMessage,
  isPendingMessageStatus,
} from "../../services/modules/mensajeriaApi";
import { MensajeriaStatusBadge } from "./MensajeriaSectionTable";

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const getAdministrativeStatusCopy = (item, isAuthorization) => {
  if (item.response) {
    return item.response;
  }

  if (isPendingMessageStatus(item.status)) {
    return isAuthorization
      ? "Administración aún no ha gestionado esta autorización."
      : "Administración aún no ha respondido este registro.";
  }

  if (isAuthorization) {
    if (item.status === "Aceptada") {
      return "La autorización fue aceptada por administración.";
    }

    if (item.status === "Rechazada") {
      return "La autorización fue rechazada por administración.";
    }
  }

  return "Administración actualizó el estado de este registro.";
};

export default function MensajeriaDetailModal({
  item,
  mode,
  replyText = "",
  onReplyChange = () => {},
  onClose,
  onSubmitAction = () => {},
  submittingAction = false,
}) {
  useEffect(() => {
    if (!item) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  const isAdminView = mode === "admin";
  const isResidentView = mode === "resident";
  const isViewerMode = mode === "viewer";
  const usesAdminDetail = isAdminView || isViewerMode;
  const typeLabel = getMessageTypeLabel(item.type);
  const isAuthorization = isAuthorizationMessage(item.type);
  const hasResponse = Boolean(item.response);
  const hasAdministrativeUpdate = !isPendingMessageStatus(item.status) || hasResponse;
  const responseLabel = isAuthorization ? "Respuesta o nota administrativa" : "Respuesta";
  const responsePlaceholder = isAuthorization
    ? "Opcional: agrega una nota para el residente al aceptar o rechazar."
    : "Escribe aquí la respuesta para el residente...";
  const administrativeStatusCopy = getAdministrativeStatusCopy(item, isAuthorization);

  return (
    <div className="mensajeria-modal-overlay" onClick={onClose}>
      <div className="mensajeria-modal" onClick={(event) => event.stopPropagation()}>
        <div className="mensajeria-modal-header">
          <div>
            <span className="mensajeria-modal-kicker">Detalle del registro</span>
            <h2>
              {isAdminView && isAuthorization
                ? "Gestionar autorización"
                : isAdminView
                  ? "Responder mensaje"
                  : "Detalle del registro"}
            </h2>
          </div>

          <button type="button" className="mensajeria-modal-close" onClick={onClose} title="Cerrar">
            <CloseIcon />
          </button>
        </div>

        <div className="mensajeria-modal-body">
          <div className="mensajeria-modal-grid">
            {usesAdminDetail ? (
              <div className="mensajeria-modal-field">
                <span>Residente</span>
                <strong>{item.residentName}</strong>
                <small>{item.residentInfo}</small>
              </div>
            ) : (
              <div className="mensajeria-modal-field">
                <span>Tipo</span>
                <strong>{typeLabel}</strong>
                <small>{item.dateLabel}</small>
              </div>
            )}

            <div className="mensajeria-modal-field">
              <span>Estado</span>
              <MensajeriaStatusBadge status={item.status} />
              <small>{item.timeLabel}</small>
            </div>

            {usesAdminDetail ? (
              <div className="mensajeria-modal-field">
                <span>Tipo</span>
                <strong>{typeLabel}</strong>
                <small>{item.residentEmail || "Sin correo registrado"}</small>
              </div>
            ) : (
              <div className="mensajeria-modal-field">
                <span>Ubicación</span>
                <strong>{item.residentInfo}</strong>
                <small>{item.residentEmail || "Sin correo registrado"}</small>
              </div>
            )}

            <div className="mensajeria-modal-field full">
              <span>Asunto</span>
              <strong>{item.subject}</strong>
            </div>

            <div className="mensajeria-modal-field full">
              <span>Mensaje completo</span>
              <p>{item.message}</p>
            </div>

            {isAdminView ? (
              <div className="mensajeria-modal-field full">
                <span>{responseLabel}</span>
                <textarea
                  className="mensajeria-reply-box"
                  placeholder={responsePlaceholder}
                  rows="6"
                  value={replyText}
                  onChange={(event) => onReplyChange(event.target.value)}
                />
              </div>
            ) : (
              <div className="mensajeria-modal-field full">
                <span>Gestión de administración</span>
                <p>{administrativeStatusCopy}</p>
                {hasAdministrativeUpdate ? (
                  <small>
                    {item.respondedByName || "Administración"} - {item.respondedDateLabel} -{" "}
                    {item.respondedTimeLabel}
                  </small>
                ) : null}
              </div>
            )}

            {!isAdminView && isViewerMode ? (
              <div className="mensajeria-modal-field full mensajeria-modal-note">
                <span>Acceso del vigilante</span>
                <p>
                  Esta vista es solo de consulta. El seguimiento y la respuesta quedan a cargo de
                  administración.
                </p>
              </div>
            ) : null}

            {!isAdminView && isResidentView && isAuthorization && !hasAdministrativeUpdate ? (
              <div className="mensajeria-modal-field full mensajeria-modal-note">
                <span>Seguimiento</span>
                <p>La autorización sigue pendiente de revisión por parte de administración.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mensajeria-modal-footer">
          <button type="button" className="mensajeria-secondary-btn" onClick={onClose}>
            {isAdminView ? "Cerrar" : "Volver"}
          </button>

          {isAdminView && isAuthorization ? (
            <div className="mensajeria-modal-actions">
              <button
                type="button"
                className="mensajeria-danger-btn"
                onClick={() => onSubmitAction("rechazar")}
                disabled={submittingAction}
              >
                {submittingAction ? "Guardando..." : "Rechazar"}
              </button>
              <button
                type="button"
                className="mensajeria-secondary-btn"
                onClick={() => onSubmitAction("responder")}
                disabled={submittingAction}
              >
                {submittingAction
                  ? "Guardando..."
                  : hasResponse
                    ? "Actualizar respuesta"
                    : "Responder"}
              </button>
              <button
                type="button"
                className="mensajeria-primary-btn"
                onClick={() => onSubmitAction("aceptar")}
                disabled={submittingAction}
              >
                {submittingAction ? "Guardando..." : "Aceptar"}
              </button>
            </div>
          ) : null}

          {isAdminView && !isAuthorization ? (
            <button
              type="button"
              className="mensajeria-primary-btn"
              onClick={() => onSubmitAction("responder")}
              disabled={submittingAction}
            >
              {submittingAction
                ? "Guardando..."
                : hasResponse
                  ? "Actualizar respuesta"
                  : "Enviar respuesta"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
