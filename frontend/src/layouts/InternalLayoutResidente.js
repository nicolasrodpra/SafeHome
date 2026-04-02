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
  { icon: "ph-megaphone", label: "PQR"},
  { icon: "ph-calendar-blank", label: "Reservas" },
  { icon: "ph-bell", label: "Comunicados"},
  { icon: "ph-book-bookmark", label: "Manual Convivencia" },
  { icon: "ph-pencil-simple", label: "Actualizar datos" },
  { icon: "ph-hand", label: "Botón de pánico"},
];

function SidebarItem({ item, pathname }) {
  if (item.to) {
    const isActive = pathname === item.to;

    return (
      <Link
        to={item.to}
        className={isActive ? "internal-nav-link active" : "internal-nav-link"}
      >
        <i className={`ph-light ${item.icon}`}></i>
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <button type="button" className="internal-nav-link internal-nav-placeholder">
      <i className={`ph-light ${item.icon}`}></i>
      <span>{item.label}</span>
    </button>
  );
}

export default function InternalLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user] = useAuthState(auth);
  const [profileName, setProfileName] = useState("Usuario");
  const fechaMayuscula = getFechaActual();

  useEffect(() => {
    let isMounted = true;

    const cargarPerfil = async () => {
      if (!user) {
        if (isMounted) setProfileName("Usuario");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const nombreGuardado = userDoc.exists() ? userDoc.data().nombre : "";
        const fallbackName =
          user.displayName || user.email?.split("@")[0] || "Usuario";

        if (isMounted) {
          setProfileName(nombreGuardado || fallbackName);
        }
      } catch (error) {
        if (isMounted) {
          setProfileName(user.displayName || user.email?.split("@")[0] || "Usuario");
        }
      }
    };

    cargarPerfil();

    return () => {
      isMounted = false;
    };
  }, [user]);

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
            <span>{fechaMayuscula}</span>
          </div>

          <div className="internal-topbar-right">
            <i className="ph-light ph-envelope-simple internal-topbar-icon"></i>
            <i className="ph-light ph-bell internal-topbar-icon"></i>
            <i
              className="ph-light ph-sign-out internal-topbar-icon"
              onClick={() => cerrarSesion(navigate)}
            ></i>
            
            <div className="internal-user-pill">
              <div className="internal-user-avatar">{userInitials}</div>
              <span className="internal-user-name">{profileName}</span>
              <i className="ph-light ph-caret-down internal-user-caret"></i>
            </div>
          </div>
        </div>

        {typeof children === "function" ? children({ profileName }) : children}
      </div>
    </div>
  );
}
