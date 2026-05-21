import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import AdminVigilanciaSectionPage from "../../components/admin/AdminVigilanciaSectionPage";
import ParkingVisualizerModal from "../../components/vigilancia/ParkingVisualizerModal";
import useSession from "../../hooks/useSession";
import {
  getVehiculos,
  getVigilanciaConfig,
  updateVigilanciaConfig,
  updateVigilanciaParkingConfig,
} from "../../services/modules/vigilanciaApi";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => (Number(value) ? currencyFormatter.format(value) : "$0");

const weekDays = [
  { key: "lunes", label: "Lun", name: "lunes" },
  { key: "martes", label: "Mar", name: "martes" },
  { key: "miercoles", label: "Mie", name: "miercoles" },
  { key: "jueves", label: "Jue", name: "jueves" },
  { key: "viernes", label: "Vie", name: "viernes" },
  { key: "sabado", label: "Sab", name: "sabado" },
  { key: "domingo", label: "Dom", name: "domingo" },
];

const buildDailyRates = (baseRate = 0, currentRates = {}, chargeFlags = {}) =>
  weekDays.reduce((rates, day) => {
    const dayRate = Number(currentRates?.[day.key]);
    const hasDayRate = Object.prototype.hasOwnProperty.call(currentRates || {}, day.key);

    if (chargeFlags?.[day.key] === false || (hasDayRate && dayRate === 0)) {
      rates[day.key] = "0";
      return rates;
    }

    rates[day.key] = dayRate > 0 ? String(dayRate) : baseRate > 0 ? String(baseRate) : "";
    return rates;
  }, {});

const buildDailyChargeFlags = (currentFlags = {}, currentRates = {}) =>
  weekDays.reduce((flags, day) => {
    const hasDayRate = Object.prototype.hasOwnProperty.call(currentRates || {}, day.key);
    flags[day.key] = currentFlags?.[day.key] !== false && !(hasDayRate && Number(currentRates?.[day.key]) === 0);
    return flags;
  }, {});

const getFirstChargeableRate = (rates, chargeFlags) => {
  const chargeableDay = weekDays.find((day) => chargeFlags[day.key] !== false);
  return Number(rates?.[chargeableDay?.key]) || 0;
};

function VigilanciaTarifaPanel({ vehicles = [] }) {
  const session = useSession();
  const [tarifaActual, setTarifaActual] = useState(0);
  const [cantidadParqueaderosCarroActual, setCantidadParqueaderosCarroActual] = useState(0);
  const [cantidadParqueaderosMotoActual, setCantidadParqueaderosMotoActual] = useState(0);
  const [tarifaInput, setTarifaInput] = useState("");
  const [tarifasPorDia, setTarifasPorDia] = useState(() => buildDailyRates());
  const [cobroPorDia, setCobroPorDia] = useState(() => buildDailyChargeFlags());
  const [selectedDayKey, setSelectedDayKey] = useState("lunes");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parkingModalOpen, setParkingModalOpen] = useState(false);
  const [savingParking, setSavingParking] = useState(false);
  const draftRef = useRef({
    tarifasPorDia: buildDailyRates(),
    cobroPorDia: buildDailyChargeFlags(),
  });
  const selectedDay = weekDays.find((day) => day.key === selectedDayKey) || weekDays[0];
  const selectedDayCharges = cobroPorDia[selectedDayKey] !== false;

  const applyConfigState = useCallback((config = {}) => {
    const nextTarifa = Number(config?.tarifaHoraVigilante) || 0;
    const nextChargeFlags = buildDailyChargeFlags(config?.cobroPorDia, config?.tarifasPorDia);
    const nextRates = buildDailyRates(nextTarifa, config?.tarifasPorDia, nextChargeFlags);

    draftRef.current = {
      tarifasPorDia: nextRates,
      cobroPorDia: nextChargeFlags,
    };
    setTarifaActual(nextTarifa);
    const carParkings = Number(config?.cantidadParqueaderosCarro);
    setCantidadParqueaderosCarroActual(
      Number.isFinite(carParkings) ? carParkings : Number(config?.cantidadParqueaderos) || 0
    );
    setCantidadParqueaderosMotoActual(Number(config?.cantidadParqueaderosMoto) || 0);
    setTarifasPorDia(nextRates);
    setCobroPorDia(nextChargeFlags);
    setTarifaInput(nextRates.lunes || "");
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const config = await getVigilanciaConfig();
      applyConfigState(config);
    } catch (error) {
      setTarifaActual(0);
      setCantidadParqueaderosCarroActual(0);
      setCantidadParqueaderosMotoActual(0);
      setTarifaInput("");
      const emptyRates = buildDailyRates();
      const emptyChargeFlags = buildDailyChargeFlags();

      draftRef.current = {
        tarifasPorDia: emptyRates,
        cobroPorDia: emptyChargeFlags,
      };
      setTarifasPorDia(emptyRates);
      setCobroPorDia(emptyChargeFlags);
    } finally {
      setLoading(false);
    }
  }, [applyConfigState]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    setTarifaInput(tarifasPorDia[selectedDayKey] || "");
  }, [selectedDayKey, tarifasPorDia]);

  const handleChargeToggle = (checked) => {
    const nextRates = {
      ...draftRef.current.tarifasPorDia,
      [selectedDayKey]: checked
        ? draftRef.current.tarifasPorDia[selectedDayKey] &&
          draftRef.current.tarifasPorDia[selectedDayKey] !== "0"
          ? draftRef.current.tarifasPorDia[selectedDayKey]
          : String(tarifaActual || "")
        : "0",
    };
    const nextChargeFlags = {
      ...draftRef.current.cobroPorDia,
      [selectedDayKey]: checked,
    };

    draftRef.current = {
      tarifasPorDia: nextRates,
      cobroPorDia: nextChargeFlags,
    };
    setTarifasPorDia(nextRates);
    setCobroPorDia(nextChargeFlags);
    setTarifaInput(nextRates[selectedDayKey] || "");
  };

  const handleRateChange = (value) => {
    const nextRates = {
      ...draftRef.current.tarifasPorDia,
      [selectedDayKey]: value,
    };

    draftRef.current = {
      ...draftRef.current,
      tarifasPorDia: nextRates,
    };
    setTarifaInput(value);
    setTarifasPorDia(nextRates);
  };

  const handleSave = async () => {
    const currentDraft = draftRef.current;
    const selectedRate = Number(String(currentDraft.tarifasPorDia[selectedDayKey] || "").replace(",", "."));
    const nextRateInputs = {
      ...currentDraft.tarifasPorDia,
      [selectedDayKey]: currentDraft.tarifasPorDia[selectedDayKey],
    };
    const parsedDailyRates = weekDays.reduce((rates, day) => {
      rates[day.key] =
        currentDraft.cobroPorDia[day.key] === false
          ? 0
          : Number(String(nextRateInputs[day.key] || "").replace(",", "."));
      return rates;
    }, {});

    if (currentDraft.cobroPorDia[selectedDayKey] !== false && (!Number.isFinite(selectedRate) || selectedRate <= 0)) {
      Swal.fire({
        title: "Tarifa invalida",
        text: "Ingresa una tarifa mayor a 0 para el dia seleccionado.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    const hasInvalidDailyRate = weekDays.some(
      (day) =>
        currentDraft.cobroPorDia[day.key] !== false &&
        (!Number.isFinite(parsedDailyRates[day.key]) || parsedDailyRates[day.key] <= 0)
    );

    if (hasInvalidDailyRate) {
      Swal.fire({
        title: "Tarifa diaria invalida",
        text: "Completa una tarifa mayor a 0 para cada dia que tenga cobro.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    const nextBaseRate =
      getFirstChargeableRate(parsedDailyRates, currentDraft.cobroPorDia) || Number(tarifaActual) || 1;

    setSaving(true);

    try {
      const updatedConfig = await updateVigilanciaConfig({
        tarifaHoraVigilante: nextBaseRate,
        tarifasPorDia: parsedDailyRates,
        cobroPorDia: currentDraft.cobroPorDia,
        updatedByUid: session?.uid || "",
        updatedByName: session?.nombre || "Administracion",
      });

      applyConfigState(updatedConfig);

      Swal.fire({
        title: "Tarifa actualizada",
        text: "La configuracion quedo disponible para los cobros de vehiculos.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo actualizar la tarifa de vigilancia.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveParking = async (nextTotals) => {
    setSavingParking(true);

    try {
      const updatedConfig = await updateVigilanciaParkingConfig({
        cantidadParqueaderosCarro: nextTotals.carro,
        cantidadParqueaderosMoto: nextTotals.moto,
        updatedByUid: session?.uid || "",
        updatedByName: session?.nombre || "Administracion",
      });

      applyConfigState(updatedConfig);

      Swal.fire({
        title: "Parqueaderos actualizados",
        text: "La cantidad quedo disponible para vigilancia y administracion.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo actualizar la cantidad de parqueaderos.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setSavingParking(false);
    }
  };

  return (
    <>
      <section className="admin-vigilancia-settings-panel">
        <div className="admin-vigilancia-settings-copy">
          <span className="admin-vigilancia-settings-kicker">Configuracion</span>
          <h2>Tarifa de parqueadero visitante</h2>
          <p>
            Define desde administracion el valor por hora que usara vigilancia al registrar la salida
            de vehiculos.
          </p>

          <div className="admin-vigilancia-week-rates">
            {weekDays.map((day) => {
              const dayCharges = cobroPorDia[day.key] !== false;
              return (
                <button
                  key={day.key}
                  type="button"
                  className={`admin-vigilancia-day-rate ${
                    selectedDayKey === day.key ? "is-selected" : ""
                  } ${dayCharges ? "" : "is-disabled"}`}
                  onClick={() => setSelectedDayKey(day.key)}
                >
                  <span>{day.label}</span>
                  <strong>{dayCharges ? formatCurrency(tarifasPorDia[day.key]) : "Sin cobro"}</strong>
                </button>
              );
            })}
          </div>
        </div>

        <div className="admin-vigilancia-settings-card">
          <div className="admin-vigilancia-settings-current">
            <span>Tarifa del dia seleccionado</span>
            <strong>
              {loading
                ? "Cargando..."
                : selectedDayCharges
                  ? formatCurrency(tarifasPorDia[selectedDayKey])
                  : "Sin cobro"}
            </strong>
          </div>

          <div className="admin-vigilancia-settings-form">
            <label className="admin-vigilancia-charge-toggle">
              <input
                type="checkbox"
                checked={selectedDayCharges}
                onChange={(event) => handleChargeToggle(event.target.checked)}
              />
              Cobrar tarifa este dia
            </label>

            <label>
              Nueva tarifa para {selectedDay.name}
              <input
                type="number"
                min="1"
                step="1"
                value={tarifaInput}
                onChange={(event) => handleRateChange(event.target.value)}
                placeholder="Ej. 5000"
                disabled={!selectedDayCharges}
              />
            </label>

            <button type="button" onClick={handleSave} disabled={saving || loading}>
              {saving ? "Guardando..." : "Guardar tarifa"}
            </button>

            <button
              type="button"
              className="parking-view-btn admin-parking-view-btn"
              onClick={() => setParkingModalOpen(true)}
            >
              <i className="ph-light ph-car-profile" aria-hidden="true"></i>
              <span>Visualizar Parqueaderos</span>
            </button>
          </div>
        </div>
      </section>

      <ParkingVisualizerModal
        isOpen={parkingModalOpen}
        onClose={() => setParkingModalOpen(false)}
        totalCarParkings={cantidadParqueaderosCarroActual}
        totalMotoParkings={cantidadParqueaderosMotoActual}
        vehicles={vehicles}
        canEdit
        saving={savingParking}
        onSaveTotal={handleSaveParking}
      />
    </>
  );
}

const config = {
  title: "Ingreso de vehiculos",
  icon: "ph-car",
  loadItems: getVehiculos,
  emptyMessage: "No hay vehiculos registrados.",
  renderBeforeSurface: ({ items }) => <VigilanciaTarifaPanel vehicles={items} />,
  filters: [
    {
      key: "placa",
      label: "Placa",
      placeholder: "Buscar por placa",
      icon: "ph-magnifying-glass",
    },
  ],
  columns: [
    { key: "estado", label: "Estado" },
    { key: "tipo", label: "Tipo" },
    { key: "propietario", label: "Propietario" },
    { key: "placa", label: "Placa" },
    { key: "torre", label: "Torre" },
    { key: "apartamento", label: "Apartamento" },
    { key: "parqueadero", label: "Parqueadero" },
    {
      key: "vigilanteRegistroNombre",
      label: "Vigilante ingreso",
      render: (item) => item.vigilanteRegistroNombre || "--",
    },
    {
      key: "fechaIngreso",
      label: "Ingreso",
      render: (item) => [item.fechaIngreso, item.horaIngreso].filter(Boolean).join(" "),
    },
    {
      key: "fechaSalida",
      label: "Salida",
      render: (item) =>
        item.estado === "Salio"
          ? [item.fechaSalida, item.horaSalida].filter(Boolean).join(" ")
          : "--",
    },
    {
      key: "valorCobrado",
      label: "Cobro",
      render: (item) => (item.estado === "Salio" ? formatCurrency(item.valorCobrado) : "--"),
    },
    {
      key: "vigilanteSalidaNombre",
      label: "Vigilante salida",
      render: (item) => item.vigilanteSalidaNombre || "--",
    },
  ],
  detailFields: [
    { key: "estado", label: "Estado" },
    { key: "tipo", label: "Tipo de vehiculo" },
    { key: "propietario", label: "Propietario" },
    { key: "documento", label: "Documento" },
    { key: "placa", label: "Placa" },
    { key: "telefono", label: "Telefono" },
    { key: "torre", label: "Torre" },
    { key: "apartamento", label: "Apartamento" },
    { key: "parqueadero", label: "Parqueadero" },
    { key: "fechaIngreso", label: "Fecha de ingreso" },
    { key: "horaIngreso", label: "Hora de ingreso" },
    { key: "fechaSalida", label: "Fecha de salida" },
    { key: "horaSalida", label: "Hora de salida" },
    { key: "duracionTexto", label: "Tiempo parqueado" },
    { key: "horasCobradas", label: "Horas cobradas" },
    {
      key: "valorCobrado",
      label: "Valor cobrado",
      renderValue: (item) =>
        item.estado === "Salio" ? formatCurrency(item.valorCobrado) : "Sin cobro",
    },
    { key: "vigilanteRegistroNombre", label: "Vigilante registro" },
    { key: "vigilanteSalidaNombre", label: "Vigilante salida" },
  ],
  getCounters(items) {
    return [
      {
        label: "Activos",
        value: items.filter((item) => item.estado !== "Salio").length,
        icon: "ph-car-profile",
        variant: "car",
      },
      {
        label: "Salidos",
        value: items.filter((item) => item.estado === "Salio").length,
        icon: "ph-sign-out",
        variant: "moto",
      },
      {
        label: "Recaudo",
        value: formatCurrency(
          items.reduce((total, item) => total + (Number(item.valorCobrado) || 0), 0)
        ),
        icon: "ph-wallet",
        variant: "moto",
      },
    ];
  },
};

config.detailFields = config.detailFields.map((field) => ({
  ...field,
  getValue: field.renderValue,
}));

export default function AdminVigilanciaVehiculos() {
  return <AdminVigilanciaSectionPage config={config} />;
}
