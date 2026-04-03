import ManualConvivenciaModule from "../../components/manual/ManualConvivenciaModule";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";

export default function ResidenteManualConvivencia() {
  return (
    <InternalLayoutResidente>
      <ManualConvivenciaModule mode="resident" />
    </InternalLayoutResidente>
  );
}
