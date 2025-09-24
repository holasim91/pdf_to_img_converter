import React from 'react'

interface PdfToImageLogoProps {
  size?: number
  className?: string
}

export const PdfToImageLogo: React.FC<PdfToImageLogoProps> = ({
  size = 48,
  className
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* PDF Document */}
      <rect
        x="4"
        y="6"
        width="16"
        height="20"
        rx="2"
        fill="#ef4444"
        fillOpacity="0.1"
        stroke="#ef4444"
        strokeWidth="2"
      />
      <text
        x="12"
        y="18"
        fontSize="6"
        fontWeight="bold"
        fill="#ef4444"
        textAnchor="middle"
      >
        PDF
      </text>

      {/* Arrow */}
      <path
        d="M22 15 L26 15 L24 13 M26 15 L24 17"
        stroke="#2563eb"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Image Stack */}
      <rect
        x="30"
        y="8"
        width="14"
        height="10"
        rx="1"
        fill="#10b981"
        fillOpacity="0.1"
        stroke="#10b981"
        strokeWidth="2"
      />
      <rect
        x="28"
        y="10"
        width="14"
        height="10"
        rx="1"
        fill="#10b981"
        fillOpacity="0.2"
        stroke="#10b981"
        strokeWidth="2"
      />
      <rect
        x="26"
        y="12"
        width="14"
        height="10"
        rx="1"
        fill="#10b981"
        fillOpacity="0.3"
        stroke="#10b981"
        strokeWidth="2"
      />

      {/* Image icon inside front rect */}
      <circle cx="32" cy="16" r="1.5" fill="#10b981" />
      <path
        d="M29 20 L31 18 L33 20 L37 16 L39 18"
        stroke="#10b981"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Conversion text */}
      <text
        x="24"
        y="36"
        fontSize="8"
        fontWeight="600"
        fill="#475569"
        textAnchor="middle"
      >
        CONVERT
      </text>
    </svg>
  )
}