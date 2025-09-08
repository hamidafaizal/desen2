import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { FiSearch, FiDownload, FiUpload, FiChevronLeft, FiChevronRight, FiFile, FiCopy, FiCheck } from 'react-icons/fi';

// Komponen untuk menampilkan media (gambar/video) dalam slider
function MediaSlider({ files, canDownload = true }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // fungsi untuk mendapatkan nama file dari URL
  const getFileNameFromUrl = (url) => {
    try {
      const urlObject = new URL(url);
      const pathParts = urlObject.pathname.split('/');
      return decodeURIComponent(pathParts[pathParts.length - 1]);
    } catch (e) {
      console.warn("Could not parse URL to get file name:", url);
      return 'file';
    }
  };

  if (!files || files.length === 0) {
    return <div className="w-24 h-24 flex items-center justify-center bg-gray-800 rounded-md text-gray-500 text-xs text-center">Tidak Ada File</div>;
  }

  // fungsi untuk pindah ke media sebelumnya
  const goToPrevious = (e) => {
    e.stopPropagation();
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? files.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  // fungsi untuk pindah ke media berikutnya
  const goToNext = (e) => {
    e.stopPropagation();
    const isLastSlide = currentIndex === files.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  // helper untuk merender media berdasarkan ekstensi file
  const renderMedia = (url) => {
    const fileExtension = url.split('.').pop().toLowerCase().split('?')[0];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'ogg'];

    if (imageExtensions.includes(fileExtension)) {
      return <img src={url} alt={getFileNameFromUrl(url)} className="w-full h-full object-cover" />;
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

  // memproses teks untuk pembatasan kata dan baris
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

  // fungsi untuk menyalin teks ke clipboard
  const handleCopy = (e) => {
    e.stopPropagation();
    document.execCommand('copy', false, text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // reset status copy setelah 2 detik
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
  // State untuk menyimpan data desain dari Supabase
  const [desains, setDesains] = useState([]);
  // State untuk status loading saat mengambil data
  const [loading, setLoading] = useState(true);
  // State untuk menyimpan pesan error
  const [error, setError] = useState('');
  // State untuk pencarian
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fungsi untuk mengambil data dari Supabase
  const getDesains = async (searchQuery) => {
    console.log("Fetching new designs from Supabase...");
    setLoading(true);
    
    let query = supabase
      .from('desains')
      .select('*')
      .in('status', ['dalam antrian', 'proses'])
      .order('created_at', { ascending: true }); 

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
  
  // Memuat data saat komponen dimuat dan saat searchTerm berubah (dengan debounce)
  useEffect(() => {
    console.log(`Search term updated: ${searchTerm}. Debouncing fetch...`);
    const delayDebounceFn = setTimeout(() => {
      getDesains(searchTerm);
    }, 500);

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
      getDesains(searchTerm); 
    } else {
      console.log("Status updated successfully.");
      setDesains(currentDesains =>
        currentDesains.filter(d => d.id !== id)
      );
    }
  };
  
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
  
  const handleUploadHasilDesain = async (e, desainId) => {
    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected.");
      return;
    }
    
    const fileName = `${desainId}/${Date.now()}-${file.name}`;
    console.log(`Uploading file: ${fileName} to bucket 'hasil_desain'`);

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
    console.log(`Public URL: ${publicURL}`);

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

  return (
    <div className="flex flex-col h-full space-y-6 bg-transparent">
      {/* Header Halaman dan Judul Kolom yang Persisten */}
      <div className="sticky top-0 z-10 p-6 glassmorphism rounded-xl">
        <div className="flex justify-between items-center mb-4">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-center">No</th>
                <th className="p-4 text-center">Client</th>
                <th className="p-4 text-center">Tanggal</th>
                <th className="p-4 text-left">Briefing</th>
                <th className="p-4 text-center">Reverensi</th>
                <th className="p-4 text-center">Hasil Desain</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
          </table>
        </div>
      </div>
      
      {/* Konten tabel yang dapat di-scroll */}
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-left">
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center p-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="text-center p-8 text-red-400">
                  {error}
                </td>
              </tr>
            ) : desains.length > 0 ? (
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
                    <td className="p-4 align-top max-w-sm text-left">
                      <BriefingCell text={desain.briefing} />
                    </td>
                    <td className="p-4 align-middle text-center">
                      <MediaSlider files={desain.files} />
                    </td>
                    <td className="p-4 align-middle text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <MediaSlider files={desain.hasil_desain} canDownload={false} />
                        <label className="flex items-center space-x-2 text-gray-400 hover:text-white cursor-pointer mt-2">
                          <FiUpload size={16} />
                          <span>Upload File</span>
                          <input type="file" className="hidden" onChange={(e) => handleUploadHasilDesain(e, desain.id)} />
                        </label>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-center">
                      <select
                        value={desain.status}
                        onChange={(e) => handleStatusChange(desain.id, e.target.value)}
                        className="bg-gray-700/50 rounded-lg p-2 border border-transparent focus:border-white/20 focus:outline-none"
                      >
                        <option value="dalam antrian">dalam antrian</option>
                        <option value="proses">proses</option>
                        <option value="revisi">revisi</option>
                        <option value="selesai">selesai</option>
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
    </div>
  );
}

export default DesainBaru;
