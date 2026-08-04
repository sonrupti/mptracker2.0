import React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export default function AttendanceGauge({ value }: { value: number }) {
  const radius = 56;
  const stroke = 12;
  const normalized = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * radius;

  const x = useMotionValue(0);
  const dash = useTransform(x, v => `${circumference - (v / 100) * circumference}`);
  // animate x to normalized
  React.useEffect(() => {
    const controls = animate(x, normalized, { duration: 1 });
    return () => controls.stop();
  }, [normalized, x]);

  const color = normalized >= 85 ? '#10b981' : normalized >= 70 ? '#f59e0b' : normalized >= 50 ? '#f97316' : '#ef4444';
  const label = normalized >= 85 ? 'Excellent' : normalized >= 70 ? 'Good' : normalized >= 50 ? 'Average' : 'Needs Improvement';

  return (
    <div className="flex items-center gap-4">
      <svg width={150} height={150} viewBox="0 0 160 160">
        <g transform="translate(80,80)">
          <circle r={radius} stroke="#0b0b0c" strokeWidth={stroke} fill="none" />
          <motion.circle r={radius} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset: dash }} transform="rotate(-90)" />
          <text x="0" y="6" textAnchor="middle" fontSize="22" fill="#e6e7eb" fontWeight={700}>{value}%</text>
        </g>
      </svg>
      <div>
        <p className="text-sm font-bold text-foreground">Performance</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
