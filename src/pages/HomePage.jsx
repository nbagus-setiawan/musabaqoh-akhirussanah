import React from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../public/components/Hero';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Hero
      onGoToForm={() => navigate('/formulir')}
      onGoToGuide={() => navigate('/syarat-ketentuan')}
      onGoToStatus={() => navigate('/cek-status')}
    />
  );
}
