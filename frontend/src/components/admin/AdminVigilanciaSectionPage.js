import { useEffect, useMemo, useState } from "react";
import InternalLayout from "../../layouts/InternalLayout";
import "../../styles/admin/adminVigilanciaSection.css";

// Este modal solo muestra la información completa del registro.
// No permite editar nada; por eso se usa como vista de solo lectura.
function DetailModal({ isOpen, item, config, onClose }) {
  if (!isOpen || !item) return null;

  return (
    <div className="admin-readonly-modal-overlay" onClick={onClose}>
      <div
        className="admin-readonly-modal-box admin-readonly-detail-modal"
        onClick={(event) => event.stopPropagation()}
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

// Este componente reutilizable permite mostrar distintos módulos de vigilancia
// con la misma estructura. Lo único que cambia es la configuración recibida.
export default function AdminVigilanciaSectionPage({ config }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // Cargamos los registros del módulo activo usando la función
    // que llega en la configuración de la página.
    const loadItems = async () => {
      try {
        const data = await config.loadItems();
        setItems(data);
      } catch (error) {
        setItems([]);
      }
    };

    loadItems();
  }, [config]);

  // El resumen superior se recalcula cuando cambian los datos cargados.
  const counters = useMemo(() => config.getCounters(items), [config, items]);

  return (
    <InternalLayout>
      <main className="content admin-vigilancia-page">
        <header className="admin-vigilancia-page-header">
          <div>
            <h1 className="internal-page-title">{config.title}</h1>
            <p className="admin-vigilancia-page-copy">
              Consulta el registro completo en modo solo lectura desde una vista más clara y
              consistente para administración.
            </p>
          </div>

          <div className="admin-vigilancia-page-summary">
            <span>Total de registros</span>
            <strong>{items.length}</strong>
          </div>
        </header>

        <section className="admin-vigilancia-surface">
          <div className="admin-vigilancia-card-header">
            <div>
              <h2 className="admin-vigilancia-card-title">Resumen del módulo</h2>
              <p className="admin-readonly-card-copy">
                Vista solo lectura para administración. Desde aquí solo puedes observar el registro
                completo.
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
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={config.columns.length + 1} className="admin-vigilancia-empty-row">
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
