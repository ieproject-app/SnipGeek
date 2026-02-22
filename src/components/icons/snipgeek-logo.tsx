import React from 'react';

/**
 * SnipGeekLogo - Komponen logo SVG fleksibel.
 * @param showBackground - Jika true, akan merender kotak background (cocok untuk favicon).
 *                         Jika false, hanya merender huruf SG (cocok untuk Header integrated).
 */
export const SnipGeekLogo = ({ 
  className, 
  showBackground = false, 
  ...props 
}: React.SVGProps<SVGSVGElement> & { showBackground?: boolean }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Background kotak hanya muncul jika showBackground true */}
      {showBackground ? (
        <rect
          width="100"
          height="100"
          rx="22"
          ry="22"
          fill="currentColor"
        />
      ) : null}
      
      {/* Teks SG - Menggunakan fill="white" jika ada background, atau "currentColor" jika integrated */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill={showBackground ? "white" : "currentColor"}
        style={{
          fontFamily: 'var(--font-space-grotesk), sans-serif',
          fontWeight: 900,
          fontSize: '64px',
        }}
      >
        SG
      </text>
    </svg>
  );
};

SnipGeekLogo.displayName = "SnipGeekLogo";
