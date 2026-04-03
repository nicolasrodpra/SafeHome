import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute.js";
import AdminComunicados from "./pages/admin/adminComunicados.js";
import AdminMenu from "./pages/admin/adminMenu.js";
import AdminManualConvivencia from "./pages/admin/adminManualConvivencia.js";
import AdminReservas from "./pages/admin/adminReservas.js";
import AdminResidentes from "./pages/admin/adminResidentes.js";
import AdminVigilanciaCorrespondencia from "./pages/admin/adminVigilanciaCorrespondencia.js";
import AdminVigilanciaVehiculos from "./pages/admin/adminVigilanciaVehiculos.js";
import AdminVigilanciaVisitantes from "./pages/admin/adminVigilanciaVisitantes.js";
import PqrRecibidosAdmin from "./pages/admin/pqrRecibidos.js";
import AdminRegister from "./pages/admin/registroAdmin.js";
import Home from "./pages/general/home.js";
import Login from "./pages/general/login.js";
import PerfilUsuarioPage from "./pages/general/perfilUsuario.js";
import ResidenteMenu from "./pages/residente/residenteMenu.js";
import ResidenteManualConvivencia from "./pages/residente/residenteManualConvivencia.js";
import ResidentesReservas from "./pages/residente/residentesReservas.js";
import RegistroCorrespondencia from "./pages/vigilante/registroCorrespondencia.js";
import RegistroVisitantes from "./pages/vigilante/registroVisitantes.js";
import RegistroVehiculos from "./pages/vigilante/registroVehiculos.js";
import VigilanteMenu from "./pages/vigilante/vigilanteMenu.js";

const privateRoutes = [
  { path: "/registroUsuario", element: <AdminRegister /> },
  { path: "/adminComunicados", element: <AdminComunicados /> },
  { path: "/pqrRecibidosAdmin", element: <PqrRecibidosAdmin /> },
  { path: "/adminResidentes", element: <AdminResidentes /> },
  { path: "/adminReservas", element: <AdminReservas /> },
  { path: "/adminManualConvivencia", element: <AdminManualConvivencia /> },
  { path: "/adminVigilanciaCorrespondencia", element: <AdminVigilanciaCorrespondencia /> },
  { path: "/adminVigilanciaVehiculos", element: <AdminVigilanciaVehiculos /> },
  { path: "/adminVigilanciaVisitantes", element: <AdminVigilanciaVisitantes /> },
  { path: "/residenteMenu", element: <ResidenteMenu /> },
  { path: "/residentesReservas", element: <ResidentesReservas /> },
  { path: "/residenteManualConvivencia", element: <ResidenteManualConvivencia /> },
  { path: "/vigilanteMenu", element: <VigilanteMenu /> },
  { path: "/adminMenu", element: <AdminMenu /> },
  { path: "/perfil", element: <PerfilUsuarioPage /> },
  { path: "/registroCorrespondencia", element: <RegistroCorrespondencia /> },
  { path: "/registroVisitantes", element: <RegistroVisitantes /> },
  { path: "/registroVehiculos", element: <RegistroVehiculos /> },
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {privateRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<ProtectedRoute>{route.element}</ProtectedRoute>}
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
