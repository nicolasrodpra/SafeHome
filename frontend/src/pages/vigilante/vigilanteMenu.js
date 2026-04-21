// Menu principal del vigilante.
// Resume los registros operativos del dia y accesos rapidos.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ilustracionMenu from "../../assets/vigilanteHero.png";
import InternalLayout from "../../layouts/InternalLayout";
import { getResumenVigilancia } from "../../services/modules/vigilanciaApi";
import "../../styles/admin/adminMenu.css";
import "../../styles/vigilante/vigilanteMenu.css";

const statCards = [
  {
    key: "vehiculosHoy",
    icon: "ph-car",
    label: "Vehiculos de hoy",
    description: "Registros vehiculares realizados durante la jornada actual.",
    variant: "vehicles",
  },
  {
    key: "correspondenciaHoy",
    icon: "ph-package",
    label: "Correspondencia de hoy",
    description: "Entregas recibidas y pendientes de registro para este dia.",
    variant: "mail",
  },
  {
    key: "visitantesHoy",
    icon: "ph-users-three",
    label: "Visitantes de hoy",
    description: "Ingresos de visitantes registrados en el turno de hoy.",
    variant: "visitors",
  },
];

const dashboardCards = [
  {
    icon: "ph-car",
    title: "Registro de vehiculos",
    description: "Controla el ingreso de carros y motos autorizados dentro del conjunto.",
    to: "/registroVehiculos",
  },
  {
    icon: "ph-package",
    title: "Registro de correspondencia",
    to: "/registroCorrespondencia",
    description: "Lleva seguimiento de paquetes, encomiendas y entregas pendientes para residentes.",
  },
  {
    icon: "ph-users-three",
    title: "Registro de visitantes",
    to: "/registroVisitantes",
    description: "Registra visitantes y manten trazabilidad de los ingresos al conjunto residencial.",
  },
  {
    icon: "ph-siren",
    title: "Boton de panico",
    description: "Consulta alertas activas e historial completo de activaciones.",
    to: "/vigilantePanico",
  },
  {
    icon: "ph-bell",
    title: "Comunicados",
    description: "Recibe y consulta los comunicados enviados por la administracion del conjunto.",
    to: "/vigilanteComunicados",
  },
  {
    icon: "ph-megaphone",
    title: "Quejas",
    description: "Consulta las quejas reportadas por residentes en una vista solo de lectura.",
    to: "/vigilanteQuejas",
  },
];

function VigilanteStatCard({ card, value }) {
  return (
    <article className={`vigilante-stat-card is-${card.variant}`}>
      <div className="vigilante-stat-top">
        <span className="vigilante-stat-icon">
          <i className={`ph-thin ${card.icon}`}></i>
        </span>
        <span className="vigilante-stat-label">{card.label}</span>
      </div>

      <div className="vigilante-stat-value">{value}</div>
      <p className="vigilante-stat-copy">{card.description}</p>
    </article>
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

  return <div className="option-card option-card-placeholder">{content}</div>;
}

function VigilanteMenu() {
  const [stats, setStats] = useState({
    vehiculosHoy: 0,
    correspondenciaHoy: 0,
    visitantesHoy: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const nextStats = await getResumenVigilancia();
        setStats(nextStats);
      } catch (error) {
        setStats({
          vehiculosHoy: 0,
          correspondenciaHoy: 0,
          visitantesHoy: 0,
        });
      }
    };

    loadStats();
  }, []);

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
                Monitorea ingresos, visitantes y novedades de seguridad en
                <br />
                conjuntos residenciales con un control claro y organizado.
              </p>
            </div>
            <img src={ilustracionMenu} alt="Ilustracion del panel de vigilancia" />
          </div>

          <div className="vigilante-stats-grid">
            {statCards.map((card) => (
              <VigilanteStatCard key={card.key} card={card} value={stats[card.key] ?? 0} />
            ))}
          </div>

          <p className="section-label vigilante-options-heading">Registros y accesos</p>

          <div className="vigilante-cards-grid">
            {dashboardCards.map((card) => (
              <DashboardCard key={card.title} card={card} />
            ))}
          </div>
        </div>
      )}
    </InternalLayout>
  );
}

export default VigilanteMenu;
