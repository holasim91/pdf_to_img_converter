import React from 'react'

interface DownloadIconProps {
  size?: number
  className?: string
}

export const DownloadIcon: React.FC<DownloadIconProps> = ({
  size = 32,
  className
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* ZIP File background */}
      <rect
        x="6"
        y="4"
        width="20"
        height="24"
        rx="2"
        fill="#7c3aed"
        fillOpacity="0.1"
        stroke="#7c3aed"
        strokeWidth="2"
      />

      {/* File corner fold */}
      <path
        d="M20 4 L20 8 L24 8"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* ZIP text */}
      <text
        x="16"
        y="14"
        fontSize="6"
        fontWeight="bold"
        fill="#7c3aed"
        textAnchor="middle"
      >
        ZIP
      </text>

      {/* Download arrow */}
      <path
        d="M16 18 L16 24"
        stroke="#059669"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M13 21 L16 24 L19 21"
        stroke="#059669"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Multiple files indicator (stack effect) */}
      <rect
        x="8"
        y="6"
        width="16"
        height="2"
        rx="1"
        fill="#7c3aed"
        fillOpacity="0.3"
      />
      <rect
        x="10"
        y="8"
        width="12"
        height="1"
        rx="0.5"
        fill="#7c3aed"
        fillOpacity="0.2"
      />

      {/* Download base */}
      <rect
        x="12"
        y="26"
        width="8"
        height="2"
        rx="1"
        fill="#059669"
        fillOpacity="0.2"
      />
    </svg>
  )
}