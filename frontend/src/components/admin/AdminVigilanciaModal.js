import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCorrespondencia,
  getVehiculos,
  getVisitantes,
} from "../../services/modules/vigilanciaApi";
import "../../styles/admin/adminVigilanciaModal.css";

const SECTIONS = [
  {
    key: "correspondencia",
    title: "Correspondencia",
    description: "Consulta paquetes, sobres y documentos recibidos por residentes.",
    icon: "ph-package",
    route: "/adminVigilanciaCorrespondencia",
    loadItems: getCorrespondencia,
  },
  {
    key: "vehiculos",
    title: "Vehículos",
    description: "Visualiza el registro de carros y motos asociados a residentes.",
    icon: "ph-car",
    route: "/adminVigilanciaVehiculos",
    loadItems: getVehiculos,
  },
  {
    key: "visitantes",
    title: "Visitantes",
    description: "Revisa los ingresos autorizados y el motivo de cada visita.",
    icon: "ph-users-three",
    route: "/adminVigilanciaVisitantes",
    loadItems: getVisitantes,
  },
];

export default function AdminVigilanciaModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState({
    correspondencia: [],
    vehiculos: [],
    visitantes: [],
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadRecords = async () => {
      const nextRecords = { correspondencia: [], vehiculos: [], visitantes: [] };

      await Promise.all(
        SECTIONS.map(async (section) => {
          try {
            nextRecords[section.key] = await section.loadItems();
          } catch (error) {
            nextRecords[section.key] = [];
          }
        })
      );

      setRecords(nextRecords);
    };

    loadRecords();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="admin-vigilancia-overlay" onClick={onClose}>
      <div className="admin-vigilancia-modal" onClick={(event) => event.stopPropagation()}>
        <div className="admin-vigilancia-header">
          <div>
            <p className="admin-vigilancia-kicker">Vigilancia</p>
            <h2>Registros de seguridad</h2>
            <p className="admin-vigilancia-subtitle">
              Selecciona uno de los módulos para ir a su vista completa en modo solo lectura.
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
                <i className={`ph-thin ${section.icon}`}></i>
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
