import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/today" element={<Home view="today" />} />
      <Route path="/garden" element={<Home view="garden" />} />
      <Route path="/comfort" element={<Home view="comfort" />} />
      <Route path="/cozy" element={<Home view="cozy" />} />
      <Route path="/rescue" element={<Home view="rescue" />} />
      <Route path="/berry" element={<Home view="berry" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
