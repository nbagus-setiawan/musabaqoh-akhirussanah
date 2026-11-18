import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import RegistrationForm from '../public/components/RegistrationForm';
import { saveRegistration } from '../shared/services/api';

export default function FormulirPage() {
  const navigate = useNavigate();
  const [savedWaliData, setSavedWaliData] = useState(() => {
    try {
      const stored = sessionStorage.getItem('alfalah_saved_wali') || localStorage.getItem('alfalah_saved_wali');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const handleFormSubmit = async (formData) => {
    const savedEntry = await saveRegistration(formData);
    
    // Simpan data wali kelas & nomor WA agar tidak terhapus saat mendaftarkan santri berikutnya
    const waliMeta = {
      waliKelas: formData.waliKelas,
      waliKelasId: formData.waliKelasId,
      isCustom: formData.isCustomWali,
      tingkat: formData.tingkatId,
      tingkatName: formData.tingkat,
      kelasKategori: formData.rawKelas || formData.kelasKategori,
      nomorWA: formData.nomorWA || '',
      jenisKelamin: formData.jenisKelamin || 'L'
    };
    
    setSavedWaliData(waliMeta);
    try {
      sessionStorage.setItem('alfalah_saved_wali', JSON.stringify(waliMeta));
      localStorage.setItem('alfalah_saved_wali', JSON.stringify(waliMeta));
      sessionStorage.setItem('alfalah_latest_ticket', JSON.stringify(savedEntry));
    } catch (e) {}

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    // Arahkan langsung ke halaman bukti pendaftaran
    navigate('/bukti-pendaftaran', { state: { ticket: savedEntry } });
  };

  return (
    <div className="py-1 sm:py-3">
      <RegistrationForm
        onSubmitSuccess={handleFormSubmit}
        initialWaliData={savedWaliData}
      />
    </div>
  );
}
