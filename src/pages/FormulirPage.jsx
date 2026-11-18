import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import RegistrationForm from '../public/components/RegistrationForm';

export default function FormulirPage() {
  const navigate = useNavigate();

  const handleFormSubmit = async (batchResult) => {
    try {
      if (batchResult && batchResult.entries && batchResult.entries.length > 0) {
        sessionStorage.setItem('alfalah_latest_batch', JSON.stringify(batchResult));
        sessionStorage.setItem('alfalah_latest_ticket', JSON.stringify(batchResult.entries[0]));
      }
    } catch (e) {}

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    // Arahkan ke halaman bukti pendaftaran kolektif
    navigate('/bukti-pendaftaran', { 
      state: { 
        batchResult,
        ticket: batchResult?.entries?.[0] || null 
      } 
    });
  };

  return (
    <div className="py-1 sm:py-3">
      <RegistrationForm
        onSubmitSuccess={handleFormSubmit}
      />
    </div>
  );
}
