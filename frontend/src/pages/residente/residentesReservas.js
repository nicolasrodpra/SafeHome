// Vista del residente para crear y gestionar sus reservas.
// Reutiliza el calendario compartido en modo "resident".
import ReservasCalendarModule from "../../components/reservas/ReservasCalendarModule";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";

export default function ResidentesReservas() {
  return (
    <InternalLayoutResidente>
      <ReservasCalendarModule mode="resident" />
    </InternalLayoutResidente>
  );
}
