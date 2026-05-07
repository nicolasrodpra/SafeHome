// Menu principal del residente.
// Resume los modulos que puede usar dentro de su panel.
import { useState } from "react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import ilustracionMenu from "../../assets/inicioHeroResidente.png";
import useSession from "../../hooks/useSession";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";
import { createEmergency } from "../../services/modules/emergencyApi";
import { getUserProfile } from "../../services/modules/userApi";
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
  const session = useSession();
  const [sendingEmergency, setSendingEmergency] = useState(false);

  const handleEmergencyClick = async () => {
    if (!session?.uid || sendingEmergency) {
      return;
    }

    const confirmation = await Swal.fire({
      title: "Boton de panico",
      html:
        "<p>Usa esta alerta solo en una emergencia real.</p><p>Si la activas sin justificacion, se te cobrara una multa.</p>",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, es una emergencia real",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#c62828",
      cancelButtonColor: "#6c757d",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setSendingEmergency(true);

    try {
      const profile =
        session?.torre && session?.apartamento ? session : await getUserProfile(session.uid);

      if (!profile?.torre || !profile?.apartamento) {
        throw new Error(
          "Tu perfil no tiene torre y apartamento. Actualiza esos datos antes de usar el boton de panico."
        );
      }

      await createEmergency({
        residentId: session.uid,
        residentName: profile.nombre || session.nombre || "Residente",
        residentEmail: profile.email || session.email || "",
        torre: profile.torre,
        apartamento: profile.apartamento,
      });

      await Swal.fire({
        title: "Alerta enviada",
        text: "Vigilancia fue notificada de inmediato con tu torre y apartamento.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      await Swal.fire({
        title: "No se pudo enviar la alerta",
        text: error.message || "Intentalo de nuevo.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setSendingEmergency(false);
    }
  };

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

          <section className="residente-panic-banner">
            <div className="residente-panic-copy">
              <span className="residente-panic-kicker">Emergencias</span>
              <h3>Boton de panico</h3>
              <p>
                Activalo solo si la situacion es real. La alerta llegara de inmediato a
                vigilancia con tu torre y apartamento.
              </p>
            </div>

            <button
              type="button"
              className="residente-panic-button"
              onClick={handleEmergencyClick}
              disabled={sendingEmergency}
            >
              <i className="ph-fill ph-siren" aria-hidden="true"></i>
              <span>{sendingEmergency ? "Enviando alerta..." : "Activar alerta"}</span>
            </button>
          </section>

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
