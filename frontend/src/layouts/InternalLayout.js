import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import asistenteVirtual from "../assets/asistenteVirtual.png";
import AdminVigilanciaModal from "../components/admin/AdminVigilanciaModal";
import useSession from "../hooks/useSession";
import { cerrarSesion } from "../services/authService";
import { getUserProfile } from "../services/modules/userApi";
import { updateSessionProfile } from "../services/sessionService";
import { getFechaActual } from "../utils/getDate";
import "../styles/shared/internalLayout.css";

const ADMIN_NAV_ITEMS = [
  { icon: "ph-megaphone", label: "Mensajería", to: "/adminMensajeria" },
  { icon: "ph-calendar-blank", label: "Reservas", to: "/adminReservas" },
  { icon: "ph-bell", label: "Comunicados", to: "/adminComunicados" },
  { icon: "ph-security-camera", label: "Vigilancia", modal: "vigilancia" },
  { icon: "ph-user", label: "Residentes", to: "/adminResidentes" },
  { icon: "ph-book-bookmark", label: "Manual de convivencia", to: "/adminManualConvivencia" },
  { icon: "ph-pencil-simple", label: "Actualizar datos", to: "/perfil" },
  { icon: "ph-user-plus", label: "Registrar usuario", to: "/registroUsuario" },
];

const VIGILANTE_NAV_ITEMS = [
  { icon: "ph-car", label: "Registro de vehículos", to: "/registroVehiculos" },
  { icon: "ph-package", label: "Registro de correspondencia", to: "/registroCorrespondencia" },
  { icon: "ph-users-three", label: "Registro de visitantes", to: "/registroVisitantes" },
  { icon: "ph-bell", label: "Comunicados", to: "/adminComunicados" },
];

// Este componente dibuja cada opción del menú lateral.
// Si la opción abre una ruta usamos un Link; si abre un modal usamos un botón.
function SidebarItem({ item, pathname, onOpenModal }) {
  if (item.to) {
    const isActive = pathname === item.to;

    return (
      <Link to={item.to} className={isActive ? "internal-nav-link active" : "internal-nav-link"}>
        <i className={`ph-light ${item.icon}`} aria-hidden="true"></i>
        <span>{item.label}</span>
      </Link>
    );
  }

  if (item.modal === "vigilancia") {
    return (
      <button
        type="button"
        className="internal-nav-link internal-nav-button"
        onClick={onOpenModal}
      >
        <i className={`ph-light ${item.icon}`} aria-hidden="true"></i>
        <span>{item.label}</span>
      </button>
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
  const [isVigilanciaOpen, setIsVigilanciaOpen] = useState(false);
  const userMenuRef = useRef(null);
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
              <SidebarItem
                item={item}
                pathname={pathname}
                onOpenModal={() => setIsVigilanciaOpen(true)}
              />
            </li>
          ))}
        </ul>

        <div className="internal-sidebar-assistant">
          <img src={asistenteVirtual} alt="Asistente virtual" />
          <p>
            Asistente
            <br />
            Virtual
          </p>
          <button type="button" className="internal-assistant-button">
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
            <i className="ph-light ph-bell internal-topbar-icon" aria-hidden="true"></i>
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

        <AdminVigilanciaModal
          isOpen={isVigilanciaOpen}
          onClose={() => setIsVigilanciaOpen(false)}
        />
      </div>
    </div>
  );
}
