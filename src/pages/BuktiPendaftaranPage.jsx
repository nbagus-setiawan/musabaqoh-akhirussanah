import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Search } from 'lucide-react';
import SuccessTicket from '../public/components/SuccessTicket';

export default function BuktiPendaftaranPage() {
  const location = useLocation();
  const navigate = useNavigate();

  let ticket = location.state?.ticket;

  if (!ticket) {
    try {
      const stored = sessionStorage.getItem('alfalah_latest_ticket');
      if (stored) {
        ticket = JSON.parse(stored);
      }
    } catch (e) {}
  }

  if (!ticket) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
          <FileQuestion className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Belum Ada Bukti Pendaftaran yang Dipilih
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Silakan isi formulir pendaftaran terlebih dahulu atau gunakan fitur pencarian pada menu Cek Status Pendaftaran.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/formulir"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#075B45] text-white font-bold text-xs shadow-xs"
          >
            Buka Formulir Pendaftaran
          </Link>
          <Link
            to="/cek-status"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center space-x-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cari Data Pendaftaran</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-1 sm:py-4">
      <SuccessTicket
        registration={ticket}
        onRegisterAnother={() => navigate('/')}
        onBackHome={() => navigate('/')}
      />
    </div>
  );
}
