import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

// Halaman Login
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fungsi untuk menangani submit form
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log("Attempting to log in with:", email);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Login error:", error.message);
      setError(error.message);
    } else {
      console.log("Login successful, navigating to dashboard.");
      navigate('/'); // Arahkan ke halaman utama setelah login berhasil
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="glassmorphism p-8 space-y-6">
          <div className="text-center">
            <img src="/logodesen2.svg" alt="Desen Logo" className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white">Login Desainer</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <p className="text-center text-gray-400">
            Belum punya akun?{' '}
            <Link to="/register" className="font-semibold text-indigo-400 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
