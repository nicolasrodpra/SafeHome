import { isMessageRespondable } from "../../services/modules/mensajeriaApi";

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

// Convertimos el texto del estado a una clase CSS segura
// para aplicar el color correcto del chip.
const getStatusClassName = (status) =>
  String(status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function MensajeriaStatusBadge({ status }) {
  return <span className={`mensajeria-status-chip ${getStatusClassName(status)}`}>{status}</span>;
}

// En la vista del residente no siempre hay respuesta disponible.
// Este bloque resume ese estado en una palabra corta.
function ResidentResponseState({ item }) {
  if (!isMessageRespondable(item.type)) {
    return <span className="mensajeria-response-state neutral">No aplica</span>;
  }

  if (item.response) {
    return <span className="mensajeria-response-state answered">Disponible</span>;
  }

  return <span className="mensajeria-response-state pending">Pendiente</span>;
}

// Esta tabla se reutiliza tanto en administración como en residente.
// Por eso algunas columnas cambian según el modo recibido.
export default function MensajeriaSectionTable({
  title,
  description,
  items,
  emptyMessage,
  mode = "admin",
  onOpen,
}) {
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
                {mode === "admin" ? <th>Información</th> : <th>Asunto</th>}
                <th>{mode === "admin" ? "Asunto" : "Fecha"}</th>
                <th>{mode === "admin" ? "Fecha" : "Hora"}</th>
                <th>{mode === "admin" ? "Hora" : "Respuesta"}</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <MensajeriaStatusBadge status={item.status} />
                  </td>

                  {mode === "admin" ? (
                    <td>
                      <div className="mensajeria-info-cell">
                        <span className="mensajeria-info-name">{item.residentName}</span>
                        <span className="mensajeria-info-detail">{item.residentInfo}</span>
                      </div>
                    </td>
                  ) : (
                    <td className="mensajeria-asunto-cell">{item.subject}</td>
                  )}

                  {mode === "admin" ? (
                    <td className="mensajeria-asunto-cell">{item.subject}</td>
                  ) : (
                    <td>{item.dateLabel}</td>
                  )}

                  {mode === "admin" ? <td>{item.dateLabel}</td> : <td>{item.timeLabel}</td>}
                  {mode === "admin" ? (
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
