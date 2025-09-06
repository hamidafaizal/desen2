import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

// Halaman Register
function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fungsi untuk menangani submit form
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    console.log("Attempting to register with:", email);

    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Registration error:", error.message);
      setError(error.message);
    } else {
      console.log("Registration successful.");
      setMessage('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
      // Opsional: langsung arahkan ke login atau biarkan pengguna melihat pesan
      // setTimeout(() => navigate('/login'), 3000); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="glassmorphism p-8 space-y-6">
          <div className="text-center">
            <img src="/logodesen2.svg" alt="Desen Logo" className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white">Register Akun</h2>
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              className="w-full p-3 bg-gray-700/50 rounded-lg border border-transparent focus:border-white/20 focus:outline-none"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full p-3 bg-gray-700/50 rounded-lg border border-transparent focus:border-white/20 focus:outline-none"
              type="password"
              placeholder="Password (minimal 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Mendaftarkan...' : 'Register'}
            </button>
          </form>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {message && <p className="text-green-400 text-center">{message}</p>}
          <p className="text-center text-gray-400">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
