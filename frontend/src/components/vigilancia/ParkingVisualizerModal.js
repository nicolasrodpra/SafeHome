import { useEffect, useMemo, useState } from "react";
import "../../styles/shared/parkingVisualizer.css";

const PARKING_COLUMNS = 6;
const VEHICLE_TYPES = {
  Carro: {
    key: "Carro",
    label: "Carros",
    singleLabel: "carro",
    icon: "ph-car",
  },
  Moto: {
    key: "Moto",
    label: "Motos",
    singleLabel: "moto",
    icon: "ph-motorcycle",
  },
};

const normalizeParkingNumber = (value) => {
  const parsedValue = Number.parseInt(String(value || "").trim(), 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
};

const normalizeVehicleType = (value) => (value === "Moto" ? "Moto" : "Carro");

const getActiveVehicles = (vehicles = []) =>
  vehicles.filter((vehicle) => vehicle?.estado !== "Salio");

const buildOccupiedMapByType = (vehicles = []) =>
  getActiveVehicles(vehicles).reduce(
    (groups, vehicle) => {
      const parkingNumber = normalizeParkingNumber(vehicle.parqueadero);

      if (!parkingNumber) {
        return groups;
      }

      const vehicleType = normalizeVehicleType(vehicle.tipo);
      const currentVehicle = groups[vehicleType].get(parkingNumber);

      groups[vehicleType].set(
        parkingNumber,
        currentVehicle ? { ...currentVehicle, duplicated: true } : vehicle
      );
      return groups;
    },
    {
      Carro: new Map(),
      Moto: new Map(),
    }
  );

const buildSlots = ({ totalParkings, occupiedMap }) => {
  const highestOccupiedSlot = Math.max(0, ...Array.from(occupiedMap.keys()));
  const visibleSlots = Math.max(totalParkings, highestOccupiedSlot);

  return Array.from({ length: visibleSlots }, (_, index) => {
    const number = index + 1;
    const vehicle = occupiedMap.get(number);

    if (vehicle) {
      return {
        number,
        status: "occupied",
        vehicle,
      };
    }

    return {
      number,
      status: "available",
      vehicle: null,
    };
  });
};

const buildDetailRows = (vehicle) => [
  { label: "Tipo", value: vehicle?.tipo },
  { label: "Placa", value: vehicle?.placa },
  { label: "Propietario", value: vehicle?.propietario },
  { label: "Documento", value: vehicle?.documento },
  { label: "Telefono", value: vehicle?.telefono },
  {
    label: "Ubicacion",
    value: [vehicle?.torre ? `Torre ${vehicle.torre}` : "", vehicle?.apartamento ? `Apto ${vehicle.apartamento}` : ""]
      .filter(Boolean)
      .join(" / "),
  },
  {
    label: "Ingreso",
    value: [vehicle?.fechaIngreso || vehicle?.fecha, vehicle?.horaIngreso || vehicle?.hora]
      .filter(Boolean)
      .join(" "),
  },
  { label: "Vigilante ingreso", value: vehicle?.vigilanteRegistroNombre },
  { label: "Vigilante salida", value: vehicle?.vigilanteSalidaNombre },
];

export default function ParkingVisualizerModal({
  isOpen,
  onClose,
  totalParkings,
  totalCarParkings,
  totalMotoParkings,
  vehicles = [],
  canEdit = false,
  saving = false,
  onSaveTotal,
}) {
  const legacyTotal = normalizeParkingNumber(totalParkings);
  const normalizedCarTotal = normalizeParkingNumber(totalCarParkings) || legacyTotal;
  const normalizedMotoTotal = normalizeParkingNumber(totalMotoParkings);
  const [draftCarTotal, setDraftCarTotal] = useState("");
  const [draftMotoTotal, setDraftMotoTotal] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftCarTotal(normalizedCarTotal ? String(normalizedCarTotal) : "");
    setDraftMotoTotal(normalizedMotoTotal ? String(normalizedMotoTotal) : "");
    setSelectedVehicle(null);
    setError("");
  }, [isOpen, normalizedCarTotal, normalizedMotoTotal]);

  const occupiedMaps = useMemo(() => buildOccupiedMapByType(vehicles), [vehicles]);
  const sections = useMemo(
    () =>
      [
        {
          ...VEHICLE_TYPES.Carro,
          total: normalizedCarTotal,
          occupiedMap: occupiedMaps.Carro,
        },
        {
          ...VEHICLE_TYPES.Moto,
          total: normalizedMotoTotal,
          occupiedMap: occupiedMaps.Moto,
        },
      ].map((section) => {
        const slots = buildSlots({
          totalParkings: section.total,
          occupiedMap: section.occupiedMap,
        });

        return {
          ...section,
          slots,
          occupiedCount: section.occupiedMap.size,
          availableCount: slots.filter((slot) => slot.status === "available").length,
        };
      }),
    [normalizedCarTotal, normalizedMotoTotal, occupiedMaps]
  );
  const summary = sections.reduce(
    (totals, section) => ({
      total: totals.total + section.total,
      occupied: totals.occupied + section.occupiedCount,
      available: totals.available + section.availableCount,
    }),
    { total: 0, occupied: 0, available: 0 }
  );

  const handleSave = (event) => {
    event.preventDefault();

    const nextCarTotal = normalizeParkingNumber(draftCarTotal);
    const nextMotoTotal = normalizeParkingNumber(draftMotoTotal);

    if (nextCarTotal + nextMotoTotal <= 0) {
      setError("Configura al menos un parqueadero para carro o moto.");
      return;
    }

    setError("");
    onSaveTotal?.({
      carro: nextCarTotal,
      moto: nextMotoTotal,
      total: nextCarTotal + nextMotoTotal,
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="parking-visualizer-overlay" onClick={onClose}>
      <section className="parking-visualizer-modal" onClick={(event) => event.stopPropagation()}>
        <div className="parking-visualizer-stripe" />

        <header className="parking-visualizer-header">
          <div className="parking-visualizer-title-row">
            <div className="parking-visualizer-icon">
              <i className="ph-light ph-car-profile" aria-hidden="true"></i>
            </div>
            <div>
              <p className="parking-visualizer-title">Parqueaderos visitantes</p>
              <p className="parking-visualizer-subtitle">Mapa operativo por tipo de vehiculo</p>
            </div>
          </div>

          <button
            type="button"
            className="parking-visualizer-close"
            onClick={onClose}
            aria-label="Cerrar visualizacion de parqueaderos"
          >
            <i className="ph-light ph-x" aria-hidden="true"></i>
          </button>
        </header>

        <div className="parking-visualizer-body">
          <div className="parking-visualizer-summary">
            <article>
              <span>Total</span>
              <strong>{summary.total || "--"}</strong>
            </article>
            <article>
              <span>Ocupados</span>
              <strong>{summary.occupied}</strong>
            </article>
            <article>
              <span>Disponibles</span>
              <strong>{summary.available}</strong>
            </article>
          </div>

          {canEdit ? (
            <form className="parking-visualizer-form" onSubmit={handleSave}>
              <label>
                Parqueaderos para carros
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draftCarTotal}
                  onChange={(event) => {
                    setDraftCarTotal(event.target.value.replace(/\D+/g, ""));
                    setError("");
                  }}
                  placeholder="Ej. 20"
                  disabled={saving}
                />
              </label>
              <label>
                Parqueaderos para motos
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draftMotoTotal}
                  onChange={(event) => {
                    setDraftMotoTotal(event.target.value.replace(/\D+/g, ""));
                    setError("");
                  }}
                  placeholder="Ej. 12"
                  disabled={saving}
                />
              </label>
              <button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cupos"}
              </button>
              {error ? <p className="parking-visualizer-error">{error}</p> : null}
            </form>
          ) : null}

          <div className="parking-visualizer-legend">
            <span className="is-occupied">Ocupado</span>
            <span className="is-available">Disponible</span>
          </div>

          <div className="parking-visualizer-sections">
            {sections.map((section) => (
              <article key={section.key} className={`parking-visualizer-section is-${section.key.toLowerCase()}`}>
                <div className="parking-visualizer-section-head">
                  <div>
                    <i className={`ph-light ${section.icon}`} aria-hidden="true"></i>
                    <h3>{section.label}</h3>
                  </div>
                  <span>
                    {section.availableCount} disponibles / {section.total || 0} cupos
                  </span>
                </div>

                <div
                  className="parking-visualizer-grid"
                  style={{ "--parking-columns": PARKING_COLUMNS }}
                >
                  {section.slots.map((slot) => {
                    const title =
                      slot.status === "occupied"
                        ? `${section.singleLabel} ${slot.number} ocupado por ${slot.vehicle?.placa || "vehiculo"}`
                        : `${section.singleLabel} ${slot.number} disponible`;

                    return (
                      <button
                        key={`${section.key}-${slot.number}`}
                        type="button"
                        className={`parking-visualizer-seat is-${slot.status}`}
                        title={title}
                        disabled={!slot.vehicle}
                        onClick={() => setSelectedVehicle(slot.vehicle)}
                      >
                        <i className={`ph-light ${section.icon}`} aria-hidden="true"></i>
                        <strong>{slot.number}</strong>
                        {slot.vehicle?.placa ? <small>{slot.vehicle.placa}</small> : null}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>

          {selectedVehicle ? (
            <aside className="parking-vehicle-detail">
              <div className="parking-vehicle-detail-head">
                <div>
                  <span>Vehiculo parqueado</span>
                  <strong>{selectedVehicle.placa || "Sin placa"}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  aria-label="Cerrar detalle del vehiculo"
                >
                  <i className="ph-light ph-x" aria-hidden="true"></i>
                </button>
              </div>

              <div className="parking-vehicle-detail-grid">
                {buildDetailRows(selectedVehicle).map((row) => (
                  <div key={row.label}>
                    <span>{row.label}</span>
                    <strong>{row.value || "Sin dato"}</strong>
                  </div>
                ))}
              </div>
            </aside>
          ) : null}

        </div>
      </section>
    </div>
  );
}
