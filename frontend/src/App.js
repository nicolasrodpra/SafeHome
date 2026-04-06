import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminComunicados from "./pages/admin/adminComunicados.js";
import AdminManualConvivencia from "./pages/admin/adminManualConvivencia.js";
import AdminMensajeriaPage from "./pages/admin/adminMensajeria.js";
import AdminMenu from "./pages/admin/adminMenu.js";
import AdminReservas from "./pages/admin/adminReservas.js";
import AdminResidentes from "./pages/admin/adminResidentes.js";
import AdminVigilanciaCorrespondencia from "./pages/admin/adminVigilanciaCorrespondencia.js";
import AdminVigilanciaVehiculos from "./pages/admin/adminVigilanciaVehiculos.js";
import AdminVigilanciaVisitantes from "./pages/admin/adminVigilanciaVisitantes.js";
import AdminRegister from "./pages/admin/registroAdmin.js";
import Home from "./pages/general/home.js";
import Login from "./pages/general/login.js";
import PerfilUsuarioPage from "./pages/general/perfilUsuario.js";
import ResidenteComunicados from "./pages/residente/residenteComunicados.js";
import ResidenteManualConvivencia from "./pages/residente/residenteManualConvivencia.js";
import ResidenteMensajeriaPage from "./pages/residente/residenteMensajeria.js";
import ResidenteMenu from "./pages/residente/residenteMenu.js";
import ResidentesReservas from "./pages/residente/residentesReservas.js";
import ProtectedRoute from "./routes/ProtectedRoute.js";
import RegistroCorrespondencia from "./pages/vigilante/registroCorrespondencia.js";
import RegistroVehiculos from "./pages/vigilante/registroVehiculos.js";
import RegistroVisitantes from "./pages/vigilante/registroVisitantes.js";
import VigilanteMenu from "./pages/vigilante/vigilanteMenu.js";

const privateRoutes = [
  { path: "/registroUsuario", element: <AdminRegister />, roles: ["Administrador"] },
  { path: "/adminComunicados", element: <AdminComunicados />, roles: ["Administrador", "Vigilante"] },
  { path: "/adminMensajeria", element: <AdminMensajeriaPage />, roles: ["Administrador"] },
  { path: "/adminResidentes", element: <AdminResidentes />, roles: ["Administrador"] },
  { path: "/adminReservas", element: <AdminReservas />, roles: ["Administrador"] },
  { path: "/adminManualConvivencia", element: <AdminManualConvivencia />, roles: ["Administrador"] },
  {
    path: "/adminVigilanciaCorrespondencia",
    element: <AdminVigilanciaCorrespondencia />,
    roles: ["Administrador"],
  },
  {
    path: "/adminVigilanciaVehiculos",
    element: <AdminVigilanciaVehiculos />,
    roles: ["Administrador"],
  },
  {
    path: "/adminVigilanciaVisitantes",
    element: <AdminVigilanciaVisitantes />,
    roles: ["Administrador"],
  },
  { path: "/residenteMenu", element: <ResidenteMenu />, roles: ["Residente"] },
  { path: "/residenteMensajeria", element: <ResidenteMensajeriaPage />, roles: ["Residente"] },
  { path: "/residenteComunicados", element: <ResidenteComunicados />, roles: ["Residente"] },
  { path: "/comunicadosResidente", element: <ResidenteComunicados />, roles: ["Residente"] },
  { path: "/residentesReservas", element: <ResidentesReservas />, roles: ["Residente"] },
  {
    path: "/residenteManualConvivencia",
    element: <ResidenteManualConvivencia />,
    roles: ["Residente"],
  },
  { path: "/vigilanteMenu", element: <VigilanteMenu />, roles: ["Vigilante"] },
  { path: "/adminMenu", element: <AdminMenu />, roles: ["Administrador"] },
  {
    path: "/perfil",
    element: <PerfilUsuarioPage />,
    roles: ["Administrador", "Residente", "Vigilante"],
  },
  { path: "/registroCorrespondencia", element: <RegistroCorrespondencia />, roles: ["Vigilante"] },
  { path: "/registroVisitantes", element: <RegistroVisitantes />, roles: ["Vigilante"] },
  { path: "/registroVehiculos", element: <RegistroVehiculos />, roles: ["Vigilante"] },
  { path: "/vigilanteComunicados", element: <AdminComunicados />, roles: ["Vigilante"] },
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
            element={
              <ProtectedRoute allowedRoles={route.roles}>
                {route.element}
              </ProtectedRoute>
            }
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
