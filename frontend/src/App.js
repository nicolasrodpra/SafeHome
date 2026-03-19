import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home.js";
import Login from "./pages/login.js";
import VigilantRegister from "./pages/Vigilant_Register"; 
import ResidentRegister from "./pages/Resident_Register";
import AdminRegister from "./pages/Admin_Register";
import RecidenteMenu from "./pages/Resident_Menu";
import VigilantMenu from "./pages/Vigilant_Menu";
import AdminMenu from "./pages/adminMenu.js";
<<<<<<< HEAD
import RegistroVehiculos from "./pages/Registro_Vehiculos.js";
=======
>>>>>>> 6de13a85a39d75d6608f5df00186ce93d4b015f7

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/VigilantRegister" element={<VigilantRegister />} />
        <Route path="/ResidentRegister" element={<ResidentRegister />} />
        <Route path="/AdminRegister" element={<AdminRegister />} />
        <Route path="/Resident_Menu" element={<RecidenteMenu />} />
        <Route path="/Vigilant_Menu" element={<VigilantMenu />} />
        <Route path="/Admin_Menu" element={<AdminMenu />} />
<<<<<<< HEAD
        <Route path="/Registro_Vehiculos" element={<RegistroVehiculos />} />
=======
>>>>>>> 6de13a85a39d75d6608f5df00186ce93d4b015f7
      </Routes>
    </BrowserRouter>
  );
}

export default App;