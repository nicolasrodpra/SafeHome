import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import MensajeriaDetailModal from "../../components/mensajeria/MensajeriaDetailModal";
import MensajeriaSectionTable from "../../components/mensajeria/MensajeriaSectionTable";
import useSession from "../../hooks/useSession";
import InternalLayout from "../../layouts/InternalLayout";
import {
  getMensajeria,
  groupMessagesByType,
  MENSAJERIA_SECTION_TYPES,
  MENSAJERIA_SORT_OPTIONS_ADMIN,
  respondToMensaje,
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

export default function AdminMensajeriaPage() {
  const session = useSession();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortValue, setSortValue] = useState(MENSAJERIA_SORT_OPTIONS_ADMIN[0]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    loadMessages();
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

  const groupedMessages = useMemo(
    () => groupMessagesByType(messages, sortValue),
    [messages, sortValue]
  );
  const pendingCount = messages.filter((item) => item.status === "Pendiente").length;

  const handleOpenMessage = (item) => {
    setSelectedMessage(item);
    setReplyText(item.response || "");
  };

  const handleCloseMessage = () => {
    setSelectedMessage(null);
    setReplyText("");
  };

  const handleSubmitReply = async () => {
    if (!selectedMessage) return;

    if (!replyText.trim()) {
      Swal.fire({
        title: "Respuesta vacía",
        text: "Escribe una respuesta antes de guardar.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    setSubmittingReply(true);

    try {
      await respondToMensaje(selectedMessage.id, {
        response: replyText,
        respondedById: session?.uid || "",
        respondedByName: session?.nombre || "Administración",
      });

      await loadMessages();

      Swal.fire({
        title: "Respuesta enviada",
        text: "La respuesta fue guardada correctamente.",
        icon: "success",
        confirmButtonColor: "#460669",
      });

      handleCloseMessage();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo guardar la respuesta.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <InternalLayout>
      <div className="content mensajeria-page">
        <header className="mensajeria-page-header">
          <div>
            <h1 className="internal-page-title">Mensajería recibida</h1>
            <p className="mensajeria-page-copy">
              Revisa los mensajes enviados por los residentes, responde la mensajería y las
              solicitudes desde una sola bandeja y conserva las autorizaciones como registro
              administrativo.
            </p>
          </div>

          <div className="mensajeria-summary-grid mensajeria-summary-grid-single">
            <article className="mensajeria-summary-card">
              <span>Pendientes</span>
              <strong>{pendingCount}</strong>
              <p>Casos que aún necesitan revisión o respuesta.</p>
            </article>
          </div>
        </header>

        <section className="mensajeria-toolbar">
          <div className="mensajeria-toolbar-copy">
            <span>Mensajería administrativa</span>
            <strong>Organiza los registros por tipo y responde desde el detalle</strong>
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
          {MENSAJERIA_SECTION_TYPES.map((section) => (
            <MensajeriaSectionTable
              key={section.value}
              title={section.label}
              description={section.description}
              items={groupedMessages[section.value] || []}
              emptyMessage={
                loading
                  ? "Cargando registros..."
                  : `No hay ${section.label.toLowerCase()} registradas en este momento.`
              }
              mode="admin"
              onOpen={handleOpenMessage}
            />
          ))}
        </div>
      </div>

      <MensajeriaDetailModal
        item={selectedMessage}
        mode="admin"
        replyText={replyText}
        onReplyChange={setReplyText}
        onClose={handleCloseMessage}
        onSubmitReply={handleSubmitReply}
        submittingReply={submittingReply}
      />
    </InternalLayout>
  );
}
