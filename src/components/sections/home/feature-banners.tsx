import Image from 'next/image';

interface FeatureBannersProps {
  /** Up to two admin-supplied banner images (Django media URLs).
   *  Parent already filters out null/empty values — this component
   *  renders exactly what it's given, no placeholder fallbacks. */
  images: string[];
}

export function FeatureBanners({ images }: FeatureBannersProps) {
  if (images.length === 0) return null;
  const list = images.slice(0, 2);
  return (
    <section className="mx-auto max-w-[1120px] px-6 pt-[40px]">
      <div className="grid grid-cols-1 gap-[24px] sm:grid-cols-2">
        {list.map((src, i) => (
          <div key={`${src}-${i}`} className="relative aspect-[16/9] overflow-hidden rounded-[14px]">
            <Image src={src} alt="" fill className="object-cover" unoptimized />
          </div>
        ))}
      </div>
    </section>
  );
}
