import { useState, useRef, useEffect } from "react";
import InternalLayout from "../../layouts/InternalLayout";
import "../../styles/admin/pqrRecibidos.css";

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

const ListIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const FilterIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const ChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SORT_OPTIONS = [
  "Fecha de creacion",
  "Nombre",
  "Estado",
  "Tipo",
  "Asunto",
];

const pqrData = [
  {
    id: 1,
    status: "Pendiente",
    name: "Nicolas Rodriguez",
    info: "Torre: 6  Apto: 78",
    type: "Queja",
    subject: "Mucho Ruido",
    message:
      "Buenas tardes, quisiera reportar ruido constante en horas de la noche en la torre 6, apartamento 78. Esta situacion se ha repetido varios dias y afecta el descanso.",
    date: "23/09/2026",
    time: "08:39 a. m.",
  },
  {
    id: 2,
    status: "Contestado",
    name: "Nicolas Rodriguez",
    info: "Torre: 6  Apto: 78",
    type: "Queja",
    subject: "Mucho Ruido",
    message:
      "Solicito apoyo con una queja por exceso de ruido durante la madrugada. Agradezco la revision y una respuesta sobre las acciones a tomar.",
    date: "23/09/2026",
    time: "08:39 a. m.",
  },
  {
    id: 3,
    status: "Revisar",
    name: "Nicolas Rodriguez",
    info: "Torre: 6  Apto: 78",
    type: "Queja",
    subject: "Mucho Ruido",
    message:
      "Me gustaria dejar constancia de una molestia por musica a alto volumen en zonas comunes. Pido por favor revisar el caso y orientarnos con la solucion.",
    date: "23/09/2026",
    time: "08:39 a. m.",
  },
];

function StatusBadge({ status }) {
  const cls = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return <span className={`status-chip ${cls}`}>{status}</span>;
}

export default function PqrRecibidosAdmin() {
  const [sortOpen, setSortOpen] = useState(false);
  const [sortValue, setSortValue] = useState("Fecha de creacion");
  const [selectedPqr, setSelectedPqr] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setSelectedPqr(null);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <InternalLayout>
      <div className="content">
        <h1 className="internal-page-title pqr-page-title">Quejas</h1>

        <div className="card">
          <div className="toolbar">
            <div className="sort-block" ref={dropdownRef}>
              <span className="sort-label">Ordenar por:</span>
              <button
                className="sort-trigger"
                onClick={() => setSortOpen((v) => !v)}
              >
                <span>{sortValue}</span>
                <ChevronDown />
              </button>

              <div className={`sort-dropdown${sortOpen ? " open" : ""}`}>
                {SORT_OPTIONS.map((opt) => (
                  <div
                    key={opt}
                    className={`sort-dropdown-item${sortValue === opt ? " active" : ""}`}
                    onClick={() => {
                      setSortValue(opt);
                      setSortOpen(false);
                    }}
                  >
                    <span className="sort-dot"></span>
                    {opt}
                  </div>
                ))}
              </div>
            </div>

            <div className="toolbar-spacer" />

            <div className="filter-actions">
              <button className="list-btn" title="Listado">
                <ListIcon />
              </button>
              <button className="filter-btn">
                Filtrar <FilterIcon />
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="pqr-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Informacion</th>
                  <th>Tipo</th>
                  <th>Asunto</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {pqrData.map((item) => (
                  <tr key={item.id}>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      <div className="info-cell">
                        <span className="info-name">{item.name}</span>
                        <span className="info-detail">{item.info}</span>
                      </div>
                    </td>
                    <td className="type-badge">{item.type}</td>
                    <td className="asunto-cell">{item.subject}</td>
                    <td>{item.date}</td>
                    <td>{item.time}</td>
                    <td className="action-cell">
                      <button
                        title="Ver detalle"
                        onClick={() => setSelectedPqr(item)}
                      >
                        <MailIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedPqr && (
        <div className="modal-overlay" onClick={() => setSelectedPqr(null)}>
          <div className="pqr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pqr-modal-header">
              <div>
                <span className="pqr-modal-kicker">Detalle del mensaje</span>
                <h2>Responder PQR</h2>
              </div>
              <button
                className="pqr-modal-close"
                onClick={() => setSelectedPqr(null)}
                title="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="pqr-modal-body">
              <div className="pqr-modal-grid">
                <div className="pqr-modal-field">
                  <span>Residente</span>
                  <strong>{selectedPqr.name}</strong>
                  <small>{selectedPqr.info}</small>
                </div>
                <div className="pqr-modal-field">
                  <span>Estado</span>
                  <StatusBadge status={selectedPqr.status} />
                </div>
                <div className="pqr-modal-field full">
                  <span>Asunto</span>
                  <strong>{selectedPqr.subject}</strong>
                </div>
                <div className="pqr-modal-field full">
                  <span>Mensaje completo</span>
                  <p>{selectedPqr.message}</p>
                </div>
                <div className="pqr-modal-field full">
                  <span>Respuesta</span>
                  <textarea
                    className="pqr-reply-box"
                    placeholder="Escribe aqui la respuesta para el residente..."
                    rows="6"
                  />
                </div>
              </div>
            </div>

            <div className="pqr-modal-footer">
              <button
                className="pqr-cancel-btn"
                onClick={() => setSelectedPqr(null)}
              >
                Cancelar
              </button>
              <button className="pqr-send-btn">Enviar respuesta</button>
            </div>
          </div>
        </div>
      )}
    </InternalLayout>
  );
}
