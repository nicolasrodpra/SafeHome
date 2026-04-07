import { useEffect } from "react";
import {
  getMessageTypeLabel,
  isMessageRespondable,
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

export default function MensajeriaDetailModal({
  item,
  mode,
  replyText,
  onReplyChange,
  onClose,
  onSubmitReply,
  submittingReply,
}) {
  useEffect(() => {
    if (!item) return undefined;

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

  if (!item) return null;

  const canReply = mode === "admin" && isMessageRespondable(item.type);
  const hasResponse = Boolean(item.response);
  const isResidentView = mode === "resident";
  const isViewerMode = mode === "viewer";
  const usesAdminDetail = mode === "admin" || isViewerMode;
  const typeLabel = getMessageTypeLabel(item.type);

  return (
    <div className="mensajeria-modal-overlay" onClick={onClose}>
      <div className="mensajeria-modal" onClick={(event) => event.stopPropagation()}>
        <div className="mensajeria-modal-header">
          <div>
            <span className="mensajeria-modal-kicker">Detalle del registro</span>
            <h2>{canReply ? "Responder mensaje" : "Detalle del registro"}</h2>
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

            {usesAdminDetail && (
              <div className="mensajeria-modal-field">
                <span>Tipo</span>
                <strong>{typeLabel}</strong>
                <small>{item.residentEmail || "Sin correo registrado"}</small>
              </div>
            )}

            {isResidentView && (
              <div className="mensajeria-modal-field">
                <span>Ubicacion</span>
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

            {canReply && (
              <div className="mensajeria-modal-field full">
                <span>Respuesta</span>
                <textarea
                  className="mensajeria-reply-box"
                  placeholder="Escribe aqui la respuesta para el residente..."
                  rows="6"
                  value={replyText}
                  onChange={(event) => onReplyChange(event.target.value)}
                />
              </div>
            )}

            {!canReply && isMessageRespondable(item.type) && (isResidentView || isViewerMode) && (
              <div className="mensajeria-modal-field full">
                <span>{isViewerMode ? "Respuesta de administracion" : "Respuesta de administracion"}</span>
                {hasResponse ? (
                  <>
                    <p>{item.response}</p>
                    <small>
                      {item.respondedByName || "Administracion"} - {item.respondedDateLabel} -{" "}
                      {item.respondedTimeLabel}
                    </small>
                  </>
                ) : (
                  <p>
                    {isViewerMode
                      ? "Administracion aun no ha respondido esta queja."
                      : "Administracion aun no ha respondido este registro."}
                  </p>
                )}
              </div>
            )}

            {!canReply && isViewerMode && (
              <div className="mensajeria-modal-field full mensajeria-modal-note">
                <span>Acceso del vigilante</span>
                <p>Esta vista es solo de consulta. El seguimiento y la respuesta quedan a cargo de administracion.</p>
              </div>
            )}

            {!canReply && !isResidentView && !isViewerMode && (
              <div className="mensajeria-modal-field full mensajeria-modal-note">
                <span>Nota</span>
                <p>
                  Las autorizaciones quedan guardadas como registro informativo y no requieren
                  respuesta desde esta vista.
                </p>
              </div>
            )}

            {!canReply && isResidentView && !isMessageRespondable(item.type) && (
              <div className="mensajeria-modal-field full mensajeria-modal-note">
                <span>Estado del registro</span>
                <p>Esta autorizacion fue registrada correctamente y no requiere respuesta.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mensajeria-modal-footer">
          <button type="button" className="mensajeria-secondary-btn" onClick={onClose}>
            {canReply ? "Cancelar" : "Cerrar"}
          </button>

          {canReply && (
            <button
              type="button"
              className="mensajeria-primary-btn"
              onClick={onSubmitReply}
              disabled={submittingReply}
            >
              {submittingReply
                ? "Guardando..."
                : hasResponse
                ? "Actualizar respuesta"
                : "Enviar respuesta"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
