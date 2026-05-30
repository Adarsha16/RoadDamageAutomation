import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DetectDemo from './pages/DetectDemo';
import SeverityDemo from './pages/SeverityDemo';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/detect" element={<DetectDemo />} />
        <Route path="/severity" element={<SeverityDemo />} />
      </Routes>
    </BrowserRouter>
  );
}
