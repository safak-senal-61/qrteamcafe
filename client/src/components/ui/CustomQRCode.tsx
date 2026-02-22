import React, { useMemo } from 'react';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';

interface CustomQRCodeProps {
  value: string;
  size?: number;
  logoUrl?: string;
  className?: string;
}

export const CustomQRCode: React.FC<CustomQRCodeProps> = ({ value, size = 200, logoUrl, className }) => {
  const qrData = useMemo(() => {
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'H' });
      return qr.modules;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [value]);

  if (!qrData) return null;

  const moduleCount = qrData.size;
  const cellSize = size / moduleCount;
  const logoSize = size * 0.25; // Logo is 25% of QR size
  const logoCellSize = Math.floor(moduleCount * 0.25);
  
  // Define finder pattern zones
  const isFinderPattern = (row: number, col: number) => {
    const isTopLeft = row < 7 && col < 7;
    const isTopRight = row < 7 && col >= moduleCount - 7;
    const isBottomLeft = row >= moduleCount - 7 && col < 7;
    return isTopLeft || isTopRight || isBottomLeft;
  };

  // Define logo zone (center)
  const isLogoZone = (row: number, col: number) => {
    const center = Math.floor(moduleCount / 2);
    const halfLogo = Math.ceil(logoCellSize / 2);
    return (
      row >= center - halfLogo &&
      row < center + halfLogo &&
      col >= center - halfLogo &&
      col < center + halfLogo
    );
  };

  const renderModules = () => {
    const modules: React.ReactNode[] = [];
    const data = qrData.data;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (isLogoZone(row, col)) continue; // Skip logo area

        const isDark = data[row * moduleCount + col];
        
        if (isDark) {
          if (isFinderPattern(row, col)) {
            // We will render custom finder patterns separately, so skip here
            continue;
          }

          // Render data dots
          modules.push(
            <circle
              key={`dot-${row}-${col}`}
              cx={col * cellSize + cellSize / 2}
              cy={row * cellSize + cellSize / 2}
              r={cellSize / 2.5} // Slightly smaller than full cell for "dot" look
              fill="#0f172a"
            />
          );
        }
      }
    }
    return modules;
  };

  const renderFinderPatterns = () => {
    const patterns: React.ReactNode[] = [];
    const positions = [
      { r: 0, c: 0 }, // Top Left
      { r: 0, c: moduleCount - 7 }, // Top Right
      { r: moduleCount - 7, c: 0 }, // Bottom Left
    ];

    positions.forEach((pos, index) => {
      const x = pos.c * cellSize;
      const y = pos.r * cellSize;
      const size7 = 7 * cellSize;

      // Outer Box (Rounded)
      patterns.push(
        <rect
          key={`fp-outer-${index}`}
          x={x + cellSize / 2}
          y={y + cellSize / 2}
          width={size7 - cellSize}
          height={size7 - cellSize}
          rx={cellSize * 2} // Rounded corners
          ry={cellSize * 2}
          fill="none"
          stroke="#0f172a"
          strokeWidth={cellSize}
        />
      );

      // Inner Dot (Rounded/Circle)
      patterns.push(
        <rect
          key={`fp-inner-${index}`}
          x={x + 2 * cellSize}
          y={y + 2 * cellSize}
          width={3 * cellSize}
          height={3 * cellSize}
          rx={cellSize} // Slightly rounded inner square
          ry={cellSize}
          fill="#0f172a"
        />
      );
    });

    return patterns;
  };

  return (
    <div className={cn("relative w-full h-auto aspect-square", className)} style={{ maxWidth: size }}>
      <svg 
        id="custom-qr-code-svg"
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <rect width={size} height={size} fill="white" />
        
        {/* Definition for circular clip path */}
        <defs>
          <clipPath id="logo-clip-path">
            <circle cx={size / 2} cy={size / 2} r={logoSize / 2} />
          </clipPath>
        </defs>

        {renderFinderPatterns()}
        {renderModules()}
        
        {/* Logo Overlay - Embedded in SVG for easier download */}
        {logoUrl && (
          <g>
            {/* White background for logo */}
            <circle 
              cx={size / 2} 
              cy={size / 2} 
              r={logoSize / 2 * 1.1} 
              fill="white" 
            />
            <image
              href={logoUrl}
              x={size / 2 - logoSize / 2}
              y={size / 2 - logoSize / 2}
              width={logoSize}
              height={logoSize}
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#logo-clip-path)"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
