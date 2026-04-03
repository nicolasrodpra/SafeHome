import AdminVigilanciaSectionPage from "../../components/admin/AdminVigilanciaSectionPage";

const config = {
  title: "Registro de Visitantes",
  icon: "ph-users-three",
  collectionName: "visitantes",
  emptyMessage: "No hay visitantes registrados",
  columns: [
    { key: "nombre", label: "Visitante" },
    { key: "documento", label: "Documento" },
    { key: "residente", label: "Residente" },
    { key: "telefono", label: "Telefono" },
    { key: "torre", label: "Torre" },
    { key: "apartamento", label: "Apartamento" },
    { key: "motivo", label: "Motivo" },
    { key: "fecha", label: "Fecha" },
    { key: "hora", label: "Hora" },
  ],
  detailFields: [
    { key: "nombre", label: "Visitante" },
    { key: "documento", label: "Documento" },
    { key: "residente", label: "Residente que autoriza" },
    { key: "telefono", label: "Telefono" },
    { key: "torre", label: "Torre" },
    { key: "apartamento", label: "Apartamento" },
    { key: "motivo", label: "Motivo de visita" },
    { key: "fecha", label: "Fecha" },
    { key: "hora", label: "Hora" },
  ],
  getCounters(items) {
    return [
      {
        label: "Visitantes registrados",
        value: items.length,
        icon: "ph-users-three",
        variant: "car",
      },
    ];
  },
};

export default function AdminVigilanciaVisitantes() {
  return <AdminVigilanciaSectionPage config={config} />;
}
