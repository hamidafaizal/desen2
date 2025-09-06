import { FiX, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

// Komponen Modal Profil
function Profile({ isOpen, onClose }) {
  const { signOut } = useAuth();

  // Jangan render apapun jika modal tidak terbuka
  if (!isOpen) {
    console.log("Profile modal is closed, not rendering.");
    return null;
  }

  // Fungsi untuk menangani logout
  const handleLogout = async () => {
    console.log("Logout button clicked.");
    await signOut();
    onClose(); // Tutup modal setelah logout
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose} // Menutup modal saat area luar diklik
    >
      <div 
        className="glassmorphism p-6 rounded-2xl w-full max-w-xs"
        onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat area dalam diklik
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Profil</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
            <FiX size={20} />
          </button>
        </div>
        
        {/* Menu di dalam Modal */}
        <div className="space-y-3">
          <a href="#" className="flex items-center space-x-3 text-gray-300 hover:text-white p-3 rounded-lg transition-colors hover:bg-white/10">
            <FiSettings />
            <span>Pengaturan</span>
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 text-red-400 hover:text-red-300 p-3 rounded-lg transition-colors hover:bg-white/10"
          >
            <FiLogOut />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
