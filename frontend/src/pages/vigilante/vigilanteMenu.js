import InternalLayout from "../../layouts/InternalLayout";
import "../../styles/shared/roleDashboard.css";

export default function VigilanteMenu() {
  return (
    <InternalLayout>
      {({ profileName }) => (
        <section className="role-dashboard">
          <div className="role-dashboard-card">
            <span className="role-dashboard-kicker">Panel vigilancia</span>
            <h1 className="role-dashboard-title">Bienvenido {profileName}</h1>
            <p className="role-dashboard-copy">
              Este espacio centraliza el acceso a los registros del conjunto y mantiene la
              misma navegacion lateral del modulo PQR para que todo el sistema se sienta uniforme.
            </p>
          </div>
        </section>
      )}
    </InternalLayout>
  );
}
