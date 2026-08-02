import * as React from "react";

/**
 * IBYS mark — Architectural Perspective.
 *
 * A deep-teal rounded plate with an abstract gold structural mark:
 * a vertical pillar (the "I"), a frame-in-perspective (the sightline),
 * a translucent inner aperture, and a gilded blueprint datum line.
 * Subtle gold blueprint dot pattern adds craftsmanship at large sizes.
 */
export function IbysLogo({
  className,
  size = 44,
  title = "IBYS",
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  const uid = React.useId().replace(/:/g, "");
  const dotId = `ibys-dots-${uid}`;
  const clipId = `ibys-clip-${uid}`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={dotId} x="0" y="0" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#D9A441" />
        </pattern>
        <clipPath id={clipId}>
          <rect x="2" y="2" width="96" height="96" rx="22" />
        </clipPath>
      </defs>

      {/* Plate */}
      <rect x="2" y="2" width="96" height="96" rx="22" fill="#0F4C5C" />

      {/* Subtle blueprint dot pattern */}
      <g clipPath={`url(#${clipId})`} opacity="0.1">
        <rect x="2" y="2" width="96" height="96" fill={`url(#${dotId})`} />
      </g>

      {/* Vertical Pillar (the 'I') */}
      <rect x="22" y="25" width="8" height="50" fill="#D9A441" />

      {/* Structural Frame (the sightline) */}
      <path d="M42 25H78V33H50V67H78V75H42V25Z" fill="#D9A441" />

      {/* Perspective Accent */}
      <path d="M58 42H70V58H58V42Z" fill="#D9A441" fillOpacity="0.4" />

      {/* Bottom Blueprint / Datum Line */}
      <rect x="22" y="82" width="56" height="2" fill="#D9A441" fillOpacity="0.6" />
    </svg>
  );
}
