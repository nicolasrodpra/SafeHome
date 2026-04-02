import ReservasCalendarModule from "../../components/reservas/ReservasCalendarModule";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";

export default function ResidentesReservas() {
  return (
    <InternalLayoutResidente>
      <ReservasCalendarModule mode="resident" />
    </InternalLayoutResidente>
  );
}
