import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer 
      className="bg-[#054736] text-white no-print mt-auto py-3.5 px-4 select-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.875rem)' }}
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left text-xs">
        <p className="text-emerald-100/90 font-medium">
          Musabaqah Akhirussanah 1447 H • YPPS Al-Falah Putak
        </p>

        <Link
          to="/admin"
          className="text-[#D9B45B] hover:text-white font-semibold transition-colors text-[11.5px]"
        >
          Portal Panitia
        </Link>
      </div>
    </footer>
  );
}
