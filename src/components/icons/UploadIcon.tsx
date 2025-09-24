import React from 'react'

interface UploadIconProps {
  size?: number
  className?: string
}

export const UploadIcon: React.FC<UploadIconProps> = ({
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
      {/* Dashed border box */}
      <rect
        x="2"
        y="8"
        width="28"
        height="20"
        rx="4"
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Upload arrow */}
      <path
        d="M16 12 L16 22"
        stroke="#2563eb"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 16 L16 12 L20 16"
        stroke="#2563eb"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Plus sign for adding files */}
      <circle
        cx="16"
        cy="6"
        r="4"
        fill="#10b981"
        stroke="white"
        strokeWidth="1"
      />
      <path
        d="M14 6 L18 6 M16 4 L16 8"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* File indicator dots */}
      <circle cx="8" cy="24" r="1" fill="#64748b" />
      <circle cx="12" cy="24" r="1" fill="#64748b" />
      <circle cx="20" cy="24" r="1" fill="#64748b" />
      <circle cx="24" cy="24" r="1" fill="#64748b" />
    </svg>
  )
}