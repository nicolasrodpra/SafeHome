import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/general/home.js";
import Login from "./pages/general/login.js";
import VigilantRegister from "./pages/vigilante/registroVigilante.js";
import ResidentRegister from "./pages/residente/registroResidente.js";
import AdminRegister from "./pages/admin/registroAdmin.js";
import RecidenteMenu from "./pages/residente/residenteMenu.js";
import VigilantMenu from "./pages/vigilante/vigilanteMenu.js";
import AdminMenu from "./pages/admin/adminMenu.js";
import RegistroVehiculos from "./pages/vigilante/registroVehiculos.js";
import RutaProtegida from "./components/rutaProtegida.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registroVigilante" element={<VigilantRegister />} />
        <Route path="/registroResidente" element={<ResidentRegister />} />
        <Route path="/registroAdmin" element={<AdminRegister />} />

        {/* Rutas protegidas */}
        <Route path="/residenteMenu" element={
          <RutaProtegida>
            <RecidenteMenu />
          </RutaProtegida>
        } />
        <Route path="/vigilanteMenu" element={
          <RutaProtegida>
            <VigilantMenu />
          </RutaProtegida>
        } />
        <Route path="/adminMenu" element={
          <RutaProtegida>
            <AdminMenu />
          </RutaProtegida>
        } />
        <Route path="/registroVehiculos" element={
          <RutaProtegida>
            <RegistroVehiculos />
          </RutaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;