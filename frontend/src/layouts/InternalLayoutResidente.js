import { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import asistenteVirtual from "../assets/asistenteVirtual.png";
import { auth, db } from "../config/firebase";
import { cerrarSesion } from "../services/authService";
import { getFechaActual } from "../utils/getDate";
import "../styles/shared/InternalLayoutResidente.css";

const RESIDENTE_NAV_ITEMS = [
  { icon: "ph-megaphone", label: "PQR" },
  { icon: "ph-calendar-blank", label: "Reservas", to: "/residentesReservas" },
  { icon: "ph-bell", label: "Comunicados", to: "/residenteComunicados" },
  { icon: "ph-book-bookmark", label: "Manual Convivencia", to: "/residenteManualConvivencia" },
  { icon: "ph-pencil-simple", label: "Actualizar datos", to: "/perfil" },
  { icon: "ph-hand", label: "Boton de panico" },
];

const getCachedProfile = () => {
  try {
    return {
      name: localStorage.getItem("safehome_profile_name") || "Usuario",
      role: localStorage.getItem("safehome_profile_role") || "Residente",
    };
  } catch (error) {
    return { name: "Usuario", role: "Residente" };
  }
};

function SidebarItem({ item, pathname }) {
  if (item.to) {
    const isActive = pathname === item.to;

    return (
      <Link
        to={item.to}
        className={isActive ? "internal-nav-link active" : "internal-nav-link"}
      >
        <i className={`ph-light ${item.icon}`} aria-hidden="true"></i>
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="internal-nav-link internal-nav-placeholder"
      disabled
    >
      <i className={`ph-light ${item.icon}`} aria-hidden="true"></i>
      <span>{item.label}</span>
    </button>
  );
}

export default function InternalLayoutResidente({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user] = useAuthState(auth);
  const cachedProfile = getCachedProfile();
  const [profileName, setProfileName] = useState(cachedProfile.name);
  const [profileRole, setProfileRole] = useState(cachedProfile.role);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const fechaActual = getFechaActual();

  useEffect(() => {
    let isMounted = true;

    const cargarPerfil = async () => {
      if (!user) {
        if (isMounted) {
          setProfileName("Usuario");
          setProfileRole("Residente");
        }
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const profileData = userDoc.exists() ? userDoc.data() : {};
        const nombreGuardado =
          profileData.nombre ||
          [profileData.nombres, profileData.apellidos].filter(Boolean).join(" ");
        const fallbackName =
          user.displayName || user.email?.split("@")[0] || "Usuario";
        const nextName = nombreGuardado || fallbackName;
        const nextRole = profileData.rol || "Residente";

        if (isMounted) {
          setProfileName(nextName);
          setProfileRole(nextRole);
        }

        try {
          localStorage.setItem("safehome_profile_name", nextName);
          localStorage.setItem("safehome_profile_role", nextRole);
        } catch (storageError) {}
      } catch (error) {
        const fallbackName =
          user.displayName || user.email?.split("@")[0] || "Usuario";

        if (isMounted) {
          setProfileName(fallbackName);
          setProfileRole("Residente");
        }

        try {
          localStorage.setItem("safehome_profile_name", fallbackName);
          localStorage.setItem("safehome_profile_role", "Residente");
        } catch (storageError) {}
      }
    };

    cargarPerfil();

    return () => {
      isMounted = false;
    };
  }, [user]);

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

  const handleViewProfile = () => {
    setUserMenuOpen(false);
    navigate("/perfil");
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await cerrarSesion(navigate);
  };

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
          <img src={asistenteVirtual} alt="Asistente Virtual" />
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
            <i
              className="ph-light ph-envelope-simple internal-topbar-icon"
              aria-hidden="true"
            ></i>
            <i className="ph-light ph-bell internal-topbar-icon" aria-hidden="true"></i>
            <button
              type="button"
              className="internal-icon-button"
              onClick={handleLogout}
              aria-label="Cerrar sesion"
              title="Cerrar sesion"
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
                    onClick={handleViewProfile}
                  >
                    <i className="ph-light ph-user-circle"></i>
                    <span>Ver perfil</span>
                  </button>
                  <button
                    type="button"
                    className="internal-user-dropdown-item"
                    onClick={handleLogout}
                  >
                    <i className="ph-light ph-sign-out"></i>
                    <span>Cerrar sesion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {typeof children === "function"
          ? children({ profileName, profileRole })
          : children}
      </div>
    </div>
  );
}
