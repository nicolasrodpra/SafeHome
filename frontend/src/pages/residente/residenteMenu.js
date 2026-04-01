import InternalLayout from "../../components/InternalLayout";
import "../../styles/shared/roleDashboard.css";

export default function ResidentMenu() {
  return (
    <InternalLayout>
      {({ profileName }) => (
        <section className="role-dashboard">
          <div className="role-dashboard-card">
            <span className="role-dashboard-kicker">Panel residente</span>
            <h1 className="role-dashboard-title">Bienvenido {profileName}</h1>
            <p className="role-dashboard-copy">
              Desde aqui podras consultar novedades del conjunto, revisar tus solicitudes
              y navegar por los modulos disponibles con la misma barra lateral del sistema.
            </p>
          </div>
        </section>
      )}
    </InternalLayout>
  );
}
