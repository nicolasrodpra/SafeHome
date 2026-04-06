import AdminVigilanciaSectionPage from "../../components/admin/AdminVigilanciaSectionPage";
import { getCorrespondencia } from "../../services/modules/vigilanciaApi";

const config = {
  title: "Registro de correspondencia",
  icon: "ph-package",
  loadItems: getCorrespondencia,
  emptyMessage: "No hay correspondencia registrada.",
  filters: [
    {
      key: "documento",
      label: "Cedula",
      placeholder: "Buscar por cedula",
      icon: "ph-identification-card",
    },
  ],
  columns: [
    { key: "estado", label: "Estado" },
    { key: "tipoEntrega", label: "Tipo" },
    { key: "residente", label: "Residente" },
    { key: "documento", label: "Documento" },
    { key: "remitente", label: "Remitente" },
    {
      key: "vigilanteNombre",
      label: "Recibido por",
      render: (item) => item.vigilanteNombre || "--",
    },
    {
      key: "vigilanteEntregaNombre",
      label: "Entregado por",
      render: (item) => item.vigilanteEntregaNombre || "--",
    },
    { key: "torre", label: "Torre" },
    { key: "apartamento", label: "Apartamento" },
    {
      key: "fechaEntrega",
      label: "Entrega",
      render: (item) =>
        item.estado === "Entregado"
          ? [item.fechaEntrega, item.horaEntrega].filter(Boolean).join(" ")
          : "--",
    },
  ],
  detailFields: [
    { key: "estado", label: "Estado" },
    { key: "tipoEntrega", label: "Tipo de entrega" },
    { key: "residente", label: "Residente" },
    { key: "documento", label: "Documento" },
    { key: "remitente", label: "Remitente" },
    { key: "vigilanteNombre", label: "Vigilante que recibe" },
    { key: "vigilanteEntregaNombre", label: "Vigilante que entrega" },
    { key: "torre", label: "Torre" },
    { key: "apartamento", label: "Apartamento" },
    { key: "observacion", label: "Observacion" },
    { key: "fecha", label: "Fecha de registro" },
    { key: "hora", label: "Hora de registro" },
    { key: "fechaEntrega", label: "Fecha de entrega" },
    { key: "horaEntrega", label: "Hora de entrega" },
  ],
  getCounters(items) {
    return [
      {
        label: "Pendientes",
        value: items.filter((item) => item.estado !== "Entregado").length,
        icon: "ph-clock",
        variant: "car",
      },
      {
        label: "Entregadas",
        value: items.filter((item) => item.estado === "Entregado").length,
        icon: "ph-check-circle",
        variant: "moto",
      },
      {
        label: "Paquetes",
        value: items.filter((item) => item.tipoEntrega === "Paquete").length,
        icon: "ph-package",
        variant: "moto",
      },
    ];
  },
};

export default function AdminVigilanciaCorrespondencia() {
  return <AdminVigilanciaSectionPage config={config} />;
}
