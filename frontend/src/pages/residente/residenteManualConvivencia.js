// Vista del residente para consultar el manual de convivencia.
// Usa el mismo modulo compartido, pero solo en modo lectura.
import ManualConvivenciaModule from "../../components/manual/ManualConvivenciaModule";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";

export default function ResidenteManualConvivencia() {
  return (
    <InternalLayoutResidente>
      <ManualConvivenciaModule mode="resident" />
    </InternalLayoutResidente>
  );
}
