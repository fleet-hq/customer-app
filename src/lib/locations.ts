export function pickDefaultLocation<T extends { id: string | number }>(
  locations: T[],
  defaultLocationId?: string | number | null,
): T | undefined {
  return (
    locations.find((l) => String(l.id) === String(defaultLocationId)) ?? locations[0]
  );
}
