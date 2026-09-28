import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WhoProvider, useWho } from './context/WhoContext';
import Navbar from './components/Navbar';
import WhoPicker from './pages/WhoPicker';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';

function Gate() {
  const { who } = useWho();
  if (!who) return <WhoPicker />;
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WhoProvider>
        <Gate />
      </WhoProvider>
    </BrowserRouter>
  );
}
