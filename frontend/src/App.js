import { BrowserRouter, Route, Routes } from "react-router-dom";
import RutaProtegida from "./components/rutaProtegida.js";
import AdminComunicados from "./pages/admin/adminComunicados.js";
import AdminMenu from "./pages/admin/adminMenu.js";
import AdminRegister from "./pages/admin/registroAdmin.js";
import Home from "./pages/general/home.js";
import Login from "./pages/general/login.js";
import ResidentRegister from "./pages/residente/registroResidente.js";
import ResidenteMenu from "./pages/residente/residenteMenu.js";
import RegistroVehiculos from "./pages/vigilante/registroVehiculos.js";
import VigilantRegister from "./pages/vigilante/registroVigilante.js";
import VigilantMenu from "./pages/vigilante/vigilanteMenu.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registroVigilante" element={<VigilantRegister />} />
        <Route path="/registroResidente" element={<ResidentRegister />} />
        <Route path="/registroAdmin" element={<AdminRegister />} />
        <Route path="/adminComunicados" element={<AdminComunicados />} />
        <Route
          path="/residenteMenu"
          element={
            <RutaProtegida>
              <ResidenteMenu />
            </RutaProtegida>
          }
        />
        <Route
          path="/vigilanteMenu"
          element={
            <RutaProtegida>
              <VigilantMenu />
            </RutaProtegida>
          }
        />
        <Route
          path="/adminMenu"
          element={
            <RutaProtegida>
              <AdminMenu />
            </RutaProtegida>
          }
        />
        <Route
          path="/registroVehiculos"
          element={
            <RutaProtegida>
              <RegistroVehiculos />
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
