import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { FiSearch, FiDownload, FiUpload, FiTrash, FiChevronLeft, FiChevronRight, FiFile, FiCopy, FiCheck } from 'react-icons/fi';

// Komponen untuk menampilkan media (gambar/video) dalam slider
function MediaSlider({ files, canDownload = true }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!files || files.length === 0) {
    return <div className="w-24 h-24 flex items-center justify-center bg-gray-800 rounded-md text-gray-500 text-xs text-center">Tidak Ada File</div>;
  }

  const goToPrevious = (e) => {
    e.stopPropagation();
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? files.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = (e) => {
    e.stopPropagation();
    const isLastSlide = currentIndex === files.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const renderMedia = (url) => {
    const fileExtension = url.split('.').pop().toLowerCase().split('?')[0];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'ogg'];

    if (imageExtensions.includes(fileExtension)) {
      return <img src={url} alt="Referensi media" className="w-full h-full object-cover" />;
    } else if (videoExtensions.includes(fileExtension)) {
      return <video src={url} muted loop playsInline className="w-full h-full object-cover" />;
    } else {
      return <div className="w-full h-full flex items-center justify-center bg-gray-700"><FiFile className="text-gray-400" size={32} /></div>;
    }
  };

  return (
    <div className="relative w-24 h-24 group rounded-md overflow-hidden">
      <div className="w-full h-full">
        {renderMedia(files[currentIndex])}
      </div>

      {canDownload && (
        <a
          href={files[currentIndex]}
          download
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-label="Download file"
        >
          <FiDownload size={24} className="text-white" />
        </a>
      )}

      {files.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute top-1/2 left-1 transform -translate-y-1/2 bg-black/40 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60"
            aria-label="Previous file"
          >
            <FiChevronLeft size={16} />
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-1 transform -translate-y-1/2 bg-black/40 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60"
            aria-label="Next file"
          >
            <FiChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

// Komponen untuk menampilkan briefing dengan fungsionalitas expand/collapse dan copy
function BriefingCell({ text }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Memproses teks untuk pembatasan kata dan baris
  const { displayText, needsTruncation } = useMemo(() => {
    if (!text) return { displayText: '', needsTruncation: false };

    const words = text.split(/\s+/);
    let lines = [];
    let currentLine = [];
    let currentWordCount = 0;

    for (const word of words) {
        currentLine.push(word);
        currentWordCount++;
        if (currentWordCount >= 5) {
            lines.push(currentLine.join(' '));
            currentLine = [];
            currentWordCount = 0;
        }
    }
    if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
    }

    const needsTruncation = lines.length > 4;
    const truncatedLines = isExpanded ? lines : lines.slice(0, 4);
    const displayText = truncatedLines.join('\n');
    
    return { displayText, needsTruncation };
  }, [text, isExpanded]);

  // Fungsi untuk menyalin teks ke clipboard
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset status copy setelah 2 detik
  };

  return (
    <div className="relative group">
      <p className="text-sm text-gray-300 whitespace-pre-wrap">{displayText}</p>
      {needsTruncation && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-indigo-400 text-xs font-semibold hover:underline mt-1"
        >
          {isExpanded ? 'Lebih sedikit' : 'Lebih banyak'}
        </button>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-0 right-0 p-1 bg-gray-700/50 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
        aria-label="Copy briefing"
      >
        {copied ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} />}
      </button>
    </div>
  );
}

// Halaman Desain Baru
function DesainBaru() {
  const [desains, setDesains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // State baru untuk search

  // Fungsi untuk mengambil data dari Supabase
  const getDesains = async (searchQuery) => {
    console.log("Fetching new designs from Supabase...");
    setLoading(true);
    
    let query = supabase
      .from('desains')
      .select('*')
      .in('status', ['dalam antrian', 'proses'])
      .order('created_at', { ascending: true }); 
    
    // Menambahkan filter pencarian jika ada searchTerm
    if (searchQuery) {
      query = query.ilike('nama_client', `%${searchQuery}%`);
    }

    const { data, error } = await query;

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

  // Panggil fungsi getDesains saat searchTerm berubah (dengan debounce)
  useEffect(() => {
    console.log(`Search term updated: ${searchTerm}. Debouncing fetch...`);
    const delayDebounceFn = setTimeout(() => {
      getDesains(searchTerm);
    }, 500); // Debounce 500ms

    const channel = supabase.channel('desains-baru-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'desains' }, payload => {
        console.log('Realtime update received on new designs!', payload);
        getDesains(searchTerm);
      })
      .subscribe();

    return () => {
      clearTimeout(delayDebounceFn);
      supabase.removeChannel(channel);
    };
  }, [searchTerm]);

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
      getDesains(searchTerm);
    } else {
      console.log("Briefing marked as seen successfully.");
    }
  };

  const handleEditClick = (desain) => {
    console.log("Starting edit mode for briefing.");
    setEditingId(desain.id);
    setEditingText(desain.briefing);
  };

  const handleCancelClick = () => {
    console.log("Cancelling edit mode.");
    setEditingId(null);
    setEditingText('');
  };

  const handleSaveClick = async (id) => {
    console.log(`Saving briefing for id: ${id}`);
    const updatedData = { 
      briefing: editingText, 
      briefing_dilihat: false 
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
      setDesains(currentDesains =>
        currentDesains.map(d =>
          d.id === id ? { ...d, ...updatedData } : d
        )
      );
    }
    setEditingId(null);
    setEditingText('');
  };

  const handleStatusChange = async (id, newStatus) => {
    console.log(`Updating status for id: ${id} to ${newStatus}`);
    
    setDesains(currentDesains =>
      currentDesains.map(d => (d.id === id ? { ...d, status: newStatus } : d))
    );

    const { error } = await supabase
      .from('desains')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error("Error updating status:", error.message);
      setError('Gagal memperbarui status.');
      getDesains(searchTerm); 
    } else {
      console.log("Status updated successfully.");
    }
  };
  
  const handleUploadHasilDesain = async (e, desainId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileName = `${desainId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('hasil_desain')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError.message);
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
      console.error('Error fetching current design data:', fetchError.message);
      setError('Gagal mengambil data desain saat ini.');
      return;
    }

    const updatedHasilDesain = [...(currentDesain.hasil_desain || []), publicURL];

    const { error: dbError } = await supabase
      .from('desains')
      .update({ 
        hasil_desain: updatedHasilDesain,
        desain_diupdate: false
      })
      .eq('id', desainId);

    if (dbError) {
      console.error('Error updating database:', dbError.message);
      setError('Gagal memperbarui database dengan URL file.');
    } else {
      console.log("Database updated successfully.");
      setDesains(currentDesains =>
        currentDesains.map(d =>
          d.id === desainId ? { ...d, hasil_desain: updatedHasilDesain, desain_diupdate: false } : d
        )
      );
    }
  };

  const getFileNameFromUrl = (url) => {
    try {
      const urlObject = new URL(url);
      const pathParts = urlObject.pathname.split('/');
      return decodeURIComponent(pathParts[pathParts.length - 1]);
    } catch (e)
    {
      console.warn("Could not parse URL to get file name:", url);
      return 'file';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Desain Baru</h1>
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Cari client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700/50 rounded-lg border border-transparent focus:border-white/20 focus:outline-none"
          />
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-center">No</th>
                <th className="p-4 text-center">Client</th>
                <th className="p-4 text-center">Tanggal</th>
                <th className="p-4">Briefing</th>
                <th className="p-4">Reverensi</th>
                <th className="p-4">Hasil Desain</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {desains.length > 0 ? (
                desains.map((desain, index) => {
                  const rowClassName = !desain.briefing_dilihat ? 'bg-green-500/20 cursor-pointer' : '';
                  return (
                    <tr 
                      key={desain.id} 
                      className={`border-b border-white/10 hover:bg-white/5 transition-colors duration-300 ${rowClassName}`}
                      onClick={() => {
                        if (!desain.briefing_dilihat) {
                           handleBriefingDilihat(desain.id);
                        }
                      }}
                    >
                      <td className="p-4 align-middle text-center">{index + 1}</td>
                      <td className="p-4 align-middle text-center">
                        <div className="font-semibold uppercase">{desain.nama_client}</div>
                      </td>
                      <td className="p-4 align-middle text-center">
                        <div className="text-sm text-gray-400">{new Date(desain.tanggal_briefing).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td 
                        className="p-4 align-top max-w-sm"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(desain);
                        }}
                      >
                        {editingId === desain.id ? (
                          <div 
                            className="space-y-2"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                          <BriefingCell text={desain.briefing} />
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <MediaSlider files={desain.files} />
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-center">
                            <MediaSlider files={desain.hasil_desain} canDownload={false} />
                          </div>
                          {desain.hasil_desain && desain.hasil_desain.length > 0 && (
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Asumsi hanya ada satu file hasil desain yang bisa dihapus di halaman ini
                                  handleDeleteHasilDesain(desain.id, desain.hasil_desain[0]);
                                }}
                                className="p-2 rounded-full text-red-500 hover:bg-red-900/50 transition-colors"
                                aria-label="Hapus file"
                              >
                                <FiTrash size={16} />
                              </button>
                              <label className="p-2 rounded-full text-gray-400 hover:bg-white/10 cursor-pointer transition-colors" aria-label="Unggah file">
                                <FiUpload size={16} />
                                <input type="file" className="hidden" onChange={(e) => handleUploadHasilDesain(e, desain.id)} />
                              </label>
                            </div>
                          )}
                          {(!desain.hasil_desain || desain.hasil_desain.length === 0) && (
                            <label className="flex items-center space-x-2 text-gray-400 hover:text-white cursor-pointer mt-2 justify-center">
                              <FiUpload size={16} />
                              <span>Upload File</span>
                              <input type="file" className="hidden" onChange={(e) => handleUploadHasilDesain(e, desain.id)} />
                            </label>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <select
                          value={desain.status}
                          onChange={(e) => handleStatusChange(desain.id, e.target.value)}
                          className="bg-gray-700/50 rounded-lg p-2 border border-transparent focus:border-white/20 focus:outline-none"
                        >
                          <option value="dalam antrian">dalam antrian</option>
                          <option value="proses">proses</option>
                          <option value="revisi">revisi</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-400">
                    Tidak ada desain baru.
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

export default DesainBaru;
