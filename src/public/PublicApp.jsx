import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import PublicNavbar from './components/PublicNavbar';
import Hero from './components/Hero';
import GuideInstructions from './components/GuideInstructions';
import RegistrationForm from './components/RegistrationForm';
import SuccessTicket from './components/SuccessTicket';
import CheckStatus from './components/CheckStatus';
import PublicFooter from './components/PublicFooter';
import { fetchRegistrations, saveRegistration, getLocalRegistrations, subscribeDataChanged } from '../shared/services/api';

export default function PublicApp() {
  const [activeTab, setActiveTab] = useState('beranda'); // 'beranda' | 'petunjuk' | 'formulir' | 'status' | 'ticket'
  const [registrations, setRegistrations] = useState(() => getLocalRegistrations());
  const [activeTicket, setActiveTicket] = useState(null);
  const [savedWaliData, setSavedWaliData] = useState(null);

  const loadData = async () => {
    try {
      const data = await fetchRegistrations();
      setRegistrations(data);
    } catch (e) {
      console.error('Error load public data:', e);
    }
  };

  useEffect(() => {
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const unsubscribe = subscribeDataChanged(() => {
      const fresh = getLocalRegistrations();
      if (Array.isArray(fresh)) {
        setRegistrations(fresh);
      }
    });

    return () => unsubscribe();
  }, [activeTab]);

  const handleFormSubmit = async (formData) => {
    const savedEntry = await saveRegistration(formData);
    
    // Simpan data wali kelas & nomor WA agar siap digunakan untuk santri berikutnya
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
    } catch (e) {}

    await loadData();

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setActiveTicket(savedEntry);
    setActiveTab('ticket');
  };

  const handleRegisterAnother = () => {
    setActiveTicket(null);
    setActiveTab('formulir');
  };

  const handleViewTicket = (item) => {
    setActiveTicket(item);
    setActiveTab('ticket');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Navbar Resmi Kelembagaan YPPS Al-Falah Putak */}
      <PublicNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Konten Utama Berdasarkan Tab */}
      <main className="flex-1">
        {activeTab === 'beranda' && (
          <Hero
            onGoToForm={() => setActiveTab('formulir')}
            onGoToGuide={() => setActiveTab('petunjuk')}
            onGoToStatus={() => setActiveTab('status')}
          />
        )}

        {activeTab === 'petunjuk' && (
          <GuideInstructions
            onGoToForm={() => setActiveTab('formulir')}
            onGoToStatus={() => setActiveTab('status')}
          />
        )}

        {activeTab === 'formulir' && (
          <RegistrationForm
            onSubmitSuccess={handleFormSubmit}
            initialWaliData={savedWaliData}
          />
        )}

        {activeTab === 'status' && (
          <CheckStatus
            registrations={registrations}
            onViewTicket={handleViewTicket}
          />
        )}

        {activeTab === 'ticket' && (
          <SuccessTicket
            registration={activeTicket}
            onRegisterAnother={handleRegisterAnother}
            onBackHome={() => setActiveTab('beranda')}
          />
        )}
      </main>

      {/* Footer Hijau Resmi Lembaga Al-Falah Putak */}
      {activeTab !== 'ticket' && <PublicFooter onNavClick={(tab) => setActiveTab(tab)} />}

    </div>
  );
}
