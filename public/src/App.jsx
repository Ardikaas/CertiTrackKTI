import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SertifikasiForm from './pages/SertifikasiForm';
import DataSertifikasi from './pages/DataSertifikasi';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Sidebar />
        <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sertifikasi/baru" element={<SertifikasiForm />} />
            <Route path="/sertifikasi/data" element={<DataSertifikasi />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
