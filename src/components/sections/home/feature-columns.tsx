interface FeatureColumn {
  title: string;
  description: string;
}

export function FeatureColumns({ items }: { items: FeatureColumn[] }) {
  return (
    <section className="mx-auto max-w-[1120px] px-6 pt-[56px] pb-[32px]">
      <div className="grid grid-cols-1 gap-x-[56px] gap-y-[40px] sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.title}>
            <h3 className="mb-[8px] text-[16px] font-semibold text-ink-2">{item.title}</h3>
            <p className="text-[12px] leading-[1.6] font-light text-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
