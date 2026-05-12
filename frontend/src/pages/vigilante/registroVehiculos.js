// Módulo operativo de vehículos visitantes.
// Permite registrar ingreso, editar datos y registrar la salida
// con cálculo de cobro según la tarifa del vigilante.
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import useSession from "../../hooks/useSession";
import InternalLayout from "../../layouts/InternalLayout";
import { getUserProfile } from "../../services/modules/userApi";
import { updateSessionProfile } from "../../services/sessionService";
import {
  createVehiculo,
  getVehiculos,
  getVigilanciaConfig,
  registerVehiculoSalida,
  updateVehiculo,
} from "../../services/modules/vigilanciaApi";
import "../../styles/vigilante/registroVehiculos.css";

const EMPTY_FORM = {
  propietario: "",
  documento: "",
  placa: "",
  telefono: "",
  torre: "",
  apartamento: "",
  parqueadero: "",
  tipo: "",
};

const MINUTES_PER_HOUR = 60;
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const SHIFT_STORAGE_KEY_PREFIX = "safehome_vigilancia_turno_";
const CURRENCY_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});
const WEEK_DAY_KEYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

const formatCurrency = (value) => CURRENCY_FORMATTER.format(Number(value) || 0);
const normalizeText = (value) => String(value || "").trim().toUpperCase();
const getDailyRateForDate = (date, baseRate, dailyRates = {}, chargeFlags = {}) => {
  const dayKey = WEEK_DAY_KEYS[date.getDay()];
  const hasChargeFlag = Object.prototype.hasOwnProperty.call(chargeFlags, dayKey);

  if (hasChargeFlag && chargeFlags[dayKey] === false) {
    return 0;
  }

  const dayRate = Number(dailyRates?.[dayKey]);
  const hasDailyRate = Object.prototype.hasOwnProperty.call(dailyRates, dayKey);

  if (hasDailyRate && dayRate === 0) {
    return 0;
  }

  return dayRate > 0 ? dayRate : Number(baseRate) || 0;
};
const createShiftState = () => ({
  startIso: new Date().toISOString(),
});
const getShiftStorageKey = (uid) => `${SHIFT_STORAGE_KEY_PREFIX}${uid || "anon"}`;

const getDateFromIso = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const buildDurationLabel = (durationMinutes) => {
  const totalMinutes = Math.max(1, durationMinutes);
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;

  if (!hours) {
    return `${minutes} min`;
  }

  if (!minutes) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
};

const calculateExitPreview = (vehicle, tarifaHora) => {
  const ingresoDate = getDateFromIso(vehicle.ingresoIso);

  if (!ingresoDate || !Number.isFinite(tarifaHora) || tarifaHora < 0) {
    return null;
  }

  const differenceMs = Math.max(Date.now() - ingresoDate.getTime(), 0);
  const durationMinutes = Math.max(1, Math.ceil(differenceMs / MILLISECONDS_PER_MINUTE));
  const billedHours = Math.max(1, Math.ceil(durationMinutes / MINUTES_PER_HOUR));

  return {
    duracionMinutos: durationMinutes,
    duracionTexto: buildDurationLabel(durationMinutes),
    horasCobradas: billedHours,
    valorCobrado: billedHours * tarifaHora,
  };
};

const formatDateTimeLabel = (value) => {
  const targetDate = getDateFromIso(value);

  if (!targetDate) {
    return "--";
  }

  return DATE_TIME_FORMATTER.format(targetDate);
};

const readStoredShift = (uid) => {
  if (!uid || typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getShiftStorageKey(uid));

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    const startDate = getDateFromIso(parsedValue?.startIso);

    if (!startDate) {
      return null;
    }

    return {
      startIso: startDate.toISOString(),
    };
  } catch (error) {
    return null;
  }
};

const persistShift = (uid, shift) => {
  if (!uid || typeof window === "undefined" || !shift?.startIso) {
    return;
  }

  window.localStorage.setItem(getShiftStorageKey(uid), JSON.stringify(shift));
};

const happenedDuringShift = (value, shiftStartIso) => {
  const targetDate = getDateFromIso(value);
  const shiftStartDate = getDateFromIso(shiftStartIso);

  if (!targetDate || !shiftStartDate) {
    return false;
  }

  return targetDate.getTime() >= shiftStartDate.getTime();
};

function VehicleModal({ isOpen, onClose, onSave, editingVehicle, loading, parkingOptions }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingVehicle) {
      setForm({
        propietario: editingVehicle.propietario || "",
        documento: editingVehicle.documento || "",
        placa: editingVehicle.placa || "",
        telefono: editingVehicle.telefono || "",
        torre: editingVehicle.torre || "",
        apartamento: editingVehicle.apartamento || "",
        parqueadero: editingVehicle.parqueadero || "",
        tipo: editingVehicle.tipo || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setErrors({});
  }, [editingVehicle, isOpen]);

  const validate = () => {
    const nextErrors = {};

    if (!form.propietario.trim()) nextErrors.propietario = "Requerido";
    if (!form.documento.trim()) nextErrors.documento = "Requerido";
    else if (!/^\d+$/.test(form.documento.trim())) nextErrors.documento = "Solo numeros";
    if (!form.placa.trim()) nextErrors.placa = "Requerido";
    if (!form.telefono.trim()) nextErrors.telefono = "Requerido";
    else if (!/^\d+$/.test(form.telefono.trim())) nextErrors.telefono = "Solo numeros";
    if (!form.torre.trim()) nextErrors.torre = "Requerido";
    if (!form.apartamento.trim()) nextErrors.apartamento = "Requerido";
    if (!form.parqueadero.trim()) {
      nextErrors.parqueadero = "Requerido";
    } else if (!parkingOptions.includes(form.parqueadero)) {
      nextErrors.parqueadero = `Debe estar entre 1 y ${parkingOptions.length}`;
    }
    if (!form.tipo) nextErrors.tipo = "Requerido";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  if (!isOpen) return null;

  return (
    <div className="guard-modal-overlay" onClick={onClose}>
      <div className="guard-modal-box" onClick={(event) => event.stopPropagation()}>
        <div className="modal-stripe" />
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">
              <i className="ph-light ph-car"></i>
            </div>
            <div>
              <p className="modal-title">
                {editingVehicle ? "Editar vehículo" : "Registrar vehículo"}
              </p>
              <p className="modal-subtitle">
                {editingVehicle
                  ? "Modifica los datos del vehículo"
                  : "Completa los datos del propietario"}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <i className="ph-light ph-x"></i>
          </button>
        </div>

        <hr className="modal-divider" />

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!validate()) return;
            onSave(form);
          }}
          className="modal-form"
        >
          <div className="form-row">
            <div className="form-group">
              <label>Propietario</label>
              <input
                value={form.propietario}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, propietario: event.target.value }))
                }
                placeholder="Nombre completo"
              />
              {errors.propietario && <span className="field-error">{errors.propietario}</span>}
            </div>

            <div className="form-group">
              <label>Documento</label>
              <input
                value={form.documento}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    documento: event.target.value.replace(/\D+/g, ""),
                  }))
                }
                inputMode="numeric"
                placeholder="Número de documento"
              />
              {errors.documento && <span className="field-error">{errors.documento}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Placa</label>
              <input
                value={form.placa}
                onChange={(event) => setForm((prev) => ({ ...prev, placa: event.target.value }))}
                placeholder="ABC123"
                className="input-placa"
              />
              {errors.placa && <span className="field-error">{errors.placa}</span>}
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                value={form.telefono}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    telefono: event.target.value.replace(/\D+/g, ""),
                  }))
                }
                inputMode="numeric"
                placeholder="Número de contacto"
              />
              {errors.telefono && <span className="field-error">{errors.telefono}</span>}
            </div>

            <div className="form-group">
              <label>Torre</label>
              <input
                value={form.torre}
                onChange={(event) => setForm((prev) => ({ ...prev, torre: event.target.value }))}
                placeholder="Torre"
              />
              {errors.torre && <span className="field-error">{errors.torre}</span>}
            </div>

            <div className="form-group">
              <label>Apartamento</label>
              <input
                value={form.apartamento}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, apartamento: event.target.value }))
                }
                placeholder="Apartamento"
              />
              {errors.apartamento && <span className="field-error">{errors.apartamento}</span>}
            </div>

            <div className="form-group">
              <label>Parqueadero</label>
              <select
                value={form.parqueadero}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, parqueadero: event.target.value }))
                }
              >
                <option value="">Seleccionar...</option>
                {parkingOptions.map((parkingOption) => (
                  <option key={parkingOption} value={parkingOption}>
                    {parkingOption}
                  </option>
                ))}
              </select>
              {errors.parqueadero && <span className="field-error">{errors.parqueadero}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de vehículo</label>
              <select
                value={form.tipo}
                onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))}
              >
                <option value="">Seleccionar...</option>
                <option value="Carro">Carro</option>
                <option value="Moto">Moto</option>
              </select>
              {errors.tipo && <span className="field-error">{errors.tipo}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Guardando..." : editingVehicle ? "Actualizar" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegistroVehiculos() {
  const session = useSession();
  const [vehicles, setVehicles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [exitingId, setExitingId] = useState(null);
  const [tarifaHoraActual, setTarifaHoraActual] = useState(Number(session?.tarifaHora) || 0);
  const [tarifasPorDiaActual, setTarifasPorDiaActual] = useState({});
  const [cobroPorDiaActual, setCobroPorDiaActual] = useState({});
  const [tarifaConfigLoaded, setTarifaConfigLoaded] = useState(false);
  const [cantidadParqueaderosActual, setCantidadParqueaderosActual] = useState(
    Number(session?.cantidadParqueaderos) || 0
  );
  const [searchPlaca, setSearchPlaca] = useState("");
  const [cashShift, setCashShift] = useState(null);

  const loadVehicles = async () => {
    try {
      const data = await getVehiculos();
      setVehicles(data);
    } catch (error) {
      setVehicles([]);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadTarifaConfig = useCallback(async () => {
    try {
      const config = await getVigilanciaConfig();

      setTarifaHoraActual(Number(config?.tarifaHoraVigilante) || 0);
      setTarifasPorDiaActual(config?.tarifasPorDia || {});
      setCobroPorDiaActual(config?.cobroPorDia || {});
    } catch (error) {
      setTarifaHoraActual(0);
      setTarifasPorDiaActual({});
      setCobroPorDiaActual({});
    } finally {
      setTarifaConfigLoaded(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    loadTarifaConfig();

    const refreshOnFocus = () => {
      if (active) {
        loadTarifaConfig();
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [loadTarifaConfig]);

  useEffect(() => {
    if (!session?.uid) {
      setCashShift(null);
      return;
    }

    const storedShift = readStoredShift(session.uid);
    const nextShift = storedShift || createShiftState();

    setCashShift(nextShift);
    persistShift(session.uid, nextShift);
  }, [session?.uid]);

  useEffect(() => {
    let active = true;
    const tarifaGuardada = Number(session?.tarifaHora);
    const cantidadGuardada = Number(session?.cantidadParqueaderos);

    if (
      Number.isFinite(tarifaGuardada) &&
      tarifaGuardada > 0 &&
      Number.isFinite(cantidadGuardada) &&
      cantidadGuardada > 0
    ) {
      setCantidadParqueaderosActual(cantidadGuardada);
      return () => {
        active = false;
      };
    }

    if (!session?.uid) {
      setCantidadParqueaderosActual(0);
      return () => {
        active = false;
      };
    }

    const loadTarifa = async () => {
      try {
        const profile = await getUserProfile(session.uid);
        const tarifaPerfil = Number(profile?.tarifaHora) || 0;

        if (!active) {
          return;
        }

        setCantidadParqueaderosActual(Number(profile?.cantidadParqueaderos) || 0);

        if (tarifaPerfil > 0 || Number(profile?.cantidadParqueaderos) > 0) {
          updateSessionProfile({
            cantidadParqueaderos: Number(profile?.cantidadParqueaderos) || 0,
          });
        }
      } catch (error) {
        if (active) {
          setCantidadParqueaderosActual(0);
        }
      }
    };

    loadTarifa();

    return () => {
      active = false;
    };
  }, [session?.uid, session?.tarifaHora, session?.cantidadParqueaderos]);

  const filteredVehicles = useMemo(() => {
    const placaBuscada = normalizeText(searchPlaca);

    if (!placaBuscada) {
      return vehicles;
    }

    return vehicles.filter((vehicle) => normalizeText(vehicle.placa).includes(placaBuscada));
  }, [vehicles, searchPlaca]);

  const activeVehicles = useMemo(
    () => filteredVehicles.filter((vehicle) => vehicle.estado !== "Salio"),
    [filteredVehicles]
  );

  const totalCarros = activeVehicles.filter((vehicle) => vehicle.tipo === "Carro").length;
  const totalMotos = activeVehicles.filter((vehicle) => vehicle.tipo === "Moto").length;
  const totalParqueaderosDisponibles = Math.max(
    cantidadParqueaderosActual - activeVehicles.length,
    0
  );
  const parkingOptions = useMemo(
    () =>
      Array.from({ length: Math.max(cantidadParqueaderosActual, 0) }, (_, index) =>
        String(index + 1)
      ),
    [cantidadParqueaderosActual]
  );
  const currentDayKey = WEEK_DAY_KEYS[new Date().getDay()];
  const tarifaHoraDelDia = useMemo(
    () => getDailyRateForDate(new Date(), tarifaHoraActual, tarifasPorDiaActual, cobroPorDiaActual),
    [tarifaHoraActual, tarifasPorDiaActual, cobroPorDiaActual]
  );
  const dailyRateLoaded = Object.prototype.hasOwnProperty.call(tarifasPorDiaActual, currentDayKey);
  const cobraTarifaHoy =
    cobroPorDiaActual[currentDayKey] !== false &&
    !(dailyRateLoaded && Number(tarifasPorDiaActual[currentDayKey]) === 0);
  const tarifaHoyLabel = !tarifaConfigLoaded
    ? "Cargando..."
    : cobraTarifaHoy
      ? formatCurrency(tarifaHoraDelDia)
      : "Sin cobro";

  const cashCloseItems = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.estado === "Salio" &&
          vehicle.vigilanteSalidaUid === session?.uid &&
          happenedDuringShift(vehicle.salidaIso, cashShift?.startIso)
      ),
    [vehicles, session?.uid, cashShift?.startIso]
  );

  const totalRecaudadoHoy = cashCloseItems.reduce(
    (accumulator, vehicle) => accumulator + (Number(vehicle.valorCobrado) || 0),
    0
  );
  const shiftStartedLabel = formatDateTimeLabel(cashShift?.startIso);

  const handleSave = async (formData) => {
    setLoadingForm(true);

    try {
      const payload = {
        ...formData,
        vigilanteUid: session?.uid || "",
      };

      if (editingVehicle) {
        await updateVehiculo(editingVehicle.id, payload);
      } else {
        await createVehiculo(payload);
      }

      await loadVehicles();
      setEditingVehicle(null);
      setModalOpen(false);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al guardar.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setLoadingForm(false);
    }
  };

  const handleExit = async (vehicle) => {
    if (!session?.uid) {
      Swal.fire({
        title: "Sesión no disponible",
        text: "No se pudo identificar al vigilante que registra la salida.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    const preview = calculateExitPreview(vehicle, tarifaHoraDelDia);

    const result = await Swal.fire({
      title: "Registrar salida",
      html: `
        <div style="text-align:left">
          <p><strong>Vehículo:</strong> ${vehicle.placa}</p>
          <p><strong>Propietario:</strong> ${vehicle.propietario}</p>
          <p><strong>Tarifa por hora:</strong> ${tarifaHoyLabel}</p>
          <p><strong>Tiempo parqueado:</strong> ${
            preview?.duracionTexto || "Se calculará al confirmar"
          }</p>
          <p><strong>Horas a cobrar:</strong> ${preview?.horasCobradas || "-"}</p>
          <p><strong>Valor a cobrar:</strong> ${
            preview ? formatCurrency(preview.valorCobrado) : "Se calculará al confirmar"
          }</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirmar salida",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#117a37",
      cancelButtonColor: "#460669",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setExitingId(vehicle.id);

    try {
      const response = await registerVehiculoSalida(vehicle.id, {
        vigilanteUid: session.uid,
      });

      await loadVehicles();

      Swal.fire({
        title: "Salida registrada",
        html: `
          <div style="text-align:left">
            <p><strong>Vehículo:</strong> ${response.vehiculo?.placa || vehicle.placa}</p>
            <p><strong>Tiempo cobrado:</strong> ${response.cobro?.duracionTexto || "-"}</p>
            <p><strong>Horas cobradas:</strong> ${response.cobro?.horasCobradas || "-"}</p>
            <p><strong>Total recibido:</strong> ${formatCurrency(response.cobro?.valorCobrado)}</p>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo registrar la salida.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setExitingId(null);
    }
  };

  const handleFinishShift = async () => {
    if (!session?.uid || !cashShift?.startIso) {
      return;
    }

    const result = await Swal.fire({
      title: "Terminar turno",
      html: `
        <div style="text-align:left">
          <p><strong>Inicio del turno:</strong> ${shiftStartedLabel}</p>
          <p><strong>Salidas registradas:</strong> ${cashCloseItems.length}</p>
          <p><strong>Total recaudado:</strong> ${formatCurrency(totalRecaudadoHoy)}</p>
          <p>Al confirmar, el cuadre se reiniciar&aacute; y empezar&aacute; un nuevo turno.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Terminar turno",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b42318",
      cancelButtonColor: "#460669",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    const nextShift = createShiftState();
    persistShift(session.uid, nextShift);
    setCashShift(nextShift);

    Swal.fire({
      title: "Turno finalizado",
      html: `
        <div style="text-align:left">
          <p><strong>Salidas cerradas:</strong> ${cashCloseItems.length}</p>
          <p><strong>Total cerrado:</strong> ${formatCurrency(totalRecaudadoHoy)}</p>
          <p><strong>Nuevo turno iniciado:</strong> ${formatDateTimeLabel(nextShift.startIso)}</p>
        </div>
      `,
      icon: "success",
      confirmButtonColor: "#460669",
    });
  };

  return (
    <InternalLayout>
      <main className="content guard-module-page">
        <header className="guard-module-page-header">
          <div>
            <h1 className="internal-page-title">Registro de vehículos visitantes</h1>
            <p className="guard-module-page-copy">
              Controla el ingreso, la salida y el cobro de carros y motos desde una vista clara y
              operativa para tu turno.
            </p>
          </div>

          <div className="guard-module-summary">
            <span>Vehículos visibles</span>
            <strong>{filteredVehicles.length}</strong>
          </div>
        </header>

        <section className="card guard-module-surface">
          <div className="card-header guard-module-card-header">
            <div className="guard-module-head-copy">
              <h2 className="card-title">Resumen operativo</h2>
              <p className="guard-module-card-copy">
                Consulta, crea, edita y registra la salida de los vehículos visitantes con su
                cobro correspondiente.
              </p>
            </div>

            <div className="guard-module-header-tools">
              <div className="vehicle-counters">
                <div className="counter-card">
                  <div className="counter-icon car">
                    <i className="ph-light ph-car"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{totalCarros}</span>
                    <span className="counter-label">Carros activos</span>
                  </div>
                </div>

                <div className="counter-card">
                  <div className="counter-icon moto">
                    <i className="ph-light ph-motorcycle"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{totalMotos}</span>
                    <span className="counter-label">Motos activas</span>
                  </div>
                </div>

                <div className="counter-card">
                  <div className="counter-icon parking">
                    <i className="ph-light ph-square-half"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{totalParqueaderosDisponibles}</span>
                    <span className="counter-label">Parqueaderos disponibles</span>
                  </div>
                </div>

                <div className="counter-card">
                  <div className="counter-icon">
                    <i className="ph-light ph-money"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{tarifaHoyLabel}</span>
                    <span className="counter-label">Tarifa de hoy</span>
                  </div>
                </div>
              </div>

              <button type="button" className="register-btn" onClick={() => setModalOpen(true)}>
                <span>
                  Registrar nuevo
                  <br />
                  vehículo
                </span>
                <span className="plus-sq"></span>
              </button>
            </div>
          </div>

          <div className="guard-module-filters">
            <div className="guard-module-search">
              <i className="ph-light ph-magnifying-glass"></i>
              <input
                type="text"
                value={searchPlaca}
                onChange={(event) => setSearchPlaca(event.target.value)}
                placeholder="Buscar por placa"
              />
            </div>
          </div>

          {cobraTarifaHoy && !tarifaHoraDelDia && (
            <div className="cash-close-alert">
              El vigilante no tiene una tarifa por hora cargada en la sesión. Si acabas de
              configurarla, vuelve a iniciar sesión para aplicar el cobro correctamente.
            </div>
          )}

          <div className="guard-module-table-wrap">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Propietario</th>
                  <th>Documento</th>
                  <th>Placa</th>
                  <th>Teléfono</th>
                  <th>Torre</th>
                  <th>Apto</th>
                  <th>Parqueadero</th>
                  <th>Ingreso</th>
                  <th>Salida</th>
                  <th>Estado</th>
                  <th>Cobro</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="guard-module-empty-row">
                      No hay vehículos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>
                        <div className={`tipo-icon ${vehicle.tipo === "Moto" ? "moto" : "car"}`}>
                          <i
                            className={`ph-light ${
                              vehicle.tipo === "Moto" ? "ph-motorcycle" : "ph-car"
                            }`}
                          ></i>
                        </div>
                      </td>
                      <td>{vehicle.propietario}</td>
                      <td>{vehicle.documento}</td>
                      <td>{vehicle.placa}</td>
                      <td>{vehicle.telefono}</td>
                      <td>{vehicle.torre}</td>
                      <td>{vehicle.apartamento}</td>
                      <td>{String(vehicle.parqueadero || "--")}</td>
                      <td>
                        {vehicle.fechaIngreso || vehicle.fecha} {vehicle.horaIngreso || vehicle.hora}
                      </td>
                      <td>
                        {vehicle.fechaSalida ? `${vehicle.fechaSalida} ${vehicle.horaSalida}` : "--"}
                      </td>
                      <td>
                        <span
                          className={`vehicle-status ${
                            vehicle.estado === "Salio" ? "is-exited" : "is-active"
                          }`}
                        >
                          {vehicle.estado === "Salio" ? "Salió" : "Activo"}
                        </span>
                      </td>
                      <td className="vehicle-cobro">
                        {vehicle.estado === "Salio" ? formatCurrency(vehicle.valorCobrado) : "--"}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            type="button"
                            className="action-icon-btn"
                            disabled={vehicle.estado === "Salio"}
                            onClick={() => {
                              setEditingVehicle(vehicle);
                              setModalOpen(true);
                            }}
                            title="Editar vehículo"
                          >
                            <i className="ph-light ph-pencil-simple"></i>
                          </button>
                          <button
                            type="button"
                            className={`action-icon-btn exit ${
                              vehicle.estado === "Salio" ? "is-complete" : ""
                            }`}
                            disabled={vehicle.estado === "Salio" || exitingId === vehicle.id}
                            onClick={() => handleExit(vehicle)}
                            title={
                              vehicle.estado === "Salio"
                                ? "Salida ya registrada"
                                : "Registrar salida"
                            }
                          >
                            {exitingId === vehicle.id ? (
                              "..."
                            ) : vehicle.estado === "Salio" ? (
                              <i className="ph-light ph-check"></i>
                            ) : (
                              <i className="ph-light ph-sign-out"></i>
                            )}
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

        <section className="card guard-module-surface cash-close-surface">
          <div className="card-header guard-module-card-header">
            <div className="guard-module-head-copy">
              <h2 className="card-title">Cuadre de caja del día</h2>
              <p className="guard-module-card-copy">
                Este resumen se reinicia automáticamente cada día y solo muestra las salidas que
                registraste en tu turno.
              </p>
            </div>

            <div className="vehicle-counters">
              <div className="counter-card">
                <div className="counter-icon">
                  <i className="ph-light ph-receipt"></i>
                </div>
                <div className="counter-info">
                  <span className="counter-number">{cashCloseItems.length}</span>
                  <span className="counter-label">Salidas del turno</span>
                </div>
              </div>

              <div className="counter-card">
                <div className="counter-icon">
                  <i className="ph-light ph-clock-countdown"></i>
                </div>
                <div className="counter-info">
                  <span className="counter-number counter-number-shift">{shiftStartedLabel}</span>
                  <span className="counter-label">Inicio del turno</span>
                </div>
              </div>

              <div className="counter-card">
                <div className="counter-icon">
                  <i className="ph-light ph-wallet"></i>
                </div>
                <div className="counter-info">
                  <span className="counter-number">{formatCurrency(totalRecaudadoHoy)}</span>
                  <span className="counter-label">Total recaudado</span>
                </div>
              </div>

              <button type="button" className="shift-close-btn" onClick={handleFinishShift}>
                Terminar turno
              </button>
            </div>
          </div>

          <div className="guard-module-table-wrap">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Propietario</th>
                  <th>Duración</th>
                  <th>Horas cobradas</th>
                  <th>Tarifa</th>
                  <th>Valor pagado</th>
                  <th>Hora de salida</th>
                </tr>
              </thead>
              <tbody>
                {cashCloseItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="guard-module-empty-row">
                      Aún no has registrado salidas con cobro hoy.
                    </td>
                  </tr>
                ) : (
                  cashCloseItems.map((vehicle) => (
                    <tr key={`${vehicle.id}-cash`}>
                      <td>{vehicle.placa}</td>
                      <td>{vehicle.propietario}</td>
                      <td>{vehicle.duracionTexto || buildDurationLabel(vehicle.duracionMinutos)}</td>
                      <td>{vehicle.horasCobradas || "-"}</td>
                      <td>{formatCurrency(vehicle.tarifaHoraAplicada)}</td>
                      <td className="vehicle-cobro">{formatCurrency(vehicle.valorCobrado)}</td>
                      <td>{vehicle.horaSalida || "--"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <VehicleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingVehicle(null);
        }}
        onSave={handleSave}
        editingVehicle={editingVehicle}
        loading={loadingForm}
        parkingOptions={parkingOptions}
      />
    </InternalLayout>
  );
}
