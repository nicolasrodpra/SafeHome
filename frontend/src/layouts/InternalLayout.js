// Layout interno compartido por administración y vigilancia.
// Centraliza la navegación, el topbar y los contadores de pendientes.
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AssistantChatPanel from "../components/assistant/AssistantChatPanel";
import asistenteVirtual from "../assets/asistenteVirtual.png";
import safehomeLogo from "../assets/safehomeLogo.png";
import useSession from "../hooks/useSession";
import { cerrarSesion } from "../services/authService";
import { getMensajeria, getMessageTypeLabel } from "../services/modules/mensajeriaApi";
import { getUserProfile } from "../services/modules/userApi";
import { updateSessionProfile } from "../services/sessionService";
import { getFechaActual } from "../utils/getDate";
import { getUserInitials } from "../utils/userDisplay";
import "../styles/shared/internalLayout.css";

// Navegación lateral por rol.
const ADMIN_VIGILANCIA_ITEMS = [
  { icon: "ph-car", label: "Vehiculos", to: "/adminVigilanciaVehiculos" },
  {
    icon: "ph-package",
    label: "Correspondencia",
    to: "/adminVigilanciaCorrespondencia",
  },
  { icon: "ph-users-three", label: "Visitantes", to: "/adminVigilanciaVisitantes" },
];

const ADMIN_NAV_ITEMS = [
  { icon: "ph-megaphone", label: "Mensajeria", to: "/adminMensajeria" },
  { icon: "ph-calendar-blank", label: "Reservas", to: "/adminReservas" },
  { icon: "ph-bell", label: "Comunicados", to: "/adminComunicados" },
  { icon: "ph-security-camera", label: "Vigilancia", children: ADMIN_VIGILANCIA_ITEMS },
  { icon: "ph-user", label: "Residentes", to: "/adminResidentes" },
  { icon: "ph-book-bookmark", label: "Manual de convivencia", to: "/adminManualConvivencia" },
  { icon: "ph-pencil-simple", label: "Actualizar datos", to: "/perfil" },
  { icon: "ph-user-plus", label: "Registrar usuario", to: "/registroUsuario" },
];

const VIGILANTE_NAV_ITEMS = [
  { icon: "ph-car", label: "Registro de vehiculos", to: "/registroVehiculos" },
  { icon: "ph-package", label: "Registro de correspondencia", to: "/registroCorrespondencia" },
  { icon: "ph-users-three", label: "Registro de visitantes", to: "/registroVisitantes" },
  { icon: "ph-megaphone", label: "Quejas", to: "/vigilanteQuejas" },
  { icon: "ph-bell", label: "Comunicados", to: "/vigilanteComunicados" },
];

// Helpers del topbar y del estado visual.
const getSessionIdentity = (session) => ({
  name: session?.nombre || "Usuario",
  role: session?.rol || null,
});

const getAuthorizationStorageKey = (uid) => `safehome_admin_seen_authorizations_${uid}`;

const getLatestTimestamp = (items) =>
  items.reduce((maxTimestamp, item) => {
    const createdAt = new Date(item.createdAtIso || 0).getTime() || 0;
    return Math.max(maxTimestamp, createdAt);
  }, 0);

const buildPendingInboxSummary = ({ messages, role, storageKey }) => {
  if (role === "Vigilante") {
    return {
      baseCount: messages.filter(
        (item) => getMessageTypeLabel(item.type) === "Queja" && item.status === "Pendiente"
      ).length,
      extraCount: 0,
    };
  }

  const pendingCases = messages.filter((item) => {
    const typeLabel = getMessageTypeLabel(item.type);
    return typeLabel !== "Autorización" && item.status === "Pendiente";
  });
  const authorizationMessages = messages.filter(
    (item) => getMessageTypeLabel(item.type) === "Autorización"
  );

  if (window.localStorage.getItem(storageKey) === null) {
    window.localStorage.setItem(storageKey, String(getLatestTimestamp(authorizationMessages)));
  }

  const seenAt = Number(window.localStorage.getItem(storageKey) || "0");
  const unseenAuthorizations = authorizationMessages.filter((item) => {
    const createdAt = new Date(item.createdAtIso || 0).getTime() || 0;
    return createdAt > seenAt;
  });

  return {
    baseCount: pendingCases.length,
    extraCount: unseenAuthorizations.length,
  };
};

// Item reutilizable del menú lateral.
function SidebarItem({ item, pathname }) {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [flyoutStyle, setFlyoutStyle] = useState({});
  const groupRef = useRef(null);

  useEffect(() => {
    setSubmenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!submenuOpen) {
      return undefined;
    }

    const syncFlyoutPosition = () => {
      if (!groupRef.current || window.innerWidth <= 720) {
        setFlyoutStyle({});
        return;
      }

      const rect = groupRef.current.getBoundingClientRect();
      const flyoutWidth = 220;
      const viewportPadding = 16;
      const preferredLeft = rect.right + 8;
      const left = Math.min(
        Math.max(preferredLeft, viewportPadding),
        window.innerWidth - flyoutWidth - viewportPadding
      );
      const top = Math.max(rect.top - 6, viewportPadding);

      setFlyoutStyle({
        left: `${left}px`,
        top: `${top}px`,
      });
    };

    syncFlyoutPosition();
    window.addEventListener("resize", syncFlyoutPosition);
    window.addEventListener("scroll", syncFlyoutPosition, true);

    return () => {
      window.removeEventListener("resize", syncFlyoutPosition);
      window.removeEventListener("scroll", syncFlyoutPosition, true);
    };
  }, [submenuOpen]);

  if (item.children?.length) {
    const isActive = item.children.some((child) => pathname === child.to);

    return (
      <div
        ref={groupRef}
        className={`internal-nav-group ${submenuOpen ? "open" : ""} ${isActive ? "active" : ""}`}
        onMouseEnter={() => setSubmenuOpen(true)}
        onMouseLeave={() => setSubmenuOpen(false)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setSubmenuOpen(false);
          }
        }}
      >
        <button
          type="button"
          className={`internal-nav-link internal-nav-button internal-nav-parent ${
            isActive ? "active" : ""
          }`}
          onClick={() => setSubmenuOpen((current) => !current)}
          onFocus={() => setSubmenuOpen(true)}
          aria-haspopup="menu"
          aria-expanded={submenuOpen}
        >
          <span className="internal-nav-link-copy">
            <i className={`ph-light ${item.icon}`} aria-hidden="true"></i>
            <span>{item.label}</span>
          </span>
          <i className="ph-light ph-caret-right internal-nav-parent-caret" aria-hidden="true"></i>
        </button>

        <div
          className="internal-nav-flyout"
          role="menu"
          aria-label={item.label}
          style={flyoutStyle}
        >
          {item.children.map((child) => {
            const childIsActive = pathname === child.to;

            return (
              <Link
                key={child.to}
                to={child.to}
                className={`internal-nav-flyout-link ${childIsActive ? "active" : ""}`}
                onClick={() => setSubmenuOpen(false)}
              >
                <i className={`ph-light ${child.icon}`} aria-hidden="true"></i>
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  if (!item.to) {
    return null;
  }

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

export default function InternalLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const session = useSession();
  const sessionIdentity = getSessionIdentity(session);

  const [profileName, setProfileName] = useState(sessionIdentity.name);
  const [profileRole, setProfileRole] = useState(sessionIdentity.role);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [pendingBaseCount, setPendingBaseCount] = useState(0);
  const [pendingExtraCount, setPendingExtraCount] = useState(0);

  const userMenuRef = useRef(null);
  const fechaActual = getFechaActual();
  const isVigilante = profileRole === "Vigilante";
  const inboxRoute = isVigilante ? "/vigilanteQuejas" : "/adminMensajeria";
  const inboxLabel = isVigilante ? "Ir a quejas" : "Ir a mensajeria";
  const pendingInboxCount = pendingBaseCount + pendingExtraCount;
  const navItems = isVigilante ? VIGILANTE_NAV_ITEMS : ADMIN_NAV_ITEMS;
  const homeRoute = isVigilante ? "/vigilanteMenu" : "/adminMenu";
  const userInitials = getUserInitials(profileName);

  // Perfil visible en el encabezado.
  useEffect(() => {
    let active = true;

    const applySessionIdentity = () => {
      if (active) {
        setProfileName(sessionIdentity.name);
        setProfileRole(sessionIdentity.role);
      }
    };

    const loadProfile = async () => {
      if (!session?.uid) {
        applySessionIdentity();
        return;
      }

      applySessionIdentity();

      try {
        const profile = await getUserProfile(session.uid);

        if (!active) {
          return;
        }

        setProfileName(profile.nombre || sessionIdentity.name);
        setProfileRole(profile.rol || sessionIdentity.role);
        updateSessionProfile(profile);
      } catch (error) {
        applySessionIdentity();
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [session, sessionIdentity.name, sessionIdentity.role]);

  // Contador de pendientes del icono de correo.
  useEffect(() => {
    if (!session?.uid || (profileRole !== "Administrador" && profileRole !== "Vigilante")) {
      setPendingBaseCount(0);
      setPendingExtraCount(0);
      return undefined;
    }

    const storageKey = getAuthorizationStorageKey(session.uid);
    let cancelled = false;

    const syncInbox = async () => {
      try {
        const messages = await getMensajeria();
        if (cancelled) {
          return;
        }

        const summary = buildPendingInboxSummary({
          messages,
          role: profileRole,
          storageKey,
        });

        setPendingBaseCount(summary.baseCount);
        setPendingExtraCount(summary.extraCount);
      } catch (error) {
        if (!cancelled) {
          setPendingBaseCount(0);
          setPendingExtraCount(0);
        }
      }
    };

    syncInbox();
    const intervalId = window.setInterval(syncInbox, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [profileRole, session?.uid]);

  // Al entrar a mensajería administrativa, las autorizaciones pasan a considerarse vistas.
  useEffect(() => {
    if (profileRole !== "Administrador" || pathname !== "/adminMensajeria" || !session?.uid) {
      return;
    }

    window.localStorage.setItem(getAuthorizationStorageKey(session.uid), String(Date.now()));
    setPendingExtraCount(0);
  }, [pathname, profileRole, session?.uid]);

  // Cierra el menú de usuario al hacer clic fuera.
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

  return (
    <div className="internal-shell">
      <aside className="internal-sidebar">
        <Link to={homeRoute} className="internal-sidebar-logo">
          <img src={safehomeLogo} alt="SafeHome" className="internal-sidebar-logo-image" />
        </Link>

        <ul className="internal-nav-menu">
          {navItems.map((item) => (
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
            <button
              type="button"
              className={`internal-topbar-action${pendingInboxCount > 0 ? " has-pending" : ""}`}
              onClick={() => navigate(inboxRoute)}
              aria-label={inboxLabel}
              title={inboxLabel}
            >
              <i className="ph-light ph-envelope-simple internal-topbar-icon" aria-hidden="true"></i>
              {pendingInboxCount > 0 ? (
                <span className="internal-topbar-alert-badge">{pendingInboxCount}</span>
              ) : null}
            </button>

            <button
              type="button"
              className="internal-icon-button"
              onClick={() => cerrarSesion(navigate)}
              aria-label="Cerrar sesion"
              title="Cerrar sesion"
            >
              <i className="ph-light ph-sign-out internal-topbar-icon" aria-hidden="true"></i>
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

              {userMenuOpen ? (
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
                    <span>Cerrar sesion</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {typeof children === "function" ? children({ profileName, profileRole }) : children}
        <AssistantChatPanel
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          role={profileRole}
          userName={profileName}
          session={session}
        />
      </div>
    </div>
  );
}
