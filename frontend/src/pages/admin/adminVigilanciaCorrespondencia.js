import AdminVigilanciaSectionPage from "../../components/admin/AdminVigilanciaSectionPage";

const config = {
  title: "Registro de Correspondencia",
  icon: "ph-package",
  collectionName: "correspondencia",
  emptyMessage: "No hay correspondencia registrada",
  columns: [
    { key: "tipoEntrega", label: "Tipo" },
    { key: "residente", label: "Residente" },
    { key: "documento", label: "Documento" },
    { key: "remitente", label: "Remitente" },
    { key: "torre", label: "Torre" },
    { key: "apartamento", label: "Apartamento" },
    { key: "observacion", label: "Observacion" },
    { key: "fecha", label: "Fecha" },
    { key: "hora", label: "Hora" },
  ],
  detailFields: [
    { key: "tipoEntrega", label: "Tipo de entrega" },
    { key: "residente", label: "Residente" },
    { key: "documento", label: "Documento" },
    { key: "remitente", label: "Remitente" },
    { key: "torre", label: "Torre" },
    { key: "apartamento", label: "Apartamento" },
    { key: "observacion", label: "Observacion" },
    { key: "fecha", label: "Fecha" },
    { key: "hora", label: "Hora" },
  ],
  getCounters(items) {
    return [
      {
        label: "Paquetes",
        value: items.filter((item) => item.tipoEntrega === "Paquete").length,
        icon: "ph-package",
        variant: "car",
      },
      {
        label: "Sobres",
        value: items.filter((item) => item.tipoEntrega === "Sobre").length,
        icon: "ph-envelope-simple",
        variant: "moto",
      },
      {
        label: "Documentos",
        value: items.filter((item) => item.tipoEntrega === "Documento").length,
        icon: "ph-file-text",
        variant: "moto",
      },
    ];
  },
};

export default function AdminVigilanciaCorrespondencia() {
  return <AdminVigilanciaSectionPage config={config} />;
}
