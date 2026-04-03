import { Link } from "react-router-dom";
import ilustracionMenu from "../../assets/inicioHeroResidente.png";
import InternalLayout from "../../layouts/InternalLayoutResidente";
import "../../styles/residente/residenteMenu.css";

const dashboardCards = [
  {
    icon: "ph-megaphone",
    title: "PQR",
    description: "Envia tus peticiones, quejas o reclamos y haz seguimiento a tu solicitud.",
    to: "/pqrResidente",
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
    to: "/comunicadosResidente",
  },
  {
    icon: "ph-book-bookmark",
    title: "Manual de convivencia",
    description: "Consulta las normas y recomendaciones de convivencia en el conjunto.",
    to: "/residenteManualConvivencia",
  },
  {
    icon: "ph-pencil-simple",
    title: "Actualizar Datos",
    description: "Manten tu informacion personal actualizada para una mejor comunicacion.",
    to: "/perfil",
  },
  {
    icon: "ph-hand",
    title: "Boton de panico",
    description: "Usa este boton en caso de emergencia para alertar al personal de seguridad.",
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
        <i className="ph-light ph-arrow-right residente-card-arrow"></i>
        <i className={`ph-light ${card.icon} residente-card-icon`}></i>
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
    <InternalLayout>
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
            <img src={ilustracionMenu} alt="ilustracionMenu" />
          </div>

          <p className="residente-section-label">Opciones</p>

          <div className="residente-cards-grid">
            {dashboardCards.map((card) => (
              <DashboardCard key={card.title} card={card} />
            ))}
          </div>
        </div>
      )}
    </InternalLayout>
  );
}

export default ResidenteMenu;
