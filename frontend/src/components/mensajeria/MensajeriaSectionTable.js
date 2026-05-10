// Tabla reutilizable para mostrar bandejas de mensajería.
// La misma estructura sirve para administración y residente,
// cambiando algunas columnas según el modo recibido.
import {
  isAuthorizationMessage,
  isPendingMessageStatus,
  normalizeMessageStatus,
} from "../../services/modules/mensajeriaApi";

const MailIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

const getStatusClassName = (status) =>
  String(status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function MensajeriaStatusBadge({ status }) {
  const normalizedStatus = normalizeMessageStatus(status);
  return (
    <span className={`mensajeria-status-chip ${getStatusClassName(normalizedStatus)}`}>
      {normalizedStatus}
    </span>
  );
}

function ResidentResponseState({ item }) {
  const normalizedStatus = normalizeMessageStatus(item.status);

  if (item.response) {
    return <span className="mensajeria-response-state answered">Disponible</span>;
  }

  if (isPendingMessageStatus(normalizedStatus)) {
    return <span className="mensajeria-response-state pending">Pendiente</span>;
  }

  if (isAuthorizationMessage(item.type)) {
    return (
      <span
        className={`mensajeria-response-state ${
          normalizedStatus === "Aceptada" ? "answered" : "rejected"
        }`}
      >
        {normalizedStatus}
      </span>
    );
  }

  return <span className="mensajeria-response-state neutral">{normalizedStatus}</span>;
}

export default function MensajeriaSectionTable({
  title,
  description,
  items,
  emptyMessage,
  mode = "admin",
  onOpen,
}) {
  const usesAdminLayout = mode === "admin" || mode === "viewer";

  return (
    <section className="mensajeria-section-card">
      <div className="mensajeria-section-head">
        <div>
          <span className="mensajeria-section-kicker">Bandeja</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="mensajeria-section-count">
          <span>Total</span>
          <strong>{items.length}</strong>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mensajeria-empty-state">{emptyMessage}</p>
      ) : (
        <div className="mensajeria-table-wrap">
          <table className="mensajeria-table">
            <thead>
              <tr>
                <th>Estado</th>
                {usesAdminLayout ? <th>Información</th> : <th>Asunto</th>}
                <th>{usesAdminLayout ? "Asunto" : "Fecha"}</th>
                <th>{usesAdminLayout ? "Fecha" : "Hora"}</th>
                <th>{usesAdminLayout ? "Hora" : "Respuesta"}</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <MensajeriaStatusBadge status={item.status} />
                  </td>

                  {usesAdminLayout ? (
                    <td>
                      <div className="mensajeria-info-cell">
                        <span className="mensajeria-info-name">{item.residentName}</span>
                        <span className="mensajeria-info-detail">{item.residentInfo}</span>
                      </div>
                    </td>
                  ) : (
                    <td className="mensajeria-asunto-cell">{item.subject}</td>
                  )}

                  {usesAdminLayout ? (
                    <td className="mensajeria-asunto-cell">{item.subject}</td>
                  ) : (
                    <td>{item.dateLabel}</td>
                  )}

                  {usesAdminLayout ? <td>{item.dateLabel}</td> : <td>{item.timeLabel}</td>}
                  {usesAdminLayout ? (
                    <td>{item.timeLabel}</td>
                  ) : (
                    <td>
                      <ResidentResponseState item={item} />
                    </td>
                  )}

                  <td className="mensajeria-action-cell">
                    <button type="button" title="Ver detalle" onClick={() => onOpen(item)}>
                      <MailIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
