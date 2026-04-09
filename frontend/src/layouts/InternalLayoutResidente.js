// Layout interno exclusivo del residente.
// Reutiliza la misma idea del panel general, pero con un menú
// y accesos ajustados a las acciones permitidas para este rol.
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AssistantChatPanel from "../components/assistant/AssistantChatPanel";
import ResidentNotificationsModal from "../components/residente/ResidentNotificationsModal";
import asistenteVirtual from "../assets/asistenteVirtual.png";
import useSession from "../hooks/useSession";
import { cerrarSesion } from "../services/authService";
import {
  getNotificacionesResidente,
  marcarNotificacionesResidenteComoVistas,
} from "../services/modules/notificacionesResidenteApi";
import { getUserProfile } from "../services/modules/userApi";
import { updateSessionProfile } from "../services/sessionService";
import { getFechaActual } from "../utils/getDate";
import "../styles/shared/InternalLayoutResidente.css";

// Opciones principales del residente dentro de su panel.
const RESIDENTE_NAV_ITEMS = [
  { icon: "ph-megaphone", label: "Mensajería", to: "/residenteMensajeria" },
  { icon: "ph-calendar-blank", label: "Reservas", to: "/residentesReservas" },
  { icon: "ph-bell", label: "Comunicados", to: "/residenteComunicados" },
  { icon: "ph-book-bookmark", label: "Manual de convivencia", to: "/residenteManualConvivencia" },
  { icon: "ph-pencil-simple", label: "Actualizar datos", to: "/perfil" },
];

// En residente tenemos dos tipos de opción: una que navega
// y otra que todavía queda como marcador visual deshabilitado.
function SidebarItem({ item, pathname }) {
  if (item.to) {
    const isActive = pathname === item.to;

    return (
      <Link to={item.to} className={isActive ? "internal-nav-link active" : "internal-nav-link"}>
        <span className="internal-nav-link-copy">
          <i className={`ph-light ${item.icon}`} aria-hidden="true"></i>
          <span>{item.label}</span>
        </span>
      </Link>
    );
  }

  return (
    <button type="button" className="internal-nav-link internal-nav-placeholder" disabled>
      <span className="internal-nav-link-copy">
        <i className={`ph-light ${item.icon}`} aria-hidden="true"></i>
        <span>{item.label}</span>
      </span>
    </button>
  );
}

export default function InternalLayoutResidente({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const session = useSession();
  const [profileName, setProfileName] = useState(session?.nombre || "Usuario");
  const [profileRole, setProfileRole] = useState(session?.rol || "Residente");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [residentNotifications, setResidentNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const userMenuRef = useRef(null);
  const fechaActual = getFechaActual();

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!session?.uid) {
        if (active) {
          setProfileName("Usuario");
          setProfileRole("Residente");
        }
        return;
      }

      if (active) {
        setProfileName(session.nombre || "Usuario");
        setProfileRole(session.rol || "Residente");
      }

      try {
        const profile = await getUserProfile(session.uid);

        if (active) {
          setProfileName(profile.nombre || "Usuario");
          setProfileRole(profile.rol || "Residente");
        }

        updateSessionProfile(profile);
      } catch (error) {
        if (active) {
          setProfileName(session.nombre || "Usuario");
          setProfileRole(session.rol || "Residente");
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async (keepLoading = false) => {
      if (!session?.uid) {
        if (!cancelled) {
          setResidentNotifications([]);
          setUnreadNotificationsCount(0);
          setNotificationsLoading(false);
        }
        return;
      }

      if (!keepLoading && !cancelled) {
        setNotificationsLoading(true);
      }

      try {
        const nextNotifications = await getNotificacionesResidente(session.uid);
        if (cancelled) return;

        setResidentNotifications(nextNotifications);
        setUnreadNotificationsCount(nextNotifications.filter((item) => !item.read).length);
      } catch (error) {
        if (!cancelled) {
          setResidentNotifications([]);
          setUnreadNotificationsCount(0);
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    };

    loadNotifications();
    const intervalId = window.setInterval(() => {
      loadNotifications(true);
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [session?.uid]);

  useEffect(() => {
    if (!notificationsOpen || !session?.uid || unreadNotificationsCount === 0) {
      return undefined;
    }

    let active = true;

    const markAsSeen = async () => {
      try {
        await marcarNotificacionesResidenteComoVistas(session.uid);
        if (!active) return;

        setResidentNotifications((current) => current.map((item) => ({ ...item, read: true })));
        setUnreadNotificationsCount(0);
      } catch (error) {
        return;
      }
    };

    markAsSeen();

    return () => {
      active = false;
    };
  }, [notificationsOpen, session?.uid, unreadNotificationsCount]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const userInitials =
    profileName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="internal-shell">
      <aside className="internal-sidebar">
        <Link to="/residenteMenu" className="internal-sidebar-logo">
          SafeHome
        </Link>

        <ul className="internal-nav-menu">
          {RESIDENTE_NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <SidebarItem item={item} pathname={pathname} />
            </li>
          ))}
        </ul>

        <div className="internal-sidebar-assistant">
          <img src={asistenteVirtual} alt="Asistente virtual" />
          <div className="internal-sidebar-assistant-copy">
            <h3>Asistente virtual</h3>
          </div>
          <button
            type="button"
            className="internal-assistant-button"
            onClick={() => setIsAssistantOpen(true)}
          >
            <i className="ph-light ph-chat-circle-dots" aria-hidden="true"></i>
            Iniciar
          </button>
        </div>
      </aside>

      <div className="internal-main">
        <div className="internal-topbar">
          <div className="internal-topbar-left">
            <h2>Abundara</h2>
            <span>{fechaActual}</span>
          </div>

          <div className="internal-topbar-right">
            <i className="ph-light ph-envelope-simple internal-topbar-icon" aria-hidden="true"></i>
            <button
              type="button"
              className="internal-topbar-alert"
              onClick={() => setNotificationsOpen(true)}
              aria-label="Ver notificaciones"
              title="Ver notificaciones"
            >
              <i className="ph-light ph-bell internal-topbar-icon" aria-hidden="true"></i>
              {unreadNotificationsCount > 0 && (
                <span className="internal-topbar-alert-badge">{unreadNotificationsCount}</span>
              )}
            </button>
            <button
              type="button"
              className="internal-icon-button"
              onClick={() => cerrarSesion(navigate)}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <i className="ph-light ph-sign-out internal-topbar-icon"></i>
            </button>

            <div className="internal-user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="internal-user-pill"
                onClick={() => setUserMenuOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <div className="internal-user-avatar">{userInitials}</div>
                <span className="internal-user-name">{profileName}</span>
                <i className="ph-light ph-caret-down internal-user-caret"></i>
              </button>

              {userMenuOpen && (
                <div className="internal-user-dropdown" role="menu">
                  <button
                    type="button"
                    className="internal-user-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/perfil");
                    }}
                  >
                    <i className="ph-light ph-user-circle"></i>
                    <span>Ver perfil</span>
                  </button>
                  <button
                    type="button"
                    className="internal-user-dropdown-item"
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await cerrarSesion(navigate);
                    }}
                  >
                    <i className="ph-light ph-sign-out"></i>
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {typeof children === "function"
          ? children({ profileName, profileRole })
          : children}
        <AssistantChatPanel
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          role={profileRole}
          userName={profileName}
          session={session}
        />
        <ResidentNotificationsModal
          isOpen={notificationsOpen}
          notifications={residentNotifications}
          loading={notificationsLoading}
          onClose={() => setNotificationsOpen(false)}
        />
      </div>
    </div>
  );
}
