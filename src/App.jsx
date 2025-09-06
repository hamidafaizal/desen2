import { Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import DesainBaru from './pages/DesainBaru'; // Impor halaman baru

// Komponen Layout Utama untuk halaman yang dilindungi
function DashboardLayout() {
  return (
    <div className="flex bg-gray-900 text-gray-200 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col p-6 space-y-6">
        <Header />
        <main className="flex-1">
          <div className="w-full h-full glassmorphism rounded-xl p-8">
            <Outlet /> {/* Halaman spesifik akan dirender di sini */}
          </div>
        </main>
      </div>
    </div>
  );
}

// Komponen Halaman Dashboard Sementara
function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Selamat Datang!</h1>
      <p>Pilih menu dari sidebar untuk memulai.</p>
    </div>
  );
}

// Komponen App Utama yang mengatur semua routing
function App() {
  return (
    <Routes>
      {/* Rute Publik */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rute yang Dilindungi */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          {/* Tambahkan rute terproteksi lainnya di sini */}
          <Route path="/desain-baru" element={<DesainBaru />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

