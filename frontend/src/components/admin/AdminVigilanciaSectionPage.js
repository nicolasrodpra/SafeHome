import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import InternalLayout from "../../layouts/InternalLayout";
import { db } from "../../config/firebase";
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
    <div className="admin-readonly-modal-overlay" onClick={onClose}>
      <div
        className="admin-readonly-modal-box admin-readonly-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-readonly-modal-stripe" />
        <div className="admin-readonly-modal-header">
          <div className="admin-readonly-modal-header-left">
            <div className="admin-readonly-modal-icon">
              <i className={`ph-light ${config.icon}`}></i>
            </div>
            <div>
              <p className="admin-readonly-modal-title">Detalle del registro</p>
              <p className="admin-readonly-modal-subtitle">{config.title}</p>
            </div>
          </div>
          <button type="button" className="admin-readonly-modal-close" onClick={onClose}>
            <i className="ph-light ph-x"></i>
          </button>
        </div>

        <hr className="admin-readonly-modal-divider" />

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
      <main className="content admin-vigilancia-page">
        <header className="admin-vigilancia-page-header">
          <div>
            <h1 className="internal-page-title">{config.title}</h1>
            <p className="admin-vigilancia-page-copy">
              Consulta el registro completo en modo solo lectura desde una vista mas clara y
              consistente para administracion.
            </p>
          </div>

          <div className="admin-vigilancia-page-summary">
            <span>Total registros</span>
            <strong>{items.length}</strong>
          </div>
        </header>

        <section className="admin-vigilancia-surface">
          <div className="admin-vigilancia-card-header">
            <div>
              <h2 className="admin-vigilancia-card-title">Resumen del modulo</h2>
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

          <div className="admin-vigilancia-table-wrap">
            <table className="admin-vigilancia-table">
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
                    <td
                      colSpan={config.columns.length + 1}
                      className="admin-vigilancia-empty-row"
                    >
                      {config.emptyMessage}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      {config.columns.map((column) => (
                        <td key={`${item.id}-${column.key}`}>
                          {column.render ? column.render(item) : item[column.key]}
                        </td>
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
        </section>
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
