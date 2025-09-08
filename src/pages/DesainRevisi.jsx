import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FiSearch, FiDownload, FiUpload } from 'react-icons/fi';

// Halaman Desain Revisi
function DesainRevisi() {
  const [desains, setDesains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null); // State untuk melacak ID baris yang diedit
  const [editingText, setEditingText] = useState(''); // State untuk menyimpan teks yang diedit

  // Fungsi untuk mengambil data dari Supabase
  const getDesains = async () => {
    console.log("Fetching revision designs from Supabase...");
    setLoading(true);
    const { data, error } = await supabase
      .from('desains')
      .select('*')
      .eq('status', 'revisi') // Filter status hanya untuk 'revisi'
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

  // Panggil fungsi getDesains saat komponen dimuat dan setup realtime listener
  useEffect(() => {
    getDesains();

    const channel = supabase.channel('desains-revisi-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'desains' }, payload => {
        console.log('Realtime update received!', payload);
        getDesains();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fungsi untuk menandai briefing telah dilihat
  const handleBriefingDilihat = async (id) => {
    console.log(`Marking briefing as seen for id: ${id}`);
    setDesains(currentDesains => 
      currentDesains.map(d => 
        d.id === id ? { ...d, briefing_dilihat: true } : d
      )
    );

    const { error } = await supabase
      .from('desains')
      .update({ briefing_dilihat: true })
      .eq('id', id);
    
    if (error) {
      console.error("Error updating briefing_dilihat:", error.message);
      setError('Gagal menandai briefing.');
      getDesains();
    } else {
      console.log("Briefing marked as seen successfully.");
    }
  };
  
  // Fungsi untuk memulai mode edit
  const handleEditClick = (desain) => {
    setEditingId(desain.id);
    setEditingText(desain.briefing);
  };

  // Fungsi untuk membatalkan edit
  const handleCancelClick = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Fungsi untuk menyimpan perubahan briefing
  const handleSaveClick = async (id) => {
    // Data yang akan diupdate
    const updatedData = { 
      briefing: editingText, 
      briefing_dilihat: false // Set menjadi false untuk memicu indikator
    };

    const { error } = await supabase
      .from('desains')
      .update(updatedData)
      .eq('id', id);
    
    if (error) {
      console.error("Error updating briefing:", error.message);
      setError('Gagal memperbarui briefing.');
    } else {
      console.log("Briefing updated successfully, briefing_dilihat set to false.");
      // Perbarui state lokal dengan data baru
      setDesains(currentDesains =>
        currentDesains.map(d =>
          d.id === id ? { ...d, ...updatedData } : d
        )
      );
    }
    // Keluar dari mode edit
    setEditingId(null);
    setEditingText('');
  };


  // Fungsi untuk menangani perubahan status
  const handleStatusChange = async (id, newStatus) => {
    console.log(`Updating status for id: ${id} to ${newStatus}`);
    
    const { error } = await supabase
      .from('desains')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error("Error updating status:", error.message);
      setError('Gagal memperbarui status.');
    } else {
      console.log("Status updated successfully.");
      setDesains(currentDesains => currentDesains.filter(d => d.id !== id));
    }
  };
  
  // Fungsi untuk menangani upload hasil desain
  const handleUploadHasilDesain = async (e, desainId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileName = `${desainId}/${Date.now()}-${file.name}`;
    console.log(`Uploading file: ${fileName} to bucket 'hasil_desain'`);

    const { error: uploadError } = await supabase.storage
      .from('hasil_desain')
      .upload(fileName, file);

    if (uploadError) {
      setError('Gagal mengunggah file.');
      return;
    }
    
    const { data: urlData } = supabase.storage
      .from('hasil_desain')
      .getPublicUrl(fileName);

    const publicURL = urlData.publicUrl;

    const { data: currentDesain, error: fetchError } = await supabase
      .from('desains')
      .select('hasil_desain')
      .eq('id', desainId)
      .single();

    if (fetchError) {
      setError('Gagal mengambil data desain saat ini.');
      return;
    }

    const updatedHasilDesain = [...(currentDesain.hasil_desain || []), publicURL];

    const { error: dbError } = await supabase
      .from('desains')
      .update({ hasil_desain: updatedHasilDesain })
      .eq('id', desainId);

    if (dbError) {
      setError('Gagal memperbarui database dengan URL file.');
    } else {
      setDesains(currentDesains =>
        currentDesains.map(d =>
          d.id === desainId ? { ...d, hasil_desain: updatedHasilDesain } : d
        )
      );
    }
  };

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
        <h1 className="text-3xl font-bold">Desain Revisi</h1>
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
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {desains.length > 0 ? (
                desains.map((desain, index) => (
                  <tr 
                    key={desain.id} 
                    className={`border-b border-white/10 hover:bg-white/5 transition-colors duration-300 ${!desain.briefing_dilihat ? 'bg-green-500/20' : ''}`}
                  >
                    <td className="p-4 align-top">{index + 1}</td>
                    <td className="p-4 align-top">
                      <div className="font-semibold">{desain.nama_client}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-sm text-gray-400">{new Date(desain.tanggal_briefing).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td 
                      className="p-4 align-top max-w-sm"
                      onDoubleClick={() => handleEditClick(desain)}
                      onClick={() => !desain.briefing_dilihat && editingId !== desain.id && handleBriefingDilihat(desain.id)}
                    >
                      {editingId === desain.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-2 bg-gray-800 rounded-md border border-white/20 focus:outline-none"
                            rows="4"
                          />
                          <div className="flex space-x-2">
                            <button onClick={() => handleSaveClick(desain.id)} className="px-3 py-1 bg-indigo-600 rounded-md text-sm hover:bg-indigo-700">Simpan</button>
                            <button onClick={handleCancelClick} className="px-3 py-1 bg-gray-600 rounded-md text-sm hover:bg-gray-700">Batal</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300 whitespace-pre-wrap cursor-pointer">{desain.briefing}</p>
                      )}
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
                        <label className="flex items-center space-x-2 text-gray-400 hover:text-white cursor-pointer">
                          <FiUpload size={16} />
                          <span>Upload File</span>
                          <input type="file" className="hidden" onChange={(e) => handleUploadHasilDesain(e, desain.id)} />
                        </label>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <select
                        value={desain.status}
                        onChange={(e) => handleStatusChange(desain.id, e.target.value)}
                        className="bg-gray-700/50 rounded-lg p-2 border border-transparent focus:border-white/20 focus:outline-none"
                      >
                        <option value="revisi">revisi</option>
                        <option value="proses">proses</option>
                        <option value="selesai">selesai</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-400">
                    Tidak ada desain revisi.
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

export default DesainRevisi;

