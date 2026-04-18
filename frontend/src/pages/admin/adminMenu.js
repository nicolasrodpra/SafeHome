// Menu principal del administrador.
// Funciona como tablero de accesos a todos los modulos de gestion.
import { useState } from "react";
import { Link } from "react-router-dom";
import AdminVigilanciaModal from "../../components/admin/AdminVigilanciaModal";
import InternalLayout from "../../layouts/InternalLayout";
import "../../styles/admin/adminMenu.css";

// Tarjetas del dashboard administrativo.
const dashboardCards = [
  {
    icon: "ph-megaphone",
    title: "Mensajeria",
    description: "Gestiona quejas, solicitudes y autorizaciones enviadas por los residentes.",
    to: "/adminMensajeria",
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
    modal: "vigilancia",
  },
  {
    icon: "ph-user",
    title: "Residentes",
    description: "Administra la informacion de los residentes del conjunto.",
    to: "/adminResidentes",
  },
  {
    icon: "ph-book-bookmark",
    title: "Manual de convivencia",
    description: "Consulta y gestiona las normas del conjunto residencial.",
    to: "/adminManualConvivencia",
  },
  {
    icon: "ph-pencil-simple",
    title: "Actualizacion de datos",
    description: "Modifica y mantiene actualizada tu informacion.",
    to: "/perfil",
  },
  {
    icon: "ph-user-plus",
    title: "Registrar usuario",
    description: "Crea nuevos usuarios y asigna sus datos de acceso al sistema.",
    to: "/registroUsuario",
  },
];

function DashboardCard({ card, onOpenModal }) {
  const content = (
    <>
      <div className="card-top">
        <h4>{card.title}</h4>
        <p>{card.description}</p>
      </div>
      <div className="card-bottom">
        <i className="ph-thin ph-arrow-right card-arrow"></i>
        <i className={`ph-thin ${card.icon} card-icon`}></i>
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

  if (card.modal === "vigilancia") {
    return (
      <button type="button" className="option-card option-card-button" onClick={onOpenModal}>
        {content}
      </button>
    );
  }

  return <div className="option-card option-card-placeholder">{content}</div>;
}

function AdminMenuPage() {
  const [isVigilanciaOpen, setIsVigilanciaOpen] = useState(false);

  return (
    <InternalLayout>
      {({ profileName }) => (
        <>
          <div className="content">
            <div className="hero-banner">
              <div className="hero-banner-text">
                <h1>
                  Hola, <span>{profileName}</span>
                </h1>
                <p>Supervisa y mejora la seguridad de tu comunidad con herramientas inteligentes.</p>
              </div>
            </div>

            <p className="section-label">Opciones</p>

            <div className="cards-grid">
              {dashboardCards.map((card) => (
                <DashboardCard
                  key={card.title}
                  card={card}
                  onOpenModal={() => setIsVigilanciaOpen(true)}
                />
              ))}
            </div>
          </div>
          <AdminVigilanciaModal
            isOpen={isVigilanciaOpen}
            onClose={() => setIsVigilanciaOpen(false)}
          />
        </>
      )}
    </InternalLayout>
  );
}

export default AdminMenuPage;
