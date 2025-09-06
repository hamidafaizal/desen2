import { useState } from 'react';
import { FiUser } from 'react-icons/fi';
import ProfileModal from '../modals/Profile';

// Komponen Header
function Header() {
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  console.log("Header component rendered, modal open state:", isProfileModalOpen);

  // Fungsi untuk membuka modal
  const handleOpenModal = () => {
    console.log("Opening profile modal.");
    setProfileModalOpen(true);
  };

  // Fungsi untuk menutup modal
  const handleCloseModal = () => {
    console.log("Closing profile modal.");
    setProfileModalOpen(false);
  };

  return (
    <>
      <header className="glassmorphism p-4 rounded-xl sticky top-6 z-10">
        <div className="relative flex items-center justify-between h-12">
          {/* Logo di Kiri */}
          <div className="flex items-center space-x-3">
            <img src="/logodesen2.svg" alt="Desen Logo" className="h-8 w-8" />
          </div>

          {/* Judul di Tengah */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-2xl font-bold text-white tracking-wider">Desen</h1>
          </div>
          
          {/* Avatar di Kanan */}
          <button 
            onClick={handleOpenModal}
            className="p-3 rounded-full hover:bg-white/10 transition-colors"
          >
            <FiUser size={24} className="text-white" />
          </button>
        </div>
      </header>
      
      {/* Render komponen modal */}
      <ProfileModal isOpen={isProfileModalOpen} onClose={handleCloseModal} />
    </>
  );
}

export default Header;

