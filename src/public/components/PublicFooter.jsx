import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer 
      className="bg-[#054736] text-white no-print mt-auto border-t-2 border-[#D9B45B] py-3.5 px-4 text-center select-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.875rem)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs sm:text-[13px] font-semibold tracking-wide text-emerald-100/90">
          © 2026 JAKASTRA OFFICIAL. ALL RIGHT RESERVED
        </p>
        <Link
          to="/admin"
          className="text-emerald-200/70 hover:text-white underline text-[11px] font-medium transition-colors"
        >
          Portal Panitia
        </Link>
      </div>
    </footer>
  );
}
