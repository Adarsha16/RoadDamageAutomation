import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Detect from './pages/Detection';
import Severity from './pages/Severity';
import RepairPlan from './pages/RepairPlan';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/detect" element={<Detect />} />
        <Route path="/severity" element={<Severity />} />
        <Route path="/repair-plan" element={<RepairPlan />} />
      </Routes>
    </BrowserRouter>
  );
}
