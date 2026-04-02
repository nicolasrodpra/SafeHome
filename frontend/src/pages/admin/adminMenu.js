import { Link } from "react-router-dom";
import ilustracionMenu from "../../assets/inicioHero.png";
import InternalLayout from "../../layouts/InternalLayout";
import "../../styles/admin/adminMenu.css";

const dashboardCards = [
  {
    icon: "ph-megaphone",
    title: "Quejas",
    description: "Gestiona y da seguimiento a las quejas de los residentes.",
    to: "/pqrRecibidosAdmin",
  },
  {
    icon: "ph-calendar-blank",
    title: "Reservas",
    description: "Gestiona las reservas de zonas comunes y controla su disponibilidad.",
    to: "/adminReservas",
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
    to: "/adminResidentes",
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
    to: "/perfil",
  },
  {
    icon: "ph-user-plus",
    title: "Registrar Usuario",
    description: "Crea nuevos usuarios y asigna sus datos de acceso al sistema.",
    to: "/registroUsuario",
  },
];

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

function AdminMenuPage() {
  return (
    <InternalLayout>
      {({ profileName }) => (
        <div className="content">
          <div className="hero-banner">
            <div className="hero-banner-text">
              <h1>
                Hola, <span>{profileName}</span>
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
      )}
    </InternalLayout>
  );
}

export default AdminMenuPage;
