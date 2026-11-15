"use client";

import React, { useId } from 'react';

export interface PatternProps {
  /** Tema warna background: 'dark' (default) atau 'light' */
  variant?: 'dark' | 'light';
  /** Mengaktifkan efek pudar (vignette) di tepi layar. Default: true */
  withVignette?: boolean;
  /** Mengaktifkan efek cahaya ambient (glow). Default: true */
  withGlow?: boolean;
  /** Custom class untuk wrapper */
  className?: string;
}

export const Pattern: React.FC<PatternProps> = ({
  variant = 'dark',
  withVignette = true,
  withGlow = true,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const microGridId = `bcc-micro-${uid}`;
  const macroGridId = `bcc-macro-${uid}`;
  const traceGradBlue = `bcc-trace-blue-${uid}`;
  const traceGradOrange = `bcc-trace-orange-${uid}`;

  const isDark = variant === 'dark';

  // Palette Tokens
  const bgClass = isDark ? 'bg-[#040B16]' : 'bg-[#F8FAFC]';
  const microStroke = isDark ? 'rgba(0, 210, 255, 0.035)' : 'rgba(2, 40, 115, 0.03)';
  const macroStroke = isDark ? 'rgba(0, 136, 255, 0.08)' : 'rgba(0, 102, 204, 0.06)';
  const crosshairColor = isDark ? 'rgba(0, 210, 255, 0.22)' : 'rgba(0, 102, 204, 0.18)';

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${bgClass} ${className}`}
      aria-hidden="true"
    >
      {/* 1. Ambient Mesh & Top Spotlight */}
      {withGlow && (
        <>
          {/* Main Top-Center Spotlight (Illuminates Logo & Auth Card) */}
          <div
            className="absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse at center, rgba(0, 114, 255, 0.18) 0%, rgba(0, 210, 255, 0.05) 45%, transparent 75%)'
                : 'radial-gradient(ellipse at center, rgba(0, 136, 255, 0.11) 0%, rgba(0, 210, 255, 0.04) 45%, transparent 75%)',
            }}
          />
          {/* Bottom-Right Warm BCC Orange Glow */}
          <div
            className="absolute -right-32 -bottom-32 h-[420px] w-[420px] rounded-full blur-3xl"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(255, 107, 0, 0.11) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(255, 107, 0, 0.07) 0%, transparent 70%)',
            }}
          />
          {/* Bottom-Left Deep Blue Balance Glow */}
          <div
            className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full blur-3xl"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(2, 40, 115, 0.25) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(0, 102, 204, 0.07) 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {/* 2. Architectural Blueprint Grid (Micro + Macro + Crosshairs) */}
      <svg
        className={`absolute inset-0 h-full w-full ${
          withVignette
            ? '[mask-image:radial-gradient(ellipse_85%_80%_at_50%_45%,black_35%,transparent_95%)]'
            : ''
        }`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 32px Micro Sub-Grid */}
          <pattern
            id={microGridId}
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke={microStroke}
              strokeWidth="1"
            />
          </pattern>

          {/* 160px Macro Structural Grid with Registration Crosshairs */}
          <pattern
            id={macroGridId}
            width="160"
            height="160"
            patternUnits="userSpaceOnUse"
          >
            <rect width="160" height="160" fill={`url(#${microGridId})`} />
            <path
              d="M 160 0 L 0 0 0 160"
              fill="none"
              stroke={macroStroke}
              strokeWidth="1"
            />
            {/* Corner Crosshair (+) */}
            <path
              d="M -4 0 L 4 0 M 0 -4 L 0 4"
              stroke={crosshairColor}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Mid-Tile Subtle Dot */}
            <circle cx="80" cy="80" r="1" fill={crosshairColor} />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill={`url(#${macroGridId})`} />
      </svg>

      {/* 3. Non-Repeating Full-Canvas Circuit Flows & Brand Watermarks */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={traceGradBlue} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D2FF" stopOpacity="0" />
            <stop
              offset="50%"
              stopColor={isDark ? '#00D2FF' : '#0066CC'}
              stopOpacity={isDark ? '0.32' : '0.2'}
            />
            <stop offset="100%" stopColor="#0066CC" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={traceGradOrange} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B00" stopOpacity="0" />
            <stop
              offset="60%"
              stopColor="#FF6B00"
              stopOpacity={isDark ? '0.35' : '0.24'}
            />
            <stop offset="100%" stopColor="#FFA000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Left-Wing Telemetry Circuit */}
        <path
          d="M -40 240 H 180 L 240 300 H 410"
          stroke={`url(#${traceGradBlue})`}
          strokeWidth="1.5"
        />
        <circle
          cx="240"
          cy="300"
          r="3"
          fill={isDark ? '#00D2FF' : '#0066CC'}
          fillOpacity={isDark ? '0.4' : '0.25'}
        />
        <circle
          cx="410"
          cy="300"
          r="2"
          fill="#FF6B00"
          fillOpacity={isDark ? '0.5' : '0.35'}
        />

        {/* Lower-Left Secondary Trace */}
        <path
          d="M 80 940 V 720 L 160 640 H 320"
          stroke={`url(#${traceGradOrange})`}
          strokeWidth="1.5"
        />
        <circle
          cx="160"
          cy="640"
          r="2.5"
          fill="#FF6B00"
          fillOpacity={isDark ? '0.4' : '0.3'}
        />

        {/* Right-Wing Event Flow Circuit */}
        <path
          d="M 1480 620 H 1220 L 1150 550 H 980"
          stroke={`url(#${traceGradBlue})`}
          strokeWidth="1.5"
        />
        <circle
          cx="1150"
          cy="550"
          r="3"
          fill={isDark ? '#00D2FF' : '#0066CC'}
          fillOpacity={isDark ? '0.4' : '0.25'}
        />

        {/* Upper-Right Operational Trace */}
        <path
          d="M 1060 -20 V 140 L 1140 220 H 1360"
          stroke={`url(#${traceGradOrange})`}
          strokeWidth="1.5"
        />
        <circle
          cx="1140"
          cy="220"
          r="2.5"
          fill="#FF6B00"
          fillOpacity={isDark ? '0.45' : '0.3'}
        />

        {/* Large Subtle BCC Double-Chevron Watermark (Left) */}
        <g
          opacity={isDark ? '0.045' : '0.035'}
          stroke={isDark ? '#00D2FF' : '#0066CC'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 130 410 L 175 455 L 130 500" />
          <path d="M 160 410 L 205 455 L 160 500" />
        </g>

        {/* Large Subtle BCC Check-Node Watermark (Right) */}
        <g
          opacity={isDark ? '0.05' : '0.04'}
          stroke="#FF6B00"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 1250 360 L 1270 380 L 1315 330" />
        </g>
      </svg>
    </div>
  );
};