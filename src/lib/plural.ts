/** "1 photo", "3 photos"; irregular words pass their plural ("1 city", "2 cities"). */
export function plural(n: number, unit: string, pluralUnit = `${unit}s`): string {
  return `${n} ${n === 1 ? unit : pluralUnit}`;
}
