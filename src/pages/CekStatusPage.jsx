import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckStatus from '../public/components/CheckStatus';
import { fetchRegistrations, getLocalRegistrations, subscribeDataChanged } from '../shared/services/api';

export default function CekStatusPage() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState(() => getLocalRegistrations());
  const [loading, setLoading] = useState(() => getLocalRegistrations().length === 0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchRegistrations();
        setRegistrations(data);
      } catch (err) {
        console.error('Gagal mengambil data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Langganan real-time: status langsung berubah otomatis tanpa perlu refresh
    const unsubscribe = subscribeDataChanged(() => {
      const fresh = getLocalRegistrations();
      if (Array.isArray(fresh)) {
        setRegistrations(fresh);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleViewTicket = (item) => {
    try {
      sessionStorage.setItem('alfalah_latest_ticket', JSON.stringify(item));
    } catch (e) {}
    navigate('/bukti-pendaftaran', { state: { ticket: item } });
  };

  return (
    <div className="py-4">
      {loading ? (
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
          Memuat basis data pendaftaran...
        </div>
      ) : (
        <CheckStatus
          registrations={registrations}
          onViewTicket={handleViewTicket}
        />
      )}
    </div>
  );
}
