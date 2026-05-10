import { useEffect, useMemo, useRef, useState } from "react";
import MensajeriaDetailModal from "../../components/mensajeria/MensajeriaDetailModal";
import MensajeriaSectionTable from "../../components/mensajeria/MensajeriaSectionTable";
import InternalLayout from "../../layouts/InternalLayout";
import {
  getMensajeria,
  getMessageTypeLabel,
  MENSAJERIA_SORT_OPTIONS_ADMIN,
  MENSAJERIA_SECTION_TYPES,
  sortMessages,
} from "../../services/modules/mensajeriaApi";
import "../../styles/shared/mensajeriaModule.css";

const ChevronDown = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const QUEJAS_SECTION = MENSAJERIA_SECTION_TYPES.find((section) => section.value === "Queja");

export default function VigilanteQuejasPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortValue, setSortValue] = useState(MENSAJERIA_SORT_OPTIONS_ADMIN[0]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const nextMessages = await getMensajeria();
        setMessages(nextMessages);
      } catch (error) {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
    const intervalId = window.setInterval(loadMessages, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const quejas = useMemo(
    () =>
      sortMessages(
        messages.filter((item) => getMessageTypeLabel(item.type) === "Queja"),
        sortValue
      ),
    [messages, sortValue]
  );

  const pendingCount = quejas.filter((item) => item.status === "Pendiente").length;

  return (
    <InternalLayout>
      <div className="content mensajeria-page">
        <header className="mensajeria-page-header">
          <div>
            <h1 className="internal-page-title">Quejas recibidas</h1>
            <p className="mensajeria-page-copy">
              Consulta las quejas reportadas por los residentes desde una sola bandeja. Esta vista
              es solo informativa para vigilancia y no permite responder ni gestionar otros tipos
              de PQRS.
            </p>
          </div>

          <div className="mensajeria-summary-grid mensajeria-summary-grid-single">
            <article className="mensajeria-summary-card">
              <span>Pendientes</span>
              <strong>{pendingCount}</strong>
              <p>Quejas que aún no registran una respuesta de administración.</p>
            </article>
          </div>
        </header>

        <section className="mensajeria-toolbar">
          <div className="mensajeria-toolbar-copy">
            <span>Quejas para vigilancia</span>
            <strong>Revisa el detalle de cada caso sin editar la información</strong>
          </div>

          <div className="mensajeria-sort-block" ref={dropdownRef}>
            <span className="mensajeria-sort-label">Ordenar por:</span>
            <button
              type="button"
              className="mensajeria-sort-trigger"
              onClick={() => setSortOpen((current) => !current)}
            >
              <span>{sortValue}</span>
              <ChevronDown />
            </button>

            <div className={`mensajeria-sort-dropdown${sortOpen ? " open" : ""}`}>
              {MENSAJERIA_SORT_OPTIONS_ADMIN.map((option) => (
                <div
                  key={option}
                  className={`mensajeria-sort-dropdown-item${sortValue === option ? " active" : ""}`}
                  onClick={() => {
                    setSortValue(option);
                    setSortOpen(false);
                  }}
                >
                  <span className="mensajeria-sort-dot"></span>
                  {option}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mensajeria-sections-grid">
          <MensajeriaSectionTable
            title={QUEJAS_SECTION?.label || "Quejas"}
            description={
              QUEJAS_SECTION?.description ||
              "Mensajes de convivencia o situaciones que requieren seguimiento."
            }
            items={quejas}
            emptyMessage={
              loading ? "Cargando registros..." : "No hay quejas registradas en este momento."
            }
            mode="viewer"
            onOpen={setSelectedMessage}
          />
        </div>
      </div>

      <MensajeriaDetailModal
        item={selectedMessage}
        mode="viewer"
        replyText=""
        onReplyChange={() => {}}
        onClose={() => setSelectedMessage(null)}
        onSubmitReply={() => {}}
        submittingReply={false}
      />
    </InternalLayout>
  );
}
