// Pantalla de mensajería del residente.
// Permite crear mensajes para administración y revisar el historial propio.
import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import MensajeriaDetailModal from "../../components/mensajeria/MensajeriaDetailModal";
import MensajeriaSectionTable from "../../components/mensajeria/MensajeriaSectionTable";
import useSession from "../../hooks/useSession";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";
import {
  createMensaje,
  getMensajeria,
  groupMessagesByType,
  MENSAJERIA_SECTION_TYPES,
  MENSAJERIA_SORT_OPTIONS_RESIDENT,
} from "../../services/modules/mensajeriaApi";
import "../../styles/shared/mensajeriaModule.css";

const initialForm = {
  type: "Queja",
  subject: "",
  message: "",
};

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

export default function ResidenteMensajeriaPage() {
  const session = useSession();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortValue, setSortValue] = useState(MENSAJERIA_SORT_OPTIONS_RESIDENT[0]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
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

  const residentMessages = useMemo(() => {
    if (!session?.uid) return [];
    return messages.filter((item) => item.residentId === session.uid);
  }, [messages, session]);

  const groupedMessages = useMemo(
    () => groupMessagesByType(residentMessages, sortValue),
    [residentMessages, sortValue]
  );

  const handleInputChange = (event) => { 
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!session?.uid) return;

    if (!form.subject.trim() || !form.message.trim()) {
      Swal.fire({
        title: "Campos incompletos",
        text: "Completa el asunto y el mensaje antes de enviar el registro.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    setSaving(true);

    try {
      await createMensaje({
        residentId: session.uid,
        residentName: session.nombre || "Residente",
        residentEmail: session.email || "",
        torre: session.torre || "",
        apartamento: session.apartamento || "",
        type: form.type,
        subject: form.subject,
        message: form.message,
      });

      setForm(initialForm);
      await loadMessages();

      Swal.fire({
        title: "Registro enviado",
        text: "Tu mensaje fue enviado correctamente a administración.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo guardar el mensaje.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <InternalLayoutResidente>
      <div className="content mensajeria-page">
        <header className="mensajeria-page-header mensajeria-page-header-simple">
          <div>
            <h1 className="internal-page-title">Mensajería del residente</h1>
            <p className="mensajeria-page-copy">
              Registra mensajes, solicitudes y autorizaciones para administración desde una sola
              vista y consulta el estado de cada envío, incluidas las respuestas o decisiones
              sobre tus autorizaciones.
            </p>
          </div>
        </header>

        <section className="mensajeria-form-card mensajeria-form-card-full">
          <span className="mensajeria-section-kicker">Nuevo registro</span>
          <h2>Enviar a administración</h2>
          <p>
            Selecciona el tipo de requerimiento, agrega un asunto claro y describe el detalle para
            que el equipo administrativo pueda revisarlo.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mensajeria-form-grid">
              <div className="mensajeria-form-field">
                <label>Tipo</label>
                <select name="type" value={form.type} onChange={handleInputChange}>
                  {MENSAJERIA_SECTION_TYPES.map((section) => (
                    <option key={section.value} value={section.value}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mensajeria-form-field">
                <label>Asunto</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleInputChange}
                  placeholder="Escribe un asunto breve"
                />
              </div>

              <div className="mensajeria-form-field full">
                <label>Mensaje</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleInputChange}
                  placeholder="Describe aquí el detalle del caso"
                />
              </div>
            </div>

            <div className="mensajeria-form-actions">
              <button type="submit" className="mensajeria-primary-btn" disabled={saving}>
                {saving ? "Enviando..." : "Enviar registro"}
              </button>
            </div>
          </form>
        </section>

        <section className="mensajeria-toolbar">
          <div className="mensajeria-toolbar-copy">
            <span>Mis registros</span>
            <strong>Consulta el historial de mensajería, solicitudes y autorizaciones</strong>
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
              {MENSAJERIA_SORT_OPTIONS_RESIDENT.map((option) => (
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
                  : `Aún no has enviado ${section.label.toLowerCase()}.`
              }
              mode="resident"
              onOpen={setSelectedMessage}
            />
          ))}
        </div>
      </div>

      <MensajeriaDetailModal
        item={selectedMessage}
        mode="resident"
        onClose={() => setSelectedMessage(null)}
      />
    </InternalLayoutResidente>
  );
}
