import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import HomePage from './pages/HomePage';
import SyaratKetentuanPage from './pages/SyaratKetentuanPage';
import FormulirPage from './pages/FormulirPage';
import CekStatusPage from './pages/CekStatusPage';
import BuktiPendaftaranPage from './pages/BuktiPendaftaranPage';
import AdminPage from './pages/AdminPage';

// Komponen penangkap #admin hash untuk redirect ke /admin
function HashWatcher() {
  const location = useLocation();

  useEffect(() => {
    if (window.location.hash === '#admin') {
      window.location.href = '/admin';
    }
  }, [location]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <HashWatcher />
      <Routes>
        
        {/* Rute Publik Terstruktur dengan PublicLayout (Header & Green Footer) */}
        <Route element={<PublicLayout />}>
          {/* Halaman Utama langsung Formulir Pendaftaran untuk kemudahan Ustadz / Ustadzah */}
          <Route path="/" element={<FormulirPage />} />
          <Route path="/formulir" element={<Navigate to="/" replace />} />
          <Route path="/syarat-ketentuan" element={<SyaratKetentuanPage />} />
          <Route path="/petunjuk" element={<Navigate to="/syarat-ketentuan" replace />} />
          <Route path="/cek-status" element={<CekStatusPage />} />
          <Route path="/status" element={<Navigate to="/cek-status" replace />} />
          <Route path="/bukti-pendaftaran" element={<BuktiPendaftaranPage />} />
          <Route path="/tiket" element={<Navigate to="/bukti-pendaftaran" replace />} />
        </Route>

        {/* Rute Khusus Panel Admin Panitia */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Fallback Rute Tidak Dikenal ke Formulir */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
