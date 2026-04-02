import ReservasCalendarModule from "../../components/reservas/ReservasCalendarModule";
import InternalLayout from "../../layouts/InternalLayout";

export default function AdminReservas() {
  return (
    <InternalLayout>
      <ReservasCalendarModule mode="admin" />
    </InternalLayout>
  );
}
