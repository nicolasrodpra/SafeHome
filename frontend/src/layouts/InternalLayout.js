// Layout interno compartido por administrador y vigilante.
// Este archivo arma la estructura comun del panel: sidebar, topbar,
// menÃº de usuario y acceso al asistente virtual.
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AssistantChatPanel from "../components/assistant/AssistantChatPanel";
import asistenteVirtual from "../assets/asistenteVirtual.png";
import useSession from "../hooks/useSession";
import { cerrarSesion } from "../services/authService";
import { getMensajeria, getMessageTypeLabel } from "../services/modules/mensajeriaApi";
import { getUserProfile } from "../services/modules/userApi";
import { getAlertasPanico } from "../services/modules/vigilanciaApi";
import { updateSessionProfile } from "../services/sessionService";
import { getFechaActual } from "../utils/getDate";
import "../styles/shared/internalLayout.css";

// Submenu de vigilancia que usa el administrador para consultar
// los registros operativos en modo solo lectura.
const ADMIN_VIGILANCIA_ITEMS = [
  { icon: "ph-car", label: "Vehiculos", to: "/adminVigilanciaVehiculos" },
  {
    icon: "ph-package",
    label: "Correspondencia",
    to: "/adminVigilanciaCorrespondencia",
  },
  { icon: "ph-users-three", label: "Visitantes", to: "/adminVigilanciaVisitantes" },
];

// Opciones principales del administrador dentro del panel.
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

// Opciones principales del vigilante dentro del panel.
const VIGILANTE_NAV_ITEMS = [
  { icon: "ph-car", label: "Registro de vehiculos", to: "/registroVehiculos" },
  { icon: "ph-package", label: "Registro de correspondencia", to: "/registroCorrespondencia" },
  { icon: "ph-users-three", label: "Registro de visitantes", to: "/registroVisitantes" },
  { icon: "ph-siren", label: "Boton de panico", to: "/vigilantePanico" },
  { icon: "ph-megaphone", label: "Quejas", to: "/vigilanteQuejas", notificationKey: "quejas" },
  { icon: "ph-bell", label: "Comunicados", to: "/vigilanteComunicados" },
];

const formatPanicLocation = (alerta) => {
  const torre = alerta.torre ? `Torre ${alerta.torre}` : "";
  const apartamento = alerta.apartamento ? `Apto ${alerta.apartamento}` : "";
  const bloque = alerta.bloque ? `Bloque ${alerta.bloque}` : "";
  const piso = alerta.piso ? `Piso ${alerta.piso}` : "";

  return [torre, apartamento, bloque, piso].filter(Boolean).join(" · ") || "Ubicacion no registrada";
};

const getPanicContact = (alerta) => {
  const phone = alerta.telefono || alerta.celular || alerta?.userSnapshot?.telefono || alerta?.userSnapshot?.celular;
  const email = alerta.residentEmail || alerta?.userSnapshot?.email;
  return [email, phone].filter(Boolean).join(" · ") || "Sin contacto";
};

const buildPanicModalHtml = (alertas) =>
  `
    <div style="text-align:left;max-height:320px;overflow:auto;">
      ${alertas
        .map(
          (alerta) => `
            <div style="border:1px solid rgba(176,21,44,.25);border-radius:10px;padding:10px;margin-bottom:10px;background:#fff6f7;">
              <div style="font-weight:700;color:#9a1527;margin-bottom:4px;">${alerta.residentName || "Residente"}</div>
              <div style="font-size:13px;color:#452a31;margin-bottom:2px;">${formatPanicLocation(alerta)}</div>
              <div style="font-size:12px;color:#6b565b;margin-bottom:2px;">${getPanicContact(alerta)}</div>
              <div style="font-size:12px;color:#6b565b;">${alerta.createdDateLabel} · ${alerta.createdTimeLabel}</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;

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

  return null;
}

export default function InternalLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const session = useSession();
  const [profileName, setProfileName] = useState(session?.nombre || "Usuario");
  const [profileRole, setProfileRole] = useState(session?.rol || null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [pendingQuejasCount, setPendingQuejasCount] = useState(0);
  const [hasNewQuejas, setHasNewQuejas] = useState(false);
  const userMenuRef = useRef(null);
  const hasInitializedQuejasRef = useRef(false);
  const lastPendingQuejasRef = useRef(0);
  const panicAcknowledgedIdsRef = useRef(new Set());
  const panicModalOpenRef = useRef(false);
  const fechaActual = getFechaActual();

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!session?.uid) {
        if (active) {
          setProfileName("Usuario");
          setProfileRole(null);
        }
        return;
      }

      if (active) {
        setProfileName(session.nombre || "Usuario");
        setProfileRole(session.rol || null);
      }

      try {
        const profile = await getUserProfile(session.uid);

        if (active) {
          setProfileName(profile.nombre || "Usuario");
          setProfileRole(profile.rol || null);
        }

        updateSessionProfile(profile);
      } catch (error) {
        if (active) {
          setProfileName(session.nombre || "Usuario");
          setProfileRole(session.rol || null);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    if (profileRole !== "Vigilante" || !session?.uid) {
      setPendingQuejasCount(0);
      setHasNewQuejas(false);
      hasInitializedQuejasRef.current = false;
      lastPendingQuejasRef.current = 0;
      return undefined;
    }

    const storageKey = `safehome_vigilante_seen_quejas_${session.uid}`;
    let cancelled = false;

    const showNewQuejasNotification = async (newCount) => {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: newCount === 1 ? "Tienes una nueva queja" : `Tienes ${newCount} nuevas quejas`,
        text: "Revisa la campana para abrir la bandeja de quejas.",
        showConfirmButton: false,
        timer: 4500,
        timerProgressBar: true,
      });

      if (!("Notification" in window)) {
        return;
      }

      if (Notification.permission === "granted") {
        const notification = new Notification("SafeHome", {
          body:
            newCount === 1
              ? "LlegÃ³ una nueva queja al panel de vigilancia."
              : `Llegaron ${newCount} nuevas quejas al panel de vigilancia.`,
        });

        notification.onclick = () => {
          window.focus();
          navigate("/vigilanteQuejas");
          notification.close();
        };

        return;
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const notification = new Notification("SafeHome", {
            body:
              newCount === 1
                ? "LlegÃ³ una nueva queja al panel de vigilancia."
                : `Llegaron ${newCount} nuevas quejas al panel de vigilancia.`,
          });

          notification.onclick = () => {
            window.focus();
            navigate("/vigilanteQuejas");
            notification.close();
          };
        }
      }
    };

    const syncQuejas = async () => {
      try {
        const messages = await getMensajeria();
        if (cancelled) return;

        const pendingQuejas = messages.filter(
          (item) => getMessageTypeLabel(item.type) === "Queja" && item.status === "Pendiente"
        );
        const nextCount = pendingQuejas.length;
        const storedSeenValue = window.localStorage.getItem(storageKey);

        if (!hasInitializedQuejasRef.current) {
          hasInitializedQuejasRef.current = true;
          lastPendingQuejasRef.current = nextCount;
          if (storedSeenValue === null) {
            window.localStorage.setItem(storageKey, String(nextCount));
          }
        }

        const seenCount = Number(window.localStorage.getItem(storageKey) || "0");
        const newCount = Math.max(nextCount - Math.max(seenCount, lastPendingQuejasRef.current), 0);

        setPendingQuejasCount(nextCount);
        setHasNewQuejas(nextCount > seenCount);

        if (newCount > 0) {
          await showNewQuejasNotification(newCount);
        }

        lastPendingQuejasRef.current = nextCount;
      } catch (error) {
        if (!cancelled) {
          setPendingQuejasCount(0);
          setHasNewQuejas(false);
        }
      }
    };

    syncQuejas();
    const intervalId = window.setInterval(syncQuejas, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [navigate, profileRole, session?.uid]);

  useEffect(() => {
    if (profileRole !== "Vigilante" || pathname !== "/vigilanteQuejas" || !session?.uid) {
      return;
    }

    const storageKey = `safehome_vigilante_seen_quejas_${session.uid}`;
    window.localStorage.setItem(storageKey, String(pendingQuejasCount));
    lastPendingQuejasRef.current = pendingQuejasCount;
    setHasNewQuejas(false);
  }, [pathname, pendingQuejasCount, profileRole, session?.uid]);

  useEffect(() => {
    if (profileRole !== "Vigilante" || !session?.uid) {
      panicAcknowledgedIdsRef.current = new Set();
      panicModalOpenRef.current = false;
      return undefined;
    }

    let cancelled = false;

    const openBlockingPanicModal = async (alertas) => {
      if (panicModalOpenRef.current || alertas.length === 0) {
        return;
      }

      panicModalOpenRef.current = true;

      await Swal.fire({
        title: "ALERTA DE PANICO",
        icon: "warning",
        html: buildPanicModalHtml(alertas),
        confirmButtonText: "Recibido",
        allowOutsideClick: false,
        allowEscapeKey: false,
        backdrop: true,
      });

      alertas.forEach((item) => {
        panicAcknowledgedIdsRef.current.add(item.id);
      });

      panicModalOpenRef.current = false;
    };

    const syncPanicAlerts = async () => {
      try {
        const alertas = await getAlertasPanico();
        if (cancelled) {
          return;
        }

        const unackedActive = alertas.filter(
          (item) => item.status === "Activa" && !panicAcknowledgedIdsRef.current.has(item.id)
        );

        if (unackedActive.length > 0) {
          await openBlockingPanicModal(unackedActive);
        }
      } catch (error) {
        // no-op
      }
    };

    syncPanicAlerts();
    const intervalId = window.setInterval(syncPanicAlerts, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [profileRole, session?.uid]);

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

  const navItems = profileRole === "Vigilante" ? VIGILANTE_NAV_ITEMS : ADMIN_NAV_ITEMS;
  const homeRoute = profileRole === "Vigilante" ? "/vigilanteMenu" : "/adminMenu";

  return (
    <div className="internal-shell">
      <aside className="internal-sidebar">
        <Link to={homeRoute} className="internal-sidebar-logo">
          SafeHome
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
            <h2>AbundarÃ¡</h2>
            <span>{fechaActual}</span>
          </div>

          <div className="internal-topbar-right">
            <i className="ph-light ph-envelope-simple internal-topbar-icon" aria-hidden="true"></i>
            <button
              type="button"
              className="internal-icon-button"
              onClick={() => cerrarSesion(navigate)}
              aria-label="Cerrar sesiÃ³n"
              title="Cerrar sesiÃ³n"
            >
              <i className="ph-light ph-sign-out internal-topbar-icon"></i>
            </button>
            <button
              type="button"
              className="internal-topbar-alert"
              onClick={() => navigate("/vigilanteQuejas")}
              aria-label="Ver quejas"
              title="Ver quejas"
            >
              <i className="ph-light ph-bell internal-topbar-icon" aria-hidden="true"></i>
              {profileRole === "Vigilante" && hasNewQuejas && pendingQuejasCount > 0 && (
                <span className="internal-topbar-alert-badge">{pendingQuejasCount}</span>
              )}
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
                    <span>Cerrar sesiÃ³n</span>
                  </button>
                </div>
              )}
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

