import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import useSession from "../../hooks/useSession";
import InternalLayout from "../../layouts/InternalLayout";
import { getUserProfile } from "../../services/modules/userApi";
import { updateSessionProfile } from "../../services/sessionService";
import {
  createVehiculo,
  getVehiculos,
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
  tipo: "",
};

const MINUTES_PER_HOUR = 60;
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const CURRENCY_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => CURRENCY_FORMATTER.format(Number(value) || 0);
const normalizeText = (value) => String(value || "").trim().toUpperCase();

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

  if (!ingresoDate || !Number.isFinite(tarifaHora) || tarifaHora <= 0) {
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

const isToday = (value) => {
  const targetDate = getDateFromIso(value);

  if (!targetDate) {
    return false;
  }

  const now = new Date();

  return (
    targetDate.getFullYear() === now.getFullYear() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getDate() === now.getDate()
  );
};

function VehicleModal({ isOpen, onClose, onSave, editingVehicle, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingVehicle) {
      setForm({
        propietario: editingVehicle.propietario,
        documento: editingVehicle.documento,
        placa: editingVehicle.placa,
        telefono: editingVehicle.telefono,
        torre: editingVehicle.torre,
        apartamento: editingVehicle.apartamento,
        tipo: editingVehicle.tipo,
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
    if (!form.placa.trim()) nextErrors.placa = "Requerido";
    if (!form.telefono.trim()) nextErrors.telefono = "Requerido";
    if (!form.torre.trim()) nextErrors.torre = "Requerido";
    if (!form.apartamento.trim()) nextErrors.apartamento = "Requerido";
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
                {editingVehicle ? "Editar vehiculo" : "Registrar vehiculo"}
              </p>
              <p className="modal-subtitle">
                {editingVehicle
                  ? "Modifica los datos del vehiculo"
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
                  setForm((prev) => ({ ...prev, documento: event.target.value }))
                }
                placeholder="Numero de documento"
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
              <label>Telefono</label>
              <input
                value={form.telefono}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, telefono: event.target.value }))
                }
                placeholder="Numero de contacto"
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de vehiculo</label>
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
  const [searchPlaca, setSearchPlaca] = useState("");

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

  useEffect(() => {
    let active = true;
    const tarifaGuardada = Number(session?.tarifaHora);

    if (Number.isFinite(tarifaGuardada) && tarifaGuardada > 0) {
      setTarifaHoraActual(tarifaGuardada);
      return () => {
        active = false;
      };
    }

    if (!session?.uid) {
      setTarifaHoraActual(0);
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

        setTarifaHoraActual(tarifaPerfil);

        if (tarifaPerfil > 0) {
          updateSessionProfile({ tarifaHora: tarifaPerfil });
        }
      } catch (error) {
        if (active) {
          setTarifaHoraActual(0);
        }
      }
    };

    loadTarifa();

    return () => {
      active = false;
    };
  }, [session?.uid, session?.tarifaHora]);

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

  const cashCloseItems = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.estado === "Salio" &&
          vehicle.vigilanteSalidaUid === session?.uid &&
          isToday(vehicle.salidaIso)
      ),
    [vehicles, session?.uid]
  );

  const totalRecaudadoHoy = cashCloseItems.reduce(
    (accumulator, vehicle) => accumulator + (Number(vehicle.valorCobrado) || 0),
    0
  );

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
        text: error.message || "Ocurrio un error al guardar.",
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
        title: "Sesion no disponible",
        text: "No se pudo identificar al vigilante que registra la salida.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    const preview = calculateExitPreview(vehicle, tarifaHoraActual);

    const result = await Swal.fire({
      title: "Registrar salida",
      html: `
        <div style="text-align:left">
          <p><strong>Vehiculo:</strong> ${vehicle.placa}</p>
          <p><strong>Propietario:</strong> ${vehicle.propietario}</p>
          <p><strong>Tarifa por hora:</strong> ${
            tarifaHoraActual > 0 ? formatCurrency(tarifaHoraActual) : "Se validara en el servidor"
          }</p>
          <p><strong>Tiempo parqueado:</strong> ${
            preview?.duracionTexto || "Se calculara al confirmar"
          }</p>
          <p><strong>Horas a cobrar:</strong> ${preview?.horasCobradas || "-"}</p>
          <p><strong>Valor a cobrar:</strong> ${
            preview ? formatCurrency(preview.valorCobrado) : "Se calculara al confirmar"
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
            <p><strong>Vehiculo:</strong> ${response.vehiculo?.placa || vehicle.placa}</p>
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

  return (
    <InternalLayout>
      <main className="content guard-module-page">
        <header className="guard-module-page-header">
          <div>
            <h1 className="internal-page-title">Registro de vehiculos visitantes</h1>
            <p className="guard-module-page-copy">
              Controla el ingreso, la salida y el cobro de carros y motos desde una vista clara y
              operativa para tu turno.
            </p>
          </div>

          <div className="guard-module-summary">
            <span>Vehiculos visibles</span>
            <strong>{filteredVehicles.length}</strong>
          </div>
        </header>

        <section className="card guard-module-surface">
          <div className="card-header guard-module-card-header">
            <div className="guard-module-head-copy">
              <h2 className="card-title">Resumen operativo</h2>
              <p className="guard-module-card-copy">
                Consulta, crea, edita y registra la salida de los vehiculos visitantes con su
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
                  <div className="counter-icon">
                    <i className="ph-light ph-money"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{formatCurrency(tarifaHoraActual)}</span>
                    <span className="counter-label">Tarifa por hora</span>
                  </div>
                </div>
              </div>

              <button type="button" className="register-btn" onClick={() => setModalOpen(true)}>
                <span>
                  Registrar nuevo
                  <br />
                  vehiculo
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

          {!tarifaHoraActual && (
            <div className="cash-close-alert">
              El vigilante no tiene una tarifa por hora cargada en la sesion. Si acabas de
              configurarla, vuelve a iniciar sesion para aplicar el cobro correctamente.
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
                  <th>Telefono</th>
                  <th>Torre</th>
                  <th>Apartamento</th>
                  <th>Ingreso</th>
                  <th>Salida</th>
                  <th>Estado</th>
                  <th>Cobro</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="guard-module-empty-row">
                      No hay vehiculos que coincidan con la busqueda.
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
                          {vehicle.estado === "Salio" ? "Salio" : "Activo"}
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
                            title="Editar vehiculo"
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
              <h2 className="card-title">Cuadre de caja del dia</h2>
              <p className="guard-module-card-copy">
                Este resumen se reinicia automaticamente cada dia y solo muestra las salidas que
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
                  <span className="counter-label">Salidas de hoy</span>
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
            </div>
          </div>

          <div className="guard-module-table-wrap">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Propietario</th>
                  <th>Duracion</th>
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
                      Aun no has registrado salidas con cobro hoy.
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
      />
    </InternalLayout>
  );
}
