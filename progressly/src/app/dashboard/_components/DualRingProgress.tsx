/**
 * DualRingProgress Component
 * Two concentric rings showing Consistency (inner) and Diligence (outer)
 */

'use client';

interface DualRingProgressProps {
  consistencyRate: number;  // 0-100
  diligenceRate: number;    // 0-100
  size?: number;            // Diameter in pixels
  strokeWidth?: number;
}

export function DualRingProgress({ 
  consistencyRate, 
  diligenceRate, 
  size = 150, 
  strokeWidth = 12 
}: DualRingProgressProps) {
  const center = size / 2;
  
  // Inner ring (consistency - blue)
  const innerRadius = (size - strokeWidth * 3) / 2;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const innerOffset = innerCircumference - (consistencyRate / 100) * innerCircumference;
  
  // Outer ring (diligence - green)
  const outerRadius = (size - strokeWidth) / 2;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const outerOffset = outerCircumference - (diligenceRate / 100) * outerCircumference;
  
  // Average for center display
  const average = Math.round((consistencyRate + diligenceRate) / 2);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circles */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        
        {/* Inner ring (consistency - blue) */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={strokeWidth}
          strokeDasharray={innerCircumference}
          strokeDashoffset={innerOffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Outer ring (diligence - green) */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="#10B981"
          strokeWidth={strokeWidth}
          strokeDasharray={outerCircumference}
          strokeDashoffset={outerOffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Center text */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-foreground transform rotate-90"
          style={{ transformOrigin: `${center}px ${center}px` }}
        >
          {average}%
        </text>
      </svg>
      
      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Consistency: {consistencyRate}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Diligence: {diligenceRate}%</span>
        </div>
      </div>
    </div>
  );
}
