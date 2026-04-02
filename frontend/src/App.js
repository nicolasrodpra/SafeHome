import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute.js";
import AdminComunicados from "./pages/admin/adminComunicados.js";
import AdminMenu from "./pages/admin/adminMenu.js";
import AdminResidentes from "./pages/admin/adminResidentes.js";
import PqrRecibidosAdmin from "./pages/admin/pqrRecibidos.js";
import AdminRegister from "./pages/admin/registroAdmin.js";
import Home from "./pages/general/home.js";
import Login from "./pages/general/login.js";
import ResidenteMenu from "./pages/residente/residenteMenu.js";
import RegistroVehiculos from "./pages/vigilante/registroVehiculos.js";
import VigilanteMenu from "./pages/vigilante/vigilanteMenu.js";

const privateRoutes = [
  { path: "/registroUsuario", element: <AdminRegister /> },
  { path: "/adminComunicados", element: <AdminComunicados /> },
  { path: "/pqrRecibidosAdmin", element: <PqrRecibidosAdmin /> },
  { path: "/adminResidentes", element: <AdminResidentes /> },
  { path: "/residenteMenu", element: <ResidenteMenu /> },
  { path: "/vigilanteMenu", element: <VigilanteMenu /> },
  { path: "/adminMenu", element: <AdminMenu /> },
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
