import React from 'react';
import { useNavigate } from 'react-router-dom';
import CheckStatus from '../public/components/CheckStatus';
import { getLocalRegistrations } from '../shared/services/api';

export default function CekStatusPage() {
  const navigate = useNavigate();

  const handleViewTicket = (item) => {
    try {
      sessionStorage.setItem('alfalah_latest_ticket', JSON.stringify(item));
    } catch (e) {}
    navigate('/bukti-pendaftaran', { state: { ticket: item } });
  };

  return (
    <div className="py-4">
      <CheckStatus
        registrations={getLocalRegistrations()}
        onViewTicket={handleViewTicket}
      />
    </div>
  );
}
