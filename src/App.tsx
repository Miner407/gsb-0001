import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Medicines from "@/pages/Medicines";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/medicines" element={<Medicines />} />
      </Routes>
    </Router>
  );
}
