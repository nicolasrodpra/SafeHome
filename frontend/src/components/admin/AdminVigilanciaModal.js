import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../config/firebase";
import "../../styles/admin/adminVigilanciaModal.css";

const SECTIONS = [
  {
    key: "correspondencia",
    title: "Correspondencia",
    description: "Consulta paquetes, sobres y documentos recibidos por residentes.",
    icon: "ph-package",
    route: "/adminVigilanciaCorrespondencia",
    collectionName: "correspondencia",
  },
  {
    key: "vehiculos",
    title: "Vehiculos",
    description: "Visualiza el registro de carros y motos asociados a residentes.",
    icon: "ph-car",
    route: "/adminVigilanciaVehiculos",
    collectionName: "vehiculos",
  },
  {
    key: "visitantes",
    title: "Visitantes",
    description: "Revisa los ingresos autorizados y el motivo de cada visita.",
    icon: "ph-users-three",
    route: "/adminVigilanciaVisitantes",
    collectionName: "visitantes",
  },
];

function formatDateFields(snapshotDoc) {
  const data = snapshotDoc.data();
  const sourceDate = data.fecha?.toDate ? data.fecha.toDate() : null;

  return {
    id: snapshotDoc.id,
    ...data,
    fecha: sourceDate ? sourceDate.toLocaleDateString("es-CO") : data.fecha ?? "",
    hora: sourceDate
      ? sourceDate.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : data.hora ?? "",
  };
}

export default function AdminVigilanciaModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState({
    correspondencia: [],
    vehiculos: [],
    visitantes: [],
  });

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const unsubscribers = SECTIONS.map((section) =>
      onSnapshot(collection(db, section.collectionName), (snapshot) => {
        const nextItems = snapshot.docs.map(formatDateFields);
        setRecords((current) => ({ ...current, [section.key]: nextItems }));
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="admin-vigilancia-overlay" onClick={onClose}>
      <div
        className="admin-vigilancia-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-vigilancia-header">
          <div>
            <p className="admin-vigilancia-kicker">Vigilancia</p>
            <h2>Registros de seguridad</h2>
            <p className="admin-vigilancia-subtitle">
              Selecciona uno de los modulos para ir a su vista completa en modo solo lectura.
            </p>
          </div>

          <button type="button" className="admin-vigilancia-close" onClick={onClose}>
            <i className="ph-light ph-x"></i>
          </button>
        </div>

        <div className="admin-vigilancia-card-grid">
          {SECTIONS.map((section) => (
            <button
              key={section.key}
              type="button"
              className="admin-vigilancia-card"
              onClick={() => {
                onClose();
                navigate(section.route);
              }}
            >
              <div className="admin-vigilancia-card-icon">
                <i className={`ph-light ${section.icon}`}></i>
              </div>
              <div>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
              <span className="admin-vigilancia-card-meta">
                {records[section.key].length} registros
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
