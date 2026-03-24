import { Navigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

function RutaProtegida({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) return <p>Cargando...</p>;
  if (!user) return <Navigate to="/login" />;

  return children;
}

export default RutaProtegida;
