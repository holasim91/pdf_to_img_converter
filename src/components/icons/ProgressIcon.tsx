import React from 'react'

interface ProgressIconProps {
  size?: number
  progress?: number // 0-100
  className?: string
}

export const ProgressIcon: React.FC<ProgressIconProps> = ({
  size = 24,
  progress = 0,
  className
}) => {
  const center = size / 2
  const radius = (size - 4) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="2"
      />

      {/* Progress circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{
          transition: 'stroke-dashoffset 0.3s ease'
        }}
      />

      {/* Center content - gear icon for processing */}
      {progress > 0 && progress < 100 && (
        <g transform={`translate(${center - 4}, ${center - 4})`}>
          <path
            d="M4 1 L4 1.5 L3.5 1.5 L3.5 2.5 L3 2.5 L3 3.5 L2.5 3.5 L2.5 4.5 L2 4.5 L2 5.5 L1.5 5.5 L1.5 6.5 L1 6.5 L1 7 L7 7 L7 6.5 L6.5 6.5 L6.5 5.5 L6 5.5 L6 4.5 L5.5 4.5 L5.5 3.5 L5 3.5 L5 2.5 L4.5 2.5 L4.5 1.5 L4 1.5 Z"
            fill="#2563eb"
            opacity="0.6"
          />
          <circle cx="4" cy="4" r="1.5" fill="white" />
        </g>
      )}

      {/* Center content - checkmark for completed */}
      {progress >= 100 && (
        <path
          d={`M${center - 3} ${center} L${center - 1} ${center + 2} L${center + 3} ${center - 2}`}
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}

      {/* Center dot for no progress */}
      {progress === 0 && (
        <circle
          cx={center}
          cy={center}
          r="1.5"
          fill="#64748b"
        />
      )}
    </svg>
  )
}