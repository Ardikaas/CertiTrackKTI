import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import SertifikasiForm from "./pages/SertifikasiForm";
import DataSertifikasi from "./pages/DataSertifikasi";
import WhatsApp from "./pages/WhatsApp";
import Settings from "./pages/Settings";

const AppLayout = ({ children }) => (
  <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
    <Sidebar />
    <main className="flex-1 overflow-y-auto">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sertifikasi/baru"
            element={
              <ProtectedRoute>
                <AppLayout><SertifikasiForm /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sertifikasi/data"
            element={
              <ProtectedRoute>
                <AppLayout><DataSertifikasi /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp"
            element={
              <ProtectedRoute>
                <AppLayout><WhatsApp /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout><Settings /></AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
