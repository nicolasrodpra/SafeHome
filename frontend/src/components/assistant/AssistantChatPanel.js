// Panel lateral del asistente virtual.
// Cambia su texto, sugerencias y comportamiento según el rol
// para guiar al usuario dentro de los módulos correctos.
import { useEffect, useMemo, useState } from "react";
import { askAssistant } from "../../services/modules/assistantApi";
import "../../styles/shared/assistantChat.css";

// Mensajes base del chat para cada tipo de usuario.
const CHAT_COPY_BY_ROLE = {
  Administrador: {
    badge: "Modo administrativo",
    title: "Asistente Virtual SafeHome",
    subtitle: "Guía rápida para usar mejor los módulos de administración.",
    welcome:
      "Hola. Puedo guiarte paso a paso para publicar comunicados, responder mensajes, revisar reservas y gestionar usuarios.",
    suggestions: [
      "¿Cómo publico un comunicado?",
      "¿Cómo respondo una solicitud?",
      "¿Cómo registro un usuario?",
      "¿Cómo reviso las reservas?",
      "¿Dónde veo a los residentes?",
      "¿Cómo entro al módulo de vigilancia?",
    ],
  },
  Residente: {
    badge: "Modo residente",
    title: "Asistente Virtual SafeHome",
    subtitle: "Ayuda práctica para realizar tareas dentro de tu panel.",
    welcome:
      "Hola. Puedo ayudarte paso a paso con reservas, solicitudes, comunicados y el uso general de tu panel.",
    suggestions: [
      "¿Cómo reservo la piscina?",
      "¿Cómo envío una solicitud?",
      "¿Dónde veo el manual de convivencia?",
      "¿Cómo reviso mis comunicados?",
      "¿Cómo actualizo mis datos?",
      "¿Dónde veo mis reservas?",
    ],
  },
  Vigilante: {
    badge: "Modo vigilancia",
    title: "Asistente Virtual SafeHome",
    subtitle: "Apoyo operativo para registrar y ubicar funciones del día.",
    welcome:
      "Hola. Puedo orientarte paso a paso para registrar visitantes, vehículos, correspondencia y revisar módulos de vigilancia.",
    suggestions: [
      "¿Cómo registro un visitante?",
      "¿Cómo registro un vehículo?",
      "¿Cómo registro correspondencia?",
      "¿Cómo edito un registro?",
      "¿Dónde veo el resumen del día?",
      "¿Cómo reviso los visitantes registrados?",
    ],
  },
  default: {
    badge: "Modo general",
    title: "Asistente Virtual SafeHome",
    subtitle: "Haz una pregunta para recibir ayuda dentro del sistema.",
    welcome:
      "Hola. Estoy listo para guiarte dentro del sistema según tu rol.",
    suggestions: [
      "¿Cómo funciona este asistente?",
      "¿En qué módulos me puedes ayudar?",
      "¿Cómo hago una tarea dentro del sistema?",
      "¿Cómo encuentro el módulo que necesito?",
      "¿Cómo usar mejor mi panel?",
    ],
  },
};

const buildInitialMessages = (copy) => [
  {
    id: "assistant-welcome",
    sender: "assistant",
    text: copy.welcome,
  },
];

const buildAssistantErrorMessage = (error) => {
  const rawMessage = String(error?.message || "").toLowerCase();

  if (
    rawMessage.includes("backend") ||
    rawMessage.includes("servidor") ||
    rawMessage.includes("ruta") ||
    rawMessage.includes("groq") ||
    rawMessage.includes("conectar") ||
    rawMessage.includes("ia")
  ) {
    return "No pude responder en este momento, pero puedes intentarlo de nuevo en unos segundos.";
  }

  return (
    error?.message || "No pude responder en este momento. Intenta de nuevo en unos segundos."
  );
};

export default function AssistantChatPanel({ isOpen, onClose, role, userName, session }) {
  const copy = CHAT_COPY_BY_ROLE[role] || CHAT_COPY_BY_ROLE.default;
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState(() => buildInitialMessages(copy));
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setMessages(buildInitialMessages(copy));
    setQuestion("");
    setSuggestionsOpen(false);
  }, [copy]);

  const greetingName = useMemo(() => {
    if (!userName) return "Usuario";
    return userName.split(" ")[0] || "Usuario";
  }, [userName]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isSending) {
      return;
    }

    const nextUserMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmedQuestion,
    };

    setMessages((currentMessages) => [...currentMessages, nextUserMessage]);
    setQuestion("");
    setSuggestionsOpen(false);

    try {
      setIsSending(true);

      const answer = await askAssistant({
        message: trimmedQuestion,
        session,
        history: messages.map((item) => ({
          role: item.sender === "assistant" ? "assistant" : "user",
          content: item.text,
        })),
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now() + 1}`,
          sender: "assistant",
          text: answer,
        },
      ]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-error-${Date.now() + 1}`,
          sender: "assistant",
          text: buildAssistantErrorMessage(error),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuestion(suggestion);
  };

  const handleQuestionKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const hasConversationStarted = messages.length > 1;

  return (
    <div className={`assistant-chat-shell${isOpen ? " is-open" : ""}`} aria-hidden={!isOpen}>
      <button
        type="button"
        className="assistant-chat-backdrop"
        onClick={onClose}
        aria-label="Cerrar asistente"
      />

      <aside className="assistant-chat-panel" aria-label="Panel del asistente virtual">
        <header className="assistant-chat-header">
          <div className="assistant-chat-header-topbar">
            <span className="assistant-chat-badge">{copy.badge}</span>
            <button
              type="button"
              className="assistant-chat-close"
              onClick={onClose}
              aria-label="Cerrar panel del asistente"
            >
              <i className="ph-light ph-x"></i>
            </button>
          </div>

          <div className="assistant-chat-header-copy">
            <h2>{copy.title}</h2>
            <p>
              {greetingName}, {copy.subtitle}
            </p>
          </div>
        </header>

        <section className="assistant-chat-suggestions-shell">
          <div className="assistant-chat-suggestions-toolbar">
            <button
              type="button"
              className="assistant-chat-suggestions-toggle"
              onClick={() => setSuggestionsOpen((current) => !current)}
              disabled={isSending}
            >
              <i className="ph-light ph-sparkle"></i>
              <span>Recomendaciones</span>
              <i
                className={`ph-light ${
                  suggestionsOpen ? "ph-caret-up" : "ph-caret-down"
                }`}
              ></i>
            </button>
          </div>

          {suggestionsOpen ? (
            <section
              className={`assistant-chat-suggestions${
                hasConversationStarted ? " is-floating" : ""
              }`}
            >
              <span>Pruebas rápidas</span>
              <div className="assistant-chat-suggestion-list">
                {copy.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="assistant-chat-suggestion"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isSending}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </section>

        <section className="assistant-chat-messages">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`assistant-chat-message is-${message.sender}`}
            >
              <span className="assistant-chat-message-label">
                {message.sender === "assistant" ? "Asistente" : "Tu"}
              </span>
              <p>{message.text}</p>
            </article>
          ))}

          {isSending ? (
            <article className="assistant-chat-message is-assistant is-loading">
              <span className="assistant-chat-message-label">Asistente</span>
              <p>Estoy pensando la mejor respuesta para ti...</p>
            </article>
          ) : null}
        </section>

        <form className="assistant-chat-form" onSubmit={handleSubmit}>
          <label htmlFor="assistant-question" className="assistant-chat-input-label">
            Escribe tu pregunta
          </label>

          <div className="assistant-chat-input-wrap">
            <textarea
              id="assistant-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleQuestionKeyDown}
              placeholder="Pregunta algo sobre el sistema..."
              rows={3}
              disabled={isSending}
            />

            <button type="submit" className="assistant-chat-submit" disabled={isSending}>
              {isSending ? "Pensando..." : "Enviar"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
