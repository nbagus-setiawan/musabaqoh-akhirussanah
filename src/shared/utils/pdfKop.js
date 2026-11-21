/**
 * Helper load base64 image dari URL untuk KOP PDF resmi
 */
export const getBase64Image = async (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};

/**
 * Standard KOP Resmi Panitia Musabaqoh Akhirussanah Pondok Pesantren Salafiyah Al-Falah Putak
 * Banner resmi dengan kaligrafi Arab (مسابقة أخير السنة), logo kubah musabaqoh, logo pesantren,
 * identitas panitia, alamat sekretariat, dan ornamen hijau pembatas.
 * Digunakan secara 100% IDENTIK pada:
 * 1. Unduh PDF Data Santri (AdminSantri.jsx)
 * 2. Unduh Bukti Pendaftaran Delegasi (BuktiPendaftaranPage.jsx)
 * 
 * Parameter:
 * - doc: instance jsPDF (orientasi portrait A4, unit 'mm')
 * - leftMargin: default 14.5 mm
 * - rightMargin: default 14.5 mm
 */
export const drawOfficialKop = async (doc, leftMargin = 14.5, rightMargin = 14.5) => {
  const pageWidth = 210;
  const rightEdge = pageWidth - rightMargin; // 195.5 mm
  const kopWidth = rightEdge - leftMargin; // 181.0 mm
  const kopHeight = kopWidth * (427 / 2249); // ~34.36 mm
  const topY = 8.5; // Jarak tepi atas kertas 8.5 mm

  // Banner Resmi Musabaqoh Akhirussanah 1447 H / 2026 M
  const kopBase64 = await getBase64Image('/kop-resmi.jpg');
  if (kopBase64) {
    try {
      doc.addImage(kopBase64, 'JPEG', leftMargin, topY, kopWidth, kopHeight);
    } catch (e) {
      console.warn('Gagal render KOP banner di PDF:', e);
    }
  }

  return {
    leftMargin,
    rightMargin,
    rightEdge,
    kopWidth,
    kopHeight,
    kopBottomY: topY + kopHeight // ~42.86 mm
  };
};
