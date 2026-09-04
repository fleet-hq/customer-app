'use client';

import { useState } from 'react';

interface HeroImageProps {
  src: string;
  className?: string;
}

export function HeroImage({ src, className = '' }: HeroImageProps) {
  const [tall, setTall] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth && img.naturalHeight) {
          setTall(img.naturalHeight / img.naturalWidth > 0.67);
        }
      }}
      className={`block w-full ${tall ? 'max-h-[88svh] object-contain' : 'h-auto'} ${className}`}
    />
  );
}
