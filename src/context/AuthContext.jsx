import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Membuat Context untuk Autentikasi
const AuthContext = createContext();

// Komponen Provider untuk membungkus aplikasi
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mengambil sesi yang sedang berjalan saat aplikasi dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      console.log("Initial session loaded:", session);
    });

    // Mendengarkan perubahan status autentikasi (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        console.log("Auth state changed:", session);
      }
    );

    // Membersihkan listener saat komponen dilepas
    return () => subscription.unsubscribe();
  }, []);

  // Fungsi untuk sign out
  const signOut = async () => {
    console.log("Signing out...");
    await supabase.auth.signOut();
  };

  const value = {
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook untuk menggunakan AuthContext
export function useAuth() {
  return useContext(AuthContext);
}
