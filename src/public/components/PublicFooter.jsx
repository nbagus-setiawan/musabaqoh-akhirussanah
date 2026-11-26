import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer 
      className="bg-gradient-to-b from-[#075B45] via-[#054736] to-[#04382B] text-white no-print mt-auto relative select-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      {/* Garis Aksen Emas Elegan di Bagian Atas */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#D9B45B] to-transparent opacity-80"></div>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-7">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Identitas Lembaga & Acara */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 shadow-inner">
              <Award className="w-5 h-5 text-[#D9B45B]" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                Musabaqah Akhirussanah 1447 H / 2026 M
              </h4>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                YPPS Pondok Pesantren Al-Falah Putak
              </p>
              <p className="text-[11px] text-emerald-200/60 mt-0.5">
                Gelumbang, Muara Enim, Sumatera Selatan
              </p>
            </div>
          </div>

          {/* Tombol Akses Khusus Panitia */}
          <Link
            to="/admin"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-[#D9B45B] hover:text-white border border-[#D9B45B]/40 hover:border-[#D9B45B] text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <ShieldCheck className="w-4 h-4 text-[#D9B45B]" />
            <span>Portal Panitia</span>
          </Link>
        </div>

        {/* Garis Pembatas Halus */}
        <div className="border-t border-white/10 my-4"></div>

        {/* Baris Bawah: Hak Cipta & Pengembang */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-emerald-200/70 text-center sm:text-left">
          <p>
            © 2026 Panitia Pelaksana Musabaqah Akhirussanah. Seluruh hak cipta dilindungi.
          </p>
          <p className="text-emerald-200/50 text-[10.5px]">
            Dikembangkan oleh Jakastra Official
          </p>
        </div>
      </div>
    </footer>
  );
}
