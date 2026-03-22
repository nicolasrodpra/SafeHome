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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registroVigilante" element={<VigilantRegister />} />
        <Route path="/registroResidente" element={<ResidentRegister />} />
        <Route path="/registroAdmin" element={<AdminRegister />} />
        <Route path="/residenteMenu" element={<RecidenteMenu />} />
        <Route path="/vigilanteMenu" element={<VigilantMenu />} />
        <Route path="/adminMenu" element={<AdminMenu />} />
        <Route path="/registroVehiculos" element={<RegistroVehiculos />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;