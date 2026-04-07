// Vista administrativa de visitantes.
// Define el esquema de tabla y contadores de la pagina generica de vigilancia.
import AdminVigilanciaSectionPage from "../../components/admin/AdminVigilanciaSectionPage";
import { getVisitantes } from "../../services/modules/vigilanciaApi";

const config = {
  title: "Registro de visitantes",
  icon: "ph-users-three",
  loadItems: getVisitantes,
  emptyMessage: "No hay visitantes registrados.",
  columns: [
    { key: "nombre", label: "Visitante" },
    { key: "documento", label: "Documento" },
    { key: "residente", label: "Residente" },
    { key: "telefono", label: "Teléfono" },
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
    { key: "telefono", label: "Teléfono" },
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
