import Image from 'next/image';

export function FeatureBanners() {
  const images = ['/images/home-about.png', '/images/category-luxury.png'];
  return (
    <section className="mx-auto max-w-[1120px] px-6 pt-[40px]">
      <div className="grid grid-cols-1 gap-[24px] sm:grid-cols-2">
        {images.map((src) => (
          <div key={src} className="relative aspect-[16/9] overflow-hidden rounded-[14px]">
            <Image src={src} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
