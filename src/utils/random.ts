export type RandomGenerator = () => number;

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;

  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed: number): RandomGenerator {
  let a = seed >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeSeed(seed: string | number): number {
  if (typeof seed === 'number') {
    return seed >>> 0;
  }

  const seedFn = xmur3(seed);
  return seedFn();
}

export function createSeededRandom(seed: string | number): RandomGenerator {
  return mulberry32(normalizeSeed(seed));
}

export function getDailySeed(date: Date = new Date(), salt = ''): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return salt ? `${year}-${month}-${day}:${salt}` : `${year}-${month}-${day}`;
}

