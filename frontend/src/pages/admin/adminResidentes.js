import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import InternalLayout from "../../layouts/InternalLayout";
import "../../styles/admin/adminResidentes.css";

const getTemporaryLocation = (index) => {
  const apartamentosPorPiso = 4;
  const pisosPorTorre = 10;
  const apartamentosPorTorre = apartamentosPorPiso * pisosPorTorre;
  const torre = String(Math.floor(index / apartamentosPorTorre) + 1).padStart(2, "0");
  const piso = Math.floor((index % apartamentosPorTorre) / apartamentosPorPiso) + 1;
  const numero = String((index % apartamentosPorPiso) + 1).padStart(2, "0");

  return {
    torre,
    apartamento: `${piso}${numero}`,
  };
};

function ResidentCell({ label, children, className = "" }) {
  const classes = className ? `resident-cell ${className}` : "resident-cell";
  return (
    <div className={classes} data-label={label}>
      {children}
    </div>
  );
}

export default function AdminResidentes() {
  const [residentes, setResidentes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const residentsQuery = query(collection(db, "users"), where("rol", "==", "Residente"));

    const unsubscribe = onSnapshot(
      residentsQuery,
      (snapshot) => {
        const residents = snapshot.docs
          .map((snapshotDoc) => ({
            id: snapshotDoc.id,
            ...snapshotDoc.data(),
          }))
          .sort((a, b) => {
            const fechaA = a.creadoEn?.seconds || 0;
            const fechaB = b.creadoEn?.seconds || 0;

            if (fechaA !== fechaB) {
              return fechaA - fechaB;
            }

            return (a.nombre || "").localeCompare(b.nombre || "", "es");
          });

        setResidentes(residents);
        setCargando(false);
      },
      () => {
        setResidentes([]);
        setCargando(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <InternalLayout>
      <div className="admin-residentes-page">
        <div className="admin-residentes-hero">
          <div>
            <h1 className="internal-page-title">Residentes</h1>
            <p className="admin-residentes-copy">
              Consulta los usuarios registrados con rol de residente y revisa la
              informacion disponible hoy en la base de datos.
            </p>
          </div>

          <div className="admin-residentes-summary">
            <span>Total residentes</span>
            <strong>{residentes.length}</strong>
          </div>
        </div>

        <div className="admin-residentes-table-shell">
          <div className="admin-residentes-table-head">
            <span>ID</span>
            <span>Nombre</span>
            <span>Cedula</span>
            <span>Correo</span>
            <span>Torre</span>
            <span>Apartamento</span>
          </div>

          <div className="admin-residentes-table-body">
            {cargando ? (
              <div className="admin-residentes-empty">
                <i className="ph-light ph-spinner-gap"></i>
                <p>Cargando residentes...</p>
              </div>
            ) : residentes.length === 0 ? (
              <div className="admin-residentes-empty">
                <i className="ph-light ph-users-three"></i>
                <p>No hay residentes registrados todavia.</p>
              </div>
            ) : (
              residentes.map((residente, index) => {
                const ubicacionTemporal = getTemporaryLocation(index);
                const cedula = residente.cedula || residente.documento || "";
                const correo = residente.correo || residente.email || "Sin correo";
                const torre = residente.torre || ubicacionTemporal.torre;
                const apartamento = residente.apartamento || ubicacionTemporal.apartamento;

                return (
                  <article className="resident-row" key={residente.id}>
                    <ResidentCell label="ID" className="resident-id-cell">
                      <span className="resident-id-badge">{index + 1}</span>
                    </ResidentCell>

                    <ResidentCell label="Nombre">
                      <div className="resident-primary">
                        <strong>{residente.nombre || "Sin nombre registrado"}</strong>
                        <span>{residente.rol}</span>
                      </div>
                    </ResidentCell>

                    <ResidentCell label="Cedula">
                      {cedula ? (
                        <span className="resident-value">{cedula}</span>
                      ) : (
                        <span className="resident-pill resident-pill-muted">Pendiente</span>
                      )}
                    </ResidentCell>

                    <ResidentCell label="Correo" className="resident-email-cell">
                      <span className="resident-value resident-email">{correo}</span>
                    </ResidentCell>

                    <ResidentCell label="Torre">
                      <span className="resident-pill resident-pill-soft">{torre}</span>
                    </ResidentCell>

                    <ResidentCell label="Apartamento">
                      <span className="resident-pill resident-pill-accent">{apartamento}</span>
                    </ResidentCell>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </InternalLayout>
  );
}
