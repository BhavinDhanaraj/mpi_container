import React from 'react';

// Crisp, high-fidelity SVGs of The Warehouse Group logo
export const BrandLogoWhite: React.FC<{ className?: string; width?: number }> = ({ className = '', width = 150 }) => (
  <div style={{ width }} className={`inline-block ${className}`}>
    <svg viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Red W circle badge */}
      <circle cx="40" cy="40" r="36" fill="#D0342C" />
      <path
        d="M23 26 L29 55 L38 36 L43 36 L52 55 L58 26 L64 26 L56 60 L49 60 L41 42 L33 60 L25 60 L17 26 Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="1.2"
      />
      {/* Text: thewarehousegroup */}
      <text x="88" y="34" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="19" letterSpacing="0.4">
        thewarehouse
      </text>
      <text x="88" y="55" fill="#C5E6B6" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="14" letterSpacing="1.2">
        GROUP
      </text>
    </svg>
  </div>
);

export const BrandLogoColor: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 34 }) => (
  <div style={{ height }} className={`inline-flex items-center ${className}`}>
    <svg viewBox="0 0 260 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: '100%', width: 'auto' }}>
      <circle cx="35" cy="35" r="32" fill="#D0342C" />
      <path
        d="M20 23 L25 48 L33 32 L37 32 L45 48 L50 23 L55 23 L48 53 L42 53 L35 37 L28 53 L22 53 L15 23 Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="1"
      />
      <text x="76" y="32" fill="#2C5A1E" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="17" letterSpacing="0.3">
        thewarehouse
      </text>
      <text x="76" y="50" fill="#6B7A66" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="12" letterSpacing="1">
        GROUP &middot; MPI
      </text>
    </svg>
  </div>
);
