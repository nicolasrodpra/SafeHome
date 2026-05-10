// Bandeja administrativa de mensajería.
// Permite ver los mensajes agrupados por tipo
// y gestionar respuestas o decisiones desde un modal.
import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import MensajeriaDetailModal from "../../components/mensajeria/MensajeriaDetailModal";
import MensajeriaSectionTable from "../../components/mensajeria/MensajeriaSectionTable";
import useSession from "../../hooks/useSession";
import InternalLayout from "../../layouts/InternalLayout";
import {
  getMensajeria,
  groupMessagesByType,
  isPendingMessageStatus,
  manageMensaje,
  MENSAJERIA_SECTION_TYPES,
  MENSAJERIA_SORT_OPTIONS_ADMIN,
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

const ACTION_COPY = {
  aceptar: {
    successTitle: "Autorización aceptada",
    successText: "La autorización fue aceptada correctamente.",
  },
  rechazar: {
    successTitle: "Autorización rechazada",
    successText: "La autorización fue rechazada correctamente.",
  },
  responder: {
    successTitle: "Respuesta enviada",
    successText: "La gestión fue guardada correctamente.",
  },
};

export default function AdminMensajeriaPage() {
  const session = useSession();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortValue, setSortValue] = useState(MENSAJERIA_SORT_OPTIONS_ADMIN[0]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
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

  const groupedMessages = useMemo(
    () => groupMessagesByType(messages, sortValue),
    [messages, sortValue]
  );
  const pendingCount = messages.filter((item) => isPendingMessageStatus(item.status)).length;

  const handleOpenMessage = (item) => {
    setSelectedMessage(item);
    setReplyText(item.response || "");
  };

  const handleCloseMessage = () => {
    setSelectedMessage(null);
    setReplyText("");
  };

  const handleSubmitAction = async (action) => {
    if (!selectedMessage) {
      return;
    }

    if (action === "responder" && !replyText.trim()) {
      Swal.fire({
        title: "Respuesta vacía",
        text: "Escribe una respuesta antes de guardar.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    setSubmittingAction(true);

    try {
      await manageMensaje(selectedMessage.id, {
        action,
        response: replyText,
        respondedById: session?.uid || "",
        respondedByName: session?.nombre || "Administración",
      });

      await loadMessages();

      Swal.fire({
        title: ACTION_COPY[action]?.successTitle || "Gestión completada",
        text: ACTION_COPY[action]?.successText || "El mensaje fue actualizado correctamente.",
        icon: "success",
        confirmButtonColor: "#460669",
      });

      handleCloseMessage();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo gestionar el mensaje.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <InternalLayout>
      <div className="content mensajeria-page">
        <header className="mensajeria-page-header">
          <div>
            <h1 className="internal-page-title">Mensajería recibida</h1>
            <p className="mensajeria-page-copy">
              Revisa quejas, solicitudes y autorizaciones desde una sola bandeja. Desde aquí
              puedes responder mensajes y decidir autorizaciones para que el estado se actualice
              también del lado del residente.
            </p>
          </div>

          <div className="mensajeria-summary-grid mensajeria-summary-grid-single">
            <article className="mensajeria-summary-card">
              <span>Pendientes</span>
              <strong>{pendingCount}</strong>
              <p>Casos que aún necesitan una gestión administrativa.</p>
            </article>
          </div>
        </header>

        <section className="mensajeria-toolbar">
          <div className="mensajeria-toolbar-copy">
            <span>Mensajería administrativa</span>
            <strong>Organiza los registros por tipo y resuélvelos desde el detalle</strong>
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
        onSubmitAction={handleSubmitAction}
        submittingAction={submittingAction}
      />
    </InternalLayout>
  );
}
