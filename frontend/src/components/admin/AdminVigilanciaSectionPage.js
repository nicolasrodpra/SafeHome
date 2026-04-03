import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import InternalLayout from "../../layouts/InternalLayout";
import { db } from "../../config/firebase";
import "../../styles/vigilante/registroVehiculos.css";
import "../../styles/admin/adminVigilanciaSection.css";

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

function DetailModal({ isOpen, item, config, onClose }) {
  if (!isOpen || !item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box admin-readonly-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-stripe" />
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">
              <i className={`ph-light ${config.icon}`}></i>
            </div>
            <div>
              <p className="modal-title">Detalle del registro</p>
              <p className="modal-subtitle">{config.title}</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <i className="ph-light ph-x"></i>
          </button>
        </div>

        <hr className="modal-divider" />

        <div className="admin-readonly-detail-grid">
          {config.detailFields.map((field) => (
            <div key={field.key} className="admin-readonly-detail-item">
              <span>{field.label}</span>
              <strong>{item[field.key] || "Sin dato"}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminVigilanciaSectionPage({ config }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, config.collectionName),
      (snapshot) => {
        setItems(snapshot.docs.map(formatDateFields));
      },
      (error) => {
        console.error(`Error cargando ${config.collectionName}:`, error);
      }
    );

    return () => unsubscribe();
  }, [config.collectionName]);

  const counters = useMemo(() => config.getCounters(items), [config, items]);

  return (
    <InternalLayout>
      <main className="content">
        <div className="card">
          <div className="card-header admin-readonly-card-header">
            <div>
              <h2 className="card-title">{config.title}</h2>
              <p className="admin-readonly-card-copy">
                Vista solo lectura para administracion. Desde aqui solo puedes observar el
                registro completo.
              </p>
            </div>

            <div className="vehicle-counters">
              {counters.map((counter) => (
                <div key={counter.label} className="counter-card">
                  <div className={`counter-icon ${counter.variant || "car"}`}>
                    <i className={`ph-light ${counter.icon}`}></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{counter.value}</span>
                    <span className="counter-label">{counter.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <table className="vehicle-table">
            <thead>
              <tr>
                {config.columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length + 1} style={{ textAlign: "center", padding: "24px", color: "#999" }}>
                    {config.emptyMessage}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    {config.columns.map((column) => (
                      <td key={`${item.id}-${column.key}`}>{column.render ? column.render(item) : item[column.key]}</td>
                    ))}
                    <td>
                      <div className="action-btns">
                        <button
                          type="button"
                          className="action-icon-btn admin-readonly-eye-btn"
                          onClick={() => setSelectedItem(item)}
                          title="Ver registro completo"
                          aria-label="Ver registro completo"
                        >
                          <i className="ph-light ph-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <DetailModal
        isOpen={Boolean(selectedItem)}
        item={selectedItem}
        config={config}
        onClose={() => setSelectedItem(null)}
      />
    </InternalLayout>
  );
}
