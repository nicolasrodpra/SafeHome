import { Navigate } from "react-router-dom";
import useSession from "../hooks/useSession";

const getRouteByRole = (role) => {
  if (role === "Vigilante") return "/vigilanteMenu";
  if (role === "Administrador") return "/adminMenu";
  if (role === "Residente") return "/residenteMenu";
  return "/login";
};

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const session = useSession();

  if (!session?.uid) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.rol)) {
    return <Navigate to={getRouteByRole(session.rol)} replace />;
  }

  return children;
}
