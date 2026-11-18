import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PublicNavbar from '../public/components/PublicNavbar';
import PublicFooter from '../public/components/PublicFooter';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

export default function PublicLayout() {
  const { pathname } = useLocation();
  const isTicketPage = pathname === '/bukti-pendaftaran' || pathname === '/tiket';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <ScrollToTop />
      
      {/* Navbar Resmi Kelembagaan AL-FALAH PUTAK */}
      <PublicNavbar />

      {/* Konten Halaman Sesuai URL Route */}
      <main className={`flex-1 ${isTicketPage ? 'pb-6' : ''}`}>
        <Outlet />
      </main>

      {/* Footer Hijau Resmi Pesantren Al-Falah Putak (Disembunyikan pada halaman tiket agar pas di layar ponsel tanpa menggantung) */}
      {!isTicketPage && <PublicFooter />}
    </div>
  );
}
