
import React, { useEffect, useState } from 'react';
import { sha256 } from '../utils/crypto';

interface VisualFingerprintProps {
  address: string;
  size?: number;
}

const VisualFingerprint: React.FC<VisualFingerprintProps> = ({ address, size = 8 }) => {
  const [grid, setGrid] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateGrid = async () => {
      setLoading(true);
      const hash = await sha256(address);
      const newGrid: number[][] = [];
      
      // We use the hash to populate an 8x8 grid (64 hex characters in SHA-256)
      for (let i = 0; i < size; i++) {
        const row: number[] = [];
        for (let j = 0; j < size; j++) {
          const charIndex = (i * size + j) % hash.length;
          const val = parseInt(hash[charIndex], 16);
          row.push(val);
        }
        newGrid.push(row);
      }
      
      setGrid(newGrid);
      setLoading(false);
    };

    if (address) {
      generateGrid();
    }
  }, [address, size]);

  const getColor = (val: number) => {
    // Return a Tailwind-like color class or hex based on value
    const colors = [
      '#ef4444', // red
      '#22c55e', // green
      '#eab308', // yellow
      '#3b82f6', // blue
      '#a855f7', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
    ];
    return colors[val % colors.length];
  };

  if (loading || !address) {
    return (
      <div className="w-48 h-48 bg-slate-800 animate-pulse rounded-xl flex items-center justify-center">
        <span className="text-slate-500 text-sm">Generating...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div 
        className="grid gap-1 p-2 bg-slate-900 rounded-xl shadow-2xl border border-slate-700"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.flat().map((val, idx) => (
          <div 
            key={idx}
            className="w-4 h-4 md:w-5 md:h-5 rounded-sm transition-all duration-500"
            style={{ 
              backgroundColor: getColor(val),
              opacity: (val % 4 === 0) ? 0.4 : 1,
              transform: `scale(${val % 2 === 0 ? 1 : 0.85})`
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Unique Fingerprint</p>
    </div>
  );
};

export default VisualFingerprint;
