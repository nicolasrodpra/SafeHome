// Pantalla administrativa para consultar el listado de residentes.
// Muestra información básica de ubicación y datos de contacto.
import { useEffect, useState } from "react";
import InternalLayout from "../../layouts/InternalLayout";
import { getResidents } from "../../services/modules/userApi";
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

const compareByText = (firstValue = "", secondValue = "") =>
  firstValue.localeCompare(secondValue, "es", {
    numeric: true,
    sensitivity: "base",
  });

const getSortableNumber = (value) => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  const match = normalizedValue.match(/\d+/);

  return match ? Number.parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
};

const compareSortableNumbers = (firstValue, secondValue) => {
  if (firstValue === secondValue) {
    return 0;
  }

  if (!Number.isFinite(firstValue)) {
    return 1;
  }

  if (!Number.isFinite(secondValue)) {
    return -1;
  }

  return firstValue - secondValue;
};

const compareResidentsByLocation = (firstResident, secondResident) => {
  const towerDiff = compareSortableNumbers(
    getSortableNumber(firstResident?.torre),
    getSortableNumber(secondResident?.torre)
  );

  if (towerDiff !== 0) {
    return towerDiff;
  }

  const apartmentDiff = compareSortableNumbers(
    getSortableNumber(firstResident?.apartamento),
    getSortableNumber(secondResident?.apartamento)
  );

  if (apartmentDiff !== 0) {
    return apartmentDiff;
  }

  const towerTextDiff = compareByText(firstResident?.torre || "", secondResident?.torre || "");

  if (towerTextDiff !== 0) {
    return towerTextDiff;
  }

  const apartmentTextDiff = compareByText(
    firstResident?.apartamento || "",
    secondResident?.apartamento || ""
  );

  if (apartmentTextDiff !== 0) {
    return apartmentTextDiff;
  }

  const nameDiff = compareByText(firstResident?.nombre || "", secondResident?.nombre || "");

  if (nameDiff !== 0) {
    return nameDiff;
  }

  return compareByText(firstResident?.uid || "", secondResident?.uid || "");
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
    const loadResidents = async () => {
      try {
        const residents = await getResidents();
        setResidentes([...residents].sort(compareResidentsByLocation));
      } catch (error) {
        setResidentes([]);
      } finally {
        setCargando(false);
      }
    };

    loadResidents();
  }, []);

  return (
    <InternalLayout>
      <div className="admin-residentes-page">
        <div className="admin-residentes-hero">
          <div>
            <h1 className="internal-page-title">Residentes</h1>
            <p className="admin-residentes-copy">
              Consulta los usuarios registrados con rol de residente y revisa la información
              disponible hoy en la base de datos.
            </p>
          </div>

          <div className="admin-residentes-summary">
            <span>Total de residentes</span>
            <strong>{residentes.length}</strong>
          </div>
        </div>

        <div className="admin-residentes-table-shell">
          <div className="admin-residentes-table-head">
            <span>ID</span>
            <span>Nombre</span>
            <span>Cédula</span>
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
                <p>No hay residentes registrados todavía.</p>
              </div>
            ) : (
              residentes.map((residente, index) => {
                const ubicacionTemporal = getTemporaryLocation(index);
                const cedula = residente.cedula || "";
                const correo = residente.email || "Sin correo";
                const torre = residente.torre || ubicacionTemporal.torre;
                const apartamento = residente.apartamento || ubicacionTemporal.apartamento;

                return (
                  <article className="resident-row" key={residente.uid}>
                    <ResidentCell label="ID" className="resident-id-cell">
                      <span className="resident-id-badge">{index + 1}</span>
                    </ResidentCell>

                    <ResidentCell label="Nombre">
                      <div className="resident-primary">
                        <strong>{residente.nombre || "Sin nombre registrado"}</strong>
                        <span>{residente.rol}</span>
                      </div>
                    </ResidentCell>

                    <ResidentCell label="Cédula">
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
