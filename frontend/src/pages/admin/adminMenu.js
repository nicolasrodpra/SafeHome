import { Link, useNavigate } from "react-router-dom";
import asistenteVirtual from "../../assets/asistenteVirtual.png";
import ilustracionMenu from "../../assets/inicioHero.png";
import { cerrarSesion } from "../../services/authService";
import { getFechaActual } from "../../services/getDate";
import "../../styles/admin/adminMenu.css";

const sidebarItems = [
  { icon: "ph-megaphone", label: "Quejas" },
  { icon: "ph-calendar-blank", label: "Reservas" },
  { icon: "ph-bell", label: "Comunicados", to: "/adminComunicados" },
  { icon: "ph-security-camera", label: "Vigilancia", to: "/registroVehiculos" },
  { icon: "ph-user", label: "Residentes" },
  { icon: "ph-book-bookmark", label: "Manual Convivencia" },
  { icon: "ph-pencil-simple", label: "Actualizar datos" },
  { icon: "ph-user-plus", label: "Registrar Usuario", to: "/registroResidente" },
];

const dashboardCards = [
  {
    icon: "ph-megaphone",
    title: "Quejas",
    description: "Gestiona y da seguimiento a las quejas de los residentes.",
  },
  {
    icon: "ph-calendar-blank",
    title: "Reservas",
    description: "Gestiona las reservas de zonas comunes y controla su disponibilidad.",
  },
  {
    icon: "ph-bell",
    title: "Comunicados",
    description: "Publica y administra avisos importantes para los residentes.",
    to: "/adminComunicados",
  },
  {
    icon: "ph-security-camera",
    title: "Vigilancia",
    description: "Supervisa novedades de seguridad y registra eventos relevantes.",
    to: "/registroVehiculos",
  },
  {
    icon: "ph-user",
    title: "Residentes",
    description: "Administra la informacion de los residentes del conjunto.",
  },
  {
    icon: "ph-book-bookmark",
    title: "Manual Convivencia",
    description: "Consulta y gestiona las normas del conjunto residencial.",
  },
  {
    icon: "ph-pencil-simple",
    title: "Actualizacion Datos",
    description: "Modifica y mantiene actualizada tu informacion.",
  },
  {
    icon: "ph-user-plus",
    title: "Registrar Usuario",
    description: "Crea nuevos usuarios y asigna sus datos de acceso al sistema.",
    to: "/registroResidente",
  },
];

function AdminSidebarItem({ item }) {
  if (item.to) {
    return (
      <Link to={item.to}>
        <i className={`ph-light ${item.icon}`}></i> {item.label}
      </Link>
    );
  }

  return (
    <span className="sidebar-link-placeholder">
      <i className={`ph-light ${item.icon}`}></i> {item.label}
    </span>
  );
}

function DashboardCard({ card }) {
  const content = (
    <>
      <div className="card-top">
        <h4>{card.title}</h4>
        <p>{card.description}</p>
      </div>
      <div className="card-bottom">
        <i className="ph-light ph-arrow-right card-arrow"></i>
        <i className={`ph-light ${card.icon} card-icon`}></i>
      </div>
    </>
  );

  if (card.to) {
    return (
      <Link to={card.to} className="option-card">
        {content}
      </Link>
    );
  }

  return <div className="option-card option-card-placeholder">{content}</div>;
}

function AdminMenu() {
  const navigate = useNavigate();
  const fechaMayuscula = getFechaActual();

  return (
    <div className="app">
      <aside className="sidebar">
        <Link to="/adminMenu" className="sidebar-logo">
          SafeHome
        </Link>

        <ul className="nav-menu">
          {sidebarItems.map((item) => (
            <li key={item.label}>
              <AdminSidebarItem item={item} />
            </li>
          ))}

          <div className="sidebar-assistant">
            <img src={asistenteVirtual} alt="asistenteVirtual" />
            <p>
              Asistente
              <br />
              Virtual
            </p>
            <button className="btn-asst">Iniciar</button>
          </div>
        </ul>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <h2>Abundara</h2>
            <span>{fechaMayuscula}</span>
          </div>

          <div className="topbar-right">
            <i className="ph-light ph-envelope-simple topbar-icon"></i>
            <i className="ph-light ph-bell topbar-icon"></i>
            <i
              className="ph-light ph-sign-out topbar-icon"
              onClick={() => cerrarSesion(navigate)}
            ></i>
            <div className="user-pill">
              <div className="user-avatar">NR</div>
              <span className="user-name">Nicolas Rodriguez</span>
              <i className="ph-light ph-caret-down user-caret"></i>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="hero-banner">
            <div className="hero-banner-text">
              <h1>
                Hola, <span>Nicolas</span>
              </h1>
              <p>
                supervisa y mejora la seguridad de tu comunidad con
                <br />
                herramientas inteligentes.
              </p>
            </div>
            <img src={ilustracionMenu} alt="ilustracionMenu" />
          </div>

          <p className="section-label">Opciones</p>

          <div className="cards-grid">
            {dashboardCards.map((card) => (
              <DashboardCard key={card.title} card={card} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMenu;
