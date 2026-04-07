// Vista administrativa del módulo de reservas.
// Reutiliza el mismo calendario del residente, pero en modo consulta.
import ReservasCalendarModule from "../../components/reservas/ReservasCalendarModule";
import InternalLayout from "../../layouts/InternalLayout";

export default function AdminReservas() {
  return (
    <InternalLayout>
      <ReservasCalendarModule mode="admin" />
    </InternalLayout>
  );
}
