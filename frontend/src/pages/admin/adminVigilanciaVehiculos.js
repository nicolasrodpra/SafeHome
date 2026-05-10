import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import AdminVigilanciaSectionPage from "../../components/admin/AdminVigilanciaSectionPage";
import useSession from "../../hooks/useSession";
import {
  getVehiculos,
  getVigilanciaConfig,
  updateVigilanciaConfig,
} from "../../services/modules/vigilanciaApi";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => (Number(value) ? currencyFormatter.format(value) : "$0");

function VigilanciaTarifaPanel() {
  const session = useSession();
  const [tarifaActual, setTarifaActual] = useState(0);
  const [tarifaInput, setTarifaInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    try {
      const config = await getVigilanciaConfig();
      const nextTarifa = Number(config?.tarifaHoraVigilante) || 0;
      setTarifaActual(nextTarifa);
      setTarifaInput(nextTarifa ? String(nextTarifa) : "");
    } catch (error) {
      setTarifaActual(0);
      setTarifaInput("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    const parsedValue = Number(String(tarifaInput).replace(",", "."));

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      Swal.fire({
        title: "Tarifa inválida",
        text: "Ingresa una tarifa mayor a 0 para la vigilancia.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    setSaving(true);

    try {
      await updateVigilanciaConfig({
        tarifaHoraVigilante: parsedValue,
        updatedByUid: session?.uid || "",
        updatedByName: session?.nombre || "Administracion",
      });

      setTarifaActual(parsedValue);

      Swal.fire({
        title: "Tarifa actualizada",
        text: "La nueva tarifa ya quedó disponible para los cobros de vehículos.",
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

  return (
    <section className="admin-vigilancia-settings-panel">
      <div className="admin-vigilancia-settings-copy">
        <span className="admin-vigilancia-settings-kicker">Configuración</span>
        <h2>Tarifa de parqueadero visitante</h2>
        <p>
          Define desde administración el valor por hora que usará vigilancia al registrar la salida
          de vehículos.
        </p>
      </div>

      <div className="admin-vigilancia-settings-card">
        <div className="admin-vigilancia-settings-current">
          <span>Tarifa vigente</span>
          <strong>{loading ? "Cargando..." : formatCurrency(tarifaActual)}</strong>
        </div>

        <div className="admin-vigilancia-settings-form">
          <label>
            Nueva tarifa por hora
            <input
              type="number"
              min="1"
              step="1"
              value={tarifaInput}
              onChange={(event) => setTarifaInput(event.target.value)}
              placeholder="Ej. 5000"
            />
          </label>

          <button type="button" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Guardando..." : "Guardar tarifa"}
          </button>
        </div>
      </div>
    </section>
  );
}

const config = {
  title: "Ingreso de vehículos",
  icon: "ph-car",
  loadItems: getVehiculos,
  emptyMessage: "No hay vehículos registrados.",
  renderBeforeSurface: () => <VigilanciaTarifaPanel />,
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
    { key: "tipo", label: "Tipo de vehículo" },
    { key: "propietario", label: "Propietario" },
    { key: "documento", label: "Documento" },
    { key: "placa", label: "Placa" },
    { key: "telefono", label: "Teléfono" },
    { key: "torre", label: "Torre" },
    { key: "apartamento", label: "Apartamento" },
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
