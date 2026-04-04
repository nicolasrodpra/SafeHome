import AdminVigilanciaSectionPage from "../../components/admin/AdminVigilanciaSectionPage";
import { getVehiculos } from "../../services/modules/vigilanciaApi";

const config = {
  title: "Ingreso de vehículos",
  icon: "ph-car",
  loadItems: getVehiculos,
  emptyMessage: "No hay vehículos registrados.",
  columns: [
    { key: "tipo", label: "Tipo" },
    { key: "propietario", label: "Propietario" },
    { key: "documento", label: "Documento" },
    { key: "placa", label: "Placa" },
    { key: "telefono", label: "Teléfono" },
    { key: "torre", label: "Torre" },
    { key: "apartamento", label: "Apartamento" },
    { key: "fecha", label: "Fecha" },
    { key: "hora", label: "Hora" },
  ],
  detailFields: [
    { key: "tipo", label: "Tipo de vehículo" },
    { key: "propietario", label: "Propietario" },
    { key: "documento", label: "Documento" },
    { key: "placa", label: "Placa" },
    { key: "telefono", label: "Teléfono" },
    { key: "torre", label: "Torre" },
    { key: "apartamento", label: "Apartamento" },
    { key: "fecha", label: "Fecha" },
    { key: "hora", label: "Hora" },
  ],
  getCounters(items) {
    return [
      {
        label: "Carros",
        value: items.filter((item) => item.tipo === "Carro").length,
        icon: "ph-car",
        variant: "car",
      },
      {
        label: "Motos",
        value: items.filter((item) => item.tipo === "Moto").length,
        icon: "ph-motorcycle",
        variant: "moto",
      },
    ];
  },
};

export default function AdminVigilanciaVehiculos() {
  return <AdminVigilanciaSectionPage config={config} />;
}
