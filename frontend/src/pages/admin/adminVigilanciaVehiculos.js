import AdminVigilanciaSectionPage from "../../components/admin/AdminVigilanciaSectionPage";
import { getVehiculos } from "../../services/modules/vigilanciaApi";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => (Number(value) ? currencyFormatter.format(value) : "$0");

const config = {
  title: "Ingreso de vehiculos",
  icon: "ph-car",
  loadItems: getVehiculos,
  emptyMessage: "No hay vehiculos registrados.",
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
    { key: "tipo", label: "Tipo de vehiculo" },
    { key: "propietario", label: "Propietario" },
    { key: "documento", label: "Documento" },
    { key: "placa", label: "Placa" },
    { key: "telefono", label: "Telefono" },
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
      renderValue: (item) => (item.estado === "Salio" ? formatCurrency(item.valorCobrado) : "Sin cobro"),
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
