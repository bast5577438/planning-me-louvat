/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LouvatLogoProps {
  className?: string;
  color?: string;
}

export const LouvatLogo: React.FC<LouvatLogoProps> = ({ 
  className = "h-12", 
  color = "text-[#3C2A21]" 
}) => {
  return (
    <svg 
      viewBox="0 0 600 220" 
      className={`${className} ${color} transition-colors duration-200`} 
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      id="louvat-custom-logo-svg"
    >
      {/* Group wrapper to ensure good scale bounds */}
      <g>
        {/* L O U V text block */}
        <text 
          x="30" 
          y="135" 
          fontFamily="Georgia, serif" 
          fontSize="112" 
          fontWeight="bold" 
          letterSpacing="10"
          id="logo-text-louv"
        >
          LOUV
        </text>
        
        {/* T text block */}
        <text 
          x="515" 
          y="135" 
          fontFamily="Georgia, serif" 
          fontSize="112" 
          fontWeight="bold"
          id="logo-text-t"
        >
          T
        </text>

        {/* 
          High-fidelity vector draw for the "A" letter.
          In the Louvat logo, the left leg of the A starts far below the baseline,
          forming a divider/slash, and the apex of the A is extremely tall and sharp,
          rising well above the cap height of the other letters.
        */}
        <path 
          d="M 393,205 L 445,20 L 459,20 L 493,135 L 476,135 L 450,48 L 403,205 Z" 
          fill="currentColor" 
          id="logo-path-a-body"
        />
        
        {/* Horizontal crossbar of the A */}
        <rect 
          x="427" 
          y="88" 
          width="35" 
          height="7" 
          fill="currentColor" 
          id="logo-rect-a-bar"
        />

        {/* "BISCUITERIE" under LOUV */}
        <text 
          x="110" 
          y="185" 
          fontFamily="'Inter', 'Montserrat', sans-serif" 
          fontSize="22" 
          fontWeight="800" 
          letterSpacing="12"
          opacity="0.85"
          id="logo-text-biscuiterie"
        >
          BISCUITERIE
        </text>

        {/* "1954" under T */}
        <text 
          x="440" 
          y="185" 
          fontFamily="'Inter', 'Montserrat', sans-serif" 
          fontSize="22" 
          fontWeight="800" 
          letterSpacing="8"
          opacity="0.85"
          id="logo-text-1954"
        >
          1954
        </text>
      </g>
    </svg>
  );
};
