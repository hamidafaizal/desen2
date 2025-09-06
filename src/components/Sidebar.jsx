import { Link, useLocation } from 'react-router-dom';
import { FiFileText, FiEdit, FiCheckSquare } from 'react-icons/fi';

// Komponen Sidebar
function Sidebar() {
  const location = useLocation();
  const menuItems = [
    { name: 'Desain Baru', path: '/desain-baru', icon: <FiFileText /> },
    { name: 'Desain Revisi', path: '/desain-revisi', icon: <FiEdit /> },
    { name: 'Desain Selesai', path: '/desain-selesai', icon: <FiCheckSquare /> },
  ];

  return (
    <aside className="w-64 p-6">
      <div className="glassmorphism h-full rounded-xl p-4 flex flex-col">
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;

