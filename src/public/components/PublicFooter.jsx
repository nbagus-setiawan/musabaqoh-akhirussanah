import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer 
      className="bg-white border-t border-slate-200/80 text-slate-500 no-print mt-auto py-5 px-4 select-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <p className="text-xs font-bold text-slate-800 tracking-tight">
            Musabaqah Akhirussanah 1447 H / 2026 M
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            YPPS Pondok Pesantren Al-Falah Putak • Jakastra
          </p>
        </div>

        <Link
          to="/admin"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-600 hover:text-[#075B45] text-xs font-bold transition-all shadow-2xs"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#075B45]" />
          <span>Portal Panitia</span>
        </Link>
      </div>
    </footer>
  );
}
