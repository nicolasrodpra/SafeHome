// Bandeja administrativa de mensajeria.
// Permite ver los mensajes agrupados por tipo y responderlos desde un modal.
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

// Componente de icono de flecha hacia abajo
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
  // Lista de mensajes de mensajería
  const [messages, setMessages] = useState([]);
  // Indica si se están cargando los mensajes
  const [loading, setLoading] = useState(true);
  // Estado del dropdown de ordenamiento
  const [sortOpen, setSortOpen] = useState(false);
  // Valor actual de ordenamiento
  const [sortValue, setSortValue] = useState(MENSAJERIA_SORT_OPTIONS_ADMIN[0]);
  // Mensaje seleccionado para ver detalles
  const [selectedMessage, setSelectedMessage] = useState(null);
  // Texto de la respuesta
  const [replyText, setReplyText] = useState("");
  // Indica si se está enviando la respuesta
  const [submittingReply, setSubmittingReply] = useState(false);
  // Referencia al dropdown para detectar clics fuera
  const dropdownRef = useRef(null);

  // Carga los mensajes desde el servidor
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

  // Carga los mensajes 
  useEffect(() => {
    loadMessages();
  }, []);

  // Maneja clics fuera del dropdown para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { // Si el clic es fuera del dropdown, cerramos el menú
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside); // Listener para detectar clics en cualquier parte del documento

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Agrupa los mensajes por tipo 
  const groupedMessages = useMemo( // useMemo para memorizar el resultado de agrupar los mensajes por tipo y ordenarlos según el valor seleccionado, evitando cálculos innecesarios en cada renderizado.
    () => groupMessagesByType(messages, sortValue), 
    [messages, sortValue] 
  );
  // Cuenta los mensajes pendientes
  const pendingCount = messages.filter((item) => item.status === "Pendiente").length;

  // Abre el modal con el mensaje seleccionado
  const handleOpenMessage = (item) => {
    setSelectedMessage(item);
    setReplyText(item.response || ""); // Si el mensaje ya tiene una respuesta, la cargamos en el estado para mostrarla en el modal, de lo contrario dejamos el campo vacío para escribir una nueva respuesta.
  };

  // Cierra el modal y limpia el estado
  const handleCloseMessage = () => {  // Al cerrar el modal, limpiamos el mensaje seleccionado y el texto de respuesta para que no quede información anterior si se abre otro mensaje.
    setSelectedMessage(null); 
    setReplyText(""); 
  };

  // Envía la respuesta al mensaje seleccionado
  const handleSubmitReply = async () => { 
    if (!selectedMessage) return; // Si no hay mensaje seleccionado, no hacemos nada

    if (!replyText.trim()) { // trim para validar que el texto de respuesta no esté vacío o solo con espacios, ya que queremos evitar enviar respuestas vacías al mensaje.
      Swal.fire({
        title: "Respuesta vacía",
        text: "Escribe una respuesta antes de guardar.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return; 
    }

    setSubmittingReply(true); // Indicamos que se está enviando la respuesta para mostrar un indicador de carga en el botón del modal y evitar múltiples envíos.

    try {
      await respondToMensaje(selectedMessage.id, { 
        response: replyText, //
        respondedById: session?.uid || "",
        respondedByName: session?.nombre || "Administración",
      });

      await loadMessages(); // Recargamos los mensajes para actualizar el estado de la mensajería después de enviar la respuesta, mostrando así el cambio en la lista y el detalle del mensaje.

      Swal.fire({
        title: "Respuesta enviada",
        text: "La respuesta fue guardada correctamente.",
        icon: "success",
        confirmButtonColor: "#460669",
      });

      handleCloseMessage(); // Cerramos el modal después de enviar la respuesta para volver a la lista de mensajes.
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

          {/* Dropdown para ordenar mensajes */}
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

        {/* Grid de secciones de mensajería */}
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

      {/* Modal para ver detalles y responder */}
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
