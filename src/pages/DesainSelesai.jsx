import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FiSearch, FiDownload } from 'react-icons/fi';

// Halaman Desain Selesai
function DesainSelesai() {
  const [desains, setDesains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fungsi untuk mengambil data dari Supabase
  const getDesains = async () => {
    console.log("Fetching completed designs from Supabase...");
    setLoading(true);
    const { data, error } = await supabase
      .from('desains')
      .select('*')
      .eq('status', 'selesai') // Filter status hanya untuk 'selesai'
      .order('created_at', { ascending: false }); // Urutkan dari yang terbaru

    if (error) {
      console.error("Error fetching designs:", error.message);
      setError('Gagal memuat data desain.');
      setDesains([]);
    } else {
      console.log("Successfully fetched designs:", data);
      setDesains(data);
      setError('');
    }
    setLoading(false);
  };

  // Panggil fungsi getDesains saat komponen dimuat
  useEffect(() => {
    getDesains();

    const channel = supabase.channel('desains-selesai-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'desains' }, payload => {
        console.log('Realtime update received on completed designs!', payload);
        getDesains();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fungsi untuk mendapatkan nama file dari URL
  const getFileNameFromUrl = (url) => {
    try {
      const urlObject = new URL(url);
      const pathParts = urlObject.pathname.split('/');
      return decodeURIComponent(pathParts[pathParts.length - 1]);
    } catch (e) {
      return 'file';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Desain Selesai</h1>
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Cari client..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700/50 rounded-lg border border-transparent focus:border-white/20 focus:outline-none"
          />
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {loading ? <p>Loading...</p> : error ? <p className="text-red-400">{error}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4">No</th>
                <th className="p-4">Client</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Briefing</th>
                <th className="p-4">Files</th>
                <th className="p-4">Hasil Desain</th>
              </tr>
            </thead>
            <tbody>
              {desains.length > 0 ? (
                desains.map((desain, index) => (
                  <tr 
                    key={desain.id} 
                    className="border-b border-white/10 hover:bg-white/5"
                  >
                    <td className="p-4 align-top">{index + 1}</td>
                    <td className="p-4 align-top">
                      <div className="font-semibold">{desain.nama_client}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-sm text-gray-400">{new Date(desain.tanggal_briefing).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="p-4 align-top max-w-sm">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{desain.briefing}</p>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col space-y-2">
                        {desain.files && desain.files.map((fileUrl, fileIndex) => (
                          <a key={fileIndex} href={fileUrl} target="_blank" rel="noopener noreferrer" download className="flex items-center space-x-2 text-indigo-400 hover:underline">
                            <FiDownload size={16} />
                            <span>{getFileNameFromUrl(fileUrl)}</span>
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col space-y-2">
                        {desain.hasil_desain && desain.hasil_desain.map((fileUrl, fileIndex) => (
                          <a key={fileIndex} href={fileUrl} target="_blank" rel="noopener noreferrer" download className="flex items-center space-x-2 text-green-400 hover:underline">
                            <FiDownload size={16} />
                            <span>{getFileNameFromUrl(fileUrl)}</span>
                          </a>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-gray-400">
                    Tidak ada desain yang selesai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DesainSelesai;
