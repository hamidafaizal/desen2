import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Komponen untuk melindungi rute
function ProtectedRoute() {
  const { session, loading } = useAuth();

  // Selama masih loading, jangan render apapun
  if (loading) {
    console.log("ProtectedRoute: Auth state is loading...");
    return null; // atau tampilkan spinner
  }

  // Jika tidak ada sesi (tidak login), arahkan ke halaman login
  if (!session) {
    console.log("ProtectedRoute: No session found, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  // Jika ada sesi, tampilkan konten yang dilindungi
  console.log("ProtectedRoute: Session found, rendering protected content.");
  return <Outlet />;
}

export default ProtectedRoute;
