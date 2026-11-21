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
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};

/**
 * Standard KOP Resmi YPPS Pondok Pesantren Salafiyah Al-Falah Putak
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

  // 1. Logo Resmi Pesantren Al-Falah Putak (Ukuran & Posisi pas di samping teks KOP)
  const logoBase64 = await getBase64Image('/logo.png');
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 15.0, 10.5, 26, 23.8);
    } catch (e) {
      console.warn('Gagal render logo di PDF:', e);
    }
  }

  // 2. Teks KOP Surat Resmi (Titik tengah X = 115 mm)
  const kopCenterX = 115;

  // Line 1: Yayasan (Bold, 11.5 pt)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(0, 0, 0);
  doc.text('YAYASAN PONDOK PESANTREN SALAFIYAH AL-FALAH PUTAK', kopCenterX, 15.5, { align: 'center' });

  // Line 2: Panitia Musabaqoh (Bold, 14 pt)
  doc.setFontSize(14);
  doc.text('PANITIA MUSABAQOH AKHIRUSSANAH', kopCenterX, 22.0, { align: 'center' });

  // Line 3: Alamat (Normal, 10 pt)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Dusun II Ds. Putak Kec. Gelumbang Kab. Muara Enim Sumatera Selatan Kode Pos 31171', kopCenterX, 27.5, { align: 'center' });

  // Line 4: Kontak (Normal, 9.5 pt)
  doc.setFontSize(9.5);
  doc.text('Telp. : 082118702717 | E-mail : ponpesalfalahputak@gmail.com', kopCenterX, 32.5, { align: 'center' });

  // 3. Garis Ganda Pembatas KOP (Tebal atas 0.8 mm, tipis bawah 0.25 mm)
  doc.setLineWidth(0.8);
  doc.setDrawColor(0, 0, 0);
  doc.line(leftMargin, 36.8, rightEdge, 36.8);

  doc.setLineWidth(0.25);
  doc.line(leftMargin, 38.0, rightEdge, 38.0);

  return {
    leftMargin,
    rightMargin,
    rightEdge,
    kopBottomY: 38.0
  };
};
