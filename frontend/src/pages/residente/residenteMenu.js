// Menu principal del residente.
// Resume los modulos que puede usar dentro de su panel.
import { Link } from "react-router-dom";
import ilustracionMenu from "../../assets/inicioHeroResidente.png";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";
import "../../styles/residente/residenteMenu.css";

const dashboardCards = [
  {
    icon: "ph-megaphone",
    title: "Mensajeria",
    description: "Envia mensajes, solicitudes o autorizaciones y haz seguimiento a tu registro.",
    to: "/residenteMensajeria",
  },
  {
    icon: "ph-calendar-blank",
    title: "Reservas",
    description: "Agenda espacios comunes como el salon social o la zona BBQ facilmente desde aqui.",
    to: "/residentesReservas",
  },
  {
    icon: "ph-bell",
    title: "Comunicados",
    description: "Enterate de los avisos y novedades del conjunto en tiempo real.",
    to: "/residenteComunicados",
  },
  {
    icon: "ph-book-bookmark",
    title: "Manual de convivencia",
    description: "Consulta las normas y recomendaciones de convivencia en el conjunto.",
    to: "/residenteManualConvivencia",
  },
  {
    icon: "ph-pencil-simple",
    title: "Actualizar datos",
    description: "Manten tu informacion personal actualizada para una mejor comunicacion.",
    to: "/perfil",
  },
];

function DashboardCard({ card }) {
  const content = (
    <>
      <div className="residente-card-top">
        <h4>{card.title}</h4>
        <p>{card.description}</p>
      </div>
      <div className="residente-card-bottom">
        <i className="ph-thin ph-arrow-right residente-card-arrow"></i>
        <i className={`ph-thin ${card.icon} residente-card-icon`}></i>
      </div>
    </>
  );

  if (card.to) {
    return (
      <Link to={card.to} className="residente-option-card">
        {content}
      </Link>
    );
  }

  return <div className="residente-option-card residente-option-card-placeholder">{content}</div>;
}

function ResidenteMenu() {
  return (
    <InternalLayoutResidente>
      {({ profileName }) => (
        <div className="residente-content">
          <div className="residente-hero-banner">
            <div className="residente-hero-banner-text">
              <h1>
                Hola, <span>{profileName}</span>
              </h1>
              <p>
                Tu hogar, mas seguro y conectado: recibe avisos
                <br />
                y participa en tu comunidad.
              </p>
            </div>
            <img src={ilustracionMenu} alt="Ilustracion del panel del residente" />
          </div>

          <p className="residente-section-label">Opciones</p>

          <div className="residente-cards-grid">
            {dashboardCards.map((card) => (
              <DashboardCard key={card.title} card={card} />
            ))}
          </div>
        </div>
      )}
    </InternalLayoutResidente>
  );
}

export default ResidenteMenu;
