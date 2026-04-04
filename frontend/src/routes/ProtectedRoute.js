import { Navigate } from "react-router-dom";
import useSession from "../hooks/useSession";

export default function ProtectedRoute({ children }) {
  const session = useSession();

  if (!session?.uid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
