import React from 'react';
import { useNavigate } from 'react-router-dom';
import GuideInstructions from '../public/components/GuideInstructions';

export default function SyaratKetentuanPage() {
  const navigate = useNavigate();

  return (
    <div className="py-2">
      <GuideInstructions
        onGoToForm={() => navigate('/formulir')}
      />
    </div>
  );
}
