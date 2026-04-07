// Vista administrativa del manual de convivencia.
// Reutiliza el modulo compartido en modo "admin".
import ManualConvivenciaModule from "../../components/manual/ManualConvivenciaModule";
import InternalLayout from "../../layouts/InternalLayout";

export default function AdminManualConvivencia() {
  return (
    <InternalLayout>
      <ManualConvivenciaModule mode="admin" />
    </InternalLayout>
  );
}
